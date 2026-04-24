import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStripeExternalEventId,
  buildHubspotExternalEventId,
  normalizeHubspotConnectorEvent,
  normalizeStripeConnectorEvent
} from "../src/modules/connectors/normalized-events.js";

void test("buildHubspotExternalEventId is stable for duplicate HubSpot deliveries", () => {
  const payload = {
    hubspot: [
      {
        eventId: 551,
        objectId: 991,
        occurredAt: 1_776_688_800_000,
        subscriptionType: "contact.creation"
      }
    ]
  };

  assert.equal(
    buildHubspotExternalEventId({
      eventType: "lead.created",
      payload
    }),
    buildHubspotExternalEventId({
      eventType: "lead.created",
      payload
    })
  );
});

void test("normalizeHubspotConnectorEvent captures action, objectId and externalEventId", () => {
  const normalized = normalizeHubspotConnectorEvent({
    eventType: "lead.created",
    payload: {
      hubspot: [
        {
          eventId: 551,
          objectId: 991,
          occurredAt: 1_776_688_800_000,
          subscriptionType: "contact.creation"
        }
      ]
    },
    receivedAt: "2026-04-20T12:00:00.000Z"
  });

  assert.equal(normalized.action, "crm.contact.upsert");
  assert.equal(normalized.externalEventId, "hubspot:lead.created:551:2026-04-20T12:40:00.000Z");
  assert.equal(normalized.objectId, "991");
  assert.equal(normalized.provider, "hubspot");
});

void test("buildStripeExternalEventId is stable for duplicate Stripe deliveries", () => {
  const payload = {
    objectId: "pi_123",
    objectType: "payment_intent",
    stripe: {
      created: 1_776_688_800,
      data: {
        object: {
          id: "pi_123",
          object: "payment_intent"
        }
      },
      id: "evt_123",
      type: "payment_intent.succeeded"
    }
  };

  assert.equal(
    buildStripeExternalEventId({
      eventType: "payment_intent.succeeded",
      payload
    }),
    "evt_123"
  );
  assert.equal(
    buildStripeExternalEventId({
      eventType: "payment_intent.succeeded",
      payload
    }),
    buildStripeExternalEventId({
      eventType: "payment_intent.succeeded",
      payload
    })
  );
});

void test("normalizeStripeConnectorEvent captures action, objectId and provider", () => {
  const normalized = normalizeStripeConnectorEvent({
    eventType: "payment_intent.payment_failed",
    payload: {
      objectId: "pi_456",
      objectType: "payment_intent",
      stripe: {
        created: 1_776_688_800,
        data: {
          object: {
            id: "pi_456",
            object: "payment_intent",
            status: "requires_payment_method"
          }
        },
        id: "evt_456",
        type: "payment_intent.payment_failed"
      }
    },
    receivedAt: "2026-04-20T12:00:00.000Z"
  });

  assert.equal(normalized.action, "payment.read");
  assert.equal(normalized.externalEventId, "evt_456");
  assert.equal(normalized.objectId, "pi_456");
  assert.equal(normalized.provider, "stripe");
});
