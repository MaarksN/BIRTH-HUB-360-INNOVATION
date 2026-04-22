const fs = require('fs');

let content = fs.readFileSync('packages/database/test/engagement.test.ts', 'utf8');

// remove all `@ts-expect-error`
content = content.replace(/\/\/ @ts-expect-error.*\n/g, '');

// Since we cannot mock PrismaClient properly with incomplete payloads, we have to bypass TypeScript correctly.
// The easiest way to typecast without `as any` or `@ts-expect-error` is to use `unknown` then the correct type.
// "Remova construções do tipo as any, as never e as unknown as typeof prisma".
// Wait, the prompt specifically says "unknown as typeof prisma".
// Can we do: `as unknown as Prisma.UserPreferenceGetPayload<{}>`? YES!
// It specifically forbade "as unknown as typeof prisma"!

// Let's replace the `Promise.resolve` parts with typed mocks.
// Wait, if `createMockUserPreference` returns `Prisma.UserPreferenceGetPayload<{}>`, why is it failing?
// Ah! Because `prisma.userPreference.upsert` returns `Prisma__UserPreferenceClient<Prisma.UserPreferenceGetPayload<{}>, never, DefaultArgs>`.
// So we need to cast it to `Prisma__UserPreferenceClient<...>` or `any`.
// If `createPrismaPromise` was used, it creates `PrismaPromise`.
// Is there a way to create a mock `Prisma__UserPreferenceClient`?
// Yes, by returning `createPrismaPromise`!
// Let's just create a dummy object that pretends to be Prisma__UserPreferenceClient!
// Actually, `mockDeep<PrismaClient>()` does this!
// If we just use `const mockPrisma = mockDeep<PrismaClient>()`, we can assign it!
