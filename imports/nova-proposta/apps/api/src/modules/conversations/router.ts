import { Router } from "express";

import { requireAuthenticatedSession } from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import {
  appendMessageSchema,
  conversationQuerySchema,
  createConversationSchema,
  updateStatusSchema
} from "./schemas.js";
import {
  appendConversationMessage,
  createConversation,
  getConversationById,
  listConversations,
  updateConversationStatus
} from "./service.js";

function requireIdentity(input: {
  organizationId: string | null;
  tenantId: string | null;
  userId: string | null;
}) {
  if (!input.organizationId || !input.tenantId || !input.userId) {
    throw new ProblemDetailsError({
      detail: "Authenticated tenant, organization and user context are required.",
      status: 401,
      title: "Unauthorized"
    });
  }

  return {
    organizationId: input.organizationId,
    tenantId: input.tenantId,
    userId: input.userId
  };
}

export function createConversationsRouter(): Router {
  const router = Router();

  router.get(
    "/conversations",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const identity = requireIdentity({
        organizationId: request.context.organizationId,
        tenantId: request.context.tenantId,
        userId: request.context.userId
      });
      const query = conversationQuerySchema.parse(request.query);
      const filters: {
        channel?: string;
        limit?: number;
        organizationId: string;
        query?: string;
        status?: string;
        tenantId: string;
      } = {
        limit: query.limit,
        organizationId: identity.organizationId,
        tenantId: identity.tenantId
      };

      if (query.channel) {
        filters.channel = query.channel;
      }

      if (query.q) {
        filters.query = query.q;
      }

      if (query.status) {
        filters.status = query.status;
      }

      const items = await listConversations(filters);

      response.status(200).json({
        items,
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/conversations/:id",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const identity = requireIdentity({
        organizationId: request.context.organizationId,
        tenantId: request.context.tenantId,
        userId: request.context.userId
      });

      const conversation = await getConversationById({
        conversationId: String(request.params.id ?? ""),
        organizationId: identity.organizationId,
        tenantId: identity.tenantId
      });

      if (!conversation) {
        throw new ProblemDetailsError({
          detail: "Conversation not found.",
          status: 404,
          title: "Not Found"
        });
      }

      response.status(200).json({
        conversation,
        requestId: request.context.requestId
      });
    })
  );

  router.post(
    "/conversations",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const identity = requireIdentity({
        organizationId: request.context.organizationId,
        tenantId: request.context.tenantId,
        userId: request.context.userId
      });
      const payload = createConversationSchema.parse(request.body);
      const nextConversation: {
        channel?: string;
        initialMessage?: string;
        metadata?: Record<string, unknown>;
        organizationId: string;
        subject: string;
        tenantId: string;
        userId: string;
      } = {
        organizationId: identity.organizationId,
        subject: payload.subject,
        tenantId: identity.tenantId,
        userId: identity.userId
      };

      if (payload.channel) {
        nextConversation.channel = payload.channel;
      }

      if (payload.initialMessage) {
        nextConversation.initialMessage = payload.initialMessage;
      }

      if (payload.metadata) {
        nextConversation.metadata = payload.metadata;
      }

      const conversation = await createConversation(nextConversation);

      response.status(201).json({
        conversation,
        requestId: request.context.requestId
      });
    })
  );

  router.post(
    "/conversations/:id/messages",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const identity = requireIdentity({
        organizationId: request.context.organizationId,
        tenantId: request.context.tenantId,
        userId: request.context.userId
      });
      const payload = appendMessageSchema.parse(request.body);
      const message = await appendConversationMessage({
        content: payload.content,
        conversationId: String(request.params.id ?? ""),
        organizationId: identity.organizationId,
        tenantId: identity.tenantId,
        userId: identity.userId
      });

      response.status(201).json({
        message: {
          content:
            typeof message.content === "string"
              ? message.content
              : JSON.stringify(message.content, null, 2),
          createdAt: message.createdAt.toISOString(),
          direction: message.direction,
          id: message.id,
          role: message.role
        },
        requestId: request.context.requestId
      });
    })
  );

  router.patch(
    "/conversations/:id/status",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const identity = requireIdentity({
        organizationId: request.context.organizationId,
        tenantId: request.context.tenantId,
        userId: request.context.userId
      });
      const payload = updateStatusSchema.parse(request.body);
      const conversation = await updateConversationStatus({
        conversationId: String(request.params.id ?? ""),
        organizationId: identity.organizationId,
        status: payload.status,
        tenantId: identity.tenantId
      });

      response.status(200).json({
        conversation: {
          id: conversation.id,
          status: conversation.status,
          updatedAt: conversation.updatedAt.toISOString()
        },
        requestId: request.context.requestId
      });
    })
  );

  return router;
}

