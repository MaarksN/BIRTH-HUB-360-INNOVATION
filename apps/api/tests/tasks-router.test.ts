import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { QueueBackpressureError, TenantQueueRateLimitError } from "../src/lib/queue.js";
import { errorHandler } from "../src/middleware/error-handler.js";
import { requestContextMiddleware } from "../src/middleware/request-context.js";
import { BudgetExceededError } from "../src/modules/budget/budget.types.js";
import { createTasksRouter } from "../src/modules/tasks/router.js";
import { createTestApiConfig } from "./test-config.js";

type ConsumedBudgetPayload = {
  actorId: string;
  organizationId: string;
  requestId: string;
  tenantId: string;
};

type QueuedTaskPayload = {
  requestId: string;
  tenantId: string;
  type: string;
  userId: string;
  context: {
    actorId: string;
    organizationId: string;
    tenantId: string;
  };
};

void test("createTasksRouter requires an authenticated session for POST /api/v1/tasks", async () => {
  const app = express();
  app.use(requestContextMiddleware);
  app.use(express.json());
  app.use("/api/v1", createTasksRouter(createTestApiConfig()));
  app.use(errorHandler);

  await request(app)
    .post("/api/v1/tasks")
    .send({
      type: "send-welcome-email"
    })
    .expect(401);
});

void test("createTasksRouter enqueues tasks with the same public contract and side effects", async () => {
  const config = createTestApiConfig();
  const app = express();
  const captured: {
    consumedBudget: ConsumedBudgetPayload | null;
    queuedPayload: QueuedTaskPayload | null;
  } = {
    consumedBudget: null,
    queuedPayload: null
  };

  app.use(requestContextMiddleware);
  app.use(express.json());
  app.use((request, _response, next) => {
    request.context.authType = "session";
    request.context.organizationId = "org_1";
    request.context.requestId = "req_task_1";
    request.context.role = "MEMBER";
    request.context.sessionId = "session_1";
    request.context.tenantId = "tenant_1";
    request.context.userId = "user_1";
    next();
  });
  app.use(
    "/api/v1",
    createTasksRouter(config, {
      budgetService: {
        consumeBudget: async (input) => {
          captured.consumedBudget = input as ConsumedBudgetPayload;
          return {
            agentId: "ceo-pack",
            consumed: 0.5,
            currency: "BRL",
            id: "budget_1",
            limit: 100,
            tenantId: "tenant_1",
            updatedAt: new Date().toISOString()
          };
        }
      },
      enqueueTask: async (_receivedConfig, payload) => {
        captured.queuedPayload = payload as QueuedTaskPayload;
        return { jobId: "job_123" };
      }
    })
  );
  app.use(errorHandler);

  const response = await request(app)
    .post("/api/v1/tasks")
    .send({
      agentId: "ceo-pack",
      approvalRequired: false,
      estimatedCostBRL: 0.5,
      executionMode: "LIVE",
      payload: {
        description: "hello"
      },
      type: "send-welcome-email"
    })
    .expect(202);

  assert.deepEqual(response.body, {
    jobId: "job_123",
    requestId: "req_task_1"
  });
  if (!captured.consumedBudget || !captured.queuedPayload) {
    throw new Error("Expected task submission side effects to be captured.");
  }
  assert.equal(captured.consumedBudget.actorId, "user_1");
  assert.equal(captured.consumedBudget.organizationId, "org_1");
  assert.equal(captured.consumedBudget.tenantId, "tenant_1");
  assert.equal(captured.queuedPayload.tenantId, "tenant_1");
  assert.equal(captured.queuedPayload.userId, "user_1");
  assert.equal(captured.queuedPayload.requestId, "req_task_1");
  assert.equal(captured.queuedPayload.type, "send-welcome-email");
});

