// @ts-expect-error TODO: remover suppressão ampla
// 
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { createLogger } from "@birthub/logger";

import { databasePackageRoot, schemaPath } from "./lib/paths.js";
import {
  createScriptRuntime,
  type ScriptRuntimeDependencies
} from "./lib/runtime.js";

const logger = createLogger("db-validate-migrations-on-test-db");

export type ValidationSeedProfile = "ci" | "safe" | "smoke" | "staging";

type ValidationDependencies = {
  runtimeDependencies?: Partial<ScriptRuntimeDependencies>;
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

export function looksDisposableDatabase(url: string): boolean {
  return /(localhost|127\.0\.0\.1|shadow|test|validation|staging)/i.test(url);
}

export function assertValidationEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const isCi = env.CI === "true";
  const nodeEnvironment = env.NODE_ENV?.trim().toLowerCase();

  if (!isCi && nodeEnvironment !== "test") {
    throw new Error(
      "validate-migrations-on-test-db can only run in CI or with NODE_ENV=test."
    );
  }
}

export function resolveValidationSeedProfile(
  argv: readonly string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env
): ValidationSeedProfile {
  const explicitProfile = readOption(argv, "seed-profile") ?? env.SEED_PROFILE?.trim();

  if (!explicitProfile) {
    throw new Error(
      "Validation seed profile must be provided via --seed-profile=<profile> or SEED_PROFILE."
    );
  }

  if (
    explicitProfile !== "ci" &&
    explicitProfile !== "safe" &&
    explicitProfile !== "smoke" &&
    explicitProfile !== "staging"
  ) {
    throw new Error(
      `Unsupported validation seed profile '${explicitProfile}'. Expected one of: safe, ci, smoke, staging.`
    );
  }

  return explicitProfile;
}

export async function main(
  argv: readonly string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
  dependencies: ValidationDependencies = {}
): Promise<number> {
  const runtime = createScriptRuntime(
    {
      logger,
      name: "db-validate-migrations-on-test-db"
    },
    {
      env,
      ...(dependencies.runtimeDependencies ?? {})
    }
  );

  const report = await runtime.run(async () => {
    const databaseUrl = runtime.requireEnv("DATABASE_URL");

    await runtime.recordStep(
      "validate execution environment",
      () => {
        assertValidationEnvironment(env);
        return Promise.resolve();
      },
      {
        type: "infra"
      }
    );

    await runtime.recordStep(
      "validate destructive target",
      () => {
        if (
          !looksDisposableDatabase(databaseUrl) &&
          env.ALLOW_DESTRUCTIVE_DB_VALIDATION !== "true"
        ) {
          throw new Error(
            "Refusing to reset a non-disposable database. Set ALLOW_DESTRUCTIVE_DB_VALIDATION=true only on dedicated validation databases."
          );
        }
        return Promise.resolve();
      },
      {
        type: "infra"
      }
    );

    const seedProfile = await runtime.recordStep<ValidationSeedProfile>(
      "resolve validation seed profile",
      () => Promise.resolve(resolveValidationSeedProfile(argv, env)),
      {
        type: "seed"
      }
    );

    await runtime.runPrismaStep(
      "prisma migrate reset",
      [
        "migrate",
        "reset",
        "--force",
        "--skip-seed",
        "--schema",
        schemaPath
      ],
      {
        type: "migrate"
      }
    );

    await runtime.runProcessStep(
      "seed validation database",
      process.execPath,
      [
        "--import",
        "tsx",
        resolve(databasePackageRoot, "prisma", "seed.ts"),
        `--profile=${seedProfile}`
      ],
      {
        cwd: databasePackageRoot,
        script: "prisma/seed.ts",
        type: "seed"
      }
    );

    await runtime.runNodeScriptStep(
      "post migration checklist",
      "post-migration-checklist.ts",
      {
        type: "check"
      }
    );
  });

  return report.status === "success" ? 0 : 1;
}

async function runCli(): Promise<void> {
  process.exitCode = await main();
}

const isDirectExecution =
  typeof process.argv[1] === "string" && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  void runCli();
}
