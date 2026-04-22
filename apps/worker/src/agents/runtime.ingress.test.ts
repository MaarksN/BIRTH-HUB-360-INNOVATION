import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import type { WorkflowTriggerJobPayload } from "../engine/runner.js";
import {
  type AgentMeshExecutionJobPayload,
  buildAgentMeshTriggerExecution,
  dispatchAgentMeshTrigger,
  emitNewLeadEvent,
  initializeAgentMeshIngressBridge
} from "./runtime.ingress.js";

void test("buildAgentMeshTriggerExecution normalizes critical support events into a premium mesh payload", () => {
  const blueprint = buildAgentMeshTriggerExecution({
    event: "support.critical_ticket",
    payload: {
      accountName: "Acme Health",
      industry: "Healthcare",
      segment: "Enterprise",
      severity: "critical",
      ticketTitle: "API outage on patient sync"
    },
    source: "zendesk",
    tenantId: "tenant_critical"
  });

  assert.ok(blueprint);
  assert.equal(blueprint?.canonicalEvent, "support.critical_ticket");
  assert.equal(blueprint?.priority, "high");
  assert.equal(blueprint?.executionPayload.agentId, "agent-mesh-orchestrator-pack");
  assert.equal(
    (blueprint?.executionPayload.input.trigger as { canonicalType: string }).canonicalType,
    "support.critical_ticket"
  );
  const objective = blueprint?.executionPayload.input.objective;
  assert.equal(typeof objective, "string");
  assert.match(typeof objective === "string" ? objective : "", /ticket critico/i);
  assert.equal(
    blueprint?.workflowTopics.includes("agent.mesh.support.critical_ticket"),
    true
  );
});

void test("dispatchAgentMeshTrigger queues the mesh execution and any matching event workflows", async () => {
  const originalFindMany = prisma.workflow.findMany.bind(prisma.workflow);
  const queuedAgents: Array<{ payload: AgentMeshExecutionJobPayload; priority: string }> = [];
  const queuedWorkflows: WorkflowTriggerJobPayload[] = [];

  (prisma.workflow.findMany as unknown as (args: unknown) => Promise<unknown>) = () =>
    Promise.resolve([
      {
        id: "wf_renewal_guardrail",
        organizationId: "org_renewal"
      }
    ]);

  try {
    const result = await dispatchAgentMeshTrigger(
      {
        enqueueAgentExecution: ({ payload, priority }) => {
          queuedAgents.push({ payload, priority });
          return Promise.resolve();
        },
        enqueueWorkflowTrigger: (payload) => {
          queuedWorkflows.push(payload);
          return Promise.resolve();
        }
      },
      {
        event: "customer.renewal_at_risk",
        organizationId: "org_renewal",
        payload: {
          accountName: "Globex",
          healthScore: 31,
          industry: "Fintech",
          riskLevel: "high",
          segment: "Enterprise"
        },
        source: "health-score-job",
        tenantId: "tenant_renewal"
      }
    );

    assert.equal(result?.canonicalEvent, "customer.renewal_at_risk");
    assert.equal(result?.queuedWorkflowCount, 1);
    assert.equal(queuedAgents.length, 1);
    assert.equal(queuedAgents[0]?.priority, "high");
    assert.equal(queuedWorkflows.length, 1);
    assert.equal(
      ((queuedWorkflows[0]?.triggerPayload as Record<string, unknown>).trigger as Record<string, unknown>)
        .canonicalType,
      "customer.renewal_at_risk"
    );
  } finally {
    prisma.workflow.findMany = originalFindMany;
  }
});

void test("initializeAgentMeshIngressBridge reacts to emitted lead events", async () => {
  const originalFindMany = prisma.workflow.findMany.bind(prisma.workflow);
  const queuedAgents: Array<{ payload: AgentMeshExecutionJobPayload; priority: string }> = [];

  (prisma.workflow.findMany as unknown as (args: unknown) => Promise<unknown>) = () =>
    Promise.resolve([]);

  const bridge = initializeAgentMeshIngressBridge({
    enqueueAgentExecution: ({ payload, priority }) => {
      queuedAgents.push({ payload, priority });
      return Promise.resolve();
    },
    enqueueWorkflowTrigger: () => Promise.resolve()
  });

  try {
    emitNewLeadEvent({
      payload: {
        companyName: "Nova Retail",
        email: "buyer@nova.test",
        industry: "Retail",
        segment: "Mid Market"
      },
      source: "hubspot",
      tenantId: "tenant_leads"
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(queuedAgents.length, 1);
    assert.equal(queuedAgents[0]?.priority, "normal");
    assert.ok(queuedAgents[0]);
    assert.equal(
      (queuedAgents[0].payload.input.trigger as Record<string, unknown>).canonicalType,
      "sales.new_lead"
    );
  } finally {
    bridge.close();
    prisma.workflow.findMany = originalFindMany;
  }
});
