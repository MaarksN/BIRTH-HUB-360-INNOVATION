import assert from "node:assert/strict";
import test from "node:test";

import { createRuntimeError } from "./runtime.errors.js";

void test("createRuntimeError preserves message and code on the error object", () => {
  const error = createRuntimeError("AGENT_RUNTIME_FAILED", "runtime failed");

  assert.equal(error.message, "runtime failed");
  assert.equal(error.code, "AGENT_RUNTIME_FAILED");
  assert.equal(error.name, "Error");
});

