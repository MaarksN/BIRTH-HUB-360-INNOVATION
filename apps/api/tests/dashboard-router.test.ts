// @ts-expect-error TODO: remover suppressão ampla
import assert from "node:assert/strict";
import test from "node:test";

import { prisma, Role } from "@birthub/database";
import request from "supertest";

import { createDashboardRouter } from "../src/modules/dashboard/router.js";
import {
  createAuthenticatedApiTestApp,
  stubMethod
} from "./http-test-helpers.js";
import { createTestApiConfig } from "./test-config.js";

function createDashboardTestApp(config = createTestApiConfig()) {
  return createAuthenticatedApiTestApp({
    contextOverrides: {
      role: Role.ADMIN
    },
    router: createDashboardRouter(config)
  });
}

void test("dashboard router updates onboarding flag through the authenticated tenant scope", async () => {
  let receivedOrganizationLookup: unknown = null;
  let receivedOrganizationUpdate: unknown = null;
  const restores = [
    stubMethod(prisma.organization, "findFirst", (args: unknown) => {
      receivedOrganizationLookup = args;
      return Promise.resolve({
        settings: {
          onboarding: true,
          theme: "warm"
        }
      });
    }),
    stubMethod(prisma.organization, "update", (args: unknown) => {
      receivedOrganizationUpdate = args;
      return Promise.resolve({
        id: "org_1"
      });
    })
  ];

  try {
    const response = await request(createDashboardTestApp())
      .patch("/api/v1/dashboard/onboarding")
      .send({
        enabled: false
      })
      .expect(200);

    assert.deepEqual(receivedOrganizationLookup, {
      select: {
        settings: true
      },
      where: {
        id: "org_1",
        tenantId: "tenant_1"
      }
    });
    assert.deepEqual(receivedOrganizationUpdate, {
      data: {
        settings: {
          onboarding: false,
          theme: "warm"
        }
      },
      where: {
        id: "org_1",
        tenantId: "tenant_1"
      }
    });
    assert.deepEqual(response.body, {
      enabled: false,
      requestId: "req_1"
    });
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("dashboard router rejects onboarding updates without an explicit boolean flag", async () => {
  const response = await request(createDashboardTestApp())
    .patch("/api/v1/dashboard/onboarding")
    .send({})
    .expect(400);

  assert.equal(response.body.status, 400);
  assert.equal(response.body.title, "Bad Request");
});

void test("dashboard router rejects onboarding updates with unexpected properties", async () => {
  const response = await request(createDashboardTestApp())
    .patch("/api/v1/dashboard/onboarding")
    .send({
      enabled: true,
      extra: "unexpected"
    })
    .expect(400);

  assert.equal(response.body.status, 400);
  assert.equal(response.body.title, "Bad Request");
});

void test("dashboard router returns not found when onboarding settings target an unknown organization", async () => {
  const restore = stubMethod(prisma.organization, "findFirst", () => Promise.resolve(null));

  try {
    const response = await request(createDashboardTestApp())
      .patch("/api/v1/dashboard/onboarding")
      .send({
        enabled: true
      })
      .expect(404);

    assert.equal(response.body.status, 404);
    assert.equal(response.body.title, "Not Found");
  } finally {
    restore();
  }
});

void test("dashboard router disables the clinical summary route when the clinical workspace capability is off", async () => {
  const response = await request(createDashboardTestApp())
    .get("/api/v1/dashboard/clinical-summary")
    .expect(404);

  assert.equal(response.body.status, 404);
  assert.equal(response.body.title, "Not Found");
  assert.match(String(response.body.detail ?? ""), /clinical workspace is disabled/i);
});

void test("dashboard router returns the clinical summary when the clinical workspace is enabled", async () => {
  const restores = [
    stubMethod(prisma.patient, "count", () => Promise.resolve(0)),
    stubMethod(prisma.patient, "findMany", () => Promise.resolve([])),
    stubMethod(prisma.pregnancyRecord, "count", () => Promise.resolve(0)),
    stubMethod(prisma.appointment, "count", () => Promise.resolve(0)),
    stubMethod(prisma.neonatalRecord, "count", () => Promise.resolve(0))
  ];

  try {
    const response = await request(
      createDashboardTestApp({
        ...createTestApiConfig(),
        clinicalWorkspaceEnabled: true
      })
    )
      .get("/api/v1/dashboard/clinical-summary")
      .expect(200);

    assert.deepEqual(response.body.alerts, []);
    assert.deepEqual(response.body.spotlight, []);
    assert.deepEqual(
      response.body.metrics.map((metric: { value: number }) => metric.value),
      [0, 0, 0, 0]
    );
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
