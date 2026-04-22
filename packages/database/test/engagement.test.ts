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

void test("ensureUserPreference upserts tenant-scoped preference data", async (t) => {
  let received: unknown = null;

  t.mock.method(
    prisma.userPreference,
    "upsert",
    (args: Prisma.UserPreferenceUpsertArgs) => {
      received = args;
      return createPrismaPromise(createMockUserPreference({ inAppNotifications: true }));
    }
  );
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
void test("ensureUserPreference accepts an injected client", async (t) => {
  const injectedClient = createEngagementPrismaMock();
  let received: unknown = null;

  t.mock.method(
    injectedClient.userPreference,
    "upsert",
    (args: Prisma.UserPreferenceUpsertArgs) => {
      received = args;
      return createPrismaPromise(createMockUserPreference({ inAppNotifications: true }));
    }
  );

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
void test("createNotificationForUser skips persistence when in-app notifications are disabled", async (t) => {
  let createCalled = false;

  t.mock.method(prisma.userPreference, "upsert", () =>
    createPrismaPromise(createMockUserPreference({ inAppNotifications: false }))
  );
  t.mock.method(prisma.notification, "create", () => {
    createCalled = true;
    return createPrismaPromise(createMockNotification({}));
  });
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
void test("createNotificationForUser accepts an injected client", async (t) => {
  const injectedClient = createEngagementPrismaMock();
  let createArgs: unknown = null;

  t.mock.method(injectedClient.userPreference, "upsert", () =>
    createPrismaPromise(createMockUserPreference({ inAppNotifications: true }))
  );
  t.mock.method(
    injectedClient.notification,
    "create",
    (args: Prisma.NotificationCreateArgs) => {
      createArgs = args;
      return createPrismaPromise(createMockNotification({ id: "notification_1" }));
    }
  );

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
void test("updateUserPreference audits cookie consent transitions", async (t) => {
  let auditPayload: unknown = null;

  t.mock.method(prisma.userPreference, "findUnique", () =>
    createPrismaPromise(createMockUserPreference({ cookieConsent: "PENDING" }))
  );
  t.mock.method(prisma.userPreference, "upsert", () =>
    createPrismaPromise(createMockUserPreference({ cookieConsent: "ACCEPTED", id: "pref_1" }))
  );
  t.mock.method(
    prisma.auditLog,
    "create",
    (args: Prisma.AuditLogCreateArgs) => {
      auditPayload = args;
      return createPrismaPromise(createMockAuditLog({}));
    }
  );
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
void test("updateUserPreference accepts an injected client", async (t) => {
  const injectedClient = createEngagementPrismaMock();
  let auditPayload: unknown = null;

  t.mock.method(injectedClient.userPreference, "findUnique", () =>
    createPrismaPromise(createMockUserPreference({ cookieConsent: "PENDING" }))
  );
  t.mock.method(injectedClient.userPreference, "upsert", () =>
    createPrismaPromise(createMockUserPreference({ cookieConsent: "ACCEPTED", id: "pref_1" }))
  );
  t.mock.method(
    injectedClient.auditLog,
    "create",
    (args: Prisma.AuditLogCreateArgs) => {
      auditPayload = args;
      return createPrismaPromise(createMockAuditLog({}));
    }
  );

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
void test("updateUserPreference persists locale preferences", async (t) => {
  let upsertPayload: unknown = null;

  t.mock.method(
    prisma.userPreference,
    "upsert",
    (args: Prisma.UserPreferenceUpsertArgs) => {
      upsertPayload = args;
      return createPrismaPromise({
        id: "pref_locale_1",
        locale: "en-US"
      } as any);
    }
  );

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
void test("createNotificationForOrganizationRoles only creates notifications for users with enabled preference", async (t) => {
  let createManyArgs: unknown = null;

  t.mock.method(prisma.membership, "findMany", async () =>
    createPrismaPromise([
      createMockMembership({
        role: Role.ADMIN,
        userId: "user_admin",
        user: {
          ...createMockMembership().user,
          id: "user_admin",
          preferences: [
            createMockUserPreference({ inAppNotifications: true, organizationId: "org_1" })
          ]
        }
      }),
      createMockMembership({
        role: Role.OWNER,
        userId: "user_owner",
        user: {
          ...createMockMembership().user,
          id: "user_owner",
          preferences: [
            createMockUserPreference({ inAppNotifications: false, organizationId: "org_1" })
          ]
        }
      })
    ])
  );
  t.mock.method(
    prisma.notification,
    "createMany",
    async (args: Prisma.NotificationCreateManyArgs) => {
      createManyArgs = args;
      return createPrismaPromise({ count: 1 } as Prisma.BatchPayload);
    }
  );
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
void test("createNotificationForOrganizationRoles accepts an injected client", async (t) => {
  const injectedClient = createEngagementPrismaMock();
  let createManyArgs: unknown = null;

  t.mock.method(injectedClient.membership, "findMany", async () =>
    createPrismaPromise([createMockMembership()])
  );
  t.mock.method(
    injectedClient.notification,
    "createMany",
    async (args: Prisma.NotificationCreateManyArgs) => {
      createManyArgs = args;
      return createPrismaPromise({ count: 1 } as Prisma.BatchPayload);
    }
  );

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
void test("createNotificationForOrganizationRoles caps membership reads", async (t) => {
  let received: unknown = null;

  t.mock.method(
    prisma.membership,
    "findMany",
    async (args: Prisma.MembershipFindManyArgs) => {
      received = args;
      return createPrismaPromise([]);
    }
  );
  const result = await createNotificationForOrganizationRoles({
      content: "ops",
      organizationId: "org_1",
      tenantId: "tenant_1",
      type: NotificationType.INFO
    });

    assert.deepEqual(result, { count: 0 });
    assert.equal((received as { take?: number }).take, 100);

});
void test("listNotifications returns bounded items, next cursor and unread count", async (t) => {
  t.mock.method(prisma.notification, "findMany", async () =>
    createPrismaPromise([
      createMockNotification({ id: "n3" }),
      createMockNotification({ id: "n2" }),
      createMockNotification({ id: "n1" })
    ])
  );
  t.mock.method(prisma.notification, "count", async () => createPrismaPromise(7));
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
void test("listNotifications accepts an injected client", async (t) => {
  const injectedClient = createEngagementPrismaMock();

  t.mock.method(injectedClient.notification, "findMany", async () =>
    createPrismaPromise([
      createMockNotification({ id: "n3" }),
      createMockNotification({ id: "n2" }),
      createMockNotification({ id: "n1" })
    ])
  );
  t.mock.method(injectedClient.notification, "count", async () => createPrismaPromise(7));

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


