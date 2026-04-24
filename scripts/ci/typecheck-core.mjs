#!/usr/bin/env node

import path from "node:path";

import { portableNodeExecutable, projectRoot, run, runPnpm } from "./shared.mjs";

const typescriptCli = path.join(projectRoot, "node_modules", "typescript", "bin", "tsc");

const coreTypecheckWorkspaces = [
  "packages/config",
  "packages/workflows-core",
  "packages/agents-core",
  "packages/shared-types",
  "packages/auth",
  "packages/logger",
  "apps/web",
  "packages/database",
  "packages/queue",
  "packages/utils",
  "apps/api",
  "packages/testing",
  "apps/worker"
];

// packages/testing imports the published database surface, so the lane must
// materialize the database package before invoking raw tsc in each workspace.
runPnpm(["--filter", "@birthub/database", "build"]);

for (const workspacePath of coreTypecheckWorkspaces) {
  run(portableNodeExecutable, [typescriptCli, "-p", "tsconfig.json", "--noEmit"], {
    cwd: path.join(projectRoot, workspacePath)
  });
}
