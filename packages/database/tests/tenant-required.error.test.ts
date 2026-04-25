import assert from "node:assert/strict";
import test from "node:test";

import { TenantRequiredError } from "../src/errors/tenant-required.error.js";

void test("TenantRequiredError uses the provided operation in the message", () => {
  const error = new TenantRequiredError("listing notifications");

  assert.equal(error.name, "TenantRequiredError");
  assert.match(error.message, /listing notifications/);
});

void test("TenantRequiredError falls back to a generic operation label", () => {
  const error = new TenantRequiredError();

  assert.match(error.message, /this operation/);
});
