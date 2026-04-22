import assert from "node:assert/strict";
import test from "node:test";

import { extractSlackMessagePayload } from "./slack-events.js";

void test("extractSlackMessagePayload accepts channel and user destinations", () => {
  assert.deepEqual(
    extractSlackMessagePayload({
      message: {
        blocks: [{ type: "section" }],
        text: "BirthHub ping",
        userId: "U123"
      }
    }),
    {
      blocks: [{ type: "section" }],
      text: "BirthHub ping",
      userId: "U123"
    }
  );
});

void test("extractSlackMessagePayload rejects payloads without text", () => {
  assert.throws(
    () =>
      extractSlackMessagePayload({
        channel: "C123"
      }),
    /SLACK_MESSAGE_TEXT_REQUIRED/
  );
});

void test("extractSlackMessagePayload rejects payloads without destination", () => {
  assert.throws(
    () =>
      extractSlackMessagePayload({
        text: "BirthHub ping"
      }),
    /SLACK_MESSAGE_DESTINATION_REQUIRED/
  );
});
