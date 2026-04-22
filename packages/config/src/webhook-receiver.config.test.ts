import assert from "node:assert/strict";
import test from "node:test";

import { EnvValidationError } from "./shared.js";
import { getWebhookReceiverConfig } from "./webhook-receiver.config.js";

void test("webhook receiver config enables strict runtime in production and exposes rotating secrets", () => {
  const config = getWebhookReceiverConfig({
    API_GATEWAY_URL: "https://api.birthhub360.com",
    HUBSPOT_CLIENT_SECRET: "hubspot-client-secret-123",
    INTERNAL_SERVICE_TOKEN: "svc_internal_123",
    JOB_HMAC_GLOBAL_SECRET: "job-hmac-current",
    JOB_HMAC_GLOBAL_SECRET_FALLBACKS: "job-hmac-legacy",
    NODE_ENV: "production",
    PRIMARY_API_URL: "https://api-primary.birthhub360.com",
    REDIS_URL: "rediss://redis.birthhub360.com:6379",
    STRIPE_WEBHOOK_SECRET: "whsec_current",
    STRIPE_WEBHOOK_SECRET_FALLBACKS: "whsec_legacy",
    SVIX_WEBHOOK_SECRET: "svix_secret_current",
    WEBHOOK_IDEMPOTENCY_TTL_SECONDS: "43200",
    WEBHOOK_RECEIVER_PORT: "3010"
  });

  assert.equal(config.strictRuntime, true);
  assert.equal(config.apiGatewayUrl, "https://api.birthhub360.com");
  assert.equal(config.primaryApiUrl, "https://api-primary.birthhub360.com");
  assert.deepEqual(config.birthhubSigningSecretCandidates, [
    "job-hmac-current",
    "job-hmac-legacy"
  ]);
  assert.deepEqual(config.stripeWebhookSecretCandidates, [
    "whsec_current",
    "whsec_legacy"
  ]);
  assert.equal(config.redisUrl, "rediss://redis.birthhub360.com:6379");
  assert.equal(config.webhookIdempotencyTtlSeconds, 43200);
});

void test("webhook receiver config rejects insecure production placeholder secrets", () => {
  assert.throws(
    () =>
      getWebhookReceiverConfig({
        API_GATEWAY_URL: "https://api.birthhub360.com",
        HUBSPOT_CLIENT_SECRET: "replace-me",
        JOB_HMAC_GLOBAL_SECRET: "dev-job-hmac-secret",
        NODE_ENV: "production",
        PRIMARY_API_URL: "https://api-primary.birthhub360.com",
        REDIS_URL: "redis://localhost:6379",
        STRIPE_WEBHOOK_SECRET: "whsec_replace",
        SVIX_WEBHOOK_SECRET: "svix_replace",
        WEBHOOK_RECEIVER_PORT: "3010"
      }),
    (error: unknown) => {
      assert.ok(error instanceof EnvValidationError);
      const message = error instanceof Error ? error.message : String(error);
      assert.match(message, /JOB_HMAC_GLOBAL_SECRET cannot use development defaults/i);
      assert.match(message, /HUBSPOT_CLIENT_SECRET cannot use placeholder values/i);
      assert.match(message, /STRIPE_WEBHOOK_SECRET cannot use placeholder values/i);
      assert.match(message, /SVIX_WEBHOOK_SECRET cannot use placeholder values/i);
      assert.match(message, /REDIS_URL must use TLS/i);
      return true;
    }
  );
});
