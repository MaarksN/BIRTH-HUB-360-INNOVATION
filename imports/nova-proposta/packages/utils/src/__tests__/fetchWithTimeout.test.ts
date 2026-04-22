import assert from "node:assert/strict";
import test from "node:test";

import { fetchWithTimeout, type FetchWithTimeoutInit } from "../fetch.js";

const originalFetch = globalThis.fetch;

void test("fetchWithTimeout resolves when the request finishes before the timeout", async () => {
  let callCount = 0;
  globalThis.fetch = (_input, init) => {
    callCount += 1;
    assert.equal(init?.signal?.aborted, false);
    return Promise.resolve(new Response("ok", { status: 200 }));
  };

  try {
    const response = await fetchWithTimeout("https://example.com", { timeoutMs: 50 });
    assert.equal(callCount, 1);
    assert.equal(response.ok, true);
    assert.equal(await response.text(), "ok");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("fetchWithTimeout rejects with a timeout error when the request exceeds the budget", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });

  globalThis.fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal;

      if (!signal) {
        reject(new Error("missing abort signal"));
        return;
      }

      signal.addEventListener("abort", () => {
        reject(signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason ?? "Aborted")));
      });
    });

  try {
    const request = fetchWithTimeout("https://example.com", { timeoutMs: 200 });
    t.mock.timers.tick(200);

    await assert.rejects(request, (error: Error) => {
      assert.equal(error.name, "FetchTimeoutError");
      assert.match(error.message, /200ms/);
      return true;
    });
  } finally {
    t.mock.timers.reset();
    globalThis.fetch = originalFetch;
  }
});

void test("fetchWithTimeout propagates an existing abort signal and its reason", async () => {
  const abortController = new AbortController();
  const abortError = new Error("cancelled by caller");

  globalThis.fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal;

      if (!signal) {
        reject(new Error("missing abort signal"));
        return;
      }

      signal.addEventListener("abort", () => {
        reject(signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason ?? "Aborted")));
      });
    });

  try {
    const request = fetchWithTimeout("https://example.com", {
      signal: abortController.signal,
      timeoutMs: 1_000
    });

    abortController.abort(abortError);

    await assert.rejects(request, (error: Error) => error === abortError);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("fetchWithTimeout skips timeout wiring when the provided timeout is not positive", async () => {
  const init: FetchWithTimeoutInit = { method: "POST", timeoutMs: 0 };
  let receivedInit: FetchWithTimeoutInit | undefined;

  globalThis.fetch = (_input, providedInit) => {
    receivedInit = providedInit as FetchWithTimeoutInit;
    return Promise.resolve(new Response("ok", { status: 200 }));
  };

  try {
    const response = await fetchWithTimeout("https://example.com", init);

    assert.equal(await response.text(), "ok");
    assert.strictEqual(receivedInit, init);
    assert.strictEqual(receivedInit?.signal, init.signal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
