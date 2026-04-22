import assert from "node:assert/strict";
import test from "node:test";

import * as cacheModule from "../src/common/cache/index.js";

void test("cache index exposes the canonical cache primitives", () => {
  assert.equal(typeof cacheModule.configureCacheStore, "function");
  assert.equal(typeof cacheModule.invalidateTenantCache, "function");
  assert.equal(typeof cacheModule.registerTenantCacheInvalidationMiddleware, "function");
  assert.equal(typeof cacheModule.sendEtaggedJson, "function");
});
