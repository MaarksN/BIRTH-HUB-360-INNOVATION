#!/usr/bin/env node
// @ts-nocheck
//
import { runPnpm } from "../ci/shared.mjs";

const DEFAULT_APP_ROLE = "api_worker";

function resolveAdminDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return null;
  }

  return databaseUrl;
}

function resolveRuntimeDatabaseUrl(adminDatabaseUrl) {
  const parsed = new URL(adminDatabaseUrl);
  const roleName = process.env.DB_APP_ROLE?.trim() || DEFAULT_APP_ROLE;
  const rolePassword = process.env.DB_APP_PASSWORD?.trim() || parsed.password || "postgres";

  parsed.username = roleName;
  parsed.password = rolePassword;

  return parsed.toString();
}

const adminDatabaseUrl = resolveAdminDatabaseUrl();
const requireRlsTests = Boolean(adminDatabaseUrl);

if (adminDatabaseUrl) {
  runPnpm(["--filter", "@birthub/database", "db:bootstrap:ci"], {
    env: {
      DATABASE_URL: adminDatabaseUrl
    }
  });
}

runPnpm(["--filter", "@birthub/database", "run", "test:isolation"], {
  env: {
    ...(adminDatabaseUrl
      ? {
          DATABASE_URL: resolveRuntimeDatabaseUrl(adminDatabaseUrl)
        }
      : {}),
    ...(requireRlsTests
      ? {
          BIRTHUB_REQUIRE_RLS_TESTS: "true"
        }
      : {})
  }
});

runPnpm(
  [
    "-r",
    "--if-present",
    "--filter=@birthub/api",
    "--filter=@birthub/worker",
    "run",
    "test:isolation"
  ],
  {
    env: {
      ...(requireRlsTests
        ? {
            BIRTHUB_REQUIRE_RLS_TESTS: "true"
          }
        : {})
    }
  }
);
