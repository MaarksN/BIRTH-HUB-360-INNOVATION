import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { createProfileRouter } from "../src/modules/profile/router.js";
import { requestContextMiddleware } from "../src/middleware/request-context.js";
import { createTestApiConfig } from "./test-config.js";

void test("createProfileRouter requires an authenticated session for GET /api/v1/me", async () => {
  const app = express();
  app.use(requestContextMiddleware);
  app.use("/api/v1", createProfileRouter(createTestApiConfig()));

  await request(app)
    .get("/api/v1/me")
    .expect(401);
});

void test("createProfileRouter serves the authenticated profile with an explicit billing contract", async () => {
  const config = createTestApiConfig();
  const app = express();

  app.use(requestContextMiddleware);
  app.use((request, _response, next) => {
    request.context.authType = "session";
    request.context.organizationId = "org_1";
    request.context.requestId = "req_profile_1";
    request.context.role = "OWNER";
    request.context.sessionId = "session_1";
    request.context.tenantId = "tenant_1";
    request.context.userId = "user_1";
    next();
  });
  app.use(
    "/api/v1",
    createProfileRouter(config, {
      getBillingSnapshot: (organizationId, gracePeriodDays) => {
        assert.equal(organizationId, "org_1");
        assert.equal(gracePeriodDays, config.BILLING_GRACE_PERIOD_DAYS);

        return Promise.resolve({
          creditBalanceCents: 4200,
          currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
          gracePeriodEndsAt: null,
          hardLocked: false,
          isPaid: true,
          isWithinGracePeriod: false,
          organizationId: "org_1",
          plan: {
            code: "pro",
            id: "plan_pro",
            limits: {},
            name: "Pro"
          },
          secondsUntilHardLock: null,
          status: "active",
          stripeCustomerId: "cus_profile_test",
          subscriptionId: "sub_profile_test",
          tenantId: "tenant_1"
        });
      }
    })
  );

  const response = await request(app)
    .get("/api/v1/me")
    .expect(200);

  assert.deepEqual(response.body, {
    plan: {
      code: "pro",
      creditBalanceCents: 4200,
      currentPeriodEnd: "2026-05-01T00:00:00.000Z",
      hardLocked: false,
      isPaid: true,
      isWithinGracePeriod: false,
      name: "Pro",
      secondsUntilHardLock: null,
      status: "active"
    },
    plan_status: {
      code: "pro",
      hardLocked: false,
      isWithinGracePeriod: false,
      status: "active"
    },
    requestId: "req_profile_1",
    user: {
      id: "user_1",
      organizationId: "org_1",
      role: "OWNER",
      tenantId: "tenant_1"
    }
  });
});
