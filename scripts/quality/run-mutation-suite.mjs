// @ts-nocheck
// 
import fs from "node:fs/promises";
import path from "node:path";

import { portableNodeExecutable, run } from "../ci/shared.mjs";

async function pathExists(targetPath) {
  try {
    await fs.lstat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function resolveWorkspaceRoot() {
  if (process.platform !== "win32") {
    return path.resolve(".");
  }

  return path.resolve(path.dirname(process.execPath), "..", "..");
}

async function ensureJunction(targetPath, linkPath) {
  if (await pathExists(linkPath)) {
    return;
  }

  await fs.mkdir(path.dirname(linkPath), { recursive: true });
  await fs.symlink(targetPath, linkPath, "junction");
}

async function ensureSandboxNodeModules() {
  const sandboxRoot = path.resolve(".");
  const workspaceRoot = resolveWorkspaceRoot();

  if (sandboxRoot === workspaceRoot) {
    return;
  }

  const workspaceNodeModules = path.join(workspaceRoot, "node_modules");
  if (!(await pathExists(workspaceNodeModules))) {
    return;
  }

  await ensureJunction(workspaceNodeModules, path.join(sandboxRoot, "node_modules"));

  for (const scope of ["apps", "packages"]) {
    const scopeRoot = path.join(workspaceRoot, scope);
    if (!(await pathExists(scopeRoot))) {
      continue;
    }

    const entries = await fs.readdir(scopeRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const workspacePackageNodeModules = path.join(scopeRoot, entry.name, "node_modules");
      if (!(await pathExists(workspacePackageNodeModules))) {
        continue;
      }

      await ensureJunction(
        workspacePackageNodeModules,
        path.join(sandboxRoot, scope, entry.name, "node_modules")
      );
    }
  }
}

const tasks = [
  {
    label: "@birthub/auth",
    args: ["--import", "tsx", "--test", "packages/auth/src/__tests__/*.test.ts"]
  },
  {
    label: "@birthub/agents-core",
    args: ["--import", "tsx", "--test", "packages/agents-core/src/**/*.test.ts"]
  }
];

if (process.env.MUTATION_INCLUDE_API_AUTH === "1") {
  tasks.push({
    label: "@birthub/api auth",
    args: ["--import", "tsx", "--test", "apps/api/tests/auth.test.ts"]
  });
}

await ensureSandboxNodeModules();

for (const task of tasks) {
  console.log(`[mutation-suite] running ${task.label}`);
  run(portableNodeExecutable, task.args);
}
