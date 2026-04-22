import { z } from "zod";

export const conversationQuerySchema = z.object({
  channel: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  q: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional()
});

export const createConversationSchema = z.object({
  channel: z.string().trim().min(1).optional(),
  initialMessage: z.string().trim().min(1).max(5_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  subject: z.string().trim().min(1).max(160)
});

export const appendMessageSchema = z.object({
  content: z.string().trim().min(1).max(5_000)
});

export const updateStatusSchema = z.object({
  status: z.string().trim().min(1).max(40)
});

