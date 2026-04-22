#!/usr/bin/env node
// @ts-nocheck
//
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const summaryPath = path.join(repoRoot, "artifacts", "quality", "mutation-summary.json");
const reportPath = path.join(repoRoot, "docs", "evidence", "mutation-report.md");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

if (!existsSync(summaryPath)) {
  throw new Error(`[mutation-check] missing summary at ${summaryPath}`);
}

if (!existsSync(reportPath)) {
  throw new Error(`[mutation-check] missing markdown report at ${reportPath}`);
}

const summary = readJson(summaryPath);

console.log(
  `[mutation-check] score=${summary.score}% threshold=${summary.thresholds?.break ?? "unknown"} total=${summary.counts?.total ?? 0}`
);
console.log(`[mutation-check] summary=${path.relative(repoRoot, summaryPath)}`);
console.log(`[mutation-check] report=${path.relative(repoRoot, reportPath)}`);

if (summary.ok !== true) {
  throw new Error("[mutation-check] committed mutation evidence is below the configured break threshold.");
}
