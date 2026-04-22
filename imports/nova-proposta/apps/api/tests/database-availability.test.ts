import assert from "node:assert/strict";
import test from "node:test";

import { hasExplicitDatabaseUrl } from "../src/lib/database-availability.js";

void test("hasExplicitDatabaseUrl returns false when DATABASE_URL is missing", () => {
  assert.equal(hasExplicitDatabaseUrl({}), false);
});

void test("hasExplicitDatabaseUrl rejects the implicit local development fallback", () => {
  assert.equal(
    hasExplicitDatabaseUrl({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/birthub?schema=public"
    }),
    false
  );
});

void test("hasExplicitDatabaseUrl accepts explicit runtime database urls", () => {
  assert.equal(
    hasExplicitDatabaseUrl({
      DATABASE_URL: "postgresql://birthub:secret@db.example.com:5432/birthub?sslmode=require"
    }),
    true
  );
});

void test("hasExplicitDatabaseUrl allows the fallback url only when DB tests are explicitly enabled", () => {
  assert.equal(
    hasExplicitDatabaseUrl({
      BIRTHUB_ENABLE_DB_TESTS: "1",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/birthub?schema=public"
    }),
    true
  );
});
