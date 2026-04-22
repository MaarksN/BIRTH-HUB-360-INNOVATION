import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { Prisma } from "@birthub/database";
import { createPrismaClient, type PrismaClient } from "@birthub/database/client";

import { seedCoreFixtures } from "./factories.js";

const DEFAULT_DEVELOPMENT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/birthub?schema=public";

function withSchema(databaseUrl: string, schema: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

function isImplicitDevelopmentFallback(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);

    return (
      parsed.protocol.startsWith("postgres") &&
      parsed.username === "postgres" &&
      parsed.password === "postgres" &&
      parsed.hostname === "localhost" &&
      parsed.port === "5432" &&
      parsed.pathname === "/birthub"
    );
  } catch {
    return databaseUrl === DEFAULT_DEVELOPMENT_DATABASE_URL;
  }
}

function resolvePnpmCommand(): { args: string[]; command: string } {
  const bundledPnpm = resolve(
    import.meta.dirname,
    "../../../.tools/node-v24.14.0-win-x64/node_modules/corepack/dist/pnpm.js"
  );
  const activePnpm = process.env.npm_execpath;

  if (activePnpm?.toLowerCase().includes("pnpm")) {
    return {
      args: [activePnpm],
      command: process.execPath
    };
  }

  if (existsSync(bundledPnpm)) {
    return {
      args: [bundledPnpm],
      command: process.execPath
    };
  }

  if (process.platform === "win32") {
    return {
      args: ["/d", "/s", "/c", "pnpm"],
      command: process.env.ComSpec ?? "cmd.exe"
    };
  }

  return {
    args: [],
    command: "pnpm"
  };
}

function createPrismaForTest(databaseUrl: string): PrismaClient {
  return createPrismaClient({ databaseUrl });
}

function quoteIdentifier(identifier: string): Prisma.Sql {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier rejected: ${identifier}`);
  }

  return Prisma.raw(`"${identifier}"`);
}

export function resolveExplicitTestDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return null;
  }

  if (env.BIRTHUB_ENABLE_DB_TESTS === "1") {
    return databaseUrl;
  }

  return isImplicitDevelopmentFallback(databaseUrl) ? null : databaseUrl;
}

export interface TestDatabaseHandle {
  cleanup: () => Promise<void>;
  databaseUrl: string;
  prisma: PrismaClient;
  schema: string;
}

export async function provisionTestDatabase(baseDatabaseUrl: string): Promise<TestDatabaseHandle> {
  const schema = `test_${randomUUID().replace(/-/g, "")}`;
  const databaseUrl = withSchema(baseDatabaseUrl, schema);
  const databasePackageCwd = resolve(import.meta.dirname, "../../database");

  const pnpm = resolvePnpmCommand();

  execFileSync(pnpm.command, [...pnpm.args, "exec", "prisma", "db", "push", "--skip-generate", "--schema", "prisma/schema.prisma"], {
    cwd: databasePackageCwd,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    },
    stdio: "inherit"
  });

  const prisma = createPrismaForTest(databaseUrl);

  await seedCoreFixtures(prisma);

  return {
    cleanup: async () => {
      await prisma.$executeRaw(
        Prisma.sql`DROP SCHEMA IF EXISTS ${quoteIdentifier(schema)} CASCADE`
      );
      await prisma.$disconnect();
    },
    databaseUrl,
    prisma,
    schema
  };
}
