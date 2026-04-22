import { resolve } from "node:path";

import { readRequiredEnv } from "./env.js";
import { databasePackageRoot } from "./paths.js";
import {
  getPrismaCommand,
  type CommandResult,
  type CommandSpec,
  runCommand
} from "./process.js";
import { writeJsonReport } from "./report.js";

type RuntimeLogger = {
  error: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
};

export type ScriptStepStatus = "failed" | "skipped" | "success";
export type ScriptStepType = "check" | "infra" | "migrate" | "seed";
export type ScriptRunStatus = "failed" | "skipped" | "success";

export type ScriptStepReport = {
  command?: string;
  critical: boolean;
  durationMs: number;
  exitCode?: number;
  finishedAt: string;
  name: string;
  reason?: string;
  script?: string;
  startedAt: string;
  status: ScriptStepStatus;
  type: ScriptStepType;
};

export type ScriptRunReport = {
  error?: {
    message: string;
    name: string;
  };
  finishedAt: string;
  runId: string;
  script: string;
  startedAt: string;
  status: ScriptRunStatus;
  steps: ScriptStepReport[];
};

type RuntimeDependencies = {
  createRunId: (script: string, startedAt: Date) => string;
  env: NodeJS.ProcessEnv;
  getPrismaCommand: () => CommandSpec;
  now: () => Date;
  runCommand: (
    command: string,
    args: string[],
    options?: {
      cwd?: string;
      env?: NodeJS.ProcessEnv;
    }
  ) => Promise<CommandResult>;
  writeJsonReport: <T>(relativePath: string, payload: T) => Promise<string>;
};

export type ScriptRuntimeDependencies = RuntimeDependencies;

const DEFAULT_DEPENDENCIES: RuntimeDependencies = {
  createRunId: (script, startedAt) => `${script}-${startedAt.toISOString().replace(/[:.]/g, "-")}`,
  env: process.env,
  getPrismaCommand,
  now: () => new Date(),
  runCommand,
  writeJsonReport
};

function serializeError(error: unknown): { message: string; name: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name
    };
  }

  return {
    message: String(error),
    name: "Error"
  };
}

