// @ts-nocheck
//
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const summaryPath = path.join(repoRoot, "artifacts", "coverage", "summary.json");
const moduleCoveragePath = path.join(repoRoot, "artifacts", "testing", "module-coverage.json");
const outputPath = path.join(repoRoot, "docs", "evidence", "test-coverage-dashboard.md");

function readJson(filePath) {
  const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function loadSummary() {
  return readJson(summaryPath);
}

function loadModuleCoverageSnapshot() {
  if (!existsSync(moduleCoveragePath)) {
    return null;
  }

  return readJson(moduleCoveragePath);
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function renderThresholds(thresholds) {
  if (!thresholds) {
    return "none";
  }

  return [
    `lines ${thresholds.lines}%`,
    `branches ${thresholds.branches}%`,
    `functions ${thresholds.functions}%`,
    `statements ${thresholds.statements}%`
  ].join(" | ");
}

function renderAlerts(alerts) {
  return Array.isArray(alerts) && alerts.length > 0 ? alerts.join("; ") : "none";
}

function hasZeroCoverageSurface(summary) {
  return (summary.surfaces ?? []).some((surface) => {
    const coverage = surface.coverage ?? surface.metrics ?? {};

    return ["lines", "branches", "functions", "statements"].every(
      (metric) => Number(coverage[metric] ?? 0) === 0
    );
  });
}

function renderSnapshotSufficiency(snapshot) {
  if (!snapshot) {
    return "MISSING";
  }

  return snapshot.sufficient === false ? "INSUFFICIENT" : "SUFFICIENT";
}

function resolveCoverageGateStatus(summary, snapshot) {
  if (summary.ok !== true) {
    return "FAIL";
  }

  if (hasZeroCoverageSurface(summary)) {
    return "FAIL";
  }

  return "PASS";
}

function renderSurface(surface) {
  const coverage = surface.coverage ?? surface.metrics ?? {};
  const alerts = surface.alerts ?? surface.issues;

  return [
    `## ${surface.label}`,
    "",
    `- Lines: ${formatPercent(coverage.lines)}`,
    `- Branches: ${formatPercent(coverage.branches)}`,
    `- Functions: ${formatPercent(coverage.functions)}`,
    `- Statements: ${formatPercent(coverage.statements)}`,
    `- Command: \`${surface.command}\``,
    `- Thresholds: ${renderThresholds(surface.thresholds)}`,
    `- Alerts: ${renderAlerts(alerts)}`,
    ""
  ].join("\n");
}

export function renderCoverageDashboard(summary, snapshot = null) {
  const coverageGateStatus = resolveCoverageGateStatus(summary, snapshot);
  const lines = [
    "# Test Coverage Dashboard",
    "",
    `- Generated at: ${summary.generatedAt}`,
    `- Surfaces: ${summary.surfaces.length}`,
    `- Instrumented coverage status: ${summary.ok ? "PASS" : "FAIL"}`,
    `- Supplemental traceability mode: ${snapshot?.mode ?? "missing"}`,
    `- Supplemental traceability sufficiency: ${renderSnapshotSufficiency(snapshot)}`,
    `- Coverage gate status: ${coverageGateStatus}`,
    "- Coverage gate rule: FAIL when instrumented thresholds fail or any official surface reports 0.00%; supplemental traceability remains informational evidence.",
    ""
  ];

  for (const surface of summary.surfaces) {
    lines.push(renderSurface(surface));
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function main() {
  const summary = loadSummary();
  const moduleCoverageSnapshot = loadModuleCoverageSnapshot();
  const markdown = renderCoverageDashboard(summary, moduleCoverageSnapshot);

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, "utf8");
  console.log(`[coverage:dashboard] rendered ${path.relative(repoRoot, outputPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
