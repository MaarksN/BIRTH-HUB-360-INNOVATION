import assert from "node:assert/strict";
import test from "node:test";

import { MANIFEST_VERSION, PolicyEngine, parseAgentManifest } from "@birthub/agents-core";
import { prisma } from "@birthub/database";

import { createRuntimeTools } from "./runtime.tools.js";

void test("db-write enforces allowlist, tenant isolation and audit log", async () => {
  const manifest = parseAgentManifest({
    agent: { changelog: ["init"], description: "test", id: "dbw-agent", kind: "agent", name: "DBW", prompt: "p", tenantId: "catalog", version: "1.0.0" },
    keywords: ["db", "write", "test", "policy", "tenant"],
    manifestVersion: MANIFEST_VERSION,
    policies: [{ actions: ["tool:execute"], effect: "allow", id: "p1", name: "default" }],
    skills: [{ description: "s", id: "s1", inputSchema: { type: "object" }, name: "S", outputSchema: { type: "object" } }],
    tags: { domain: ["operations"], industry: ["saas"], level: ["specialist"], persona: ["ops"], "use-case": ["support"] },
    tools: [{ description: "helper", id: "helper-tool", inputSchema: { type: "object" }, name: "Helper", outputSchema: { type: "object" }, timeoutMs: 1000 }]
  });

  const updateManyOriginal = prisma.agentExecution.updateMany.bind(prisma.agentExecution);
  const auditOriginal = prisma.auditLog.create.bind(prisma.auditLog);
  let updateWhere: unknown;
  let auditPayload: unknown;

  prisma.agentExecution.updateMany = (async (args: unknown) => {
    updateWhere = (args as { where: unknown }).where;
    return { count: 1 } as never;
  }) as typeof prisma.agentExecution.updateMany;
  prisma.auditLog.create = (async (args: unknown) => {
    auditPayload = args;
    return { id: "audit_1" } as never;
  }) as typeof prisma.auditLog.create;

  try {
    const { tools } = createRuntimeTools(
      manifest,
      new PolicyEngine([
        { action: "tool.db-write", agentId: manifest.agent.id, effect: "allow", id: "allow-tool", tenantId: "tenant_1" },
        { action: "db-write.commit", agentId: manifest.agent.id, effect: "allow", id: "allow-commit", tenantId: "tenant_1" }
      ]),
      0.2
    );

    const result = await tools["db-write"]!.run(
      { data: { metadata: { updated: true } }, operation: "UPDATE", table: "agentExecution", where: { id: "exec_1" } },
      { agentId: manifest.agent.id, tenantId: "tenant_1", traceId: "trace_1" }
    );

    assert.equal(result.affectedRows, 1);
    assert.equal((updateWhere as { tenantId: string }).tenantId, "tenant_1");
    assert.equal(Boolean(auditPayload), true);

    await assert.rejects(
      () =>
        tools["db-write"]!.run(
          { data: { name: "x" }, operation: "UPDATE", table: "users", where: { id: "u1" } },
          { agentId: manifest.agent.id, tenantId: "tenant_1", traceId: "trace_2" }
        ),
      /not allowlisted/i
    );
  } finally {
    prisma.agentExecution.updateMany = updateManyOriginal;
    prisma.auditLog.create = auditOriginal;
  }
});
