#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";

import { buildEnv, portableNodeExecutable, projectRoot } from "./shared.mjs";

const [targetScript, ...targetArgs] = process.argv.slice(2);

if (!targetScript) {
  throw new Error("Usage: node scripts/ci/run-with-portable-node.mjs <script> [...args]");
}

const resolvedScript = path.isAbsolute(targetScript)
  ? targetScript
  : path.join(projectRoot, targetScript);

const result = spawnSync(portableNodeExecutable, [resolvedScript, ...targetArgs], {
  cwd: projectRoot,
  env: buildEnv(),
  stdio: "inherit"
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
