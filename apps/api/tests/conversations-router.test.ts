// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import { prisma, Role } from "@birthub/database";
import request from "supertest";

import { createConversationsRouter } from "../src/modules/conversations/router.js";
import {
  createAuthenticatedApiTestApp,
  stubMethod
} from "./http-test-helpers.js";

type ConversationsListBody = {
  items: Array<{
    id?: string;
    lastMessagePreview?: string;
    messageCount?: number;
  }>;
  requestId: string;
};

type ConversationMutationBody = {
  conversation: {
    id?: string;
    messages?: Array<{
      id?: string;
    }>;
  };
  requestId: string;
};

type ProblemBody = {
  detail?: string;
  status?: number;
  title?: string;
};

function assertConversationsListBody(body: unknown): asserts body is ConversationsListBody {
  assert.equal(typeof body, "object");
  assert.notEqual(body, null);

  const candidate = body as { items?: unknown; requestId?: unknown };
  assert.ok(Array.isArray(candidate.items));
  assert.equal(typeof candidate.requestId, "string");
}

function assertConversationMutationBody(body: unknown): asserts body is ConversationMutationBody {
  assert.equal(typeof body, "object");
  assert.notEqual(body, null);

  const candidate = body as { conversation?: unknown; requestId?: unknown };
  assert.equal(typeof candidate.conversation, "object");
  assert.notEqual(candidate.conversation, null);
  assert.equal(typeof candidate.requestId, "string");
}

function assertProblemBody(body: unknown): asserts body is ProblemBody {
  assert.equal(typeof body, "object");
  assert.notEqual(body, null);
}

function createConversationsTestApp() {
  return createAuthenticatedApiTestApp({
    contextOverrides: {
      organizationId: "org_product",
      requestId: "req_conversations",
      role: Role.MEMBER,
      sessionId: "session_product",
      tenantId: "tenant_product",
      tenantSlug: "tenant-product",
      traceId: "trace_conversations",
      userId: "user_product"
    },
    mountPath: "/api/v1",
    router: createConversationsRouter()
  });
}

void test("conversations router lists scoped threads with filters and previews", async () => {
  let receivedWhere: unknown = null;

  const restore = stubMethod(prisma.conversationThread, "findMany", (args: { where?: unknown }) => {
    receivedWhere = args.where ?? null;
    return Promise.resolve([
      {
        _count: {
          messages: 3
        },
        channel: "whatsapp",
        createdAt: new Date("2026-04-07T12:00:00.000Z"),
        customerReference: "cust_1",
        id: "thread_1",
        leadReference: "lead_1",
        messages: [
          {
            contentPreview: "Paciente aguardando orientacao",
            createdAt: new Date("2026-04-07T13:00:00.000Z")
          }
        ],
        status: "open",
        subject: "Duvida sobre retorno",
        updatedAt: new Date("2026-04-07T13:30:00.000Z")
      }
    ]);
  });

  try {
    const response = await request(createConversationsTestApp())
      .get("/api/v1/conversations")
      .query({
        channel: "whatsapp",
        q: "retorno",
        status: "open"
      })
      .expect(200);

    assert.deepEqual(receivedWhere, {
      OR: [
        {
          subject: {
            contains: "retorno",
            mode: "insensitive"
          }
        },
        {
          customerReference: {
            contains: "retorno",
            mode: "insensitive"
          }
        },
        {
          leadReference: {
            contains: "retorno",
            mode: "insensitive"
          }
        },
        {
          messages: {
            some: {
              contentPreview: {
                contains: "retorno",
                mode: "insensitive"
              }
            }
          }
        }
      ],
      channel: "whatsapp",
      organizationId: "org_product",
      status: "open",
      tenantId: "tenant_product"
    });
    const body: unknown = response.body;
    assertConversationsListBody(body);
    assert.equal(body.requestId, "req_conversations");
    assert.equal(body.items[0]?.id, "thread_1");
    assert.equal(body.items[0]?.messageCount, 3);
    assert.equal(body.items[0]?.lastMessagePreview, "Paciente aguardando orientacao");
  } finally {
    restore();
  }
});

