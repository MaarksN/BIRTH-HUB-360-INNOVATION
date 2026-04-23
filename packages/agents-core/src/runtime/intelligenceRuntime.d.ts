import type { AgentManifest } from "../manifest/schema.js";
import type { CapabilityType, NumericSignalSummary, PremiumLayerAssessment, PremiumLayerAssessmentInput, PremiumLayerOverview, RecommendedAction, SegmentProfile } from "./intelligence.js";
export declare function buildPremiumLayersAssessment(input: PremiumLayerAssessmentInput): PremiumLayerAssessment[];
export declare function summarizePremiumLayers(layers: PremiumLayerAssessment[]): PremiumLayerOverview;
export declare function inferCapabilityType(input: {
    description?: string;
    id?: string;
    name?: string;
}): CapabilityType;
export declare function describeCapabilityIntent(capabilityType: CapabilityType): string;
export declare function inferCollaborationTargets(manifest: AgentManifest): string[];
export declare function buildRecommendedActions(input: {
    capabilityType: CapabilityType;
    collaborationTargets?: string[];
    numericSummary: NumericSignalSummary;
    objective?: string | null;
    segmentProfile: SegmentProfile;
    textSignals?: string[];
}): RecommendedAction[];
export declare function buildMemoryKey(agentId: string, segmentProfile: SegmentProfile, suffix: string): string;
