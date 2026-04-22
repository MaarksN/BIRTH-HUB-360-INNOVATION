import assert from "node:assert/strict";
import test from "node:test";

import { Role } from "@birthub/database";
import request from "supertest";

import { createNotificationsRouter } from "../src/modules/notifications/router.js";
import { notificationsRouterService } from "../src/modules/notifications/service.js";
import {
  createAuthenticatedApiTestApp,
  stubMethod
} from "./http-test-helpers.js";

type ProblemBody = {
  status: number;
  title: string;
};

function assertProblemBody(body: unknown): asserts body is ProblemBody {
  assert.equal(typeof body, "object");
  assert.notEqual(body, null);
  assert.equal(typeof (body as { status?: unknown }).status, "number");
  assert.equal(typeof (body as { title?: unknown }).title, "string");
}

function createNotificationsTestApp() {
  return createAuthenticatedApiTestApp({
    contextOverrides: {
      requestId: "req_notifications",
      role: Role.MEMBER,
      tenantId: "tenant_product",
      userId: "user_product"
    },
    mountPath: "/api/v1",
    router: createNotificationsRouter()
  });
}

void test("notifications router lists feed items with parsed pagination", async () => {
  let received: unknown = null;
  const restore = stubMethod(notificationsRouterService, "getNotificationFeed", (input: unknown) => {
    received = input;
    return Promise.resolve({
      items: [
        {
          id: "notif_1",
          title: "Workflow finalizado"
        }
      ],
      nextCursor: "cursor_2",
      unreadCount: 3
    });
  });

  try {
    const response = await request(createNotificationsTestApp())
      .get("/api/v1/notifications")
      .query({
        cursor: "cursor_1",
        limit: "15"
      })
      .expect(200);

    assert.deepEqual(received, {
      cursor: "cursor_1",
      limit: 15,
      tenantReference: "tenant_product",
      userId: "user_product"
    });
    assert.deepEqual(response.body, {
      items: [
        {
          id: "notif_1",
          title: "Workflow finalizado"
        }
      ],
      nextCursor: "cursor_2",
      requestId: "req_notifications",
      unreadCount: 3
    });
  } finally {
    restore();
  }
});

void test("notifications router persists only the provided preference fields", async () => {
  let received: unknown = null;
  const restore = stubMethod(notificationsRouterService, "saveNotificationPreferences", (input: unknown) => {
    received = input;
    return Promise.resolve({
      emailNotifications: true,
      inAppNotifications: false
    });
  });

  try {
    const response = await request(createNotificationsTestApp())
      .put("/api/v1/notifications/preferences")
      .send({
        emailNotifications: true,
        inAppNotifications: false
      })
      .expect(200);

    assert.deepEqual(received, {
      emailNotifications: true,
      inAppNotifications: false,
      tenantReference: "tenant_product",
      userId: "user_product"
    });
    assert.deepEqual(response.body, {
      preferences: {
        emailNotifications: true,
        inAppNotifications: false
      },
      requestId: "req_notifications"
    });
  } finally {
    restore();
  }
});

void test("notifications router rejects invalid preferences payloads", async () => {
  const response = await request(createNotificationsTestApp())
    .put("/api/v1/notifications/preferences")
    .send({
      emailNotifications: "yes"
    })
    .expect(400);

  assertProblemBody(response.body);
  assert.equal(response.body.status, 400);
  assert.equal(response.body.title, "Bad Request");
});
