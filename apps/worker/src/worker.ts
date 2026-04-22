//
import { getWorkerConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import { incrementCounter, observeHistogram } from "@birthub/logger";
import {
  ENGAGEMENT_QUEUE_NAMES,
  QueueRuntime,
  WORKFLOW_QUEUE_NAMES,
  getAgentQueueName
} from "@birthub/queue";
import type { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { persistAgentHandoff } from "./agents/handoffs.js";
import { initializeAgentMeshIngressBridge } from "./agents/runtime.ingress.js";
import { executeManifestAgentRuntime } from "./agents/runtime.orchestration.js";
import {
  WorkflowRunner,
  type WorkflowExecutionJobPayload,
  type WorkflowTriggerJobPayload
} from "./engine/runner.js";
import {
  processConnectorEventJob,
  type ConnectorEventJobPayload
} from "./integrations/connector-events.js";
import { executeWorkflowConnectorAction } from "./integrations/workflow-connectors.js";
import { syncOrganizationToHubspot } from "./integrations/hubspot.js";
import { DynamicRateLimiter } from "./lib/rate-limiter.js";
import {
  processEmailNotificationJob,
  type EmailNotificationJobPayload
} from "./notifications/emailQueue.js";
import { buildRetryableQueueConfig } from "./queues/workerFactory.js";
import {
  processOutboundWebhookJob,
  type OutboundWebhookJobPayload
} from "./webhooks/outbound.js";
import { createBillingLockResolver } from "./worker.billing.js";
import {
  persistExecutionFinished,
  persistExecutionStarted
} from "./worker.execution-state.js";
import type { CrmSyncJobPayload } from "./worker.job-validation.js";
import { createJobProcessor, resolveOrganizationReference } from "./worker.process-job.js";

export { validateLegacyTaskJob } from "./worker.job-validation.js";

const logger = createLogger("worker");

export interface WorkerRuntime {
  close: () => Promise<void>;
  connection: Redis;
  dlqQueues: Queue[];
  queues: Queue[];
  runtime: QueueRuntime;
  workers: Worker[];
}

function recordWorkerJobMetric(input: {
  queue: string;
  status: "completed" | "failed";
  startedAt?: number;
  finishedAt?: number;
}): void {
  incrementCounter(
    "birthub_worker_jobs_total",
    {
      queue: input.queue,
      status: input.status
    },
    1,
    "Total processed worker jobs grouped by queue and status."
  );

  if (
    typeof input.startedAt === "number" &&
    Number.isFinite(input.startedAt) &&
    typeof input.finishedAt === "number" &&
    Number.isFinite(input.finishedAt) &&
    input.finishedAt >= input.startedAt
  ) {
    observeHistogram(
      "birthub_worker_job_duration_ms",
      input.finishedAt - input.startedAt,
      {
        queue: input.queue,
        status: input.status
      },
      {
        help: "Worker job processing duration in milliseconds grouped by queue and status."
      }
    );
  }
}

export function createBirthHubWorker(): WorkerRuntime {
  const config = getWorkerConfig();
  const runtime = new QueueRuntime({ redisUrl: config.REDIS_URL });
  const connection = runtime.redis;

  const legacyTaskQueueConfig = buildRetryableQueueConfig({
    attempts: 5,
    backoffDelay: 1_000,
    concurrency: config.WORKER_CONCURRENCY,
    name: config.QUEUE_NAME,
    removeOnCompleteCount: 500,
    removeOnFailCount: 1_000
  });
  const workflowExecutionQueueConfig = buildRetryableQueueConfig({
    attempts: 5,
    backoffDelay: 1_000,
    concurrency: config.WORKER_CONCURRENCY,
    name: WORKFLOW_QUEUE_NAMES.execution,
    removeOnCompleteCount: 500,
    removeOnFailCount: 500
  });
  const workflowTriggerQueueConfig = buildRetryableQueueConfig({
    attempts: 5,
    backoffDelay: 1_000,
    concurrency: config.WORKER_CONCURRENCY,
    name: WORKFLOW_QUEUE_NAMES.trigger,
    removeOnCompleteCount: 500,
    removeOnFailCount: 500
  });
  const emailQueueConfig = buildRetryableQueueConfig({
    attempts: 3,
    backoffDelay: 1_000,
    concurrency: Math.max(1, Math.floor(config.WORKER_CONCURRENCY / 2)),
    name: ENGAGEMENT_QUEUE_NAMES.email,
    removeOnCompleteCount: 200,
    removeOnFailCount: 200
  });
  const outboundWebhookQueueConfig = buildRetryableQueueConfig({
    attempts: 5,
    backoffDelay: 1_500,
    concurrency: config.WORKER_CONCURRENCY,
    name: ENGAGEMENT_QUEUE_NAMES.outboundWebhook,
    removeOnCompleteCount: 300,
    removeOnFailCount: 300
  });
  const crmSyncQueueConfig = buildRetryableQueueConfig({
    attempts: 5,
    backoffDelay: 2_000,
    concurrency: Math.max(1, Math.floor(config.WORKER_CONCURRENCY / 2)),
    name: ENGAGEMENT_QUEUE_NAMES.crmSync,
    removeOnCompleteCount: 200,
    removeOnFailCount: 400
  });
  const connectorEventsQueueConfig = buildRetryableQueueConfig({
    attempts: 5,
    backoffDelay: 1_500,
    concurrency: Math.max(1, Math.floor(config.WORKER_CONCURRENCY / 2)),
    name: ENGAGEMENT_QUEUE_NAMES.connectorEvents,
    removeOnCompleteCount: 200,
    removeOnFailCount: 300
  });

  const workflowExecutionQueue = runtime.createQueue<WorkflowExecutionJobPayload>(
    workflowExecutionQueueConfig
  );
  const emailQueue = runtime.createQueue<EmailNotificationJobPayload>(emailQueueConfig);
  const outboundWebhookQueue = runtime.createQueue<OutboundWebhookJobPayload>(
    outboundWebhookQueueConfig
  );
  const dynamicRateLimiter = new DynamicRateLimiter(connection);
  const workflowRunner = new WorkflowRunner(workflowExecutionQueue, {
    httpRequestRateLimiter: dynamicRateLimiter,
    agentExecutor: {
      execute: async ({ agentId, contextSummary, input }) => {
        const tenantId = (input.tenantId as string | undefined) ?? "default-tenant";
        const organization = await resolveOrganizationReference(tenantId);
        const executionId = `workflow-agent:${Date.now()}:${agentId}`;

        await persistExecutionStarted({
          agentId,
          executionId,
          inputPayload: {
            ...input,
            workflowContextSummary: contextSummary
          },
          organizationId: organization?.id ?? null,
          source: "WORKFLOW",
          tenantId,
          userId: null
        });

        try {
          const runtimeResult = await executeManifestAgentRuntime({
            agentId,
            catalogAgentId: agentId,
            contextSummary,
            executionId,
            input: {
              ...input,
              workflowContextSummary: contextSummary
            },
            organizationId: organization?.id ?? null,
            redis: connection,
            source: "WORKFLOW",
            tenantId,
            userId: null
          });

          await persistExecutionFinished({
            executionId,
            metadata: runtimeResult.metadata,
            output: runtimeResult.output,
            outputHash: runtimeResult.outputHash,
            status: runtimeResult.status,
            tenantId
          });

          return runtimeResult.output;
        } catch (error) {
          await persistExecutionFinished({
            errorMessage: error instanceof Error ? error.message : "Workflow agent execution failed",
            executionId,
            status: "FAILED",
            tenantId
          });
          throw error;
        }
      }
    },
    connectorExecutor: {
      execute: async ({ action, executionId, tenantId, workflowId }) =>
        executeWorkflowConnectorAction({
          action,
          executionId,
          tenantId,
          workflowId
        })
    },
    handoffExecutor: {
      execute: async (args) =>
        persistAgentHandoff({
          context: args.context,
          contextSummary: args.contextSummary,
          correlationId: args.correlationId,
          executionId: args.executionId,
          sourceAgentId: args.sourceAgentId,
          summary: args.summary,
          targetAgentId: args.targetAgentId,
          tenantId: args.tenantId,
          ...(args.threadId ? { threadId: args.threadId } : {}),
          workflowId: args.workflowId
        })
    },
    notificationDispatcher: {
      send: async (message) => {
        logger.info({ message }, "Workflow notification dispatched");
        return Promise.resolve();
      }
    }
  });

  const resolveBillingLock = createBillingLockResolver({
    billingGracePeriodDays: config.BILLING_GRACE_PERIOD_DAYS,
    billingStatusCacheTtlSeconds: config.BILLING_STATUS_CACHE_TTL_SECONDS,
    connection
  });
  const processJob = createJobProcessor({
    config,
    connection,
    emailQueue,
    outboundWebhookQueue,
    resolveBillingLock
  });

  const taskQueueConfigs = [
    legacyTaskQueueConfig,
    buildRetryableQueueConfig({
      attempts: 5,
      backoffDelay: 1_000,
      concurrency: config.WORKER_CONCURRENCY,
      name: getAgentQueueName("high"),
      removeOnCompleteCount: 500,
      removeOnFailCount: 1_000
    }),
    buildRetryableQueueConfig({
      attempts: 5,
      backoffDelay: 1_000,
      concurrency: config.WORKER_CONCURRENCY,
      name: getAgentQueueName("normal"),
      removeOnCompleteCount: 500,
      removeOnFailCount: 1_000
    }),
    buildRetryableQueueConfig({
      attempts: 5,
      backoffDelay: 1_000,
      concurrency: config.WORKER_CONCURRENCY,
      name: getAgentQueueName("low"),
      removeOnCompleteCount: 500,
      removeOnFailCount: 1_000
    })
  ];

  taskQueueConfigs.forEach((queueConfig) => {
    runtime.createWorker(queueConfig, async (data, ctx) =>
      processJob({
        data,
        id: ctx.jobId,
        queueName: queueConfig.name
      })
    );
  });

  runtime.createWorker(workflowExecutionQueueConfig, async (data) =>
    workflowRunner.processExecutionJob(data as WorkflowExecutionJobPayload)
  );
  runtime.createWorker(workflowTriggerQueueConfig, async (data) =>
    workflowRunner.processTriggerJob(data as WorkflowTriggerJobPayload)
  );
  runtime.createWorker(emailQueueConfig, async (data) =>
    processEmailNotificationJob(data as EmailNotificationJobPayload)
  );
  runtime.createWorker(outboundWebhookQueueConfig, async (data) =>
    processOutboundWebhookJob(data as OutboundWebhookJobPayload, { redis: connection })
  );
  runtime.createWorker(crmSyncQueueConfig, async (data) => {
    const payload = data as CrmSyncJobPayload;
    await syncOrganizationToHubspot({
      organizationId: payload.organizationId,
      tenantId: payload.tenantId
    });
  });
  runtime.createWorker(connectorEventsQueueConfig, async (data, _context, job) =>
    processConnectorEventJob(data as ConnectorEventJobPayload, {
      job
    })
  );

  const agentMeshIngressBridge = initializeAgentMeshIngressBridge({
    enqueueAgentExecution: async ({ payload, priority }) => {
      const mappedPriority = priority === "high" ? 1 : (priority as string) === "low" ? 10 : 5;

      await runtime.enqueue({
        data: payload,
        jobName: "agent-execution",
        options: {
          jobId: `${payload.tenantId}:${payload.executionId}`,
          priority: mappedPriority
        },
        queue: getAgentQueueName(priority)
      });
    },
    enqueueWorkflowTrigger: async (payload) => {
      await runtime.enqueue({
        data: payload,
        jobName: "workflow-trigger",
        options: {
          jobId: payload.idempotencyKey ?? `${payload.workflowId ?? payload.topic}:${payload.tenantId}:${Date.now()}`
        },
        queue: WORKFLOW_QUEUE_NAMES.trigger
      });
    }
  });

  const workers = runtime.listWorkers();
  workers.forEach((worker) => {
    worker.on("completed", (job) => {
      const startedAt = typeof job?.processedOn === "number" ? job.processedOn : undefined;
      const finishedAt = typeof job?.finishedOn === "number" ? job.finishedOn : undefined;
      recordWorkerJobMetric({
        queue: worker.name,
        status: "completed",
        ...(startedAt !== undefined ? { startedAt } : {}),
        ...(finishedAt !== undefined ? { finishedAt } : {})
      });
    });

    worker.on("failed", (job, error) => {
      const startedAt = typeof job?.processedOn === "number" ? job.processedOn : undefined;
      const finishedAt = typeof job?.finishedOn === "number" ? job.finishedOn : undefined;
      recordWorkerJobMetric({
        queue: worker.name,
        status: "failed",
        ...(startedAt !== undefined ? { startedAt } : {}),
        ...(finishedAt !== undefined ? { finishedAt } : {})
      });
      logger.error(
        {
          error,
          jobId: job?.id,
          queue: worker.name
        },
        "Worker job failed"
      );
    });
  });

  const close = async (): Promise<void> => {
    agentMeshIngressBridge.close();
    await runtime.close();
  };

  return {
    close,
    connection,
    dlqQueues: runtime.listDlqQueues(),
    queues: runtime.listQueues(),
    runtime,
    workers
  };
}
