#!/usr/bin/env node
// @ts-nocheck
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "artifacts", "security", "auth-boundary.json");
const textPath = path.join(root, "artifacts", "security", "auth-boundary.txt");
const packageFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const manifestPaths = [
  "apps/api/package.json",
  "apps/web/package.json",
  "apps/worker/package.json",
  "packages/database/package.json"
];
const scanRoots = [
  "apps/api/src",
  "apps/api/tests",
  "apps/web/app",
  "apps/web/components",
  "apps/web/lib",
  "apps/web/tests",
  "apps/worker/src",
  "apps/worker/test",
  "apps/worker/tests",
  "packages/database"
];
const filePattern = /\.(?:[cm]?[jt]sx?)$/iu;
const forbiddenPatterns = [
  /@birthub\/auth/iu,
  /packages\/auth/iu,
  /createAuthService\s*\(/u
];

function statSafe(filePath) {
  try {
    return statSync(filePath);
  } catch {
    return null;
  }
}

function listFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  const files = [];

  if (!statSafe(absoluteDir)?.isDirectory()) {
    return files;
  }

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteDir, entry.name);
    const relativePath = path.relative(root, absolutePath).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".next"].includes(entry.name)) {
        continue;
      }
      files.push(...listFiles(relativePath));
      continue;
    }

    if (entry.isFile() && filePattern.test(entry.name)) {
      files.push(relativePath);
    }
  }

  return files;
}

const manifestViolations = manifestPaths.flatMap((relativePath) => {
  const manifest = JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
  return packageFields
    .filter((field) => Boolean(manifest[field]?.["@birthub/auth"]))
    .map((field) => `${relativePath} references @birthub/auth in ${field}.`);
});

const sourceFiles = scanRoots.flatMap((scanRoot) => listFiles(scanRoot));
const importViolations = sourceFiles.flatMap((relativePath) => {
  const source = readFileSync(path.join(root, relativePath), "utf8");
  return forbiddenPatterns
    .filter((pattern) => pattern.test(source))
    .map((pattern) => `${relativePath} matches forbidden auth boundary pattern ${pattern}.`);
});

const issues = [...manifestViolations, ...importViolations];
const report = {
  checkedAt: new Date().toISOString(),
  issues,
  ok: issues.length === 0,
  scannedFiles: sourceFiles.length,
  scannedManifests: manifestPaths
};

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(
  textPath,
  [
    `Checked at: ${report.checkedAt}`,
    `Scanned manifests: ${manifestPaths.length}`,
    `Scanned files: ${sourceFiles.length}`,
    `Issues: ${issues.length}`,
    ...issues,
    `Status: ${report.ok ? "PASS" : "FAIL"}`
  ].join("\n"),
  "utf8"
);

if (!report.ok) {
  console.error("[auth-boundary] FAILED");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[auth-boundary] ok (${sourceFiles.length} files, ${manifestPaths.length} manifests)`);
}
