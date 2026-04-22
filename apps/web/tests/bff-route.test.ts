import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { GET, POST } from "../app/api/bff/[...path]/route";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

void test("BFF route rejects blocked paths before proxying upstream", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  let invoked = false;
  globalThis.fetch = ((_: RequestInfo | URL, _init?: RequestInit) => {
    invoked = true;
    return Promise.resolve(new Response("unexpected", { status: 200 }));
  }) as typeof fetch;

  try {
    const request = new NextRequest("https://app.birthub.test/api/bff/api/v1/blocked/users", {
      method: "GET"
    });
    const response = await GET(request, {
      params: Promise.resolve({
        path: ["api", "v1", "blocked", "users"]
      })
    });
    const payload = (await response.json()) as { error?: string };

    assert.equal(response.status, 403);
    assert.equal(payload.error, "Path is not allowed by BFF policy.");
    assert.equal(invoked, false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

void test("BFF route proxies allowed requests with forwarded headers and body", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = input instanceof URL ? input.toString() : (input as string);
    requestInit = init;
    return Promise.resolve(
      new Response('{"ok":true}', {
        headers: {
          "content-type": "application/json",
          "set-cookie": "bh360_session=rotated; Path=/; HttpOnly"
        },
        status: 202
      })
    );
  }) as typeof fetch;

  try {
    const request = new NextRequest("https://app.birthub.test/api/bff/api/v1/workflows/run", {
      body: '{"async":true}',
      headers: {
        authorization: "Bearer atk_123",
        cookie: "bh360_session=current",
        "content-type": "application/json",
        "x-correlation-id": "corr_123",
        "x-active-tenant": "tenant_123",
        "x-csrf-token": "csrf_123"
      },
      method: "POST"
    });

    const response = await POST(request, {
      params: Promise.resolve({
        path: ["api", "v1", "workflows", "run"]
      })
    });
    const headers = new Headers(requestInit?.headers);

    assert.match(requestUrl, /\/api\/v1\/workflows\/run$/);
    assert.equal(requestInit?.method, "POST");
    assert.equal(requestInit?.body, '{"async":true}');
    assert.equal(headers.get("authorization"), "Bearer atk_123");
    assert.equal(headers.get("cookie"), "bh360_session=current");
    assert.equal(headers.get("x-active-tenant"), "tenant_123");
    assert.equal(headers.get("x-correlation-id"), "corr_123");
    assert.equal(headers.get("x-csrf-token"), "csrf_123");
    assert.equal(response.headers.get("set-cookie"), "bh360_session=rotated; Path=/; HttpOnly");
    assert.equal(response.status, 202);
    assert.equal(await response.text(), '{"ok":true}');
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});
