import assert from "node:assert/strict";
import test from "node:test";

import {
  ensureDatabaseAvailableOrSkip,
  requireDatabaseUrlOrSkip
} from "./database-availability.js";

function createTestContext() {
  const calls: string[] = [];

  return {
    context: {
      skip(message: string) {
        calls.push(message);
      }
    },
    calls
  };
}

void test("requireDatabaseUrlOrSkip skips optional suites when DATABASE_URL is absent", () => {
  const { calls, context } = createTestContext();

  const result = requireDatabaseUrlOrSkip(context as never, "", {
    label: "a suite de RLS",
    required: false
  });

  assert.equal(result, false);
  assert.equal(calls.length, 1);
  assert.match(calls[0] ?? "", /database_url.*suite de rls/i);
});

void test("requireDatabaseUrlOrSkip fails official suites when DATABASE_URL is absent", () => {
  const { context } = createTestContext();

  assert.throws(
    () =>
      requireDatabaseUrlOrSkip(context as never, "", {
        label: "a suite oficial de RLS",
        required: true
      }),
    /DATABASE_URL.*suite oficial de RLS/i
  );
});

void test("ensureDatabaseAvailableOrSkip skips optional suites on connectivity errors", async () => {
  const { calls, context } = createTestContext();
  const client = {
    $queryRaw: () => {
      const error = new Error("connect ECONNREFUSED");
      Object.assign(error, { code: "ECONNREFUSED" });
      return Promise.reject(error);
    }
  };

  const result = await ensureDatabaseAvailableOrSkip(context as never, client, {
    label: "a suite de RLS",
    required: false
  });

  assert.equal(result, false);
  assert.equal(calls.length, 1);
  assert.match(calls[0] ?? "", /banco n.o est. acess.vel/i);
});

void test("ensureDatabaseAvailableOrSkip fails official suites on connectivity errors", async () => {
  const { context } = createTestContext();
  const client = {
    $queryRaw: () => {
      const error = new Error("connect ECONNREFUSED");
      Object.assign(error, { code: "ECONNREFUSED" });
      return Promise.reject(error);
    }
  };

  await assert.rejects(
    () =>
      ensureDatabaseAvailableOrSkip(context as never, client, {
        label: "a suite oficial de RLS",
        required: true
      }),
    /banco n.o est. acess.vel/i
  );
});
