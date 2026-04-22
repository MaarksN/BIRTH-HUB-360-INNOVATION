// @ts-expect-error TODO: remover suppressão ampla
import assert from "node:assert/strict";
import test from "node:test";

import { prisma, Role, WorkflowTriggerType } from "@birthub/database";
import { workflowCanvasSchema } from "@birthub/workflows-core";
import request from "supertest";

import { createWorkflowsRouter } from "../src/modules/workflows/router.js";
import {
  createAuthenticatedApiTestApp,
  stubMethod
} from "./http-test-helpers.js";
import { createTestApiConfig } from "./test-config.js";

function createWorkflowCanvas() {
  return workflowCanvasSchema.parse({
    steps: [
      {
        config: {
          method: "POST",
          path: "/webhooks/trigger/onboarding"
        },
        isTrigger: true,
        key: "trigger_webhook",
        name: "Webhook Trigger",
        type: "TRIGGER_WEBHOOK"
      }
    ],
    transitions: []
  });
}

function createWorkflowsTestApp() {
  return createAuthenticatedApiTestApp({
    contextOverrides: {
      role: Role.ADMIN
    },
    router: createWorkflowsRouter(createTestApiConfig())
  });
}

void test("workflows router lists revisions for the active tenant", async () => {
  const expectedItems = [
    {
      createdAt: "2026-04-09T12:00:00.000Z",
      definition: createWorkflowCanvas(),
      id: "rev_2",
      version: 2
    }
  ];
  let receivedOrganizationLookup: unknown = null;
  let receivedRevisionLookup: unknown = null;
  const restores = [
    stubMethod(prisma.organization, "findFirst", (args: unknown) => {
      receivedOrganizationLookup = args;
      return Promise.resolve({
        id: "org_1",
        tenantId: "tenant_1"
      });
    }),
    stubMethod(prisma.workflowRevision, "findMany", (args: unknown) => {
      receivedRevisionLookup = args;
      return Promise.resolve(expectedItems);
    })
  ];

  try {
    const response = await request(createWorkflowsTestApp())
      .get("/api/v1/workflows/wf_1/revisions")
      .expect(200);

    assert.deepEqual(receivedOrganizationLookup, {
      where: {
        OR: [{ id: "tenant_1" }, { tenantId: "tenant_1" }]
      }
    });
    assert.deepEqual(receivedRevisionLookup, {
      orderBy: [
        {
          version: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: 100,
      where: {
        tenantId: "tenant_1",
        workflowId: "wf_1"
      }
    });
    assert.deepEqual(response.body, {
      items: expectedItems,
      requestId: "req_1",
      workflowId: "wf_1"
    });
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflows router reverts a revision using the authenticated tenant scope", async () => {
  const workflowCanvas = createWorkflowCanvas();
  let organizationLookupCount = 0;
  let workflowFindFirstCount = 0;
  let receivedRevisionLookup: unknown = null;
  let receivedTransactionUpdate: unknown = null;
  let receivedTransactionCreate: unknown = null;
  let receivedTransitionDelete: unknown = null;
  let receivedStepDelete: unknown = null;
  const receivedStepCreates: unknown[] = [];
  let transitionCreateCount = 0;
  const restores = [
    stubMethod(prisma.organization, "findFirst", () => {
      organizationLookupCount += 1;
      return Promise.resolve({
        id: "org_1",
        tenantId: "tenant_1"
      });
    }),
    stubMethod(prisma.workflow, "findFirst", (_args: unknown) => {
      workflowFindFirstCount += 1;

      if (workflowFindFirstCount === 1) {
        return Promise.resolve({
          definition: workflowCanvas,
          executions: [],
          id: "wf_1",
          organizationId: "org_1",
          status: "PUBLISHED",
          steps: [],
          tenantId: "tenant_1",
          transitions: [],
          triggerType: WorkflowTriggerType.MANUAL
        });
      }

      return Promise.resolve({
        definition: workflowCanvas,
        executions: [],
        id: "wf_1",
        name: "Onboarding Workflow",
        organizationId: "org_1",
        status: "DRAFT",
        steps: [],
        tenantId: "tenant_1",
        transitions: [],
        triggerType: WorkflowTriggerType.MANUAL
      });
    }),
    stubMethod(prisma.workflowRevision, "findUnique", (args: unknown) => {
      receivedRevisionLookup = args;
      return Promise.resolve({
        definition: workflowCanvas,
        tenantId: "tenant_1",
        version: 3,
        workflowId: "wf_1"
      });
    }),
    stubMethod(prisma, "$transaction", async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
      return callback({
        workflow: {
          update: async (args: unknown) => {
            receivedTransactionUpdate = args;
            return {
              cronExpression: null,
              id: "wf_1",
              organizationId: "org_1",
              tenantId: "tenant_1",
              triggerType: WorkflowTriggerType.MANUAL,
              version: 3
            };
          }
        },
        workflowRevision: {
          create: async (args: unknown) => {
            receivedTransactionCreate = args;
            return {};
          }
        },
        workflowStep: {
          create: async (args: unknown) => {
            receivedStepCreates.push(args);
            return {
              id: `step_${receivedStepCreates.length}`
            };
          },
          deleteMany: async (args: unknown) => {
            receivedStepDelete = args;
            return {};
          }
        },
        workflowTransition: {
          create: async () => {
            transitionCreateCount += 1;
            return {};
          },
          deleteMany: async (args: unknown) => {
            receivedTransitionDelete = args;
            return {};
          }
        }
      });
    })
  ];

  try {
    const response = await request(createWorkflowsTestApp())
      .post("/api/v1/workflows/wf_1/revert")
      .send({
        version: 3
      })
      .expect(200);

    assert.equal(organizationLookupCount, 1);
    assert.equal(workflowFindFirstCount, 2);
    assert.deepEqual(receivedRevisionLookup, {
      where: {
        workflowId_version: {
          version: 3,
          workflowId: "wf_1"
        }
      }
    });
    assert.deepEqual(receivedTransactionUpdate, {
      data: {
        archivedAt: null,
        definition: workflowCanvas,
        publishedAt: null,
        status: "DRAFT",
        version: {
          increment: 1
        }
      },
      where: {
        id: "wf_1"
      }
    });
    assert.deepEqual(receivedTransactionCreate, {
      data: {
        definition: workflowCanvas,
        organizationId: "org_1",
        tenantId: "tenant_1",
        version: 3,
        workflowId: "wf_1"
      }
    });
    assert.deepEqual(receivedStepCreates, [
      {
        data: {
          config: {
            method: "POST",
            path: "/webhooks/trigger/onboarding"
          },
          isTrigger: true,
          key: "trigger_webhook",
          name: "Webhook Trigger",
          organizationId: "org_1",
          tenantId: "tenant_1",
          type: "TRIGGER_WEBHOOK",
          workflowId: "wf_1"
        }
      }
    ]);
    assert.equal(transitionCreateCount, 0);
    assert.deepEqual(receivedTransitionDelete, {
      where: {
        workflowId: "wf_1"
      }
    });
    assert.deepEqual(receivedStepDelete, {
      where: {
        workflowId: "wf_1"
      }
    });
    assert.equal(response.body.requestId, "req_1");
    assert.equal(response.body.workflow.id, "wf_1");
    assert.equal(response.body.workflow.status, "DRAFT");
    assert.equal(response.body.workflow.name, "Onboarding Workflow");
    assert.ok(response.body.workflow.stepLint);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflows router returns not found when reverting an unknown workflow", async () => {
  const restores = [
    stubMethod(prisma.organization, "findFirst", () =>
      Promise.resolve({
        id: "org_1",
        tenantId: "tenant_1"
      })
    ),
    stubMethod(prisma.workflow, "findFirst", () => Promise.resolve(null))
  ];

  try {
    const response = await request(createWorkflowsTestApp())
      .post("/api/v1/workflows/wf_missing/revert")
      .send({
        version: 3
      })
      .expect(404);

    assert.equal(response.body.status, 404);
    assert.equal(response.body.title, "Not Found");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflows router returns not found when the requested revision does not exist", async () => {
  const workflowCanvas = createWorkflowCanvas();
  const restores = [
    stubMethod(prisma.organization, "findFirst", () =>
      Promise.resolve({
        id: "org_1",
        tenantId: "tenant_1"
      })
    ),
    stubMethod(prisma.workflow, "findFirst", () =>
      Promise.resolve({
        definition: workflowCanvas,
        executions: [],
        id: "wf_1",
        organizationId: "org_1",
        status: "PUBLISHED",
        steps: [],
        tenantId: "tenant_1",
        transitions: [],
        triggerType: WorkflowTriggerType.MANUAL
      })
    ),
    stubMethod(prisma.workflowRevision, "findUnique", () => Promise.resolve(null))
  ];

  try {
    const response = await request(createWorkflowsTestApp())
      .post("/api/v1/workflows/wf_1/revert")
      .send({
        version: 99
      })
      .expect(404);

    assert.equal(response.body.status, 404);
    assert.equal(response.body.title, "Not Found");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("workflows router rejects invalid revert payloads", async () => {
  const response = await request(createWorkflowsTestApp())
    .post("/api/v1/workflows/wf_1/revert")
    .send({
      version: 0
    })
    .expect(400);

  assert.equal(response.body.status, 400);
  assert.equal(response.body.title, "Bad Request");
});

