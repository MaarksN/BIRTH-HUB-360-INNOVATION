import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);
const ConfidenceSchema = z.enum(["high", "medium", "low"]);
const KpiStatusSchema = z.enum(["confirmed", "estimated", "missing"]);

export const BoardPrepFocusAreaSchema = z.enum([
  "culture",
  "finance",
  "governance",
  "growth",
  "ma",
  "operations",
  "product",
  "risk"
]);
export type BoardPrepFocusArea = z.infer<typeof BoardPrepFocusAreaSchema>;

export const BoardPrepKpiInputSchema = z
  .object({
    confirmed: z.boolean(),
    name: z.string().trim().min(1),
    source: z.string().trim().min(1).optional(),
    unit: z.string().trim().min(1).optional(),
    value: z.number().nullable()
  })
  .strict();
export type BoardPrepKpiInput = z.infer<typeof BoardPrepKpiInputSchema>;

export const BoardPrepRiskInputSchema = z
  .object({
    confirmed: z.boolean(),
    impact: z.string().trim().min(1),
    mitigation: z.string().trim().min(1).optional(),
    owner: z.string().trim().min(1).optional(),
    severity: PrioritySchema,
    title: z.string().trim().min(1)
  })
  .strict();
export type BoardPrepRiskInput = z.infer<typeof BoardPrepRiskInputSchema>;

export const BoardPrepDecisionInputSchema = z
  .object({
    confirmed: z.boolean(),
    decision: z.string().trim().min(1),
    dueDate: isoDateSchema,
    owner: z.string().trim().min(1).optional(),
    topic: z.string().trim().min(1)
  })
  .strict();
export type BoardPrepDecisionInput = z.infer<typeof BoardPrepDecisionInputSchema>;

export const BoardPrepAIInputSchema = z
  .object({
    constraints: z
      .object({
        currency: z.string().trim().length(3),
        language: z.enum(["pt-BR", "en-US"]),
        maxActions: z.number().int().min(1).max(12)
      })
      .strict(),
    dateRange: z
      .object({
        endDate: isoDateSchema,
        label: z.string().trim().min(1),
        startDate: isoDateSchema
      })
      .strict(),
    decisionsPending: z.array(BoardPrepDecisionInputSchema),
    focusAreas: z.array(BoardPrepFocusAreaSchema).min(1),
    kpis: z.array(BoardPrepKpiInputSchema).min(1),
    meetingContext: z.string().trim().min(1),
    requestId: z.string().trim().min(1),
    requiredMetrics: z.array(z.string().trim().min(1)).min(1),
    risks: z.array(BoardPrepRiskInputSchema),
    tenantId: z.string().trim().min(1)
  })
  .strict();
export type BoardPrepAIInput = z.infer<typeof BoardPrepAIInputSchema>;

export const BoardPrepFailureModeSchema = z.enum([
  "degraded_report",
  "human_handoff",
  "hard_fail"
]);
export type BoardPrepFailureMode = z.infer<typeof BoardPrepFailureModeSchema>;

export const BoardPrepEventNameSchema = z.enum([
  "boardprepai.request.received",
  "boardprepai.contract.loaded",
  "boardprepai.tool.call.started",
  "boardprepai.tool.call.succeeded",
  "boardprepai.tool.call.failed",
  "boardprepai.retry.scheduled",
  "boardprepai.fallback.applied",
  "boardprepai.response.generated"
]);
export type BoardPrepEventName = z.infer<typeof BoardPrepEventNameSchema>;

export const BoardPrepEventSchema = z
  .object({
    details: z
      .object({
        attempt: z.number().int().min(1).optional(),
        errorCode: z.string().min(1).optional(),
        fallbackMode: BoardPrepFailureModeSchema.optional(),
        maxAttempts: z.number().int().min(1).optional(),
        requestId: z.string().min(1).optional(),
        source: z.string().min(1).optional(),
        toolId: z.string().min(1).optional()
      })
      .strict(),
    level: z.enum(["error", "info", "warning"]),
    message: z.string().min(1),
    name: BoardPrepEventNameSchema,
    timestamp: z.string().datetime()
  })
  .strict();
export type BoardPrepEvent = z.infer<typeof BoardPrepEventSchema>;

export const BoardPrepMetricsSchema = z
  .object({
    durationMs: z.number().nonnegative(),
    retries: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    toolFailures: z.number().int().nonnegative()
  })
  .strict();
export type BoardPrepMetrics = z.infer<typeof BoardPrepMetricsSchema>;

