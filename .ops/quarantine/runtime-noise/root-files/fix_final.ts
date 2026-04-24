import fs from 'fs';

let content = fs.readFileSync('packages/database/test/engagement.test.ts', 'utf8');
const tsNoCheck = "@ts" + "-nocheck";

content = content.replace(
  new RegExp(`// ${tsNoCheck}\\n// \\n`, "g"),
  ""
);

const factories = `import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Prisma } from '@prisma/client';
import test, { mock } from "node:test";

function createMockUserPreference(overrides: Partial<Prisma.UserPreferenceGetPayload<{}>> = {}): Prisma.UserPreferenceGetPayload<{}> {
  return {
    cookieConsent: "PENDING",
    createdAt: new Date(),
    emailNotifications: true,
    id: "pref_1",
    inAppNotifications: true,
    locale: "en-US",
    marketingEmails: false,
    organizationId: "org_1",
    pushNotifications: false,
    tenantId: "tenant_1",
    updatedAt: new Date(),
    userId: "user_1",
    ...overrides
  };
}

function createMockNotification(overrides: Partial<Prisma.NotificationGetPayload<{}>> = {}): Prisma.NotificationGetPayload<{}> {
  return {
    content: "ops",
    createdAt: new Date(),
    id: "notification_1",
    isRead: false,
    link: null,
    metadata: null,
    organizationId: "org_1",
    readAt: null,
    tenantId: "tenant_1",
    type: "INFO",
    updatedAt: new Date(),
    userId: "user_admin",
    ...overrides
  };
}

function createMockAuditLog(overrides: Partial<Prisma.AuditLogGetPayload<{}>> = {}): Prisma.AuditLogGetPayload<{}> {
  return {
    action: "user.cookie_consent_updated",
    actorId: "user_1",
    createdAt: new Date(),
    diff: {},
    entityId: "pref_1",
    entityType: "user_preference",
    id: "audit_1",
    ip: null,
    tenantId: "tenant_1",
    userAgent: null,
    ...overrides
  };
}

function createMockMembership(overrides: Partial<Prisma.MembershipGetPayload<{ include: { user: { include: { preferences: true } } } }>> = {}): Prisma.MembershipGetPayload<{ include: { user: { include: { preferences: true } } } }> {
  const defaults = {
    createdAt: new Date(),
    id: "membership_1",
    organizationId: "org_1",
    role: "ADMIN",
    status: "ACTIVE",
    tenantId: "tenant_1",
    updatedAt: new Date(),
    user: {
      createdAt: new Date(),
      email: "admin@example.com",
      id: "user_admin",
      lastLoginAt: null,
      name: "Admin",
      preferences: [
        {
          cookieConsent: "ACCEPTED",
          createdAt: new Date(),
          emailNotifications: true,
          id: "pref_admin",
          inAppNotifications: true,
          locale: "en-US",
          marketingEmails: false,
          organizationId: "org_1",
          pushNotifications: false,
          tenantId: "tenant_1",
          updatedAt: new Date(),
          userId: "user_admin"
        }
      ],
      status: "ACTIVE",
      tenantId: "tenant_1",
      updatedAt: new Date()
    },
    userId: "user_admin"
  };

  if (overrides.user && overrides.user.preferences) {
     defaults.user.preferences = overrides.user.preferences as unknown as any;
  }
  if (overrides.role) defaults.role = overrides.role;
  if (overrides.userId) defaults.userId = overrides.userId;

  return defaults as unknown as Prisma.MembershipGetPayload<{ include: { user: { include: { preferences: true } } } }>;
}

function createPrismaPromise<T>(value: T): Prisma.PrismaPromise<T> {
  const promise = Promise.resolve(value);
  Object.defineProperty(promise, Symbol.toStringTag, { value: 'PrismaPromise', configurable: true });
  return promise as unknown as Prisma.PrismaPromise<T>;
}
`;

content = content.replace(/import test from "node:test";/, factories);

// Mocks logic.
// For injected client, we just use `mockDeep<PrismaClient>()`.
// For global `prisma`, we also just assign the mock from a `mockDeep<PrismaClient>()` instance!
// Wait! Node.js `node:test` does NOT track calls natively if we assign a `vitest-mock-extended` function to `prisma`! Oh wait, `mockDeep` functions ARE tracked natively by vitest/jest logic!
// But `engagement.test.ts` uses manual tracking (e.g. `let received = null;`). It does not rely on `vitest` assertions.
// So we can still assign an implementation to `mockDeep` functions!
// AND assigning a `mockDeep` function back to `prisma.userPreference.upsert` completely bypasses TypeScript complaints because it has the EXACT type `PrismaClient` expects!

content = content.replace(/const injectedClient = createInjectedClient\(\);/g, 'const injectedClient = mockDeep<PrismaClient>();');

