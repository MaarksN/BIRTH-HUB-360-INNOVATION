import {
  Prisma,
  prisma,
  StepResultStatus,
  WorkflowExecutionStatus,
  WorkflowStepOnError
} from "@birthub/database";

import type { WorkflowExecutionJobPayload } from "./runner.js";
import type {
  ExecutionContext,
  WorkflowExecutionQueue
} from "./runner.execution.js";
import {
  MAX_ATTEMPTS,
  calculateBackoff,
  maskSensitivePayload,
  recordWorkflowExecutionUsage,
  shouldFollowTransition
} from "./runner.shared.js";

function resolveErrorCode(error: unknown): string {
  if (error instanceof Error && error.name && error.name !== "Error") {
    return error.name;
  }

  if (error instanceof Error && /^[A-Z0-9_:-]+$/.test(error.message)) {
    return error.message.split(":")[0] ?? "STEP_EXECUTION_FAILED";
  }

  return "STEP_EXECUTION_FAILED";
}

async function recordSuccessfulStep(
  context: ExecutionContext,
  payload: WorkflowExecutionJobPayload,
  output: unknown
): Promise<void> {
  const normalizedOutput = context.normalizeOutput(output);
  const isDelayStep = context.step.type === "DELAY";
  const finishedAt = new Date();

  await prisma.stepResult.create({
    data: {
      attempt: payload.attempt,
      durationMs: finishedAt.getTime() - context.now.getTime(),
      executionId: payload.executionId,
      externalPayloadUrl: normalizedOutput.externalPayloadUrl,
      finishedAt,
      input: {
        _cacheHash: context.stepInputHash,
        triggerPayload: maskSensitivePayload(payload.triggerPayload)
      } as Prisma.InputJsonValue,
      organizationId: payload.organizationId,
      output: normalizedOutput.output as Prisma.InputJsonValue,
      outputPreview: normalizedOutput.outputPreview,
      outputSize: normalizedOutput.outputSize,
      startedAt: context.now,
      status: isDelayStep ? StepResultStatus.WAITING : StepResultStatus.SUCCESS,
      stepId: context.step.id,
      tenantId: payload.tenantId,
      workflowRevisionId: context.execution.workflowRevisionId,
      workflowId: payload.workflowId
    }
  });

  await prisma.workflowExecution.update({
    data: {
      depth: context.execution.depth + 1
    },
    where: {
      id: payload.executionId
    }
  });
}

async function markExecutionSuccess(context: ExecutionContext): Promise<void> {
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - context.execution.startedAt.getTime();
  await prisma.workflowExecution.update({
    data: {
      completedAt,
      durationMs,
      status: WorkflowExecutionStatus.SUCCESS
    },
    where: {
      id: context.execution.id
    }
  });

  await recordWorkflowExecutionUsage({
    durationMs,
    executionId: context.execution.id,
    isDryRun: context.execution.isDryRun,
    organizationId: context.execution.organizationId,
    status: WorkflowExecutionStatus.SUCCESS,
    tenantId: context.execution.tenantId,
    workflowId: context.execution.workflowId,
    workflowRevisionId: context.execution.workflowRevisionId
  });
}

function resolveDelayMs(context: ExecutionContext, output: unknown): number {
  if (context.step.type !== "DELAY") {
    return 0;
  }

  const delayMs = Number(
    (output as { delayMs?: unknown })?.delayMs ??
      (context.step.config as { duration_ms?: unknown }).duration_ms
  );

  return Number.isFinite(delayMs) ? Math.max(0, delayMs) : 0;
}

function buildQueuedPayload(
  payload: WorkflowExecutionJobPayload,
  stepKey: string,
  attempt: number
): WorkflowExecutionJobPayload {
  return {
    attempt,
    executionId: payload.executionId,
    isDryRun: payload.isDryRun,
    organizationId: payload.organizationId,
    stepKey,
    tenantId: payload.tenantId,
    triggerEventId: payload.triggerEventId,
    triggerPayload: payload.triggerPayload,
    triggerType: payload.triggerType,
    workflowId: payload.workflowId
  };
}

async function enqueueTransitions(input: {
  context: ExecutionContext;
  executionQueue: WorkflowExecutionQueue;
  output: unknown;
  payload: WorkflowExecutionJobPayload;
  transitions: ExecutionContext["workflow"]["transitions"];
}): Promise<number> {
  let enqueuedCount = 0;

  for (const transition of input.transitions) {
    const nextStep = input.context.workflow.steps.find(
      (candidate) => candidate.id === transition.targetStepId
    );

    if (!nextStep) {
      continue;
    }

    await input.executionQueue.add(
      "workflow-step",
      buildQueuedPayload(input.payload, nextStep.key, 1),
      {
        delay: resolveDelayMs(input.context, input.output),
        jobId: `${input.payload.executionId}:${nextStep.key}:${Date.now()}`
      }
    );

    enqueuedCount += 1;
  }

  return enqueuedCount;
}

