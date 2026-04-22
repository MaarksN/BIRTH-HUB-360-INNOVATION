import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { createSessionsRouter } from "../src/modules/sessions/router.js";
import { requestContextMiddleware } from "../src/middleware/request-context.js";
import { createTestApiConfig } from "./test-config.js";

void test("createSessionsRouter owns session listing and session mutation routes", async () => {
  const app = express();
  app.use(requestContextMiddleware);
  app.use(express.json());
  app.use("/api/v1", createSessionsRouter(createTestApiConfig()));

  await request(app)
    .get("/api/v1/sessions")
    .expect(401);

  await request(app)
    .delete("/api/v1/sessions/session_123")
    .expect(401);

  await request(app)
    .post("/api/v1/sessions/logout-all")
    .expect(401);

  await request(app)
    .post("/api/v1/auth/logout-all")
    .expect(401);

  assert.ok(app);
});
