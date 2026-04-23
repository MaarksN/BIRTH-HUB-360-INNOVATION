import assert from "node:assert/strict";
import test from "node:test";

import { UserCreateSchema, validate } from "./validation-schemas.js";

void test("validate returns success for a valid user payload", () => {
  const result = validate(UserCreateSchema, {
    email: "valid@example.com",
    name: "Valid User",
    role: "member"
  });

  assert.equal(result.success, true);
});

void test("validate returns issues for an invalid user payload", () => {
  const result = validate(UserCreateSchema, {
    email: "not-an-email",
    name: "",
    role: "invalid-role"
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.length > 0);
  }
});
