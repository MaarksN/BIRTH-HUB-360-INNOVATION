#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const artifactDir = path.join(repoRoot, "artifacts", "local-remediation");
const jsonPath = path.join(artifactDir, "type-quality-report.json");
const mdPath = path.join(artifactDir, "type-quality-report.md");
const sourceExtensions = new Set([".ts", ".tsx"]);
const ignored = /(^|\/)(dist|build|coverage|node_modules|artifacts|imports)\//;

function gitFiles() {
  const raw = execSync("git ls-files", { cwd: repoRoot, encoding: "utf8" }).trim();
  return raw ? raw.split(/\r?\n/).filter(Boolean) : [];
}

function shouldScan(file) {
  return /^(apps|packages|scripts)\//.test(file) && sourceExtensions.has(path.extname(file)) && !ignored.test(file);
}

function lineMatches(text, pattern) {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, text: line }))
    .filter((row) => pattern.test(row.text));
}

function countDecisionPoints(text) {
  return (text.match(/\b(if|for|while|case|catch)\b|\?\s|&&|\|\|/g) ?? []).length + 1;
}

const files = gitFiles().filter(shouldScan);
const rows = files.map((file) => {
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  const suppressions = lineMatches(text, /@ts-(ignore|expect-error)/);
  const unjustifiedSuppressions = suppressions.filter(
    (row) => !/@ts-(ignore|expect-error)\s+.{12,}/.test(row.text)
  );
  return {
    file,
    lines: text.split(/\r?\n/).length,
    explicitAny: lineMatches(text, /(^|[^A-Za-z0-9_])(:\s*any\b|\bas\s+any\b)/).length,
    suppressions: suppressions.length,
    unjustifiedSuppressions: unjustifiedSuppressions.length,
    decisionPoints: countDecisionPoints(text)
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  scannedFiles: rows.length,
  totals: {
    explicitAny: rows.reduce((sum, row) => sum + row.explicitAny, 0),
    suppressions: rows.reduce((sum, row) => sum + row.suppressions, 0),
    unjustifiedSuppressions: rows.reduce((sum, row) => sum + row.unjustifiedSuppressions, 0),
    filesOver500Lines: rows.filter((row) => row.lines > 500).length,
    filesOver80DecisionPoints: rows.filter((row) => row.decisionPoints > 80).length
  },
  hotspots: rows
    .filter((row) => row.explicitAny || row.suppressions || row.lines > 500 || row.decisionPoints > 80)
    .sort((a, b) =>
      b.unjustifiedSuppressions - a.unjustifiedSuppressions ||
      b.suppressions - a.suppressions ||
      b.explicitAny - a.explicitAny ||
      b.lines - a.lines
    )
    .slice(0, 40)
};

const lines = [
  "# Type Quality Report",
  "",
  `- Generated at: ${report.generatedAt}`,
  `- Scanned files: ${report.scannedFiles}`,
  `- Explicit any / as any: ${report.totals.explicitAny}`,
  `- TS suppressions: ${report.totals.suppressions}`,
  `- Unjustified TS suppressions: ${report.totals.unjustifiedSuppressions}`,
  `- Files over 500 lines: ${report.totals.filesOver500Lines}`,
  `- Files over 80 decision points: ${report.totals.filesOver80DecisionPoints}`,
  "",
  "## Hotspots",
  "",
  "| file | lines | explicit any | suppressions | unjustified suppressions | decision points |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...report.hotspots.map(
    (row) => `| ${row.file} | ${row.lines} | ${row.explicitAny} | ${row.suppressions} | ${row.unjustifiedSuppressions} | ${row.decisionPoints} |`
  )
];

mkdirSync(artifactDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");
console.log(`[audit:type-quality] wrote ${path.relative(repoRoot, mdPath)}`);
