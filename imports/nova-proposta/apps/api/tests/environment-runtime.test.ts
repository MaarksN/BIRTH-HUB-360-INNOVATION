import assert from "node:assert/strict";
import test from "node:test";

import { hasExplicitDatabaseUrl } from "../src/lib/database-availability.js";
import { errorHandler } from "../src/middleware/error-handler.js";

function withTemporaryEnvironment<T>(
  overrides: Record<string, string | undefined>,
  callback: () => T
): T {
  const previousValues = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(overrides)) {
    previousValues.set(key, process.env[key]);

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return callback();
  } finally {
    for (const [key, value] of previousValues.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

void test("hasExplicitDatabaseUrl reads process.env at runtime when env is omitted", () => {
  withTemporaryEnvironment(
    {
      BIRTHUB_ENABLE_DB_TESTS: undefined,
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/birthub?schema=public"
    },
    () => {
      assert.equal(hasExplicitDatabaseUrl(), false);

      process.env.BIRTHUB_ENABLE_DB_TESTS = "1";

      assert.equal(hasExplicitDatabaseUrl(), true);
    }
  );
});

void test("errorHandler keeps non-production error detail when NODE_ENV changes at runtime", () => {
  const responseState: { body?: unknown; statusCode?: number } = {};
  const response = {
    headersSent: false,
    json(body: unknown) {
      responseState.body = body;
      return this;
    },
    status(statusCode: number) {
      responseState.statusCode = statusCode;
      return this;
    }
  };
  const request = {
    context: {},
    method: "GET",
    originalUrl: "/runtime-error"
  };

  withTemporaryEnvironment({ NODE_ENV: "test" }, () => {
    errorHandler(new Error("runtime detail"), request as never, response as never, () => {});
  });

  assert.equal(responseState.statusCode, 500);
  assert.deepEqual(responseState.body, {
    detail: "runtime detail",
    errors: undefined,
    instance: "/runtime-error",
    status: 500,
    title: "Internal Server Error",
    type: "about:blank"
  });
});
