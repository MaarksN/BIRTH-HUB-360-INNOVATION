import assert from "node:assert/strict";
import test from "node:test";

import {
  StripeApiError,
  StripePaymentAdapter,
  StripeRateLimitError
} from "./stripe-payment-adapter.js";

void test("StripePaymentAdapter reads a payment intent and returns normalized metadata", async () => {
  const requests: Array<{ headers: Record<string, string>; method: string; url: string }> = [];
  const adapter = new StripePaymentAdapter({
    apiKey: "sk_test_tenant",
    fetchImpl: async (url, init) => {
      requests.push({
        headers: init.headers,
        method: init.method,
        url
      });

      return {
        json: async () => ({
          id: "pi_123",
          object: "payment_intent",
          status: "succeeded"
        }),
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: "pi_123",
            object: "payment_intent",
            status: "succeeded"
          })
      };
    }
  });

  const response = await adapter.readPayment({
    objectId: "pi_123",
    objectType: "payment_intent"
  });

  assert.deepEqual(requests, [
    {
      headers: {
        authorization: "Bearer sk_test_tenant",
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": "birthub-integrations/1.0"
      },
      method: "GET",
      url: "https://api.stripe.com/v1/payment_intents/pi_123"
    }
  ]);
  assert.equal(response.objectId, "pi_123");
  assert.equal(response.objectType, "payment_intent");
  assert.equal(response.paymentStatus, "succeeded");
  assert.equal(response.status, 200);
});

void test("StripePaymentAdapter validates API access using payment intents listing", async () => {
  const adapter = new StripePaymentAdapter({
    apiKey: "sk_test_health",
    fetchImpl: async (url) => ({
      json: async () => ({
        data: []
      }),
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: []
        })
    })
  });

  const response = await adapter.validateApiKey();

  assert.equal(response.request.path, "/v1/payment_intents?limit=1");
  assert.equal(response.objectType, "payment_intent");
});

void test("StripePaymentAdapter classifies auth and rate limit failures", async () => {
  const authAdapter = new StripePaymentAdapter({
    apiKey: "sk_invalid",
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
  const rateLimitAdapter = new StripePaymentAdapter({
    apiKey: "sk_rate_limit",
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
    authAdapter.readPayment({
      objectId: "pi_401",
      objectType: "payment_intent"
    }),
    (error: unknown) =>
      error instanceof StripeApiError &&
      error.code === "STRIPE_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );

  await assert.rejects(
    rateLimitAdapter.readPayment({
      objectId: "pi_429",
      objectType: "payment_intent"
    }),
    (error: unknown) =>
      error instanceof StripeRateLimitError &&
      error.code === "STRIPE_RATE_LIMIT" &&
      error.retryable === true &&
      error.statusCode === 429
  );
});
