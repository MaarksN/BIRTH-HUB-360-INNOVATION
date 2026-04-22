// @ts-expect-error TODO: remover suppressão ampla
import assert from "node:assert/strict";
import test from "node:test";

import { MANIFEST_VERSION, PolicyEngine, TOTAL_PREMIUM_LAYER_COUNT } from "@birthub/agents-core";

import { createRuntimeTools } from "./runtime.tools.js";
import { buildDbReadQueryTemplate } from "./runtime.tools.js";

void test("buildDbReadQueryTemplate removes the synthetic tenant param when the query does not reference it", () => {
  const template = buildDbReadQueryTemplate(
    "SELECT id FROM workflows WHERE status = $1\n-- tenant_scope: tenant_1",
    ["PUBLISHED", "tenant_1"],
    "tenant_1"
  );

  assert.deepEqual(template.strings, ["SELECT id FROM workflows WHERE status = ", ""]);
  assert.deepEqual(template.values, ["PUBLISHED"]);
});

void test("buildDbReadQueryTemplate keeps the tenant param when the query references it explicitly", () => {
  const template = buildDbReadQueryTemplate(
    'SELECT id FROM workflows WHERE status = $1 AND "tenantId" = $2\n-- tenant_scope: tenant_1',
    ["PUBLISHED", "tenant_1"],
    "tenant_1"
  );

  assert.deepEqual(template.strings, [
    "SELECT id FROM workflows WHERE status = ",
    ' AND "tenantId" = ',
    ""
  ]);
  assert.deepEqual(template.values, ["PUBLISHED", "tenant_1"]);
});

void test("buildDbReadQueryTemplate rejects sparse placeholders", () => {
  assert.throws(
    () =>
      buildDbReadQueryTemplate(
        "SELECT id FROM workflows WHERE id = $2\n-- tenant_scope: tenant_1",
        ["wf_1", "tenant_1"],
        "tenant_1"
      ),
    /contiguous and start at \$1/i
  );
});

void test("buildDbReadQueryTemplate rejects multiple SQL statements", () => {
  assert.throws(
    () =>
      buildDbReadQueryTemplate(
        "SELECT id FROM workflows WHERE id = $1; DELETE FROM workflows WHERE id = $1",
        ["wf_1", "tenant_1"],
        "tenant_1"
      ),
    /multiple SQL statements/i
  );
});

void test("manifest capability tools emit segment-aware recommendations and memory metadata", async () => {
  const manifest = {
    agent: {
      changelog: [],
      description: "Runtime tool manifest test",
      id: "runtime.tools.demo",
      kind: "agent",
      name: "Runtime Tools Demo",
      prompt: "Execute runtime tools demo",
      tenantId: "catalog",
      version: "1.0.0"
    },
    keywords: ["runtime", "tools", "demo", "segment", "memory", "handoff", "data", "recommendation"],
    manifestVersion: MANIFEST_VERSION,
    policies: [
      {
        actions: ["tool:execute", "memory:read", "memory:write", "learning:read", "learning:write"],
        effect: "allow",
        id: "runtime.tools.demo.policy.standard",
        name: "Standard"
      }
    ],
    skills: [
      {
        description: "Analyze data",
        id: "runtime.tools.demo.skill.analyze",
        inputSchema: { type: "object" },
        name: "Analyze",
        outputSchema: { type: "object" }
      }
    ],
    tags: {
      domain: ["finance"],
      industry: ["fintech"],
      level: ["specialist"],
      persona: ["analyst"],
      "use-case": ["forecasting"]
    },
    tools: [
      {
        description: "Process data and recommend next action",
        id: "runtime.tools.demo.tool.data-processor",
        inputSchema: { type: "object" },
        name: "Data Processor",
        outputSchema: { type: "object" },
        timeoutMs: 15000
      }
    ]
  };

  const policyEngine = new PolicyEngine([
    {
      action: "tool.*",
      agentId: manifest.agent.id,
      effect: "allow",
      id: "allow-all",
      tenantId: "tenant-1"
    }
  ]);
  const { tools } = createRuntimeTools(manifest, policyEngine, 0.15);
  const result = await tools["runtime.tools.demo.tool.data-processor"]!.run(
    {
      collaborationTargets: ["finance specialist"],
      industry: "Fintech",
      objective: "Protect renewal margin",
      region: "Brazil",
      segment: "Enterprise",
      values: [30, 40, 50],
      notes: ["margin drift", "renewal risk"]
    },
    {
      agentId: manifest.agent.id,
      tenantId: "tenant-1",
      traceId: "trace-1"
    }
  );

  assert.equal(result.capabilityType, "data-processing");
  assert.equal(result.numericSummary.average, 40);
  assert.equal(result.segmentProfile.industry, "fintech");
  assert.equal(result.recommendedActions.length > 0, true);
  const memoryKey = result.memoryWriteback.key;
  assert.equal(typeof memoryKey, "string");
  assert.equal(typeof memoryKey === "string" && memoryKey.includes("runtime-tools-demo"), true);
  assert.equal(Array.isArray(result.premiumLayers), true);
  assert.equal(result.premiumLayers.length, TOTAL_PREMIUM_LAYER_COUNT);
  assert.equal(typeof result.premiumOverallScore, "number");
});
