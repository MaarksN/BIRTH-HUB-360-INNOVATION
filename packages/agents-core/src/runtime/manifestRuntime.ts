import type { AgentManifest } from "../manifest/schema.js";
import type { AgentLearningRecord, JsonValue } from "../types/index.js";
import type { PremiumLayerAssessment, SegmentProfile } from "./intelligence.js";

export interface ManagedAgentPolicy {
  actions: string[];
  effect: "allow" | "deny";
  enabled?: boolean;
  id: string;
  name: string;
  reason?: string;
}

export interface RuntimePolicyRule {
  action: string;
  effect: "allow" | "deny";
  id: string;
}

export interface RuntimePlannedToolCall {
  input: Record<string, unknown>;
  rationale: string;
  tool: string;
}

export interface AgentRuntimePlanInput {
  contextSummary?: string;
  input: Record<string, unknown>;
  manifest: AgentManifest;
  sharedLearning?: AgentLearningRecord[];
  tenantId: string;
}

export interface AgentRuntimePlan {
  logs: string[];
  toolCalls: RuntimePlannedToolCall[];
}

export interface AgentRuntimeOutputInput {
  input: Record<string, unknown>;
  logs: string[];
  manifest: AgentManifest;
  plan: AgentRuntimePlan;
  sharedLearning?: AgentLearningRecord[];
  steps: Array<{
    call: {
      input: unknown;
      tool: string;
    };
    finishedAt: string;
    output: unknown;
    startedAt: string;
  }>;
}

export interface AgentRuntimeOutput {
  agent_id: string;
  approvals_or_dependencies: string[];
  confidence: "high" | "low" | "medium";
  decisions_to_anticipate: Array<{
    decision: string;
    due_window: string;
    owner: string;
    recommended_action: string;
    why_now: string;
  }>;
  emerging_risks: string[];
  executionMode: "LIVE";
  leading_indicators: string[];
  learning_used: Array<{
    confidence: number;
    id: string;
    summary: string;
  }>;
  memory_writeback: {
    key: string;
    reason: string;
    ttlHours: number;
    value_preview: string;
  };
  next_checkpoint: string;
  orchestration_plan: null | {
    approval_reason: string;
    approval_required: boolean;
    focus_domains: string[];
    recommended_agents: Array<{
      agent_id: string;
      domain: string;
      name: string;
      reason: string;
      use_case: string;
    }>;
    workflow_steps: Array<{
      agent_id: string;
      expected_outcome: string;
      order: number;
      reason: string;
    }>;
  };
  opportunities_to_capture: string[];
  premium_layers: PremiumLayerAssessment[];
  premium_score: number;
  preventive_action_plan: Array<{
    action: string;
    checkpoint: string;
    deadline: string;
    expected_impact: string;
    owner: string;
  }>;
  segment_profile: SegmentProfile;
  sharedLearningCount: number;
  specialist_deliverables: string[];
  status: "critical" | "stable" | "watch";
  suggested_handoffs: Array<{
    payload_focus: string;
    reason: string;
    target: string;
  }>;
  summary: string;
  tool_results: Array<{
    finishedAt: string;
    output: JsonValue | null;
    startedAt: string;
    tool: string;
  }>;
}

export interface OutputGovernanceDecision {
  reason: string;
  requireApproval: boolean;
  type: "executive-report" | "technical-log";
}

export {
  buildAgentRuntimePlan,
  buildRuntimePolicyRules,
  inferOutputGovernance
} from "./manifestRuntimeCore.js";
export { buildAgentRuntimeOutput } from "./manifestRuntimeBuilders.js";
