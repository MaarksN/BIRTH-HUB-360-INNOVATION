import { randomUUID } from "node:crypto";

import type { ApiConfig } from "@birthub/config";
import {
  Prisma,
  prisma,
  WorkflowExecutionStatus,
  WorkflowStatus,
  WorkflowTriggerType
} from "@birthub/database";
import { maskSensitivePayload } from "@birthub/workflows-core";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { readNumericPlanLimit } from "../billing/plan.utils.js";
import { getBillingSnapshot } from "../billing/service.js";
import { getWorkflowById } from "./service.lifecycle.js";
import {
  listStepResultsForExecution,
  listWorkflowExecutionPages,
  resolveScopedIdentity,
  workflowQueueAdapter
} from "./service.shared.js";
import type { WorkflowRunInput } from "./schemas.js";

type ResumeCheckpoint = {
  fromExecutionId: string;
  fromStepKey?: string | undefined;
};

const WORKFLOW_RUN_LIMIT_KEYS = ["workflowExecutions", "workflow_runs", "workflowRuns"] as const;

function resolveWorkflowRunLimit(limits: unknown): number {
  for (const key of WORKFLOW_RUN_LIMIT_KEYS) {
    const limit = readNumericPlanLimit(limits, key, Number.POSITIVE_INFINITY);
    if (Number.isFinite(limit)) {
      return limit;
    }
  }

  return Number.POSITIVE_INFINITY;
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function assertMonthlyWorkflowExecutionLimit(input: {
  isDryRun: boolean;
  organizationId: string;
  tenantId: string;
}): Promise<void> {
  if (input.isDryRun) {
    return;
  }

  const snapshot = await getBillingSnapshot(input.tenantId, 3);
  const limit = resolveWorkflowRunLimit(snapshot.plan.limits);
  if (!Number.isFinite(limit)) {
    return;
  }

  const current = await prisma.usageRecord.aggregate({
    _sum: {
      quantity: true
    },
    where: {
      metric: "workflow.execution",
      occurredAt: {
        gte: startOfCurrentMonth()
      },
      organizationId: input.organizationId,
      tenantId: input.tenantId
    }
  });

  if ((current._sum.quantity ?? 0) >= limit) {
    throw new ProblemDetailsError({
      detail: `The active plan allows ${limit} workflow executions this month.`,
      status: 402,
      title: "Payment Required"
    });
  }
}

async function resolveResumeStepKey(input: {
  execution: NonNullable<Awaited<ReturnType<typeof prisma.workflowExecution.findFirst>>>;
  requestedStepKey?: string | undefined;
  workflowId: string;
}): Promise<string> {
  if (input.requestedStepKey) {
    return input.requestedStepKey;
  }

  const latestFailedStep = await prisma.stepResult.findFirst({
    include: {
      step: true
    },
    orderBy: {
      createdAt: "desc"
    },
    where: {
      executionId: input.execution.id,
      status: "FAILED",
      workflowId: input.workflowId
    }
  });

  if (!latestFailedStep?.step.key) {
    throw new ProblemDetailsError({
      detail: "Execution has no failed step to resume from.",
      status: 409,
      title: "Conflict"
    });
  }

  return latestFailedStep.step.key;
}

async function buildResumeContext(input: {
  organizationId: string;
  resume: ResumeCheckpoint;
  tenantId: string;
  workflowId: string;
}): Promise<{
  depth: number;
  resumeStepKey: string;
  resumedFromExecutionId: string;
  workflowRevisionId: string | null;
}> {
  const sourceExecution = await prisma.workflowExecution.findFirst({
    where: {
      id: input.resume.fromExecutionId,
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      workflowId: input.workflowId
    }
  });

  if (!sourceExecution) {
    throw new ProblemDetailsError({
      detail: "Source execution for retry was not found.",
      status: 404,
      title: "Not Found"
    });
  }

  if (sourceExecution.status !== WorkflowExecutionStatus.FAILED) {
    throw new ProblemDetailsError({
      detail: "Only failed executions can be resumed from a checkpoint.",
      status: 409,
      title: "Conflict"
    });
  }

  const resumeStepKey = await resolveResumeStepKey({
    execution: sourceExecution,
    requestedStepKey: input.resume.fromStepKey,
    workflowId: input.workflowId
  });

  const resumeStep = await prisma.workflowStep.findFirst({
    where: {
      key: resumeStepKey,
      tenantId: input.tenantId,
      ...(sourceExecution.workflowRevisionId
        ? { workflowRevisionId: sourceExecution.workflowRevisionId }
        : {}),
      workflowId: input.workflowId
    }
  });

  if (!resumeStep) {
    throw new ProblemDetailsError({
      detail: "Retry checkpoint step was not found in this workflow version.",
      status: 404,
      title: "Not Found"
    });
  }

  const sourceResults = await listStepResultsForExecution(sourceExecution.id, input.workflowId);
  const resumeIndex = sourceResults.findIndex((result) => result.step.key === resumeStepKey);
  if (resumeIndex < 0) {
    throw new ProblemDetailsError({
      detail: "Retry checkpoint was never executed in the source run.",
      status: 409,
      title: "Conflict"
    });
  }

  return {
    depth: resumeIndex,
    resumeStepKey,
    resumedFromExecutionId: sourceExecution.id,
    workflowRevisionId: sourceExecution.workflowRevisionId
  };
}

async function cloneCheckpointResults(input: {
  client: Pick<Prisma.TransactionClient, "stepResult">;
  executionId: string;
  fromExecutionId: string;
  fromStepKey: string;
  organizationId: string;
  tenantId: string;
  workflowId: string;
}): Promise<number> {
  const sourceResults = await listStepResultsForExecution(input.fromExecutionId, input.workflowId);
  const resumeIndex = sourceResults.findIndex((result) => result.step.key === input.fromStepKey);
  if (resumeIndex < 0) {
    return 0;
  }

  const checkpointResults = sourceResults.slice(0, resumeIndex);

  if (checkpointResults.length > 0) {
    await input.client.stepResult.createMany({
      data: checkpointResults.map((result) => ({
        attempt: result.attempt,
        durationMs: result.durationMs,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        executionId: input.executionId,
        externalPayloadUrl: result.externalPayloadUrl,
        finishedAt: result.finishedAt,
        input: result.input as Prisma.InputJsonValue,
        organizationId: input.organizationId,
        output: result.output as Prisma.InputJsonValue,
        outputPreview: result.outputPreview,
        ...(result.outputSize !== null ? { outputSize: result.outputSize } : {}),
        startedAt: result.startedAt,
        status: result.status,
        stepId: result.stepId,
        tenantId: input.tenantId,
        workflowRevisionId: result.workflowRevisionId,
        workflowId: input.workflowId
      }))
    });
  }

  return checkpointResults.length;
}

async function getLatestWorkflowRevision(input: {
  tenantId: string;
  workflowId: string;
}) {
  return prisma.workflowRevision.findFirst({
    include: {
      steps: {
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      version: "desc"
    },
    where: {
      tenantId: input.tenantId,
      workflowId: input.workflowId
    }
  });
}

function findTriggerStep(
  steps: Array<{
    key: string;
    type: string;
  }>
) {
  return steps.find(
    (step) =>
      step.type === "TRIGGER_WEBHOOK" ||
      step.type === "TRIGGER_CRON" ||
      step.type === "TRIGGER_EVENT"
  );
}

export async function runWorkflowNow(
  config: ApiConfig,
  workflowId: string,
  tenantReference: string,
  input: WorkflowRunInput,
  triggerType: WorkflowTriggerType = WorkflowTriggerType.MANUAL
): Promise<{
  executionId: string;
  mode: "async" | "sync";
  status: "accepted";
}> {
  const identity = await resolveScopedIdentity(tenantReference);
  const workflow = await getWorkflowById(workflowId, identity.tenantId);
  if (!workflow) {
    throw new Error("WORKFLOW_NOT_FOUND");
  }

  if (workflow.status !== WorkflowStatus.PUBLISHED) {
    throw new Error("WORKFLOW_NOT_PUBLISHED");
  }

  await assertMonthlyWorkflowExecutionLimit({
    isDryRun: input.dryRun,
    organizationId: workflow.organizationId,
    tenantId: workflow.tenantId
  });

  const resumeContext = input.retry
    ? await buildResumeContext({
        organizationId: workflow.organizationId,
        resume: input.retry,
        tenantId: workflow.tenantId,
        workflowId: workflow.id
      })
    : null;

  const revision = resumeContext?.workflowRevisionId
    ? await prisma.workflowRevision.findFirst({
        include: {
          steps: {
            orderBy: {
              createdAt: "asc"
            }
          }
        },
        where: {
          id: resumeContext.workflowRevisionId,
          tenantId: workflow.tenantId,
          workflowId: workflow.id
        }
      })
    : await getLatestWorkflowRevision({
        tenantId: workflow.tenantId,
        workflowId: workflow.id
      });
  const triggerStep = revision ? findTriggerStep(revision.steps) : null;
  const triggerPayload = maskSensitivePayload(input.payload);
  const requestedIdempotencyKey = input.retry
    ? `replay:${resumeContext?.resumedFromExecutionId ?? "unknown"}:${randomUUID()}`
    : input.idempotencyKey;

  if (requestedIdempotencyKey && !input.retry) {
    const existingExecution = await prisma.workflowExecution.findFirst({
      where: {
        idempotencyKey: requestedIdempotencyKey,
        tenantId: workflow.tenantId
      }
    });

    if (existingExecution) {
      return {
        executionId: existingExecution.id,
        mode: input.async ? "async" : "sync",
        status: "accepted"
      };
    }
  }

  const execution = await prisma.$transaction(async (tx) => {
    const createdExecution = await tx.workflowExecution.create({
      data: {
        eventSource: "manual",
        depth: resumeContext?.depth ?? 0,
        idempotencyKey: requestedIdempotencyKey ?? null,
        isDryRun: input.dryRun,
        organizationId: workflow.organizationId,
        resumedFromExecutionId: resumeContext?.resumedFromExecutionId ?? null,
        status: WorkflowExecutionStatus.RUNNING,
        tenantId: workflow.tenantId,
        triggerEventId: typeof input.payload.eventId === "string" ? input.payload.eventId : null,
        triggerKey: triggerStep?.key ?? null,
        triggerPayload: triggerPayload as Prisma.InputJsonValue,
        triggerType,
        workflowRevisionId: revision?.id ?? null,
        workflowId: workflow.id
      }
    });

    if (resumeContext) {
      await cloneCheckpointResults({
        client: tx,
        executionId: createdExecution.id,
        fromExecutionId: resumeContext.resumedFromExecutionId,
        fromStepKey: resumeContext.resumeStepKey,
        organizationId: workflow.organizationId,
        tenantId: workflow.tenantId,
        workflowId: workflow.id
      });
    }

    return createdExecution;
  });

  if (resumeContext) {
    await workflowQueueAdapter.enqueueWorkflowExecution(config, {
      attempt: 1,
      executionId: execution.id,
      isDryRun: input.dryRun,
      organizationId: workflow.organizationId,
      stepKey: resumeContext.resumeStepKey,
      tenantId: workflow.tenantId,
      triggerEventId: typeof input.payload.eventId === "string" ? input.payload.eventId : undefined,
      triggerPayload: input.payload,
      triggerType,
      workflowId: workflow.id
    });
  } else if (triggerStep) {
    await workflowQueueAdapter.enqueueWorkflowExecution(config, {
      attempt: 1,
      executionId: execution.id,
      isDryRun: input.dryRun,
      organizationId: workflow.organizationId,
      stepKey: triggerStep.key,
      tenantId: workflow.tenantId,
      triggerEventId: typeof input.payload.eventId === "string" ? input.payload.eventId : undefined,
      triggerPayload: input.payload,
      triggerType,
      workflowId: workflow.id
    });
  } else {
    await workflowQueueAdapter.enqueueWorkflowTrigger(config, {
      organizationId: workflow.organizationId,
      isDryRun: input.dryRun,
      tenantId: workflow.tenantId,
      triggerPayload: input.payload,
      triggerType,
      workflowId: workflow.id
    });
  }

  return {
    executionId: execution.id,
    mode: input.async ? "async" : "sync",
    status: "accepted"
  };
}

export type WorkflowExecutionLineageNode = {
  children: WorkflowExecutionLineageNode[];
  completedAt: Date | null;
  depth: number;
  durationMs: number | null;
  errorMessage: string | null;
  id: string;
  resumedFromExecutionId: string | null;
  startedAt: Date;
  status: WorkflowExecutionStatus;
};

export async function listWorkflowExecutionLineage(
  workflowId: string,
  tenantReference: string
): Promise<WorkflowExecutionLineageNode[]> {
  const identity = await resolveScopedIdentity(tenantReference);
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      tenantId: identity.tenantId
    }
  });

  if (!workflow) {
    throw new Error("WORKFLOW_NOT_FOUND");
  }

  const executions = await listWorkflowExecutionPages(identity, workflowId);

  const nodesById = new Map<string, WorkflowExecutionLineageNode>();
  for (const execution of executions) {
    nodesById.set(execution.id, {
      children: [],
      completedAt: execution.completedAt,
      depth: execution.depth,
      durationMs: execution.durationMs,
      errorMessage: execution.errorMessage,
      id: execution.id,
      resumedFromExecutionId: execution.resumedFromExecutionId,
      startedAt: execution.startedAt,
      status: execution.status
    });
  }

  const roots: WorkflowExecutionLineageNode[] = [];
  for (const node of nodesById.values()) {
    if (!node.resumedFromExecutionId) {
      roots.push(node);
      continue;
    }

    const parent = nodesById.get(node.resumedFromExecutionId);
    if (!parent) {
      roots.push(node);
      continue;
    }

    parent.children.push(node);
  }

  return roots;
}
