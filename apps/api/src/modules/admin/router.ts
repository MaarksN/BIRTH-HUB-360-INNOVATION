import type { ApiConfig } from "@birthub/config";
import { prisma, Role } from "@birthub/database";
import { createLogger } from "@birthub/logger";
import { Router } from "express";
import { z } from "zod";

import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { createSession } from "../auth/auth.service.js";
import { setAuthCookies } from "../auth/cookies.js";

const impersonationSchema = z
  .object({
    tenantReference: z.string().trim().min(1),
    reason: z.string().trim().min(5)
  })
  .strict();
const adminLogger = createLogger("admin-router");

async function resolveImpersonationTarget(tenantReference: string) {
  const organization = await prisma.organization.findFirst({
    include: {
      memberships: {
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    where: {
      OR: [{ id: tenantReference }, { slug: tenantReference }, { tenantId: tenantReference }]
    }
  });

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Target organization not found.",
      status: 404,
      title: "Not Found"
    });
  }

  const membership =
    organization.memberships.find((item) => item.role === Role.OWNER) ??
    organization.memberships.find((item) => item.role === Role.ADMIN) ??
    organization.memberships[0];

  if (!membership) {
    throw new ProblemDetailsError({
      detail: "No active member found for impersonation.",
      status: 422,
      title: "Unprocessable Entity"
    });
  }

  return {
    organization,
    userId: membership.userId
  };
}

export function createAdminRouter(config: ApiConfig): Router {
  const router = Router();

  router.post(
    "/api/v1/admin/impersonations",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const actorUserId = request.context.userId;

      if (!actorUserId) {
        throw new ProblemDetailsError({
          detail: "Authenticated user context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const payload = impersonationSchema.parse(request.body);
      const target = await resolveImpersonationTarget(payload.tenantReference);
      const session = await createSession({
        config,
        ipAddress: request.ip ?? null,
        organizationId: target.organization.id,
        tenantId: target.organization.tenantId,
        userAgent: request.get("user-agent") ?? null,
        userId: target.userId
      });

      await prisma.auditLog.create({
        data: {
          action: "admin.impersonation.created",
          actorId: actorUserId,
          diff: {
            organizationId: target.organization.id,
            targetUserId: target.userId,
            reason: payload.reason
          },
          entityId: target.organization.id,
          entityType: "organization",
          tenantId: target.organization.tenantId
        }
      });
      adminLogger.info(
        {
          actorUserId,
          event: "admin.impersonation.created",
          organizationId: target.organization.id,
          requestId: request.context.requestId,
          targetUserId: target.userId,
          tenantId: target.organization.tenantId,
          reason: payload.reason
        },
        "Admin impersonation session created"
      );

      setAuthCookies(response, config, session.tokens);
      response.status(201).json({
        organizationId: target.organization.id,
        tenantId: target.organization.tenantId,
        userId: target.userId
      });
    })
  );

    appendAdminSearchRoutes(router);
    appendAdminExecutionRoutes(router);
    appendAdminActionRoutes(router, config);
    appendAdminAuditRoutes(router);
  return router;
}

const searchSchema = z.object({
  query: z.string().trim().min(1),
  type: z.enum(["tenant", "workflow", "execution", "event", "connector"]).optional(),
  limit: z.coerce.number().min(1).max(50).default(10)
});

export function appendAdminSearchRoutes(router: Router) {
  router.get(
    "/api/v1/admin/search",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const { query, type, limit } = searchSchema.parse(request.query);

      const results: any = {
        tenants: [],
        workflows: [],
        executions: [],
        connectors: []
      };

      if (!type || type === "tenant") {
        results.tenants = await prisma.organization.findMany({
          where: {
            OR: [
              { id: { contains: query, mode: "insensitive" } },
              { tenantId: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } }
            ]
          },
          select: { id: true, tenantId: true, name: true, slug: true },
          take: limit
        });
      }

      if (!type || type === "workflow") {
        results.workflows = await prisma.workflow.findMany({
          where: {
            OR: [
              { id: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } }
            ]
          },
          select: { id: true, name: true, status: true, tenantId: true },
          take: limit
        });
      }

      if (!type || type === "execution") {
        results.executions = await prisma.workflowExecution.findMany({
          where: { id: { contains: query, mode: "insensitive" } },
          select: { id: true, status: true, workflowId: true, tenantId: true, createdAt: true },
          take: limit
        });
      }

      if (!type || type === "connector") {
        results.connectors = await prisma.connectorAccount.findMany({
          where: {
            OR: [
              { id: { contains: query, mode: "insensitive" } },
              { provider: { contains: query, mode: "insensitive" } }
            ]
          },
          select: { id: true, provider: true, status: true, organizationId: true, tenantId: true },
          take: limit
        });
      }

      response.status(200).json({ results });
    })
  );
}


