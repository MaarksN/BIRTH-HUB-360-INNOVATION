import assert from "node:assert/strict";
import test from "node:test";

import { MANIFEST_VERSION, parseAgentManifest } from "@birthub/agents-core";

import { buildAgentMeshExecutionBlueprint } from "./runtime.mesh.js";

function createCatalogEntry(input: {
  description: string;
  domain: string;
  id: string;
  industry?: string;
  name: string;
  useCase: string;
}) {
  return {
    manifest: parseAgentManifest({
      agent: {
        changelog: ["Initial"],
        description: input.description,
        id: input.id,
        kind: "agent",
        name: input.name,
        prompt: "IDENTIDADE E MISSAO\nDemo",
        tenantId: "catalog",
        version: "1.0.0"
      },
      keywords: [input.domain, input.useCase, input.description, input.name, "segment", "workflow", "agent", "plan"],
      manifestVersion: MANIFEST_VERSION,
      policies: [
        {
          actions: ["tool:execute"],
          effect: "allow",
          id: `${input.id}.policy`,
          name: "Policy"
        }
      ],
      skills: [
        {
          description: input.description,
          id: `${input.id}.skill`,
          inputSchema: { type: "object" },
          name: `${input.name} Skill`,
          outputSchema: { type: "object" }
        }
      ],
      tags: {
        domain: [input.domain],
        industry: [input.industry ?? "cross-industry"],
        level: ["specialist"],
        persona: [input.id.replace(/-pack$/u, "")],
        "use-case": [input.useCase]
      },
      tools: [
        {
          description: "Tool",
          id: `${input.id}.tool`,
          inputSchema: { type: "object" },
          name: "Tool",
          outputSchema: { type: "object" },
          timeoutMs: 15000
        }
      ]
    }),
    manifestPath: `/tmp/${input.id}/manifest.json`
  };
}

void test("buildAgentMeshExecutionBlueprint ranks specialists by domain and segment", () => {
  const catalog = [
    createCatalogEntry({
      description: "Revenue pipeline specialist",
      domain: "sales",
      id: "cro-pack",
      industry: "fintech",
      name: "CRO Pack",
      useCase: "forecasting"
    }),
    createCatalogEntry({
      description: "Customer health and retention specialist",
      domain: "customer-success",
      id: "cs-pack",
      industry: "fintech",
      name: "CS Pack",
      useCase: "retention"
    }),
    createCatalogEntry({
      description: "Financial risk and margin specialist",
      domain: "finance",
      id: "cfo-pack",
      industry: "fintech",
      name: "CFO Pack",
      useCase: "cash-flow"
    })
  ];

  const blueprint = buildAgentMeshExecutionBlueprint({
    catalog,
    objective: "Protect renewal revenue and margin for an enterprise fintech account",
    segmentProfile: {
      buyingMotion: "sales-led",
      clientSegment: "enterprise",
      companySize: "enterprise",
      confidence: "high",
      geography: "brazil",
      industry: "fintech",
      maturity: "growth",
      regulation: "regulated"
    },
    textSignals: ["renewal risk", "margin pressure", "executive escalation"]
  });

  assert.equal(blueprint.focusDomains.includes("sales"), true);
  assert.equal(blueprint.focusDomains.includes("finance"), true);
  assert.equal(
    blueprint.focusDomains.includes("customer-success") || blueprint.focusDomains.includes("operations"),
    true
  );
  assert.equal(blueprint.specialistLineup[0]?.agentId, "cro-pack");
  assert.equal(blueprint.specialistLineup.some((entry) => entry.agentId === "cfo-pack"), true);
  assert.equal(blueprint.workflowPlan.length > 0, true);
  assert.equal(blueprint.approvalRecommendation.required, true);
});

