import { createHash } from "node:crypto";

import { z } from "zod";

import { BoardPrepFocusAreaSchema } from "./schemas.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const BOARDPREPAI_TOOL_IDS = [
  "crm-board-feed",
  "erp-board-feed",
  "hr-board-feed"
] as const;
export type BoardPrepToolId = (typeof BOARDPREPAI_TOOL_IDS)[number];

export const BoardPrepToolInputSchema = z
  .object({
    endDate: isoDateSchema,
    focusAreas: z.array(BoardPrepFocusAreaSchema).min(1),
    requiredMetrics: z.array(z.string().trim().min(1)).min(1),
    startDate: isoDateSchema,
    tenantId: z.string().trim().min(1)
  })
  .strict();
export type BoardPrepToolInput = z.infer<typeof BoardPrepToolInputSchema>;

export const CRMBoardSnapshotSchema = z
  .object({
    customerRiskTheme: z.string().min(1),
    decisionPressurePct: z.number().min(0).max(100),
    pipelineHealthPct: z.number().min(0).max(100)
  })
  .strict();
export type CRMBoardSnapshot = z.infer<typeof CRMBoardSnapshotSchema>;

export const ERPBoardSnapshotSchema = z
  .object({
    cashVariancePct: z.number().min(-100).max(100),
    financeCompletenessPct: z.number().min(0).max(100),
    toplineMomentumPct: z.number().min(-100).max(100)
  })
  .strict();
export type ERPBoardSnapshot = z.infer<typeof ERPBoardSnapshotSchema>;

export const HRBoardSnapshotSchema = z
  .object({
    cultureRiskTheme: z.string().min(1),
    execAlignmentPct: z.number().min(0).max(100),
    peopleStabilityPct: z.number().min(0).max(100)
  })
  .strict();
export type HRBoardSnapshot = z.infer<typeof HRBoardSnapshotSchema>;

export interface BoardPrepAIToolAdapters {
  fetchCRMBoardSnapshot(input: BoardPrepToolInput): Promise<CRMBoardSnapshot>;
  fetchERPBoardSnapshot(input: BoardPrepToolInput): Promise<ERPBoardSnapshot>;
  fetchHRBoardSnapshot(input: BoardPrepToolInput): Promise<HRBoardSnapshot>;
}

function deterministic(seed: string, min: number, max: number): number {
  const digest = createHash("sha256").update(seed).digest("hex");
  const parsed = Number.parseInt(digest.slice(0, 10), 16);
  const ratio = parsed / Number.parseInt("ffffffffff", 16);
  return min + (max - min) * ratio;
}

export function normalizeBoardPrepToolId(toolId: string): BoardPrepToolId | null {
  const normalized = toolId
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized === "crm-board-feed" || normalized === "crm") {
    return "crm-board-feed";
  }
  if (normalized === "erp-board-feed" || normalized === "erp") {
    return "erp-board-feed";
  }
  if (normalized === "hr-board-feed" || normalized === "hr") {
    return "hr-board-feed";
  }
  return null;
}

export function createDefaultBoardPrepAIToolAdapters(): BoardPrepAIToolAdapters {
  return {
    async fetchCRMBoardSnapshot(
      input: BoardPrepToolInput
    ): Promise<CRMBoardSnapshot> {
      BoardPrepToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.focusAreas.join(",")}:crm`;
      return CRMBoardSnapshotSchema.parse({
        customerRiskTheme:
          deterministic(`${seed}:theme`, 0, 1) > 0.5
            ? "strategic accounts are asking for a tighter decision cadence on unresolved escalations"
            : "expansion momentum is positive, but pipeline quality is uneven across regions",
        decisionPressurePct: Number(
          deterministic(`${seed}:pressure`, 24, 89).toFixed(2)
        ),
        pipelineHealthPct: Number(deterministic(`${seed}:health`, 37, 92).toFixed(2))
      });
    },

    async fetchERPBoardSnapshot(
      input: BoardPrepToolInput
    ): Promise<ERPBoardSnapshot> {
      BoardPrepToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.requiredMetrics.join(",")}:erp`;
      return ERPBoardSnapshotSchema.parse({
        cashVariancePct: Number(deterministic(`${seed}:cash`, -18, 22).toFixed(2)),
        financeCompletenessPct: Number(
          deterministic(`${seed}:completeness`, 44, 97).toFixed(2)
        ),
        toplineMomentumPct: Number(
          deterministic(`${seed}:topline`, -7, 23).toFixed(2)
        )
      });
    },

    async fetchHRBoardSnapshot(input: BoardPrepToolInput): Promise<HRBoardSnapshot> {
      BoardPrepToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.startDate}:${input.endDate}:hr`;
      return HRBoardSnapshotSchema.parse({
        cultureRiskTheme:
          deterministic(`${seed}:theme`, 0, 1) > 0.5
            ? "executive bandwidth is stretched across simultaneous operating changes"
            : "manager alignment is steady, but critical-team fatigue is increasing",
        execAlignmentPct: Number(
          deterministic(`${seed}:alignment`, 41, 94).toFixed(2)
        ),
        peopleStabilityPct: Number(
          deterministic(`${seed}:stability`, 39, 91).toFixed(2)
        )
      });
    }
  };
}
