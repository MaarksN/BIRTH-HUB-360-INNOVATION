import { createHmac, randomUUID } from "node:crypto";

import type { ApiConfig } from "@birthub/config";
import { Role, WorkflowTriggerType } from "@birthub/database";
import { lintWorkflowSteps, workflowCanvasSchema } from "@birthub/workflows-core";
import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { validateBody } from "../../middleware/validate-body.js";
import { workflowQueueAdapter } from "./service.shared.js";
import {
  workflowCreateSchema,
  workflowRevertSchema,
  workflowRunSchema,
  workflowUpdateSchema
} from "./schemas.js";
import {
  archiveWorkflow,
  createWorkflow,
  getWorkflowById,
  getWorkflowRevisions,
  listWorkflowExecutionLineage,
  listWorkflows,
  revertWorkflow,
  runWorkflowNow,
  updateWorkflow
} from "./service.js";
import { registerWorkflowMarketplaceRoutes } from "./router.marketplace.js";

type WorkflowRouteRegistrar = (router: Router, config: ApiConfig) => void;

function isWorkflowNotPublishedError(cause: unknown): boolean {
  return cause instanceof Error && cause.message === "WORKFLOW_NOT_PUBLISHED";
}

export function requireTenantId(request: Request): string {
  const tenantId = request.context.tenantId;
  if (!tenantId) {
    throw new ProblemDetailsError({
      detail: "Tenant context is required.",
      status: 401,
      title: "Unauthorized"
    });
  }

  return tenantId;
}

function readWorkflowId(request: Request): string {
  return String(request.params.id ?? "");
}

function withStepLint<T extends { definition: unknown }>(workflow: T): T & {
  stepLint: ReturnType<typeof lintWorkflowSteps> | null;
} {
  const parsed = workflowCanvasSchema.safeParse(workflow.definition);
  if (!parsed.success) {
    return {
      ...workflow,
      stepLint: null
    };
  }

  return {
    ...workflow,
    stepLint: lintWorkflowSteps(parsed.data)
  };
}

function respondWithWorkflow(
  response: Response,
  requestId: string,
  workflow: ({ definition: unknown } & Record<string, unknown>) | null,
  status = 200
) {
  if (!workflow) {
    throw new ProblemDetailsError({
      detail: "Workflow not found.",
      status: 404,
      title: "Not Found"
    });
  }

  response.status(status).json({
    requestId,
    workflow: withStepLint(workflow)
  });
}

function registerListWorkflowsRoute(router: Router): void {
  router.get(
    "/api/v1/workflows",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const items = await listWorkflows(tenantId);

      response.status(200).json({
        items: items.map((item) => withStepLint(item)),
        requestId: request.context.requestId
      });
    })
  );
}

function registerCreateWorkflowRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/api/v1/workflows",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    validateBody(workflowCreateSchema),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const payload = workflowCreateSchema.parse(request.body);
      const workflow = await createWorkflow(config, tenantId, payload);

      if (!workflow) {
        throw new ProblemDetailsError({
          detail: "Workflow not found after creation.",
          status: 500,
          title: "Internal Server Error"
        });
      }

      respondWithWorkflow(response, request.context.requestId, workflow, 201);
    })
  );
}

function registerWorkflowLineageRoute(router: Router): void {
  router.get(
    "/api/v1/workflows/:id/executions/lineage",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const workflowId = readWorkflowId(request);
      const lineage = await listWorkflowExecutionLineage(workflowId, tenantId);

      response.status(200).json({
        lineage,
        requestId: request.context.requestId,
        workflowId
      });
    })
  );
}

function registerGetWorkflowRoute(router: Router): void {
  router.get(
    "/api/v1/workflows/:id",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const workflow = await getWorkflowById(readWorkflowId(request), tenantId);

      if (!workflow) {
        throw new ProblemDetailsError({
          detail: "Workflow not found.",
          status: 404,
          title: "Not Found"
        });
      }

      respondWithWorkflow(response, request.context.requestId, workflow);
    })
  );
}

function registerUpdateWorkflowRoute(router: Router, config: ApiConfig): void {
  router.put(
    "/api/v1/workflows/:id",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    validateBody(workflowUpdateSchema),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const workflow = await updateWorkflow(
        config,
        readWorkflowId(request),
        tenantId,
        workflowUpdateSchema.parse(request.body)
      );

      if (!workflow) {
        throw new ProblemDetailsError({
          detail: "Workflow not found after update.",
          status: 404,
          title: "Not Found"
        });
      }

      respondWithWorkflow(response, request.context.requestId, workflow);
    })
  );
}

function registerDeleteWorkflowRoute(router: Router): void {
  router.delete(
    "/api/v1/workflows/:id",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      await archiveWorkflow(readWorkflowId(request), tenantId);
      response.status(204).send();
    })
  );
}

