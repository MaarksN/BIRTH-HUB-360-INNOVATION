// @ts-expect-error TODO: remover suppressão ampla
//
import { createHash, createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import { queueClient } from "@birthub/queue";
import { MembershipStatus, Role, UserStatus, WorkflowTriggerType, prisma } from "@birthub/database";
import request from "supertest";

import { createApp } from "../src/app.js";
import { sha256 } from "../src/modules/auth/crypto.js";
import { workflowQueueAdapter } from "../src/modules/workflows/service.js";
import { createTestApiConfig } from "./test-config.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

function createAuthenticatedAdminStubs() {
  return [
    stubMethod(prisma.session, "findUnique", (args: { where?: { token?: string } }) => {
      if (args.where?.token !== sha256("atk_admin")) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        expiresAt: new Date(Date.now() + 60_000),
        id: "session_1",
        organizationId: "org_1",
        tenantId: "tenant_1",
        revokedAt: null,
        userId: "user_1",
      });
    }),
    stubMethod(prisma.session, "update", () => Promise.resolve({ id: "session_1" })),
    stubMethod(prisma.user, "findUnique", () =>
      Promise.resolve({
        id: "user_1",
        status: UserStatus.ACTIVE,
      })
    ),
    stubMethod(prisma.membership, "findUnique", () =>
      Promise.resolve({
        organizationId: "org_1",
        role: Role.ADMIN,
        status: MembershipStatus.ACTIVE,
        userId: "user_1",
      })
    ),
  ];
}

function signWebhookPayload(secret: string, payload: Record<string, unknown>): string {
  return createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

void test("webhook settings reject loopback targets", async () => {
  const restores = [...createAuthenticatedAdminStubs()];

  try {
    const app = createApp({
      config: createTestApiConfig(),
      shouldExposeDocs: false,
    });

    const response = await request(app)
      .post("/api/v1/settings/webhooks")
      .set("Authorization", "Bearer atk_admin")
      .set("x-csrf-token", "csrf_1")
      .set("Cookie", ["bh360_csrf=csrf_1"])
      .send({
        topics: ["workflow.completed"],
        url: "http://127.0.0.1:8080/internal",
      })
      .expect(400);

    const body = response.body as { detail?: string };
    assert.match(String(body.detail ?? ""), /not allowed|invalid/i);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflow trigger webhooks reject missing or invalid signatures", async () => {
  const payload = {
    event: "lead.created",
    leadId: "lead_1",
  };
  let enqueueCalls = 0;
  const restores = [
    stubMethod(prisma.workflow, "findUnique", () =>
      Promise.resolve({
        id: "wf_webhook",
        organizationId: "org_2",
        tenantId: "tenant_2",
        triggerType: WorkflowTriggerType.WEBHOOK,
        webhookSecret: "tenant-2-webhook-secret",
      })
    ),
    stubMethod(queueClient, "claimDeduplicationKey", () => Promise.resolve(true)),
    stubMethod(workflowQueueAdapter, "enqueueWorkflowTrigger", () => {
      enqueueCalls += 1;
      return Promise.resolve();
    }),
  ];

  try {
    const app = createApp({
      config: createTestApiConfig(),
      shouldExposeDocs: false,
    });

    await request(app).post("/webhooks/trigger/wf_webhook").send(payload).expect(401);

    await request(app)
      .post("/webhooks/trigger/wf_webhook")
      .set("x-birthhub-signature", signWebhookPayload("wrong-secret", payload))
      .send(payload)
      .expect(401);

    assert.equal(enqueueCalls, 0);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflow trigger webhooks enqueue tenant-scoped idempotent jobs", async () => {
  const config = createTestApiConfig();
  const payload = {
    event: "lead.created",
    leadId: "lead_1",
  };
  const workflow = {
    id: "wf_webhook",
    organizationId: "org_2",
    tenantId: "tenant_2",
    triggerType: WorkflowTriggerType.WEBHOOK,
    webhookSecret: "tenant-2-webhook-secret",
  };
  const expectedPayloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const expectedDedupeHash = createHash("sha256")
    .update(JSON.stringify({ payload, tenantId: workflow.tenantId }))
    .digest("hex");
  let dedupeCall: unknown = null;
  let enqueueCall: unknown = null;
  const restores = [
    stubMethod(prisma.workflow, "findUnique", () => Promise.resolve(workflow)),
    stubMethod(
      queueClient,
      "claimDeduplicationKey",
      (key: string, ttlSeconds: number, options: unknown) => {
        dedupeCall = { key, options, ttlSeconds };
        return Promise.resolve(true);
      }
    ),
    stubMethod(workflowQueueAdapter, "enqueueWorkflowTrigger", (_config: unknown, job: unknown) => {
      enqueueCall = job;
      return Promise.resolve();
    }),
  ];

  try {
    const app = createApp({
      config,
      shouldExposeDocs: false,
    });

    const response = await request(app)
      .post("/webhooks/trigger/wf_webhook")
      .set("x-birthhub-signature", signWebhookPayload(workflow.webhookSecret, payload))
      .send(payload)
      .expect(202);

    assert.deepEqual(response.body, {
      accepted: true,
      deduplicated: false,
      workflowId: "wf_webhook",
    });
    assert.deepEqual(dedupeCall, {
      key: `workflow:trigger:dedupe:tenant_2:${expectedDedupeHash}`,
      options: {
        redisUrl: config.REDIS_URL,
      },
      ttlSeconds: 5,
    });
    assert.deepEqual(enqueueCall, {
      eventSource: "webhook",
      idempotencyKey: `webhook:wf_webhook:${expectedPayloadHash}`,
      organizationId: "org_2",
      tenantId: "tenant_2",
      triggerPayload: payload,
      triggerType: WorkflowTriggerType.WEBHOOK,
      workflowId: "wf_webhook",
    });
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflow trigger webhooks return deduplicated without enqueueing repeated payloads", async () => {
  const payload = {
    event: "lead.created",
    leadId: "lead_1",
  };
  let enqueueCalls = 0;
  const restores = [
    stubMethod(prisma.workflow, "findUnique", () =>
      Promise.resolve({
        id: "wf_webhook",
        organizationId: "org_2",
        tenantId: "tenant_2",
        triggerType: WorkflowTriggerType.WEBHOOK,
        webhookSecret: "tenant-2-webhook-secret",
      })
    ),
    stubMethod(queueClient, "claimDeduplicationKey", () => Promise.resolve(false)),
    stubMethod(workflowQueueAdapter, "enqueueWorkflowTrigger", () => {
      enqueueCalls += 1;
      return Promise.resolve();
    }),
  ];

  try {
    const app = createApp({
      config: createTestApiConfig(),
      shouldExposeDocs: false,
    });

    const response = await request(app)
      .post("/webhooks/trigger/wf_webhook")
      .set("x-birthhub-signature", signWebhookPayload("tenant-2-webhook-secret", payload))
      .send(payload)
      .expect(200);

    assert.deepEqual(response.body, {
      deduplicated: true,
    });
    assert.equal(enqueueCalls, 0);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
