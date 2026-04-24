// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import {
  MembershipStatus,
  Role,
  StepResultStatus,
  UserStatus,
  WorkflowExecutionStatus,
  prisma
} from "@birthub/database";
import request from "supertest";

import { createApp } from "../src/app.js";
import { sha256 } from "../src/modules/auth/crypto.js";
import { workflowQueueAdapter } from "../src/modules/workflows/service.js";
import { createTestApiConfig } from "./test-config.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

function createSessionStubs(): Array<() => void> {
  return [
    stubMethod(prisma.session, "findUnique", (args: { where?: { token?: string } }) => {
      if (args.where?.token !== sha256("atk_admin")) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        expiresAt: new Date(Date.now() + 60_000),
        id: "session_1",
        organizationId: "org_1",
        revokedAt: null,
        tenantId: "tenant_1",
        userId: "user_1"
      });
    }),
    stubMethod(prisma.session, "update", () => Promise.resolve({ id: "session_1" })),
    stubMethod(prisma.user, "findUnique", () => Promise.resolve({
      id: "user_1",
      status: UserStatus.ACTIVE
    })),
    stubMethod(prisma.organization, "findFirst", () => Promise.resolve({
      id: "org_1",
      plan: {
        code: "starter",
        id: "plan_starter",
        limits: {
          features: {
            workflows: true
          },
          workflowExecutions: -1,
          workflows: 30
        },
        name: "Starter"
      },
      slug: "tenant-one",
      stripeCustomerId: null,
      subscriptions: [],
      tenantId: "tenant_1"
    })),
    stubMethod(prisma.billingCredit, "aggregate", () => Promise.resolve({
      _sum: {
        amountCents: 0
      }
    })),
    stubMethod(prisma.membership, "findUnique", () => Promise.resolve({
      organizationId: "org_1",
      role: Role.ADMIN,
      status: MembershipStatus.ACTIVE,
      userId: "user_1"
    }))
  ];
}

