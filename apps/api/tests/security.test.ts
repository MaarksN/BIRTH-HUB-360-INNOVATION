// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import { setMaxListeners } from "node:events";
import test from "node:test";

import { UserStatus, prisma } from "@birthub/database";
import express from "express";
import request from "supertest";

import { createApp } from "../src/app.js";
import { createTestApiConfig } from "./test-config.js";
import { sha256 } from "../src/modules/auth/crypto.js";
import { budgetService } from "../src/modules/budget/budget.service.js";
import {
  createRateLimitMiddleware,
  createWebhookRateLimitMiddleware
} from "../src/middleware/rate-limit.js";
import type { RequestContext } from "../src/middleware/request-context.js";

setMaxListeners(20);

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

function createSmokeRequestContext(tenantId: string | null): RequestContext {
  return {
    apiKeyId: null,
    authType: tenantId ? "session" : null,
    billingPlanStatus: null,
    breakGlassGrantId: null,
    breakGlassReason: null,
    breakGlassTicket: null,
    impersonatedByUserId: null,
    organizationId: tenantId ? `org_${tenantId}` : null,
    requestId: `req_${tenantId ?? "public"}`,
    role: null,
    sessionAccessMode: null,
    sessionId: tenantId ? `session_${tenantId}` : null,
    tenantId,
    tenantSlug: tenantId,
    traceId: `trace_${tenantId ?? "public"}`,
    userId: tenantId ? "user_1" : null
  };
}

void test("security emits hardened HTTP headers on API responses", async () => {
  const app = createApp({
    config: createTestApiConfig(),
    shouldExposeDocs: false
  });

  const response = await request(app).get("/__security_headers_smoke").expect(404);
  const csp = response.header["content-security-policy"];

  assert.equal(response.header["x-frame-options"], "DENY");
  assert.equal(response.header["x-content-type-options"], "nosniff");
  assert.equal(response.header["referrer-policy"], "strict-origin-when-cross-origin");
  assert.equal(response.header["cross-origin-opener-policy"], "same-origin");
  assert.equal(response.header["cross-origin-resource-policy"], "same-site");
  assert.match(response.header["strict-transport-security"], /max-age=31536000/);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /form-action 'self'/);
});

void test("security keeps operational routes outside the global API rate limit", async () => {
  const app = createApp({
    config: createTestApiConfig({
      API_RATE_LIMIT_MAX: "1"
    }),
    healthService: () =>
      Promise.resolve({
        checkedAt: new Date().toISOString(),
        mode: "liveness",
        services: {},
        status: "ok"
      }) as never,
    shouldExposeDocs: false
  });

  await request(app).get("/api/v1/health").expect(200);
  const secondResponse = await request(app).get("/api/v1/health").expect(200);

  assert.equal(secondResponse.header["ratelimit-limit"], undefined);
});

void test("security applies API rate limits by tenant and route group", async () => {
  const app = express();
  app.use((incomingRequest, _response, next) => {
    incomingRequest.context = createSmokeRequestContext(
      incomingRequest.header("x-test-tenant") ?? null
    );
    next();
  });
  app.use(
    createRateLimitMiddleware(
      createTestApiConfig({
        API_RATE_LIMIT_MAX: "1",
        API_RATE_LIMIT_WINDOW_MS: "60000"
      })
    )
  );
  app.get("/api/v1/tasks/rate-limit-phase2-a", (_request, response) => {
    response.status(200).json({ ok: true });
  });
  app.get("/api/v1/tasks/rate-limit-phase2-b", (_request, response) => {
    response.status(200).json({ ok: true });
  });

  await request(app)
    .get("/api/v1/tasks/rate-limit-phase2-a")
    .set("x-test-tenant", "tenant_a")
    .expect(200);
  const limitedResponse = await request(app)
    .get("/api/v1/tasks/rate-limit-phase2-b")
    .set("x-test-tenant", "tenant_a")
    .expect(429);
  await request(app)
    .get("/api/v1/tasks/rate-limit-phase2-b")
    .set("x-test-tenant", "tenant_b")
    .expect(200);

  assert.equal(limitedResponse.header["ratelimit-limit"], "1");
  assert.equal(limitedResponse.body.title, "Too Many Requests");
});

