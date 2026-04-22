import type { ApiConfig } from "@birthub/config";
import {
  logoutResponseSchema,
  sessionListResponseSchema
} from "@birthub/config";
import { Router } from "express";

import { requireAuthenticatedSession } from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import {
  listActiveSessions,
  revokeAllSessions,
  revokeCurrentSession,
  revokeSessionById
} from "../auth/auth.service.js";
import { clearAuthCookies } from "../auth/cookies.js";

function readSessionId(params: Record<string, string | string[] | undefined>): string {
  const value = params.sessionId;

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value) && value[0]) {
    return value[0];
  }

  throw new ProblemDetailsError({
    detail: "A valid session id is required.",
    status: 400,
    title: "Bad Request"
  });
}

export function createSessionsRouter(config: ApiConfig): Router {
  const router = Router();

  router.get(
    "/sessions",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
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

      const sessions = await listActiveSessions({
        organizationId,
        tenantId,
        userId
      });

      response.status(200).json(
        sessionListResponseSchema.parse({
          items: sessions.map((session) => ({
            id: session.id,
            ipAddress: session.ipAddress,
            lastActivityAt: session.lastActivityAt.toISOString(),
            userAgent: session.userAgent
          })),
          requestId: request.context.requestId
        })
      );
    })
  );

  router.delete(
    "/sessions/:sessionId",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
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

      const sessionId = readSessionId(request.params);

      if (request.context.sessionId === sessionId) {
        await revokeCurrentSession(sessionId);
        clearAuthCookies(response, config);
        response.status(200).json(
          logoutResponseSchema.parse({
            requestId: request.context.requestId,
            revokedSessions: 1
          })
        );
        return;
      }

      const revokedSessions = await revokeSessionById({
        organizationId,
        sessionId,
        tenantId,
        userId
      });

      response.status(200).json(
        logoutResponseSchema.parse({
          requestId: request.context.requestId,
          revokedSessions
        })
      );
    })
  );

  const logoutAllHandler = asyncHandler(async (request, response) => {
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

    const revokedSessions = await revokeAllSessions({
      organizationId,
      tenantId,
      userId
    });

    clearAuthCookies(response, config);
    response.status(200).json(
      logoutResponseSchema.parse({
        requestId: request.context.requestId,
        revokedSessions
      })
    );
  });

  router.post("/sessions/logout-all", requireAuthenticatedSession, logoutAllHandler);
  router.post("/auth/logout-all", requireAuthenticatedSession, logoutAllHandler);

  return router;
}
