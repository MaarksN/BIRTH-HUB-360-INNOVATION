// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import {
  listRetentionPolicies,
  runRetentionSweep
} from "../src/modules/privacy/retention.service.js";

const LAWFUL_BASIS = {
  LEGAL_OBLIGATION: "LEGAL_OBLIGATION",
  LEGITIMATE_INTEREST: "LEGITIMATE_INTEREST"
} as const;

const RETENTION_ACTION = {
  ANONYMIZE: "ANONYMIZE"
} as const;

const RETENTION_DATA_CATEGORY = {
  OUTPUT_ARTIFACTS: "OUTPUT_ARTIFACTS",
  SUSPENDED_USERS: "SUSPENDED_USERS"
} as const;

const RETENTION_EXECUTION_MODE = {
  DRY_RUN: "DRY_RUN"
} as const;

function stubMethod(target: Record<string, unknown>, key: string, value: unknown): () => void {
  const original = target[key];
  target[key] = value;
  return () => {
    target[key] = original;
  };
}

function createPolicy(id: string, organizationId: string, dataCategory: string) {
  return {
    action: RETENTION_ACTION.ANONYMIZE,
    createdAt: new Date("2026-04-07T00:00:00.000Z"),
    dataCategory,
    enabled: true,
    id,
    legalBasis: LAWFUL_BASIS.LEGITIMATE_INTEREST,
    metadata: null,
    organizationId,
    retentionDays: 30,
    tenantId: "tenant_alpha",
    updatedAt: new Date("2026-04-07T00:00:00.000Z")
  };
}

const testConfig = {
  AUTH_ARGON2_MEMORY_KIB: 19_456,
  AUTH_ARGON2_PARALLELISM: 1,
  AUTH_ARGON2_PASSES: 2
} as Parameters<typeof runRetentionSweep>[0]["config"];

void test("listRetentionPolicies paginates policy lookups for the organization", async () => {
  const organization = {
    id: "org_alpha",
    tenantId: "tenant_alpha"
  };
  const policyCalls: Array<Record<string, unknown>> = [];
  const originalRetentionPolicyModel = Reflect.get(prisma, "dataRetentionPolicy");

  Reflect.set(prisma, "dataRetentionPolicy", {
    findMany: (args: Record<string, unknown>) => {
      policyCalls.push(args);
      return Promise.resolve(policyPages[policyPageIndex++] ?? []);
    },
    upsert: () => Promise.resolve({})
  });

  const policyPages = [
    Array.from({ length: 25 }, (_, index) =>
      createPolicy(
        `policy_${index.toString().padStart(3, "0")}`,
        organization.id,
        RETENTION_DATA_CATEGORY.OUTPUT_ARTIFACTS
      )
    ),
    [createPolicy("policy_025", organization.id, RETENTION_DATA_CATEGORY.SUSPENDED_USERS)]
  ];
  let policyPageIndex = 0;
  const restores = [
    stubMethod(prisma.organization as unknown as Record<string, unknown>, "findFirst", () =>
      Promise.resolve(organization)
    ),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", () => Promise.resolve([])),
    (() => {
      const original = Reflect.get(prisma, "dataRetentionExecution");
      Reflect.set(prisma, "dataRetentionExecution", {
        findMany: () => Promise.resolve([])
      });
      return () => Reflect.set(prisma, "dataRetentionExecution", original);
    })()
  ];

  try {
    const result = await listRetentionPolicies({
      organizationReference: organization.id
    });
    const typedResult = result as {
      items: Array<{
        id: string;
      }>;
    };

    assert.equal(policyCalls.length, 2);
    assert.equal(policyCalls[0]?.take, 25);
    assert.deepEqual(policyCalls[1]?.cursor, {
      id: "policy_024"
    });
    assert.equal(policyCalls[1]?.skip, 1);
    assert.equal(typedResult.items.length, 26);
    assert.deepEqual(
      typedResult.items.map((item) => item.id).slice(-2),
      ["policy_024", "policy_025"]
    );
  } finally {
    restores.reverse().forEach((restore) => restore());
    Reflect.set(prisma, "dataRetentionPolicy", originalRetentionPolicyModel);
  }
});

