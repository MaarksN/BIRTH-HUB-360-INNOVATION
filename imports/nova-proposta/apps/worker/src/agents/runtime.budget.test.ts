import assert from "node:assert/strict";
import test from "node:test";

import {
  MANIFEST_VERSION,
  type AgentManifest
} from "@birthub/agents-core";
import { prisma } from "@birthub/database";

import {
  buildToolCostTable,
  ensureBudgetHeadroom
} from "./runtime.budget.js";

function createManifest(): AgentManifest {
  return {
    agent: {
      changelog: [],
      description: "Budget manifest",
      id: "agent.budget",
      kind: "agent",
      name: "Budget Agent",
      prompt: "Protect the budget",
      tenantId: "catalog",
      version: "1.0.0"
    },
    keywords: [],
    manifestVersion: MANIFEST_VERSION,
    policies: [],
    skills: [],
    tags: {
      domain: [],
      industry: [],
      level: [],
      persona: [],
      "use-case": []
    },
    tools: [
      {
        description: "Remote API",
        id: "remote-api",
        inputSchema: {
          type: "object"
        },
        name: "Remote API",
        outputSchema: {
          type: "object"
        },
        timeoutMs: 45_000
      }
    ]
  };
}

void test("buildToolCostTable keeps base costs and weights custom tools by timeout", () => {
  const table = buildToolCostTable({
    defaultToolCostBrl: 0.2,
    manifest: createManifest()
  });

  assert.equal(table["db-read"], 0.08);
  assert.equal(table["send-email"], 0.06);
  assert.equal(table["remote-api"]! > 0.2, true);
});

void test("ensureBudgetHeadroom blocks executions that would exceed the configured budget", async () => {
  const originalUpsert = prisma.agentBudget.upsert.bind(prisma.agentBudget);
  const originalUpdate = prisma.agentBudget.update.bind(prisma.agentBudget);
  const originalCreate = prisma.agentBudgetEvent.create.bind(prisma.agentBudgetEvent);
  let budgetEventPayload: unknown = null;

  prisma.agentBudget.upsert = (async () =>
    ({
      consumedBrl: 98,
      id: "budget_1",
      limitBrl: 100
    })) as unknown as typeof prisma.agentBudget.upsert;
  prisma.agentBudget.update = (async () => ({} as never)) as unknown as typeof prisma.agentBudget.update;
  prisma.agentBudgetEvent.create = (async (args: unknown) => {
    budgetEventPayload = args;
    return {} as never;
  }) as unknown as typeof prisma.agentBudgetEvent.create;

  try {
    await assert.rejects(
      () =>
        ensureBudgetHeadroom({
          actorId: "user_1",
          agentId: "agent_1",
          estimatedCostBrl: 3,
          executionId: "exec_1",
          organizationId: "org_1",
          tenantId: "tenant_1"
        }),
      (error: Error & { code?: string }) => error.code === "AGENT_BUDGET_EXCEEDED"
    );

    const payload = budgetEventPayload as {
      data: {
        kind: string;
        metadata: {
          consumedBrl: number;
          executionId: string;
          limitBrl: number;
        };
      };
    };

    assert.equal(payload.data.kind, "BLOCK_100");
    assert.equal(payload.data.metadata.executionId, "exec_1");
    assert.equal(payload.data.metadata.consumedBrl, 101);
    assert.equal(payload.data.metadata.limitBrl, 100);
  } finally {
    prisma.agentBudget.upsert = originalUpsert;
    prisma.agentBudget.update = originalUpdate;
    prisma.agentBudgetEvent.create = originalCreate;
  }
});

