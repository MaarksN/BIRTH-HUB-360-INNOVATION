import assert from "node:assert/strict";
import test from "node:test";

import { provisionTestDatabase, resolveExplicitTestDatabaseUrl } from "./test-db.js";

void test("testing package exposes isolated database provisioning helper", () => {
  assert.equal(typeof provisionTestDatabase, "function");
});

void test("resolveExplicitTestDatabaseUrl ignores implicit development fallback", () => {
  assert.equal(
    resolveExplicitTestDatabaseUrl({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/birthub?schema=public"
    } as NodeJS.ProcessEnv),
    null
  );
});

void test("resolveExplicitTestDatabaseUrl accepts explicit opt-in for integration runs", () => {
  assert.equal(
    resolveExplicitTestDatabaseUrl({
      BIRTHUB_ENABLE_DB_TESTS: "1",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/birthub?schema=public"
    } as NodeJS.ProcessEnv),
    "postgresql://postgres:postgres@localhost:5432/birthub?schema=public"
  );
});
