import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { QuotaResourceType, prisma } from "@birthub/database";

import { consumeSharedAgentBudget } from "./runner.shared.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original = Reflect.get(target, key);
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

void test("consumeSharedAgentBudget increments quota with an atomic limit predicate", async () => {
  let updateArgs: unknown = null;
  const restores = [
    stubMethod(prisma.quotaUsage, "findFirst", mock.fn(async () => ({
      count: 4,
      id: "quota_1",
      limit: 5
    }))),
    stubMethod(prisma.quotaUsage, "updateMany", mock.fn(async (args: unknown) => {
      updateArgs = args;
      return {
        count: 1
      };
    }))
  ];

  try {
    await consumeSharedAgentBudget("tenant_1");

    assert.deepEqual(updateArgs, {
      data: {
        count: {
          increment: 1
        }
      },
      where: {
        count: {
          lt: 5
        },
        id: "quota_1"
      }
    });
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("consumeSharedAgentBudget rejects when a concurrent worker already consumed the final slot", async () => {
  const restores = [
    stubMethod(prisma.quotaUsage, "findFirst", mock.fn(async () => ({
      count: 4,
      id: "quota_1",
      limit: 5
    }))),
    stubMethod(prisma.quotaUsage, "updateMany", mock.fn(async () => ({
      count: 0
    })))
  ];

  try {
    await assert.rejects(
      () => consumeSharedAgentBudget("tenant_1"),
      /SHARED_RATE_LIMIT_EXCEEDED/
    );
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("consumeSharedAgentBudget does not mutate when the quota is already exhausted", async () => {
  const updateMany = mock.fn(async () => ({
    count: 1
  }));
  const restores = [
    stubMethod(prisma.quotaUsage, "findFirst", mock.fn(async () => ({
      count: 5,
      id: "quota_1",
      limit: 5
    }))),
    stubMethod(prisma.quotaUsage, "updateMany", updateMany)
  ];

  try {
    await assert.rejects(
      () => consumeSharedAgentBudget("tenant_1"),
      /SHARED_RATE_LIMIT_EXCEEDED/
    );
    assert.equal(updateMany.mock.callCount(), 0);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("consumeSharedAgentBudget keeps the lookup scoped to the active tenant and AI prompt quota", async () => {
  let findArgs: unknown = null;
  const restores = [
    stubMethod(prisma.quotaUsage, "findFirst", mock.fn(async (args: unknown) => {
      findArgs = args;
      return null;
    }))
  ];

  try {
    await consumeSharedAgentBudget("tenant_1");

    assert.deepEqual(findArgs, {
      orderBy: {
        resetAt: "desc"
      },
      where: {
        resourceType: QuotaResourceType.AI_PROMPTS,
        tenantId: "tenant_1"
      }
    });
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