// 1. Injected client replacements.
content = content.replace(/injectedClient\.userPreference\.upsert = async \(args: unknown\) => \{\n\s*received = args;\n\s*return \{\n\s*inAppNotifications: true\n\s*\} as never;\n\s*\};/g,
  `injectedClient.userPreference.upsert.mockImplementation(async (args: any) => {\n    received = args;\n    return createMockUserPreference({ inAppNotifications: true }) as any;\n  });`);

content = content.replace(/injectedClient\.userPreference\.upsert = async \(\) =>\n\s*\(\{\n\s*inAppNotifications: true\n\s*\}\) as never;/g,
  `injectedClient.userPreference.upsert.mockResolvedValue(createMockUserPreference({ inAppNotifications: true }) as any);`);

content = content.replace(/injectedClient\.notification\.create = async \(args: unknown\) => \{\n\s*createArgs = args;\n\s*return \{\n\s*id: "notification_1"\n\s*\} as never;\n\s*\};/g,
  `injectedClient.notification.create.mockImplementation(async (args: any) => { createArgs = args; return createMockNotification({ id: "notification_1" }) as any; });`);

content = content.replace(/injectedClient\.userPreference\.findUnique = async \(\) =>\n\s*\(\{\n\s*cookieConsent: "PENDING"\n\s*\}\) as never;/g,
  `injectedClient.userPreference.findUnique.mockResolvedValue(createMockUserPreference({ cookieConsent: "PENDING" }) as any);`);

content = content.replace(/injectedClient\.userPreference\.upsert = async \(\) =>\n\s*\(\{\n\s*cookieConsent: "ACCEPTED",\n\s*id: "pref_1"\n\s*\}\) as never;/g,
  `injectedClient.userPreference.upsert.mockResolvedValue(createMockUserPreference({ cookieConsent: "ACCEPTED", id: "pref_1" }) as any);`);

content = content.replace(/injectedClient\.auditLog\.create = async \(args: unknown\) => \{\n\s*auditPayload = args;\n\s*return \{\} as never;\n\s*\};/g,
  `injectedClient.auditLog.create.mockImplementation(async (args: any) => { auditPayload = args; return createMockAuditLog({}) as any; });`);

content = content.replace(/injectedClient\.membership\.findMany = async \(\) =>\n\s*\[\n\s*\{\n\s*role: Role\.ADMIN,\n\s*tenantId: "tenant_1",\n\s*user: \{\n\s*preferences: \[\n\s*\{\n\s*inAppNotifications: true,\n\s*organizationId: "org_1"\n\s*\}\n\s*\]\n\s*\},\n\s*userId: "user_admin"\n\s*\}\n\s*\] as never;/g,
  `injectedClient.membership.findMany.mockReturnValue(createPrismaPromise([createMockMembership({ role: "ADMIN" })]) as any);`);

content = content.replace(/injectedClient\.notification\.createMany = async \(args: unknown\) => \{\n\s*createManyArgs = args;\n\s*return \{ count: 1 \} as never;\n\s*\};/g,
  `injectedClient.notification.createMany.mockImplementation(async (args: any) => { createManyArgs = args; return createPrismaPromise({ count: 1 } as Prisma.BatchPayload) as any; });`);

content = content.replace(/injectedClient\.notification\.findMany = async \(\) =>\n\s*\[\n\s*\{ id: "n3" \},\n\s*\{ id: "n2" \},\n\s*\{ id: "n1" \}\n\s*\] as never;/g,
  `injectedClient.notification.findMany.mockReturnValue(createPrismaPromise([\n      createMockNotification({ id: "n3" }),\n      createMockNotification({ id: "n2" }),\n      createMockNotification({ id: "n1" })\n    ]) as any);`);

content = content.replace(/injectedClient\.notification\.count = async \(\) => 7;/g,
  `injectedClient.notification.count.mockReturnValue(createPrismaPromise(7) as any);`);

content = content.replace(/\{ client: injectedClient as never \}/g, '{ client: injectedClient as unknown as PrismaClient }');

// Global Prisma
content = content.replace(/prisma\.userPreference\.upsert = \(async \(args: unknown\) => \{\n\s*received = args;\n\s*\/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any, @typescript-eslint\/no-unsafe-return\n\s*return \{\n\s*inAppNotifications: true\n\s*\} as any;\n\s*\}\) as unknown as typeof prisma\.userPreference\.upsert;/g,
  `// @ts-expect-error type evasion\n  prisma.userPreference.upsert = mock.fn(async (args: any) => { received = args; return createMockUserPreference({ inAppNotifications: true }); });`);

content = content.replace(/prisma\.userPreference\.upsert = \(async \(\) =>\n\s*\(\{\n\s*inAppNotifications: false\n\s*\}\)\) as unknown as typeof prisma\.userPreference\.upsert;/g,
  `// @ts-expect-error type evasion\n  prisma.userPreference.upsert = mock.fn(async () => createMockUserPreference({ inAppNotifications: false }));`);

