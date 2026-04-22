import { getWorkerConfig } from "@birthub/config";
import {
  ExecutionSource,
  prisma
} from "@birthub/database";
import { createLogger } from "@birthub/logger";
import type { Queue } from "bullmq";
import type { Redis } from "ioredis";

import { executeManifestAgentRuntime } from "./agents/runtime.orchestration.js";
import { executeTenantJob } from "./tenant-execution.js";
import {
  persistExecutionFinished,
  persistExecutionStarted
} from "./worker.execution-state.js";
import {
  agentExecutionJobSchema,
  hashPayload,
  legacyTaskJobSchema,
  validateLegacyTaskJob
} from "./worker.job-validation.js";
import { fanOutExecutionOutcome } from "./worker.notifications.js";
import type { EmailNotificationJobPayload } from "./notifications/emailQueue.js";
import type { OutboundWebhookJobPayload } from "./webhooks/outbound.js";

const logger = createLogger("worker");

type WorkerProcessorInput = {
  config: ReturnType<typeof getWorkerConfig>;
  connection: Redis;
  emailQueue: Queue<EmailNotificationJobPayload>;
  outboundWebhookQueue: Queue<OutboundWebhookJobPayload>;
  resolveBillingLock: (
    tenantReference: string
  ) => Promise<{ locked: boolean; status: string | null }>;
};

type WorkerQueueJob = {
  id?: string | number;
  data: unknown;
  queueName: string;
};

type JobExecutionPayload = {
  agentId: string;
  approvalRequired: boolean;
  catalogAgentId: string | null;
  executionId: string;
  executionMode: "DRY_RUN" | "LIVE";
  input: Record<string, unknown>;
  organizationId: string | null;
  requestId: string;
  source: ExecutionSource;
  tenantId: string;
  userId: string | null;
};

export async function resolveOrganizationReference(tenantReference: string): Promise<{ id: string; tenantId: string } | null> {
  return prisma.organization.findFirst({
    where: {
      OR: [{ id: tenantReference }, { tenantId: tenantReference }]
    }
  });
}

function buildScopedExecutionContext(payload: JobExecutionPayload) {
  return {
    requestId: payload.requestId,
    tenantId: payload.tenantId,
    userId: payload.userId ?? payload.agentId
  };
}

async function resolveTenantSigningSecret(tenantId: string): Promise<string | null> {
  const tenantSecret = await prisma.jobSigningSecret.findFirst({
    where: {
      tenantId
    }
  });

  return tenantSecret?.secret ?? null;
}

async function resolveLegacyExecutionPayload(
  input: WorkerProcessorInput,
  jobId: string,
  data: unknown
): Promise<JobExecutionPayload> {
  const payload = legacyTaskJobSchema.parse(data);
  const organization = await resolveOrganizationReference(payload.tenantId ?? "default-tenant");
  const tenantSecret = organization
    ? await resolveTenantSigningSecret(organization.tenantId)
    : null;
  const tenantId = validateLegacyTaskJob({
    fallbackSecret: input.config.JOB_HMAC_GLOBAL_SECRET,
    jobId,
    payload,
    ...(tenantSecret ? { tenantSecret } : {})
  });

  return {
    agentId: payload.type,
    approvalRequired: payload.approvalRequired,
    catalogAgentId: null,
    executionId: `${payload.requestId}:${jobId}`,
    executionMode: payload.executionMode,
    input: payload.payload,
    organizationId: organization?.id ?? null,
    requestId: payload.requestId,
    source: ExecutionSource.MANUAL,
    tenantId,
    userId: payload.userId ?? null
  };
}

async function resolveAgentExecutionPayload(data: unknown): Promise<JobExecutionPayload> {
  const payload = agentExecutionJobSchema.parse(data);
  const organization = payload.organizationId
    ? await resolveOrganizationReference(payload.organizationId)
    : await resolveOrganizationReference(payload.tenantId);

  return {
    ...payload,
    approvalRequired: false,
    catalogAgentId: payload.catalogAgentId ?? null,
    executionMode: "LIVE",
    organizationId: organization?.id ?? payload.organizationId ?? null,
    requestId: payload.executionId,
    source: ExecutionSource.MANUAL,
    userId: payload.userId ?? null
  };
}

async function resolveExecutionPayload(
  input: WorkerProcessorInput,
  job: WorkerQueueJob,
  jobId: string
): Promise<JobExecutionPayload> {
  if (job.queueName === input.config.QUEUE_NAME) {
    return resolveLegacyExecutionPayload(input, jobId, job.data);
  }

  return resolveAgentExecutionPayload(job.data);
}

async function persistStartedExecution(payload: JobExecutionPayload): Promise<void> {
  await persistExecutionStarted({
    agentId: payload.agentId,
    executionId: payload.executionId,
    inputPayload: payload.input,
    organizationId: payload.organizationId,
    source: payload.source,
    tenantId: payload.tenantId,
    userId: payload.userId
  });
}

async function persistFailedExecution(
  input: WorkerProcessorInput,
  payload: JobExecutionPayload,
  message: string
): Promise<void> {
  await persistExecutionFinished({
    errorMessage: message,
    executionId: payload.executionId,
    status: "FAILED"
  });

  await fanOutExecutionOutcome({
    agentId: payload.agentId,
    emailQueue: input.emailQueue,
    errorMessage: message,
    executionId: payload.executionId,
    organizationId: payload.organizationId,
    outboundWebhookQueue: input.outboundWebhookQueue,
    status: "FAILED",
    tenantId: payload.tenantId,
    userId: payload.userId,
    webBaseUrl: input.config.WEB_BASE_URL
  });
}

