import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import {
  createChatbookAssistedWorkflow,
  createConversation,
  createOutputArtifact,
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

void test("product api output helper creates executive artifacts through the canonical endpoint", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthhub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const dom = new JSDOM("", {
    url: "https://app.birthhub.test/agents/chatbook-inteligentissimo"
  });
  dom.window.document.cookie = "bh360_csrf=csrf_output";
  dom.window.document.cookie = "bh_active_tenant=tenant_output";
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
          output: {
            id: "output_1",
            outputHash: "hash_1",
            status: "WAITING_APPROVAL",
            type: "executive-report"
          }
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 201
        }
      )
    );
  }) as typeof fetch;

  try {
    const payload = await createOutputArtifact({
      agentId: "chatbook-inteligentissimo",
      content: "# Resumo executivo",
      requireApproval: true,
      type: "executive-report"
    });
    const headers = new Headers(requestInit?.headers);

    assert.equal(requestUrl, "/api/bff/api/v1/outputs");
    assert.equal(requestInit?.method, "POST");
    assert.equal(headers.get("content-type"), "application/json");
    assert.equal(headers.get("x-active-tenant"), "tenant_output");
    assert.equal(JSON.parse(String(requestInit?.body)).requireApproval, true);
    assert.equal(payload.output.status, "WAITING_APPROVAL");
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

void test("product api chatbook workflow helper creates a reviewable draft workflow", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthhub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const dom = new JSDOM("", {
    url: "https://app.birthhub.test/agents/chatbook-inteligentissimo"
  });
  dom.window.document.cookie = "bh360_csrf=csrf_workflow";
  dom.window.document.cookie = "bh_active_tenant=tenant_workflow";
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
          workflow: {
            id: "workflow_1",
            status: "DRAFT"
          }
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 201
        }
      )
    );
  }) as typeof fetch;

  try {
    const payload = await createChatbookAssistedWorkflow({
      actions: ["Gerar proposta", "Abrir reports"],
      requestId: "chatbook_req_1",
      summary: "Resumo executivo do ChatBook"
    });
    const body = JSON.parse(String(requestInit?.body)) as {
      canvas: {
        steps: Array<{ key: string; type: string }>;
      };
      status: string;
      triggerType: string;
    };

    assert.equal(requestUrl, "/api/bff/api/v1/workflows");
    assert.equal(requestInit?.method, "POST");
    assert.equal(body.status, "DRAFT");
    assert.equal(body.triggerType, "EVENT");
    assert.deepEqual(
      body.canvas.steps.map((step) => step.type),
      ["TRIGGER_EVENT", "AI_TEXT_EXTRACT", "AGENT_HANDOFF"]
    );
    assert.equal(payload.workflow.id, "workflow_1");
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

void test("product api conversation helper opens an operational thread through the canonical endpoint", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthhub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const dom = new JSDOM("", {
    url: "https://app.birthhub.test/agents/chatbook-inteligentissimo"
  });
  dom.window.document.cookie = "bh360_csrf=csrf_conversation";
  dom.window.document.cookie = "bh_active_tenant=tenant_conversation";
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
          conversation: {
            id: "conversation_1"
          }
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 201
        }
      )
    );
  }) as typeof fetch;

  try {
    const payload = await createConversation({
      initialMessage: "Resumo operacional",
      subject: "ChatBook: acompanhamento"
    });
    const body = JSON.parse(String(requestInit?.body)) as {
      initialMessage: string;
      subject: string;
    };

    assert.equal(requestUrl, "https://api.birthhub.test/api/v1/conversations");
    assert.equal(requestInit?.method, "POST");
    assert.equal(body.initialMessage, "Resumo operacional");
    assert.equal(body.subject, "ChatBook: acompanhamento");
    assert.equal(payload.conversation.id, "conversation_1");
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
