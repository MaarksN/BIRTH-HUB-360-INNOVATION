import type { WorkflowCanvas } from "../schemas/step.schema.js";
import type { WorkflowStepType } from "../types.js";
export type StepLintSeverity = "info" | "warning" | "critical";
export type StepLintCode = "INCOMPATIBLE_ROUTE" | "INSECURE_HTTP_URL" | "LEGACY_STEP" | "MISSING_FAILURE_PATH" | "RISKY_CODE_TIMEOUT" | "UNSCOPED_CONNECTOR_ACCOUNT";
export interface StepLintFinding {
    code: StepLintCode;
    message: string;
    risk: number;
    severity: StepLintSeverity;
    stepKey: string;
    stepType: WorkflowStepType;
}
export interface WorkflowStepLintResult {
    findings: StepLintFinding[];
    score: number;
    summary: {
        critical: number;
        info: number;
        warning: number;
    };
}
export declare function lintWorkflowSteps(canvas: WorkflowCanvas): WorkflowStepLintResult;
