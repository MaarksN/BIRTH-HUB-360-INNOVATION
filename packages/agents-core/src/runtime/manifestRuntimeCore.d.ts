import type { AgentManifest } from "../manifest/schema.js";
import type { AgentLearningRecord, JsonValue } from "../types/index.js";
import { buildRecommendedActions, type SegmentProfile } from "./intelligence.js";
import type { AgentRuntimeOutput, AgentRuntimePlan, AgentRuntimePlanInput, ManagedAgentPolicy, OutputGovernanceDecision, RuntimePolicyRule } from "./manifestRuntime.js";
export declare function readString(value: unknown): string | null;
export declare function uniqueStrings(values: string[]): string[];
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function readObjective(input: Record<string, unknown>): string;
export declare function readPrimaryOwner(input: Record<string, unknown>): string;
export declare function normalizeJsonValue(value: unknown): JsonValue | null;
export declare function summarizeLearning(records?: AgentLearningRecord[]): Array<{
    confidence: number;
    id: string;
    summary: string;
}>;
export declare function deriveSpecialistDeliverables(manifest: AgentManifest): string[];
export declare function readTriggerSource(input: Record<string, unknown>): string | null;
export declare function hasWorkflowContext(input: Record<string, unknown>): boolean;
export declare function buildStatus(input: {
    governance: OutputGovernanceDecision;
    numericOutliers: number;
    segmentConfidence: SegmentProfile["confidence"];
    sharedLearningCount: number;
}): AgentRuntimeOutput["status"];
export declare function toolIsSensitive(toolId: string): boolean;
export declare function buildOutputConfidence(segmentProfile: SegmentProfile, sharedLearningCount: number, numericSignalCount: number): AgentRuntimeOutput["confidence"];
export declare function buildEmergingRisks(input: {
    governance: OutputGovernanceDecision;
    numericOutliers: number;
    premiumNeedsAttention: string[];
    segmentConfidence: SegmentProfile["confidence"];
}): string[];
export declare function buildLeadingIndicators(input: {
    orchestrationPlan: AgentRuntimeOutput["orchestration_plan"];
    overallScore: number;
    plan: AgentRuntimePlan;
    segmentProfile: SegmentProfile;
    trend: string;
    signalCount: number;
}): string[];
export declare function buildPreventiveActionPlan(owner: string, recommendedActions: ReturnType<typeof buildRecommendedActions>): AgentRuntimeOutput["preventive_action_plan"];
export declare function buildRuntimePolicyRules(manifest: AgentManifest, managedPolicies?: ManagedAgentPolicy[]): RuntimePolicyRule[];
export declare function buildAgentRuntimePlan(input: AgentRuntimePlanInput): AgentRuntimePlan;
export declare function inferOutputGovernance(input: {
    manifest: AgentManifest;
    plan: AgentRuntimePlan;
}): OutputGovernanceDecision;
