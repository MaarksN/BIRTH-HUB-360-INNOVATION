import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const startDir = process.argv[2] || "src";
const root = process.cwd();
const fullStart = path.resolve(root, startDir);

const ignoredDirs = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo"
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }

    if (/\.(test|spec)\.tsx?$/.test(entry.name)) {
      out.push(path.relative(root, full));
    }
  }

  return out;
}

const files = walk(fullStart);

if (files.length === 0) {
  console.log("No tests found");
  process.exit(0);
}

console.log(`Running ${files.length} test file(s):`);
for (const file of files) {
  console.log(`- ${file}`);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...files],
  {
    stdio: "inherit",
    shell: false
  }
);

process.exit(result.status ?? 1);