import assert from "node:assert/strict";
import test from "node:test";

import {
  configureCacheStore,
  readCacheValue,
  setCacheStoreForTests,
  writeCacheValue
} from "../src/common/cache/cache-store.js";

void test("configureCacheStore falls back to in-memory cache outside production when REDIS_URL is absent", async () => {
  configureCacheStore(undefined, "development");

  await writeCacheValue("tenant:alpha", "cached-value", 30);

  assert.equal(await readCacheValue("tenant:alpha"), "cached-value");
});

void test("configureCacheStore rejects missing Redis configuration in production", () => {
  assert.throws(
    () => configureCacheStore(undefined, "production"),
    /CACHE_CONFIGURATION_INVALID/
  );
});

void test("setCacheStoreForTests overrides the active cache implementation", async () => {
  let writes = 0;

  setCacheStoreForTests({
    del: async () => Promise.resolve(0),
    get: async () => Promise.resolve("from-test-double"),
    set: async () => {
      writes += 1;
      return Promise.resolve();
    }
  });

  await writeCacheValue("tenant:beta", "value", 10);

  assert.equal(writes, 1);
  assert.equal(await readCacheValue("tenant:beta"), "from-test-double");

  setCacheStoreForTests(null);
});
