import assert from "node:assert/strict";
import test from "node:test";

import { createDeepHealthService, createHealthService, createReadinessHealthService } from "../src/lib/health.js";
import { createTestApiConfig } from "./test-config.js";

void test("liveness keeps overall status ok while exposing dependency degradation", async () => {
  let nowTick = 0;
  const now = () => {
    nowTick += 800;
    return nowTick;
  };

  const service = createHealthService(createTestApiConfig(), {
    now,
    pingDatabase: async () => ({ status: "up" }),
    pingExternalDependency: async () => ({ name: "example.com", status: "up" }),
    pingRedis: async () => ({ status: "up" })
  });

  const payload = await service();

  assert.equal(payload.mode, "liveness");
  assert.equal(payload.status, "ok");
  assert.equal(payload.services.database.status, "degraded");
  assert.equal(payload.services.redis.status, "degraded");
});

void test("readiness marks slow strict dependencies as degraded instead of down", async () => {
  let nowTick = 0;
  const now = () => {
    nowTick += 901;
    return nowTick;
  };

  const service = createReadinessHealthService(createTestApiConfig(), {
    now,
    pingDatabase: async () => ({ status: "up" }),
    pingExternalDependency: async () => ({ name: "example.com", status: "up" }),
    pingRedis: async () => ({ status: "up" })
  });

  const payload = await service();

  assert.equal(payload.mode, "readiness");
  assert.equal(payload.status, "degraded");
  assert.equal(payload.services.database.status, "degraded");
  assert.equal(payload.services.redis.status, "degraded");
});

void test("readiness ignores external degradation for aggregate readiness", async () => {
  const service = createReadinessHealthService(createTestApiConfig({
    EXTERNAL_HEALTHCHECK_URLS: "https://example.com"
  }), {
    pingDatabase: async () => ({ status: "up" }),
    pingExternalDependency: async () => ({ name: "example.com", status: "down" }),
    pingRedis: async () => ({ status: "up" })
  });

  const payload = await service();

  assert.equal(payload.status, "ok");
  assert.equal(payload.services.externalDependencies[0]?.status, "down");
});

void test("diagnostic mode uses the deep probe and preserves deep response mode", async () => {
  let pingDatabaseCalled = 0;
  let pingDatabaseDeepCalled = 0;

  const service = createDeepHealthService(createTestApiConfig(), {
    pingDatabase: async () => {
      pingDatabaseCalled += 1;
      return { status: "up" };
    },
    pingDatabaseDeep: async () => {
      pingDatabaseDeepCalled += 1;
      return { status: "up" };
    },
    pingExternalDependency: async () => ({ name: "example.com", status: "up" }),
    pingRedis: async () => ({ status: "up" })
  });

  const payload = await service();

  assert.equal(payload.mode, "deep");
  assert.equal(payload.status, "ok");
  assert.equal(pingDatabaseCalled, 0);
  assert.equal(pingDatabaseDeepCalled, 1);
});
