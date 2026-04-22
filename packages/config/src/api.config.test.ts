import assert from "node:assert/strict";
import test from "node:test";

import { getApiConfig } from "./api.config.js";
import { EnvValidationError } from "./shared.js";

const baseEnv = {
  API_CORS_ORIGINS: "https://app.birthhub360.com",
  DATABASE_URL:
    "postgresql://postgres:postgrespassword@db.birthhub360.com:5432/birthub_cycle1?sslmode=require",
  NODE_ENV: "production",
  REDIS_URL: "rediss://cache.birthhub360.com:6379",
  REQUIRE_SECURE_COOKIES: "true",
  STRIPE_CANCEL_URL: "https://app.birthhub360.com/billing/cancel",
  STRIPE_PORTAL_RETURN_URL: "https://app.birthhub360.com/settings/billing",
  STRIPE_SUCCESS_URL: "https://app.birthhub360.com/billing/success",
  WEB_BASE_URL: "https://app.birthhub360.com"
} satisfies NodeJS.ProcessEnv;

void test("api config blocks placeholder production secrets and missing telemetry", () => {
  assert.throws(
    () =>
      getApiConfig({
        ...baseEnv,
        AUTH_MFA_ENCRYPTION_KEY: "replace-me-in-production",
        JOB_HMAC_GLOBAL_SECRET: "replace-me-in-production",
        SESSION_SECRET: "replace-me-in-production",
        STRIPE_SECRET_KEY: "sk_test_replace",
        STRIPE_WEBHOOK_SECRET: "whsec_replace"
      }),
    (error: unknown) => {
      assert.ok(error instanceof EnvValidationError);
      const message = error instanceof Error ? error.message : String(error);
      assert.match(message, /Production secrets cannot use development defaults/i);
      assert.match(message, /STRIPE_SECRET_KEY must be a live production key/i);
      assert.match(message, /STRIPE_WEBHOOK_SECRET cannot use placeholder values/i);
      assert.match(message, /SENTRY_DSN must be configured in production/i);
      return true;
    }
  );
});

void test("api config accepts hardened staging settings with Stripe test credentials", () => {
  const config = getApiConfig({
    ...baseEnv,
    AUTH_MFA_ENCRYPTION_KEY: "staging-mfa-encryption-key-123",
    DEPLOYMENT_ENVIRONMENT: "staging",
    JOB_HMAC_GLOBAL_SECRET: "staging-job-hmac-secret-123",
    SENTRY_DSN: "https://public@example.ingest.sentry.io/123456",
    SESSION_SECRET: "staging-session-secret-123",
    STRIPE_SECRET_KEY: "sk_test_birthhub360_staging",
    STRIPE_WEBHOOK_SECRET: "whsec_staging_birthhub360",
    WEB_BASE_URL: "https://staging.birthhub360.com"
  });

  assert.equal(config.NODE_ENV, "production");
  assert.equal(config.STRIPE_SECRET_KEY, "sk_test_birthhub360_staging");
  assert.equal(config.STRIPE_WEBHOOK_TOLERANCE_SECONDS, 300);
  assert.equal(config.clinicalWorkspaceEnabled, false);
  assert.equal(config.fhirFacadeEnabled, false);
  assert.equal(config.privacyAdvancedEnabled, false);
  assert.equal(config.privacySelfServiceEnabled, true);
});

void test("api config accepts hardened production settings", () => {
  const config = getApiConfig({
    ...baseEnv,
    ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS: "false",
    AUTH_MFA_ENCRYPTION_KEY: "prod-mfa-encryption-key-123",
    JOB_HMAC_GLOBAL_SECRET: "prod-job-hmac-secret-123",
    SENTRY_DSN: "https://public@example.ingest.sentry.io/123456",
    SESSION_SECRET: "prod-session-secret-123",
    STRIPE_SECRET_KEY: "sk_live_birthhub360",
    STRIPE_WEBHOOK_SECRET: "whsec_live_birthhub360"
  });

  assert.equal(config.NODE_ENV, "production");
  assert.equal(config.STRIPE_SECRET_KEY, "sk_live_birthhub360");
  assert.equal(config.SENTRY_DSN, "https://public@example.ingest.sentry.io/123456");
  assert.equal(config.STRIPE_WEBHOOK_TOLERANCE_SECONDS, 300);
  assert.equal(config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS, false);
  assert.equal(config.OMIE_BASE_URL, "https://app.omie.com.br/api/v1");
  assert.equal(config.clinicalWorkspaceEnabled, false);
  assert.equal(config.fhirFacadeEnabled, false);
  assert.equal(config.privacyAdvancedEnabled, false);
  assert.equal(config.privacySelfServiceEnabled, true);
});

void test("api config parses the legacy plaintext connector migration override explicitly", () => {
  const config = getApiConfig({
    ...baseEnv,
    ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS: "true",
    AUTH_MFA_ENCRYPTION_KEY: "staging-mfa-encryption-key-123",
    DEPLOYMENT_ENVIRONMENT: "staging",
    JOB_HMAC_GLOBAL_SECRET: "staging-job-hmac-secret-123",
    SENTRY_DSN: "https://public@example.ingest.sentry.io/123456",
    SESSION_SECRET: "staging-session-secret-123",
    STRIPE_SECRET_KEY: "sk_test_birthhub360_staging",
    STRIPE_WEBHOOK_SECRET: "whsec_staging_birthhub360",
    WEB_BASE_URL: "https://staging.birthhub360.com"
  });

  assert.equal(config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS, true);
});

void test("api config exposes rotating secret candidates for auth and webhook verification", () => {
  const config = getApiConfig({
    ...baseEnv,
    AUTH_MFA_ENCRYPTION_KEY: "staging-mfa-encryption-key-123",
    DEPLOYMENT_ENVIRONMENT: "staging",
    GOOGLE_CLIENT_SECRET: "google-client-secret-123",
    HUBSPOT_CLIENT_SECRET: "hubspot-client-secret-123",
    JOB_HMAC_GLOBAL_SECRET: "staging-job-hmac-secret-123",
    JOB_HMAC_GLOBAL_SECRET_FALLBACKS: "legacy-job-hmac-1, legacy-job-hmac-2",
    MICROSOFT_CLIENT_SECRET: "microsoft-client-secret-123",
    SENTRY_DSN: "https://public@example.ingest.sentry.io/123456",
    SESSION_SECRET: "staging-session-secret-123",
    SESSION_SECRET_FALLBACKS: "legacy-session-1, legacy-session-2",
    STRIPE_SECRET_KEY: "sk_test_birthhub360_staging",
    STRIPE_WEBHOOK_SECRET: "whsec_staging_birthhub360",
    STRIPE_WEBHOOK_SECRET_FALLBACKS: "whsec_legacy_a, whsec_legacy_b",
    WEB_BASE_URL: "https://staging.birthhub360.com"
  });

  assert.deepEqual(config.sessionSecretCandidates, [
    "staging-session-secret-123",
    "legacy-session-1",
    "legacy-session-2"
  ]);
  assert.deepEqual(config.jobHmacSecretCandidates, [
    "staging-job-hmac-secret-123",
    "legacy-job-hmac-1",
    "legacy-job-hmac-2"
  ]);
  assert.deepEqual(config.stripeWebhookSecretCandidates, [
    "whsec_staging_birthhub360",
    "whsec_legacy_a",
    "whsec_legacy_b"
  ]);
  assert.equal(config.secretCatalog.session.primarySource.backend, "literal");
  assert.equal(config.secretCatalog.jobHmac.fallbackSources.length, 2);
});