void test("security applies webhook rate limits by tenant before provider processing", async () => {
  const app = express();
  app.use((incomingRequest, _response, next) => {
    incomingRequest.context = createSmokeRequestContext(
      incomingRequest.header("x-test-tenant") ?? null
    );
    next();
  });
  app.use(
    createWebhookRateLimitMiddleware(
      createTestApiConfig({
        API_WEBHOOK_RATE_LIMIT_MAX: "1",
        API_WEBHOOK_RATE_LIMIT_TENANT_MULTIPLIER: "1",
        API_WEBHOOK_RATE_LIMIT_WINDOW_MS: "60000"
      })
    )
  );
  app.post("/api/webhooks/stripe", (_request, response) => {
    response.status(204).end();
  });

  await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", "sig_rate_limit_smoke")
    .set("x-test-tenant", "tenant_a")
    .send("{}")
    .expect(204);
  await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", "sig_rate_limit_smoke")
    .set("x-test-tenant", "tenant_a")
    .send("{}")
    .expect(429);
  await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", "sig_rate_limit_smoke")
    .set("x-test-tenant", "tenant_b")
    .send("{}")
    .expect(204);
});

void test("security sanitizes XSS payloads before queueing tasks", async () => {
  let queuedDescription: string | null = null;
  const restores = [
    stubMethod(prisma.session, "findUnique", (args: { where?: { token?: string } }) => {
      if (args.where?.token !== sha256("atk_member")) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        expiresAt: new Date(Date.now() + 60_000),
        id: "session_1",
        organizationId: "org_1",
        tenantId: "tenant_1",
        revokedAt: null,
        userId: "user_1"
      });
    }),
    stubMethod(prisma.session, "update", () => Promise.resolve({ id: "session_1" })),
    stubMethod(prisma.user, "findUnique", () => Promise.resolve({
      id: "user_1",
      status: UserStatus.ACTIVE
    })),
    stubMethod(prisma.membership, "findUnique", () => Promise.resolve({
      role: "MEMBER",
      status: "ACTIVE"
    })),
    stubMethod(prisma.jobSigningSecret, "findUnique", () => Promise.resolve({
      organizationId: "org_1",
      secret: "tenant-secret"
    })),
    stubMethod(budgetService, "consumeBudget", () => Promise.resolve({
      agentId: "ceo-pack",
      consumed: 0,
      currency: "BRL",
      id: "budget_1",
      limit: 100,
      tenantId: "tenant_1",
      updatedAt: new Date().toISOString()
    }))
  ];

  try {
    const app = createApp({
      config: createTestApiConfig(),
      enqueueTask: (_config, payload) => {
        if (
          payload &&
          typeof payload === "object" &&
          "payload" in payload &&
          payload.payload &&
          typeof payload.payload === "object" &&
          "description" in payload.payload &&
          typeof payload.payload.description === "string"
        ) {
          queuedDescription = payload.payload.description;
        }
        return Promise.resolve({ jobId: "job_1" });
      },
      shouldExposeDocs: false
    });

    await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", "Bearer atk_member")
      .set("x-csrf-token", "csrf_1")
      .set("Cookie", ["bh360_csrf=csrf_1"])
      .send({
        payload: {
          description: "<script>alert(1)</script>"
        },
        type: "send-welcome-email"
      })
      .expect(202);

    assert.equal(queuedDescription, "alert(1)");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("security rejects malicious Origin headers on mutation endpoints", async () => {
  const app = createApp({
    config: createTestApiConfig(),
    shouldExposeDocs: false
  });

  await request(app)
    .post("/api/v1/auth/login")
    .set("Origin", "https://evil.example")
    .send({
      email: "owner@birthub.local",
      password: "password123",
      tenantId: "birthhub-alpha"
    })
    .expect(403);
});

void test("security requires an authenticated session for connector OAuth callbacks", async () => {
  const app = createApp({
    config: createTestApiConfig(),
    shouldExposeDocs: false
  });

  await request(app)
    .post("/api/v1/connectors/hubspot/callback")
    .send({
      state: Buffer.from(
        JSON.stringify({
          accountKey: "primary",
          organizationId: "org_1",
          provider: "hubspot",
          requestId: "req_1",
          tenantId: "tenant_1",
          userId: "user_1",
          version: 1
        })
      ).toString("base64url")
    })
    .expect(401);

  await request(app)
    .get("/api/v1/connectors/hubspot/callback")
    .query({
      state: Buffer.from(
        JSON.stringify({
          accountKey: "primary",
          organizationId: "org_1",
          provider: "hubspot",
          requestId: "req_2",
          tenantId: "tenant_1",
          userId: "user_1",
          version: 1
        })
      ).toString("base64url")
    })
    .expect(401);
});
