import assert from "node:assert/strict";
import test from "node:test";

import {
  MANIFEST_VERSION,
  type AgentManifest
} from "@birthub/agents-core";
import { prisma } from "@birthub/database";

import { SHARED_LEARNING_LIMIT } from "./runtime.shared.js";
import {
  buildLearningRecord,
  createOutputArtifact
} from "./runtime.artifacts.js";

function createManifest(): AgentManifest {
  return {
    agent: {
      changelog: [],
      description: "Agent for artifact tests",
      id: "agent.demo",
      kind: "agent",
      name: "Agent Demo",
      prompt: "Do the thing",
      tenantId: "catalog",
      version: "1.0.0"
    },
    keywords: Array.from({ length: SHARED_LEARNING_LIMIT + 3 }, (_, index) => `keyword-${index + 1}`),
    manifestVersion: MANIFEST_VERSION,
    policies: [],
    skills: [],
    tags: {
      domain: [],
      industry: [],
      level: [],
      persona: [],
      "use-case": []
    },
    tools: []
  };
}

void test("buildLearningRecord truncates keywords to the shared learning limit", () => {
  const record = buildLearningRecord({
    agentId: "installed_agent_1",
    manifest: createManifest(),
    outputPreview: "preview",
    tenantId: "tenant_1"
  });

  assert.equal(record.keywords.length, SHARED_LEARNING_LIMIT);
  assert.equal(record.sourceAgentId, "installed_agent_1");
  assert.equal(record.tenantId, "tenant_1");
  assert.equal(record.evidence[0], "preview");
});

void test("createOutputArtifact persists the output and corresponding audit log", async () => {
  const originalCreateOutput = prisma.outputArtifact.create.bind(prisma.outputArtifact);
  const originalCreateAudit = prisma.auditLog.create.bind(prisma.auditLog);
  let auditPayload: unknown = null;

  prisma.outputArtifact.create = (async () =>
    ({
      id: "output_1",
      status: "WAITING_APPROVAL",
      type: "executive-report"
    })) as unknown as typeof prisma.outputArtifact.create;
  prisma.auditLog.create = (async (args: unknown) => {
    auditPayload = args;
    return {} as never;
  }) as unknown as typeof prisma.auditLog.create;

  try {
    const outputId = await createOutputArtifact({
      content: "{\"ok\":true}",
      executionId: "exec_1",
      manifest: createManifest(),
      organizationId: "org_1",
      requireApproval: true,
      tenantId: "tenant_1",
      type: "executive-report",
      userId: "user_1"
    });

    assert.equal(outputId, "output_1");
    assert.deepEqual(auditPayload, {
      data: {
        action: "AGENT_OUTPUT_CREATED",
        actorId: "user_1",
        diff: {
          outputId: "output_1",
          status: "WAITING_APPROVAL",
          type: "executive-report"
        },
        entityId: "exec_1",
        entityType: "agent_execution",
        tenantId: "tenant_1"
      }
    });
  } finally {
    prisma.outputArtifact.create = originalCreateOutput;
    prisma.auditLog.create = originalCreateAudit;
  }
});

