import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  Prisma,
  prisma,
  WorkflowStepOnError,
  WorkflowTransitionRoute,
  WorkflowTriggerType
} from "@birthub/database";

import type { WorkflowExecutionJobPayload } from "./runner.js";
import type {
  ExecutionContext,
  WorkflowExecutionQueue
} from "./runner.execution.js";
import { handleExecutionOutcome } from "./runner.execution.outcomes.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original = Reflect.get(target, key);
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

function uniqueStepAttemptError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    clientVersion: "test",
    code: "P2002",
    meta: {
      target: ["executionId", "stepId", "attempt"]
    }
  });
}

function buildPayload(overrides: Partial<WorkflowExecutionJobPayload> = {}): WorkflowExecutionJobPayload {
  return {
    attempt: 1,
    executionId: "exec_1",
    organizationId: "org_1",
    stepKey: "agent_step",
    tenantId: "tenant_1",
    triggerPayload: {
      email: "ada@example.test"
    },
    triggerType: WorkflowTriggerType.MANUAL,
    workflowId: "wf_1",
    ...overrides
  };
}

function buildContext(): ExecutionContext {
  return {
    execution: {
      depth: 0,
      id: "exec_1",
      isDryRun: false,
      organizationId: "org_1",
      startedAt: new Date("2026-04-01T10:00:00.000Z"),
      tenantId: "tenant_1",
      workflowId: "wf_1",
      workflowRevisionId: null
    },
    normalizeOutput: () => ({
      externalPayloadUrl: null,
      output: {
        ok: true
      },
      outputPreview: null,
      outputSize: 11
    }),
    now: new Date("2026-04-01T10:00:01.000Z"),
    parsedStep: {},
    step: {
      cacheTTLSeconds: 0,
      config: {},
      id: "step_1",
      isTrigger: false,
      key: "agent_step",
      name: "Agent step",
      onError: WorkflowStepOnError.STOP,
      type: "AGENT_EXECUTE"
    },
    stepInputHash: "hash_1",
    stepsContext: {},
    workflow: {
      id: "wf_1",
      maxDepth: 10,
      steps: [],
      transitions: []
    }
  } as unknown as ExecutionContext;
}

void test("handleExecutionOutcome ignores duplicate successful step attempts without advancing workflow", async () => {
  const createResult = mock.fn(async () => {
    throw uniqueStepAttemptError();
  });
  const updateExecution = mock.fn(async () => ({}));
  const createUsage = mock.fn(async () => ({}));
  const addJob = mock.fn(async () => undefined);
  const restores = [
    stubMethod(prisma.stepResult, "create", createResult),
    stubMethod(prisma.workflowExecution, "update", updateExecution),
    stubMethod(prisma.usageRecord, "create", createUsage)
  ];

  try {
    await handleExecutionOutcome({
      context: buildContext(),
      executionQueue: {
        add: addJob
      } as unknown as WorkflowExecutionQueue,
      output: {
        ok: true
      },
      payload: buildPayload()
    });

    assert.equal(createResult.mock.callCount(), 1);
    assert.equal(updateExecution.mock.callCount(), 0);
    assert.equal(createUsage.mock.callCount(), 0);
    assert.equal(addJob.mock.callCount(), 0);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("handleExecutionOutcome ignores duplicate failed step attempts without scheduling another retry", async () => {
  const createResult = mock.fn(async () => {
    throw uniqueStepAttemptError();
  });
  const updateExecution = mock.fn(async () => ({}));
  const createUsage = mock.fn(async () => ({}));
  const addJob = mock.fn(async () => undefined);
  const restores = [
    stubMethod(prisma.stepResult, "create", createResult),
    stubMethod(prisma.workflowExecution, "update", updateExecution),
    stubMethod(prisma.usageRecord, "create", createUsage)
  ];

  try {
    await handleExecutionOutcome({
      context: buildContext(),
      error: new Error("Remote service timed out"),
      executionQueue: {
        add: addJob
      } as unknown as WorkflowExecutionQueue,
      payload: buildPayload()
    });

    assert.equal(createResult.mock.callCount(), 1);
    assert.equal(addJob.mock.callCount(), 0);
    assert.equal(updateExecution.mock.callCount(), 0);
    assert.equal(createUsage.mock.callCount(), 0);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("handleExecutionOutcome enqueues transition steps with stable idempotent job ids", async () => {
  const createResult = mock.fn(async () => ({}));
  const updateExecution = mock.fn(async () => ({}));
  const addJob = mock.fn(async () => undefined);
  const restores = [
    stubMethod(prisma.stepResult, "create", createResult),
    stubMethod(prisma.workflowExecution, "update", updateExecution)
  ];
  const context = buildContext();
  context.workflow.steps = [
    {
      cacheTTLSeconds: 0,
      config: {},
      id: "step_next",
      isTrigger: false,
      key: "next_step",
      name: "Next step",
      onError: WorkflowStepOnError.STOP,
      type: "SEND_NOTIFICATION"
    }
  ] as typeof context.workflow.steps;
  context.workflow.transitions = [
    {
      route: WorkflowTransitionRoute.ALWAYS,
      sourceStepId: "step_1",
      targetStepId: "step_next"
    }
  ] as typeof context.workflow.transitions;

  try {
    await handleExecutionOutcome({
      context,
      executionQueue: {
        add: addJob
      } as unknown as WorkflowExecutionQueue,
      output: {
        ok: true
      },
      payload: buildPayload()
    });

    const options = addJob.mock.calls[0]?.arguments[2] as { jobId?: string } | undefined;

    assert.equal(createResult.mock.callCount(), 1);
    assert.equal(updateExecution.mock.callCount(), 1);
    assert.equal(addJob.mock.callCount(), 1);
    assert.equal(options?.jobId, "exec_1:next_step:1");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
