import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import { enqueueSpecialistAgent } from "./runtime.handoff-queue.js";

void test("enqueueSpecialistAgent creates child execution and enqueues job", async () => {
  const createExecOriginal = prisma.agentExecution.create.bind(prisma.agentExecution);
  const createAuditOriginal = prisma.auditLog.create.bind(prisma.auditLog);

  let createPayload: unknown;
  let enqueuedPayload: unknown;

  prisma.agentExecution.create = (async (args: unknown) => {
    createPayload = args;
    return { id: "child_1" } as never;
  }) as typeof prisma.agentExecution.create;
  prisma.auditLog.create = (async () => ({ id: "audit_1" } as never)) as typeof prisma.auditLog.create;

  try {
    const result = await enqueueSpecialistAgent({
      agentQueue: {
        add: async (_name: string, data: unknown) => {
          enqueuedPayload = data;
          return {} as never;
        }
      } as never,
      context: { objective: "handoff" },
      executionId: "exec_parent",
      organizationId: "org_1",
      parentAgentId: "agent_parent",
      priority: "normal",
      targetAgentId: "agent_child",
      tenantId: "tenant_1",
      userId: "user_1"
    });

    assert.equal(result.queueName.includes("agent"), true);
    assert.equal(Boolean(createPayload), true);
    assert.equal(Boolean(enqueuedPayload), true);
  } finally {
    prisma.agentExecution.create = createExecOriginal;
    prisma.auditLog.create = createAuditOriginal;
  }
});
