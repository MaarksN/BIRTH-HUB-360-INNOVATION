// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import { Role } from "@birthub/database";
import request from "supertest";

import { createConnectorsRouter } from "../src/modules/connectors/router.js";
import { connectorsService } from "../src/modules/connectors/service.js";
import {
  createAuthenticatedApiTestApp,
  stubMethod
} from "./http-test-helpers.js";
import { createTestApiConfig } from "./test-config.js";

function createConnectorsTestApp() {
  return createAuthenticatedApiTestApp({
    contextOverrides: {
      role: Role.ADMIN
    },
    mountPath: "/api/v1/connectors",
    router: createConnectorsRouter(createTestApiConfig())
  });
}

void test("connectors router lists connectors for the authenticated organization", async () => {
  const expectedItems = [
    {
      id: "conn_1",
      provider: "hubspot",
      status: "active"
    }
  ];
  let received: unknown = null;
  const restore = stubMethod(connectorsService, "listConnectors", (input: unknown) => {
    received = input;
    return Promise.resolve(expectedItems);
  });

  try {
    const response = await request(createConnectorsTestApp()).get("/api/v1/connectors").expect(200);

    assert.deepEqual(received, {
      organizationId: "org_1"
    });
    assert.deepEqual(response.body, {
      items: expectedItems,
      requestId: "req_1"
    });
  } finally {
    restore();
  }
});

void test("connectors router exposes provider catalog for the authenticated organization", async () => {
  const expectedItems = [
    {
      anchor: true,
      authTypes: ["oauth"],
      capabilities: ["crm", "webhook", "sync"],
      defaultAuthType: "oauth",
      description: "CRM anchor",
      displayName: "HubSpot",
      domains: ["crm"],
      implementationStage: "implemented",
      slug: "hubspot"
    }
  ];
  const restore = stubMethod(connectorsService, "listProviderCatalog", () => expectedItems);

  try {
    const response = await request(createConnectorsTestApp())
      .get("/api/v1/connectors/catalog")
      .expect(200);

    assert.deepEqual(response.body, {
      items: expectedItems,
      requestId: "req_1"
    });
  } finally {
    restore();
  }
});

void test("connectors router upserts connector payloads with tenant context", async () => {
  const expectedConnector = {
    id: "conn_1",
    provider: "hubspot",
    status: "active"
  };
  let received: unknown = null;
  const restore = stubMethod(connectorsService, "upsertConnector", (input: unknown) => {
    received = input;
    return Promise.resolve(expectedConnector);
  });

  try {
    const response = await request(createConnectorsTestApp())
      .post("/api/v1/connectors")
      .send({
        accountKey: "primary",
        credentials: {
          accessToken: {
            expiresAt: "2026-04-05T12:00:00.000Z",
            value: "secret"
          }
        },
        displayName: "HubSpot Primary",
        metadata: {
          region: "br"
        },
        provider: "hubspot",
        scopes: ["crm.objects.companies.read"],
        status: "active"
      })
      .expect(201);

    assert.deepEqual(received, {
      accountKey: "primary",
      credentials: {
        accessToken: {
          expiresAt: "2026-04-05T12:00:00.000Z",
          value: "secret"
        }
      },
      displayName: "HubSpot Primary",
      metadata: {
        region: "br"
      },
      organizationId: "org_1",
      provider: "hubspot",
      scopes: ["crm.objects.companies.read"],
      status: "active",
      tenantId: "tenant_1"
    });
    assert.deepEqual(response.body, {
      connector: expectedConnector,
      requestId: "req_1"
    });
  } finally {
    restore();
  }
});

