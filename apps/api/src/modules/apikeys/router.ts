import type { ApiConfig } from "@birthub/config";
import {
  apiKeyCreateRequestSchema,
  apiKeyCreateResponseSchema,
  apiKeyListResponseSchema
} from "@birthub/config";
import { Router } from "express";
import { Role } from "@birthub/database";

import { Auditable } from "../../audit/auditable.js";
import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { validateBody } from "../../middleware/validate-body.js";
import {
  createTenantApiKey,
  listTenantApiKeys,
  revokeTenantApiKey,
  rotateTenantApiKey
} from "../auth/auth.service.js";

type ApiKeyAuditResult = {
  id: string;
  revoked?: boolean;
};

function requireAuthScope(request: {
  context: { organizationId?: string | null; tenantId?: string | null; userId?: string | null };
}): { organizationId: string; tenantId: string; userId: string } {
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

  return {
    organizationId,
    tenantId,
    userId
  };
}

function readApiKeyId(params: Record<string, string | string[] | undefined>): string {
  const value = params.id;

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value) && value[0]) {
    return value[0];
  }

  throw new ProblemDetailsError({
    detail: "A valid API key id is required.",
    status: 400,
    title: "Bad Request"
  });
}

function createApiKeyMutationAudit(action: string) {
  return Auditable<ApiKeyAuditResult>({
    action,
    entityType: "api_key",
    requireActor: true,
    resolveEntityId: (request, _response, result) => {
      if (
        result &&
        typeof result === "object" &&
        "id" in result &&
        typeof result.id === "string" &&
        result.id.trim().length > 0
      ) {
        return result.id;
      }

      return typeof request.params.id === "string" && request.params.id.trim().length > 0
        ? request.params.id
        : undefined;
    }
  });
}

export function createApiKeysRouter(config: ApiConfig): Router {
  const router = Router();

  router.use(requireAuthenticatedSession);
  router.use(RequireRole(Role.ADMIN));

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const scope = requireAuthScope(request);
      const items = await listTenantApiKeys(scope);

      response.status(200).json(
        apiKeyListResponseSchema.parse({
          items: items.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
            scopes: item.scopes as Array<
              "agents:read" | "agents:write" | "webhooks:receive" | "workflows:trigger"
            >
          })),
          requestId: request.context.requestId
        })
      );
    })
  );

  router.post(
    "/",
    validateBody(apiKeyCreateRequestSchema),
    asyncHandler(
      createApiKeyMutationAudit("api_key.created")(async (request, response) => {
        const scope = requireAuthScope(request);
        const body = apiKeyCreateRequestSchema.parse(request.body);
        const created = await createTenantApiKey({
          config,
          label: body.label,
          organizationId: scope.organizationId,
          scopes: body.scopes,
          tenantId: scope.tenantId,
          userId: scope.userId
        });
        const payload = apiKeyCreateResponseSchema.parse({
          apiKey: created.key,
          id: created.id,
          requestId: request.context.requestId
        });

        response.status(201).json(payload);

        // Only the identifier is returned to the audit envelope to avoid logging the secret key.
        return {
          id: created.id
        };
      })
    )
  );

  router.post(
    "/:id/rotate",
    asyncHandler(
      createApiKeyMutationAudit("api_key.rotated")(async (request, response) => {
        const scope = requireAuthScope(request);
        const id = readApiKeyId(request.params);
        const rotated = await rotateTenantApiKey({
          config,
          id,
          organizationId: scope.organizationId,
          tenantId: scope.tenantId,
          userId: scope.userId
        });
        const payload = apiKeyCreateResponseSchema.parse({
          apiKey: rotated.key,
          id: rotated.id,
          requestId: request.context.requestId
        });

        response.status(200).json(payload);

        // Audit uses the replacement key id only; the materialized secret must never enter the log.
        return {
          id: rotated.id
        };
      })
    )
  );

  router.delete(
    "/:id",
    asyncHandler(
      createApiKeyMutationAudit("api_key.revoked")(async (request, response) => {
        const scope = requireAuthScope(request);
        const id = readApiKeyId(request.params);
        await revokeTenantApiKey({
          id,
          organizationId: scope.organizationId,
          tenantId: scope.tenantId,
          userId: scope.userId
        });

        response.status(200).json({
          requestId: request.context.requestId,
          revoked: true
        });

        return {
          id,
          revoked: true
        };
      })
    )
  );

  return router;
}
