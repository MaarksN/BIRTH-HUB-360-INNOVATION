import assert from "node:assert/strict";
import test from "node:test";

import { EnvValidationError } from "./shared.js";
import { getWorkerConfig } from "./worker.config.js";

const baseEnv = {
  DATABASE_URL: "postgresql://postgres:postgrespassword@localhost:5432/birthub_cycle1",
  NODE_ENV: "test",
  REDIS_URL: "redis://localhost:6379"
} satisfies NodeJS.ProcessEnv;

void test("worker config fails fast in production when transport or secrets are insecure", () => {
  assert.throws(
    () =>
      getWorkerConfig({
        ...baseEnv,
        BILLING_EXPORT_STORAGE_MODE: "s3",
        DATABASE_URL: "postgresql://postgres:postgrespassword@localhost:5432/birthub_cycle1",
        JOB_HMAC_GLOBAL_SECRET: "dev-job-hmac-secret",
        NODE_ENV: "production",
        REDIS_URL: "redis://localhost:6379"
      }),
    (error: unknown) => {
      assert.ok(error instanceof EnvValidationError);
      const message = error instanceof Error ? error.message : String(error);
      assert.match(message, /DATABASE_URL must include sslmode=require/i);
      assert.match(message, /REDIS_URL must use TLS/i);
      assert.match(message, /JOB_HMAC_GLOBAL_SECRET cannot use the development default/i);
      assert.match(message, /BILLING_EXPORT_S3_BUCKET must be set/i);
      assert.match(message, /SENTRY_DSN must be configured in production/i);
      return true;
    }
  );
});

void test("worker config accepts hardened production settings", () => {
  const config = getWorkerConfig({
    ...baseEnv,
    BILLING_EXPORT_S3_BUCKET: "birthub-billing-exports",
    BILLING_EXPORT_STORAGE_MODE: "s3",
    DATABASE_URL:
      "postgresql://postgres:postgrespassword@localhost:5432/birthub_cycle1?sslmode=require",
    JOB_HMAC_GLOBAL_SECRET: "prod-hmac-secret-123",
    NODE_ENV: "production",
    REDIS_URL: "rediss://localhost:6379",
    SENTRY_DSN: "https://public@example.ingest.sentry.io/123456"
  });

  assert.equal(config.NODE_ENV, "production");
  assert.equal(config.BILLING_EXPORT_STORAGE_MODE, "s3");
  assert.equal(config.BILLING_EXPORT_S3_BUCKET, "birthub-billing-exports");
});

void test("worker config exposes OTEL defaults without requiring process.env reads in runtime code", () => {
  const config = getWorkerConfig(baseEnv);

  assert.equal(config.OTEL_EXPORTER_OTLP_ENDPOINT, undefined);
  assert.equal(config.OTEL_SERVICE_NAME, "birthub-worker");
});
