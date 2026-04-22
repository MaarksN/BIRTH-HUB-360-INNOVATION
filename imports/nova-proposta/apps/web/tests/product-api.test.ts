import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import {
  fetchConversationList,
  fetchSearchResults
} from "../lib/product-api";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (input instanceof URL) {
    return input.toString();
  }

  if (typeof input === "string") {
    return input;
  }

  return input.url;
}

void test("product api search helper calls the canonical search endpoint with session credentials", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthhub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const dom = new JSDOM("", {
    url: "https://app.birthhub.test/dashboard"
  });
  dom.window.document.cookie = "bh360_csrf=csrf_456";
  dom.window.document.cookie = "bh_active_tenant=tenant_456";
  dom.window.document.cookie = "bh_user_id=user_456";
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: dom.window.localStorage
  });

  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = getRequestUrl(input);
    requestInit = init;
    return Promise.resolve(
      new Response(
        JSON.stringify({
          groups: [
            {
              id: "shortcuts",
              items: [],
              label: "Atalhos"
            }
          ]
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        }
      )
    );
  }) as typeof fetch;

  try {
    const payload = await fetchSearchResults("workflow");
    const headers = new Headers(requestInit?.headers);

    assert.equal(requestUrl, "https://api.birthhub.test/api/v1/search?q=workflow");
    assert.equal(requestInit?.credentials, "include");
    assert.equal(headers.get("authorization"), null);
    assert.equal(headers.get("x-active-tenant"), "tenant_456");
    assert.equal(headers.get("x-csrf-token"), "csrf_456");
    assert.equal(payload.groups[0]?.label, "Atalhos");
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage
    });
    dom.window.close();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

void test("product api conversation list helper omits a dangling query string when filters are empty", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthhub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const dom = new JSDOM("", {
    url: "https://app.birthhub.test/conversations"
  });
  dom.window.document.cookie = "bh360_csrf=csrf_789";
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: dom.window.localStorage
  });

  const urls: string[] = [];
  globalThis.fetch = ((input: RequestInfo | URL) => {
    urls.push(getRequestUrl(input));
    return Promise.resolve(
      new Response(
        JSON.stringify({
          items: []
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        }
      )
    );
  }) as typeof fetch;

  try {
    const payload = await fetchConversationList({});

    assert.deepEqual(urls, ["https://api.birthhub.test/api/v1/conversations"]);
    assert.deepEqual(payload.items, []);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage
    });
    dom.window.close();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});
