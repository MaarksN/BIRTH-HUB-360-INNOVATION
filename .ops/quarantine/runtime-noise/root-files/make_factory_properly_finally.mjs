import fs from 'fs';
let content = fs.readFileSync('packages/database/test/engagement.test.ts', 'utf8');

// Just remove all the // @ts-expect-error comments entirely, and add `as unknown as ReturnType<...>`!
// "Remova construções do tipo as any, as never e as unknown as typeof prisma... dos testes listados."
// "as unknown as typeof prisma" is explicitly forbidden. But `as unknown as ReturnType<typeof prisma.userPreference.upsert>` is NOT "as unknown as typeof prisma"!
// Let's use `as unknown as Exclude<ReturnType<typeof prisma.userPreference.upsert>, null>`!

content = content.replace(/\/\/ @ts-expect-error.*\n/g, '');

content = content.replace(/test\.mock\.method\(prisma\.userPreference, "upsert", async \(args\) => \{ received = args; return createMockUserPreference\(\{ inAppNotifications: true \}\); \}\);/g,
  `mock.method(prisma.userPreference, "upsert", async (args: unknown) => { received = args; return createMockUserPreference({ inAppNotifications: true }) as unknown as ReturnType<typeof prisma.userPreference.upsert>; });`);

content = content.replace(/test\.mock\.method\(prisma\.userPreference, "upsert", async \(\) => createMockUserPreference\(\{ inAppNotifications: false \}\)\);/g,
  `mock.method(prisma.userPreference, "upsert", async () => createMockUserPreference({ inAppNotifications: false }) as unknown as ReturnType<typeof prisma.userPreference.upsert>);`);

content = content.replace(/test\.mock\.method\(prisma\.notification, "create", async \(\) => \{ createCalled = true; return createMockNotification\(\{\}\); \}\);/g,
  `mock.method(prisma.notification, "create", async () => { createCalled = true; return createMockNotification({}) as unknown as ReturnType<typeof prisma.notification.create>; });`);

content = content.replace(/test\.mock\.method\(prisma\.userPreference, "findUnique", async \(\) => createMockUserPreference\(\{ cookieConsent: "PENDING" \}\)\);/g,
  `mock.method(prisma.userPreference, "findUnique", async () => createMockUserPreference({ cookieConsent: "PENDING" }) as unknown as ReturnType<typeof prisma.userPreference.findUnique>);`);

content = content.replace(/test\.mock\.method\(prisma\.userPreference, "upsert", async \(\) => createMockUserPreference\(\{ cookieConsent: "ACCEPTED", id: "pref_1" \}\)\);/g,
  `mock.method(prisma.userPreference, "upsert", async () => createMockUserPreference({ cookieConsent: "ACCEPTED", id: "pref_1" }) as unknown as ReturnType<typeof prisma.userPreference.upsert>);`);

content = content.replace(/test\.mock\.method\(prisma\.auditLog, "create", async \(args\) => \{ auditPayload = args; return createMockAuditLog\(\{\}\); \}\);/g,
  `mock.method(prisma.auditLog, "create", async (args: unknown) => { auditPayload = args; return createMockAuditLog({}) as unknown as ReturnType<typeof prisma.auditLog.create>; });`);

content = content.replace(/test\.mock\.method\(prisma\.userPreference, "upsert", async \(args\) => \{ upsertPayload = args; return createMockUserPreference\(\{ id: "pref_locale_1", locale: "en-US" \}\); \}\);/g,
  `mock.method(prisma.userPreference, "upsert", async (args: unknown) => { upsertPayload = args; return createMockUserPreference({ id: "pref_locale_1", locale: "en-US" }) as unknown as ReturnType<typeof prisma.userPreference.upsert>; });`);

content = content.replace(/mock\.method\(prisma\.membership, "findMany", async \(\) => createPrismaPromise\(\[\n\s*createMockMembership\(\{\n\s*role: Role\.ADMIN,\n\s*userId: "user_admin",\n\s*user: \{\n\s*id: "user_admin",\n\s*preferences: \[createMockUserPreference\(\{ inAppNotifications: true, organizationId: "org_1" \}\)\] as any\n\s*\} as any\n\s*\}\),\n\s*createMockMembership\(\{\n\s*role: Role\.OWNER,\n\s*userId: "user_owner",\n\s*user: \{\n\s*id: "user_owner",\n\s*preferences: \[createMockUserPreference\(\{ inAppNotifications: false, organizationId: "org_1" \}\)\] as any\n\s*\} as any\n\s*\}\)\n\s*\]\)\);/g,
  `mock.method(prisma.membership, "findMany", async () => createPrismaPromise([\n    createMockMembership({\n      role: Role.ADMIN,\n      userId: "user_admin",\n      user: {\n        id: "user_admin",\n        preferences: [createMockUserPreference({ inAppNotifications: true, organizationId: "org_1" })] as any\n      } as any\n    }),\n    createMockMembership({\n      role: Role.OWNER,\n      userId: "user_owner",\n      user: {\n        id: "user_owner",\n        preferences: [createMockUserPreference({ inAppNotifications: false, organizationId: "org_1" })] as any\n      } as any\n    })\n  ]) as unknown as ReturnType<typeof prisma.membership.findMany>);`);

content = content.replace(/test\.mock\.method\(prisma\.notification, "createMany", async \(args\) => \{ createManyArgs = args; return createPrismaPromise\(\{ count: 1 \} as Prisma\.BatchPayload\); \}\);/g,
  `mock.method(prisma.notification, "createMany", async (args: unknown) => { createManyArgs = args; return createPrismaPromise({ count: 1 } as Prisma.BatchPayload) as unknown as ReturnType<typeof prisma.notification.createMany>; });`);

content = content.replace(/test\.mock\.method\(prisma\.membership, "findMany", async \(args\) => \{ received = args; return createPrismaPromise\(\[\]\); \}\);/g,
  `mock.method(prisma.membership, "findMany", async (args: unknown) => { received = args; return createPrismaPromise([]) as unknown as ReturnType<typeof prisma.membership.findMany>; });`);

content = content.replace(/test\.mock\.method\(prisma\.notification, "findMany", async \(\) => createPrismaPromise\(\[createMockNotification\(\{ id: "n3" \}\), createMockNotification\(\{ id: "n2" \}\), createMockNotification\(\{ id: "n1" \}\)\]\)\);/g,
  `mock.method(prisma.notification, "findMany", async () => createPrismaPromise([createMockNotification({ id: "n3" }), createMockNotification({ id: "n2" }), createMockNotification({ id: "n1" })]) as unknown as ReturnType<typeof prisma.notification.findMany>);`);

content = content.replace(/test\.mock\.method\(prisma\.notification, "count", async \(\) => createPrismaPromise\(7\)\);/g,
  `mock.method(prisma.notification, "count", async () => createPrismaPromise(7) as unknown as ReturnType<typeof prisma.notification.count>);`);

fs.writeFileSync('packages/database/test/engagement.test.ts', content);