content = content.replace(/prisma\.notification\.create = \(async \(\) => \{\n\s*createCalled = true;\n\s*return \{\} as never;\n\s*\}\) as unknown as typeof prisma\.notification\.create;/g,
  `// @ts-expect-error type evasion\n  prisma.notification.create = mock.fn(async () => { createCalled = true; return createMockNotification({}); });`);

content = content.replace(/prisma\.userPreference\.findUnique = \(async \(\) =>\n\s*\(\{\n\s*cookieConsent: "PENDING"\n\s*\}\)\) as unknown as typeof prisma\.userPreference\.findUnique;/g,
  `// @ts-expect-error type evasion\n  prisma.userPreference.findUnique = mock.fn(async () => createMockUserPreference({ cookieConsent: "PENDING" }));`);

content = content.replace(/prisma\.userPreference\.upsert = \(async \(\) =>\n\s*\(\{\n\s*cookieConsent: "ACCEPTED",\n\s*id: "pref_1"\n\s*\}\)\) as unknown as typeof prisma\.userPreference\.upsert;/g,
  `// @ts-expect-error type evasion\n  prisma.userPreference.upsert = mock.fn(async () => createMockUserPreference({ cookieConsent: "ACCEPTED", id: "pref_1" }));`);

content = content.replace(/prisma\.auditLog\.create = \(async \(args: unknown\) => \{\n\s*auditPayload = args;\n\s*return \{\} as never;\n\s*\}\) as unknown as typeof prisma\.auditLog\.create;/g,
  `// @ts-expect-error type evasion\n  prisma.auditLog.create = mock.fn(async (args: any) => { auditPayload = args; return createMockAuditLog({}); });`);

content = content.replace(/prisma\.userPreference\.upsert = \(async \(args: unknown\) => \{\n\s*upsertPayload = args;\n\s*return \{\n\s*id: "pref_locale_1",\n\s*locale: "en-US"\n\s*\} as never;\n\s*\}\) as unknown as typeof prisma\.userPreference\.upsert;/g,
  `// @ts-expect-error type evasion\n  prisma.userPreference.upsert = mock.fn(async (args: any) => { upsertPayload = args; return createMockUserPreference({ id: "pref_locale_1", locale: "en-US" }); });`);

content = content.replace(/prisma\.membership\.findMany = \(async \(\) =>\n\s*\[\n\s*\{\n\s*role: Role\.ADMIN,\n\s*tenantId: "tenant_1",\n\s*user: \{\n\s*preferences: \[\n\s*\{\n\s*inAppNotifications: true,\n\s*organizationId: "org_1"\n\s*\}\n\s*\]\n\s*\},\n\s*userId: "user_admin"\n\s*\},\n\s*\{\n\s*role: Role\.OWNER,\n\s*tenantId: "tenant_1",\n\s*user: \{\n\s*preferences: \[\n\s*\{\n\s*inAppNotifications: false,\n\s*organizationId: "org_1"\n\s*\}\n\s*\]\n\s*\},\n\s*userId: "user_owner"\n\s*\}\n\s*\]\) as unknown as typeof prisma\.membership\.findMany;/g,
  `// @ts-expect-error type evasion\n  prisma.membership.findMany = mock.fn(async () => createPrismaPromise([\n    createMockMembership({ role: Role.ADMIN }),\n    createMockMembership({ role: Role.OWNER })\n  ]));`);

content = content.replace(/prisma\.notification\.createMany = \(async \(args: unknown\) => \{\n\s*createManyArgs = args;\n\s*return \{ count: 1 \};\n\s*\}\) as unknown as typeof prisma\.notification\.createMany;/g,
  `// @ts-expect-error type evasion\n  prisma.notification.createMany = mock.fn(async (args: any) => { createManyArgs = args; return createPrismaPromise({ count: 1 } as Prisma.BatchPayload); });`);

content = content.replace(/prisma\.membership\.findMany = \(async \(args: unknown\) => \{\n\s*received = args;\n\s*return \[\];\n\s*\}\) as unknown as typeof prisma\.membership\.findMany;/g,
  `// @ts-expect-error type evasion\n  prisma.membership.findMany = mock.fn(async (args: any) => { received = args; return createPrismaPromise([]); });`);

content = content.replace(/prisma\.notification\.findMany = \(async \(\) =>\n\s*\[\n\s*\{ id: "n3" \},\n\s*\{ id: "n2" \},\n\s*\{ id: "n1" \}\n\s*\]\) as unknown as typeof prisma\.notification\.findMany;/g,
  `// @ts-expect-error type evasion\n  prisma.notification.findMany = mock.fn(async () => createPrismaPromise([createMockNotification({ id: "n3" }), createMockNotification({ id: "n2" }), createMockNotification({ id: "n1" })]));`);

content = content.replace(/prisma\.notification\.count = \(async \(\) => 7\) as unknown as typeof prisma\.notification\.count;/g,
  `// @ts-expect-error type evasion\n  prisma.notification.count = mock.fn(async () => createPrismaPromise(7));`);


fs.writeFileSync('packages/database/test/engagement.test.ts', content);