void test("runRetentionSweep paginates organizations before iterating the sweep", async () => {
  const organizationCalls: Array<Record<string, unknown>> = [];
  const originalRetentionPolicyModel = Reflect.get(prisma, "dataRetentionPolicy");

  Reflect.set(prisma, "dataRetentionPolicy", {
    findMany: () => Promise.resolve([]),
    upsert: () => Promise.resolve({})
  });

  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    id: `org_${index.toString().padStart(3, "0")}`,
    tenantId: `tenant_${index.toString().padStart(3, "0")}`
  }));
  const secondPage = [
    {
      id: "org_100",
      tenantId: "tenant_100"
    }
  ];
  let organizationPageIndex = 0;
  const restores = [
    stubMethod(prisma.organization as unknown as Record<string, unknown>, "findMany", (args: Record<string, unknown>) => {
      organizationCalls.push(args);
      return Promise.resolve(organizationPageIndex++ === 0 ? firstPage : secondPage);
    }),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", () => Promise.resolve([]))
  ];

  try {
    const results = await runRetentionSweep({
      config: testConfig,
      mode: RETENTION_EXECUTION_MODE.DRY_RUN
    });

    assert.deepEqual(results, []);
    assert.equal(organizationCalls.length, 2);
    assert.equal(organizationCalls[0]?.take, 100);
    assert.deepEqual(organizationCalls[1]?.cursor, {
      id: "org_099"
    });
    assert.equal(organizationCalls[1]?.skip, 1);
  } finally {
    restores.reverse().forEach((restore) => restore());
    Reflect.set(prisma, "dataRetentionPolicy", originalRetentionPolicyModel);
  }
});

void test("runRetentionSweep paginates suspended users in dry-run mode", async () => {
  const organization = {
    id: "org_alpha",
    tenantId: "tenant_alpha"
  };
  const userCalls: Array<Record<string, unknown>> = [];
  const originalRetentionPolicyModel = Reflect.get(prisma, "dataRetentionPolicy");
  const originalRetentionExecutionModel = Reflect.get(prisma, "dataRetentionExecution");

  Reflect.set(prisma, "dataRetentionPolicy", {
    findMany: () =>
      Promise.resolve([
        createPolicy("policy_suspended", organization.id, RETENTION_DATA_CATEGORY.SUSPENDED_USERS)
      ]),
    upsert: () => Promise.resolve({})
  });

  Reflect.set(prisma, "dataRetentionExecution", {
    create: () =>
      Promise.resolve({
        id: `execution_${executionCount++}`
      })
  });

  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    id: `user_${index.toString().padStart(3, "0")}`
  }));
  const secondPage = [
    {
      id: "user_100"
    }
  ];
  let executionCount = 0;
  let userPageIndex = 0;
  const restores = [
    stubMethod(prisma.organization as unknown as Record<string, unknown>, "findMany", () =>
      Promise.resolve([organization])
    ),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", () => Promise.resolve([])),
    stubMethod(prisma.user as unknown as Record<string, unknown>, "findMany", (args: Record<string, unknown>) => {
      userCalls.push(args);
      return Promise.resolve(userPageIndex++ === 0 ? firstPage : secondPage);
    }),
    stubMethod(prisma.auditLog as unknown as Record<string, unknown>, "create", () =>
      Promise.resolve({})
    )
  ];

  try {
    const results = await runRetentionSweep({
      config: testConfig,
      mode: RETENTION_EXECUTION_MODE.DRY_RUN
    });

    assert.equal(userCalls.length, 2);
    assert.equal(userCalls[0]?.take, 100);
    assert.deepEqual(userCalls[1]?.cursor, {
      id: "user_099"
    });
    assert.equal(userCalls[1]?.skip, 1);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.affectedCount, 0);
    assert.equal(results[0]?.scannedCount, 101);
    assert.equal(results[0]?.dataCategory, RETENTION_DATA_CATEGORY.SUSPENDED_USERS);
  } finally {
    restores.reverse().forEach((restore) => restore());
    Reflect.set(prisma, "dataRetentionPolicy", originalRetentionPolicyModel);
    Reflect.set(prisma, "dataRetentionExecution", originalRetentionExecutionModel);
  }
});

