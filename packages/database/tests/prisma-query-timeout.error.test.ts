import assert from "node:assert/strict";
import test from "node:test";

import { PrismaQueryTimeoutError } from "../src/errors/prisma-query-timeout.error.js";

void test("PrismaQueryTimeoutError records timeout metadata for model-bound operations", () => {
  const error = new PrismaQueryTimeoutError("findMany", 2_000, "WorkflowRun");

  assert.equal(error.name, "PrismaQueryTimeoutError");
  assert.equal(error.model, "WorkflowRun");
  assert.equal(error.operation, "findMany");
  assert.equal(error.timeoutMs, 2_000);
  assert.match(error.message, /WorkflowRun\.findMany/);
  assert.match(error.message, /2000ms timeout/);
});

void test("PrismaQueryTimeoutError still renders a clear message without a model name", () => {
  const error = new PrismaQueryTimeoutError("transaction", 5_000);

  assert.equal(error.model, undefined);
  assert.match(error.message, /'transaction'/);
  assert.doesNotMatch(error.message, /undefined/);
});
