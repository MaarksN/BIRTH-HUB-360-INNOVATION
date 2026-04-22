import { createHash, randomUUID } from "node:crypto";

import type { ApiConfig } from "@birthub/config";
import {
  Prisma,
  prisma,
  StepResultStatus,
  WorkflowExecutionStatus,
  WorkflowTriggerType
} from "@birthub/database";
import { validateDag, type WorkflowCanvas } from "@birthub/workflows-core";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { readNumericPlanLimit } from "../billing/plan.utils.js";
import { getBillingSnapshot } from "../billing/service.js";
import {
  enqueueWorkflowExecution,
  enqueueWorkflowTrigger,
  scheduleCronWorkflow
} from "./runnerQueue.js";

const STEP_RESULT_PAGE_SIZE = 200;
const WORKFLOW_EXECUTION_PAGE_SIZE = 200;
const WORKFLOW_REVISION_PAGE_SIZE = 100;

export interface ScopedIdentity {
  organizationId: string;
  tenantId: string;
}

export type WorkflowWriteClient = Pick<Prisma.TransactionClient, "workflowStep" | "workflowTransition">;

export type WorkflowStepResultRecord = {
  attempt: number;
  errorMessage: string | null;
  executionId: string;
  externalPayloadUrl: string | null;
  finishedAt: Date | null;
  id: string;
  input: Prisma.JsonValue;
  output: Prisma.JsonValue;
  outputPreview: string | null;
  outputSize: number | null;
  startedAt: Date;
  status: StepResultStatus;
  step: {
    key: string;
  };
  stepId: string;
};

export type WorkflowExecutionPageRecord = {
  completedAt: Date | null;
  depth: number;
  durationMs: number | null;
  errorMessage: string | null;
  id: string;
  resumedFromExecutionId: string | null;
  startedAt: Date;
  status: WorkflowExecutionStatus;
};

export type WorkflowRevisionPageRecord = {
  createdAt: Date;
  definition: Prisma.JsonValue;
  id: string;
  tenantId: string;
  version: number;
  workflowId: string;
};

export const workflowQueueAdapter = {
  enqueueWorkflowExecution,
  enqueueWorkflowTrigger
} as const;

export async function listStepResultsForExecution(
  executionId: string,
  workflowId: string,
  cursorId?: string
): Promise<WorkflowStepResultRecord[]> {
  const page = (await prisma.stepResult.findMany({
    ...(cursorId
      ? {
          cursor: {
            id: cursorId
          },
          skip: 1
        }
      : {}),
    include: {
      step: true
    },
    orderBy: [
      {
        createdAt: "asc"
      },
      {
        id: "asc"
      }
    ],
    take: STEP_RESULT_PAGE_SIZE,
    where: {
      executionId,
      workflowId
    }
  })) as WorkflowStepResultRecord[];

  const lastResult = page.at(-1);
  if (!lastResult || page.length < STEP_RESULT_PAGE_SIZE) {
    return page;
  }

  return page.concat(await listStepResultsForExecution(executionId, workflowId, lastResult.id));
}

export async function listWorkflowExecutionPages(
  identity: ScopedIdentity,
  workflowId: string,
  cursorId?: string
): Promise<WorkflowExecutionPageRecord[]> {
  const page = (await prisma.workflowExecution.findMany({
    ...(cursorId
      ? {
          cursor: {
            id: cursorId
          },
          skip: 1
        }
      : {}),
    orderBy: [
      {
        startedAt: "asc"
      },
      {
        id: "asc"
      }
    ],
    take: WORKFLOW_EXECUTION_PAGE_SIZE,
    where: {
      organizationId: identity.organizationId,
      tenantId: identity.tenantId,
      workflowId
    }
  })) as WorkflowExecutionPageRecord[];

  const lastExecution = page.at(-1);
  if (!lastExecution || page.length < WORKFLOW_EXECUTION_PAGE_SIZE) {
    return page;
  }

  return page.concat(await listWorkflowExecutionPages(identity, workflowId, lastExecution.id));
}

