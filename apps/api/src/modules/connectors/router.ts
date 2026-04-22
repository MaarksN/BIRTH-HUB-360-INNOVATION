import type { ApiConfig } from "@birthub/config";
import { Role } from "@birthub/database";
import { Router } from "express";

import { Auditable } from "../../audit/auditable.js";
import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import {
  callbackSchema,
  connectSchema,
  connectorHealthCheckSchema,
  connectorWebhookIngestSchema,
  providerSchema,
  syncSchema,
  type CallbackPayload,
  type ConnectPayload,
  type ConnectorHealthCheckPayload,
  type SyncPayload,
  type UpsertConnectorPayload,
  type ZenviaStatusWebhookPayload,
  upsertConnectorSchema,
  zenviaStatusWebhookSchema
} from "./schemas.js";
import {
  connectorsService,
  parseConnectorOauthState,
  type ConnectorProvider
} from "./service.js";

type AuthenticatedConnectorRequest = {
  context: {
    organizationId?: string | null;
    requestId: string;
    tenantId?: string | null;
    userId?: string | null;
  };
};

type ConnectorRequestContext = {
  organizationId: string;
  requestId: string;
  tenantId: string;
  userId: string;
};

type ConnectorAuditResult = {
  connectorId?: string;
  provider?: string;
  queued?: boolean;
  status?: string;
  syncId?: string;
};

function requireOrganizationContext(input: {
  organizationId?: string | null | undefined;
  tenantId?: string | null | undefined;
  userId?: string | null | undefined;
}) {
  if (!input.organizationId || !input.tenantId || !input.userId) {
    throw new ProblemDetailsError({
      detail: "Authenticated organization context is required for connector operations.",
      status: 401,
      title: "Unauthorized"
    });
  }

  return {
    organizationId: input.organizationId,
    tenantId: input.tenantId,
    userId: input.userId
  };
}

function readProvider(value: unknown): ConnectorProvider {
  return providerSchema.parse(value);
}

