import assert from "node:assert/strict";
import test from "node:test";

import { prisma, type Prisma } from "@birthub/database";
import request from "supertest";

import {
  flushAuditBuffer,
  resetAuditBufferForTests
} from "../src/audit/buffer.js";
import { createApiKeysRouter } from "../src/modules/apikeys/router.js";
import {
  createAuthenticatedApiTestApp,
  stubMethod
} from "./http-test-helpers.js";
import { createTestApiConfig } from "./test-config.js";

type CapturedAuditEvent = Prisma.AuditLogCreateManyInput;

function captureAuditEvents() {
  const events: CapturedAuditEvent[] = [];
  const restore = stubMethod(
    prisma.auditLog,
    "createMany",
    (args: { data: CapturedAuditEvent[] }) => {
      events.push(...args.data);
      return Promise.resolve({
        count: args.data.length
      });
    }
  );

  return {
    events,
    restore
  };
}

async function flushSingleAuditEvent(events: CapturedAuditEvent[]): Promise<CapturedAuditEvent> {
  const flushed = await flushAuditBuffer();
  assert.equal(flushed, 1);
  assert.equal(events.length, 1);

  const [event] = events;
  assert.ok(event);
  return event;
}

void test("API key creation is audited without persisting the issued secret", async () => {
  resetAuditBufferForTests();
  const auditCapture = captureAuditEvents();
  const restores = [
    auditCapture.restore,
    stubMethod(prisma.organization, "findFirst", () =>
      Promise.resolve({
        id: "org_1",
        tenantId: "tenant_1"
      })
    ),
    stubMethod(prisma.apiKey, "create", () =>
      Promise.resolve({
        id: "key_created"
      })
    )
  ];

  try {
    const app = createAuthenticatedApiTestApp({
      mountPath: "/api/v1/apikeys",
      router: createApiKeysRouter(createTestApiConfig())
    });

    const response = await request(app)
      .post("/api/v1/apikeys")
      .set("User-Agent", "api-key-audit-test")
      .send({
        label: "CI key",
        scopes: ["agents:read"]
      })
      .expect(201);

    const body = response.body as {
      apiKey: string;
      id: string;
      requestId: string;
    };
    assert.equal(body.id, "key_created");
    assert.equal(body.requestId, "req_1");
    assert.match(body.apiKey, /^bh360_live_/);

    const event = await flushSingleAuditEvent(auditCapture.events);
    const diff = event.diff as {
      payload?: unknown;
      response?: Record<string, unknown>;
    };

    assert.equal(event.action, "api_key.created");
    assert.equal(event.actorId, "user_1");
    assert.equal(event.entityId, "key_created");
    assert.equal(event.entityType, "api_key");
    assert.equal(event.tenantId, "tenant_1");
    assert.deepEqual(diff.payload, {
      label: "CI key",
      scopes: ["agents:read"]
    });
    assert.deepEqual(diff.response, {
      id: "key_created"
    });
    assert.equal("apiKey" in (diff.response ?? {}), false);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
    resetAuditBufferForTests();
  }
});

void test("API key rotation is audited with the replacement key id only", async () => {
  resetAuditBufferForTests();
  const auditCapture = captureAuditEvents();
  const restores = [
    auditCapture.restore,
    stubMethod(prisma.apiKey, "findFirst", () =>
      Promise.resolve({
        id: "key_old",
        label: "CI key",
        organizationId: "org_1",
        prefix: "bh360_live",
        scopes: ["agents:read"],
        tenantId: "tenant_1",
        userId: "user_1"
      })
    ),
    stubMethod(
      prisma,
      "$transaction",
      async (
        callback: (transaction: {
          apiKey: {
            create: (args: unknown) => Promise<{ id: string }>;
            update: (args: unknown) => Promise<{ id: string }>;
          };
        }) => Promise<{ id: string }>
      ) =>
        callback({
          apiKey: {
            create: async () =>
              Promise.resolve({
                id: "key_rotated"
              }),
            update: async () =>
              Promise.resolve({
                id: "key_old"
              })
          }
        })
    )
  ];

  try {
    const app = createAuthenticatedApiTestApp({
      mountPath: "/api/v1/apikeys",
      router: createApiKeysRouter(createTestApiConfig())
    });

    const response = await request(app)
      .post("/api/v1/apikeys/key_old/rotate")
      .set("User-Agent", "api-key-audit-test")
      .send({})
      .expect(200);

    const body = response.body as {
      apiKey: string;
      id: string;
      requestId: string;
    };
    assert.equal(body.id, "key_rotated");
    assert.equal(body.requestId, "req_1");
    assert.match(body.apiKey, /^bh360_live_/);

    const event = await flushSingleAuditEvent(auditCapture.events);
    const diff = event.diff as {
      payload?: unknown;
      response?: Record<string, unknown>;
    };

    assert.equal(event.action, "api_key.rotated");
    assert.equal(event.actorId, "user_1");
    assert.equal(event.entityId, "key_rotated");
    assert.equal(event.entityType, "api_key");
    assert.equal(event.tenantId, "tenant_1");
    assert.deepEqual(diff.payload, {});
    assert.deepEqual(diff.response, {
      id: "key_rotated"
    });
    assert.equal("apiKey" in (diff.response ?? {}), false);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
    resetAuditBufferForTests();
  }
});

void test("API key revocation is audited against the revoked key id", async () => {
  resetAuditBufferForTests();
  const auditCapture = captureAuditEvents();
  const restores = [
    auditCapture.restore,
    stubMethod(prisma.apiKey, "updateMany", () =>
      Promise.resolve({
        count: 1
      })
    )
  ];

  try {
    const app = createAuthenticatedApiTestApp({
      mountPath: "/api/v1/apikeys",
      router: createApiKeysRouter(createTestApiConfig())
    });

    const response = await request(app)
      .delete("/api/v1/apikeys/key_old")
      .set("User-Agent", "api-key-audit-test")
      .expect(200);

    const body = response.body as {
      requestId: string;
      revoked: boolean;
    };
    assert.equal(body.requestId, "req_1");
    assert.equal(body.revoked, true);

    const event = await flushSingleAuditEvent(auditCapture.events);
    const diff = event.diff as {
      payload?: unknown;
      response?: Record<string, unknown>;
    };

    assert.equal(event.action, "api_key.revoked");
    assert.equal(event.actorId, "user_1");
    assert.equal(event.entityId, "key_old");
    assert.equal(event.entityType, "api_key");
    assert.equal(event.tenantId, "tenant_1");
    assert.equal(diff.payload, null);
    assert.deepEqual(diff.response, {
      id: "key_old",
      revoked: true
    });
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
    resetAuditBufferForTests();
  }
});
