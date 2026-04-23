import { createHash } from "node:crypto";

import type { ApiConfig } from "@birthub/config";
import type { z } from "zod";
import {
  authIntrospectionResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  logoutResponseSchema,
  mfaVerifyRequestSchema,
  refreshRequestSchema,
  refreshResponseSchema
} from "@birthub/config";
import { prisma } from "@birthub/database";
import { createLogger } from "@birthub/logger";
import { Router } from "express";
import { z as zod } from "zod";

import { enqueueAuditEvent } from "../../audit/buffer.js";
import { requireAuthenticatedSession } from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import type { RequestContext } from "../../middleware/request-context.js";
import { createLoginRateLimitMiddleware } from "../../middleware/rate-limit.js";
import { validateBody } from "../../middleware/validate-body.js";
import {
  enableMfaForUser,
  introspectApiKey,
  loginWithPassword,
  refreshSession,
  resolveOrganizationId,
  revokeCurrentSession,
  setupMfaForUser,
  verifyMfaChallenge
} from "./auth.service.js";
import { clearAuthCookies, setAuthCookies } from "./cookies.js";

const AUTH_ROUTES_MOUNT_MARKER = "__birthhubAuthRoutesMounted" as const;

export const AUTH_ROUTER_BASE_PATH = "/api/v1/auth";
const authLogger = createLogger("auth-router");

const enableMfaRequestSchema = zod
  .object({
    totpCode: zod.string().regex(/^\d{6}$/)
  })
  .strict();

type MfaChallengeEnvelope = {
  challengeExpiresAt: Date;
  challengeToken: string;
};

type SessionEnvelope = {
  organizationId: string;
  sessionId: string;
  tenantId: string;
  tokens: {
    csrfToken: string;
    expiresAt: Date;
    refreshToken: string;
    token: string;
  };
  userId: string;
};

type AuthRouteMountTarget = {
  use(path: string, router: ReturnType<typeof Router>): unknown;
  [AUTH_ROUTES_MOUNT_MARKER]?: boolean;
};

function createUnauthorizedError(detail = "A valid authenticated session is required."): ProblemDetailsError {
  return new ProblemDetailsError({
    detail,
    status: 401,
    title: "Unauthorized"
  });
}

function hashAuditIdentifier(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 16);
}

function mapKnownAuthError(error: unknown): ProblemDetailsError | null {
  const code = error instanceof Error ? error.message : "";

  switch (code) {
    case "INVALID_CREDENTIALS":
      return createUnauthorizedError("Invalid email, password or organization reference.");
    case "ACCOUNT_SUSPENDED":
      return new ProblemDetailsError({
        detail: "The account is suspended.",
        status: 403,
        title: "Forbidden"
      });
    case "INVALID_MFA_CHALLENGE":
    case "MFA_CHALLENGE_EXPIRED":
    case "INVALID_MFA_CODE":
      return createUnauthorizedError("MFA challenge is invalid or expired.");
    case "MFA_CODE_ALREADY_USED":
      return new ProblemDetailsError({
        detail: "MFA challenge was already used.",
        status: 409,
        title: "Conflict"
      });
    case "MFA_NOT_CONFIGURED":
      return new ProblemDetailsError({
        detail: "MFA is not configured for this account.",
        status: 409,
        title: "Conflict"
      });
    default:
      return null;
  }
}

function auditLoginSuccess(input: {
  ipAddress: string | null;
  organizationId: string;
  sessionId: string;
  tenantId: string;
  userAgent: string | null;
  userId: string;
}): void {
  enqueueAuditEvent({
    action: "auth.login.succeeded",
    actorId: input.userId,
    diff: {
      authType: "session",
      organizationId: input.organizationId
    },
    entityId: input.sessionId,
    entityType: "session",
    ip: input.ipAddress,
    tenantId: input.tenantId,
    userAgent: input.userAgent
  });
}

function readUserAgent(request: {
  header(name: string): string | undefined;
}): string | null {
  return request.header("user-agent") ?? null;
}

function applySessionContext(
  request: {
    context: Pick<RequestContext, "authType" | "organizationId" | "sessionId" | "tenantId" | "userId">;
  },
  session: SessionEnvelope
): void {
  request.context.organizationId = session.organizationId;
  request.context.tenantId = session.tenantId;
  request.context.userId = session.userId;
  request.context.sessionId = session.sessionId;
  request.context.authType = "session";
}

function buildSessionResponse(
  requestId: string,
  session: Pick<SessionEnvelope, "sessionId" | "tenantId" | "tokens" | "userId">
) {
  return loginResponseSchema.parse({
    mfaRequired: false,
    requestId,
    session: {
      csrfToken: session.tokens.csrfToken,
      expiresAt: session.tokens.expiresAt.toISOString(),
      id: session.sessionId,
      refreshToken: session.tokens.refreshToken,
      tenantId: session.tenantId,
      token: session.tokens.token,
      userId: session.userId
    }
  });
}

