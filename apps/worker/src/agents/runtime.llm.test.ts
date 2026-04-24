import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { MANIFEST_VERSION, parseAgentManifest } from "@birthub/agents-core";

import { generateStructuredObject } from "./runtime.llm.js";

void test("generateStructuredObject validates LLM JSON output with injected mock client", async () => {
  const manifest = parseAgentManifest({
    agent: {
      changelog: ["init"],
      description: "test",
      id: "llm-test-agent",
      kind: "agent",
      name: "LLM Agent",
      prompt: "Test",
      tenantId: "catalog",
      version: "1.0.0"
    },
    keywords: ["llm", "test", "plan", "runtime", "structured"],
    manifestVersion: MANIFEST_VERSION,
    policies: [{ actions: ["tool:execute"], effect: "allow", id: "p1", name: "default" }],
    skills: [{ description: "s", id: "s1", inputSchema: { type: "object" }, name: "S", outputSchema: { type: "object" } }],
    tags: { domain: ["operations"], industry: ["saas"], level: ["specialist"], persona: ["ops"], "use-case": ["support"] },
    tools: [{ description: "helper", id: "helper-tool", inputSchema: { type: "object" }, name: "Helper", outputSchema: { type: "object" }, timeoutMs: 1000 }]
  });

  const result = await generateStructuredObject({
    context: {
      input: { task: "run" },
      manifest,
      systemPrompt: "Return JSON",
      toolCatalog: [{ description: "read", name: "db-read" }]
    },
    llmClient: {
      async chat() {
        return { content: '{"value":"ok"}' };
      }
    },
    schema: z.object({ value: z.string() })
  });

  assert.equal(result.value, "ok");
});
