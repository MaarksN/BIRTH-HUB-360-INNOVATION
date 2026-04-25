import assert from "node:assert/strict";
import test from "node:test";

import Stripe from "stripe";

import { ProblemDetailsError } from "../src/lib/problem-details.js";
import {
  buildStripeConnectorWebhookPayload,
  constructStripeConnectorEvent
} from "../src/modules/connectors/stripe-webhook.js";
import { createTestApiConfig } from "../tests/test-config.js";

const stripe = new Stripe("placeholder");

void test("constructStripeConnectorEvent validates a signed Stripe webhook", () => {
  const payload = JSON.stringify({
    data: {
      object: {
        id: "pi_123",
        object: "payment_intent"
      }
    },
    id: "evt_123",
    type: "payment_intent.succeeded"
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: "whsec_test_connector"
  });

  const event = constructStripeConnectorEvent({
    config: createTestApiConfig({
      STRIPE_WEBHOOK_TOLERANCE_SECONDS: "300"
    }),
    rawBody: payload,
    signature,
    webhookSecret: "whsec_test_connector"
  });

  const webhookPayload = buildStripeConnectorWebhookPayload(event);

  assert.equal(event.id, "evt_123");
  assert.equal(event.type, "payment_intent.succeeded");
  assert.deepEqual(webhookPayload.objectId, "pi_123");
  assert.deepEqual(webhookPayload.objectType, "payment_intent");
});

void test("constructStripeConnectorEvent accepts payment_intent.payment_failed payloads", () => {
  const payload = JSON.stringify({
    data: {
      object: {
        id: "pi_failed",
        object: "payment_intent",
        status: "requires_payment_method"
      }
    },
    id: "evt_failed",
    type: "payment_intent.payment_failed"
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: "whsec_test_connector"
  });

  const event = constructStripeConnectorEvent({
    config: createTestApiConfig(),
    rawBody: payload,
    signature,
    webhookSecret: "whsec_test_connector"
  });
  const webhookPayload = buildStripeConnectorWebhookPayload(event);

  assert.equal(event.type, "payment_intent.payment_failed");
  assert.deepEqual(webhookPayload.objectId, "pi_failed");
  assert.deepEqual(webhookPayload.objectType, "payment_intent");
});

void test("buildStripeConnectorWebhookPayload accepts charge events in scope", () => {
  const payload = JSON.stringify({
    data: {
      object: {
        id: "ch_123",
        object: "charge",
        payment_intent: "pi_123"
      }
    },
    id: "evt_charge",
    type: "charge.succeeded"
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: "whsec_test_connector"
  });

  const event = constructStripeConnectorEvent({
    config: createTestApiConfig(),
    rawBody: payload,
    signature,
    webhookSecret: "whsec_test_connector"
  });
  const webhookPayload = buildStripeConnectorWebhookPayload(event);

  assert.equal(event.type, "charge.succeeded");
  assert.deepEqual(webhookPayload.objectId, "ch_123");
  assert.deepEqual(webhookPayload.objectType, "charge");
});

void test("constructStripeConnectorEvent rejects invalid signatures", () => {
  const payload = JSON.stringify({
    data: {
      object: {
        id: "pi_401",
        object: "payment_intent"
      }
    },
    id: "evt_invalid",
    type: "payment_intent.payment_failed"
  });

  assert.throws(
    () =>
      constructStripeConnectorEvent({
        config: createTestApiConfig(),
        rawBody: payload,
        signature: "t=12345,v1=invalid",
        webhookSecret: "whsec_test_connector"
      }),
    (error: unknown) =>
      error instanceof ProblemDetailsError &&
      error.status === 401 &&
      error.detail === "Invalid Stripe webhook signature."
  );
});
