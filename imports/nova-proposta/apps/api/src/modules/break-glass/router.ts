import type { ApiConfig } from "@birthub/config";
import { prisma, Role, SessionAccessMode, SessionStatus } from "@birthub/database";
import { Router } from "express";
import { z } from "zod";

import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { readPrismaModel } from "../../lib/prisma-runtime.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { createSession } from "../auth/auth.service.js";
import { setAuthCookies } from "../auth/cookies.js";

const breakGlassGrantSchema = z
  .object({
    justification: z.string().trim().min(12),
    reason: z.string().trim().min(3),
    targetResourceId: z.string().trim().min(1).optional(),
    targetResourceType: z.string().trim().min(3).default("patient-record"),
    tenantReference: z.string().trim().min(1),
    ticketId: z.string().trim().min(3)
  })
  .strict();

type BreakGlassGrantRecord = {
  id: string;
  sessionId: string | null;
  tenantId: string;
};

type BreakGlassGrantDelegate = {
  create(args: { data: object }): Promise<BreakGlassGrantRecord>;
  findUnique(args: { where: { id: string } }): Promise<BreakGlassGrantRecord | null>;
  update(args: { data: object; where: { id: string } }): Promise<BreakGlassGrantRecord>;
};

type AuditLogDelegate = {
  create(args: { data: object }): Promise<unknown>;
};

type SessionDelegate = {
  updateMany(args: { data: object; where: object }): Promise<unknown>;
};

function readBreakGlassGrantDelegate(client: object): BreakGlassGrantDelegate {
  return readPrismaModel<BreakGlassGrantDelegate>(client, "breakGlassGrant", "the break-glass router");
}

function readAuditLogDelegate(client: object): AuditLogDelegate {
  return readPrismaModel<AuditLogDelegate>(client, "auditLog", "the break-glass router");
}

function readSessionDelegate(client: object): SessionDelegate {
  return readPrismaModel<SessionDelegate>(client, "session", "the break-glass router");
}

async function resolveBreakGlassTarget(tenantReference: string) {
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
      detail: "Target organization not found for break-glass access.",
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
      detail: "No active member is available for break-glass access.",
      status: 422,
      title: "Unprocessable Entity"
    });
  }

  return {
    organization,
    targetUserId: membership.userId
  };
}

export function createBreakGlassRouter(config: ApiConfig): Router {
  const router = Router();

  router.use("/admin/break-glass", (_request, _response, next) => {
    next(
      new ProblemDetailsError({
        detail:
          "The break-glass router is disabled because the canonical session and persistence contracts are not mounted in the active runtime.",
        status: 404,
        title: "Not Found"
      })
    );
  });

  router.post(
    "/admin/break-glass/grants",
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

      const payload = breakGlassGrantSchema.parse(request.body);
      const target = await resolveBreakGlassTarget(payload.tenantReference);
      const expiresAt = new Date(Date.now() + config.BREAK_GLASS_SESSION_TTL_MINUTES * 60_000);
      const breakGlassGrantDelegate = readBreakGlassGrantDelegate(prisma);
      const auditLogDelegate = readAuditLogDelegate(prisma);

      const grant = await breakGlassGrantDelegate.create({
        data: {
          actorId: actorUserId,
          expiresAt,
          justification: payload.justification,
          organizationId: target.organization.id,
          reason: payload.reason,
          targetResourceId: payload.targetResourceId ?? null,
          targetResourceType: payload.targetResourceType,
          tenantId: target.organization.tenantId,
          ticketId: payload.ticketId
        }
      });

      const session = await createSession({
        accessMode: SessionAccessMode.BREAK_GLASS,
        breakGlassExpiresAt: expiresAt,
        breakGlassGrantId: grant.id,
        breakGlassReason: payload.reason,
        breakGlassTicket: payload.ticketId,
        config,
        impersonatedByUserId: actorUserId,
        ipAddress: request.ip ?? null,
        organizationId: target.organization.id,
        tenantId: target.organization.tenantId,
        userAgent: request.get("user-agent") ?? null,
        userId: target.targetUserId
      });

      await breakGlassGrantDelegate.update({
        data: {
          sessionId: session.sessionId,
          usedAt: new Date()
        },
        where: {
          id: grant.id
        }
      });

      await auditLogDelegate.create({
        data: {
          action: "admin.break_glass.granted",
          actorId: actorUserId,
          diff: {
            after: {
              expiresAt: expiresAt.toISOString(),
              justification: payload.justification,
              reason: payload.reason,
              sessionId: session.sessionId,
              targetResourceId: payload.targetResourceId ?? null,
              targetResourceType: payload.targetResourceType,
              targetUserId: target.targetUserId,
              ticketId: payload.ticketId
            },
            before: {}
          },
          entityId: grant.id,
          entityType: "break_glass_grant",
          tenantId: target.organization.tenantId
        }
      });

      setAuthCookies(response, config, session.tokens);
      response.status(201).json({
        expiresAt: expiresAt.toISOString(),
        grantId: grant.id,
        organizationId: target.organization.id,
        requestId: request.context.requestId,
        sessionId: session.sessionId,
        tenantId: target.organization.tenantId,
        ticketId: payload.ticketId,
        userId: target.targetUserId
      });
    })
  );

  router.post(
    "/admin/break-glass/grants/:id/revoke",
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
      const breakGlassGrantDelegate = readBreakGlassGrantDelegate(prisma);

      const grant = await breakGlassGrantDelegate.findUnique({
        where: {
          id: String(request.params.id ?? "")
        }
      });

      if (!grant) {
        throw new ProblemDetailsError({
          detail: "Break-glass grant not found.",
          status: 404,
          title: "Not Found"
        });
      }

      await prisma.$transaction(async (tx) => {
        const transactionBreakGlassGrantDelegate = readBreakGlassGrantDelegate(tx);
        const transactionSessionDelegate = readSessionDelegate(tx);
        const transactionAuditLogDelegate = readAuditLogDelegate(tx);

        await transactionBreakGlassGrantDelegate.update({
          data: {
            revokedAt: new Date()
          },
          where: {
            id: grant.id
          }
        });

        if (grant.sessionId) {
          await transactionSessionDelegate.updateMany({
            data: {
              revokedAt: new Date(),
              status: SessionStatus.REVOKED
            },
            where: {
              id: grant.sessionId,
              revokedAt: null
            }
          });
        }

        await transactionAuditLogDelegate.create({
          data: {
            action: "admin.break_glass.revoked",
            actorId: actorUserId,
            diff: {
              after: {
                revokedAt: new Date().toISOString()
              },
              before: {
                sessionId: grant.sessionId
              }
            },
            entityId: grant.id,
            entityType: "break_glass_grant",
            tenantId: grant.tenantId
          }
        });
      });

      response.status(200).json({
        grantId: grant.id,
        requestId: request.context.requestId,
        revoked: true
      });
    })
  );

  return router;
}