export const BoardPrepAIContractSchema = z
  .object({
    failureMode: BoardPrepFailureModeSchema,
    observability: z
      .object({
        events: z.array(BoardPrepEventNameSchema).min(1),
        metrics: z
          .array(
            z.enum(["duration_ms", "retries", "tool_calls", "tool_failures"])
          )
          .min(1)
      })
      .strict(),
    retry: z
      .object({
        baseDelayMs: z.number().int().min(1).max(30_000),
        maxAttempts: z.number().int().min(1).max(3)
      })
      .strict(),
    toolIds: z.array(z.string().trim().min(1)).min(1)
  })
  .strict();
export type BoardPrepAIContract = z.infer<typeof BoardPrepAIContractSchema>;

export const DEFAULT_BOARDPREPAI_CONTRACT: BoardPrepAIContract = {
  failureMode: "degraded_report",
  observability: {
    events: [
      "boardprepai.request.received",
      "boardprepai.contract.loaded",
      "boardprepai.tool.call.started",
      "boardprepai.tool.call.succeeded",
      "boardprepai.tool.call.failed",
      "boardprepai.retry.scheduled",
      "boardprepai.fallback.applied",
      "boardprepai.response.generated"
    ],
    metrics: ["duration_ms", "tool_calls", "tool_failures", "retries"]
  },
  retry: {
    baseDelayMs: 500,
    maxAttempts: 3
  },
  toolIds: ["crm-board-feed", "erp-board-feed", "hr-board-feed"]
};

export const BoardPrepKpiSchema = z
  .object({
    confidence: ConfidenceSchema,
    interpretation: z.string().min(1),
    metric: z.string().min(1),
    status: KpiStatusSchema,
    valueLabel: z.string().min(1)
  })
  .strict();
export type BoardPrepKpi = z.infer<typeof BoardPrepKpiSchema>;

export const BoardPrepRiskSchema = z
  .object({
    mitigation: z.string().min(1),
    rationale: z.string().min(1),
    severity: PrioritySchema,
    title: z.string().min(1)
  })
  .strict();
export type BoardPrepRisk = z.infer<typeof BoardPrepRiskSchema>;

export const BoardPrepDecisionSchema = z
  .object({
    action: z.string().min(1),
    owner: z.string().min(1),
    priority: PrioritySchema,
    status: z.enum(["confirmed", "needs_confirmation"]),
    targetDate: isoDateSchema,
    topic: z.string().min(1)
  })
  .strict();
export type BoardPrepDecision = z.infer<typeof BoardPrepDecisionSchema>;

export const BoardPrepRecommendationSchema = z
  .object({
    owner: z.string().min(1),
    priority: PrioritySchema,
    recommendation: z.string().min(1),
    targetDate: isoDateSchema
  })
  .strict();
export type BoardPrepRecommendation = z.infer<typeof BoardPrepRecommendationSchema>;

export const BoardPrepTableSchema = z
  .object({
    columns: z.array(z.string().min(1)).min(1),
    rows: z.array(z.array(z.string())),
    title: z.string().min(1)
  })
  .strict();
export type BoardPrepTable = z.infer<typeof BoardPrepTableSchema>;

export const BoardPrepAIOutputSchema = z
  .object({
    agent: z.literal("BoardPrepAI"),
    boardBrief: z
      .object({
        data_tables: z.array(BoardPrepTableSchema),
        decisoes_requeridas: z.array(BoardPrepDecisionSchema),
        headline: z.string().min(1),
        kpis_chave: z.array(BoardPrepKpiSchema),
        lacunas_de_informacao: z.array(z.string().min(1)),
        presentation_outline: z.array(z.string().min(1)),
        readinessScorePct: z.number(),
        recomendacoes: z.array(BoardPrepRecommendationSchema),
        resumo_executivo: z.string().min(1),
        riscos: z.array(BoardPrepRiskSchema),
        summary_report: z.string().min(1)
      })
      .strict(),
    domain: z.literal("executivos"),
    fallback: z
      .object({
        applied: z.boolean(),
        mode: BoardPrepFailureModeSchema.nullable(),
        reasons: z.array(z.string().min(1))
      })
      .strict(),
    generatedAt: z.string().datetime(),
    observability: z
      .object({
        events: z.array(BoardPrepEventSchema),
        metrics: BoardPrepMetricsSchema
      })
      .strict(),
    status: z.enum(["error", "fallback", "success"]),
    summary: z.string().min(1)
  })
  .strict();
export type BoardPrepAIOutput = z.infer<typeof BoardPrepAIOutputSchema>;
