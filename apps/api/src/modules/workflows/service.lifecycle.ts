import type { ApiConfig } from "@birthub/config";
import {
  Prisma,
  prisma,
  WorkflowStatus,
  WorkflowTriggerType
} from "@birthub/database";
import { compileDslToCanvas, type WorkflowCanvas } from "@birthub/workflows-core";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import {
  assertWorkflowLimit,
  createWebhookSecret,
  ensureCanvasIsDag,
  getTriggerStepKey,
  listWorkflowRevisionPages,
  persistCanvas,
  resolveScopedIdentity,
  upsertCronTrigger,
  type ScopedIdentity
} from "./service.shared.js";
import type {
  WorkflowCreateInput,
  WorkflowRevertInput,
  WorkflowUpdateInput
} from "./schemas.js";

const WORKFLOW_LIST_LIMIT = 100;

export async function getWorkflowById(
  workflowId: string,
  tenantId: string
) {
  return prisma.workflow.findFirst({
    include: {
      executions: {
        include: {
          stepResults: {
            include: {
              step: true
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        },
        orderBy: {
          startedAt: "desc"
        },
        take: 25
      },
      steps: true,
      transitions: true
    },
    where: {
      id: workflowId,
      tenantId
    }
  });
}

export type PersistedWorkflow = Awaited<ReturnType<typeof getWorkflowById>>;
export type WorkflowRecord = NonNullable<PersistedWorkflow>;

export async function listWorkflows(tenantId: string) {
  return prisma.workflow.findMany({
    include: {
      _count: {
        select: {
          executions: true,
          steps: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: WORKFLOW_LIST_LIMIT,
    where: {
      tenantId
    }
  });
}

export async function createWorkflow(
  config: ApiConfig,
  tenantReference: string,
  input: WorkflowCreateInput
): Promise<WorkflowRecord> {
  const identity = await resolveScopedIdentity(tenantReference);
  await assertWorkflowLimit(identity);
  const canvas = input.canvas ?? (input.dsl ? compileDslToCanvas(input.dsl) : null);
  if (!canvas) {
    throw new Error("WORKFLOW_DEFINITION_REQUIRED");
  }
  ensureCanvasIsDag(canvas);

  if (input.status === WorkflowStatus.PUBLISHED) {
    getTriggerStepKey(canvas);
  }

  const workflow = await prisma.$transaction(async (tx) => {
    const created = await tx.workflow.create({
      data: {
        archivedAt: input.status === WorkflowStatus.ARCHIVED ? new Date() : null,
        cronExpression: input.cronExpression ?? null,
        definition: canvas as Prisma.InputJsonValue,
        description: input.description ?? null,
        eventTopic: input.eventTopic ?? null,
        maxDepth: input.maxDepth,
        name: input.name,
        organizationId: identity.organizationId,
        publishedAt: input.status === WorkflowStatus.PUBLISHED ? new Date() : null,
        status: input.status,
        tenantId: identity.tenantId,
        triggerConfig: input.triggerConfig as Prisma.InputJsonValue,
        triggerType: input.triggerType,
        webhookSecret:
          input.triggerType === WorkflowTriggerType.WEBHOOK
            ? createWebhookSecret(identity, input.name)
            : null
      }
    });

    const createdRevision = await tx.workflowRevision.create({
      data: {
        definition: canvas as Prisma.InputJsonValue,
        organizationId: identity.organizationId,
        tenantId: identity.tenantId,
        version: created.version,
        workflowId: created.id
      }
    });

    await persistCanvas(tx, identity, created.id, canvas, createdRevision.id);
    return created;
  });

  if (input.triggerType === WorkflowTriggerType.CRON) {
    await upsertCronTrigger(config, {
      cronExpression: workflow.cronExpression,
      id: workflow.id,
      organizationId: workflow.organizationId,
      tenantId: workflow.tenantId
    });
  }

  const persisted = await getWorkflowById(workflow.id, identity.tenantId);
  if (!persisted) {
    throw new Error("WORKFLOW_CREATE_FAILED");
  }

  return persisted;
}

async function updateWorkflowInScope(
  config: ApiConfig,
  workflowId: string,
  identity: ScopedIdentity,
  input: WorkflowUpdateInput,
  existingWorkflow?: WorkflowRecord
): Promise<WorkflowRecord> {
  const existing = existingWorkflow ?? (await getWorkflowById(workflowId, identity.tenantId));
  if (!existing) {
    throw new Error("WORKFLOW_NOT_FOUND");
  }

  if (input.canvas) {
    ensureCanvasIsDag(input.canvas);
  } else if (input.dsl) {
    ensureCanvasIsDag(compileDslToCanvas(input.dsl));
  }

  const updated = await prisma.$transaction(async (tx) => {
    const workflowUpdateData: Prisma.WorkflowUpdateInput = {};

    if (input.status === WorkflowStatus.ARCHIVED) {
      workflowUpdateData.archivedAt = new Date();
      workflowUpdateData.publishedAt = null;
      workflowUpdateData.status = WorkflowStatus.ARCHIVED;
    } else if (input.status === WorkflowStatus.PUBLISHED) {
      workflowUpdateData.archivedAt = null;
      workflowUpdateData.publishedAt = new Date();
      workflowUpdateData.status = WorkflowStatus.PUBLISHED;
    } else if (input.status === WorkflowStatus.DRAFT) {
      workflowUpdateData.archivedAt = null;
      workflowUpdateData.publishedAt = null;
      workflowUpdateData.status = WorkflowStatus.DRAFT;
    }

    if (input.cronExpression !== undefined) {
      workflowUpdateData.cronExpression = input.cronExpression;
    }

    const nextCanvas = input.canvas ?? (input.dsl ? compileDslToCanvas(input.dsl) : undefined);
    if (nextCanvas !== undefined) {
      workflowUpdateData.definition = nextCanvas as Prisma.InputJsonValue;
    }

    if (input.description !== undefined) {
      workflowUpdateData.description = input.description;
    }

    if (input.eventTopic !== undefined) {
      workflowUpdateData.eventTopic = input.eventTopic;
    }

    if (input.maxDepth !== undefined) {
      workflowUpdateData.maxDepth = input.maxDepth;
    }

    if (input.name !== undefined) {
      workflowUpdateData.name = input.name;
    }

    if (input.triggerConfig !== undefined) {
      workflowUpdateData.triggerConfig = input.triggerConfig as Prisma.InputJsonValue;
    }

    if (input.triggerType !== undefined) {
      workflowUpdateData.triggerType = input.triggerType;
    }

    if (nextCanvas) {
      workflowUpdateData.version = { increment: 1 };
    }

    const workflow = await tx.workflow.update({
      data: workflowUpdateData,
      where: {
        id: workflowId
      }
    });

    if (nextCanvas) {
      const createdRevision = await tx.workflowRevision.create({
        data: {
          definition: nextCanvas as Prisma.InputJsonValue,
          organizationId: identity.organizationId,
          tenantId: identity.tenantId,
          version: workflow.version,
          workflowId: workflow.id
        }
      });

      await tx.workflowTransition.deleteMany({
        where: {
          workflowId
        }
      });
      await tx.workflowStep.deleteMany({
        where: {
          workflowId
        }
      });
      await persistCanvas(tx, identity, workflowId, nextCanvas, createdRevision.id);
    }

    return workflow;
  });

  if ((input.triggerType ?? existing.triggerType) === WorkflowTriggerType.CRON) {
    await upsertCronTrigger(config, {
      cronExpression: updated.cronExpression,
      id: updated.id,
      organizationId: updated.organizationId,
      tenantId: updated.tenantId
    });
  }

  const persisted = await getWorkflowById(workflowId, identity.tenantId);
  if (!persisted) {
    throw new Error("WORKFLOW_NOT_FOUND_AFTER_UPDATE");
  }

  return persisted;
}

export async function updateWorkflow(
  config: ApiConfig,
  workflowId: string,
  tenantReference: string,
  input: WorkflowUpdateInput
): Promise<WorkflowRecord> {
  const identity = await resolveScopedIdentity(tenantReference);
  return updateWorkflowInScope(config, workflowId, identity, input);
}

export async function archiveWorkflow(
  workflowId: string,
  tenantReference: string
): Promise<void> {
  const identity = await resolveScopedIdentity(tenantReference);
  await prisma.workflow.updateMany({
    data: {
      archivedAt: new Date(),
      status: WorkflowStatus.ARCHIVED
    },
    where: {
      id: workflowId,
      tenantId: identity.tenantId
    }
  });
}

export async function getWorkflowRevisions(workflowId: string, tenantReference: string) {
  const identity = await resolveScopedIdentity(tenantReference);
  return listWorkflowRevisionPages(identity.tenantId, workflowId);
}

export async function revertWorkflow(
  config: ApiConfig,
  workflowId: string,
  tenantReference: string,
  input: WorkflowRevertInput
): Promise<WorkflowRecord> {
  const identity = await resolveScopedIdentity(tenantReference);
  const existing = await getWorkflowById(workflowId, identity.tenantId);
  if (!existing) {
    throw new ProblemDetailsError({
      detail: "Workflow not found for this tenant.",
      status: 404,
      title: "Not Found"
    });
  }

  const revision = await prisma.workflowRevision.findUnique({
    where: {
      workflowId_version: {
        version: input.version,
        workflowId
      }
    }
  });

  if (!revision || revision.tenantId !== identity.tenantId) {
    throw new ProblemDetailsError({
      detail: "Workflow revision not found for this tenant.",
      status: 404,
      title: "Not Found"
    });
  }

  const canvas = revision.definition as WorkflowCanvas;

  return updateWorkflowInScope(
    config,
    workflowId,
    identity,
    {
      canvas,
      status: WorkflowStatus.DRAFT
    },
    existing
  );
}