export function createScriptRuntime(
  config: {
    logger: RuntimeLogger;
    name: string;
    reportPath?: string;
  },
  dependencies: Partial<RuntimeDependencies> = {}
) {
  const resolved = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies
  } satisfies RuntimeDependencies;

  const startedAt = resolved.now();
  const runId = resolved.createRunId(config.name, startedAt);
  const steps: ScriptStepReport[] = [];

  async function recordStep<T>(
    name: string,
    runner: () => Promise<T>,
    metadata: {
      command?: string;
      critical?: boolean;
      script?: string;
      type: ScriptStepType;
    }
  ): Promise<T> {
    const stepStartedAt = resolved.now();
    const critical = metadata.critical ?? true;

    try {
      const result = await runner();

      const successStep: ScriptStepReport = {
        critical,
        durationMs: resolved.now().getTime() - stepStartedAt.getTime(),
        finishedAt: resolved.now().toISOString(),
        name,
        startedAt: stepStartedAt.toISOString(),
        status: "success",
        type: metadata.type
      };

      if (metadata.command !== undefined) {
        successStep.command = metadata.command;
      }

      if (metadata.script !== undefined) {
        successStep.script = metadata.script;
      }

      steps.push(successStep);

      return result;
    } catch (error) {
      const failureStep: ScriptStepReport = {
        critical,
        durationMs: resolved.now().getTime() - stepStartedAt.getTime(),
        finishedAt: resolved.now().toISOString(),
        name,
        startedAt: stepStartedAt.toISOString(),
        status: "failed",
        type: metadata.type
      };

      if (metadata.command !== undefined) {
        failureStep.command = metadata.command;
      }

      const exitCode =
        typeof (error as { exitCode?: unknown })?.exitCode === "number"
          ? (error as { exitCode?: number }).exitCode
          : undefined;

      if (exitCode !== undefined) {
        failureStep.exitCode = exitCode;
      }

      if (metadata.script !== undefined) {
        failureStep.script = metadata.script;
      }

      steps.push(failureStep);

      throw error;
    }
  }

  function skipStep(
    name: string,
    metadata: {
      command?: string;
      critical?: boolean;
      reason: string;
      script?: string;
      type: ScriptStepType;
    }
  ): void {
    const stepTimestamp = resolved.now();

    const skippedStep: ScriptStepReport = {
      critical: metadata.critical ?? true,
      durationMs: 0,
      finishedAt: stepTimestamp.toISOString(),
      name,
      reason: metadata.reason,
      startedAt: stepTimestamp.toISOString(),
      status: "skipped",
      type: metadata.type
    };

    if (metadata.command !== undefined) {
      skippedStep.command = metadata.command;
    }

    if (metadata.script !== undefined) {
      skippedStep.script = metadata.script;
    }

    steps.push(skippedStep);
  }

  function requireEnv(key: string): string {
    return readRequiredEnv(resolved.env, key, config.name);
  }

  async function executeProcess(
    command: string,
    args: string[],
    options?: {
      cwd?: string;
      env?: NodeJS.ProcessEnv;
    }
  ): Promise<CommandResult> {
    const result = await resolved.runCommand(command, args, options);
    process.stdout.write(result.output);
    return result;
  }

  async function runProcessStep(
    name: string,
    command: string,
    args: string[],
    options: {
      acceptedExitCodes?: number[];
      cwd?: string;
      critical?: boolean;
      env?: NodeJS.ProcessEnv;
      script?: string;
      type: ScriptStepType;
    }
  ): Promise<CommandResult> {
    return recordStep(
      name,
      async () => {
        const result = await executeProcess(command, args, options);
        const acceptedExitCodes = options.acceptedExitCodes ?? [0];

        if (!acceptedExitCodes.includes(result.code)) {
          const error = new Error(`${name} failed with exit code ${result.code}.`);
          (error as Error & { exitCode?: number }).exitCode = result.code;
          throw error;
        }

        return result;
      },
      {
        command: [command, ...args].join(" "),
        ...(options.critical !== undefined ? { critical: options.critical } : {}),
        ...(options.script !== undefined ? { script: options.script } : {}),
        type: options.type
      }
    );
  }

  async function runNodeScriptStep(
    name: string,
    scriptName: string,
    options: {
      critical?: boolean;
      env?: NodeJS.ProcessEnv;
      type: ScriptStepType;
    }
  ): Promise<CommandResult> {
    const scriptPath = resolve(databasePackageRoot, "scripts", scriptName);

    return runProcessStep(name, process.execPath, ["--import", "tsx", scriptPath], {
      cwd: databasePackageRoot,
      script: scriptName,
      ...(options.critical !== undefined ? { critical: options.critical } : {}),
      ...(options.env !== undefined ? { env: options.env } : {}),
      type: options.type
    });
  }

  async function runPrismaStep(
    name: string,
    args: string[],
    options: {
      acceptedExitCodes?: number[];
      critical?: boolean;
      env?: NodeJS.ProcessEnv;
      type: ScriptStepType;
    }
  ): Promise<CommandResult> {
    const prisma = resolved.getPrismaCommand();

    return runProcessStep(name, prisma.command, [...prisma.args, ...args], {
      cwd: databasePackageRoot,
      ...(options.acceptedExitCodes !== undefined
        ? { acceptedExitCodes: options.acceptedExitCodes }
        : {}),
      ...(options.critical !== undefined ? { critical: options.critical } : {}),
      ...(options.env !== undefined ? { env: options.env } : {}),
      type: options.type
    });
  }

  function buildReport(
    status: ScriptRunStatus,
    options?: {
      error?: unknown;
      extra?: Record<string, unknown>;
    }
  ): ScriptRunReport & Record<string, unknown> {
    return {
      ...(options?.extra ?? {}),
      ...(options?.error ? { error: serializeError(options.error) } : {}),
      finishedAt: resolved.now().toISOString(),
      runId,
      script: config.name,
      startedAt: startedAt.toISOString(),
      status,
      steps: [...steps]
    };
  }

  async function writeReport(
    status: ScriptRunStatus,
    options?: {
      error?: unknown;
      extra?: Record<string, unknown>;
    }
  ): Promise<ScriptRunReport & Record<string, unknown>> {
    const report = buildReport(status, options);
    await resolved.writeJsonReport(config.reportPath ?? `scripts/${config.name}.json`, report);
    return report;
  }

  async function run(handler: () => Promise<void>): Promise<ScriptRunReport & Record<string, unknown>> {
    try {
      await handler();
      return await writeReport("success");
    } catch (error) {
      const report = await writeReport("failed", { error });
      config.logger.error(error);
      process.exitCode = 1;
      return report;
    }
  }

  return {
    buildReport,
    executeProcess,
    getRunId: () => runId,
    recordStep,
    requireEnv,
    run,
    runNodeScriptStep,
    runPrismaStep,
    runProcessStep,
    skipStep,
    writeReport
  };
}
