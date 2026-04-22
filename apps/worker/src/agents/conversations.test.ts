import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import {
  createConversationMessage,
  ensureConversationThread
} from "./conversations.js";

void test("ensureConversationThread creates a thread when no existing record matches", async () => {
  const originalFindFirst = prisma.conversationThread.findFirst.bind(prisma.conversationThread);
  const originalCreate = prisma.conversationThread.create.bind(prisma.conversationThread);
  const findFirstCalls: unknown[] = [];
  let received: unknown = null;

  prisma.conversationThread.findFirst = (async (args: unknown) => {
    findFirstCalls.push(args);
    return null;
  }) as unknown as typeof prisma.conversationThread.findFirst;
  prisma.conversationThread.create = (async (args: unknown) => {
    received = args;
    return {
      id: "thread_1",
      organizationId: "org_1"
    } as never;
  }) as unknown as typeof prisma.conversationThread.create;

  try {
    const thread = await ensureConversationThread({
      channel: "whatsapp",
      correlationId: "corr_1",
      externalThreadId: "ext_1",
      metadata: {
        source: "worker"
      },
      organizationId: "org_1",
      subject: "Support case",
      tenantId: "tenant_1"
    });

    assert.equal(thread.id, "thread_1");
    assert.deepEqual(
      findFirstCalls.map((call) => (call as { where?: { tenantId?: string } }).where?.tenantId),
      ["tenant_1"]
    );
    assert.deepEqual(received, {
      data: {
        channel: "whatsapp",
        correlationId: "corr_1",
        externalThreadId: "ext_1",
        metadata: {
          source: "worker"
        },
        organizationId: "org_1",
        status: "open",
        subject: "Support case",
        tenantId: "tenant_1"
      }
    });
  } finally {
    prisma.conversationThread.findFirst = originalFindFirst;
    prisma.conversationThread.create = originalCreate;
  }
});

void test("createConversationMessage stores a bounded preview for structured content", async () => {
  const originalCreate = prisma.conversationMessage.create.bind(prisma.conversationMessage);
  let received: unknown = null;
  const content = {
    text: "x".repeat(600)
  };

  prisma.conversationMessage.create = (async (args: unknown) => {
    received = args;
    return {
      id: "message_1"
    } as never;
  }) as unknown as typeof prisma.conversationMessage.create;

  try {
    await createConversationMessage({
      content,
      direction: "outbound",
      organizationId: "org_1",
      role: "assistant",
      tenantId: "tenant_1",
      threadId: "thread_1"
    });

    const payload = received as {
      data: {
        contentPreview: string;
        direction: string;
        role: string;
      };
    };

    assert.equal(payload.data.direction, "outbound");
    assert.equal(payload.data.role, "assistant");
    assert.equal(payload.data.contentPreview.length, 500);
    assert.equal(payload.data.contentPreview, JSON.stringify(content).slice(0, 500));
  } finally {
    prisma.conversationMessage.create = originalCreate;
  }
});
