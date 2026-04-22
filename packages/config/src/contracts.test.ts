import assert from "node:assert/strict";
import test from "node:test";

import {
  apiKeyCreateRequestSchema,
  createInviteRequestSchema,
  loginRequestSchema,
  roleUpdateRequestSchema,
  taskRequestSchema
} from "./contracts.js";

void test("sensitive request contracts reject unexpected fields", () => {
  const cases = [
    {
      payload: {
        email: "owner@birthub.local",
        password: "password123",
        role: "OWNER",
        tenantId: "tenant_1"
      },
      schema: loginRequestSchema
    },
    {
      payload: {
        email: "member@birthub.local",
        role: "ADMIN",
        tenantId: "tenant_1"
      },
      schema: createInviteRequestSchema
    },
    {
      payload: {
        label: "automation",
        organizationId: "org_1",
        scopes: ["agents:read"]
      },
      schema: apiKeyCreateRequestSchema
    },
    {
      payload: {
        role: "ADMIN",
        tenantId: "tenant_1"
      },
      schema: roleUpdateRequestSchema
    },
    {
      payload: {
        tenantId: "tenant_1",
        type: "send-welcome-email",
        userId: "user_1"
      },
      schema: taskRequestSchema
    }
  ];

  for (const { payload, schema } of cases) {
    const result = schema.safeParse(payload);
    assert.equal(result.success, false);
  }
});

void test("task request contract keeps caller-controlled payload isolated", () => {
  const result = taskRequestSchema.parse({
    payload: {
      tenantId: "payload_tenant",
      userId: "payload_user"
    },
    type: "send-welcome-email"
  });

  const parsed = result as Record<string, unknown>;

  assert.equal(parsed.tenantId, undefined);
  assert.equal(parsed.userId, undefined);
  assert.deepEqual(result.payload, {
    tenantId: "payload_tenant",
    userId: "payload_user"
  });
});