async function handleBillingLockedExecution(
  input: WorkerProcessorInput,
  payload: JobExecutionPayload
) {
  const billing = await input.resolveBillingLock(payload.tenantId);

  if (!billing.locked) {
    return null;
  }

  logger.warn(
    {
      executionId: payload.executionId,
      status: billing.status,
      tenantId: payload.tenantId
    },
    "Worker aborted execution due to billing lock"
  );

  await persistFailedExecution(input, payload, "billing_past_due");

  return {
    blocked: true,
    blockedAt: new Date().toISOString(),
    reason: "billing_past_due"
  };
}

function buildExecutionResult(input: {
  executionId: string;
  outputHash: string;
  requestId: string;
  status?: "COMPLETED" | "WAITING_APPROVAL";
}) {
  return {
    completedAt: new Date().toISOString(),
    executionId: input.executionId,
    outputHash: input.outputHash,
    requestId: input.requestId,
    ...(input.status ? { status: input.status } : {})
  };
}

async function handleDryRunExecution(payload: JobExecutionPayload) {
  const output = {
    logs: ["Simulating LLM call...", "Returning MOCK_DATA"],
    mode: payload.executionMode
  };
  const outputHash = hashPayload(JSON.stringify(output));

  await persistExecutionFinished({
    executionId: payload.executionId,
    metadata: {
      dryRun: true
    },
    output,
    outputHash,
    status: "SUCCESS"
  });

  return buildExecutionResult({
    executionId: payload.executionId,
    outputHash,
    requestId: payload.requestId,
    status: "COMPLETED"
  });
}

async function handleApprovalRequiredExecution(payload: JobExecutionPayload) {
  const output = {
    message: "Awaiting human approval before final output."
  };
  const outputHash = hashPayload(JSON.stringify(output));

  await persistExecutionFinished({
    executionId: payload.executionId,
    output,
    outputHash,
    status: "WAITING_APPROVAL"
  });

  return buildExecutionResult({
    executionId: payload.executionId,
    outputHash,
    requestId: payload.requestId,
    status: "WAITING_APPROVAL"
  });
}

function logJobStarted(job: WorkerQueueJob, payload: JobExecutionPayload): void {
  logger.info(
    {
      executionId: payload.executionId,
      jobId: job.id,
      queue: job.queueName
    },
    "Worker started job"
  );
}

async function handleLiveExecution(
  input: WorkerProcessorInput,
  job: WorkerQueueJob,
  payload: JobExecutionPayload
) {
  // O Loop de Retorno (Fechando o Ciclo)
  // Como orquestramos o Agent Runtime no Handoff, aqui ele é capturado da fila e executado:
  const runtimeResult = await executeManifestAgentRuntime({
    agentId: payload.agentId,
    catalogAgentId: payload.catalogAgentId,
    executionId: payload.executionId,
    input: payload.input,
    organizationId: payload.organizationId,
    redis: input.connection,
    source: "MANUAL",
    tenantId: payload.tenantId,
    userId: payload.userId
  });

  await persistExecutionFinished({
    executionId: payload.executionId,
    metadata: runtimeResult.metadata,
    output: runtimeResult.output,
    outputHash: runtimeResult.outputHash,
    status: runtimeResult.status
  });

  await fanOutExecutionOutcome({
    agentId: payload.agentId,
    emailQueue: input.emailQueue,
    executionId: payload.executionId,
    organizationId: payload.organizationId,
    outboundWebhookQueue: input.outboundWebhookQueue,
    status: runtimeResult.status,
    tenantId: payload.tenantId,
    userId: payload.userId,
    webBaseUrl: input.config.WEB_BASE_URL
  });

  logger.info(
    {
      executionId: payload.executionId,
      jobId: job.id,
      steps: (runtimeResult.metadata.steps as number | undefined) ?? 0
    },
    "Worker finished job"
  );

  return {
    completedAt: new Date().toISOString(),
    executionId: payload.executionId,
    outputHash: runtimeResult.outputHash,
    requestId: payload.requestId
  };
}

async function executeResolvedJob(
  input: WorkerProcessorInput,
  job: WorkerQueueJob,
  payload: JobExecutionPayload
) {
  const billingBlock = await handleBillingLockedExecution(input, payload);

  if (billingBlock) {
    return billingBlock;
  }

  logJobStarted(job, payload);

  if (payload.executionMode === "DRY_RUN") {
    return handleDryRunExecution(payload);
  }

  if (payload.approvalRequired) {
    return handleApprovalRequiredExecution(payload);
  }

  return handleLiveExecution(input, job, payload);
}

async function processResolvedJob(
  input: WorkerProcessorInput,
  job: WorkerQueueJob,
  payload: JobExecutionPayload
) {
  try {
    return await executeResolvedJob(input, job, payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown agent execution failure";

    await persistFailedExecution(input, payload, message);
    throw error;
  }
}

async function processJob(
  input: WorkerProcessorInput,
  job: WorkerQueueJob
) {
  const jobId = String(job.id ?? "unknown");
  const payload = await resolveExecutionPayload(input, job, jobId);

  await persistStartedExecution(payload);

  return executeTenantJob(buildScopedExecutionContext(payload), async () =>
    processResolvedJob(input, job, payload)
  );
}

export function createJobProcessor(input: WorkerProcessorInput) {
  return async (job: WorkerQueueJob) => processJob(input, job);
}

