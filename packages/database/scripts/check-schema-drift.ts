// @ts-expect-error TODO: remover suppressão ampla
// 
import { pathToFileURL } from "node:url";

import { createLogger } from "@birthub/logger";

import {
  getSchemaDriftEnvironment,
  shouldRequireSchemaDriftEvidence
} from "./lib/env.js";
import { schemaPath } from "./lib/paths.js";
import { getPrismaCommand } from "./lib/process.js";
import {
  createScriptRuntime,
  type ScriptRuntimeDependencies
} from "./lib/runtime.js";
import { writeTextReport } from "./lib/report.js";

const logger = createLogger("db-check-schema-drift");

type SchemaDriftDependencies = {
  getEnvironment: typeof getSchemaDriftEnvironment;
  getPrismaCommand: typeof getPrismaCommand;
  runtimeDependencies?: Partial<ScriptRuntimeDependencies>;
  shouldRequireSchemaDriftEvidence: typeof shouldRequireSchemaDriftEvidence;
  writeTextReport: typeof writeTextReport;
};

const DEFAULT_DEPENDENCIES: SchemaDriftDependencies = {
  getEnvironment: getSchemaDriftEnvironment,
  getPrismaCommand,
  runtimeDependencies: undefined,
  shouldRequireSchemaDriftEvidence,
  writeTextReport
};

export async function main(
  env: NodeJS.ProcessEnv = process.env,
  dependencies: Partial<SchemaDriftDependencies> = {}
): Promise<number> {
  const resolved = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies
  } satisfies SchemaDriftDependencies;

  const runtime = createScriptRuntime(
    {
      logger,
      name: "db-check-schema-drift",
      reportPath: "f8/schema-drift-report.json"
    },
    {
      env,
      ...(resolved.runtimeDependencies ?? {})
    }
  );

  const environment = resolved.getEnvironment(env);
  const requireEvidence = resolved.shouldRequireSchemaDriftEvidence(env);

  if (!environment.databaseUrl) {
    const reason = requireEvidence
      ? "DATABASE_URL is required for the official schema drift evidence gate."
      : "DATABASE_URL is not configured.";

    if (requireEvidence) {
      const report = await runtime.writeReport("failed", {
        error: new Error(reason),
        extra: {
          ok: false,
          reason,
          skipped: false
        }
      });
      const textPath = await resolved.writeTextReport(
        "f8/schema-drift-report.txt",
        `Schema drift check: FAIL\n\n${reason}`
      );

      logger.info?.(
        `Schema drift check failed.\nArtifacts:\n- f8/schema-drift-report.json\n- ${textPath}\nRun ID: ${report.runId}`
      );
      process.exitCode = 1;
      return 1;
    }

    runtime.skipStep("schema drift diff", {
      reason,
      type: "check"
    });

    const report = await runtime.writeReport("skipped", {
      extra: {
        ok: true,
        reason,
        skipped: true
      }
    });
    const textPath = await resolved.writeTextReport(
      "f8/schema-drift-report.txt",
      "Schema drift check skipped because DATABASE_URL is not configured."
    );

    logger.info?.(
      `Schema drift check skipped.\nArtifacts:\n- f8/schema-drift-report.json\n- ${textPath}\nRun ID: ${report.runId}`
    );
    return 0;
  }

  const prisma = resolved.getPrismaCommand();
  const args = [
    ...prisma.args,
    "migrate",
    "diff",
    "--exit-code",
    "--from-url",
    environment.databaseUrl,
    "--to-schema-datamodel",
    schemaPath
  ];

  if (environment.shadowDatabaseUrl) {
    args.push("--shadow-database-url", environment.shadowDatabaseUrl);
  }

  let result:
    | {
        code: number;
        output: string;
      }
    | undefined;

  try {
    await runtime.recordStep(
      "schema drift diff",
      async () => {
        result = await runtime.executeProcess(prisma.command, args);

        if (result.code !== 0) {
          const error = new Error(`Schema drift detected with exit code ${result.code}.`);
          (error as Error & { exitCode?: number }).exitCode = result.code;
          throw error;
        }
      },
      {
        command: [prisma.command, ...args].join(" "),
        type: "check"
      }
    );

    const text = "Schema drift check: PASS";
    const report = await runtime.writeReport("success", {
      extra: {
        ok: true,
        output: result?.output ?? "",
        skipped: false
      }
    });
    const textPath = await resolved.writeTextReport("f8/schema-drift-report.txt", text);

    logger.info?.(`${text}\n\nArtifacts:\n- f8/schema-drift-report.json\n- ${textPath}\nRun ID: ${report.runId}`);
    return 0;
  } catch (error) {
    const output = result?.output ?? "";
    const text = output
      ? `Schema drift check: FAIL\n\n${output.trim()}`
      : "Schema drift check: FAIL";
    const report = await runtime.writeReport("failed", {
      error,
      extra: {
        ok: false,
        output,
        skipped: false
      }
    });
    const textPath = await resolved.writeTextReport("f8/schema-drift-report.txt", text);

    logger.info?.(`${text}\n\nArtifacts:\n- f8/schema-drift-report.json\n- ${textPath}\nRun ID: ${report.runId}`);
    process.exitCode = 1;
    return 1;
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
