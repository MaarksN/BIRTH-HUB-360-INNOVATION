import { z } from "zod";

/**
 * Centralized validation schemas for BirthHub API
 * Zod schemas with automatic OpenAPI integration
 */

// ============ COMMON SCHEMAS ============
export const IdSchema = z.string().uuid().describe("UUID identifier");
export const EmailSchema = z.string().email().describe("Email address");
export const DateSchema = z.date().describe("ISO 8601 date");
export const PaginationSchema = z.object({
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});

// ============ USER SCHEMAS ============
export const UserRoleSchema = z.enum(["admin", "member", "viewer"]).describe("User role");

export const UserCreateSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1).max(255),
  role: UserRoleSchema.default("member")
});

export const UserUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: UserRoleSchema.optional()
});

export const UserResponseSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  name: z.string(),
  role: UserRoleSchema,
  organizationId: IdSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema
});

export const UserListResponseSchema = z.object({
  data: z.array(UserResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number()
  })
});

// ============ WORKFLOW SCHEMAS ============
export const WorkflowStatusSchema = z
  .enum(["draft", "published", "archived"])
  .describe("Workflow status");

export const WorkflowStepSchema = z.object({
  id: IdSchema,
  type: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
  nextStepId: IdSchema.optional()
});

export const WorkflowDefinitionSchema = z.object({
  version: z.string(),
  steps: z.array(WorkflowStepSchema),
  triggers: z.array(z.string()).optional()
});

export const WorkflowCreateSchema = z.object({
  name: z.string().min(1).max(255),
  definition: WorkflowDefinitionSchema
});

export const WorkflowUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  definition: WorkflowDefinitionSchema.optional(),
  status: WorkflowStatusSchema.optional()
});

export const WorkflowResponseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  organizationId: IdSchema,
  definition: WorkflowDefinitionSchema,
  status: WorkflowStatusSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// ============ AGENT SCHEMAS ============
export const AgentCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  config: z.record(z.string(), z.unknown())
});

export const AgentUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional()
});

export const AgentResponseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  version: z.string(),
  organizationId: IdSchema,
  config: z.record(z.string(), z.unknown()),
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// ============ PAYMENT SCHEMAS ============
export const PaymentStatusSchema = z
  .enum(["pending", "completed", "failed", "refunded"])
  .describe("Payment status");

export const PaymentCreateSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  customerId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const PaymentResponseSchema = z.object({
  id: IdSchema,
  externalId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: PaymentStatusSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const RefundSchema = z.object({
  id: IdSchema,
  paymentId: IdSchema,
  amount: z.number().positive(),
  status: PaymentStatusSchema,
  createdAt: DateSchema
});

// ============ ERROR SCHEMAS ============
export const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        value: z.unknown().optional()
      })
    )
    .optional()
});

// ============ VALIDATION UTILITIES ============
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: z.ZodError["issues"] };

/**
 * Validate data against schema and return result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

/**
 * Express middleware for request body validation
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validate(schema, req.body);
    if (!result.success) {
      return res.status(400).json({
        type: "https://api.birthub.local/validation-error",
        title: "Validation Error",
        status: 400,
        errors: result.errors.map((e: z.ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
          value: e.code
        }))
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Extract schema types
 */
export type User = z.infer<typeof UserResponseSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type Workflow = z.infer<typeof WorkflowResponseSchema>;
export type WorkflowCreate = z.infer<typeof WorkflowCreateSchema>;
export type Agent = z.infer<typeof AgentResponseSchema>;
export type Payment = z.infer<typeof PaymentResponseSchema>;
