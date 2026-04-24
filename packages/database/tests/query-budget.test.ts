import assert from "node:assert/strict";
import test from "node:test";

import {
  getCurrentQueryBudget,
  resolveQueryTimeoutMs,
  runWithQueryBudget
} from "../src/query-budget.js";

function restoreEnv(key: string, previousValue: string | undefined): void {
  if (previousValue === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = previousValue;
}

void test("query budget falls back to oltp defaults outside an explicit context", () => {
  const budget = getCurrentQueryBudget();

  assert.equal(budget.category, "oltp");
  assert.ok(budget.timeoutMs > 0);
});

void test("resolveQueryTimeoutMs honors per-category environment overrides", () => {
  const previous = process.env.PRISMA_QUERY_TIMEOUT_REPORT_MS;
  process.env.PRISMA_QUERY_TIMEOUT_REPORT_MS = "1234";

  try {
    assert.equal(resolveQueryTimeoutMs("report"), 1234);
  } finally {
    restoreEnv("PRISMA_QUERY_TIMEOUT_REPORT_MS", previous);
  }
});

void test("runWithQueryBudget exposes the chosen category and timeout inside async local storage", () => {
  const previous = process.env.PRISMA_QUERY_TIMEOUT_MIGRATION_MS;
  process.env.PRISMA_QUERY_TIMEOUT_MIGRATION_MS = "4321";

  try {
    const budget = runWithQueryBudget("migration", () => getCurrentQueryBudget());

    assert.equal(budget.category, "migration");
    assert.equal(budget.timeoutMs, 4321);
  } finally {
    restoreEnv("PRISMA_QUERY_TIMEOUT_MIGRATION_MS", previous);
  }
});
