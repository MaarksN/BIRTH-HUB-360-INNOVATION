import assert from "node:assert/strict";
import test from "node:test";

import { buildConnectorLogFields, resolveConnectorAttemptState } from "./connector-events.shared.js";

void test("resolveConnectorAttemptState computes exponential backoff for retries", () => {
  const state = resolveConnectorAttemptState({
    attemptsMade: 1,
    opts: {
      attempts: 5,
      backoff: {
        delay: 1_500,
        type: "exponential"
      }
    }
  } as never, new Date("2026-04-20T12:00:00.000Z"));

  assert.equal(state.currentAttempt, 2);
  assert.equal(state.hasRemainingAttempts, true);
  assert.equal(state.maxAttempts, 5);
  assert.equal(state.nextRetryDelayMs, 3_000);
  assert.equal(state.nextRetryAt?.toISOString(), "2026-04-20T12:00:03.000Z");
});

void test("buildConnectorLogFields emits the standardized connector log shape", () => {
  assert.deepEqual(
    buildConnectorLogFields({
      action: "crm.contact.upsert",
      durationMs: 842,
      error: {
        code: "HUBSPOT_RATE_LIMIT",
        message: "HubSpot API rate limit reached.",
        provider: "hubspot",
        retryable: true,
        statusCode: 429
      },
      event: {
        eventId: "evt_1",
        provider: "hubspot",
        tenantId: "tenant_1"
      },
      status: "retrying"
    }),
    {
      action: "crm.contact.upsert",
      duration: 842,
      error: "HubSpot API rate limit reached.",
      eventId: "evt_1",
      provider: "hubspot",
      status: "retrying",
      tenantId: "tenant_1"
    }
  );
});
