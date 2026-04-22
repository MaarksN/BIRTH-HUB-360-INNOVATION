import assert from "node:assert/strict";
import test from "node:test";

import { Role } from "@birthub/database";
import request from "supertest";

import { createPrivacyRouter } from "../src/modules/privacy/router.js";
import { createAuthenticatedApiTestApp } from "./http-test-helpers.js";
import { createTestApiConfig } from "./test-config.js";

type ProblemBody = {
  detail?: string;
  status: number;
  title: string;
};

function assertProblemBody(body: unknown): asserts body is ProblemBody {
  assert.equal(typeof body, "object");
  assert.notEqual(body, null);
  assert.equal(typeof (body as { status?: unknown }).status, "number");
  assert.equal(typeof (body as { title?: unknown }).title, "string");
}

function createPrivacyTestApp() {
  return createAuthenticatedApiTestApp({
    contextOverrides: {
      role: Role.OWNER
    },
    mountPath: "/api/v1/privacy",
    router: createPrivacyRouter(createTestApiConfig())
  });
}

void test("privacy router disables advanced consent and retention surfaces when the capability is off", async () => {
  const app = createPrivacyTestApp();

  const disabledResponses = await Promise.all([
    request(app).get("/api/v1/privacy/consents"),
    request(app).get("/api/v1/privacy/retention"),
    request(app).post("/api/v1/privacy/retention/run").send({})
  ]);

  for (const response of disabledResponses) {
    assertProblemBody(response.body);
    assert.equal(response.status, 404);
    assert.equal(response.body.title, "Not Found");
    assert.match(String(response.body.detail ?? ""), /advanced privacy controls are disabled/i);
  }
});

void test("privacy router keeps the self-service delete-account route active and validating input", async () => {
  const response = await request(createPrivacyTestApp())
    .post("/api/v1/privacy/delete-account")
    .send({
      confirmationText: "no"
    })
    .expect(400);

  assertProblemBody(response.body);
  assert.equal(response.body.status, 400);
  assert.equal(response.body.title, "Bad Request");
});
