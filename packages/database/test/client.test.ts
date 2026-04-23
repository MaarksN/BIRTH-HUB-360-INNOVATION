import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  createPrismaClient,
  getPrismaClient,
  normalizeDatabaseUrl,
  pingDatabase,
  pingDatabaseDeep,
  prisma,
  raceWithTimeout,
  resetPrismaClientForTests,
  resolveConnectionLimit,
  resolveRuntimeDatabaseUrl,
  withTenantDatabaseContext
} from "../src/client.js";
import { PrismaQueryTimeoutError } from "../src/errors/prisma-query-timeout.error.js";
import { runWithTenantContext } from "../src/tenant-context.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key);
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

function restoreEnv(key: string, previousValue: string | undefined): void {
  if (previousValue === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = previousValue;
}

void test("importing client module does not bootstrap Prisma or require DATABASE_URL", () => {
  const packageRoot = fileURLToPath(new URL("..", import.meta.url));
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      "process.env.NODE_ENV='production'; delete process.env.DATABASE_URL; await import('./src/client.ts'); console.log(globalThis.birthubPrisma === undefined ? 'client-import-ok' : 'client-import-side-effect');"
    ],
    {
      cwd: packageRoot,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /client-import-ok/);
});

void test.afterEach(async () => {
  await resetPrismaClientForTests();
});

void test("normalizeDatabaseUrl injects pool defaults for postgres URLs", () => {
  const previous = process.env.DATABASE_CONNECTION_LIMIT;
  delete process.env.DATABASE_CONNECTION_LIMIT;

  const normalized = normalizeDatabaseUrl("postgresql://user:pass@db.birthhub.local:5432/app?schema=public");
  const parsed = new URL(normalized ?? "");

  try {
    assert.equal(parsed.searchParams.get("pgbouncer"), "true");
    assert.equal(parsed.searchParams.get("connection_limit"), "10");
    assert.equal(parsed.searchParams.get("schema"), "public");
  } finally {
    restoreEnv("DATABASE_CONNECTION_LIMIT", previous);
  }
});

void test("getPrismaClient lazily creates and reuses the default client", () => {
  const firstClient = getPrismaClient();
  const secondClient = getPrismaClient();

  assert.equal(firstClient, secondClient);
});

void test("createPrismaClient with explicit databaseUrl keeps the explicit factory path functional", async () => {
  const client = createPrismaClient({
    databaseUrl: "postgresql://user:pass@db.birthhub.local:5432/app?schema=public"
  });

  try {
    assert.equal(typeof client.$disconnect, "function");
    assert.equal(typeof client.$transaction, "function");
  } finally {
    await client.$disconnect();
  }
});

void test("resolveConnectionLimit prefers env override, then URL, then fallback", () => {
  const previous = process.env.DATABASE_CONNECTION_LIMIT;
  process.env.DATABASE_CONNECTION_LIMIT = "23";

  try {
    assert.equal(resolveConnectionLimit("postgresql://user:pass@db.birthhub.local:5432/app"), 23);
  } finally {
    process.env.DATABASE_CONNECTION_LIMIT = previous;
  }

  assert.equal(
    resolveConnectionLimit("postgresql://user:pass@db.birthhub.local:5432/app?connection_limit=7"),
    7
  );
  assert.equal(resolveConnectionLimit("postgresql://user:pass@db.birthhub.local:5432/app"), 10);
});

void test("resolveConnectionLimit returns default value for malformed URLs", () => {
  const previous = process.env.DATABASE_CONNECTION_LIMIT;
  delete process.env.DATABASE_CONNECTION_LIMIT;

  try {
    assert.equal(resolveConnectionLimit("not-a-url"), 10);
  } finally {
    restoreEnv("DATABASE_CONNECTION_LIMIT", previous);
  }
});

void test("resolveRuntimeDatabaseUrl falls back only in development-like environments", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";

  try {
    assert.match(resolveRuntimeDatabaseUrl(undefined), /birthub\?schema=public$/);
  } finally {
    restoreEnv("NODE_ENV", previousNodeEnv);
  }

  process.env.NODE_ENV = "production";
  try {
    assert.throws(() => resolveRuntimeDatabaseUrl(undefined), /DATABASE_URL environment variable must be set/i);
  } finally {
    restoreEnv("NODE_ENV", previousNodeEnv);
  }
});

void test("raceWithTimeout rejects long-running operations with PrismaQueryTimeoutError", async () => {
  const previous = process.env.PRISMA_QUERY_TIMEOUT_MS;
  process.env.PRISMA_QUERY_TIMEOUT_MS = "25";

  try {
    await assert.rejects(
      raceWithTimeout(new Promise(() => undefined), "findMany", "Workflow"),
      (error: unknown) =>
        error instanceof PrismaQueryTimeoutError &&
        error.operation === "findMany" &&
        error.timeoutMs === 25
    );
  } finally {
    restoreEnv("PRISMA_QUERY_TIMEOUT_MS", previous);
  }
});

void test("withTenantDatabaseContext sets app.current_tenant_id inside the transaction", async () => {
  const calls: Array<{ kind: string; values?: unknown[] }> = [];

  const fakeClient = {
    $transaction: (callback: (tx: { $executeRaw: (...args: unknown[]) => Promise<number> }) => Promise<string>) =>
      callback({
        $executeRaw: (...args: unknown[]) => {
          calls.push({
            kind: "execute",
            values: args.slice(1)
          });
          return Promise.resolve(1);
        }
      })
  };

  const result = await runWithTenantContext(
    {
      source: "authenticated",
      tenantId: "tenant-alpha"
    },
    () => withTenantDatabaseContext(() => Promise.resolve("ok"), fakeClient as never)
  );

  assert.equal(result, "ok");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.values?.[0], "tenant-alpha");
});

void test("pingDatabase and pingDatabaseDeep expose up/down health based on Prisma operations", async () => {
  const restores = [
    stubMethod(prisma, "$queryRaw", () => Promise.resolve(1))
  ];

  try {
    assert.deepEqual(await pingDatabase(), { status: "up" });
    const deep = await pingDatabaseDeep();
    assert.equal(deep.status, "up");
    assert.match(deep.message ?? "", /^query-ok:/);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }

  const failingRestores = [
    stubMethod(prisma, "$queryRaw", () => Promise.reject(new Error("db down")))
  ];

  try {
    const ping = await pingDatabase();
    const deep = await pingDatabaseDeep();

    assert.equal(ping.status, "down");
    assert.equal(ping.message, "db down");
    assert.equal(deep.status, "down");
    assert.equal(deep.message, "db down");
  } finally {
    for (const restore of failingRestores.reverse()) {
      restore();
    }
  }
});

void test("monkeypatching prisma remains compatible with the lazy proxy export", async () => {
  const restore = stubMethod(prisma, "$disconnect", () => Promise.resolve(undefined));

  try {
    await assert.doesNotReject(async () => prisma.$disconnect());
  } finally {
    restore();
  }
});
