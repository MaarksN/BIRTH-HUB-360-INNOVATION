#!/usr/bin/env node

import path from "node:path";
import { portableNodeExecutable, projectRoot, run } from "./shared.mjs";

const eslintCli = path.join(
  projectRoot,
  "node_modules",
  "eslint",
  "bin",
  "eslint.js"
);

const sharedFlatConfig = path.join(projectRoot, "eslint.config.mjs");

const REQUIRED_LINT_NODE_OPTION = "--max-old-space-size=8192";

function withLintNodeOptions(existingNodeOptions = process.env.NODE_OPTIONS ?? "") {
  if (existingNodeOptions.includes("--max-old-space-size")) {
    return existingNodeOptions;
  }

  return [existingNodeOptions.trim(), REQUIRED_LINT_NODE_OPTION]
    .filter(Boolean)
    .join(" ");
}

const coreLintWorkspaces = [
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

for (const workspace of coreLintWorkspaces) {
  run(portableNodeExecutable, [eslintCli, ".", "--config", sharedFlatConfig], {
    cwd: path.join(projectRoot, workspace),
    env: {
      NODE_OPTIONS: withLintNodeOptions(),
      ESLINT_USE_FLAT_CONFIG: "true"
    }
  });
}
