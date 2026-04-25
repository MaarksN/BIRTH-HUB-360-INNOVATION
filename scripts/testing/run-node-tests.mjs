import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const separatorIndex = process.argv.indexOf("--");
const searchArgs = (
  separatorIndex === -1 ? process.argv.slice(2) : process.argv.slice(2, separatorIndex)
).filter(Boolean);
const nodeTestArgs = separatorIndex === -1 ? [] : process.argv.slice(separatorIndex + 1);

const roots = searchArgs.length > 0 ? searchArgs : ["src", "test", "tests"];
const testFiles = [];

function collectTestFiles(candidatePath) {
  const absolutePath = path.resolve(process.cwd(), candidatePath);
  if (!existsSync(absolutePath)) {
    return;
  }

  const stat = statSync(absolutePath);
  if (stat.isFile()) {
    if (/\.test\.ts$/u.test(absolutePath)) {
      testFiles.push(absolutePath);
    }
    return;
  }

  if (!stat.isDirectory()) {
    return;
  }

  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    if (entry.name === "dist" || entry.name === "node_modules" || entry.name === ".turbo") {
      continue;
    }
    collectTestFiles(path.join(absolutePath, entry.name));
  }
}

for (const root of roots) {
  collectTestFiles(root);
}

const uniqueTestFiles = [...new Set(testFiles)].sort();
if (uniqueTestFiles.length === 0) {
  console.log("No tests found");
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...nodeTestArgs, ...uniqueTestFiles],
  {
    stdio: "inherit",
    windowsHide: true
  }
);

process.exitCode = result.status ?? 1;
