import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const runnerAbs = path.join(repoRoot, "scripts", "run-node-tests-if-present.mjs");

const ignoredDirs = new Set([
  ".git",
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
  "imports"
]);

function walk(dir) {
  const out = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }

    if (entry.name === "package.json") {
      out.push(full);
    }
  }

  return out;
}

function isUnixOnlyTestScript(script) {
  if (!script || typeof script !== "string") return false;

  return (
    script.includes("sh -c") ||
    script.includes("bash -c") ||
    script.includes("find src -name") ||
    script.includes("files=$(")
  );
}

function toPosixRelative(fromDir, toFile) {
  let rel = path.relative(fromDir, toFile);
  rel = rel.replaceAll("\\", "/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

const packageFiles = walk(repoRoot);
const changed = [];

for (const pkgFile of packageFiles) {
  const raw = fs.readFileSync(pkgFile, "utf8");
  let pkg;

  try {
    pkg = JSON.parse(raw);
  } catch {
    continue;
  }

  if (!pkg.scripts || !isUnixOnlyTestScript(pkg.scripts.test)) {
    continue;
  }

  const pkgDir = path.dirname(pkgFile);
  const oldScript = pkg.scripts.test;
  const runnerRel = toPosixRelative(pkgDir, runnerAbs);

  pkg.scripts.test = `node ${runnerRel} src`;

  fs.copyFileSync(pkgFile, `${pkgFile}.bak-cross-platform-${Date.now()}`);
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n", "utf8");

  changed.push({
    packageJson: path.relative(repoRoot, pkgFile),
    oldScript,
    newScript: pkg.scripts.test
  });
}

console.log(JSON.stringify({ changed }, null, 2));