void test("conversations router creates a thread and reloads the scoped detail", async () => {
  let createdThreadPayload: unknown = null;
  let createdMessagePayload: unknown = null;

  const tx = {
    conversationMessage: {
      create: (args: { data?: unknown }) => {
        createdMessagePayload = args.data ?? null;
        return Promise.resolve({ id: "message_1" });
      }
    },
    conversationThread: {
      create: (args: { data?: unknown }) => {
        createdThreadPayload = args.data ?? null;
        return Promise.resolve({ id: "thread_2" });
      }
    }
  };

  const restores = [
    stubMethod(prisma, "$transaction", (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    stubMethod(prisma.conversationThread, "findFirst", () =>
      Promise.resolve({
        channel: "internal",
        createdAt: new Date("2026-04-07T14:00:00.000Z"),
        customerReference: null,
        id: "thread_2",
        leadReference: null,
        messages: [
          {
            agentId: null,
            content: "Primeira nota",
            contentPreview: "Primeira nota",
            createdAt: new Date("2026-04-07T14:00:00.000Z"),
            direction: "internal",
            id: "message_1",
            metadata: {
              origin: "dashboard"
            },
            role: "operator"
          }
        ],
        metadata: {
          origin: "dashboard"
        },
        status: "open",
        subject: "Acompanhamento inicial",
        updatedAt: new Date("2026-04-07T14:00:00.000Z")
      })
    )
  ];

  try {
    const response = await request(createConversationsTestApp())
      .post("/api/v1/conversations")
      .send({
        initialMessage: "Primeira nota",
        metadata: {
          origin: "dashboard"
        },
        subject: "Acompanhamento inicial"
      })
      .expect(201);

    assert.deepEqual(createdThreadPayload, {
      channel: "internal",
      metadata: {
        origin: "dashboard"
      },
      organizationId: "org_product",
      status: "open",
      subject: "Acompanhamento inicial",
      tenantId: "tenant_product"
    });
    assert.deepEqual(createdMessagePayload, {
      content: "Primeira nota",
      contentPreview: "Primeira nota",
      direction: "internal",
      metadata: {
        createdByUserId: "user_product",
        origin: "dashboard"
      },
      organizationId: "org_product",
      role: "operator",
      tenantId: "tenant_product",
      threadId: "thread_2"
    });
    const body: unknown = response.body;
    assertConversationMutationBody(body);
    assert.equal(body.requestId, "req_conversations");
    assert.equal(body.conversation.id, "thread_2");
    assert.equal(body.conversation.messages?.[0]?.id, "message_1");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("conversations router validates subject before creating a thread", async () => {
  const response = await request(createConversationsTestApp())
    .post("/api/v1/conversations")
    .send({
      initialMessage: "Sem assunto"
    })
    .expect(400);

  const body: unknown = response.body;
  assertProblemBody(body);
  assert.match(String(body.detail ?? ""), /invalid/i);
});

void test("conversations router rejects top-level mass assignment fields", async () => {
  let createdThread = false;
  const restore = stubMethod(prisma, "$transaction", () => {
    createdThread = true;
    return Promise.resolve({ id: "thread_unused" });
  });

  try {
    const response = await request(createConversationsTestApp())
      .post("/api/v1/conversations")
      .send({
        organizationId: "org_attacker",
        subject: "Tentativa indevida",
        tenantId: "tenant_attacker",
        userId: "user_attacker"
      })
      .expect(400);

    const body: unknown = response.body;
    assertProblemBody(body);
    assert.match(String(body.detail ?? ""), /invalid/i);
    assert.equal(createdThread, false);
  } finally {
    restore();
  }
});

void test("conversations router returns not found when the requested thread does not exist", async () => {
  const restore = stubMethod(prisma.conversationThread, "findFirst", () => Promise.resolve(null));

  try {
    const response = await request(createConversationsTestApp())
      .get("/api/v1/conversations/thread_missing")
      .expect(404);

    const body: unknown = response.body;
    assertProblemBody(body);
    assert.equal(body.status, 404);
    assert.equal(body.title, "Not Found");
  } finally {
    restore();
  }
});

void test("conversations router updates status inside the authenticated tenant scope", async () => {
  let receivedUpdateArgs: unknown = null;
  let receivedReloadArgs: unknown = null;
  const restores = [
    stubMethod(prisma.conversationThread, "updateMany", (args: unknown) => {
      receivedUpdateArgs = args;
      return Promise.resolve({
        count: 1
      });
    }),
    stubMethod(prisma.conversationThread, "findFirst", (args: unknown) => {
      receivedReloadArgs = args;
      return Promise.resolve({
        id: "thread_1",
        status: "closed",
        updatedAt: new Date("2026-04-08T10:30:00.000Z")
      });
    })
  ];

  try {
    const response = await request(createConversationsTestApp())
      .patch("/api/v1/conversations/thread_1/status")
      .send({
        status: "closed"
      })
      .expect(200);

    assert.deepEqual(receivedUpdateArgs, {
      data: {
        status: "closed"
      },
      where: {
        id: "thread_1",
        organizationId: "org_product",
        tenantId: "tenant_product"
      }
    });
    assert.deepEqual(receivedReloadArgs, {
      where: {
        id: "thread_1",
        organizationId: "org_product",
        tenantId: "tenant_product"
      }
    });
    assert.deepEqual(response.body, {
      conversation: {
        id: "thread_1",
        status: "closed",
        updatedAt: "2026-04-08T10:30:00.000Z"
      },
      requestId: "req_conversations"
    });
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

