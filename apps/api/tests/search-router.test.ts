// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import { prisma, Role } from "@birthub/database";
import request from "supertest";

import { createSearchRouter } from "../src/modules/search/router.js";
import {
  createAuthenticatedApiTestApp,
  stubMethod
} from "./http-test-helpers.js";

type SearchResponseBody = {
  groups: Array<{
    id: string;
    items?: Array<{
      href?: string;
    }>;
  }>;
  query: string;
  requestId: string;
};

function createSearchTestApp() {
  return createAuthenticatedApiTestApp({
    contextOverrides: {
      organizationId: "org_product",
      requestId: "req_search",
      role: Role.MEMBER,
      sessionId: "session_product",
      tenantId: "tenant_product",
      tenantSlug: "tenant-product",
      traceId: "trace_search",
      userId: "user_product"
    },
    mountPath: "/api/v1",
    router: createSearchRouter()
  });
}

void test("search router returns tenant-aware grouped results from real backing queries", async () => {
  let workflowWhere: unknown = null;
  let notificationWhere: unknown = null;

  const restores = [
    stubMethod(prisma.workflow, "findMany", (args: { where?: unknown }) => {
      workflowWhere = args.where ?? null;
      return Promise.resolve([
        {
          id: "wf_1",
          name: "Workflow de onboarding",
          status: "PUBLISHED",
          triggerType: "WEBHOOK"
        }
      ]);
    }),
    stubMethod(prisma.conversationThread, "findMany", () =>
      Promise.resolve([
        {
          id: "thread_1",
          messages: [
            {
              contentPreview: "Paciente aguardando retorno"
            }
          ],
          subject: "Retorno onboarding"
        }
      ])
    ),
    stubMethod(prisma.notification, "findMany", (args: { where?: unknown }) => {
      notificationWhere = args.where ?? null;
      return Promise.resolve([
        {
          content: "Workflow de onboarding falhou",
          id: "notif_1",
          type: "workflow_alert"
        }
      ]);
    }),
    stubMethod(prisma.outputArtifact, "findMany", () =>
      Promise.resolve([
        {
          agentId: "agent_1",
          id: "output_1",
          status: "READY",
          type: "executive-report"
        }
      ])
    )
  ];

  try {
    const response = await request(createSearchTestApp())
      .get("/api/v1/search")
      .query({
        q: "onboarding"
      })
      .expect(200);
    const body = response.body as SearchResponseBody;

    assert.deepEqual(workflowWhere, {
      OR: [
        {
          name: {
            contains: "onboarding",
            mode: "insensitive"
          }
        },
        {
          description: {
            contains: "onboarding",
            mode: "insensitive"
          }
        }
      ],
      tenantId: "tenant_product"
    });
    assert.deepEqual(notificationWhere, {
      content: {
        contains: "onboarding",
        mode: "insensitive"
      },
      tenantId: "tenant_product",
      userId: "user_product"
    });
    assert.equal(body.query, "onboarding");
    assert.equal(body.requestId, "req_search");
    assert.deepEqual(
      body.groups.map((group) => group.id),
      ["shortcuts", "workflows", "conversations", "notifications", "reports"]
    );
    assert.equal(body.groups[1]?.items?.[0]?.href, "/workflows/wf_1/edit");
    assert.equal(body.groups[2]?.items?.[0]?.href, "/conversations?thread=thread_1");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("search router serves shortcut-only results for very short queries", async () => {
  const workflowCalls: unknown[] = [];
  const restores = [
    stubMethod(prisma.workflow, "findMany", (args: unknown) => {
      workflowCalls.push(args);
      return Promise.resolve([]);
    })
  ];

  try {
    const response = await request(createSearchTestApp())
      .get("/api/v1/search")
      .query({
        q: "a"
      })
      .expect(200);
    const body = response.body as SearchResponseBody;

    assert.equal(workflowCalls.length, 0);
    assert.deepEqual(
      body.groups.map((group) => group.id),
      ["shortcuts"]
    );
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

