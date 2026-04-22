import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { registerAuthRoutes } from "../src/app/auth-routes.js";
import { requestContextMiddleware } from "../src/middleware/request-context.js";
import { createTestApiConfig } from "./test-config.js";

type IntrospectionBody = {
  active: boolean;
};

function assertIntrospectionBody(body: unknown): asserts body is IntrospectionBody {
  assert.equal(typeof body, "object");
  assert.notEqual(body, null);
  assert.equal(typeof (body as { active?: unknown }).active, "boolean");
}

void test("registerAuthRoutes exposes modular auth endpoints through the compat layer", async () => {
  const app = express();
  app.use(requestContextMiddleware);
  app.use(express.json());
  registerAuthRoutes(app, createTestApiConfig());

  await request(app)
    .post("/api/v1/auth/login")
    .send({})
    .expect(400);

  await request(app)
    .post("/api/v1/auth/mfa/challenge")
    .send({})
    .expect(400);

  await request(app)
    .post("/api/v1/auth/refresh")
    .send({})
    .expect(400);

  await request(app)
    .post("/api/v1/auth/logout")
    .expect(401);

  await request(app)
    .get("/api/v1/auth/introspect")
    .expect(200)
    .expect(({ body }) => {
      assertIntrospectionBody(body);
      assert.equal(body.active, false);
    });

  await request(app)
    .post("/api/v1/auth/mfa/setup")
    .expect(401);

  await request(app)
    .post("/api/v1/auth/mfa/enable")
    .send({ totpCode: "123456" })
    .expect(401);

  assert.ok(app);
});