function requireConnectorRequestContext(
  request: AuthenticatedConnectorRequest
): ConnectorRequestContext {
  return {
    ...requireOrganizationContext({
      organizationId: request.context.organizationId,
      tenantId: request.context.tenantId,
      userId: request.context.userId
    }),
    requestId: request.context.requestId
  };
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readOptionalScopes(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const scopes = value
      .flatMap((item) => (typeof item === "string" ? item.split(/[,\s]+/) : []))
      .map((item) => item.trim())
      .filter(Boolean);

    return scopes.length > 0 ? scopes : undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const scopes = value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return scopes.length > 0 ? scopes : undefined;
}

function readObjectString(input: unknown, key: string): string | undefined {
  if (!input || typeof input !== "object" || !(key in input)) {
    return undefined;
  }

  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readObjectBoolean(input: unknown, key: string): boolean | undefined {
  if (!input || typeof input !== "object" || !(key in input)) {
    return undefined;
  }

  const value = (input as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : undefined;
}

function createConnectorMutationAudit(input: {
  action: string;
  entityType?: string;
  methods?: readonly string[];
}) {
  return Auditable<ConnectorAuditResult>({
    action: input.action,
    entityType: input.entityType ?? "connector_account",
    methods: input.methods,
    requireActor: true,
    resolveEntityId: (_request, _response, result) => {
      if (!result) {
        return undefined;
      }

      return result.connectorId ?? result.syncId ?? result.provider;
    }
  });
}

function toConnectorAuditResult(
  connector: unknown,
  fallbackProvider?: ConnectorProvider
): ConnectorAuditResult {
  const connectorId = readObjectString(connector, "id");
  const provider = readObjectString(connector, "provider") ?? fallbackProvider;
  const status = readObjectString(connector, "status");

  return {
    ...(connectorId ? { connectorId } : {}),
    ...(provider ? { provider } : {}),
    ...(status ? { status } : {})
  };
}

function buildCallbackPayload(input: Record<string, unknown>) {
  const legacyOauthKeys = [
    "access_token",
    "account_key",
    "display_name",
    "expires_at",
    "external_account_id",
    "refresh_token",
    "scope"
  ] as const;

  const usedLegacyOauthKey = legacyOauthKeys.find((key) => key in input);
  if (usedLegacyOauthKey) {
    throw new ProblemDetailsError({
      detail: `Legacy OAuth callback field '${usedLegacyOauthKey}' is no longer accepted. Use canonical connector fields.`,
      status: 400,
      title: "Connector OAuth Callback Invalid"
    });
  }

  return callbackSchema.parse({
    accessToken: readOptionalString(input.accessToken),
    accountKey: readOptionalString(input.accountKey),
    code: readOptionalString(input.code),
    displayName: readOptionalString(input.displayName),
    expiresAt: readOptionalString(input.expiresAt),
    externalAccountId: readOptionalString(input.externalAccountId),
    refreshToken: readOptionalString(input.refreshToken),
    scopes: readOptionalScopes(input.scopes),
    state: readOptionalString(input.state)
  });
}

function resolveCallbackContext(input: {
  organizationId?: string | null | undefined;
  provider: ConnectorProvider;
  state: string;
  tenantId?: string | null | undefined;
}) {
  if (input.organizationId && input.tenantId) {
    return {
      accountKey: undefined,
      organizationId: input.organizationId,
      tenantId: input.tenantId
    };
  }

  const parsedState = parseConnectorOauthState(input.state);
  if (parsedState.provider !== input.provider) {
    throw new ProblemDetailsError({
      detail: `Connector OAuth state was issued for provider '${parsedState.provider}', not '${input.provider}'.`,
      status: 409,
      title: "Connector State Mismatch"
    });
  }

  return {
    accountKey: parsedState.accountKey,
    organizationId: parsedState.organizationId,
    tenantId: parsedState.tenantId
  };
}

function buildUpsertConnectorInput(
  payload: UpsertConnectorPayload,
  context: ConnectorRequestContext
) {
  return {
    ...(payload.accountKey ? { accountKey: payload.accountKey } : {}),
    ...(payload.authType ? { authType: payload.authType } : {}),
    ...(payload.credentials ? { credentials: payload.credentials } : {}),
    ...(payload.displayName ? { displayName: payload.displayName } : {}),
    ...(payload.externalAccountId ? { externalAccountId: payload.externalAccountId } : {}),
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
    organizationId: context.organizationId,
    provider: payload.provider,
    ...(payload.scopes ? { scopes: payload.scopes } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    tenantId: context.tenantId
  };
}

function buildConnectSessionInput(input: {
  config: ApiConfig;
  context: ConnectorRequestContext;
  payload: ConnectPayload;
  provider: ConnectorProvider;
}) {
  return {
    ...(input.payload.accountKey ? { accountKey: input.payload.accountKey } : {}),
    config: input.config,
    organizationId: input.context.organizationId,
    provider: input.provider,
    requestId: input.context.requestId,
    ...(input.payload.scopes ? { scopes: input.payload.scopes } : {}),
    tenantId: input.context.tenantId,
    userId: input.context.userId
  };
}

function buildFinalizeConnectSessionInput(input: {
  callbackContext: ReturnType<typeof resolveCallbackContext>;
  config: ApiConfig;
  payload: CallbackPayload;
  provider: ConnectorProvider;
}) {
  return {
    ...(input.payload.accountKey || input.callbackContext.accountKey
      ? { accountKey: input.payload.accountKey ?? input.callbackContext.accountKey }
      : {}),
    ...(input.payload.accessToken ? { accessToken: input.payload.accessToken } : {}),
    ...(input.payload.code ? { code: input.payload.code } : {}),
    config: input.config,
    ...(input.payload.displayName ? { displayName: input.payload.displayName } : {}),
    ...(input.payload.expiresAt ? { expiresAt: input.payload.expiresAt } : {}),
    ...(input.payload.externalAccountId ? { externalAccountId: input.payload.externalAccountId } : {}),
    organizationId: input.callbackContext.organizationId,
    provider: input.provider,
    ...(input.payload.refreshToken ? { refreshToken: input.payload.refreshToken } : {}),
    ...(input.payload.scopes ? { scopes: input.payload.scopes } : {}),
    state: input.payload.state,
    tenantId: input.callbackContext.tenantId
  };
}

function buildTriggerSyncInput(input: {
  config: ApiConfig;
  context: ConnectorRequestContext;
  payload: SyncPayload;
  provider: ConnectorProvider;
}) {
  return {
    ...(input.payload.accountKey ? { accountKey: input.payload.accountKey } : {}),
    config: input.config,
    ...(input.payload.cursor ? { cursor: input.payload.cursor } : {}),
    organizationId: input.context.organizationId,
    provider: input.provider,
    ...(input.payload.scope ? { scope: input.payload.scope } : {}),
    tenantId: input.context.tenantId
  };
}

function buildHealthCheckInput(input: {
  context: ConnectorRequestContext;
  payload: ConnectorHealthCheckPayload;
  provider: ConnectorProvider;
}) {
  return {
    ...(input.payload.accountKey ? { accountKey: input.payload.accountKey } : {}),
    organizationId: input.context.organizationId,
    provider: input.provider,
    tenantId: input.context.tenantId
  };
}

async function handleConnectorCallbackResponse(input: {
  config: ApiConfig;
  provider: ConnectorProvider;
  request: {
    context: {
      organizationId?: string | null;
      requestId: string;
      tenantId?: string | null;
    };
  };
  response: {
    json(body: unknown): void;
    status(code: number): { json(body: unknown): void };
  };
  payload: CallbackPayload;
}): Promise<ConnectorAuditResult> {
  const callbackContext = resolveCallbackContext({
    organizationId: input.request.context.organizationId,
    provider: input.provider,
    state: input.payload.state,
    tenantId: input.request.context.tenantId
  });
  const connector = await connectorsService.finalizeConnectSession(
    buildFinalizeConnectSessionInput({
      callbackContext,
      config: input.config,
      payload: input.payload,
      provider: input.provider
    })
  );

  input.response.status(200).json({
    connector,
    requestId: input.request.context.requestId
  });

  return toConnectorAuditResult(connector, input.provider);
}

function registerListRoute(router: Router): void {
  router.get(
    "/",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const context = requireConnectorRequestContext(request);
      const items = await connectorsService.listConnectors({
        organizationId: context.organizationId,
        tenantId: context.tenantId
      });

      response.status(200).json({
        items,
        requestId: context.requestId
      });
    })
  );
}

function registerCatalogRoute(router: Router): void {
  router.get(
    "/catalog",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const context = requireConnectorRequestContext(request);
      const items = connectorsService.listProviderCatalog();

      response.status(200).json({
        items,
        requestId: context.requestId
      });
    })
  );
}

