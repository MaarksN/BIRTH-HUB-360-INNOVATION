import type { ApiConfig } from "@birthub/config";
import { getConnectorProviderDefinition } from "@birthub/integrations";
import { prisma } from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import {
  buildAuthorizationUrl,
  buildOauthState,
  getProviderOauthConfig,
  resolveConnectorAccount,
  sanitizeConnectorAccount,
  toJsonValue,
  upsertCredentials,
  type ConnectorCredentialsRecord,
  type ConnectorProvider
} from "./service.shared.js";

type OauthTokenExchangeResult = {
  accessToken: string;
  expiresAt?: string | undefined;
  refreshToken?: string | undefined;
  scopes?: string[] | undefined;
};

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readScopes(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const scopes = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    return scopes.length > 0 ? scopes : undefined;
  }

  const scopeString = readString(value);
  if (!scopeString) {
    return undefined;
  }

  const scopes = scopeString
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return scopes.length > 0 ? scopes : undefined;
}

function resolveExpiresAt(value: unknown): string | undefined {
  const seconds =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return undefined;
  }

  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function exchangeConnectorAuthorizationCode(input: {
  code: string;
  config: ApiConfig;
  provider: ConnectorProvider;
  requestedScopes?: string[] | undefined;
}): Promise<OauthTokenExchangeResult> {
  const oauth = getProviderOauthConfig(input.config, input.provider);

  if (!oauth) {
    throw new ProblemDetailsError({
      detail: `Provider '${input.provider}' is not configured for OAuth token exchange in this environment.`,
      status: 409,
      title: "Connector OAuth Not Configured"
    });
  }

  const body = new URLSearchParams({
    client_id: oauth.clientId,
    client_secret: oauth.clientSecret,
    code: input.code,
    grant_type: "authorization_code",
    redirect_uri: oauth.redirectUri
  });

  if (input.provider === "microsoft-graph") {
    const requestedScopes =
      input.requestedScopes?.length ? input.requestedScopes : oauth.defaultScopes;
    if (requestedScopes.length > 0) {
      body.set("scope", requestedScopes.join(" "));
    }
  }

  let rawBody = "";

  try {
    const response = await fetch(oauth.tokenUrl, {
      body: body.toString(),
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded"
      },
      method: "POST"
    });
    rawBody = await response.text();

    let parsedBody: unknown = null;
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody) as unknown;
      } catch {
        parsedBody = rawBody;
      }
    }

    if (!response.ok) {
      const responseBody = readObject(parsedBody);
      throw new ProblemDetailsError({
        detail:
          readString(responseBody?.error_description) ??
          readString(responseBody?.message) ??
          `Connector OAuth token exchange failed with status ${response.status}.`,
        status: 502,
        title: "Connector Token Exchange Failed"
      });
    }

    const responseBody = readObject(parsedBody);
    const accessToken = readString(responseBody?.access_token);

    if (!accessToken) {
      throw new ProblemDetailsError({
        detail: "Connector OAuth token exchange did not return an access token.",
        status: 502,
        title: "Connector Token Exchange Failed"
      });
    }

    return {
      accessToken,
      ...(resolveExpiresAt(responseBody?.expires_in)
        ? { expiresAt: resolveExpiresAt(responseBody?.expires_in) }
        : {}),
      ...(readString(responseBody?.refresh_token)
        ? { refreshToken: readString(responseBody?.refresh_token) }
        : {}),
      ...(readScopes(responseBody?.scope)
        ? { scopes: readScopes(responseBody?.scope) }
        : {})
    };
  } catch (error) {
    if (error instanceof ProblemDetailsError) {
      throw error;
    }

    throw new ProblemDetailsError({
      detail:
        error instanceof Error
          ? error.message
          : `Connector OAuth token exchange failed.${rawBody ? ` Response: ${rawBody}` : ""}`,
      status: 502,
      title: "Connector Token Exchange Failed"
    });
  }
}

