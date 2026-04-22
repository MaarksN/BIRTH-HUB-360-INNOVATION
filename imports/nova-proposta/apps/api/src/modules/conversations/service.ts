import { Prisma, prisma } from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";

const DEFAULT_CONVERSATION_LIMIT = 24;

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toContentPreview(value: unknown): string {
  if (typeof value === "string") {
    return value.trim().slice(0, 280);
  }

  return JSON.stringify(value ?? null).slice(0, 280);
}

function normalizeSearch(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

export async function listConversations(input: {
  channel?: string;
  limit?: number;
  organizationId: string;
  query?: string;
  status?: string;
  tenantId: string;
}) {
  const query = normalizeSearch(input.query);
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_CONVERSATION_LIMIT, 1), 50);
  const items = await prisma.conversationThread.findMany({
    where: {
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      ...(input.channel ? { channel: input.channel } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(query
        ? {
            OR: [
              {
                subject: {
                  contains: query,
                  mode: "insensitive"
                }
              },
              {
                customerReference: {
                  contains: query,
                  mode: "insensitive"
                }
              },
              {
                leadReference: {
                  contains: query,
                  mode: "insensitive"
                }
              },
              {
                messages: {
                  some: {
                    contentPreview: {
                      contains: query,
                      mode: "insensitive"
                    }
                  }
                }
              }
            ]
          }
        : {})
    },
    include: {
      _count: {
        select: {
          messages: true
        }
      },
      messages: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit
  });

  return items.map((item) => ({
    channel: item.channel,
    createdAt: item.createdAt.toISOString(),
    customerReference: item.customerReference,
    id: item.id,
    lastMessageAt: item.messages[0]?.createdAt.toISOString() ?? null,
    lastMessagePreview: item.messages[0]?.contentPreview ?? null,
    leadReference: item.leadReference,
    messageCount: item._count.messages,
    status: item.status,
    subject: item.subject,
    updatedAt: item.updatedAt.toISOString()
  }));
}

export async function getConversationById(input: {
  conversationId: string;
  organizationId: string;
  tenantId: string;
}) {
  const conversation = await prisma.conversationThread.findFirst({
    where: {
      id: input.conversationId,
      organizationId: input.organizationId,
      tenantId: input.tenantId
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc"
        },
        take: 200
      }
    }
  });

  if (!conversation) {
    return null;
  }

  return {
    channel: conversation.channel,
    createdAt: conversation.createdAt.toISOString(),
    customerReference: conversation.customerReference,
    id: conversation.id,
    leadReference: conversation.leadReference,
    messages: conversation.messages.map((message) => ({
      agentId: message.agentId,
      content:
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content, null, 2),
      contentPreview: message.contentPreview,
      createdAt: message.createdAt.toISOString(),
      direction: message.direction,
      id: message.id,
      metadata: message.metadata,
      role: message.role
    })),
    metadata: conversation.metadata,
    status: conversation.status,
    subject: conversation.subject,
    updatedAt: conversation.updatedAt.toISOString()
  };
}

export async function createConversation(input: {
  channel?: string;
  initialMessage?: string;
  metadata?: Record<string, unknown>;
  organizationId: string;
  subject: string;
  tenantId: string;
  userId: string;
}) {
  const created = await prisma.$transaction(async (tx) => {
    const threadData: {
      channel: string;
      metadata?: Prisma.InputJsonValue;
      organizationId: string;
      status: string;
      subject: string;
      tenantId: string;
    } = {
      channel: input.channel ?? "internal",
      organizationId: input.organizationId,
      status: "open",
      subject: input.subject,
      tenantId: input.tenantId
    };

    if (input.metadata) {
      threadData.metadata = toJsonValue(input.metadata);
    }

    const thread = await tx.conversationThread.create({
      data: threadData
    });

    if (input.initialMessage && input.initialMessage.trim().length > 0) {
      await tx.conversationMessage.create({
        data: {
          content: input.initialMessage,
          contentPreview: toContentPreview(input.initialMessage),
          direction: "internal",
          metadata: toJsonValue({
            createdByUserId: input.userId,
            origin: "dashboard"
          }),
          organizationId: input.organizationId,
          role: "operator",
          tenantId: input.tenantId,
          threadId: thread.id
        }
      });
    }

    return thread;
  });

  const conversation = await getConversationById({
    conversationId: created.id,
    organizationId: input.organizationId,
    tenantId: input.tenantId
  });

  if (!conversation) {
    throw new ProblemDetailsError({
      detail: "Conversation was created but could not be reloaded.",
      status: 500,
      title: "Conversation reload failed"
    });
  }

  return conversation;
}

async function assertConversationScope(input: {
  conversationId: string;
  organizationId: string;
  tenantId: string;
}) {
  const conversation = await prisma.conversationThread.findFirst({
    where: {
      id: input.conversationId,
      organizationId: input.organizationId,
      tenantId: input.tenantId
    }
  });

  if (!conversation) {
    throw new ProblemDetailsError({
      detail: "Conversation not found for the active tenant.",
      status: 404,
      title: "Not Found"
    });
  }

  return conversation;
}

export async function appendConversationMessage(input: {
  content: string;
  conversationId: string;
  organizationId: string;
  tenantId: string;
  userId: string;
}) {
  await assertConversationScope(input);

  return prisma.conversationMessage.create({
    data: {
      content: input.content,
      contentPreview: toContentPreview(input.content),
      direction: "internal",
      metadata: toJsonValue({
        createdByUserId: input.userId,
        origin: "dashboard"
      }),
      organizationId: input.organizationId,
      role: "operator",
      tenantId: input.tenantId,
      threadId: input.conversationId
    }
  });
}

export async function updateConversationStatus(input: {
  conversationId: string;
  organizationId: string;
  status: string;
  tenantId: string;
}) {
  await assertConversationScope(input);

  return prisma.conversationThread.update({
    data: {
      status: input.status
    },
    where: {
      id: input.conversationId
    }
  });
}
