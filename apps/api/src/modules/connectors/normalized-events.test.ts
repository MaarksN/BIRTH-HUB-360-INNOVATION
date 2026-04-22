import assert from "node:assert/strict";
import test from "node:test";

import {
  buildZenviaExternalEventId,
  normalizeZenviaConnectorEvent
} from "./normalized-events.js";

void test("buildZenviaExternalEventId prefers the explicit external id", () => {
  assert.equal(
    buildZenviaExternalEventId({
      eventType: "message.send",
      externalEventId: "evt_123",
      payload: {
        channel: "whatsapp",
        to: "5511888888888"
      }
    }),
    "evt_123"
  );
});

void test("normalizeZenviaConnectorEvent produces a message.send webhook event", () => {
  const receivedAt = "2026-04-20T15:00:00.000Z";

  assert.deepEqual(
    normalizeZenviaConnectorEvent({
      eventType: "message.send",
      payload: {
        channel: "whatsapp",
        from: "5511999999999",
        text: "BirthHub ping",
        to: "5511888888888"
      },
      receivedAt
    }),
    {
      action: "message.send",
      eventType: "message.send",
      externalEventId: buildZenviaExternalEventId({
        eventType: "message.send",
        payload: {
          channel: "whatsapp",
          from: "5511999999999",
          text: "BirthHub ping",
          to: "5511888888888"
        }
      }),
      objectId: "5511888888888",
      occurredAt: receivedAt,
      payload: {
        channel: "whatsapp",
        from: "5511999999999",
        text: "BirthHub ping",
        to: "5511888888888"
      },
      provider: "zenvia",
      receivedAt,
      source: "webhook"
    }
  );
});