function registerUpsertRoute(router: Router): void {
  router.post(
    "/",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createConnectorMutationAudit({
        action: "connector.upserted"
      })(async (request, response) => {
        const payload = upsertConnectorSchema.parse(request.body ?? {});
        const context = requireConnectorRequestContext(request);
        const connector = await connectorsService.upsertConnector(
          buildUpsertConnectorInput(payload, context)
        );

        response.status(201).json({
          connector,
          requestId: context.requestId
        });

        return toConnectorAuditResult(connector, payload.provider);
      })
    )
  );
}

function registerConnectRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/:provider/connect",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createConnectorMutationAudit({
        action: "connector.connect_started"
      })(async (request, response) => {
        const payload = connectSchema.parse(request.body ?? {});
        const provider = readProvider(request.params.provider);
        const context = requireConnectorRequestContext(request);
        const session = await connectorsService.createConnectSession(
          buildConnectSessionInput({
            config,
            context,
            payload,
            provider
          })
        );

        response.status(200).json({
          authorizationUrl: session.authorizationUrl,
          connector: session.connector,
          requestId: context.requestId,
          state: session.state
        });

        return toConnectorAuditResult(session.connector, provider);
      })
    )
  );
}

function registerPostCallbackRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/:provider/callback",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createConnectorMutationAudit({
        action: "connector.connected",
        methods: ["GET", "POST"]
      })(async (request, response) => {
        const payload = callbackSchema.parse(request.body ?? {});
        const provider = readProvider(request.params.provider);

        return handleConnectorCallbackResponse({
          config,
          payload,
          provider,
          request,
          response
        });
      })
    )
  );
}

