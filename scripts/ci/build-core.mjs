#!/usr/bin/env node

import { createRequire } from "node:module";
import path from "node:path";

import { portableNodeExecutable, projectRoot, run } from "./shared.mjs";

const typescriptCli = path.join(projectRoot, "node_modules", "typescript", "bin", "tsc");

function resolveWorkspaceCli(workspacePath, specifier) {
  const workspaceDir = path.join(projectRoot, workspacePath);
  const requireFromWorkspace = createRequire(path.join(workspaceDir, "package.json"));
  return requireFromWorkspace.resolve(specifier);
}

const coreBuildWorkspaces = [
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/config"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/shared-types"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/logger"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/database"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/queue"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/utils"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/workflows-core"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/agents-core"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "packages/testing"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "apps/api"
  },
  {
    args: [typescriptCli, "-p", "tsconfig.json"],
    cwd: "apps/worker"
  },
  {
    args: [resolveWorkspaceCli("apps/web", "next/dist/bin/next"), "build", "--webpack"],
    cwd: "apps/web"
  }
];

for (const workspace of coreBuildWorkspaces) {
  run(portableNodeExecutable, workspace.args, {
    cwd: path.join(projectRoot, workspace.cwd)
  });
}
