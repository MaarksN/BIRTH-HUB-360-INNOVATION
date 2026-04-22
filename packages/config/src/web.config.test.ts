import assert from "node:assert/strict";
import test from "node:test";

import { getWebConfig } from "./web.config.js";
import { EnvValidationError } from "./shared.js";

void test("web config requires production telemetry endpoints", () => {
  assert.throws(
    () =>
      getWebConfig({
        NEXT_PUBLIC_API_URL: "https://api.birthhub360.com",
        NEXT_PUBLIC_APP_URL: "https://app.birthhub360.com",
        NEXT_PUBLIC_CSP_REPORT_ONLY: "false",
        NEXT_PUBLIC_ENVIRONMENT: "production"
      }),
    (error: unknown) => {
      assert.ok(error instanceof EnvValidationError);
      const message = error instanceof Error ? error.message : String(error);
      assert.match(message, /NEXT_PUBLIC_SENTRY_DSN must be configured in production/i);
      return true;
    }
  );
});

void test("web config rejects placeholder auth secrets in production", () => {
  assert.throws(
    () =>
      getWebConfig({
        NEXTAUTH_SECRET: "replace-me-in-production",
        NEXT_PUBLIC_API_URL: "https://api.birthhub360.com",
        NEXT_PUBLIC_APP_URL: "https://app.birthhub360.com",
        NEXT_PUBLIC_CSP_REPORT_ONLY: "false",
        NEXT_PUBLIC_ENVIRONMENT: "production",
        NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/123456"
      }),
    (error: unknown) => {
      assert.ok(error instanceof EnvValidationError);
      const message = error instanceof Error ? error.message : String(error);
      assert.match(message, /NEXTAUTH_SECRET cannot use placeholder values in production/i);
      return true;
    }
  );
});

void test("web config accepts hardened production settings", () => {
  const config = getWebConfig({
    NEXTAUTH_SECRET: "prod-nextauth-secret-123",
    NEXT_PUBLIC_API_URL: "https://api.birthhub360.com",
    NEXT_PUBLIC_APP_URL: "https://app.birthhub360.com",
    NEXT_PUBLIC_CSP_REPORT_ONLY: "false",
    NEXT_PUBLIC_ENVIRONMENT: "production",
    NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/123456"
  });

  assert.equal(config.NEXT_PUBLIC_ENVIRONMENT, "production");
  assert.equal(config.NEXTAUTH_SECRET, "prod-nextauth-secret-123");
  assert.equal(config.clinicalWorkspaceEnabled, false);
  assert.equal(config.fhirFacadeEnabled, false);
  assert.equal(config.privacyAdvancedEnabled, false);
  assert.equal(config.privacySelfServiceEnabled, true);
});

void test("web config accepts staging label with production-grade guardrails", () => {
  const config = getWebConfig({
    NEXTAUTH_SECRET: "staging-nextauth-secret-123",
    NEXT_PUBLIC_API_URL: "https://staging-api.birthhub360.com",
    NEXT_PUBLIC_APP_URL: "https://staging.birthhub360.com",
    NEXT_PUBLIC_CSP_REPORT_ONLY: "false",
    NEXT_PUBLIC_ENVIRONMENT: "staging",
    NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/123456"
  });

  assert.equal(config.NEXT_PUBLIC_ENVIRONMENT, "staging");
});

void test("web config maps public capability flags into product capabilities", () => {
  const config = getWebConfig({
    NEXT_PUBLIC_API_URL: "https://api.birthhub360.com",
    NEXT_PUBLIC_APP_URL: "https://app.birthhub360.com",
    NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: "true",
    NEXT_PUBLIC_ENABLE_FHIR_FACADE: "true",
    NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED: "true",
    NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE: "false",
    NEXT_PUBLIC_ENVIRONMENT: "development"
  });

  assert.equal(config.clinicalWorkspaceEnabled, true);
  assert.equal(config.fhirFacadeEnabled, true);
  assert.equal(config.privacyAdvancedEnabled, true);
  assert.equal(config.privacySelfServiceEnabled, false);
});
