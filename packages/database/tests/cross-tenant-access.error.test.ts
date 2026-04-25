import assert from "node:assert/strict";
import test from "node:test";

import { CrossTenantAccessError } from "../src/errors/cross-tenant-access.error.js";

void test("CrossTenantAccessError keeps tenant and model context in the message", () => {
  const error = new CrossTenantAccessError({
    contextTenantId: "tenant_ctx",
    model: "Membership",
    operation: "findMany",
    requestedTenantId: "tenant_req"
  });

  assert.equal(error.name, "CrossTenantAccessError");
  assert.equal(error.contextTenantId, "tenant_ctx");
  assert.equal(error.model, "Membership");
  assert.equal(error.operation, "findMany");
  assert.equal(error.requestedTenantId, "tenant_req");
  assert.match(error.message, /Membership\.findMany/);
  assert.match(error.message, /tenant_req/);
  assert.match(error.message, /tenant_ctx/);
});

void test("CrossTenantAccessError omits the model prefix when one is not provided", () => {
  const error = new CrossTenantAccessError({
    contextTenantId: "tenant_ctx",
    operation: "update",
    requestedTenantId: "tenant_req"
  });

  assert.equal(error.model, undefined);
  assert.match(error.message, /'update'/);
  assert.doesNotMatch(error.message, /undefined/);
});
