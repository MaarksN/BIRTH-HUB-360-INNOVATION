// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import { tenantCacheInvalidationTestables } from "../src/common/cache/prisma-cache-invalidation.js";

void test("collectTenantReferences trims, filters and deduplicates cache references", () => {
  assert.deepEqual(
    tenantCacheInvalidationTestables.collectTenantReferences([
      " tenant_1 ",
      "tenant_1",
      undefined,
      "",
      "org_1",
      null
    ]),
    ["tenant_1", "org_1"]
  );
});

void test("organizationToReferences returns tenant-safe keys for cache invalidation", () => {
  assert.deepEqual(
    tenantCacheInvalidationTestables.organizationToReferences({
      id: "org_1",
      slug: "birthhub",
      tenantId: "tenant_1"
    }),
    ["org_1", "birthhub", "tenant_1"]
  );
});

void test("organizationReferencesFromResult ignores malformed mutation payloads", () => {
  assert.deepEqual(tenantCacheInvalidationTestables.organizationReferencesFromResult(null), []);
  assert.deepEqual(
    tenantCacheInvalidationTestables.organizationReferencesFromResult({
      id: "org_2",
      slug: null,
      tenantId: "tenant_2"
    }),
    ["org_2", "tenant_2"]
  );
});

