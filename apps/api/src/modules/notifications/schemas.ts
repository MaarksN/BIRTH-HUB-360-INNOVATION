import { z } from "zod";

export const notificationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export const notificationPreferencesSchema = z
  .object({
    cookieConsent: z.enum(["ACCEPTED", "PENDING", "REJECTED"]).optional(),
    emailNotifications: z.boolean().optional(),
    inAppNotifications: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    pushNotifications: z.boolean().optional()
  })
  .strict();

