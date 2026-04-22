import assert from "node:assert/strict";
import test from "node:test";

import { ExceededQuotaError } from "../src/errors/exceeded-quota.error.js";

void test("ExceededQuotaError stores billing context and applies the default upgrade path", () => {
  const error = new ExceededQuotaError({
    current: 13,
    limit: 10,
    resetAt: "2026-04-06T00:00:00.000Z",
    resourceType: "messages",
    tenantId: "tenant_1"
  });

  assert.equal(error.name, "ExceededQuotaError");
  assert.equal(error.current, 13);
  assert.equal(error.limit, 10);
  assert.equal(error.resetAt, "2026-04-06T00:00:00.000Z");
  assert.equal(error.resourceType, "messages");
  assert.equal(error.tenantId, "tenant_1");
  assert.equal(error.upgradeUrl, "/billing");
  assert.match(error.message, /Quota exceeded for messages/);
});

void test("ExceededQuotaError preserves an explicit upgrade URL override", () => {
  const error = new ExceededQuotaError({
    current: 21,
    limit: 20,
    resetAt: "2026-04-06T00:00:00.000Z",
    resourceType: "automation-runs",
    tenantId: "tenant_2",
    upgradeUrl: "/settings/billing"
  });

  assert.equal(error.upgradeUrl, "/settings/billing");
});
