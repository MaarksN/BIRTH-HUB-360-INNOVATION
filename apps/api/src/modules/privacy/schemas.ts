import {
  privacyDeleteRequestSchema,
  privacyDeleteResponseSchema
} from "@birthub/config";
import { z } from "zod";

export {
  privacyDeleteRequestSchema,
  privacyDeleteResponseSchema
};

const consentPurposeSchema = z.enum([
  "ANALYTICS",
  "MARKETING",
  "HEALTH_DATA_SHARING"
]);

const consentSourceSchema = z.enum([
  "SETTINGS"
]);

const consentStatusSchema = z.enum([
  "GRANTED",
  "PENDING",
  "REVOKED"
]);

const retentionActionSchema = z.enum([
  "ANONYMIZE",
  "DELETE"
]);

const retentionDataCategorySchema = z.enum([
  "OUTPUT_ARTIFACTS",
  "LOGIN_ALERTS",
  "MFA_CHALLENGES",
  "MFA_RECOVERY_CODES",
  "SUSPENDED_USERS"
]);

const retentionExecutionModeSchema = z.enum([
  "DRY_RUN",
  "EXECUTE"
]);

export const consentUpdateSchema = z
  .object({
    decisions: z
      .array(
        z
          .object({
            purpose: consentPurposeSchema,
            source: consentSourceSchema,
            status: consentStatusSchema
          })
          .strict()
      )
      .min(1)
  })
  .strict();

export const retentionUpdateSchema = z
  .object({
    policies: z
      .array(
        z
          .object({
            action: retentionActionSchema.optional(),
            dataCategory: retentionDataCategorySchema,
            enabled: z.boolean().optional(),
            retentionDays: z.number().int().min(0).max(3650).optional()
          })
          .strict()
      )
      .min(1)
  })
  .strict();

export const retentionRunSchema = z
  .object({
    mode: retentionExecutionModeSchema.default("DRY_RUN")
  })
  .strict();