function registerGetCallbackRoute(router: Router, config: ApiConfig): void {
  router.get(
    "/:provider/callback",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createConnectorMutationAudit({
        action: "connector.connected",
        methods: ["GET", "POST"]
      })(async (request, response) => {
        const payload = buildCallbackPayload(request.query as Record<string, unknown>);
        const provider = readProvider(request.params.provider);

        return handleConnectorCallbackResponse({
          config,
          payload,
          provider,
          request,
          response
        });
      })
    )
  );
}

function registerSyncRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/:provider/sync",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createConnectorMutationAudit({
        action: "connector.sync_requested",
        entityType: "connector_sync"
      })(async (request, response) => {
        const payload = syncSchema.parse(request.body ?? {});
        const provider = readProvider(request.params.provider);
        const context = requireConnectorRequestContext(request);
        const sync = await connectorsService.triggerSync(
          buildTriggerSyncInput({
            config,
            context,
            payload,
            provider
          })
        );

        response.status(202).json({
          requestId: context.requestId,
          sync
        });

        return {
          provider,
          queued: readObjectBoolean(sync, "queued"),
          ...(readObjectString(sync, "id") ? { syncId: readObjectString(sync, "id") } : {})
        };
      })
    )
  );
}

function registerHealthCheckRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/:provider/health",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createConnectorMutationAudit({
        action: "connector.health_checked"
      })(async (request, response) => {
        const payload = connectorHealthCheckSchema.parse(request.body ?? {});
        const provider = readProvider(request.params.provider);
        const context = requireConnectorRequestContext(request);
        const health = await connectorsService.checkHealth({
          config,
          ...buildHealthCheckInput({
            context,
            payload,
            provider
          })
        });

        response.status(200).json({
          health,
          requestId: context.requestId
        });

        return {
          provider,
          status: readObjectString(health, "status")
        };
      })
    )
  );
}

function registerWebhookIngestRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/webhooks/:provider",
    asyncHandler(async (request, response) => {
      const payload = connectorWebhookIngestSchema.parse(request.body ?? {});
      const provider = readProvider(request.params.provider);
      const result = await connectorsService.ingestWebhook({
        config,
        payload,
        provider,
        signature: readOptionalString(request.header("x-birthhub-signature")),
        trustedContext:
          request.context.organizationId && request.context.tenantId
            ? {
                organizationId: request.context.organizationId,
                tenantId: request.context.tenantId
              }
            : undefined
      });

      response.status(202).json({
        requestId: request.context.requestId,
        webhook: result
      });
    })
  );
}

function registerZenviaStatusWebhookRoute(router: Router, config: ApiConfig): void {
  router.post(
    "/webhooks/zenvia/:connectorAccountId/status",
    asyncHandler(async (request, response) => {
      const payload = zenviaStatusWebhookSchema.parse(request.body ?? {}) as ZenviaStatusWebhookPayload;
      const connectorAccountId = readOptionalString(request.params.connectorAccountId);

      if (!connectorAccountId) {
        throw new ProblemDetailsError({
          detail: "Connector account id is required for the Zenvia status webhook.",
          status: 400,
          title: "Invalid Connector Webhook"
        });
      }

      const webhook = await connectorsService.ingestZenviaStatusWebhook({
        config,
        connectorAccountId,
        payload,
        webhookSecret: readOptionalString(request.header("x-zenvia-webhook-secret"))
      });

      response.status(200).json({
        requestId: request.context.requestId,
        webhook
      });
    })
  );
}

export function createConnectorsRouter(config: ApiConfig): Router {
  const router = Router();
  registerCatalogRoute(router);
  registerListRoute(router);
  registerUpsertRoute(router);
  registerZenviaStatusWebhookRoute(router, config);
  registerWebhookIngestRoute(router, config);
  registerConnectRoute(router, config);
  router.use("/:provider/callback", requireAuthenticatedSession);
  registerPostCallbackRoute(router, config);
  registerGetCallbackRoute(router, config);
  registerHealthCheckRoute(router, config);
  registerSyncRoute(router, config);

  return router;
}
