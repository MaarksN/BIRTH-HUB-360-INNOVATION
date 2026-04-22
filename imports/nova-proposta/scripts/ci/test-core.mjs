#!/usr/bin/env node

import path from "node:path";

import { portableNodeExecutable, projectRoot, run, runPnpm } from "./shared.mjs";

const coreTestWorkspaces = [
  { cwd: "packages/config", args: ["src/**/*.test.ts"] },
  { cwd: "packages/workflows-core", args: ["test/**/*.test.ts"] },
  { cwd: "packages/agents-core", args: ["src/**/*.test.ts"] },
  { cwd: "packages/shared-types", args: ["src/**/*.test.ts"] },
  { cwd: "packages/auth", args: ["src/__tests__/*.test.ts"] },
  { cwd: "packages/logger", args: ["src/**/*.test.ts"] },
  { cwd: "apps/web", args: ["tests/**/*.test.ts"] },
  { cwd: "packages/database", args: ["src/**/*.test.ts", "test/**/*.test.ts"] },
  { cwd: "packages/queue", args: ["tests/**/*.test.ts"] },
  { cwd: "packages/utils", args: ["src/__tests__/*.test.ts"] },
  { cwd: "apps/api", args: ["tests/**/*.test.ts", "test/**/*.test.ts"] },
  { cwd: "packages/testing", args: ["src/**/*.test.ts"] },
  { cwd: "apps/worker", args: ["src/**/*.test.ts", "test/**/*.test.ts"] }
];

// Several workspace tests import package surfaces that resolve through each
// package's dist/ entrypoint, so we bootstrap the minimal dependency chain once
// before the workspace test sweep.
for (const workspacePackage of [
  "@birthub/shared-types",
  "@birthub/queue",
  "@birthub/database"
]) {
  runPnpm(["--filter", workspacePackage, "build"]);
}

for (const workspace of coreTestWorkspaces) {
  run(portableNodeExecutable, ["--import", "tsx", "--test", ...workspace.args], {
    cwd: path.join(projectRoot, workspace.cwd)
  });
}
