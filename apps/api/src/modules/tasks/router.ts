import type { ApiConfig } from "@birthub/config";
import type { z } from "zod";
import { taskEnqueuedResponseSchema, taskRequestSchema } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import { Router } from "express";

import { requireAuthenticatedSession } from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import {
  enqueueTask as defaultEnqueueTask,
  QueueBackpressureError,
  TenantQueueRateLimitError
} from "../../lib/queue.js";
import { validateBody } from "../../middleware/validate-body.js";
import { budgetService as defaultBudgetService } from "../budget/budget.service.js";
import { BudgetExceededError } from "../budget/budget.types.js";

const logger = createLogger("api");
const TASKS_ROUTES_MOUNT_MARKER = "__birthhubTasksRoutesMounted" as const;

type EnqueueTaskDependency = typeof defaultEnqueueTask;

type BudgetServiceDependency = Pick<typeof defaultBudgetService, "consumeBudget">;

type TasksRouteMountTarget = {
  use(path: string, router: ReturnType<typeof Router>): unknown;
  [TASKS_ROUTES_MOUNT_MARKER]?: boolean;
};

type TasksRouterDependencies = {
  budgetService?: BudgetServiceDependency;
  enqueueTask?: EnqueueTaskDependency;
};

export function registerTaskRoutes(
  router: ReturnType<typeof Router>,
  config: ApiConfig,
  dependencies: TasksRouterDependencies = {}
): void {
  const budgetService = dependencies.budgetService ?? defaultBudgetService;
  const enqueueTask = dependencies.enqueueTask ?? defaultEnqueueTask;

  router.post(
    "/tasks",
    requireAuthenticatedSession,
    validateBody(taskRequestSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as z.infer<typeof taskRequestSchema>;
      const organizationId = request.context.organizationId;
      const tenantId = request.context.tenantId;
      const userId = request.context.userId;

      if (!organizationId || !tenantId || !userId) {
        throw new ProblemDetailsError({
          detail: "A valid authenticated session is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      try {
        await budgetService.consumeBudget({
          actorId: userId,
          agentId: body.agentId,
          costBRL: body.estimatedCostBRL,
          executionMode: body.executionMode,
          organizationId,
          requestId: request.context.requestId,
          tenantId
        });
      } catch (error) {
        if (error instanceof BudgetExceededError) {
          throw new ProblemDetailsError({
            detail: `Agent ${error.agentId} reached 100% budget usage and is blocked.`,
            status: 402,
            title: "Budget Exceeded"
          });
        }

        throw error;
      }

      let job: { jobId: string };
      try {
        job = await enqueueTask(config, {
          agentId: body.agentId,
          approvalRequired: body.approvalRequired,
          context: {
            actorId: userId,
            jobId: request.context.requestId,
            organizationId,
            scopedAt: new Date().toISOString(),
            tenantId
          },
          estimatedCostBRL: body.estimatedCostBRL,
          executionMode: body.executionMode,
          payload: body.payload,
          requestId: request.context.requestId,
          signature: Buffer.from(`${tenantId}:${request.context.requestId}`).toString("base64url"),
          tenantId,
          type: body.type,
          userId,
          version: "1"
        });
      } catch (error) {
        if (error instanceof TenantQueueRateLimitError) {
          throw new ProblemDetailsError({
            detail: `Tenant ${error.tenantId} exceeded the queue rate limit. Retry later.`,
            status: 429,
            title: "Too Many Requests"
          });
        }

        if (error instanceof QueueBackpressureError) {
          throw new ProblemDetailsError({
            detail: `Queue backlog reached ${error.pendingJobs} pending jobs. Retry later.`,
            status: 503,
            title: "Service Unavailable"
          });
        }

        throw error;
      }

      logger.info(
        {
          jobId: job.jobId,
          requestId: request.context.requestId,
          tenantId: request.context.tenantId,
          userId: request.context.userId
        },
        "Queued task for worker processing"
      );

      response.status(202).json(
        taskEnqueuedResponseSchema.parse({
          jobId: job.jobId,
          requestId: request.context.requestId
        })
      );
    })
  );
}

export function createTasksRouter(
  config: ApiConfig,
  dependencies: TasksRouterDependencies = {}
): ReturnType<typeof Router> {
  const router = Router();
  registerTaskRoutes(router, config, dependencies);
  return router;
}

export function mountTasksRoutes(
  target: TasksRouteMountTarget,
  config: ApiConfig,
  dependencies: TasksRouterDependencies & {
    createTasksRouter?: typeof createTasksRouter;
  } = {}
): void {
  if (target[TASKS_ROUTES_MOUNT_MARKER]) {
    return;
  }

  target[TASKS_ROUTES_MOUNT_MARKER] = true;

  const createRouter = dependencies.createTasksRouter ?? createTasksRouter;
  const routerDependencies: TasksRouterDependencies = {
    ...(dependencies.budgetService === undefined
      ? {}
      : { budgetService: dependencies.budgetService }),
    ...(dependencies.enqueueTask === undefined
      ? {}
      : { enqueueTask: dependencies.enqueueTask })
  };

  target.use("/api/v1", createRouter(config, routerDependencies));
}