export async function createConnectSession(input: {
  accountKey?: string | undefined;
  config: ApiConfig;
  organizationId: string;
  provider: ConnectorProvider;
  requestId: string;
  scopes?: string[] | undefined;
  tenantId: string;
  userId: string;
}) {
  const definition = getConnectorProviderDefinition(input.provider);
  if (definition.implementationStage === "planned") {
    throw new ProblemDetailsError({
      detail: `Provider '${input.provider}' is registered in the catalog but its native OAuth runtime has not been implemented yet.`,
      status: 409,
      title: "Connector Provider Not Implemented"
    });
  }

  if (!definition.authTypes.includes("oauth")) {
    throw new ProblemDetailsError({
      detail: `Provider '${input.provider}' does not support OAuth connect sessions.`,
      status: 409,
      title: "Connector OAuth Not Supported"
    });
  }

  const oauth = getProviderOauthConfig(input.config, input.provider);
  if (!oauth) {
    throw new ProblemDetailsError({
      detail: `Provider '${input.provider}' is not configured for OAuth in this environment.`,
      status: 409,
      title: "Connector OAuth Not Configured"
    });
  }

  const state = buildOauthState({
    accountKey: input.accountKey ?? "primary",
    organizationId: input.organizationId,
    provider: input.provider,
    requestId: input.requestId,
    tenantId: input.tenantId,
    userId: input.userId
  });
  const scopes = input.scopes?.length ? input.scopes : oauth.defaultScopes;
  const account = await prisma.connectorAccount.upsert({
    create: {
      accountKey: input.accountKey ?? "primary",
      authType: "oauth",
      metadata: toJsonValue({
        oauthState: state,
        requestedScopes: scopes
      }),
      organizationId: input.organizationId,
      provider: input.provider,
      scopes: toJsonValue(scopes),
      status: "pending",
      tenantId: input.tenantId
    },
    update: {
      metadata: toJsonValue({
        oauthState: state,
        requestedScopes: scopes
      }),
      scopes: toJsonValue(scopes),
      status: "pending"
    },
    where: {
      organizationId_provider_accountKey: {
        accountKey: input.accountKey ?? "primary",
        organizationId: input.organizationId,
        provider: input.provider
      },
      tenantId: input.tenantId
    }
  });

  return {
    authorizationUrl: buildAuthorizationUrl({
      oauth,
      provider: input.provider,
      scopes,
      state
    }),
    connector: sanitizeConnectorAccount(
      await resolveConnectorAccount({
        accountKey: account.accountKey,
        organizationId: input.organizationId,
        provider: input.provider,
        tenantId: input.tenantId
      })
    ),
    state
  };
}

export async function finalizeConnectSession(input: {
  accessToken?: string | undefined;
  accountKey?: string | undefined;
  code?: string | undefined;
  config: ApiConfig;
  displayName?: string | undefined;
  expiresAt?: string | undefined;
  externalAccountId?: string | undefined;
  organizationId: string;
  provider: ConnectorProvider;
  refreshToken?: string | undefined;
  scopes?: string[] | undefined;
  state: string;
  tenantId: string;
}) {
  const account = await resolveConnectorAccount({
    accountKey: input.accountKey,
    organizationId: input.organizationId,
    provider: input.provider,
    tenantId: input.tenantId
  });

  if (!account) {
    throw new ProblemDetailsError({
      detail: "Connector account was not initialized for this callback.",
      status: 404,
      title: "Connector Not Found"
    });
  }

  const metadata =
    account.metadata && typeof account.metadata === "object"
      ? (account.metadata as Record<string, unknown>)
      : {};
  if (metadata.oauthState !== input.state) {
    throw new ProblemDetailsError({
      detail: "Connector OAuth state validation failed.",
      status: 409,
      title: "Connector State Mismatch"
    });
  }

  let accessToken = input.accessToken;
  let expiresAt = input.expiresAt;
  let refreshToken = input.refreshToken;
  let scopes = input.scopes;

  if (!accessToken && input.code) {
    const tokenExchange = await exchangeConnectorAuthorizationCode({
      code: input.code,
      config: input.config,
      provider: input.provider,
      requestedScopes: input.scopes ?? readScopes(metadata.requestedScopes)
    });

    accessToken = tokenExchange.accessToken;
    expiresAt = expiresAt ?? tokenExchange.expiresAt;
    refreshToken = refreshToken ?? tokenExchange.refreshToken;
    scopes = scopes ?? tokenExchange.scopes;
  }

  if (!accessToken) {
    throw new ProblemDetailsError({
      detail: "Connector OAuth callback did not produce a valid accessToken.",
      status: 400,
      title: "Connector Token Missing"
    });
  }

  const credentials: ConnectorCredentialsRecord = {};
  if (accessToken) {
    credentials.accessToken = {
      ...(expiresAt ? { expiresAt } : {}),
      value: accessToken
    };
  }
  if (refreshToken) {
    credentials.refreshToken = {
      value: refreshToken
    };
  }

  await prisma.connectorAccount.update({
    data: {
      connectedAt: new Date(),
      ...(input.displayName ? { displayName: input.displayName } : {}),
      ...(input.externalAccountId ? { externalAccountId: input.externalAccountId } : {}),
      metadata: toJsonValue({
        callbackReceivedAt: new Date().toISOString(),
        requestedScopes: scopes ?? metadata.requestedScopes ?? [],
        stateValidated: true
      }),
      ...(scopes ? { scopes: toJsonValue(scopes) } : {}),
      status: "active"
    },
    where: {
      id: account.id,
      tenantId: input.tenantId
    }
  });

  if (Object.keys(credentials).length > 0) {
    await upsertCredentials({
      connectorAccountId: account.id,
      credentials,
      organizationId: input.organizationId,
      tenantId: input.tenantId
    });
  }

  return sanitizeConnectorAccount(
    await resolveConnectorAccount({
      accountKey: account.accountKey,
      organizationId: input.organizationId,
      provider: input.provider,
      tenantId: input.tenantId
    })
  );
}
