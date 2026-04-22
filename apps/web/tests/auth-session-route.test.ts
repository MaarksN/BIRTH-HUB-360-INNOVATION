import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { isSupportedSessionAction } from "../app/api/auth/session-actions";
import { GET, POST } from "../app/api/auth/[...session]/route";

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

void test("session action allowlist", () => {
  assert.equal(isSupportedSessionAction("signin"), true);
  assert.equal(isSupportedSessionAction("mfa"), true);
  assert.equal(isSupportedSessionAction("unsupported"), false);
});

void test("auth session POST proxies signin requests with cookies and response cookies intact", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = getRequestUrl(input);
    requestInit = init;
    return Promise.resolve(
      new Response('{"ok":true}', {
        headers: {
          "content-type": "application/json",
          "set-cookie": "bh360_session=next; Path=/; HttpOnly"
        },
        status: 200
      })
    );
  }) as typeof fetch;

  try {
    const request = new NextRequest("https://app.birthub.test/api/auth/signin", {
      body: '{"email":"ops@birthub.test"}',
      headers: {
        cookie: "bh360_session=current"
      },
      method: "POST"
    });

    const response = await POST(request, {
      params: Promise.resolve({
        session: ["signin"]
      })
    });
    const headers = new Headers(requestInit?.headers);

    assert.equal(requestUrl, "https://api.birthub.test/api/v1/auth/login");
    assert.equal(requestInit?.method, "POST");
    assert.equal(headers.get("cookie"), "bh360_session=current");
    assert.equal(headers.get("content-type"), "application/json");
    assert.equal(response.headers.get("set-cookie"), "bh360_session=next; Path=/; HttpOnly");
    assert.equal(await response.text(), '{"ok":true}');
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

void test("auth session GET forwards authorization headers to the upstream session endpoint", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = getRequestUrl(input);
    requestInit = init;
    return Promise.resolve(
      new Response('{"items":[]}', {
        headers: {
          "content-type": "application/json"
        },
        status: 200
      })
    );
  }) as typeof fetch;

  try {
    const request = new NextRequest("https://app.birthub.test/api/auth/session", {
      headers: {
        authorization: "Bearer atk_123",
        cookie: "bh360_session=current"
      },
      method: "GET"
    });

    const response = await GET(request, {
      params: Promise.resolve({
        session: ["session"]
      })
    });
    const headers = new Headers(requestInit?.headers);

    assert.equal(requestUrl, "https://api.birthub.test/api/v1/sessions");
    assert.equal(requestInit?.method, "GET");
    assert.equal(headers.get("authorization"), "Bearer atk_123");
    assert.equal(headers.get("cookie"), "bh360_session=current");
    assert.equal(await response.text(), '{"items":[]}');
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

void test("auth session POST proxies MFA verification requests", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = getRequestUrl(input);
    requestInit = init;
    return Promise.resolve(
      new Response('{"mfaRequired":false,"session":{"tenantId":"tenant_1","userId":"user_1"}}', {
        headers: {
          "content-type": "application/json"
        },
        status: 200
      })
    );
  }) as typeof fetch;

  try {
    const request = new NextRequest("https://app.birthub.test/api/auth/mfa", {
      body: '{"challengeToken":"challenge_123","totpCode":"123456"}',
      headers: {
        cookie: "bh360_session=current",
        "x-csrf-token": "csrf_123"
      },
      method: "POST"
    });

    const response = await POST(request, {
      params: Promise.resolve({
        session: ["mfa"]
      })
    });
    const headers = new Headers(requestInit?.headers);

    assert.equal(requestUrl, "https://api.birthub.test/api/v1/auth/mfa/challenge");
    assert.equal(requestInit?.method, "POST");
    assert.equal(requestInit?.body, '{"challengeToken":"challenge_123","totpCode":"123456"}');
    assert.equal(headers.get("cookie"), "bh360_session=current");
    assert.equal(headers.get("x-csrf-token"), "csrf_123");
    assert.equal(
      await response.text(),
      '{"mfaRequired":false,"session":{"tenantId":"tenant_1","userId":"user_1"}}'
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});
