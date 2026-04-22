import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import { resolveManagedPolicies } from "./runtime.resolution.js";

void test("resolveManagedPolicies returns an empty array when no installed agent id is provided", async () => {
  assert.deepEqual(
    await resolveManagedPolicies({
      installedAgentId: null,
      tenantId: "tenant_1"
    }),
    []
  );
});

void test("resolveManagedPolicies returns an empty array when the installed agent is not found", async () => {
  const originalFindFirst = prisma.agent.findFirst.bind(prisma.agent);

  prisma.agent.findFirst = (async () => null) as unknown as typeof prisma.agent.findFirst;

  try {
    assert.deepEqual(
      await resolveManagedPolicies({
        installedAgentId: "agent_1",
        tenantId: "tenant_1"
      }),
      []
    );
  } finally {
    prisma.agent.findFirst = originalFindFirst;
  }
});

