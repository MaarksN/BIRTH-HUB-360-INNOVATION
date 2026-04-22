import assert from "node:assert/strict";
import test from "node:test";

import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError
} from "../errors.js";

void test("AppError captures status code and operational flag", () => {
  const error = new AppError("something failed", 503, false);

  assert.equal(error.message, "something failed");
  assert.equal(error.statusCode, 503);
  assert.equal(error.isOperational, false);
  assert.equal(error.name, "Error");
  assert.ok(error.stack);
});

void test("domain-specific errors inherit AppError defaults", () => {
  const cases = [
    { error: new NotFoundError(), status: 404, message: "Resource not found" },
    { error: new ValidationError(), status: 400, message: "Validation failed" },
    { error: new UnauthorizedError(), status: 401, message: "Unauthorized" },
    { error: new ForbiddenError(), status: 403, message: "Forbidden" }
  ];

  for (const { error, status, message } of cases) {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, status);
    assert.equal(error.message, message);
    assert.equal(error.isOperational, true);
  }
});
