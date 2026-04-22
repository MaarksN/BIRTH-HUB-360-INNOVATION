import assert from "node:assert/strict";
import test from "node:test";

import { ConnectorExecutionError } from "./errors.js";
import { createDefaultConnectorRuntime } from "./runtime.js";

void test("runtime surfaces retryable connector errors for Stripe rate limiting", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({
        error: {
          message: "Too many requests"
        }
      }),
      ok: false,
      status: 429,
      text: async () =>
        JSON.stringify({
          error: {
            message: "Too many requests"
          }
        })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "payment.read",
      credentials: {
        apiKey: "sk_test_rate_limited"
      },
      payload: {
        objectId: "pi_123",
        objectType: "payment_intent"
      },
      provider: "stripe"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "STRIPE_RATE_LIMIT" &&
      error.retryable === true &&
      error.statusCode === 429
  );
});

void test("runtime surfaces fatal connector errors for Stripe auth failures", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({
        error: {
          message: "Invalid API Key provided"
        }
      }),
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          error: {
            message: "Invalid API Key provided"
          }
        })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "payment.read",
      credentials: {
        apiKey: "sk_test_invalid"
      },
      payload: {
        objectId: "pi_123",
        objectType: "payment_intent"
      },
      provider: "stripe"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "STRIPE_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );
});