void test("createTasksRouter rejects top-level mass assignment fields", async () => {
  const app = express();
  let consumedBudget = false;
  let queuedTask = false;

  app.use(requestContextMiddleware);
  app.use(express.json());
  app.use((request, _response, next) => {
    request.context.authType = "session";
    request.context.organizationId = "org_1";
    request.context.requestId = "req_task_mass_assignment";
    request.context.role = "MEMBER";
    request.context.sessionId = "session_1";
    request.context.tenantId = "tenant_1";
    request.context.userId = "user_1";
    next();
  });
  app.use(
    "/api/v1",
    createTasksRouter(createTestApiConfig(), {
      budgetService: {
        consumeBudget: async () => {
          consumedBudget = true;
          return {
            agentId: "ceo-pack",
            consumed: 0,
            currency: "BRL",
            id: "budget_1",
            limit: 100,
            tenantId: "tenant_1",
            updatedAt: new Date().toISOString()
          };
        }
      },
      enqueueTask: async () => {
        queuedTask = true;
        return { jobId: "job_unused" };
      }
    })
  );
  app.use(errorHandler);

  const response = await request(app)
    .post("/api/v1/tasks")
    .send({
      context: {
        tenantId: "attacker_tenant"
      },
      tenantId: "attacker_tenant",
      type: "send-welcome-email",
      userId: "attacker_user"
    })
    .expect(400);

  assert.equal(response.body.title, "Bad Request");
  assert.equal(consumedBudget, false);
  assert.equal(queuedTask, false);
});

void test("createTasksRouter preserves budget exceeded translation", async () => {
  const app = express();
  app.use(requestContextMiddleware);
  app.use(express.json());
  app.use((request, _response, next) => {
    request.context.authType = "session";
    request.context.organizationId = "org_1";
    request.context.requestId = "req_task_budget";
    request.context.role = "MEMBER";
    request.context.sessionId = "session_1";
    request.context.tenantId = "tenant_1";
    request.context.userId = "user_1";
    next();
  });
  app.use(
    "/api/v1",
    createTasksRouter(createTestApiConfig(), {
      budgetService: {
        consumeBudget: async () => {
          throw new BudgetExceededError({
            agentId: "ceo-pack",
            consumed: 100,
            limit: 100,
            tenantId: "tenant_1"
          });
        }
      },
      enqueueTask: async () => ({ jobId: "job_unused" })
    })
  );
  app.use(errorHandler);

  const response = await request(app)
    .post("/api/v1/tasks")
    .send({
      type: "send-welcome-email"
    })
    .expect(402);

  assert.equal(response.body.title, "Budget Exceeded");
});

void test("createTasksRouter preserves queue translation for rate limiting and backpressure", async () => {
  const makeApp = (error: Error) => {
    const app = express();
    app.use(requestContextMiddleware);
    app.use(express.json());
    app.use((request, _response, next) => {
      request.context.authType = "session";
      request.context.organizationId = "org_1";
      request.context.requestId = "req_task_queue";
      request.context.role = "MEMBER";
      request.context.sessionId = "session_1";
      request.context.tenantId = "tenant_1";
      request.context.userId = "user_1";
      next();
    });
    app.use(
      "/api/v1",
      createTasksRouter(createTestApiConfig(), {
        budgetService: {
          consumeBudget: async () => ({
            agentId: "ceo-pack",
            consumed: 0.5,
            currency: "BRL",
            id: "budget_1",
            limit: 100,
            tenantId: "tenant_1",
            updatedAt: new Date().toISOString()
          })
        },
        enqueueTask: async () => {
          throw error;
        }
      })
    );
    app.use(errorHandler);
    return app;
  };

  const rateLimited = await request(makeApp(new TenantQueueRateLimitError("tenant_1", 120)))
    .post("/api/v1/tasks")
    .send({
      type: "send-welcome-email"
    })
    .expect(429);

  assert.equal(rateLimited.body.title, "Too Many Requests");

  const backpressure = await request(makeApp(new QueueBackpressureError(10_000, 10_000)))
    .post("/api/v1/tasks")
    .send({
      type: "send-welcome-email"
    })
    .expect(503);

  assert.equal(backpressure.body.title, "Service Unavailable");
});
