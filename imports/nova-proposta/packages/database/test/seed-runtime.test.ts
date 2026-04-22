import assert from "node:assert/strict";
import test from "node:test";

import type { PrismaClient } from "@prisma/client";

import {
  main,
  resolveSeedRuntimeOptions,
  runSeedRuntime,
  type SeedRuntimeDependencies
} from "../prisma/seed.js";

function createDependencies(overrides: Partial<SeedRuntimeDependencies> = {}) {
  const calls = {
    createClient: 0,
    createTenant: 0,
    disconnect: 0,
    runSafeProfile: [] as string[],
    seedPlans: 0,
    wipeDatabase: 0
  };

  const prisma = {
    $disconnect: () => {
      calls.disconnect += 1;
      return Promise.resolve();
    }
  } as PrismaClient;

  const dependencies: SeedRuntimeDependencies = {
    createClient: () => {
      calls.createClient += 1;
      return prisma;
    },
    createTenant: () => {
      calls.createTenant += 1;
      return Promise.resolve();
    },
    logger: {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined
    },
    runSafeProfile: (_prisma, profile) => {
      calls.runSafeProfile.push(profile);
      return Promise.resolve();
    },
    seedPlans: () => {
      calls.seedPlans += 1;
      return Promise.resolve(new Map([["starter", { id: "plan-starter", limits: {} }]]));
    },
    tenants: [
      {
        agents: [],
        members: [],
        name: "Tenant Alpha",
        planCode: "starter",
        slug: "tenant-alpha"
      }
    ],
    wipeDatabase: () => {
      calls.wipeDatabase += 1;
      return Promise.resolve();
    },
    ...overrides
  };

  return {
    calls,
    dependencies,
    prisma
  };
}

void test("resolveSeedRuntimeOptions defaults to the safe runtime profile", () => {
  assert.deepEqual(resolveSeedRuntimeOptions([], {}), {
    allowDestructiveSeed: false,
    mode: "safe",
    profile: "safe"
  });
});

void test("default-safe seed runtime does not wipe the database and closes PrismaClient", async () => {
  const { calls, dependencies } = createDependencies();

  const exitCode = await main([], {}, dependencies);

  assert.equal(exitCode, 0);
  assert.equal(calls.createClient, 1);
  assert.equal(calls.wipeDatabase, 0);
  assert.equal(calls.seedPlans, 0);
  assert.deepEqual(calls.runSafeProfile, ["development"]);
  assert.equal(calls.disconnect, 1);
});

void test("destructive mode is blocked without explicit environment confirmation", () => {
  assert.throws(
    () => resolveSeedRuntimeOptions(["--profile=destructive", "--mode=destructive"], {}),
    /ALLOW_DESTRUCTIVE_SEED=true/
  );
});

void test("destructive seed runtime only wipes when both profile and env confirmation are explicit", async () => {
  const { calls, dependencies, prisma } = createDependencies();
  const options = resolveSeedRuntimeOptions(
    ["--profile=destructive", "--mode=destructive"],
    { ALLOW_DESTRUCTIVE_SEED: "true" }
  );

  await runSeedRuntime(prisma, options, dependencies);

  assert.equal(calls.wipeDatabase, 1);
  assert.equal(calls.seedPlans, 1);
  assert.equal(calls.createTenant, 1);
  assert.deepEqual(calls.runSafeProfile, []);
});

void test("main closes PrismaClient even when the seed runtime fails", async () => {
  const { calls, dependencies } = createDependencies({
    runSafeProfile: () => Promise.reject(new Error("seed failed"))
  });

  const exitCode = await main([], {}, dependencies);

  assert.equal(exitCode, 1);
  assert.equal(calls.disconnect, 1);
});
