import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { createApp } from "../src/app.js";
import { errorHandler, notFoundMiddleware } from "../src/middleware/error-handler.js";
import { requestContextMiddleware } from "../src/middleware/request-context.js";
import { createBreakGlassRouter } from "../src/modules/break-glass/router.js";
import { createTestApiConfig } from "./test-config.js";

type ErrorBody = {
  detail?: string;
  status: number;
  title: string;
};

function createStandaloneBreakGlassTestApp() {
  const app = express();
  const config = createTestApiConfig();

  app.use(requestContextMiddleware);
  app.use("/api/v1", createBreakGlassRouter(config));
  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}

void test("break-glass routes stay parked in the main API surface until the canonical runtime contract exists", async () => {
  const response = await request(
    createApp({
      config: createTestApiConfig()
    })
  )
    .post("/api/v1/admin/break-glass/grants")
    .send({
      justification: "Emergency access required for continuity review",
      reason: "critical incident",
      tenantReference: "tenant_1",
      ticketId: "INC-100"
    })
    .expect(404);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 404);
  assert.equal(body.title, "Not Found");
});

void test("standalone break-glass router returns an explicit parked-surface message", async () => {
  const response = await request(createStandaloneBreakGlassTestApp())
    .post("/api/v1/admin/break-glass/grants")
    .send({
      justification: "Emergency access required for continuity review",
      reason: "critical incident",
      tenantReference: "tenant_1",
      ticketId: "INC-100"
    })
    .expect(404);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 404);
  assert.equal(body.title, "Not Found");
  assert.match(body.detail ?? "", /break-glass router is disabled/i);
});

void test("standalone break-glass router does not swallow unrelated api routes", async () => {
  const response = await request(createStandaloneBreakGlassTestApp())
    .get("/api/v1/workflows")
    .expect(404);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 404);
  assert.equal(body.title, "Not Found");
  assert.doesNotMatch(body.detail ?? "", /break-glass router is disabled/i);
  assert.match(body.detail ?? "", /No route matched/i);
});
