import type { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";

import { createLogger } from "@birthub/logger";

import { tenants as destructiveTenants } from "./seed/data.js";
import { seedPlans, wipeDatabase } from "./seed/helpers.js";
import { createTenant } from "./seed/tenant.js";
import type { SeededPlanMap, TenantSeed } from "./seed/types.js";
import {
  runSeedProfile,
  type SeedProfile as SharedSeedProfile
} from "./seeds/profiles.js";
import { createPrismaClient } from "../src/index.js";

export type SeedMode = "safe" | "destructive";
export type SeedRuntimeProfile = "ci" | "destructive" | "safe" | "smoke" | "staging";
export type SeedRuntimeProfileInput = SeedRuntimeProfile | "development";

export type SeedRuntimeOptions = {
  allowDestructiveSeed: boolean;
  mode: SeedMode;
  profile: SeedRuntimeProfile;
};

type SeedLogger = {
  error: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
};

export type SeedRuntimeDependencies = {
  createClient: () => PrismaClient;
  createTenant: (
    prisma: PrismaClient,
    tenant: TenantSeed,
    planMap: SeededPlanMap
  ) => Promise<void>;
  logger: SeedLogger;
  runSafeProfile: (prisma: PrismaClient, profile: SharedSeedProfile) => Promise<void>;
  seedPlans: (prisma: PrismaClient) => Promise<SeededPlanMap>;
  tenants: TenantSeed[];
  wipeDatabase: (prisma: PrismaClient) => Promise<void>;
};

const DEFAULT_LOGGER = createLogger("db-seed") as SeedLogger;

const DEFAULT_DEPENDENCIES: SeedRuntimeDependencies = {
  createClient: () => createPrismaClient(),
  createTenant,
  logger: DEFAULT_LOGGER,
  runSafeProfile: runSeedProfile,
  seedPlans,
  tenants: destructiveTenants,
  wipeDatabase
};

function readOption(argv: readonly string[], key: string): string | undefined {
  const prefixed = argv.find((argument) => argument.startsWith(`--${key}=`));
  if (prefixed) {
    return prefixed.slice(key.length + 3);
  }

  const optionIndex = argv.findIndex((argument) => argument === `--${key}`);
  if (optionIndex >= 0) {
    return argv[optionIndex + 1];
  }

  return undefined;
}

function normalizeProfile(profile?: string): SeedRuntimeProfile {
  if (!profile || profile === "safe" || profile === "development") {
    return "safe";
  }

  if (
    profile === "ci" ||
    profile === "destructive" ||
    profile === "smoke" ||
    profile === "staging"
  ) {
    return profile;
  }

  throw new Error(
    `Unsupported seed profile '${profile}'. Expected one of: safe, destructive, ci, smoke, staging.`
  );
}

function normalizeMode(mode?: string): SeedMode {
  if (!mode || mode === "safe") {
    return "safe";
  }

  if (mode === "destructive") {
    return mode;
  }

  throw new Error(`Unsupported seed mode '${mode}'. Expected one of: safe, destructive.`);
}

function resolveSafeProfile(profile: Exclude<SeedRuntimeProfile, "destructive">): SharedSeedProfile {
  switch (profile) {
    case "ci":
      return "ci";
    case "safe":
      return "development";
    case "smoke":
      return "smoke";
    case "staging":
      return "staging";
  }
}

export function resolveSeedRuntimeOptions(
  argv: readonly string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env
): SeedRuntimeOptions {
  const profile = normalizeProfile(readOption(argv, "profile"));
  const mode = normalizeMode(readOption(argv, "mode"));
  const allowDestructiveSeed = env.ALLOW_DESTRUCTIVE_SEED === "true";

  if (profile === "destructive" && mode !== "destructive") {
    throw new Error(
      "Destructive seed profile requires '--mode=destructive' and ALLOW_DESTRUCTIVE_SEED=true."
    );
  }

  if (mode === "destructive" && profile !== "destructive") {
    throw new Error("Destructive seed mode requires '--profile=destructive'.");
  }

  if (mode === "destructive" && !allowDestructiveSeed) {
    throw new Error(
      "Destructive seed mode is blocked. Set ALLOW_DESTRUCTIVE_SEED=true to continue."
    );
  }

  return {
    allowDestructiveSeed,
    mode,
    profile
  };
}

export async function runSeedRuntime(
  prisma: PrismaClient,
  options: SeedRuntimeOptions,
  dependencies: SeedRuntimeDependencies = DEFAULT_DEPENDENCIES
): Promise<void> {
  if (options.profile === "destructive") {
    dependencies.logger.warn?.(
      "Running destructive seed profile. Existing database data will be wiped first."
    );

    await dependencies.wipeDatabase(prisma);
    const seededPlans = await dependencies.seedPlans(prisma);

    for (const tenant of dependencies.tenants) {
      await dependencies.createTenant(prisma, tenant, seededPlans);
    }

    return;
  }

  await dependencies.runSafeProfile(prisma, resolveSafeProfile(options.profile));
}

export async function main(
  argv: readonly string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
  dependencies: SeedRuntimeDependencies = DEFAULT_DEPENDENCIES
): Promise<number> {
  const runtimeOptions = resolveSeedRuntimeOptions(argv, env);
  const prisma = dependencies.createClient();

  dependencies.logger.info?.(
    `Starting seed runtime with profile '${runtimeOptions.profile}' in '${runtimeOptions.mode}' mode.`
  );

  try {
    await runSeedRuntime(prisma, runtimeOptions, dependencies);
    dependencies.logger.info?.(
      `Seed runtime completed for profile '${runtimeOptions.profile}'.`
    );
    return 0;
  } catch (error) {
    dependencies.logger.error(error);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

async function runCli(): Promise<void> {
  process.exitCode = await main();
}

const isDirectExecution =
  typeof process.argv[1] === "string" && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  void runCli();
}
