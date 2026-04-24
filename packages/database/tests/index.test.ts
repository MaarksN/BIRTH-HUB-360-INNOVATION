import assert from "node:assert/strict";
import test from "node:test";

import {
  ExceededQuotaError,
  PrismaQueryTimeoutError,
  TenantRequiredError,
  withTenantDatabaseContext
} from "../src/index.js";

void test("database package index exports the public error surfaces and tenant helper", () => {
  assert.equal(typeof ExceededQuotaError, "function");
  assert.equal(typeof PrismaQueryTimeoutError, "function");
  assert.equal(typeof TenantRequiredError, "function");
  assert.equal(typeof withTenantDatabaseContext, "function");
});
