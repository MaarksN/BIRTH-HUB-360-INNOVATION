#!/usr/bin/env node
// @ts-nocheck
//
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const mutationReportPath = path.join(repoRoot, "artifacts", "stryker", "mutation.json");
const mutationHtmlPath = path.join(repoRoot, "artifacts", "stryker", "mutation.html");
const summaryPath = path.join(repoRoot, "artifacts", "quality", "mutation-summary.json");
const markdownPath = path.join(repoRoot, "docs", "evidence", "mutation-report.md");
const countedStatuses = [
  "Killed",
  "Timeout",
  "Survived",
  "NoCoverage",
  "CompileError",
  "RuntimeError",
  "Ignored",
  "Pending"
];

function toPosixPath(value) {
  return String(value ?? "").replace(/\\/g, "/");
}

function loadJson(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`[mutation-evidence] failed to read ${label} at ${filePath}: ${error.message}`);
  }
}

function countStatuses(mutants) {
  const counts = Object.fromEntries(countedStatuses.map((status) => [status, 0]));

  for (const mutant of mutants) {
    const status = countedStatuses.includes(mutant.status) ? mutant.status : "Pending";
    counts[status] += 1;
  }

  return counts;
}

function summarizeFile(filePath, payload) {
  const mutants = Array.isArray(payload?.mutants) ? payload.mutants : [];
  const statusCounts = countStatuses(mutants);
  const total = mutants.length;
  const detected = statusCounts.Killed + statusCounts.Timeout;

  return {
    file: toPosixPath(filePath),
    total,
    detected,
    killed: statusCounts.Killed,
    timeout: statusCounts.Timeout,
    survived: statusCounts.Survived,
    noCoverage: statusCounts.NoCoverage,
    errors: statusCounts.CompileError + statusCounts.RuntimeError,
    ignored: statusCounts.Ignored,
    pending: statusCounts.Pending,
    score: total > 0 ? Number(((detected / total) * 100).toFixed(2)) : 0
  };
}

function renderMarkdown(summary) {
  const lines = [
    "# Mutation Report",
    "",
    `- Generated at: ${summary.generatedAt}`,
    `- Source artifact: \`${path.relative(repoRoot, mutationReportPath)}\``,
    `- Source artifact updated at: ${summary.sourceArtifact.updatedAt}`,
    `- HTML report: \`${path.relative(repoRoot, mutationHtmlPath)}\``,
    `- Thresholds: break=${summary.thresholds.break}, low=${summary.thresholds.low}, high=${summary.thresholds.high}`,
    `- Overall score: ${summary.score}% (${summary.ok ? "PASS" : "FAIL"})`,
    `- Mutants: total=${summary.counts.total}, detected=${summary.counts.detected}, survived=${summary.counts.survived}, timeout=${summary.counts.timeout}`,
    "",
    "## Focused Scope",
    "",
    ...summary.scope.map((entry) => `- \`${entry}\``),
    "",
    "## File Scores",
    "",
    "| file | score | total | detected | survived | timeout |",
    "| --- | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const file of summary.files) {
    lines.push(
      `| \`${file.file}\` | ${file.score}% | ${file.total} | ${file.detected} | ${file.survived} | ${file.timeout} |`
    );
  }

  lines.push("", "## Hotspots", "");

  const hotspotLines = summary.hotspots.length
    ? summary.hotspots.map(
        (file) =>
          `- \`${file.file}\`: ${file.score}% com ${file.survived} mutantes sobreviventes${file.timeout > 0 ? ` e ${file.timeout} timeout` : ""}.`
      )
    : ["- Nenhum hotspot abaixo do threshold de break."];

  lines.push(...hotspotLines);

  return `${lines.join("\n")}\n`;
}

const report = loadJson(mutationReportPath, "Stryker report");
const sourceArtifact = statSync(mutationReportPath);
const generatedAt = new Date().toISOString();
const thresholdValues = report.thresholds ?? {};
const thresholds = {
  break: Number(thresholdValues.break ?? 0),
  low: Number(thresholdValues.low ?? 0),
  high: Number(thresholdValues.high ?? 0)
};
const files = Object.entries(report.files ?? {})
  .map(([filePath, payload]) => summarizeFile(filePath, payload))
  .sort((left, right) => left.score - right.score || left.file.localeCompare(right.file));
const counts = files.reduce(
  (accumulator, file) => {
    accumulator.total += file.total;
    accumulator.detected += file.detected;
    accumulator.survived += file.survived;
    accumulator.timeout += file.timeout;
    accumulator.noCoverage += file.noCoverage;
    accumulator.errors += file.errors;
    accumulator.ignored += file.ignored;
    accumulator.pending += file.pending;
    return accumulator;
  },
  {
    total: 0,
    detected: 0,
    survived: 0,
    timeout: 0,
    noCoverage: 0,
    errors: 0,
    ignored: 0,
    pending: 0
  }
);
const score = counts.total > 0 ? Number(((counts.detected / counts.total) * 100).toFixed(2)) : 0;
const summary = {
  generatedAt,
  ok: counts.total > 0 && score >= thresholds.break,
  score,
  thresholds,
  counts,
  scope: (report.config?.mutate ?? []).map((entry) => toPosixPath(entry)),
  files,
  hotspots: files.filter((file) => file.score < thresholds.break),
  sourceArtifact: {
    path: toPosixPath(path.relative(repoRoot, mutationReportPath)),
    updatedAt: sourceArtifact.mtime.toISOString()
  }
};

mkdirSync(path.dirname(summaryPath), { recursive: true });
mkdirSync(path.dirname(markdownPath), { recursive: true });
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
writeFileSync(markdownPath, renderMarkdown(summary), "utf8");

console.log(`[mutation-evidence] source: ${path.relative(repoRoot, mutationReportPath)}`);
console.log(
  `[mutation-evidence] score=${summary.score}% threshold=${summary.thresholds.break} total=${summary.counts.total} detected=${summary.counts.detected} survived=${summary.counts.survived}`
);
console.log(`[mutation-evidence] summary: ${path.relative(repoRoot, summaryPath)}`);
console.log(`[mutation-evidence] report: ${path.relative(repoRoot, markdownPath)}`);

if (!summary.ok) {
  process.exit(1);
}
