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
  .strict();

export const syncSchema = z
  .object({
    accountKey: z.string().min(1).optional(),
    cursor: z.record(z.string(), z.unknown()).optional(),
    scope: z.string().min(1).optional()
  })
  .strict();

export type ConnectPayload = z.infer<typeof connectSchema>;
export type CallbackPayload = z.infer<typeof callbackSchema>;
export type SyncPayload = z.infer<typeof syncSchema>;
export type UpsertConnectorPayload = z.infer<typeof upsertConnectorSchema>;
