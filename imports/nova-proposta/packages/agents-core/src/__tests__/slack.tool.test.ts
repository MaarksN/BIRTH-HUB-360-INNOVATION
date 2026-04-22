import assert from "node:assert/strict";
import test from "node:test";

import { postSlackMessage } from "../tools/slack.tool.js";

function readRequestUrl(url: RequestInfo | URL): string {
  if (typeof url === "string") {
    return url;
  }

  if (url instanceof URL) {
    return url.toString();
  }

  return url.url;
}

function readJsonBody(init?: RequestInit): Record<string, unknown> {
  const body = init?.body;
  if (typeof body !== "string") {
    throw new TypeError("Expected request body to be a JSON string");
  }
  return JSON.parse(body) as Record<string, unknown>;
}

function readHeader(init: RequestInit | undefined, name: string): string | null {
  return new Headers(init?.headers).get(name);
}

void test("slack tool simulates by default", async () => {
  const result = await postSlackMessage({
    channel: "ops-alerts",
    mode: "api",
    text: "hello"
  });

  assert.equal(result.mode, "api");
  assert.equal(result.ok, true);
  assert.ok(result.ts.length > 0);
});

void test("slack tool requires webhookUrl for webhook mode when simulation is disabled", async () => {
  await assert.rejects(
    () =>
      postSlackMessage(
        {
          channel: "ops-alerts",
          mode: "webhook",
          text: "hello"
        },
        {
          simulate: false
        }
      ),
    /webhookUrl is required/i
  );
});

void test("slack tool posts webhook payload and rejects non-ok webhook responses", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ init: RequestInit | undefined; url: RequestInfo | URL }> = [];

  globalThis.fetch = ((url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ init, url });
    return Promise.resolve(new Response("boom", { status: 500 }));
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        postSlackMessage(
          {
            channel: "ops-alerts",
            mode: "webhook",
            text: "hello",
            webhookUrl: "https://hooks.slack.test/services/abc"
          },
          {
            simulate: false
          }
        ),
      /Slack webhook failed with status 500/i
    );

    assert.equal(calls.length, 1);
    assert.equal(readRequestUrl(calls[0]!.url), "https://hooks.slack.test/services/abc");
    assert.equal(calls[0]?.init?.method, "POST");
    assert.equal(readHeader(calls[0]?.init, "content-type"), "application/json");
    assert.deepEqual(readJsonBody(calls[0]?.init), {
      channel: "ops-alerts",
      text: "hello"
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("slack tool posts API payload with bearer token and returns success on ok response", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ init: RequestInit | undefined; url: RequestInfo | URL }> = [];

  globalThis.fetch = ((url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ init, url });
    return Promise.resolve(new Response("ok", { status: 200 }));
  }) as typeof fetch;

  try {
    const result = await postSlackMessage(
      {
        channel: "ops-alerts",
        mode: "api",
        text: "hello",
        token: "token-123"
      },
      {
        simulate: false
      }
    );

    assert.equal(result.mode, "api");
    assert.equal(result.ok, true);
    assert.ok(result.ts.length > 0);
    assert.equal(calls.length, 1);
    assert.equal(readRequestUrl(calls[0]!.url), "https://slack.com/api/chat.postMessage");
    assert.equal(calls[0]?.init?.method, "POST");
    assert.equal(readHeader(calls[0]?.init, "authorization"), "Bearer token-123");
    assert.deepEqual(readJsonBody(calls[0]?.init), {
      channel: "ops-alerts",
      text: "hello"
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("slack tool requires API token and rejects non-ok API responses", async () => {
  await assert.rejects(
    () =>
      postSlackMessage(
        {
          channel: "ops-alerts",
          mode: "api",
          text: "hello"
        },
        {
          simulate: false
        }
      ),
    /token is required/i
  );

  const originalFetch = globalThis.fetch;

  globalThis.fetch = (() => Promise.resolve(new Response("nope", { status: 401 }))) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        postSlackMessage(
          {
            channel: "ops-alerts",
            mode: "api",
            text: "hello",
            token: "token-123"
          },
          {
            simulate: false
          }
        ),
      /Slack API failed with status 401/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("slack tool propagates timeout through abort signal", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = ((_: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const abortHandler = () => {
        const reason: unknown = init?.signal?.reason;
        if (reason instanceof Error) {
          reject(reason);
        } else if (typeof reason === "string") {
          reject(new Error(reason));
        } else {
          reject(new Error("aborted"));
        }
      };

      if (init?.signal?.aborted) {
        abortHandler();
      } else {
        init?.signal?.addEventListener("abort", abortHandler, { once: true });
        setTimeout(() => reject(new Error("timeout")), 10);
      }
    })) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        postSlackMessage(
          {
            channel: "ops-alerts",
            mode: "webhook",
            text: "hello",
            webhookUrl: "https://hooks.slack.test/services/abc"
          },
          {
            simulate: false
          }
        ),
      /The operation was aborted|aborted|timeout/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
