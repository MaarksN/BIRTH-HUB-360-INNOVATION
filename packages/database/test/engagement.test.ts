import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { NotificationType, Role, Prisma } from "@prisma/client";
import { prisma } from "../src/client.js";
import {
  createEngagementPrismaMock,
  createMockUserPreference,
  createMockNotification,
  createMockAuditLog,
  createMockMembership,
  createPrismaPromise
} from "./engagement.test.support.js";
import {
  createNotificationForOrganizationRoles,
  createNotificationForUser,
  ensureUserPreference,
  listNotifications,
  updateUserPreference
} from "../src/repositories/engagement.js";

void test("ensureUserPreference upserts tenant-scoped preference data", async () => {
    let received: unknown = null;

    // @ts-expect-error mock assignment
  prisma.userPreference.upsert = mock.fn((args: unknown) => { received = args; return createMockUserPreference({ inAppNotifications: true }); });
    await ensureUserPreference({
      organizationId: "org_1",
      tenantId: "tenant_1",
      userId: "user_1"
    });

    assert.deepEqual(received, {
      create: {
        organizationId: "org_1",
        tenantId: "tenant_1",
        userId: "user_1"
      },
      update: {},
      where: {
        organizationId_userId: {
          organizationId: "org_1",
          userId: "user_1"
        }
      }
    });

});
void test("ensureUserPreference accepts an injected client without relying on global prisma", async () => {
  const injectedClient = createEngagementPrismaMock();
  let received: unknown = null;

// @ts-expect-error mock assignment
    injectedClient.userPreference.upsert = (args: unknown) => {
    received = args;
    return createMockUserPreference({ inAppNotifications: true });
  };

  await ensureUserPreference(
    {
      organizationId: "org_1",
      tenantId: "tenant_1",
      userId: "user_1"
    },
    {
      client: injectedClient
    }
  );

  assert.deepEqual(received, {
    create: {
      organizationId: "org_1",
      tenantId: "tenant_1",
      userId: "user_1"
    },
    update: {},
    where: {
      organizationId_userId: {
        organizationId: "org_1",
        userId: "user_1"
      }
    }
  });
});
void test("createNotificationForUser skips persistence when in-app notifications are disabled", async () => {
    let createCalled = false;

    // @ts-expect-error mock assignment
  prisma.userPreference.upsert = mock.fn(() => createMockUserPreference({ inAppNotifications: false }));
    // @ts-expect-error mock assignment
  prisma.notification.create = mock.fn(() => { createCalled = true; return createMockNotification({}); });
    const result = await createNotificationForUser({
      content: "hello",
      organizationId: "org_1",
      tenantId: "tenant_1",
      type: NotificationType.INFO,
      userId: "user_1"
    });

    assert.equal(result, null);
    assert.equal(createCalled, false);

});
void test("createNotificationForUser accepts an injected client", async () => {
  const injectedClient = createEngagementPrismaMock();
  let createArgs: unknown = null;

// @ts-expect-error mock assignment
      injectedClient.userPreference.upsert = mock.fn(() => createMockUserPreference({ inAppNotifications: true }));
// @ts-expect-error mock assignment
    injectedClient.notification.create = mock.fn((args: unknown) => { createArgs = args; return createMockNotification({ id: "notification_1" }); });

  const result = await createNotificationForUser(
    {
      content: "hello",
      organizationId: "org_1",
      tenantId: "tenant_1",
      type: NotificationType.INFO,
      userId: "user_1"
    },
    {
      client: injectedClient
    }
  );

  assert.equal(result?.id, "notification_1");
  assert.deepEqual(createArgs, {
    data: {
      content: "hello",
      link: null,
      organizationId: "org_1",
      tenantId: "tenant_1",
      type: "INFO",
      userId: "user_1"
    }
  });
});
void test("updateUserPreference audits cookie consent transitions", async () => {
    let auditPayload: unknown = null;

    // @ts-expect-error mock assignment
  prisma.userPreference.findUnique = mock.fn(() => createMockUserPreference({ cookieConsent: "PENDING" }));
    // @ts-expect-error mock assignment
  prisma.userPreference.upsert = mock.fn(() => createMockUserPreference({ cookieConsent: "ACCEPTED", id: "pref_1" }));
    // @ts-expect-error mock assignment
  prisma.auditLog.create = mock.fn((args: unknown) => { auditPayload = args; return createMockAuditLog({}); });
    const result = await updateUserPreference({
      cookieConsent: "ACCEPTED",
      organizationId: "org_1",
      tenantId: "tenant_1",
      userId: "user_1"
    });

    assert.equal(result.cookieConsent, "ACCEPTED");
    assert.deepEqual(auditPayload, {
      data: {
        action: "user.cookie_consent_updated",
        actorId: "user_1",
        diff: {
          after: {
            cookieConsent: "ACCEPTED"
          },
          before: {
            cookieConsent: "PENDING"
          }
        },
        entityId: "pref_1",
        entityType: "user_preference",
        tenantId: "tenant_1"
      }
    });

});
void test("updateUserPreference accepts an injected client", async () => {
  const injectedClient = createEngagementPrismaMock();
  let auditPayload: unknown = null;

// @ts-expect-error mock assignment
      injectedClient.userPreference.findUnique = mock.fn(() => createMockUserPreference({ cookieConsent: "PENDING" }));
// @ts-expect-error mock assignment
      injectedClient.userPreference.upsert = mock.fn(() => createMockUserPreference({ cookieConsent: "ACCEPTED", id: "pref_1" }));
// @ts-expect-error mock assignment
      injectedClient.auditLog.create = mock.fn((args: unknown) => {
    auditPayload = args;
    return createMockAuditLog({});
  });

  const result = await updateUserPreference(
    {
      cookieConsent: "ACCEPTED",
      organizationId: "org_1",
      tenantId: "tenant_1",
      userId: "user_1"
    },
    {
      client: injectedClient
    }
  );

  assert.equal(result.cookieConsent, "ACCEPTED");
  assert.deepEqual(auditPayload, {
    data: {
      action: "user.cookie_consent_updated",
      actorId: "user_1",
      diff: {
        after: {
          cookieConsent: "ACCEPTED"
        },
        before: {
          cookieConsent: "PENDING"
        }
      },
      entityId: "pref_1",
      entityType: "user_preference",
      tenantId: "tenant_1"
    }
  });
});
void test("updateUserPreference persists locale preferences", async () => {
  const _originalUpsert = prisma.userPreference.upsert.bind(prisma.userPreference);
  let upsertPayload: unknown = null;

  prisma.userPreference.upsert = ((args: unknown) => {
    upsertPayload = args;
    return Promise.resolve({
      id: "pref_locale_1",
      locale: "en-US"
    } as never);
  }) as unknown as typeof prisma.userPreference.upsert;

  try {
    const result = await updateUserPreference({
      locale: "en-US",
      organizationId: "org_1",
      tenantId: "tenant_1",
      userId: "user_1"
    });

    assert.equal(result.locale, "en-US");
    assert.deepEqual(upsertPayload, {
      create: {
        locale: "en-US",
        organizationId: "org_1",
        tenantId: "tenant_1",
        userId: "user_1"
      },
      update: {
        locale: "en-US"
      },
      where: {
        organizationId_userId: {
          organizationId: "org_1",
          userId: "user_1"
        }
      }
    });
  } finally {
    void 0;
  }
});
void test("createNotificationForOrganizationRoles only creates notifications for users with enabled preference", async () => {
    let createManyArgs: unknown = null;

    // @ts-expect-error mock assignment
  prisma.membership.findMany = mock.fn(async () => createPrismaPromise([
    createMockMembership({
      role: Role.ADMIN,
      userId: "user_admin",
      user: { ...createMockMembership().user, id: "user_admin", preferences: [createMockUserPreference({ inAppNotifications: true, organizationId: "org_1" })]}
    }),
    createMockMembership({
      role: Role.OWNER,
      userId: "user_owner",
      user: { ...createMockMembership().user, id: "user_owner", preferences: [createMockUserPreference({ inAppNotifications: false, organizationId: "org_1" })]}
    })
  ]));
    // @ts-expect-error mock assignment
  prisma.notification.createMany = mock.fn(async (args: unknown) => { createManyArgs = args; return createPrismaPromise({ count: 1 } as Prisma.BatchPayload); });
    const result = await createNotificationForOrganizationRoles({
      content: "ops",
      organizationId: "org_1",
      tenantId: "tenant_1",
      type: NotificationType.INFO
    });

    assert.deepEqual(result, { count: 1 });
    assert.deepEqual(createManyArgs, {
      data: [
        {
          content: "ops",
          link: null,
          organizationId: "org_1",
          tenantId: "tenant_1",
          type: "INFO",
          userId: "user_admin"
        }
      ]
    });
    assert.equal((createManyArgs as { take?: number }).take, undefined);

});
void test("createNotificationForOrganizationRoles accepts an injected client", async () => {
  const injectedClient = createEngagementPrismaMock();
  let createManyArgs: unknown = null;

// @ts-expect-error mock assignment
      injectedClient.membership.findMany = mock.fn(async () => createPrismaPromise([createMockMembership()]));
// @ts-expect-error mock assignment
      injectedClient.notification.createMany = mock.fn(async (args: unknown) => {
    createManyArgs = args;
    return createPrismaPromise({ count: 1 } as Prisma.BatchPayload);
  });

  const result = await createNotificationForOrganizationRoles(
    {
      content: "ops",
      organizationId: "org_1",
      tenantId: "tenant_1",
      type: NotificationType.INFO
    },
    {
      client: injectedClient
    }
  );

  assert.deepEqual(result, { count: 1 });
  assert.deepEqual(createManyArgs, {
    data: [
      {
        content: "ops",
        link: null,
        organizationId: "org_1",
        tenantId: "tenant_1",
        type: "INFO",
        userId: "user_admin"
      }
    ]
  });
});
void test("createNotificationForOrganizationRoles caps membership reads", async () => {
    let received: unknown = null;

    // @ts-expect-error mock assignment
  prisma.membership.findMany = mock.fn(async (args: unknown) => { received = args; return createPrismaPromise([]); });
    const result = await createNotificationForOrganizationRoles({
      content: "ops",
      organizationId: "org_1",
      tenantId: "tenant_1",
      type: NotificationType.INFO
    });

    assert.deepEqual(result, { count: 0 });
    assert.equal((received as { take?: number }).take, 100);

});
void test("listNotifications returns bounded items, next cursor and unread count", async () => {

    // @ts-expect-error mock assignment
  prisma.notification.findMany = mock.fn(async () => createPrismaPromise([createMockNotification({ id: "n3" }), createMockNotification({ id: "n2" }), createMockNotification({ id: "n1" })]));
    // @ts-expect-error mock assignment
  prisma.notification.count = mock.fn(async () => createPrismaPromise(7));
    const result = await listNotifications({
      limit: 2,
      tenantId: "tenant_1",
      userId: "user_1"
    });

    assert.equal(result.items.length, 2);
    assert.equal(result.items[0]?.id, "n3");
    assert.equal(result.items[1]?.id, "n2");
    assert.equal(result.nextCursor, "n2");
    assert.equal(result.unreadCount, 7);

});
void test("listNotifications accepts an injected client", async () => {
  const injectedClient = createEngagementPrismaMock();

// @ts-expect-error mock assignment
      injectedClient.notification.findMany = mock.fn(async () => createPrismaPromise([
      createMockNotification({ id: "n3" }),
      createMockNotification({ id: "n2" }),
      createMockNotification({ id: "n1" })
    ]));
// @ts-expect-error mock assignment
      injectedClient.notification.count = mock.fn(async () => createPrismaPromise(7));

  const result = await listNotifications(
    {
      limit: 2,
      tenantId: "tenant_1",
      userId: "user_1"
    },
    {
      client: injectedClient
    }
  );

  assert.equal(result.items.length, 2);
    assert.equal(result.items[0]?.id, "n3");
    assert.equal(result.items[1]?.id, "n2");
    assert.equal(result.nextCursor, "n2");
    assert.equal(result.unreadCount, 7);
});


