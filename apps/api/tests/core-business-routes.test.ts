import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createApp } from "../src/app.js";
import { createTestApiConfig } from "./test-config.js";

void test("createApp exposes organizations, profile and tasks without relying on core-business-routes", async () => {
  const app = createApp({
    config: createTestApiConfig(),
    shouldExposeDocs: false
  });

  await request(app)
    .post("/api/v1/organizations")
    .send({})
    .expect(400);

  await request(app)
    .get("/api/v1/me")
    .expect(401);

  await request(app)
    .post("/api/v1/tasks")
    .send({
      type: "send-welcome-email"
    })
    .expect(401);

  await request(app)
    .post("/api/v1/auth/login")
    .send({})
    .expect(400);

  assert.ok(app);
});
