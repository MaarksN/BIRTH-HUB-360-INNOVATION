// 
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { databasePackageRoot } from "./paths.js";

export type CommandResult = {
  code: number;
  output: string;
};

export type CommandSpec = {
  args: string[];
  command: string;
};

export function getPrismaCommand(): CommandSpec {
  return {
    args: [resolve(databasePackageRoot, "node_modules", "prisma", "build", "index.js")],
    command: process.execPath
  };
}

function assertAllowedCommand(command: string): void {
  const normalized = String(command);
  if (normalized === process.execPath) {
    return;
  }

  throw new Error(`runCommand refused command outside the allowlist: ${normalized}`);
}

function quoteWindowsCommandArg(value: string): string {
  if (value.length === 0) {
    return '""';
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

export async function runCommand(
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  }
): Promise<CommandResult> {
  assertAllowedCommand(command);
  return new Promise((resolveResult, reject) => {
    const requiresWindowsCmdWrapper =
      process.platform === "win32" && /\.(cmd|bat)$/iu.test(command);
    const spawnCommand = requiresWindowsCmdWrapper ? process.env.ComSpec ?? "cmd.exe" : command;
    const spawnArgs = requiresWindowsCmdWrapper
      ? ["/d", "/s", "/c", [command, ...args].map(quoteWindowsCommandArg).join(" ")]
      : args;

    // nosemgrep: javascript.lang.security.detect-child-process.detect-child-process -- command is allowlisted to process.execPath for internal migration tooling only.
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: options?.cwd ?? databasePackageRoot,
      env: {
        ...process.env,
        ...options?.env
      },
      stdio: "pipe",
      windowsVerbatimArguments: requiresWindowsCmdWrapper
    });

    let output = "";
    const appendOutput = (chunk: Buffer | string) => {
      output += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    };

    child.stdout.on("data", appendOutput);

    child.stderr.on("data", appendOutput);

    child.on("error", reject);
    child.on("close", (code) => {
      resolveResult({
        code: code ?? 1,
        output
      });
    });
  });
}
