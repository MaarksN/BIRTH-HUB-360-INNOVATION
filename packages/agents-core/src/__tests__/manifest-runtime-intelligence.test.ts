import assert from "node:assert/strict";
import test from "node:test";

import { MANIFEST_VERSION, type AgentManifest } from "../manifest/schema.js";
import {
  TOTAL_PREMIUM_LAYER_COUNT,
  buildAgentRuntimeOutput,
  buildAgentRuntimePlan,
  inferSegmentProfile,
  summarizeNumericSignals
} from "../runtime/index.js";

const manifest: AgentManifest = {
  agent: {
    changelog: [],
    description: "Agent for runtime intelligence tests",
    id: "runtime-intelligence.demo",
    kind: "agent",
    name: "Runtime Intelligence Demo",
    prompt: "IDENTIDADE E MISSAO\nDemo",
    tenantId: "catalog",
    version: "1.0.0"
  },
  keywords: ["runtime", "intelligence", "demo", "planner", "reviewer", "segment", "memory", "handoff"],
  manifestVersion: MANIFEST_VERSION,
  policies: [
    {
      actions: ["tool:execute", "memory:read", "memory:write", "learning:read", "learning:write"],
      effect: "allow",
      id: "runtime-intelligence.demo.policy.standard",
      name: "Standard"
    }
  ],
  skills: [
    {
      description: "Diagnose segment-aware operational patterns",
      id: "runtime-intelligence.demo.skill.diagnose",
      inputSchema: { type: "object" },
      name: "Diagnose",
      outputSchema: { type: "object" }
    },
    {
      description: "Recommend next best action",
      id: "runtime-intelligence.demo.skill.recommend",
      inputSchema: { type: "object" },
      name: "Recommend",
      outputSchema: { type: "object" }
    }
  ],
  tags: {
    domain: ["finance", "operations"],
    industry: ["fintech"],
    level: ["specialist"],
    persona: ["analyst"],
    "use-case": ["forecasting", "multi-agent-execution"]
  },
  tools: [
    {
      description: "Process numbers and metrics",
      id: "runtime-intelligence.demo.tool.data-processor",
      inputSchema: { type: "object" },
      name: "Data Processor",
      outputSchema: { type: "object" },
      timeoutMs: 15000
    },
    {
      description: "Coordinate another agent handoff",
      id: "runtime-intelligence.demo.tool.agent-handoff",
      inputSchema: { type: "object" },
      name: "Agent Handoff",
      outputSchema: { type: "object" },
      timeoutMs: 15000
    }
  ]
};

void test("segment profile and numeric summary are inferred from runtime input", () => {
  const profile = inferSegmentProfile({
    companySize: "Mid Market",
    geography: "Brazil",
    industry: "Fintech",
    maturity: "Growth",
    segment: "B2B",
    values: [12, 16, 18]
  }, manifest.tags);
  const numericSummary = summarizeNumericSignals([12, 16, 18]);

  assert.equal(profile.industry, "fintech");
  assert.equal(profile.companySize, "mid-market");
  assert.equal(profile.geography, "brazil");
  assert.equal(profile.clientSegment, "b2b");
  assert.equal(numericSummary.trend, "up");
});

void test("runtime plan and output include segment adaptation, memory and handoff guidance", () => {
  const input = {
    companySize: "Mid Market",
    geography: "Brazil",
    industry: "Fintech",
    objective: "Protect renewal revenue",
    owner: "revops",
    segment: "Enterprise",
    values: [90, 95, 130],
    notes: ["renewal risk rising", "expansion opportunity detected"]
  };

  const plan = buildAgentRuntimePlan({
    input,
    manifest,
    sharedLearning: [
      {
        approved: true,
        appliesTo: [manifest.agent.id],
        confidence: 0.91,
        createdAt: new Date().toISOString(),
        evidence: ["historical renewal playbook"],
        id: "learn-1",
        keywords: ["renewal", "fintech", "enterprise"],
        lessonType: "execution-pattern",
        sourceAgentId: manifest.agent.id,
        summary: "Enterprise fintech renewals benefit from early escalation.",
        tenantId: "tenant-1"
      }
    ],
    tenantId: "tenant-1"
  });
  const firstToolCall = plan.toolCalls[0]!;

  assert.equal(plan.toolCalls.length, 2);
  assert.equal(
    (firstToolCall.input.segmentProfile as { industry: string }).industry,
    "fintech"
  );
  assert.equal((firstToolCall.input.dataSummary as { trend: string }).trend, "up");
  assert.equal(
    (firstToolCall.input.communicationProtocol as { protocolVersion: string }).protocolVersion,
    "premium-100"
  );
  assert.equal(
    (firstToolCall.input.decisionProtocol as { protocolVersion: string }).protocolVersion,
    "premium-100"
  );
  assert.equal(
    (firstToolCall.input.premiumOperatingModel as { tier: string }).tier,
    "market-premium-100"
  );

  const output = buildAgentRuntimeOutput({
    input,
    logs: plan.logs,
    manifest,
    plan,
    sharedLearning: [
      {
        approved: true,
        appliesTo: [manifest.agent.id],
        confidence: 0.91,
        createdAt: new Date().toISOString(),
        evidence: ["historical renewal playbook"],
        id: "learn-1",
        keywords: ["renewal", "fintech", "enterprise"],
        lessonType: "execution-pattern",
        sourceAgentId: manifest.agent.id,
        summary: "Enterprise fintech renewals benefit from early escalation.",
        tenantId: "tenant-1"
      }
    ],
    steps: [
      {
        call: {
          input: firstToolCall.input,
          tool: manifest.tools[0]!.id
        },
        finishedAt: new Date().toISOString(),
        output: {
          approvalRecommendation: {
            reason: "Finance and executive alignment required.",
            required: true
          },
          evidence: ["renewal cohort drift"],
          numericSummary: {
            average: 105,
            count: 3,
            outlierCount: 1,
            trend: "up"
          },
          specialistLineup: [
            {
              agentId: "cro-pack",
              domain: "sales",
              name: "CRO Pack",
              reason: "Revenue escalation required.",
              useCase: "forecasting"
            }
          ],
          workflowPlan: [
            {
              agentId: "cro-pack",
              expectedOutcome: "Stabilize renewal forecast.",
              order: 1,
              reason: "Revenue risk."
            }
          ]
        },
        startedAt: new Date().toISOString()
      }
    ]
  });

  assert.equal(output.agent_id, manifest.agent.id);
  assert.equal(output.segment_profile.industry, "fintech");
  assert.equal(output.memory_writeback.ttlHours, 24 * 30);
  assert.equal(output.specialist_deliverables.length > 0, true);
  assert.equal(output.suggested_handoffs.length > 0, true);
  assert.equal(output.leading_indicators.some((item) => item === "industry:fintech"), true);
  assert.equal(output.orchestration_plan?.recommended_agents[0]?.agent_id, "cro-pack");
  assert.equal(output.orchestration_plan?.approval_required, true);
  assert.equal(output.premium_layers.length, TOTAL_PREMIUM_LAYER_COUNT);
  assert.equal(output.premium_score > 0, true);
});
