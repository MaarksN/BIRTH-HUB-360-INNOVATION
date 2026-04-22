import {
  Prisma,
  prisma,
  WorkflowExecutionStatus,
  WorkflowTriggerType
} from "@birthub/database";
import {
  type ConnectorExecutor,
  type AgentExecutor,
  type HandoffExecutor,
  maskSensitivePayload,
  type NotificationDispatcher
} from "@birthub/workflows-core";
import { WORKFLOW_QUEUE_NAMES } from "@birthub/queue";
import { Queue } from "bullmq";

import { processWorkflowExecutionJob } from "./runner.execution.js";
import {
  WORKFLOW_EXECUTION_QUEUE,
  calculateBackoff,
  logger,
  shouldFollowTransition
} from "./runner.shared.js";

export interface WorkflowExecutionJobPayload {
  attempt: number;
  executionId: string;
  isDryRun?: boolean | undefined;
  organizationId: string;
  stepKey: string;
  tenantId: string;
  triggerEventId?: string | undefined;
  triggerPayload: Record<string, unknown>;
  triggerType: WorkflowTriggerType;
  workflowId: string;
}

export interface WorkflowTriggerJobPayload {
  actorId?: string | undefined;
  eventSource?: string | undefined;
  idempotencyKey?: string | undefined;
  isDryRun?: boolean | undefined;
  organizationId: string;
  triggerEventId?: string | undefined;
  tenantId: string;
  topic?: string | undefined;
  triggerPayload: Record<string, unknown>;
  triggerType: WorkflowTriggerType;
  workflowId?: string | undefined;
}

export interface WorkflowRunnerDependencies {
  agentExecutor?: AgentExecutor;
  connectorExecutor?: ConnectorExecutor;
  handoffExecutor?: HandoffExecutor;
  httpRequestRateLimiter?: {
    consume: (key: string, limit: number, windowSeconds: number) => Promise<void>;
  };
  notificationDispatcher?: NotificationDispatcher;
}

export { calculateBackoff, shouldFollowTransition };

const MONTHLY_WORKFLOW_LIMIT_KEYS = [
  "workflowExecutions",
  "workflow_runs",
  "workflowRuns"
] as const;