export function appendAdminExecutionRoutes(router: Router) {
  router.get(
    "/api/v1/admin/executions/:id",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const executionId = String(request.params.id);

      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          stepResults: {
            orderBy: { startedAt: "asc" }
          }
        }
      });

      if (!execution) {
        throw new ProblemDetailsError({
          detail: "Execution not found.",
          status: 404,
          title: "Not Found"
        });
      }

      // We will perform some light masking over inputs/outputs for debug
      const maskedExecution = {
        ...execution,
        stepResults: execution.stepResults.map((step) => ({
          ...step,
          input: step.input ? { _masked: true, size: JSON.stringify(step.input).length } : null,
          output: step.output ? { _masked: true, size: step.outputSize } : null
        }))
      };

      response.status(200).json({ execution: maskedExecution });
    })
  );
}


export function appendAdminActionRoutes(router: Router, config: ApiConfig) {
  router.post(
    "/api/v1/admin/executions/:id/cancel",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const executionId = String(request.params.id);
      const actorUserId = request.context.userId;

      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId }
      });

      if (!execution) {
        throw new ProblemDetailsError({
          detail: "Execution not found.",
          status: 404,
          title: "Not Found"
        });
      }

      if (execution.status !== "RUNNING" && execution.status !== "WAITING") {
        throw new ProblemDetailsError({
          detail: "Execution is not in a cancellable state.",
          status: 400,
          title: "Bad Request"
        });
      }

      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: "CANCELLED" }
      });

      await prisma.auditLog.create({
        data: {
          action: "admin.execution.cancelled",
          actorId: actorUserId!,
          diff: { status: "CANCELLED", previousStatus: execution.status },
          entityId: executionId,
          entityType: "workflowExecution",
          tenantId: execution.tenantId
        }
      });

      response.status(200).json({ success: true });
    })
  );

  router.post(
    "/api/v1/admin/executions/:id/replay",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const reason = request.body?.reason;
      if (!reason || reason.length < 5) {
        throw new ProblemDetailsError({
          detail: "A valid reason (min 5 chars) is required for replay.",
          status: 400,
          title: "Bad Request"
        });
      }
      const executionId = String(request.params.id);
      const actorUserId = request.context.userId;

      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId }
      });

      if (!execution) {
        throw new ProblemDetailsError({
          detail: "Execution not found.",
          status: 404,
          title: "Not Found"
        });
      }

      // Replay action audit
      await prisma.auditLog.create({
        data: {
          action: "admin.execution.replayed",
          actorId: actorUserId!,
          diff: { originalExecutionId: executionId, reason },
          entityId: executionId,
          entityType: "workflowExecution",
          tenantId: execution.tenantId
        }
      });


      // Switch from manual DB row creation to queue adapter for proper pipeline execution
      await import("../workflows/service.shared.js").then(m =>
        m.workflowQueueAdapter.enqueueWorkflowTrigger(config, {
          actorId: actorUserId,
          eventSource: "admin_replay",
          isDryRun: execution.isDryRun,
          organizationId: execution.organizationId,
          tenantId: execution.tenantId,
          triggerEventId: execution.triggerEventId,
          triggerPayload: (execution.triggerPayload as Record<string, unknown>) ?? {},
          triggerType: execution.triggerType,
          workflowId: execution.workflowId,
          idempotencyKey: `replay-${execution.id}-${Date.now()}`
        })
      );




      response.status(200).json({ success: true, newExecutionId: execution.id });
    })
  );
}


export function appendAdminAuditRoutes(router: Router) {
  router.get(
    "/api/v1/admin/audit-logs",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 100);
      const cursorId = request.query.cursor ? String(request.query.cursor) : undefined;
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        where: {
          action: { startsWith: "admin." }
        }
      });
      response.status(200).json({ logs });
    })
  );
}
