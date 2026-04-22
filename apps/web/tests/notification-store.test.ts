import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { useNotificationStore } from "../stores/notification-store";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function resetNotificationStore() {
  useNotificationStore.setState({
    error: null,
    initialized: false,
    isLoading: false,
    items: [],
    nextCursor: null,
    unreadCount: 0
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
    url: "https://app.birthub.test/dashboard"
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

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status
  });
}

void test("notification store refreshes, paginates and marks feed items through the session-aware client", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const cleanupDom = installDomSession({
    csrfToken: "csrf_notification",
    tenantId: "tenant_notification",
    userId: "user_notification"
  });

  resetNotificationStore();
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

    if (url.endsWith("/api/v1/notifications?limit=10")) {
      return Promise.resolve(
        createJsonResponse({
          items: [
            {
              content: "Lead adicionado ao care plan",
              createdAt: "2026-04-07T12:00:00.000Z",
              id: "notif_1",
              isRead: false,
              link: "/patients/patient_1",
              type: "workflow.finished"
            }
          ],
          nextCursor: "cursor_page_2",
          unreadCount: 2
        })
      );
    }

    if (url.includes("/api/v1/notifications?limit=20") && url.includes("cursor=cursor_page_2")) {
      return Promise.resolve(
        createJsonResponse({
          items: [
            {
              content: "Lead adicionado ao care plan",
              createdAt: "2026-04-07T12:00:00.000Z",
              id: "notif_1",
              isRead: false,
              link: "/patients/patient_1",
              type: "workflow.finished"
            },
            {
              content: "Nova entrega webhook com atraso",
              createdAt: "2026-04-07T12:05:00.000Z",
              id: "notif_2",
              isRead: false,
              link: "/settings/developers/webhooks",
              type: "webhook.retry"
            }
          ],
          nextCursor: null,
          unreadCount: 2
        })
      );
    }

    if (url.endsWith("/api/v1/notifications/notif_1/read")) {
      return Promise.resolve(new Response(null, { status: 200 }));
    }

    if (url.endsWith("/api/v1/notifications/read-all")) {
      return Promise.resolve(new Response(null, { status: 200 }));
    }

    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    await useNotificationStore.getState().refresh();
    let state = useNotificationStore.getState();

    assert.equal(state.initialized, true);
    assert.equal(state.items.length, 1);
    assert.equal(state.unreadCount, 2);
    assert.equal(state.nextCursor, "cursor_page_2");

    await useNotificationStore.getState().loadMore();
    state = useNotificationStore.getState();

    assert.equal(state.items.length, 2);
    assert.equal(state.items[0]?.id, "notif_2");
    assert.equal(state.items[1]?.id, "notif_1");
    assert.equal(state.items[1]?.link, null);
    assert.equal(state.nextCursor, null);

    await useNotificationStore.getState().markAsRead("notif_1");
    state = useNotificationStore.getState();

    assert.equal(state.items.find((item) => item.id === "notif_1")?.isRead, true);
    assert.equal(state.unreadCount, 1);

    await useNotificationStore.getState().markAllAsRead();
    state = useNotificationStore.getState();

    assert.equal(state.unreadCount, 0);
    assert.equal(state.items.every((item) => item.isRead), true);
    assert.equal(requests[0]?.url, "https://api.birthub.test/api/v1/notifications?limit=10");
    assert.equal(requests[0]?.headers.get("authorization"), null);
    assert.equal(requests[0]?.headers.get("x-csrf-token"), "csrf_notification");
    assert.equal(requests[0]?.headers.get("x-active-tenant"), "tenant_notification");
  } finally {
    globalThis.fetch = originalFetch;
    cleanupDom();
    resetNotificationStore();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

void test("notification store falls back to the anonymous empty state when there is no active session", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const cleanupDom = installDomSession();

  resetNotificationStore();
  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  useNotificationStore.setState({
    initialized: false,
    items: [
      {
        content: "Old message",
        createdAt: "2026-04-07T10:00:00.000Z",
        id: "stale_notification",
        isRead: false,
        link: null,
        type: "legacy"
      }
    ],
    nextCursor: "stale_cursor",
    unreadCount: 4
  });

  try {
    await useNotificationStore.getState().refresh();

    assert.deepEqual(useNotificationStore.getState().items, []);
    assert.equal(useNotificationStore.getState().initialized, true);
    assert.equal(useNotificationStore.getState().nextCursor, null);
    assert.equal(useNotificationStore.getState().unreadCount, 0);
    assert.equal(useNotificationStore.getState().isLoading, false);
  } finally {
    cleanupDom();
    resetNotificationStore();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});
