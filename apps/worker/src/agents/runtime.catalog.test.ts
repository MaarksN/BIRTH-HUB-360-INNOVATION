import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import {
  parseAgentConfig,
  resolveManagedPolicies
} from "./runtime.catalog.js";

void test("parseAgentConfig falls back to safe defaults for invalid input", () => {
  assert.deepEqual(parseAgentConfig(null), {
    managedPolicies: [],
    runtimeProvider: "manifest-runtime",
    sourceAgentId: null
  });
});

void test("parseAgentConfig filters malformed policies and normalizes runtime provider", () => {
  const parsed = parseAgentConfig({
    managedPolicies: [
      {
        actions: ["tool:run", 42],
        effect: "deny",
        enabled: true,
        id: "policy_1",
        name: "Block tool",
        reason: "security"
      },
      {
        actions: "invalid",
        effect: "allow",
        id: "broken",
        name: "Broken"
      }
    ],
    runtime: {
      provider: "python-orchestrator"
    },
    sourceAgentId: "catalog.agent"
  });

  assert.deepEqual(parsed, {
    managedPolicies: [
      {
        actions: ["tool:run"],
        effect: "deny",
        enabled: true,
        id: "policy_1",
        name: "Block tool",
        reason: "security"
      }
    ],
    runtimeProvider: "python-orchestrator",
    sourceAgentId: "catalog.agent"
  });
});

void test("resolveManagedPolicies returns parsed policies for the installed agent", async () => {
  const originalFindFirst = prisma.agent.findFirst.bind(prisma.agent);

  prisma.agent.findFirst = (async () =>
    ({
      config: {
        managedPolicies: [
          {
            actions: ["tool:audit"],
            effect: "allow",
            id: "policy_2",
            name: "Allow audit"
          }
        ]
      }
    })) as unknown as typeof prisma.agent.findFirst;

  try {
    const policies = await resolveManagedPolicies({
      installedAgentId: "agent_1",
      tenantId: "tenant_1"
    });

    assert.deepEqual(policies, [
      {
        actions: ["tool:audit"],
        effect: "allow",
        id: "policy_2",
        name: "Allow audit"
      }
    ]);
  } finally {
    prisma.agent.findFirst = originalFindFirst;
  }
});