function readMonthlyWorkflowLimit(limits: unknown): number {
  if (typeof limits !== "object" || limits === null || Array.isArray(limits)) {
    return Number.POSITIVE_INFINITY;
  }

  const record = limits as Record<string, unknown>;
  for (const key of MONTHLY_WORKFLOW_LIMIT_KEYS) {
    const value = record[key];
    if (typeof value !== "number") {
      continue;
    }

    return value < 0 ? Number.POSITIVE_INFINITY : value;
  }

  return Number.POSITIVE_INFINITY;
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function assertMonthlyWorkflowRunLimit(input: {
  isDryRun: boolean;
  organizationId: string;
  tenantId: string;
}): Promise<void> {
  if (input.isDryRun) {
    return;
  }

  const organization = await prisma.organization.findFirst({
    include: {
      plan: true,
      subscriptions: {
        include: {
          plan: true
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 1
      }
    },
    where: {
      id: input.organizationId,
      tenantId: input.tenantId
    }
  });

  const plan = organization?.subscriptions[0]?.plan ?? organization?.plan ?? null;
  const limit = readMonthlyWorkflowLimit(plan?.limits);
  if (!Number.isFinite(limit)) {
    return;
  }

  const used = await prisma.usageRecord.aggregate({
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

  if ((used._sum.quantity ?? 0) >= limit) {
    throw new Error("WORKFLOW_MONTHLY_LIMIT_EXCEEDED");
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function buildExecutionIdempotencyKey(
  payload: WorkflowTriggerJobPayload,
  workflowId: string
): string | null {
  if (!payload.idempotencyKey) {
    return null;
  }

  return `${payload.idempotencyKey}:workflow:${workflowId}`;
}

export class WorkflowRunner {
  private readonly executionQueue: Queue<WorkflowExecutionJobPayload>;
  private readonly dependencies: WorkflowRunnerDependencies;

  constructor(
    executionQueueConnection: Queue<WorkflowExecutionJobPayload>,
    dependencies: WorkflowRunnerDependencies = {}
  ) {
    this.executionQueue = executionQueueConnection;
    this.dependencies = dependencies;
  }

  async processTriggerJob(payload: WorkflowTriggerJobPayload): Promise<void> {
    const workflows = await prisma.workflow.findMany({
      include: {
        revisions: {
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
          take: 1
        }
      },
      where: {
        ...(payload.workflowId ? { id: payload.workflowId } : {}),
        ...(payload.topic && payload.triggerType === WorkflowTriggerType.EVENT
          ? { eventTopic: payload.topic }
          : {}),
        status: "PUBLISHED",
        tenantId: payload.tenantId,
        triggerType: payload.triggerType
      }
    });

    if (workflows.length === 0) {
      logger.warn({ payload }, "Workflow trigger dropped because workflow was not found/published");
      return;
    }

    for (const workflow of workflows) {
      const revision = workflow.revisions[0] ?? null;
      const triggerStep = revision?.steps.find(
        (step) =>
          step.type === "TRIGGER_CRON" ||
          step.type === "TRIGGER_EVENT" ||
          step.type === "TRIGGER_WEBHOOK"
      );
      const executionIdempotencyKey = buildExecutionIdempotencyKey(payload, workflow.id);
      const existingExecution = executionIdempotencyKey
        ? await prisma.workflowExecution.findFirst({
            where: {
              idempotencyKey: executionIdempotencyKey,
              tenantId: payload.tenantId
            }
          })
        : null;

      if (existingExecution) {
        logger.info(
          {
            executionId: existingExecution.id,
            idempotencyKey: executionIdempotencyKey,
            tenantId: payload.tenantId,
            workflowId: workflow.id
          },
          "Workflow trigger deduplicated against existing execution"
        );
        continue;
      }

      if (!triggerStep) {
        logger.error(
          {
            eventTopic: payload.topic ?? null,
            tenantId: payload.tenantId,
            workflowId: workflow.id,
            workflowRevisionId: revision?.id ?? null
          },
          "Workflow trigger dropped because no trigger step exists in the selected revision"
        );
        continue;
      }

      try {
        await assertMonthlyWorkflowRunLimit({
          isDryRun: payload.isDryRun ?? false,
          organizationId: workflow.organizationId,
          tenantId: payload.tenantId
        });
      } catch (error) {
        logger.warn(
          {
            err: error,
            tenantId: payload.tenantId,
            workflowId: workflow.id
          },
          "Workflow trigger blocked by monthly plan limit"
        );
        continue;
      }

      let execution;
      try {
        execution = await prisma.workflowExecution.create({
          data: {
            actorId: payload.actorId ?? null,
            eventSource: payload.eventSource ?? null,
            idempotencyKey: executionIdempotencyKey,
            isDryRun: payload.isDryRun ?? false,
            organizationId: workflow.organizationId,
            status: WorkflowExecutionStatus.RUNNING,
            tenantId: payload.tenantId,
            triggerEventId:
              payload.triggerEventId ??
              (typeof payload.triggerPayload.eventId === "string"
                ? payload.triggerPayload.eventId
                : null),
            triggerKey: triggerStep.key,
            triggerPayload: maskSensitivePayload(payload.triggerPayload) as Prisma.InputJsonValue,
            triggerType: payload.triggerType,
            workflowRevisionId: revision?.id ?? null,
            workflowId: workflow.id
          }
        });
      } catch (error) {
        if (!isUniqueConstraintError(error) || !executionIdempotencyKey) {
          throw error;
        }

        const duplicate = await prisma.workflowExecution.findFirst({
          where: {
            idempotencyKey: executionIdempotencyKey,
            tenantId: payload.tenantId
          }
        });
        if (duplicate) {
          logger.info(
            {
              executionId: duplicate.id,
              idempotencyKey: executionIdempotencyKey,
              tenantId: payload.tenantId,
              workflowId: workflow.id
            },
            "Workflow trigger race resolved as duplicate execution"
          );
          continue;
        }

        throw error;
      }

      await this.executionQueue.add(
        "workflow-step",
        {
          attempt: 1,
          executionId: execution.id,
          isDryRun: payload.isDryRun,
          organizationId: workflow.organizationId,
          stepKey: triggerStep.key,
          tenantId: payload.tenantId,
          triggerEventId: payload.triggerEventId,
          triggerPayload: payload.triggerPayload,
          triggerType: payload.triggerType,
          workflowId: workflow.id
        },
        {
          jobId: `${execution.id}:${triggerStep.key}:1`
        }
      );
    }
  }

  async processExecutionJob(payload: WorkflowExecutionJobPayload): Promise<void> {
    await processWorkflowExecutionJob({
      dependencies: this.dependencies,
      executionQueue: this.executionQueue,
      payload
    });
  }
}

export const workflowQueueNames = {
  execution: WORKFLOW_EXECUTION_QUEUE,
  trigger: WORKFLOW_QUEUE_NAMES.trigger
} as const;
