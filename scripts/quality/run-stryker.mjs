// @ts-nocheck
// 
import path from "node:path";
import { createRequire } from "node:module";

import { portableNodeExecutable, run } from "../ci/shared.mjs";

const require = createRequire(import.meta.url);

function resolveStrykerCliPath() {
  const strykerPackagePath = require.resolve("@stryker-mutator/core/package.json");
  return path.resolve(path.dirname(strykerPackagePath), "bin", "stryker.js");
}

const args = process.argv.slice(2);

run(portableNodeExecutable, [resolveStrykerCliPath(), ...(args.length > 0 ? args : ["run"])]);