function buildMfaChallengeResponse(requestId: string, challenge: MfaChallengeEnvelope) {
  return loginResponseSchema.parse({
    challengeExpiresAt: challenge.challengeExpiresAt.toISOString(),
    challengeToken: challenge.challengeToken,
    mfaRequired: true,
    requestId
  });
}

function extractApiKeyToken(request: {
  header(name: string): string | undefined;
}): string | null {
  const explicitToken = request.header("x-api-key")?.trim();

  if (explicitToken) {
    return explicitToken;
  }

  const authorization = request.header("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, credential] = authorization.split(" ");

  if (!scheme || !credential) {
    return null;
  }

  const normalizedScheme = scheme.toLowerCase();
  if (normalizedScheme !== "apikey" && normalizedScheme !== "bearer") {
    return null;
  }

  return credential;
}

function registerLoginRoute(router: ReturnType<typeof Router>, config: ApiConfig): void {
  router.post(
    "/login",
    createLoginRateLimitMiddleware(config),
    validateBody(loginRequestSchema),
    asyncHandler(async (request, response) => {
      const loginInput = loginRequestSchema.parse(request.body);
      const loginAttemptContext = {
        emailHash: hashAuditIdentifier(loginInput.email),
        event: "auth.login.attempt",
        requestId: request.context.requestId,
        tenantReference: loginInput.tenantId
      };

      try {
        const organizationId = await resolveOrganizationId(loginInput.tenantId);

        if (!organizationId) {
          authLogger.warn(
            loginAttemptContext,
            "Login rejected because the organization reference is invalid"
          );
          throw createUnauthorizedError("Invalid organization reference for login.");
        }

        const login = await loginWithPassword({
          config,
          email: loginInput.email,
          ipAddress: request.ip ?? null,
          organizationId,
          password: loginInput.password,
          userAgent: readUserAgent(request)
        });

        if (login.mfaRequired === true) {
          authLogger.info(
            {
              ...loginAttemptContext,
              event: "auth.login.mfa_required",
              organizationId
            },
            "Login accepted pending MFA verification"
          );
          response
            .status(200)
            .json(buildMfaChallengeResponse(request.context.requestId, login));
          return;
        }

        const session = login;

        applySessionContext(request, session);
        auditLoginSuccess({
          ipAddress: request.ip ?? null,
          organizationId: session.organizationId,
          sessionId: session.sessionId,
          tenantId: session.tenantId,
          userAgent: readUserAgent(request),
          userId: session.userId
        });
        authLogger.info(
          {
            event: "auth.login.succeeded",
            organizationId: session.organizationId,
            requestId: request.context.requestId,
            sessionId: session.sessionId,
            tenantId: session.tenantId,
            userId: session.userId
          },
          "Login succeeded"
        );
        setAuthCookies(response, config, session.tokens);
        response
          .status(200)
          .json(buildSessionResponse(request.context.requestId, session));
      } catch (error) {
        const authError = mapKnownAuthError(error);

        if (authError) {
          authLogger.warn(
            {
              ...loginAttemptContext,
              event: "auth.login.rejected",
              status: authError.status,
              title: authError.title
            },
            "Login rejected"
          );
          throw authError;
        }

        throw error;
      }
    })
  );
}

function registerMfaChallengeRoute(router: ReturnType<typeof Router>, config: ApiConfig): void {
  router.post(
    "/mfa/challenge",
    validateBody(mfaVerifyRequestSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as z.infer<typeof mfaVerifyRequestSchema>;
      try {
        const session = await verifyMfaChallenge({
          challengeToken: body.challengeToken,
          config,
          ipAddress: request.ip ?? null,
          ...(body.recoveryCode ? { recoveryCode: body.recoveryCode } : {}),
          ...(body.totpCode ? { totpCode: body.totpCode } : {}),
          userAgent: readUserAgent(request)
        });

        applySessionContext(request, session);
        auditLoginSuccess({
          ipAddress: request.ip ?? null,
          organizationId: session.organizationId,
          sessionId: session.sessionId,
          tenantId: session.tenantId,
          userAgent: readUserAgent(request),
          userId: session.userId
        });
        authLogger.info(
          {
            event: "auth.mfa.verified",
            organizationId: session.organizationId,
            requestId: request.context.requestId,
            sessionId: session.sessionId,
            tenantId: session.tenantId,
            userId: session.userId
          },
          "MFA challenge verified"
        );
        setAuthCookies(response, config, session.tokens);
        response
          .status(200)
          .json(buildSessionResponse(request.context.requestId, session));
      } catch (error) {
        const authError = mapKnownAuthError(error);

        if (authError) {
          authLogger.warn(
            {
              event: "auth.mfa.rejected",
              requestId: request.context.requestId,
              status: authError.status,
              title: authError.title
            },
            "MFA challenge rejected"
          );
          throw authError;
        }

        throw error;
      }
    })
  );
}

