import assert from "node:assert/strict";
import test from "node:test";

import { MANIFEST_VERSION, PolicyEngine, parseAgentManifest } from "@birthub/agents-core";

import { LLMPlanner } from "./runtime.planner.js";

const manifest = parseAgentManifest({
  agent: { changelog: ["init"], description: "test", id: "planner-agent", kind: "agent", name: "Planner", prompt: "p", tenantId: "catalog", version: "1.0.0" },
  keywords: ["planner", "tool", "policy", "runtime", "tenant"],
  manifestVersion: MANIFEST_VERSION,
  policies: [{ actions: ["tool:execute"], effect: "allow", id: "p1", name: "default" }],
  skills: [{ description: "s", id: "s1", inputSchema: { type: "object" }, name: "S", outputSchema: { type: "object" } }],
  tags: { domain: ["operations"], industry: ["saas"], level: ["specialist"], persona: ["ops"], "use-case": ["support"] },
  tools: [{ description: "helper", id: "helper-tool", inputSchema: { type: "object" }, name: "Helper", outputSchema: { type: "object" }, timeoutMs: 1000 }]
});

void test("LLMPlanner keeps allowed tools", async () => {
  const planner = new LLMPlanner({
    input: { task: "x" },
    llmClient: { async chat() { return { content: '{"planReasoning":"ok","toolCalls":[{"tool":"db-read","input":{"query":"SELECT 1","params":[]}}]}' }; } },
    manifest,
    policyEngine: new PolicyEngine([{ action: "tool.db-read", agentId: manifest.agent.id, effect: "allow", id: "allow-read", tenantId: "tenant_1" }]),
    sharedLearning: [],
    tenantId: "tenant_1"
  });

  const calls = await planner.build({ agentId: manifest.agent.id, executionId: "exec_1", input: {}, tenantId: "tenant_1" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.tool, "db-read");
});

void test("LLMPlanner blocks forbidden tools", async () => {
  const planner = new LLMPlanner({
    input: { task: "x" },
    llmClient: { async chat() { return { content: '{"planReasoning":"ok","toolCalls":[{"tool":"db-write","input":{"table":"agentExecution","operation":"UPDATE","data":{},"where":{}}}]}' }; } },
    manifest,
    policyEngine: new PolicyEngine([{ action: "tool.db-read", agentId: manifest.agent.id, effect: "allow", id: "allow-read", tenantId: "tenant_1" }]),
    sharedLearning: [],
    tenantId: "tenant_1"
  });

  const calls = await planner.build({ agentId: manifest.agent.id, executionId: "exec_1", input: {}, tenantId: "tenant_1" });
  assert.equal(calls.length, 0);
});
