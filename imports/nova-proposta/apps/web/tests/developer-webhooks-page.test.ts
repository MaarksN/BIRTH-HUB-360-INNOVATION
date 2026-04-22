import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import {
  createWebhookEndpoint,
  fetchWebhookDeliveries,
  fetchWebhookEndpoints,
  parseTopics,
  prependEndpoint,
  replaceEndpoint,
  resolveSelectedEndpointId,
  retryWebhookDelivery,
  updateWebhookEndpointStatus,
  type WebhookEndpoint
} from "../app/(dashboard)/settings/developers/webhooks/page.data";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function installSessionDom() {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  const dom = new JSDOM("", {
    url: "https://app.birthub.test/settings/developers/webhooks"
  });
  dom.window.document.cookie = "bh360_csrf=csrf_webhooks";
  dom.window.document.cookie = "bh_active_tenant=tenant_webhooks";
  dom.window.document.cookie = "bh_user_id=user_webhooks";

  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: dom.window.localStorage
  });

  return () => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage
    });
    dom.window.close();
  };
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

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status
  });
}

void test("webhook page data helpers normalize topics and endpoint selection updates", () => {
  const endpointA = {
    createdAt: "2026-04-07T10:00:00.000Z",
    id: "endpoint_a",
    secret: "secret_a",
    status: "ACTIVE",
    topics: ["agent.finished"],
    url: "https://a.example.com"
  } satisfies WebhookEndpoint;
  const endpointB = {
    createdAt: "2026-04-07T10:05:00.000Z",
    id: "endpoint_b",
    secret: "secret_b",
    status: "DISABLED",
    topics: ["agent.failed"],
    url: "https://b.example.com"
  } satisfies WebhookEndpoint;

  assert.deepEqual(parseTopics(" agent.finished, workflow.finished ,, agent.failed "), [
    "agent.finished",
    "workflow.finished",
    "agent.failed"
  ]);
  assert.equal(resolveSelectedEndpointId("endpoint_a", [endpointA, endpointB]), "endpoint_a");
  assert.equal(resolveSelectedEndpointId("missing", [endpointA, endpointB]), "endpoint_a");
  assert.deepEqual(prependEndpoint([endpointA], endpointB).map((item) => item.id), [
    "endpoint_b",
    "endpoint_a"
  ]);
  assert.equal(replaceEndpoint([endpointA, endpointB], { ...endpointB, status: "ACTIVE" })[1]?.status, "ACTIVE");
});

void test("webhook page data helpers use the session-aware API client for CRUD and retry flows", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const cleanupDom = installSessionDom();

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const requests: Array<{ body: string | null; headers: Headers; method: string; url: string }> = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = getRequestUrl(input);
    requests.push({
      body: typeof init?.body === "string" ? init.body : null,
      headers: new Headers(init?.headers),
      method: init?.method ?? "GET",
      url
    });

    if (url.endsWith("/api/v1/settings/webhooks")) {
      if ((init?.method ?? "GET") === "POST") {
        return Promise.resolve(
          createJsonResponse({
            endpoint: {
              createdAt: "2026-04-07T11:00:00.000Z",
              id: "endpoint_created",
              secret: "secret_created",
              status: "ACTIVE",
              topics: ["agent.finished"],
              url: "https://created.example.com"
            }
          })
        );
      }

      return Promise.resolve(
        createJsonResponse({
          items: [
            {
              createdAt: "2026-04-07T10:00:00.000Z",
              id: "endpoint_listed",
              secret: "secret_listed",
              status: "ACTIVE",
              topics: ["agent.finished"],
              url: "https://listed.example.com"
            }
          ]
        })
      );
    }

    if (url.includes("/deliveries?limit=25")) {
      return Promise.resolve(
        createJsonResponse({
          items: [
            {
              attempt: 2,
              createdAt: "2026-04-07T11:05:00.000Z",
              endpointId: "endpoint_listed",
              id: "delivery_1",
              responseStatus: 202,
              topic: "agent.finished"
            }
          ]
        })
      );
    }

    if (url.endsWith("/api/v1/settings/webhooks/endpoint_listed")) {
      return Promise.resolve(
        createJsonResponse({
          endpoint: {
            createdAt: "2026-04-07T10:00:00.000Z",
            id: "endpoint_listed",
            secret: "secret_listed",
            status: "DISABLED",
            topics: ["agent.finished"],
            url: "https://listed.example.com"
          }
        })
      );
    }

    if (url.endsWith("/api/v1/settings/webhooks/deliveries/delivery_1/retry")) {
      return Promise.resolve(new Response(null, { status: 202 }));
    }

    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    const endpoints = await fetchWebhookEndpoints();
    const deliveries = await fetchWebhookDeliveries("endpoint_listed");
    const created = await createWebhookEndpoint("https://created.example.com", ["agent.finished"]);
    const updated = await updateWebhookEndpointStatus("endpoint_listed", "DISABLED");
    await retryWebhookDelivery("delivery_1");

    assert.equal(endpoints[0]?.id, "endpoint_listed");
    assert.equal(deliveries[0]?.id, "delivery_1");
    assert.equal(created.id, "endpoint_created");
    assert.equal(updated.status, "DISABLED");
    assert.equal(requests[0]?.url, "/api/bff/api/v1/settings/webhooks");
    assert.equal(requests[0]?.headers.get("authorization"), null);
    assert.equal(requests[0]?.headers.get("x-csrf-token"), "csrf_webhooks");
    assert.equal(requests[0]?.headers.get("x-active-tenant"), "tenant_webhooks");
    assert.equal(requests[2]?.method, "POST");
    assert.match(requests[2]?.body ?? "", /https:\/\/created\.example\.com/);
    assert.equal(requests[3]?.method, "PATCH");
    assert.match(requests[3]?.body ?? "", /DISABLED/);
    assert.equal(requests[4]?.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
    cleanupDom();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});
