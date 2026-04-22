import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import { persistAgentHandoff } from "./handoffs.js";

void test("persistAgentHandoff creates thread, handoff and internal conversation message", async () => {
  const originalFindOrganization = prisma.organization.findFirst.bind(prisma.organization);
  const originalFindThread = prisma.conversationThread.findFirst.bind(prisma.conversationThread);
  const originalCreateThread = prisma.conversationThread.create.bind(prisma.conversationThread);
  const originalCreateHandoff = prisma.agentHandoff.create.bind(prisma.agentHandoff);
  const originalCreateMessage = prisma.conversationMessage.create.bind(prisma.conversationMessage);

  let handoffPayload: unknown = null;
  let messagePayload: unknown = null;

  prisma.organization.findFirst = (async () =>
    ({
      id: "org_1"
    })) as unknown as typeof prisma.organization.findFirst;
  prisma.conversationThread.findFirst = (async () => null) as unknown as typeof prisma.conversationThread.findFirst;
  prisma.conversationThread.create = (async () =>
    ({
      id: "thread_1"
    })) as unknown as typeof prisma.conversationThread.create;
  prisma.agentHandoff.create = (async (args: unknown) => {
    handoffPayload = args;
    return {
      correlationId: "corr_1",
      id: "handoff_1",
      status: "queued"
    } as never;
  }) as unknown as typeof prisma.agentHandoff.create;
  prisma.conversationMessage.create = (async (args: unknown) => {
    messagePayload = args;
    return {
      id: "message_1"
    } as never;
  }) as unknown as typeof prisma.conversationMessage.create;

  try {
    const result = await persistAgentHandoff({
      context: {
        patientId: "pat_1"
      },
      contextSummary: "handoff context",
      correlationId: "corr_1",
      executionId: "exec_1",
      sourceAgentId: "agent_source",
      summary: "Escalar para revisão humana",
      targetAgentId: "agent_target",
      tenantId: "tenant_1",
      workflowId: "workflow_1"
    });

    assert.deepEqual(result, {
      correlationId: "corr_1",
      handoffId: "handoff_1",
      status: "queued",
      threadId: "thread_1"
    });
    assert.deepEqual(handoffPayload, {
      data: {
        context: {
          contextSummary: "handoff context",
          patientId: "pat_1",
          workflowId: "workflow_1"
        },
        correlationId: "corr_1",
        organizationId: "org_1",
        sourceAgentId: "agent_source",
        sourceExecutionId: "exec_1",
        status: "queued",
        summary: "Escalar para revisão humana",
        targetAgentId: "agent_target",
        tenantId: "tenant_1",
        threadId: "thread_1"
      }
    });

    const messageData = (messagePayload as { data: { metadata: { handoffId: string }; threadId: string } }).data;
    assert.equal(messageData.threadId, "thread_1");
    assert.equal(messageData.metadata.handoffId, "handoff_1");
  } finally {
    prisma.organization.findFirst = originalFindOrganization;
    prisma.conversationThread.findFirst = originalFindThread;
    prisma.conversationThread.create = originalCreateThread;
    prisma.agentHandoff.create = originalCreateHandoff;
    prisma.conversationMessage.create = originalCreateMessage;
  }
});

