import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import { ProblemDetailsError } from "../src/lib/problem-details.js";
import {
  createConnectSession,
  exchangeConnectorAuthorizationCode,
  finalizeConnectSession
} from "../src/modules/connectors/service.oauth.js";
import { createTestApiConfig } from "./test-config.js";
import { stubMethod } from "./http-test-helpers.js";

type TestConnectorAccount = {
  _count: {
    threads: number;
  };
  accountKey: string;
  authType: string;
  connectedAt: Date | null;
  credentials: Array<{
    credentialType: string;
    encryptedValue: string;
    expiresAt: Date | null;
  }>;
  displayName: string | null;
  externalAccountId: string | null;
  id: string;
  lastSyncAt: Date | null;
  metadata: Record<string, unknown> | null;
  organizationId: string;
  provider: string;
  scopes: unknown;
  status: string;
  syncCursors: unknown[];
  tenantId: string;
  threads: unknown[];
  updatedAt: Date;
};

function withConnectorEncryptionEnv(): () => void {
  const previous = {
    AUTH_MFA_ENCRYPTION_KEY: process.env.AUTH_MFA_ENCRYPTION_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_URL: process.env.REDIS_URL
  };

  process.env.AUTH_MFA_ENCRYPTION_KEY = "test-mfa-encryption-key";
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/birthub_test";
  process.env.NODE_ENV = "test";
  process.env.REDIS_URL = "redis://localhost:6379";

  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (typeof value === "string") {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    }
  };
}

function createTestConnectorAccount(
  patch: Partial<TestConnectorAccount> = {}
): TestConnectorAccount {
  return {
    _count: {
      threads: 0
    },
    accountKey: "primary",
    authType: "oauth",
    connectedAt: null,
    credentials: [],
    displayName: null,
    externalAccountId: null,
    id: "conn_hubspot_1",
    lastSyncAt: null,
    metadata: null,
    organizationId: "org_1",
    provider: "hubspot",
    scopes: ["crm.objects.companies.read"],
    status: "pending",
    syncCursors: [],
    tenantId: "tenant_1",
    threads: [],
    updatedAt: new Date("2026-04-21T12:00:00.000Z"),
    ...patch
  };
}

