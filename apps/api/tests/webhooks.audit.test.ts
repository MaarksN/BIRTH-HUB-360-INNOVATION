import assert from "node:assert/strict";
import test from "node:test";

import { prisma, type Prisma, WebhookEndpointStatus } from "@birthub/database";
import request from "supertest";

import {
  flushAuditBuffer,
  resetAuditBufferForTests
} from "../src/audit/buffer.js";
import { createWebhooksRouter } from "../src/modules/webhooks/router.js";
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

void test("webhook endpoint creation is audited without persisting generated secrets", async () => {
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
    stubMethod(prisma.webhookEndpoint, "create", (args: { data?: Record<string, unknown> }) =>
      Promise.resolve({
        ...(args.data ?? {}),
        consecutiveFailures: 0,
        createdAt: new Date("2026-04-22T12:00:00.000Z"),
        id: "webhook_endpoint_1",
        lastDeliveredAt: null,
        lastFailureAt: null,
        status: WebhookEndpointStatus.ACTIVE,
        updatedAt: new Date("2026-04-22T12:00:00.000Z")
      })
    )
  ];

  try {
    const app = createAuthenticatedApiTestApp({
      router: createWebhooksRouter(createTestApiConfig())
    });

    const response = await request(app)
      .post("/api/v1/settings/webhooks")
      .set("User-Agent", "webhook-audit-test")
      .send({
        topics: ["workflow.completed"],
        url: "https://hooks.example.com/birthub"
      })
      .expect(201);

    const body = response.body as {
      endpoint: {
        id: string;
        secret?: string;
      };
      requestId: string;
    };
    assert.equal(body.endpoint.id, "webhook_endpoint_1");
    assert.equal(body.requestId, "req_1");

    const flushed = await flushAuditBuffer();
    assert.equal(flushed, 1);
    assert.equal(auditCapture.events.length, 1);

    const [event] = auditCapture.events;
    assert.ok(event);
    const diff = event.diff as {
      payload?: unknown;
      response?: Record<string, unknown>;
    };

    assert.equal(event.action, "webhook_endpoint.created");
    assert.equal(event.actorId, "user_1");
    assert.equal(event.entityId, "webhook_endpoint_1");
    assert.equal(event.entityType, "webhook_endpoint");
    assert.equal(event.tenantId, "tenant_1");
    assert.deepEqual(diff.payload, {
      topics: ["workflow.completed"],
      url: "https://hooks.example.com/birthub"
    });
    assert.deepEqual(diff.response, {
      endpointId: "webhook_endpoint_1",
      status: "ACTIVE"
    });
    assert.equal("secret" in (diff.response ?? {}), false);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
    resetAuditBufferForTests();
  }
});
