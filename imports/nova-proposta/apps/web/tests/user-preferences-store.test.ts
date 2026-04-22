import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { useUserPreferencesStore } from "../stores/user-preferences-store";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function resetUserPreferencesStore() {
  useUserPreferencesStore.setState({
    error: null,
    hydrated: false,
    isSaving: false,
    preferences: {
      cookieConsent: "PENDING",
      emailNotifications: true,
      inAppNotifications: true,
      locale: "pt-BR",
      marketingEmails: false,
      pushNotifications: false
    }
  });
}

function installDomSession(session: {
  csrfToken?: string;
  tenantId?: string;
  userId?: string;
} = {}) {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  const dom = new JSDOM("", {
    url: "https://app.birthub.test/dashboard/profile/notifications"
  });

  if (session.csrfToken) {
    dom.window.document.cookie = `bh360_csrf=${session.csrfToken}`;
  }

  if (session.tenantId) {
    dom.window.document.cookie = `bh_active_tenant=${session.tenantId}`;
  }

  if (session.userId) {
    dom.window.document.cookie = `bh_user_id=${session.userId}`;
  }

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

function getRequestBody(body: BodyInit | null | undefined): string {
  return typeof body === "string" ? body : "";
}

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status
  });
}

void test("user preferences hydrate loads locale from the API and syncs the SSR cookie", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const cleanupDom = installDomSession({
    csrfToken: "csrf_preferences",
    tenantId: "tenant_preferences",
    userId: "user_preferences"
  });

  resetUserPreferencesStore();
  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const requests: Array<{ headers: Headers; method: string; url: string }> = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = getRequestUrl(input);
    const headers = new Headers(init?.headers);
    requests.push({
      headers,
      method: init?.method ?? "GET",
      url
    });

    if (url.endsWith("/api/v1/notifications/preferences")) {
      return Promise.resolve(
        createJsonResponse({
          preferences: {
            cookieConsent: "ACCEPTED",
            emailNotifications: true,
            inAppNotifications: true,
            locale: "en-US",
            marketingEmails: false,
            pushNotifications: false
          }
        })
      );
    }

    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    await useUserPreferencesStore.getState().hydrate();

    const state = useUserPreferencesStore.getState();
    assert.equal(state.hydrated, true);
    assert.equal(state.preferences.locale, "en-US");
    assert.match(document.cookie, /bh360_locale=en-US/);
    assert.equal(requests[0]?.method, "GET");
    assert.equal(requests[0]?.url, "/api/bff/api/v1/notifications/preferences");
    assert.equal(requests[0]?.headers.get("authorization"), null);
    assert.equal(requests[0]?.headers.get("x-csrf-token"), "csrf_preferences");
    assert.equal(requests[0]?.headers.get("x-active-tenant"), "tenant_preferences");
  } finally {
    globalThis.fetch = originalFetch;
    cleanupDom();
    resetUserPreferencesStore();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

void test("user preferences update persists locale changes and returns the normalized payload", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const cleanupDom = installDomSession({
    csrfToken: "csrf_preferences",
    tenantId: "tenant_preferences",
    userId: "user_preferences"
  });

  resetUserPreferencesStore();
  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  let requestBody = "";
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = getRequestUrl(input);

    if (url.endsWith("/api/v1/notifications/preferences")) {
      requestBody = getRequestBody(init?.body);
      return Promise.resolve(
        createJsonResponse({
          preferences: {
            cookieConsent: "PENDING",
            emailNotifications: true,
            inAppNotifications: true,
            locale: "en-US",
            marketingEmails: false,
            pushNotifications: false
          }
        })
      );
    }

    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    const updated = await useUserPreferencesStore.getState().update({
      locale: "en-US"
    });

    assert.equal(updated?.locale, "en-US");
    assert.deepEqual(JSON.parse(requestBody), {
      locale: "en-US"
    });
    assert.equal(useUserPreferencesStore.getState().preferences.locale, "en-US");
    assert.match(document.cookie, /bh360_locale=en-US/);
  } finally {
    globalThis.fetch = originalFetch;
    cleanupDom();
    resetUserPreferencesStore();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});
