import { z } from "zod";
import {
  isConnectorAuthType,
  isConnectorProviderSlug,
  type ConnectorAuthType,
  type ConnectorProviderSlug
} from "@birthub/integrations";

export const providerSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isConnectorProviderSlug, {
    message: "Unsupported connector provider."
  })
  .transform((value) => value as ConnectorProviderSlug);

const authTypeSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isConnectorAuthType, {
    message: "Unsupported connector auth type."
  })
  .transform((value) => value as ConnectorAuthType);

export const credentialSchema = z
  .object({
    expiresAt: z.string().datetime().optional(),
    value: z.string().min(1)
  })
  .strict();

export const upsertConnectorSchema = z
  .object({
    accountKey: z.string().min(1).optional(),
    authType: authTypeSchema.optional(),
    credentials: z.record(z.string(), credentialSchema).optional(),
    displayName: z.string().min(1).optional(),
    externalAccountId: z.string().min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    provider: providerSchema,
    scopes: z.array(z.string().min(1)).optional(),
    status: z.string().min(1).optional()
  })
  .strict();

export const connectSchema = z
  .object({
    accountKey: z.string().min(1).optional(),
    scopes: z.array(z.string().min(1)).optional()
  })
  .strict();

export const callbackSchema = z
  .object({
    accessToken: z.string().min(1).optional(),
    accountKey: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    expiresAt: z.string().datetime().optional(),
    externalAccountId: z.string().min(1).optional(),
    refreshToken: z.string().min(1).optional(),
    scopes: z.array(z.string().min(1)).optional(),
    state: z.string().min(1)
  })
  .strict()
  .refine((payload) => Boolean(payload.code || payload.accessToken), {
    message: "Connector callback requires either code or accessToken.",
    path: ["code"]
  });

export const syncSchema = z
  .object({
    accountKey: z.string().min(1).optional(),
    cursor: z.record(z.string(), z.unknown()).optional(),
    scope: z.string().min(1).optional()
  })
  .strict();

export const connectorHealthCheckSchema = z
  .object({
    accountKey: z.string().min(1).optional()
  })
  .strict();

const webhookContactSchema = z
  .object({
    companyName: z.string().min(1).optional(),
    customProperties: z.record(z.string(), z.unknown()).optional(),
    email: z.string().email(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    leadStatus: z.string().min(1).optional(),
    lifecycleStage: z.string().min(1).optional(),
    phone: z.string().min(1).optional()
  })
  .strict();

export const connectorWebhookIngestSchema = z
  .object({
    accountKey: z.string().min(1).optional(),
    connectorAccountId: z.string().min(1).optional(),
    contact: webhookContactSchema.optional(),
    eventType: z.string().min(1).default("lead.created"),
    externalEventId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(1).optional(),
    organizationId: z.string().min(1).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
    rawBody: z.string().min(1).optional(),
    tenantId: z.string().min(1).optional(),
    webhookSignature: z.string().min(1).optional()
  })
  .strict();

const zenviaStatusWebhookMessageSchema = z
  .object({
    channel: z.string().min(1).optional(),
    externalId: z.string().min(1).optional(),
    from: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    to: z.string().min(1).optional()
  })
  .passthrough();

const zenviaStatusWebhookMessageStatusSchema = z
  .object({
    code: z.string().min(1),
    description: z.string().min(1).optional()
  })
  .passthrough();

export const zenviaStatusWebhookSchema = z
  .object({
    createdAt: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    message: zenviaStatusWebhookMessageSchema,
    messageStatus: zenviaStatusWebhookMessageStatusSchema,
    timestamp: z.string().min(1).optional(),
    type: z.string().min(1)
  })
  .passthrough();

export type ConnectPayload = z.infer<typeof connectSchema>;
export type CallbackPayload = z.infer<typeof callbackSchema>;
export type ConnectorHealthCheckPayload = z.infer<typeof connectorHealthCheckSchema>;
export type ConnectorWebhookIngestPayload = z.infer<typeof connectorWebhookIngestSchema>;
export type SyncPayload = z.infer<typeof syncSchema>;
export type UpsertConnectorPayload = z.infer<typeof upsertConnectorSchema>;
export type ZenviaStatusWebhookPayload = z.infer<typeof zenviaStatusWebhookSchema>;