export async function listWorkflowRevisionPages(
  tenantId: string,
  workflowId: string,
  cursorId?: string
): Promise<WorkflowRevisionPageRecord[]> {
  const page = (await prisma.workflowRevision.findMany({
    ...(cursorId
      ? {
          cursor: {
            id: cursorId
          },
          skip: 1
        }
      : {}),
    orderBy: [
      {
        version: "desc"
      },
      {
        id: "desc"
      }
    ],
    take: WORKFLOW_REVISION_PAGE_SIZE,
    where: {
      tenantId,
      workflowId
    }
  })) as WorkflowRevisionPageRecord[];

  const lastRevision = page.at(-1);
  if (!lastRevision || page.length < WORKFLOW_REVISION_PAGE_SIZE) {
    return page;
  }

  return page.concat(await listWorkflowRevisionPages(tenantId, workflowId, lastRevision.id));
}

export async function resolveScopedIdentity(tenantReference: string): Promise<ScopedIdentity> {
  const organization = await prisma.organization.findFirst({
    where: {
      OR: [{ id: tenantReference }, { tenantId: tenantReference }]
    }
  });

  if (!organization) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }

  return {
    organizationId: organization.id,
    tenantId: organization.tenantId
  };
}

export async function assertWorkflowLimit(identity: ScopedIdentity): Promise<void> {
  const snapshot = await getBillingSnapshot(identity.tenantId, 3);
  const limit = readNumericPlanLimit(snapshot.plan.limits, "workflows", 30);

  if (!Number.isFinite(limit)) {
    return;
  }

  const current = await prisma.workflow.count({
    where: {
      archivedAt: null,
      tenantId: identity.tenantId
    }
  });

  if (current >= limit) {
    throw new ProblemDetailsError({
      detail: `The active plan allows ${limit} workflows. Upgrade to create more.`,
      status: 402,
      title: "Payment Required"
    });
  }
}

export function ensureCanvasIsDag(canvas: WorkflowCanvas): void {
  validateDag({
    edges: canvas.transitions.map((transition) => ({
      route: transition.route,
      source: transition.source,
      target: transition.target
    })),
    nodes: canvas.steps.map((step) => ({
      id: step.key,
      isTrigger: "isTrigger" in step ? step.isTrigger : false,
      type: step.type
    }))
  });
}

export function getTriggerStepKey(canvas: WorkflowCanvas): string {
  const explicitTrigger = canvas.steps.find(
    (step) =>
      step.type === "TRIGGER_WEBHOOK" ||
      step.type === "TRIGGER_CRON" ||
      step.type === "TRIGGER_EVENT"
  );

  return explicitTrigger?.key ?? canvas.steps[0]!.key;
}

export function createWebhookSecret(identity: ScopedIdentity, workflowName: string): string {
  return createHash("sha256")
    .update(`${identity.tenantId}:${workflowName}:${Date.now()}:${randomUUID()}`)
    .digest("hex");
}

export async function persistCanvas(
  client: WorkflowWriteClient,
  identity: ScopedIdentity,
  workflowId: string,
  canvas: WorkflowCanvas
): Promise<void> {
  const stepIdByKey = new Map<string, string>();

  for (const step of canvas.steps) {
    const created = await client.workflowStep.create({
      data: {
        config: step.config as Prisma.InputJsonValue,
        isTrigger:
          step.type === "TRIGGER_WEBHOOK" ||
          step.type === "TRIGGER_CRON" ||
          step.type === "TRIGGER_EVENT",
        key: step.key,
        name: step.name,
        organizationId: identity.organizationId,
        tenantId: identity.tenantId,
        type: step.type,
        workflowId
      }
    });

    stepIdByKey.set(step.key, created.id);
  }

  for (const transition of canvas.transitions) {
    const sourceStepId = stepIdByKey.get(transition.source);
    const targetStepId = stepIdByKey.get(transition.target);

    if (!sourceStepId || !targetStepId) {
      throw new Error("WORKFLOW_TRANSITION_MISSING_ENDPOINT");
    }

    await client.workflowTransition.create({
      data: {
        organizationId: identity.organizationId,
        route: transition.route,
        sourceStepId,
        targetStepId,
        tenantId: identity.tenantId,
        workflowId
      }
    });
  }
}

export async function upsertCronTrigger(config: ApiConfig, workflow: {
  cronExpression: string | null;
  id: string;
  organizationId: string;
  tenantId: string;
}): Promise<void> {
  if (!workflow.cronExpression) {
    return;
  }

  await scheduleCronWorkflow(config, {
    cron: workflow.cronExpression,
    organizationId: workflow.organizationId,
    tenantId: workflow.tenantId,
    triggerPayload: {} as Prisma.InputJsonValue as Record<string, unknown>,
    triggerType: WorkflowTriggerType.CRON,
    workflowId: workflow.id
  });
}
