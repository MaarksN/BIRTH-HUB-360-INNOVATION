// @ts-expect-error TODO: remover suppressão ampla
import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { createApp } from "../src/app.js";
import { errorHandler, notFoundMiddleware } from "../src/middleware/error-handler.js";
import { requestContextMiddleware } from "../src/middleware/request-context.js";
import { createFhirRouter } from "../src/modules/fhir/router.js";
import { createTestApiConfig } from "./test-config.js";

type ErrorBody = {
  detail?: string;
  status: number;
  title: string;
};

function createStandaloneFhirTestApp(
  dependencies?: Parameters<typeof createFhirRouter>[0]
) {
  const app = express();
  app.use(requestContextMiddleware);
  app.use(createFhirRouter(dependencies));
  app.use(notFoundMiddleware);
  app.use(errorHandler);
  return app;
}

void test("FHIR routes are not mounted in the main API surface while the interoperability facade is disabled", async () => {
  const response = await request(
    createApp({
      config: createTestApiConfig()
    })
  )
    .get("/api/fhir/R4/metadata")
    .expect(404);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 404);
  assert.equal(body.title, "Not Found");
});

void test("standalone FHIR router short-circuits by default while interoperability remains orphaned", async () => {
  const response = await request(createStandaloneFhirTestApp())
    .get("/api/fhir/R4/metadata")
    .expect(404);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 404);
  assert.equal(body.title, "Not Found");
  assert.match(body.detail ?? "", /FHIR facade router is disabled/i);
});

void test("standalone FHIR router only reaches authentication when the capability is explicitly re-enabled", async () => {
  const response = await request(
    createStandaloneFhirTestApp({
      config: {
        fhirFacadeEnabled: true
      }
    })
  )
    .get("/api/fhir/R4/metadata")
    .expect(401);
  const body = response.body as ErrorBody;

  assert.equal(body.status, 401);
  assert.equal(body.title, "Unauthorized");
});

