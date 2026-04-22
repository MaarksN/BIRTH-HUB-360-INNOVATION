// @ts-expect-error TODO: remover suppressão ampla
import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { createApp } from "../src/app.js";
import { errorHandler, notFoundMiddleware } from "../src/middleware/error-handler.js";
import { requestContextMiddleware } from "../src/middleware/request-context.js";
import { createClinicalRouter } from "../src/modules/clinical/router.js";
import { createTestApiConfig } from "./test-config.js";

type ErrorBody = {
  detail?: string;
  status: number;
  title: string;
};

function createStandaloneClinicalTestApp(
  config?: Parameters<typeof createClinicalRouter>[0]
) {
  const app = express();
  app.use(requestContextMiddleware);
  app.use("/api/v1", createClinicalRouter(config));
  app.use(notFoundMiddleware);
  app.use(errorHandler);
  return app;
}

void test("clinical routes are not mounted in the main API surface while the clinical workspace is disabled", async () => {
  const response = await request(
    createApp({
      config: createTestApiConfig()
    })
  )
    .get("/api/v1/patients")
    .expect(404);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 404);
  assert.equal(body.title, "Not Found");
});

void test("standalone clinical router short-circuits by default while the domain remains orphaned", async () => {
  const response = await request(createStandaloneClinicalTestApp())
    .get("/api/v1/patients")
    .expect(404);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 404);
  assert.equal(body.title, "Not Found");
  assert.match(body.detail ?? "", /clinical workspace router is disabled/i);
});

void test("standalone clinical router only reaches authentication when the capability is explicitly re-enabled", async () => {
  const response = await request(
    createStandaloneClinicalTestApp({
      clinicalWorkspaceEnabled: true
    })
  )
    .get("/api/v1/patients")
    .expect(401);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 401);
  assert.equal(body.title, "Unauthorized");
});

