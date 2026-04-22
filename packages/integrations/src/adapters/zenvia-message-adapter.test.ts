import assert from "node:assert/strict";
import test from "node:test";

import { ZenviaApiError, ZenviaMessageAdapter } from "./zenvia-message-adapter.js";

void test("zenvia adapter sends a text message to the configured channel", async () => {
  const calls: Array<{ init: { body?: string; headers: Record<string, string>; method: string }; url: string }> =
    [];
  const adapter = new ZenviaMessageAdapter({
    apiToken: "zenvia-api-token",
    fetchImpl: async (url, init) => {
      calls.push({
        init: {
          ...(init.body ? { body: init.body } : {}),
          headers: init.headers,
          method: init.method
        },
        url
      });

      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            externalId: "evt_123",
            id: "msg_123"
          }),
        json: async () => ({
          externalId: "evt_123",
          id: "msg_123"
        })
      };
    }
  });

  const response = await adapter.sendMessage({
    channel: "whatsapp",
    externalId: "evt_123",
    from: "5511999999999",
    text: "BirthHub ping",
    to: "5511888888888"
  });

  assert.equal(response.messageId, "msg_123");
  assert.equal(response.externalId, "evt_123");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "https://api.zenvia.com/v2/channels/whatsapp/messages");
  assert.equal(calls[0]?.init.headers["X-API-TOKEN"], "zenvia-api-token");
  assert.deepEqual(JSON.parse(calls[0]?.init.body ?? "{}"), {
    contents: [
      {
        text: "BirthHub ping",
        type: "text"
      }
    ],
    externalId: "evt_123",
    from: "5511999999999",
    to: "5511888888888"
  });
});

void test("zenvia adapter validates api token through subscriptions listing", async () => {
  const calls: string[] = [];
  const adapter = new ZenviaMessageAdapter({
    apiToken: "zenvia-api-token",
    fetchImpl: async (url) => {
      calls.push(url);

      return {
        ok: true,
        status: 200,
        text: async () => "[]",
        json: async () => []
      };
    }
  });

  const response = await adapter.validateApiToken();

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["https://api.zenvia.com/v2/subscriptions"]);
});

void test("zenvia adapter classifies invalid auth as fatal", async () => {
  const adapter = new ZenviaMessageAdapter({
    apiToken: "invalid-token",
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: "invalid token" }),
      json: async () => ({
        message: "invalid token"
      })
    })
  });

  await assert.rejects(
    adapter.validateApiToken(),
    (error: unknown) =>
      error instanceof ZenviaApiError &&
      error.code === "ZENVIA_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );
});