void test("exchangeConnectorAuthorizationCode exchanges HubSpot auth codes for tokens", async () => {
  const originalFetch = globalThis.fetch;
  const recorded: {
    body?: string;
    headers?: HeadersInit;
    method?: string;
    url?: string;
  } = {};

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    recorded.url = String(input);
    recorded.body = typeof init?.body === "string" ? init.body : undefined;
    recorded.headers = init?.headers;
    recorded.method = init?.method;

    return new Response(
      JSON.stringify({
        access_token: "hubspot-access-token",
        expires_in: 1800,
        refresh_token: "hubspot-refresh-token"
      }),
      {
        headers: {
          "content-type": "application/json"
        },
        status: 200
      }
    );
  }) as typeof fetch;

  try {
    const result = await exchangeConnectorAuthorizationCode({
      code: "auth-code-123",
      config: createTestApiConfig({
        HUBSPOT_CLIENT_ID: "hubspot-client-id",
        HUBSPOT_CLIENT_SECRET: "hubspot-client-secret",
        HUBSPOT_REDIRECT_URI: "https://birthhub.local/api/v1/connectors/hubspot/callback"
      }),
      provider: "hubspot"
    });

    assert.equal(recorded.method, "POST");
    assert.equal(recorded.url, "https://api.hubapi.com/oauth/v1/token");

    const headers = new Headers(recorded.headers);
    assert.equal(headers.get("content-type"), "application/x-www-form-urlencoded");

    const body = new URLSearchParams(recorded.body);
    assert.equal(body.get("client_id"), "hubspot-client-id");
    assert.equal(body.get("client_secret"), "hubspot-client-secret");
    assert.equal(body.get("code"), "auth-code-123");
    assert.equal(body.get("grant_type"), "authorization_code");
    assert.equal(
      body.get("redirect_uri"),
      "https://birthhub.local/api/v1/connectors/hubspot/callback"
    );

    assert.equal(result.accessToken, "hubspot-access-token");
    assert.equal(result.refreshToken, "hubspot-refresh-token");
    assert.ok(result.expiresAt);
    assert.equal(Number.isNaN(Date.parse(result.expiresAt)), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("exchangeConnectorAuthorizationCode includes Microsoft scopes in token redemption", async () => {
  const originalFetch = globalThis.fetch;
  let recordedBody = "";

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    recordedBody = typeof init?.body === "string" ? init.body : "";

    return new Response(
      JSON.stringify({
        access_token: "ms-access-token",
        scope: "offline_access Calendars.ReadWrite"
      }),
      {
        headers: {
          "content-type": "application/json"
        },
        status: 200
      }
    );
  }) as typeof fetch;

  try {
    const result = await exchangeConnectorAuthorizationCode({
      code: "ms-code-123",
      config: createTestApiConfig({
        MICROSOFT_CLIENT_ID: "microsoft-client-id",
        MICROSOFT_CLIENT_SECRET: "microsoft-client-secret",
        MICROSOFT_REDIRECT_URI: "https://birthhub.local/api/v1/connectors/microsoft-graph/callback"
      }),
      provider: "microsoft-graph",
      requestedScopes: ["offline_access", "Calendars.ReadWrite"]
    });

    const body = new URLSearchParams(recordedBody);
    assert.equal(body.get("scope"), "offline_access Calendars.ReadWrite");
    assert.deepEqual(result.scopes, ["offline_access", "Calendars.ReadWrite"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("exchangeConnectorAuthorizationCode surfaces provider token exchange failures", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "refresh token is invalid, expired or revoked"
      }),
      {
        headers: {
          "content-type": "application/json"
        },
        status: 400
      }
    )) as typeof fetch;

  try {
    await assert.rejects(
      exchangeConnectorAuthorizationCode({
        code: "bad-code",
        config: createTestApiConfig({
          HUBSPOT_CLIENT_ID: "hubspot-client-id",
          HUBSPOT_CLIENT_SECRET: "hubspot-client-secret",
          HUBSPOT_REDIRECT_URI: "https://birthhub.local/api/v1/connectors/hubspot/callback"
        }),
        provider: "hubspot"
      }),
      (error: unknown) =>
        error instanceof ProblemDetailsError &&
        error.status === 502 &&
        error.detail === "refresh token is invalid, expired or revoked"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("OAuth connect callback exchanges code and persists canonical active credentials", async () => {
  const restoreEnv = withConnectorEncryptionEnv();
  const originalFetch = globalThis.fetch;
  const account = createTestConnectorAccount();
  const upsertedCredentials: Array<{
    credentialType: string;
    encryptedValue: string;
    expiresAt: Date | null;
  }> = [];

  const restores = [
    stubMethod(prisma.connectorAccount, "upsert", (args: { create: TestConnectorAccount }) => {
      account.metadata = args.create.metadata;
      account.scopes = args.create.scopes;
      account.status = args.create.status;
      return Promise.resolve(account);
    }),
    stubMethod(prisma.connectorAccount, "findFirst", (args: { where?: Record<string, unknown> }) => {
      assert.equal(args.where?.tenantId, "tenant_1");
      return Promise.resolve(account);
    }),
    stubMethod(prisma.connectorAccount, "update", (args: { data: Partial<TestConnectorAccount> }) => {
      Object.assign(account, args.data);
      return Promise.resolve(account);
    }),
    stubMethod(
      prisma.connectorCredential,
      "upsert",
      (args: {
        create: {
          credentialType: string;
          encryptedValue: string;
          expiresAt?: Date | null;
        };
      }) => {
        upsertedCredentials.push({
          credentialType: args.create.credentialType,
          encryptedValue: args.create.encryptedValue,
          expiresAt: args.create.expiresAt ?? null
        });
        account.credentials = upsertedCredentials;
        return Promise.resolve(args.create);
      }
    )
  ];

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        access_token: "hubspot-access-token",
        expires_in: 1800,
        refresh_token: "hubspot-refresh-token",
        scope: "crm.objects.companies.read"
      }),
      {
        headers: {
          "content-type": "application/json"
        },
        status: 200
      }
    )) as typeof fetch;

  try {
    const config = createTestApiConfig({
      HUBSPOT_CLIENT_ID: "hubspot-client-id",
      HUBSPOT_CLIENT_SECRET: "hubspot-client-secret",
      HUBSPOT_REDIRECT_URI: "https://birthhub.local/api/v1/connectors/hubspot/callback"
    });
    const session = await createConnectSession({
      config,
      organizationId: "org_1",
      provider: "hubspot",
      requestId: "req_1",
      tenantId: "tenant_1",
      userId: "user_1"
    });
    const connector = await finalizeConnectSession({
      code: "auth-code-123",
      config,
      organizationId: "org_1",
      provider: "hubspot",
      state: session.state,
      tenantId: "tenant_1"
    });

    assert.equal(connector?.status, "active");
    assert.equal(account.status, "active");
    assert.deepEqual(
      upsertedCredentials.map((credential) => credential.credentialType).sort(),
      ["accessToken", "refreshToken"]
    );
    assert.equal(
      upsertedCredentials.some((credential) => credential.credentialType === "access_token"),
      false
    );
    assert.ok(
      upsertedCredentials.find((credential) => credential.credentialType === "accessToken")
        ?.encryptedValue.startsWith("enc:v1:")
    );
  } finally {
    globalThis.fetch = originalFetch;
    restores.reverse().forEach((restore) => restore());
    restoreEnv();
  }
});

void test("finalizeConnectSession refuses to activate OAuth callbacks without accessToken", async () => {
  const account = createTestConnectorAccount({
    metadata: {
      oauthState: "state_1"
    }
  });
  const restore = stubMethod(prisma.connectorAccount, "findFirst", () => Promise.resolve(account));

  try {
    await assert.rejects(
      finalizeConnectSession({
        config: createTestApiConfig(),
        organizationId: "org_1",
        provider: "hubspot",
        refreshToken: "refresh-token-only",
        state: "state_1",
        tenantId: "tenant_1"
      }),
      (error: unknown) =>
        error instanceof ProblemDetailsError &&
        error.status === 400 &&
        error.title === "Connector Token Missing"
    );
  } finally {
    restore();
  }
});
