import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import {
  appendConversationMessage,
  querySharedLearning,
  runtimeMemory
} from "./runtime.memory.js";

void test("querySharedLearning merges runtime memory and audit log evidence by keyword", async () => {
  const originalQuerySharedLearning = runtimeMemory.querySharedLearning.bind(runtimeMemory);
  const originalFindMany = prisma.auditLog.findMany.bind(prisma.auditLog);

  runtimeMemory.querySharedLearning = (async () =>
    [
      {
        approved: true,
        appliesTo: ["agent.demo"],
        confidence: 0.9,
        createdAt: "2026-04-06T00:00:00.000Z",
        evidence: ["memory"],
        id: "memory_1",
        keywords: ["handoff"],
        lessonType: "execution-pattern",
        sourceAgentId: "agent.demo",
        summary: "Runtime memory",
        tenantId: "tenant_1"
      }
    ]) as unknown as typeof runtimeMemory.querySharedLearning;
  prisma.auditLog.findMany = (async () =>
    [
      {
        diff: {
          approved: true,
          appliesTo: ["agent.demo"],
          confidence: 0.88,
          createdAt: "2026-04-06T01:00:00.000Z",
          evidence: ["audit"],
          id: "audit_1",
          keywords: ["handoff"],
          lessonType: "execution-pattern",
          sourceAgentId: "agent.demo",
          summary: "Audit learning",
          tenantId: "tenant_1"
        }
      }
    ]) as unknown as typeof prisma.auditLog.findMany;

  try {
    const records = await querySharedLearning({
      keywords: ["handoff"],
      tenantId: "tenant_1"
    });

    assert.equal(records.length, 2);
    assert.equal(records[0]?.id, "audit_1");
    assert.equal(records[1]?.id, "memory_1");
  } finally {
    runtimeMemory.querySharedLearning = originalQuerySharedLearning;
    prisma.auditLog.findMany = originalFindMany;
  }
});

void test("appendConversationMessage exits early when the session id is missing", async () => {
  const originalAppend = runtimeMemory.appendConversationMessage.bind(runtimeMemory);
  let called = false;

  runtimeMemory.appendConversationMessage = (async () => {
    called = true;
    return undefined as never;
  }) as unknown as typeof runtimeMemory.appendConversationMessage;

  try {
    await appendConversationMessage({
      agentId: "agent_1",
      content: "hello",
      role: "assistant",
      tenantId: "tenant_1"
    });

    assert.equal(called, false);
  } finally {
    runtimeMemory.appendConversationMessage = originalAppend;
  }
});

