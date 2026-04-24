import type { AgentManifestTags } from "../manifest/schema.js";
export type CapabilityType = "collaboration" | "data-processing" | "execution" | "memory" | "recommendation" | "segment-adaptation";
export interface NumericSignalSummary {
    average: number;
    count: number;
    max: number | null;
    min: number | null;
    outlierCount: number;
    total: number;
    trend: "down" | "flat" | "mixed" | "none" | "up";
}
export interface SegmentProfile {
    buyingMotion: string;
    clientSegment: string;
    companySize: string;
    confidence: "high" | "low" | "medium";
    geography: string;
    industry: string;
    maturity: string;
    regulation: string;
}
export interface RecommendedAction {
    action: string;
    priority: "monitor" | "next" | "now";
    reason: string;
}
export type PremiumLayerStatus = "elite" | "strong" | "watch";
export interface PremiumLayerAssessment {
    id: "adaptive-learning-loop" | "collaboration-graph" | "governance-shield" | "memory-grid" | "opportunity-radar" | "recommendation-engine" | "risk-radar" | "segment-modeling" | "signal-fusion" | "workflow-automation";
    name: string;
    nextAction: string;
    score: number;
    status: PremiumLayerStatus;
    summary: string;
}
export interface PremiumLayerAssessmentInput {
    collaborationTargets?: string[];
    governanceRequired?: boolean;
    hasMemoryWriteback?: boolean;
    numericSummary: NumericSignalSummary;
    objective?: string | null;
    segmentProfile: SegmentProfile;
    sharedLearningCount?: number;
    textSignals?: string[];
    triggerSource?: string | null;
    workflowReady?: boolean;
}
export interface PremiumLayerOverview {
    needsAttention: string[];
    overallScore: number;
    standoutLayers: string[];
}
export declare function readTextSignals(value: unknown, limit?: number): string[];
export declare function readNumericSignals(value: unknown, limit?: number): number[];
export declare function summarizeNumericSignals(numbers: number[]): NumericSignalSummary;
export declare function inferSegmentProfile(value: unknown, fallbackTags?: AgentManifestTags): SegmentProfile;
export declare function buildSegmentKeywords(profile: SegmentProfile): string[];
export { buildMemoryKey, buildPremiumLayersAssessment, buildRecommendedActions, describeCapabilityIntent, inferCapabilityType, inferCollaborationTargets, summarizePremiumLayers } from "./intelligenceRuntime.js";
