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
          orderBy: {
            version: "desc"
          },
          take: 1
        },
        steps: true
      },
      where: {
        ...(payload.workflowId ? { id: payload.workflowId } : {}),
        ...(payload.topic ? { eventTopic: payload.topic } : {}),
        status: "PUBLISHED",
        tenantId: payload.tenantId
      }
    });

    if (workflows.length === 0) {
      logger.warn({ payload }, "Workflow trigger dropped because workflow was not found/published");
      return;
    }

    for (const workflow of workflows) {
      const existingExecution = payload.idempotencyKey
        ? await prisma.workflowExecution.findFirst({
            where: {
              idempotencyKey: payload.idempotencyKey,
              tenantId: payload.tenantId,
              workflowId: workflow.id
            }
          })
        : null;

      const execution = existingExecution ?? await prisma.workflowExecution.create({
        data: {
          eventSource: payload.eventSource ?? null,
          idempotencyKey: payload.idempotencyKey ?? null,
          isDryRun: payload.isDryRun ?? false,
          organizationId: payload.organizationId,
          status: WorkflowExecutionStatus.RUNNING,
          tenantId: payload.tenantId,
          triggerEventId:
            typeof payload.triggerPayload.eventId === "string" ? payload.triggerPayload.eventId : null,
          triggerKey: payload.topic ?? null,
          triggerPayload: payload.triggerPayload as Prisma.InputJsonValue,
          triggerType: payload.triggerType,
          workflowRevisionId: workflow.revisions[0]?.id ?? null,
          workflowId: workflow.id
        }
      });
      if (existingExecution) {
        continue;
      }

      const triggerStep = workflow.steps.find(
        (step) =>
          step.type === "TRIGGER_CRON" ||
          step.type === "TRIGGER_EVENT" ||
          step.type === "TRIGGER_WEBHOOK"
      );

      if (!triggerStep) {
        await prisma.workflowExecution.update({
          data: {
            completedAt: new Date(),
            errorMessage: "Workflow has no trigger step configured.",
            status: WorkflowExecutionStatus.FAILED
          },
          where: {
            id: execution.id
          }
        });
        continue;
      }

      await this.executionQueue.add(
        "workflow-step",
        {
          attempt: 1,
          executionId: execution.id,
          isDryRun: payload.isDryRun,
          organizationId: payload.organizationId,
          stepKey: triggerStep.key,
          tenantId: payload.tenantId,
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