void test("workflow retry endpoint resumes from failed checkpoint with transactional checkpoint cloning", async () => {
  const createdExecutions: Array<Record<string, unknown>> = [];
  const clonedBatches: Array<Array<Record<string, unknown>>> = [];
  const enqueuedJobs: Array<Record<string, unknown>> = [];

  const sourceResults = [
    {
      attempt: 1,
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      errorMessage: null,
      executionId: "exec_source",
      externalPayloadUrl: null,
      finishedAt: new Date("2026-04-01T10:00:03.000Z"),
      input: { cached: true },
      output: { started: true },
      outputPreview: null,
      outputSize: 18,
      durationMs: 2000,
      errorCode: null,
      startedAt: new Date("2026-04-01T10:00:01.000Z"),
      status: StepResultStatus.SUCCESS,
      step: { key: "trigger_step" },
      stepId: "step_trigger",
      workflowId: "wf_1",
      workflowRevisionId: "rev_source"
    },
    {
      attempt: 1,
      createdAt: new Date("2026-04-01T10:01:00.000Z"),
      errorMessage: "connector timeout",
      executionId: "exec_source",
      externalPayloadUrl: null,
      finishedAt: new Date("2026-04-01T10:01:06.000Z"),
      input: { leadId: "lead_1" },
      output: null,
      outputPreview: null,
      outputSize: 0,
      durationMs: 5000,
      errorCode: "CONNECTOR_TIMEOUT",
      startedAt: new Date("2026-04-01T10:01:01.000Z"),
      status: StepResultStatus.FAILED,
      step: { key: "http_step" },
      stepId: "step_http",
      workflowId: "wf_1",
      workflowRevisionId: "rev_source"
    }
  ];

  const restores = [
    ...createSessionStubs(),
    stubMethod(prisma.workflow, "findFirst", () => Promise.resolve({
      id: "wf_1",
      organizationId: "org_1",
      status: "PUBLISHED",
      steps: [
        {
          key: "trigger_step",
          type: "TRIGGER_WEBHOOK"
        },
        {
          key: "http_step",
          type: "HTTP_REQUEST"
        }
      ],
      tenantId: "tenant_1"
    })),
    stubMethod(prisma.workflowRevision, "findFirst", () => Promise.resolve({
      id: "rev_source",
      steps: [
        {
          key: "trigger_step",
          type: "TRIGGER_WEBHOOK"
        },
        {
          key: "http_step",
          type: "HTTP_REQUEST"
        }
      ]
    })),
    stubMethod(prisma.workflowExecution, "findFirst", () => Promise.resolve({
      id: "exec_source",
      status: WorkflowExecutionStatus.FAILED,
      workflowRevisionId: "rev_source"
    })),
    stubMethod(prisma.stepResult, "findFirst", () => Promise.resolve({
      step: { key: "http_step" }
    })),
    stubMethod(prisma.workflowStep, "findFirst", () => Promise.resolve({
      id: "step_http",
      key: "http_step"
    })),
    stubMethod(prisma.stepResult, "findMany", () => Promise.resolve(sourceResults)),
    stubMethod(prisma, "$transaction", async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        stepResult: {
          createMany: (args: { data: Array<Record<string, unknown>> }) => {
            clonedBatches.push(args.data);
            return Promise.resolve({ count: args.data.length });
          }
        },
        workflowExecution: {
          create: (args: { data: Record<string, unknown> }) => {
            const record = {
              ...args.data,
              id: "exec_new"
            };
            createdExecutions.push(record);
            return Promise.resolve(record);
          }
        }
      })
    ),
    stubMethod(workflowQueueAdapter, "enqueueWorkflowExecution", (_config: unknown, payload: unknown) => {
      enqueuedJobs.push(payload as Record<string, unknown>);
      return Promise.resolve();
    })
  ];

  try {
    const app = createApp({
      config: createTestApiConfig(),
      shouldExposeDocs: false
    });

    const response = await request(app)
      .post("/api/v1/workflows/wf_1/run")
      .set("Authorization", "Bearer atk_admin")
      .set("x-csrf-token", "csrf_1")
      .set("Cookie", ["bh360_csrf=csrf_1"])
      .send({
        async: true,
        payload: {
          leadId: "lead_1"
        },
        retry: {
          fromExecutionId: "exec_source"
        }
      })
      .expect(202);

    assert.equal(response.body.status, "accepted");
    assert.equal(response.body.executionId, "exec_new");

    assert.equal(createdExecutions.length, 1);
    assert.equal(createdExecutions[0]?.resumedFromExecutionId, "exec_source");
    assert.equal(createdExecutions[0]?.depth, 1);

    assert.equal(clonedBatches.length, 1);
    assert.equal(clonedBatches[0]?.length, 1);
    assert.equal(clonedBatches[0]?.[0]?.stepId, "step_trigger");

    assert.equal(enqueuedJobs.length, 1);
    assert.equal(enqueuedJobs[0]?.stepKey, "http_step");
    assert.equal(enqueuedJobs[0]?.executionId, "exec_new");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflow lineage endpoint returns origin and resumed executions as a tree", async () => {
  const restores = [
    ...createSessionStubs(),
    stubMethod(prisma.workflow, "findFirst", () => Promise.resolve({
      id: "wf_1",
      tenantId: "tenant_1"
    })),
    stubMethod(prisma.workflowExecution, "findMany", () => Promise.resolve([
      {
        completedAt: new Date("2026-04-01T10:03:00.000Z"),
        depth: 2,
        durationMs: 180000,
        errorMessage: "connector timeout",
        id: "exec_a",
        resumedFromExecutionId: null,
        startedAt: new Date("2026-04-01T10:00:00.000Z"),
        status: WorkflowExecutionStatus.FAILED
      },
      {
        completedAt: new Date("2026-04-01T10:05:00.000Z"),
        depth: 2,
        durationMs: 120000,
        errorMessage: null,
        id: "exec_b",
        resumedFromExecutionId: "exec_a",
        startedAt: new Date("2026-04-01T10:03:30.000Z"),
        status: WorkflowExecutionStatus.SUCCESS
      }
    ]))
  ];

  try {
    const app = createApp({
      config: createTestApiConfig(),
      shouldExposeDocs: false
    });

    const response = await request(app)
      .get("/api/v1/workflows/wf_1/executions/lineage")
      .set("Authorization", "Bearer atk_admin")
      .expect(200);

    assert.equal(response.body.workflowId, "wf_1");
    assert.equal(response.body.lineage.length, 1);
    assert.equal(response.body.lineage[0]?.id, "exec_a");
    assert.equal(response.body.lineage[0]?.children.length, 1);
    assert.equal(response.body.lineage[0]?.children[0]?.id, "exec_b");
    assert.equal(response.body.lineage[0]?.children[0]?.resumedFromExecutionId, "exec_a");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

