import { z } from "zod";

import { workflowCanvasSchema, workflowDslSchema } from "@birthub/workflows-core";

const workflowStateSchema = z.enum(["ARCHIVED", "DRAFT", "PUBLISHED"]);

export const workflowCreateSchema = z
  .object({
    canvas: workflowCanvasSchema.optional(),
    cronExpression: z.string().optional(),
    description: z.string().max(400).optional(),
    dsl: workflowDslSchema.optional(),
    eventTopic: z.string().min(1).optional(),
    maxDepth: z.number().int().min(1).max(50).default(50),
    name: z.string().min(1).max(120),
    status: workflowStateSchema.default("DRAFT"),
    triggerConfig: z.record(z.string(), z.unknown()).default({}),
    triggerType: z.enum(["CRON", "EVENT", "MANUAL", "WEBHOOK"]).default("MANUAL")
  })
  .strict()
  .superRefine((value, context) => {
    if (value.canvas && value.dsl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either canvas or dsl, but never both.",
        path: ["dsl"]
      });
    }

    if (!value.canvas && !value.dsl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either canvas or dsl is required.",
        path: ["canvas"]
      });
    }
  });

export const workflowUpdateSchema = z
  .object({
    canvas: workflowCanvasSchema.optional(),
    cronExpression: z.string().optional(),
    description: z.string().max(400).optional(),
    dsl: workflowDslSchema.optional(),
    eventTopic: z.string().min(1).optional(),
    maxDepth: z.number().int().min(1).max(50).optional(),
    name: z.string().min(1).max(120).optional(),
    status: workflowStateSchema.optional(),
    triggerConfig: z.record(z.string(), z.unknown()).optional(),
    triggerType: z.enum(["CRON", "EVENT", "MANUAL", "WEBHOOK"]).optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.canvas && value.dsl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either canvas or dsl, but never both.",
        path: ["dsl"]
      });
    }
  });
export const workflowRevertSchema = z
  .object({
    version: z.number().int().min(1)
  })
  .strict();

export const workflowRunSchema = z
  .object({
    async: z.boolean().default(true),
    payload: z.record(z.string(), z.unknown()).default({}),
    retry: z
      .object({
        fromExecutionId: z.string().min(1),
        fromStepKey: z.string().min(1).optional()
      })
      .strict()
      .optional()
  })
  .strict();

export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;
export type WorkflowRevertInput = z.infer<typeof workflowRevertSchema>;
export type WorkflowRunInput = z.infer<typeof workflowRunSchema>;
export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;
