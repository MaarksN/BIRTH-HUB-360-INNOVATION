import type { WorkflowStepType } from "../types.js";
export type StepLifecycle = "active" | "deprecated";
export interface StepCatalogEntry {
    category: "action" | "connector" | "logic" | "trigger";
    key: WorkflowStepType;
    lifecycle: StepLifecycle;
    replacement?: WorkflowStepType;
    riskWeight: number;
}
export declare const STEP_CATALOG: Record<WorkflowStepType, StepCatalogEntry>;
