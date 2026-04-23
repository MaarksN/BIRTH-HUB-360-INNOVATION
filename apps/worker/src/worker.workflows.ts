import { prisma, StepResultStatus, WorkflowExecutionStatus } from "@birthub/database";
import { resolveConnectorAccount, toConnectorCredentials } from "./integrations/workflow-connectors.js";
import { createDefaultConnectorRuntime } from "@birthub/connectors-core";
import type { Job } from "bullmq";
import { createLogger } from "@birthub/logger";

const logger = createLogger("worker.workflows");

export async function processWorkflowExecutionJob(job: Job<{ executionId: string; attempt?: number }>): Promise<{ executed: boolean }> {
  const executionId = job.data.executionId;
  const attempt = job.data.attempt ?? 1;

  logger.info({ executionId, attempt }, "Executing workflow");

  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      revision: true
    }
  });

  if (!execution) {
    logger.error({ executionId }, "WorkflowExecution not found");
    return { executed: false };
  }

  // @ts-ignore
  if (!execution.revision || !execution.revision.definition) {
    logger.error({ executionId }, "WorkflowRevision definition not found");
    return { executed: false };
  }

  // @ts-ignore
  const definition = execution.revision.definition as { steps?: any[], transitions?: any[] };
  const steps = definition.steps ?? [];

  const sortedSteps = [...steps];

  let currentStatus: WorkflowExecutionStatus = WorkflowExecutionStatus.RUNNING;

  for (const step of sortedSteps) {
    if (step.type === "CONNECTOR_ACTION") {
      const startedAt = new Date();
      const actionParts = step.config.action.split(".");
      const provider = actionParts[0];

      try {
        const connectorAccount = await resolveConnectorAccount({
          ...(step.config.connectorAccountId ? { connectorAccountId: step.config.connectorAccountId } : {}),
          organizationId: execution.organizationId,
          provider,
          tenantId: execution.tenantId
        });

        const credentials = toConnectorCredentials(connectorAccount);
        const runtime = createDefaultConnectorRuntime();

        const result = execution.isDryRun
          ? { status: 200, response: {}, externalId: "dry_run" }
          : await runtime.execute({
              action: actionParts.slice(1).join(".") as any,
              credentials,
              metadata: {
                executionId: execution.id,
                workflowId: execution.workflowId
              },
              payload: step.config.payload,
              provider: provider as any
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
            stepId: step.id ?? step.key,
            tenantId: execution.tenantId,
            workflowRevisionId: execution.workflowRevisionId,
            workflowId: execution.workflowId,
            input: step.config.payload as any,
            output: (result.response ?? {}) as any
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
            stepId: step.id ?? step.key,
            tenantId: execution.tenantId,
            workflowRevisionId: execution.workflowRevisionId,
            workflowId: execution.workflowId,
            input: step.config.payload as any,
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
    // @ts-ignore
    await prisma.usageRecord.create({ // @ts-ignore
      data: {
        organizationId: execution.organizationId,
        tenantId: execution.tenantId,
        metric: "workflow.execution" as any,
        quantity: 1,
        occurredAt: completedAt,
        metadata: {
          executionId: execution.id,
          workflowId: execution.workflowId
        } as any
      }
    });
  }

  return { executed: true };
}