function findMatchingTransitions(
  context: ExecutionContext,
  output: unknown,
  failed: boolean
): ExecutionContext["workflow"]["transitions"] {
  return context.workflow.transitions.filter((transition) => {
    if (transition.sourceStepId !== context.step.id) {
      return false;
    }

    return shouldFollowTransition(transition.route, output, failed);
  });
}

async function handleSuccessfulExecution(input: {
  context: ExecutionContext;
  executionQueue: WorkflowExecutionQueue;
  output: unknown;
  payload: WorkflowExecutionJobPayload;
}): Promise<void> {
  const nextTransitions = findMatchingTransitions(input.context, input.output, false);

  if (nextTransitions.length === 0) {
    await markExecutionSuccess(input.context);
    return;
  }

  await enqueueTransitions({
    context: input.context,
    executionQueue: input.executionQueue,
    output: input.output,
    payload: input.payload,
    transitions: nextTransitions
  });
}

async function recordFailedStep(
  context: ExecutionContext,
  payload: WorkflowExecutionJobPayload,
  error: unknown,
  nextRetryAt: Date | null
): Promise<void> {
  const finishedAt = new Date();
  await prisma.stepResult.create({
    data: {
      attempt: payload.attempt,
      durationMs: finishedAt.getTime() - context.now.getTime(),
      errorCode: resolveErrorCode(error),
      errorMessage: error instanceof Error ? error.message : "Unknown step execution error",
      executionId: payload.executionId,
      finishedAt,
      input: {
        _cacheHash: context.stepInputHash,
        triggerPayload: maskSensitivePayload(payload.triggerPayload)
      } as Prisma.InputJsonValue,
      nextRetryAt,
      organizationId: payload.organizationId,
      outputSize: 0,
      startedAt: context.now,
      status: StepResultStatus.FAILED,
      stepId: context.step.id,
      tenantId: payload.tenantId,
      workflowRevisionId: context.execution.workflowRevisionId,
      workflowId: payload.workflowId
    }
  });
}

async function scheduleRetry(
  executionQueue: WorkflowExecutionQueue,
  payload: WorkflowExecutionJobPayload,
  nextRetryAt: Date
): Promise<void> {
  await executionQueue.add(
    "workflow-step",
    {
      ...payload,
      attempt: payload.attempt + 1
    },
    {
      delay: Math.max(0, nextRetryAt.getTime() - Date.now()),
      jobId: `${payload.executionId}:${payload.stepKey}:${payload.attempt + 1}`
    }
  );
}

async function handleFallbackTransitions(input: {
  context: ExecutionContext;
  executionQueue: WorkflowExecutionQueue;
  payload: WorkflowExecutionJobPayload;
}): Promise<boolean> {
  if (input.context.step.onError !== WorkflowStepOnError.CONTINUE) {
    return false;
  }

  const fallbackTransitions = findMatchingTransitions(input.context, null, true);

  if (fallbackTransitions.length === 0) {
    return false;
  }

  await enqueueTransitions({
    context: input.context,
    executionQueue: input.executionQueue,
    output: null,
    payload: input.payload,
    transitions: fallbackTransitions
  });

  return true;
}

async function failExecution(input: {
  context: ExecutionContext;
  error: unknown;
}): Promise<void> {
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - input.context.execution.startedAt.getTime();
  await prisma.workflowExecution.update({
    data: {
      completedAt,
      durationMs,
      errorMessage: input.error instanceof Error ? input.error.message : "Workflow execution failed",
      status: WorkflowExecutionStatus.FAILED
    },
    where: {
      id: input.context.execution.id
    }
  });

  await recordWorkflowExecutionUsage({
    durationMs,
    executionId: input.context.execution.id,
    isDryRun: input.context.execution.isDryRun,
    organizationId: input.context.execution.organizationId,
    status: WorkflowExecutionStatus.FAILED,
    tenantId: input.context.execution.tenantId,
    workflowId: input.context.execution.workflowId,
    workflowRevisionId: input.context.execution.workflowRevisionId
  });
}

export async function handleExecutionOutcome(input: {
  context: ExecutionContext;
  error?: unknown;
  executionQueue: WorkflowExecutionQueue;
  output?: unknown;
  payload: WorkflowExecutionJobPayload;
}): Promise<void> {
  if (input.error === undefined) {
    await recordSuccessfulStep(input.context, input.payload, input.output);
    await handleSuccessfulExecution({
      context: input.context,
      executionQueue: input.executionQueue,
      output: input.output,
      payload: input.payload
    });
    return;
  }

  const nextRetryAt =
    input.payload.attempt < MAX_ATTEMPTS
      ? new Date(Date.now() + calculateBackoff(input.payload.attempt))
      : null;

  await recordFailedStep(input.context, input.payload, input.error, nextRetryAt);

  if (nextRetryAt) {
    await scheduleRetry(input.executionQueue, input.payload, nextRetryAt);
    return;
  }

  if (
    await handleFallbackTransitions({
      context: input.context,
      executionQueue: input.executionQueue,
      payload: input.payload
    })
  ) {
    return;
  }

  await failExecution({
    context: input.context,
    error: input.error
  });
}