void test("connectors router creates connect sessions with admin context", async () => {
  const expectedSession = {
    authorizationUrl: "https://example.com/oauth",
    connector: {
      id: "conn_2",
      provider: "google-workspace"
    },
    state: "state_1"
  };
  let received: Record<string, unknown> | null = null;
  const restore = stubMethod(connectorsService, "createConnectSession", (input: Record<string, unknown>) => {
    received = input;
    return Promise.resolve(expectedSession);
  });

  try {
    const response = await request(createConnectorsTestApp())
      .post("/api/v1/connectors/google-workspace/connect")
      .send({
        accountKey: "calendar-main",
        scopes: ["calendar.read", "gmail.send"]
      })
      .expect(200);

    const payload = received as Record<string, unknown> | null;
    assert.ok(payload);
    assert.equal(payload.accountKey, "calendar-main");
    assert.equal(payload.organizationId, "org_1");
    assert.equal(payload.provider, "google-workspace");
    assert.equal(payload.requestId, "req_1");
    assert.deepEqual(payload.scopes, ["calendar.read", "gmail.send"]);
    assert.equal(payload.tenantId, "tenant_1");
    assert.equal(payload.userId, "user_1");
    assert.ok(payload.config);
    assert.deepEqual(response.body, {
      authorizationUrl: expectedSession.authorizationUrl,
      connector: expectedSession.connector,
      requestId: "req_1",
      state: expectedSession.state
    });
  } finally {
    restore();
  }
});

void test("connectors router normalizes GET callback payloads before finalizing the session", async () => {
  const expectedConnector = {
    id: "conn_3",
    provider: "hubspot",
    status: "active"
  };
  let received: unknown = null;
  const restore = stubMethod(connectorsService, "finalizeConnectSession", (input: unknown) => {
    received = input;
    return Promise.resolve(expectedConnector);
  });

  try {
    const response = await request(createConnectorsTestApp())
      .get("/api/v1/connectors/hubspot/callback")
      .query({
        access_token: "access_1",
        display_name: "HubSpot Main",
        expires_at: "2026-04-05T13:00:00.000Z",
        external_account_id: "ext_1",
        refresh_token: "refresh_1",
        scope: "contacts crm.objects.companies.read",
        state: "opaque-state"
      })
      .expect(200);

    assert.deepEqual(received, {
      accessToken: "access_1",
      displayName: "HubSpot Main",
      expiresAt: "2026-04-05T13:00:00.000Z",
      externalAccountId: "ext_1",
      organizationId: "org_1",
      provider: "hubspot",
      refreshToken: "refresh_1",
      scopes: ["contacts", "crm.objects.companies.read"],
      state: "opaque-state",
      tenantId: "tenant_1"
    });
    assert.deepEqual(response.body, {
      connector: expectedConnector,
      requestId: "req_1"
    });
  } finally {
    restore();
  }
});

void test("connectors router queues sync requests with normalized provider context", async () => {
  const expectedSync = {
    implementationStage: "implemented",
    provider: "hubspot",
    queued: true,
    scope: "hubspot:contacts"
  };
  let received: Record<string, unknown> | null = null;
  const restore = stubMethod(connectorsService, "triggerSync", (input: Record<string, unknown>) => {
    received = input;
    return Promise.resolve(expectedSync);
  });

  try {
    const response = await request(createConnectorsTestApp())
      .post("/api/v1/connectors/hubspot/sync")
      .send({
        accountKey: "primary",
        cursor: {
          after: "cursor_1"
        },
        scope: "hubspot:contacts"
      })
      .expect(202);

    const payload = received as Record<string, unknown> | null;
    assert.ok(payload);
    assert.equal(payload.accountKey, "primary");
    assert.ok(payload.config);
    assert.deepEqual(payload.cursor, {
      after: "cursor_1"
    });
    assert.equal(payload.organizationId, "org_1");
    assert.equal(payload.provider, "hubspot");
    assert.equal(payload.scope, "hubspot:contacts");
    assert.equal(payload.tenantId, "tenant_1");
    assert.deepEqual(response.body, {
      requestId: "req_1",
      sync: expectedSync
    });
  } finally {
    restore();
  }
});
