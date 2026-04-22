import assert from "node:assert/strict";
import test from "node:test";

import { extractZenviaMessagePayload } from "./zenvia-events.js";

void test("extractZenviaMessagePayload accepts a direct outbound payload", () => {
  assert.deepEqual(
    extractZenviaMessagePayload({
      channel: "whatsapp",
      from: "5511999999999",
      text: "BirthHub ping",
      to: "5511888888888"
    }),
    {
      channel: "whatsapp",
      from: "5511999999999",
      text: "BirthHub ping",
      to: "5511888888888"
    }
  );
});

void test("extractZenviaMessagePayload accepts a nested message payload", () => {
  assert.deepEqual(
    extractZenviaMessagePayload({
      message: {
        channelType: "whatsapp",
        from: "5511999999999",
        properties: {
          text: "BirthHub ping"
        },
        to: "5511888888888"
      }
    }),
    {
      channel: "whatsapp",
      from: "5511999999999",
      text: "BirthHub ping",
      to: "5511888888888"
    }
  );
});

void test("extractZenviaMessagePayload rejects payloads without required fields", () => {
  assert.throws(
    () =>
      extractZenviaMessagePayload({
        channel: "whatsapp",
        from: "5511999999999"
      }),
    /ZENVIA_MESSAGE_TO_REQUIRED/
  );
});
