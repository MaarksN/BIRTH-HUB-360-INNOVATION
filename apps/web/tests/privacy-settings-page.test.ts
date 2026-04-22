import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import {
  formatConsentStatus,
  formatDate,
  formatExecutionMode,
  formatRetentionAction
} from "../app/(dashboard)/settings/privacy/privacy-settings-page.data";
import {
  clearStoredPrivacySession,
  exportPrivacyData,
  requestPrivacyAccountDeletion
} from "../app/(dashboard)/settings/privacy/privacy-self-service.data";

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
    url: "https://app.birthub.test/settings/privacy"
  });
  dom.window.document.cookie = "bh360_csrf=csrf_privacy";
  dom.window.document.cookie = "bh_active_tenant=tenant_privacy";
  dom.window.document.cookie = "bh_user_id=user_privacy";

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

void test("privacy page helpers keep formatting labels stable", () => {
  assert.equal(formatDate(null), "Nao registrado");
  assert.equal(formatConsentStatus("GRANTED"), "Concedido");
  assert.equal(formatRetentionAction("ANONYMIZE"), "Anonimizar");
  assert.equal(formatExecutionMode("DRY_RUN"), "Dry-run");
});

void test("privacy self-service helpers only call supported export and delete endpoints", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const cleanupDom = installSessionDom();

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const calls: Array<{ body: string | null; method: string; url: string }> = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = getRequestUrl(input);
    calls.push({
      body: typeof init?.body === "string" ? init.body : null,
      method: init?.method ?? "GET",
      url
    });

    if (url.endsWith("/api/v1/privacy/export")) {
      return Promise.resolve(new Response("{\"tenant\":\"alpha\"}", { status: 200 }));
    }

    if (url.endsWith("/api/v1/privacy/delete-account")) {
      return Promise.resolve(new Response(null, { status: 202 }));
    }

    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    const exportPayload = await exportPrivacyData();
    await requestPrivacyAccountDeletion("EXCLUIR MINHA CONTA");

    assert.equal(exportPayload.fileName.startsWith("birthub360-export-"), true);
    assert.equal(await exportPayload.blob.text(), "{\"tenant\":\"alpha\"}");
    assert.deepEqual(
      calls.map((call) => call.url),
      ["/api/bff/api/v1/privacy/export", "/api/bff/api/v1/privacy/delete-account"]
    );
    assert.equal(calls[0]?.method, "GET");
    assert.equal(calls[1]?.method, "POST");

    clearStoredPrivacySession();
    assert.equal(globalThis.localStorage.getItem("bh_access_token"), null);
    assert.equal(globalThis.localStorage.getItem("bh_csrf_token"), null);
  } finally {
    globalThis.fetch = originalFetch;
    cleanupDom();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});