function registerRefreshRoute(router: ReturnType<typeof Router>, config: ApiConfig): void {
  router.post(
    "/refresh",
    validateBody(refreshRequestSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as z.infer<typeof refreshRequestSchema>;
      const result = await refreshSession({
        config,
        ipAddress: request.ip ?? null,
        refreshToken: body.refreshToken,
        userAgent: readUserAgent(request)
      });

      if (
        !result.tokens ||
        !result.sessionId ||
        !result.organizationId ||
        !result.tenantId ||
        !result.userId
      ) {
        throw new ProblemDetailsError({
          detail: result.breached
            ? "Refresh token reuse detected."
            : "Refresh token is invalid or expired.",
          status: result.breached ? 409 : 401,
          title: result.breached ? "Conflict" : "Unauthorized"
        });
      }

      setAuthCookies(response, config, result.tokens);
      response.status(200).json(
        refreshResponseSchema.parse({
          requestId: request.context.requestId,
          session: {
            csrfToken: result.tokens.csrfToken,
            expiresAt: result.tokens.expiresAt.toISOString(),
            id: result.sessionId,
            refreshToken: result.tokens.refreshToken,
            tenantId: result.tenantId,
            token: result.tokens.token,
            userId: result.userId
          }
        })
      );
    })
  );
}

function registerLogoutRoute(router: ReturnType<typeof Router>, config: ApiConfig): void {
  router.post(
    "/logout",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      if (!request.context.sessionId) {
        throw createUnauthorizedError();
      }

      await revokeCurrentSession(request.context.sessionId);
      clearAuthCookies(response, config);
      response.status(200).json(
        logoutResponseSchema.parse({
          requestId: request.context.requestId,
          revokedSessions: 1
        })
      );
    })
  );
}

function registerIntrospectionRoute(router: ReturnType<typeof Router>): void {
  router.get(
    "/introspect",
    asyncHandler(async (request, response) => {
      const token = extractApiKeyToken(request);

      if (!token) {
        response.status(200).json(
          authIntrospectionResponseSchema.parse({
            active: false,
            requestId: request.context.requestId,
            scopes: [],
            tenantId: null,
            userId: null
          })
        );
        return;
      }

      const introspection = await introspectApiKey(token);

      response.status(200).json(
        authIntrospectionResponseSchema.parse({
          ...introspection,
          requestId: request.context.requestId
        })
      );
    })
  );
}

function registerMfaSetupRoute(router: ReturnType<typeof Router>, config: ApiConfig): void {
  router.post(
    "/mfa/setup",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const organizationId = request.context.organizationId;
      const tenantId = request.context.tenantId;
      const userId = request.context.userId;

      if (!organizationId || !tenantId || !userId) {
        throw new ProblemDetailsError({
          detail: "Authenticated user context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });

      if (!user) {
        throw new ProblemDetailsError({
          detail: "User not found for MFA setup.",
          status: 404,
          title: "Not Found"
        });
      }

      response.status(200).json(
        await setupMfaForUser({
          config,
          email: user.email,
          userId
        })
      );
    })
  );
}

function registerMfaEnableRoute(router: ReturnType<typeof Router>, config: ApiConfig): void {
  router.post(
    "/mfa/enable",
    requireAuthenticatedSession,
    validateBody(enableMfaRequestSchema),
    asyncHandler(async (request, response) => {
      const organizationId = request.context.organizationId;
      const tenantId = request.context.tenantId;
      const userId = request.context.userId;

      if (!organizationId || !tenantId || !userId) {
        throw new ProblemDetailsError({
          detail: "Authenticated user context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const body = enableMfaRequestSchema.parse(request.body);
      const enabled = await enableMfaForUser({
        config,
        organizationId,
        tenantId,
        totpCode: body.totpCode,
        userId
      });

      if (!enabled) {
        throw new ProblemDetailsError({
          detail: "The provided TOTP code is invalid.",
          status: 400,
          title: "Bad Request"
        });
      }

      response.status(200).json({
        enabled: true,
        requestId: request.context.requestId
      });
    })
  );
}

export function registerAuthRouterRoutes(router: ReturnType<typeof Router>, config: ApiConfig): void {
  registerLoginRoute(router, config);
  registerRefreshRoute(router, config);
  registerLogoutRoute(router, config);
  registerMfaChallengeRoute(router, config);
  registerIntrospectionRoute(router);
  registerMfaSetupRoute(router, config);
  registerMfaEnableRoute(router, config);
}

export function createAuthRouter(config: ApiConfig): ReturnType<typeof Router> {
  const router = Router();
  registerAuthRouterRoutes(router, config);
  return router;
}

export function mountAuthRoutes(
  target: AuthRouteMountTarget,
  config: ApiConfig,
  dependencies: {
    createAuthRouter?: typeof createAuthRouter;
  } = {}
): void {
  if (target[AUTH_ROUTES_MOUNT_MARKER]) {
    return;
  }

  target[AUTH_ROUTES_MOUNT_MARKER] = true;
  const createRouter = dependencies.createAuthRouter ?? createAuthRouter;
  target.use(AUTH_ROUTER_BASE_PATH, createRouter(config));
}
