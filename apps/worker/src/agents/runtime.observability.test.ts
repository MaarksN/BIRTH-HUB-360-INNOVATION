import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import { emitAgentRuntimeEvent } from "./runtime.observability.js";

void test("emitAgentRuntimeEvent persists structured event", async () => {
  const original = prisma.auditLog.create.bind(prisma.auditLog);
  let payload: unknown;
  prisma.auditLog.create = (async (args: unknown) => {
    payload = args;
    return { id: "audit_1" } as never;
  }) as typeof prisma.auditLog.create;

  try {
    await emitAgentRuntimeEvent({
      agentId: "agent_1",
      costBrl: 1.2,
      durationMs: 99,
      event: "agent.execution.completed",
      executionId: "exec_1",
      organizationId: "org_1",
      requestId: "req_1",
      status: "COMPLETED",
      tenantId: "tenant_1"
    });

    assert.equal(Boolean(payload), true);
    const data = (payload as { data: { action: string } }).data;
    assert.equal(data.action, "AGENT_RUNTIME_AGENT_EXECUTION_COMPLETED");
  } finally {
    prisma.auditLog.create = original;
  }
});
