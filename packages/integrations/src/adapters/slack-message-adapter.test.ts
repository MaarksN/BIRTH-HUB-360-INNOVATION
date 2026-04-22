import assert from "node:assert/strict";
import test from "node:test";

import { SlackApiError, SlackMessageAdapter } from "./slack-message-adapter.js";

void test("slack adapter sends a channel message", async () => {
  const calls: Array<{ url: string; init: { body?: string; method: string } }> = [];
  const adapter = new SlackMessageAdapter({
    accessToken: "xoxb-test-token",
    fetchImpl: async (url, init) => {
      calls.push({
        init: {
          ...(init.body ? { body: init.body } : {}),
          method: init.method
        },
        url
      });

      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            channel: "C123",
            ok: true,
            ts: "1710000000.123456"
          }),
        json: async () => ({
          channel: "C123",
          ok: true,
          ts: "1710000000.123456"
        })
      };
    }
  });

  const response = await adapter.sendMessage({
    channel: "C123",
    text: "BirthHub ping"
  });

  assert.equal(response.channelId, "C123");
  assert.equal(response.messageTs, "1710000000.123456");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "https://slack.com/api/chat.postMessage");
  assert.deepEqual(JSON.parse(calls[0]?.init.body ?? "{}"), {
    channel: "C123",
    text: "BirthHub ping"
  });
});

void test("slack adapter opens a DM before sending to a user", async () => {
  const urls: string[] = [];
  const adapter = new SlackMessageAdapter({
    accessToken: "xoxb-test-token",
    fetchImpl: async (url, init) => {
      urls.push(url);

      if (url.endsWith("/conversations.open")) {
        assert.deepEqual(JSON.parse(init.body ?? "{}"), {
          users: "U123"
        });

        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              channel: {
                id: "D123"
              },
              ok: true
            }),
          json: async () => ({
            channel: {
              id: "D123"
            },
            ok: true
          })
        };
      }

      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            channel: "D123",
            ok: true,
            ts: "1710000000.123456"
          }),
        json: async () => ({
          channel: "D123",
          ok: true,
          ts: "1710000000.123456"
        })
      };
    }
  });

  const response = await adapter.sendMessage({
    text: "BirthHub DM",
    userId: "U123"
  });

  assert.equal(response.channelId, "D123");
  assert.deepEqual(urls, [
    "https://slack.com/api/conversations.open",
    "https://slack.com/api/chat.postMessage"
  ]);
});

void test("slack adapter classifies invalid auth as fatal", async () => {
  const adapter = new SlackMessageAdapter({
    accessToken: "invalid-token",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          error: "invalid_auth",
          ok: false
        }),
      json: async () => ({
        error: "invalid_auth",
        ok: false
      })
    })
  });

  await assert.rejects(
    adapter.validateAccessToken(),
    (error: unknown) =>
      error instanceof SlackApiError &&
      error.code === "SLACK_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );
});