function registerWorkflowRevisionRoutes(router: Router, config: ApiConfig): void {
  router.get(
    "/api/v1/workflows/:id/revisions",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const workflowId = readWorkflowId(request);
      const items = await getWorkflowRevisions(workflowId, tenantId);

      response.status(200).json({
        items,
        requestId: request.context.requestId,
        workflowId
      });
    })
  );

  router.post(
    "/api/v1/workflows/:id/revert",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    validateBody(workflowRevertSchema),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const workflowId = readWorkflowId(request);
      const workflow = await revertWorkflow(
        config,
        workflowId,
        tenantId,
        workflowRevertSchema.parse(request.body)
      );

      respondWithWorkflow(response, request.context.requestId, workflow);
    })
  );
}

function registerRunWorkflowRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/api/v1/workflows/:id/run",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    validateBody(workflowRunSchema),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);

      try {
        const result = await runWorkflowNow(
          config,
          readWorkflowId(request),
          tenantId,
          workflowRunSchema.parse(request.body),
          WorkflowTriggerType.MANUAL
        );

        response.status(result.mode === "async" ? 202 : 200).json({
          requestId: request.context.requestId,
          ...result
        });
      } catch (error) {
        if (isWorkflowNotPublishedError(error)) {
          throw new ProblemDetailsError({
            detail: "Only published workflows can be executed.",
            status: 409,
            title: "Conflict"
          });
        }

        throw error;
      }
    })
  );
}

function buildWebhookUrl(request: Request, workflowId: string): string {
  const host = request.header("x-forwarded-host") ?? request.header("host") ?? "localhost:3000";
  const protocol = request.header("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}/webhooks/trigger/${workflowId}`;
}

function buildSampleSignature(secret: string): string {
  return createHmac("sha256", secret)
    .update(JSON.stringify({ hello: "world" }))
    .digest("hex");
}

function registerWebhookUrlRoute(router: Router, config: ApiConfig): void {
  router.get(
    "/api/v1/workflows/:id/webhook-url",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const workflowId = readWorkflowId(request);
      const workflow = await getWorkflowById(workflowId, tenantId);

      if (!workflow || workflow.triggerType !== WorkflowTriggerType.WEBHOOK) {
        throw new ProblemDetailsError({
          detail: "Webhook workflow not found.",
          status: 404,
          title: "Not Found"
        });
      }

      response.status(200).json({
        requestId: request.context.requestId,
        sampleSignature: buildSampleSignature(
          workflow.webhookSecret ?? config.JOB_HMAC_GLOBAL_SECRET
        ),
        webhookUrl: buildWebhookUrl(request, workflow.id)
      });
    })
  );
}

const workflowTopicEventSchema = z.object({
  actorId: z.string().min(1).optional(),
  eventId: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  source: z.string().min(1).default("api")
}).strict();

function registerWorkflowEventRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/api/v1/workflows/events/:topic",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    validateBody(workflowTopicEventSchema),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const topic = String(request.params.topic ?? "");
      const parsed = workflowTopicEventSchema.parse(request.body ?? {});

      await workflowQueueAdapter.enqueueWorkflowTrigger(config, {
        actorId: parsed.actorId,
        eventSource: parsed.source,
        idempotencyKey: parsed.eventId
          ? `${parsed.source}:${topic}:${parsed.eventId}`
          : `${parsed.source}:${topic}:${randomUUID()}`,
        organizationId: request.context.organizationId ?? tenantId,
        tenantId,
        topic,
        triggerEventId: parsed.eventId,
        triggerPayload: {
          ...parsed.payload,
          ...(parsed.eventId ? { eventId: parsed.eventId } : {})
        },
        triggerType: WorkflowTriggerType.EVENT
      });

      response.status(202).json({
        accepted: true,
        eventId: parsed.eventId ?? null,
        requestId: request.context.requestId,
        tenantId,
        topic
      });
    })
  );
}

const registerCrudWorkflowRoutes: WorkflowRouteRegistrar[] = [
  (router) => registerListWorkflowsRoute(router),
  (router, config) => registerCreateWorkflowRoute(router, config),
  (router) => registerGetWorkflowRoute(router),
  (router, config) => registerUpdateWorkflowRoute(router, config),
  (router) => registerDeleteWorkflowRoute(router)
];

const registerWorkflowExecutionRoutes: WorkflowRouteRegistrar[] = [
  (router) => registerWorkflowLineageRoute(router),
  (router, config) => registerWorkflowRevisionRoutes(router, config),
  (router, config) => registerRunWorkflowRoute(router, config)
];

const registerWorkflowEventRoutes: WorkflowRouteRegistrar[] = [
  (router, config) => registerWebhookUrlRoute(router, config),
  (router, config) => registerWorkflowEventRoute(router, config)
];

function applyWorkflowRegistrars(
  router: Router,
  config: ApiConfig,
  registrars: WorkflowRouteRegistrar[]
): void {
  for (const registerRoute of registrars) {
    registerRoute(router, config);
  }
}

export function createWorkflowsRouter(config: ApiConfig): Router {
  const router = Router();

  applyWorkflowRegistrars(router, config, registerCrudWorkflowRoutes);
  applyWorkflowRegistrars(router, config, registerWorkflowExecutionRoutes);
  applyWorkflowRegistrars(router, config, registerWorkflowEventRoutes);
  registerWorkflowMarketplaceRoutes(router, config);

  return router;
}
