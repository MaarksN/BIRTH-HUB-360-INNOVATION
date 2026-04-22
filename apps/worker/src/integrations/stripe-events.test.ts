import assert from "node:assert/strict";
import test from "node:test";

import { extractStripePaymentPayload } from "./stripe-events.js";

void test("extractStripePaymentPayload accepts payment intent payloads", () => {
  assert.deepEqual(
    extractStripePaymentPayload({
      objectId: "pi_123",
      objectType: "payment_intent",
      stripe: {
        type: "payment_intent.succeeded"
      }
    }),
    {
      objectId: "pi_123",
      objectType: "payment_intent"
    }
  );
});

void test("extractStripePaymentPayload infers charge payloads from the Stripe event envelope", () => {
  assert.deepEqual(
    extractStripePaymentPayload({
      stripe: {
        data: {
          object: {
            id: "ch_123",
            object: "charge"
          }
        },
        type: "charge.succeeded"
      }
    }),
    {
      objectId: "ch_123",
      objectType: "charge"
    }
  );
});

void test("extractStripePaymentPayload rejects payloads without identifiers", () => {
  assert.throws(
    () =>
      extractStripePaymentPayload({
        objectType: "payment_intent"
      }),
    /STRIPE_PAYMENT_ID_REQUIRED/
  );
});

void test("extractStripePaymentPayload rejects unsupported Stripe objects", () => {
  assert.throws(
    () =>
      extractStripePaymentPayload({
        objectId: "cus_123",
        objectType: "customer"
      }),
    /STRIPE_PAYMENT_OBJECT_TYPE_UNSUPPORTED/
  );
});
