import { createHash } from "node:crypto";

import {
  Prisma,
  prisma,
  QuotaResourceType,
  WorkflowExecutionStatus,
  WorkflowTransitionRoute
} from "@birthub/database";
import { createLogger } from "@birthub/logger";
import { maskSensitivePayload } from "@birthub/workflows-core";

export const logger: ReturnType<typeof createLogger> = createLogger("workflow-runner");
export const MAX_ATTEMPTS = 5;
export const WORKFLOW_EXECUTION_QUEUE = "workflow-execution";

const OUTPUT_MAX_BYTES = 200 * 1024;

export type StepOutputEnvelope = {
  externalPayloadUrl: string | null;
  output: unknown;
  outputPreview: string | null;
  outputSize: number;
};

export function normalizeOutput(
  output: unknown,
  executionId: string,
  stepKey: string
): StepOutputEnvelope {
  const maskedOutput = maskSensitivePayload(output ?? null);
  const serialized = JSON.stringify(maskedOutput);
  const outputSize = Buffer.byteLength(serialized, "utf8");

  if (outputSize <= OUTPUT_MAX_BYTES) {
    return {
      externalPayloadUrl: null,
      output: maskedOutput,
      outputPreview: null,
      outputSize
    };
  }

  const externalPayloadUrl = `s3://workflow-step-results/${executionId}/${stepKey}/${createHash("sha256")
    .update(serialized)
    .digest("hex")}.json`;

  return {
    externalPayloadUrl,
    output: null,
    outputPreview: `${serialized.slice(0, 1_500)}...`,
    outputSize
  };
}

function isConditionTrue(output: unknown): boolean {
  if (typeof output !== "object" || output === null) {
    return false;
  }

  return Boolean((output as { result?: unknown }).result);
}

export function shouldFollowTransition(
  route: WorkflowTransitionRoute,
  output: unknown,
  failed: boolean
): boolean {
  if (failed) {
    return route === WorkflowTransitionRoute.ON_FAILURE || route === WorkflowTransitionRoute.FALLBACK;
  }

  if (route === WorkflowTransitionRoute.ALWAYS || route === WorkflowTransitionRoute.ON_SUCCESS) {
    return true;
  }

  if (route === WorkflowTransitionRoute.IF_TRUE) {
    return isConditionTrue(output);
  }

  if (route === WorkflowTransitionRoute.IF_FALSE) {
    return !isConditionTrue(output);
  }

  return false;
}

export function calculateBackoff(attempt: number): number {
  return Math.min(60_000, Math.pow(2, attempt) * 1000);
}

export async function consumeSharedAgentBudget(tenantId: string): Promise<void> {
  const record = await prisma.quotaUsage.findFirst({
    orderBy: {
      resetAt: "desc"
    },
    where: {
      resourceType: QuotaResourceType.AI_PROMPTS,
      tenantId
    }
  });

  if (!record) {
    return;
  }

  if (record.count >= record.limit) {
    throw new Error("SHARED_RATE_LIMIT_EXCEEDED");
  }

  await prisma.quotaUsage.update({
    data: {
      count: {
        increment: 1
      }
    },
    where: {
      id: record.id
    }
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function recordWorkflowExecutionUsage(input: {
  durationMs: number | null;
  executionId: string;
  isDryRun: boolean;
  organizationId: string;
  status: WorkflowExecutionStatus;
  tenantId: string;
  workflowId: string;
  workflowRevisionId: string | null;
}): Promise<void> {
  if (input.isDryRun) {
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      id: true
    },
    where: {
      organizationId: input.organizationId,
      tenantId: input.tenantId
    }
  });

  try {
    await prisma.usageRecord.create({
      data: {
        eventId: `workflow.execution:${input.executionId}`,
        metadata: {
          durationMs: input.durationMs,
          status: input.status,
          workflowId: input.workflowId,
          workflowRevisionId: input.workflowRevisionId
        } as Prisma.InputJsonValue,
        metric: "workflow.execution",
        organizationId: input.organizationId,
        quantity: 1,
        ...(subscription?.id ? { subscriptionId: subscription.id } : {}),
        tenantId: input.tenantId,
        unit: "execution"
      }
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }
}

