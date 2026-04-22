import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { registerOperationalRoutes } from "../src/app/core.js";
import { openApiDocument } from "../src/docs/openapi.js";
import { createTestApiConfig } from "./test-config.js";

type OpenApiPayload = {
  openapi: string;
  paths: Record<string, unknown>;
};

function assertOpenApiPayload(payload: unknown): asserts payload is OpenApiPayload {
  assert.ok(payload && typeof payload === "object");
  assert.ok("openapi" in payload);
  assert.ok("paths" in payload);
}

void test("openApiDocument publishes the mounted business API baseline and excludes compat-only aliases", async () => {
  const config = createTestApiConfig();
  const app = express();

  registerOperationalRoutes(app, config, {
    shouldExposeDocs: true
  });

  const response = await request(app)
    .get("/api/openapi.json")
    .expect(200);

  const payload = response.body as unknown;
  assertOpenApiPayload(payload);

  assert.equal(payload.openapi, "3.1.0");

  const publishedPaths = Object.keys(payload.paths).sort();

  assert.deepEqual(publishedPaths, [
    "/api/v1/agents/search",
    "/api/v1/apikeys",
    "/api/v1/apikeys/{id}",
    "/api/v1/apikeys/{id}/rotate",
    "/api/v1/auth/introspect",
    "/api/v1/auth/login",
    "/api/v1/auth/logout",
    "/api/v1/auth/mfa/challenge",
    "/api/v1/auth/mfa/enable",
    "/api/v1/auth/mfa/setup",
    "/api/v1/auth/refresh",
    "/api/v1/budgets/usage",
    "/api/v1/invites",
    "/api/v1/invites/accept",
    "/api/v1/invites/{id}/revoke",
    "/api/v1/me",
    "/api/v1/notifications",
    "/api/v1/notifications/preferences",
    "/api/v1/notifications/read-all",
    "/api/v1/notifications/{id}/read",
    "/api/v1/organizations",
    "/api/v1/outputs",
    "/api/v1/privacy/delete-account",
    "/api/v1/sessions",
    "/api/v1/sessions/logout-all",
    "/api/v1/sessions/{sessionId}",
    "/api/v1/tasks"
  ]);

  assert.equal(Object.hasOwn(payload.paths, "/api/v1/auth/logout-all"), false);
  assert.equal(Object.hasOwn(payload.paths, "/api/v1/clinical"), false);
  assert.equal(Object.hasOwn(payload.paths, "/api/v1/orgs"), false);
  assert.deepEqual(payload, openApiDocument);
});
