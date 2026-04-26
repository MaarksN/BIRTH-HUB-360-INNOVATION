import assert from "node:assert/strict";
import test, { mock } from "node:test";


import {
  prisma,
  StepResultStatus,
  WorkflowExecutionStatus,

  WorkflowTriggerType
} from "@birthub/database";

import { WorkflowRunner } from "./runner.js";

function createMockWorkflowExecution(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    createdAt: new Date(),
    depth: 0,
    id: "exec_agent",
    organizationId: "org_1",
    startedAt: new Date("2026-03-13T12:15:00.000Z"),
    status: "RUNNING",
    tenantId: "tenant_1",
    updatedAt: new Date(),
    workflowId: "wf_agent",
    ...overrides
  };
}

function createMockWorkflow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    createdAt: new Date(),
    id: "wf_agent",
    isActive: true,
    maxDepth: 10,
    name: "Agent Workflow",
    organizationId: "org_1",
    steps: [
      {
        cacheTTLSeconds: 0,
        config: {
          agentId: "ceo-pack",
          input: {
            brief: "{{ trigger.output.topic }}"
          },
          onError: "stop"
        },
        createdAt: new Date(),
        id: "step_agent",
        isTrigger: false,
        key: "agent_step",
        name: "CEO strategic review",
        onError: "STOP",
        organizationId: "org_1",
        tenantId: "tenant_1",
        type: "AGENT_EXECUTE",
        updatedAt: new Date(),
        workflowId: "wf_agent"
      }
    ],
    tenantId: "tenant_1",
    transitions: [],
    updatedAt: new Date(),
    version: 1,
    ...overrides
  };
}

function createMockStepResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    cacheKey: null,
    createdAt: new Date(),
    error: null,
    executionId: "exec_agent",
    id: "result_1",
    input: {},
    organizationId: "org_1",
    output: {},
    startedAt: new Date(),
    status: "SUCCESS",
    stepKey: "agent_step",
    tenantId: "tenant_1",
    updatedAt: new Date(),
    ...overrides
  };
}


void test("Workflow runner smoke test executes CEO agent and persists the result", async () => {

  const originalFindExecution = prisma.workflowExecution.findUnique.bind(prisma.workflowExecution);
  const originalFindWorkflow = prisma.workflow.findFirst.bind(prisma.workflow);
  const originalFindResults = prisma.stepResult.findMany.bind(prisma.stepResult);
  const originalCreateResult = prisma.stepResult.create.bind(prisma.stepResult);
  const originalUpdateExecution = prisma.workflowExecution.update.bind(prisma.workflowExecution);
  const originalFindQuota = prisma.quotaUsage.findFirst.bind(prisma.quotaUsage);
  const originalFindSubscription = prisma.subscription.findFirst.bind(prisma.subscription);
  const originalCreateUsage = prisma.usageRecord.create.bind(prisma.usageRecord);
  const createdResults: Array<Record<string, unknown>> = [];
  const executionUpdates: Array<Record<string, unknown>> = [];
  const usageRecords: Array<Record<string, unknown>> = [];
  const agentCalls: Array<{ agentId: string; contextSummary: string; input: Record<string, unknown> }> = [];

  try {
    // @ts-expect-error isolated runner mock limit
    prisma.workflowExecution.findUnique = mock.fn(async () => createMockWorkflowExecution());
    // @ts-expect-error isolated runner mock limit
    prisma.workflow.findFirst = mock.fn(async () => createMockWorkflow());
    // @ts-expect-error isolated runner mock limit
    prisma.stepResult.findMany = mock.fn(async () => []);
    // @ts-expect-error isolated runner mock limit
    prisma.stepResult.create = mock.fn(async (args) => { createdResults.push(args.data); return createMockStepResult(args.data); });
    // @ts-expect-error isolated runner mock limit
    prisma.workflowExecution.update = mock.fn(async (args) => { executionUpdates.push(args.data); return createMockWorkflowExecution(args.data); });
    // @ts-expect-error isolated runner mock limit
    prisma.quotaUsage.findFirst = mock.fn(async () => null);
    // @ts-expect-error isolated runner mock limit
    prisma.subscription.findFirst = mock.fn(async () => null);
    // @ts-expect-error isolated runner mock limit
    prisma.usageRecord.create = mock.fn(async (args) => { usageRecords.push(args.data); return args.data; });
    const fakeQueue = { add: () => Promise.resolve(undefined) };
    // @ts-expect-error isolated runner mock limit
    const runner = new WorkflowRunner(fakeQueue, {
      agentExecutor: {
        execute: (args) => {
          agentCalls.push(args);
          return Promise.resolve({
            agentId: args.agentId,
            summary: `CEO reviewed ${String(args.input.brief)}`,
            verdict: "OK"
          });
        }
      }
    });

    await runner.processExecutionJob({
      attempt: 1,
      executionId: "exec_agent",
      organizationId: "org_1",
      stepKey: "agent_step",
      tenantId: "tenant_1",
      triggerPayload: {
        topic: "expansion plan"
      },
      triggerType: WorkflowTriggerType.MANUAL,
      workflowId: "wf_agent"
    });

    assert.equal(agentCalls.length, 1);
    assert.equal(agentCalls[0]?.agentId, "ceo-pack");
    assert.match(agentCalls[0]?.contextSummary ?? "", /workflow=wf_agent/);
    assert.equal(createdResults.length, 1);
    assert.equal(createdResults[0]?.status, StepResultStatus.SUCCESS);
    assert.deepEqual(createdResults[0]?.output, {
      agentId: "ceo-pack",
      summary: "CEO reviewed expansion plan",
      verdict: "OK"
    });
    assert.ok(executionUpdates.some((update) => update.status === WorkflowExecutionStatus.SUCCESS));
    assert.equal(usageRecords.length, 1);
  } finally {
    prisma.workflowExecution.findUnique = originalFindExecution;
    prisma.workflow.findFirst = originalFindWorkflow;
    prisma.stepResult.findMany = originalFindResults;
    prisma.stepResult.create = originalCreateResult;
    prisma.workflowExecution.update = originalUpdateExecution;
    prisma.quotaUsage.findFirst = originalFindQuota;
    prisma.subscription.findFirst = originalFindSubscription;
    prisma.usageRecord.create = originalCreateUsage;
  }
});


