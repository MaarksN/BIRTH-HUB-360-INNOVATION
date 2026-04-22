import assert from "node:assert/strict";
import test from "node:test";

import { getApiConfig } from "./api.config.js";
import { isProductionEnvironment, resolveNodeEnvironment } from "./environment.js";

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

void test("resolveNodeEnvironment defaults to development for empty env input", () => {
  assert.equal(resolveNodeEnvironment({}), "development");
});

void test("isProductionEnvironment reads process.env at call time", () => {
  withTemporaryEnvironment({ NODE_ENV: "test" }, () => {
    assert.equal(isProductionEnvironment(), false);
  });

  withTemporaryEnvironment({ NODE_ENV: "production" }, () => {
    assert.equal(isProductionEnvironment(), true);
  });
});

void test("getApiConfig keeps runtime compatibility when process.env changes between calls", () => {
  withTemporaryEnvironment(
    {
      API_PORT: "3100",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/birthub?schema=public",
      NODE_ENV: "test",
      REDIS_URL: "redis://localhost:6379"
    },
    () => {
      const firstConfig = getApiConfig();

      process.env.API_PORT = "3200";

      const secondConfig = getApiConfig();

      assert.equal(firstConfig.API_PORT, 3100);
      assert.equal(secondConfig.API_PORT, 3200);
    }
  );
});
