import {
  Prisma,
  prisma,
  StepResultStatus,
  WorkflowExecutionStatus
} from "@birthub/database";
import { resolveConnectorAccount, toConnectorCredentials } from "./integrations/workflow-connectors.js";
import {
  createDefaultConnectorRuntime,
  isConnectorRuntimeProvider,
  type ConnectorActionName,
  type ConnectorActionPayload,
  type ConnectorExecutionResult,
  type ConnectorProvider
} from "@birthub/connectors-core";
import type { Job } from "bullmq";
import { createLogger } from "@birthub/logger";

const logger = createLogger("worker.workflows");

type WorkflowExecutionWithRevision = Prisma.WorkflowExecutionGetPayload<{
  include: {
    revision: true;
  };
}>;

type WorkflowExecutionJobData = {
  attempt?: number;
  executionId: string;
};

type WorkflowStepDefinition = {
  config: Record<string, unknown>;
  id?: string;
  key?: string;
  type: string;
};

type ConnectorActionStepDefinition = WorkflowStepDefinition & {
  config: {
    action: string;
    connectorAccountId?: string;
    payload?: unknown;
  };
  type: "CONNECTOR_ACTION";
};

const connectorActionNames = [
  "crm.company.upsert",
  "crm.contact.upsert",
  "erp.customer.upsert",
  "erp.sales-order.create",
  "health.check",
  "message.send",
  "payment.read"
] as const satisfies readonly ConnectorActionName[];

const connectorActionNameSet = new Set<string>(connectorActionNames);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isConnectorActionName(value: string): value is ConnectorActionName {
  return connectorActionNameSet.has(value);
}

function resolveWorkflowSteps(definition: Prisma.JsonValue): WorkflowStepDefinition[] {
  if (!isRecord(definition) || !Array.isArray(definition.steps)) {
    return [];
  }

  const rawSteps: unknown[] = definition.steps;

  return rawSteps.filter((step): step is WorkflowStepDefinition => {
    if (!isRecord(step) || typeof step.type !== "string" || !isRecord(step.config)) {
      return false;
    }

    const hasId = typeof step.id === "string";
    const hasKey = typeof step.key === "string";
    return hasId || hasKey;
  });
}

function isConnectorActionStep(step: WorkflowStepDefinition): step is ConnectorActionStepDefinition {
  return (
    step.type === "CONNECTOR_ACTION" &&
    typeof step.config.action === "string" &&
    (step.config.connectorAccountId === undefined ||
      typeof step.config.connectorAccountId === "string")
  );
}

function parseConnectorAction(action: string): {
  action: ConnectorActionName;
  provider: ConnectorProvider;
} {
  const [provider, ...actionParts] = action.split(".");
  const connectorAction = actionParts.join(".");

  if (!provider || !isConnectorRuntimeProvider(provider)) {
    throw new Error(`INVALID_CONNECTOR_PROVIDER:${provider ?? "unknown"}`);
  }

  if (!isConnectorActionName(connectorAction)) {
    throw new Error(`INVALID_CONNECTOR_ACTION:${connectorAction || "unknown"}`);
  }

  return {
    action: connectorAction,
    provider
  };
}

function toConnectorPayload(value: unknown): ConnectorActionPayload[ConnectorActionName] {
  return value as ConnectorActionPayload[ConnectorActionName];
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function processWorkflowExecutionJob(job: Job<WorkflowExecutionJobData>): Promise<{ executed: boolean }> {
  const executionId = job.data.executionId;
  const attempt = job.data.attempt ?? 1;

  logger.info({ executionId, attempt }, "Executing workflow");

  const execution: WorkflowExecutionWithRevision | null = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      revision: true
    }
  });

  if (!execution) {
    logger.error({ executionId }, "WorkflowExecution not found");
    return { executed: false };
  }

  if (!execution.revision || !execution.revision.definition) {
    logger.error({ executionId }, "WorkflowRevision definition not found");
    return { executed: false };
  }

  const steps = resolveWorkflowSteps(execution.revision.definition);

  const sortedSteps = [...steps];

  let currentStatus: WorkflowExecutionStatus = WorkflowExecutionStatus.RUNNING;

  for (const step of sortedSteps) {
    if (isConnectorActionStep(step)) {
      const startedAt = new Date();
      const stepId = step.id ?? step.key;

      try {
        const connectorAction = parseConnectorAction(step.config.action);
        const connectorAccount = await resolveConnectorAccount({
          ...(step.config.connectorAccountId ? { connectorAccountId: step.config.connectorAccountId } : {}),
          organizationId: execution.organizationId,
          provider: connectorAction.provider,
          tenantId: execution.tenantId
        });

        const credentials = toConnectorCredentials(connectorAccount);
        const runtime = createDefaultConnectorRuntime();

        const result: ConnectorExecutionResult = execution.isDryRun
          ? {
              action: connectorAction.action,
              externalId: "dry_run",
              provider: connectorAction.provider,
              response: {},
              status: "success",
              statusCode: 200
            }
          : await runtime.execute({
              action: connectorAction.action,
              credentials,
              metadata: {
                executionId: execution.id,
                workflowId: execution.workflowId
              },
              payload: toConnectorPayload(step.config.payload),
              provider: connectorAction.provider
            });

        const finishedAt = new Date();

        await prisma.stepResult.create({
          data: {
            attempt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            executionId: execution.id,
            finishedAt,
            organizationId: execution.organizationId,
            status: StepResultStatus.SUCCESS,
            stepId,
            tenantId: execution.tenantId,
            workflowRevisionId: execution.workflowRevisionId,
            workflowId: execution.workflowId,
            ...(step.config.payload === undefined
              ? {}
              : { input: toInputJsonValue(step.config.payload) }),
            output: toInputJsonValue(result.response ?? {})
          }
        });

      } catch (error) {
        logger.error({ executionId, stepId: step.key, error }, "Step failed");

        const finishedAt = new Date();
        await prisma.stepResult.create({
          data: {
            attempt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            errorCode: "STEP_EXECUTION_FAILED",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            executionId: execution.id,
            finishedAt,
            organizationId: execution.organizationId,
            status: StepResultStatus.FAILED,
            stepId,
            tenantId: execution.tenantId,
            workflowRevisionId: execution.workflowRevisionId,
            workflowId: execution.workflowId,
            ...(step.config.payload === undefined
              ? {}
              : { input: toInputJsonValue(step.config.payload) }),
            output: {}
          }
        });
        currentStatus = WorkflowExecutionStatus.FAILED;
        break;
      }
    }
  }


  if (currentStatus === WorkflowExecutionStatus.RUNNING) {
    currentStatus = WorkflowExecutionStatus.SUCCESS;
  }
  const completedAt = new Date();
  await prisma.workflowExecution.update({
    where: { id: execution.id },
    data: {
      status: currentStatus,
      completedAt,
      durationMs: completedAt.getTime() - execution.startedAt.getTime()
    }
  });

  if (currentStatus === WorkflowExecutionStatus.SUCCESS && !execution.isDryRun) {
    try {
      await prisma.usageRecord.create({
        data: {
          eventId: `workflow.execution:${execution.id}`,
          metadata: {
            executionId: execution.id,
            workflowId: execution.workflowId
          } as Prisma.InputJsonValue,
          metric: "workflow.execution",
          occurredAt: completedAt,
          organizationId: execution.organizationId,
          quantity: 1,
          tenantId: execution.tenantId,
          unit: "execution"
        }
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  return { executed: true };
}
