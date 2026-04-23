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
    tenantReference: z.string().trim().min(1)
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
            targetUserId: target.userId
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
          tenantId: target.organization.tenantId
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
    appendAdminActionRoutes(router);
    appendAdminAuditRoutes(router);
  return router;
}

const searchSchema = z.object({
  query: z.string().trim().min(1),
  type: z.enum(["tenant", "workflow", "execution", "event", "connector"]).optional()
});

export function appendAdminSearchRoutes(router: Router) {
  router.get(
    "/api/v1/admin/search",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const { query, type } = searchSchema.parse(request.query);

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
          take: 10
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
          take: 10
        });
      }

      if (!type || type === "execution") {
        results.executions = await prisma.workflowExecution.findMany({
          where: { id: { contains: query, mode: "insensitive" } },
          take: 10
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
          take: 10
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
          input: step.input ? { _masked: true, preview: "Available in raw trace" } : null,
          output: step.output ? { _masked: true, preview: step.outputPreview } : null
        }))
      };

      response.status(200).json({ execution: maskedExecution });
    })
  );
}


export function appendAdminActionRoutes(router: Router) {
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
          diff: { originalExecutionId: executionId },
          entityId: executionId,
          entityType: "workflowExecution",
          tenantId: execution.tenantId
        }
      });

      // Usually, a replay would push back to the queue or duplicate the execution row
      // We will duplicate the row to allow fresh start without changing the old history
      const newExecution = await prisma.workflowExecution.create({
        data: {
          tenantId: execution.tenantId,
          organizationId: execution.organizationId,
          workflowId: execution.workflowId,
          workflowRevisionId: execution.workflowRevisionId,
          status: "WAITING",
          triggerEventId: execution.triggerEventId,
          triggerKey: execution.triggerKey,
          eventSource: execution.eventSource,
          actorId: actorUserId,
          triggerType: execution.triggerType,
          triggerPayload: execution.triggerPayload,
          isDryRun: execution.isDryRun,
          resumedFromExecutionId: execution.id
        }
      });

      response.status(200).json({ success: true, newExecutionId: newExecution.id });
    })
  );
}


export function appendAdminAuditRoutes(router: Router) {
  router.get(
    "/api/v1/admin/audit-logs",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        where: {
          action: { startsWith: "admin." }
        }
      });
      response.status(200).json({ logs });
    })
  );
}
