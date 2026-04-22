// @ts-nocheck
// 
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const baselinePath = path.join(repoRoot, "artifacts", "quality", "knip-baseline.json");
const artifactDir = path.join(repoRoot, "artifacts", "quality", "dead-code");
const rawReportPath = path.join(artifactDir, "knip-report.raw.json");
const normalizedReportPath = path.join(artifactDir, "knip-report.json");
const markdownReportPath = path.join(repoRoot, "docs", "evidence", "dead-code-report.md");
const categories = [
  "files",
  "dependencies",
  "devDependencies",
  "optionalPeerDependencies",
  "unlisted",
  "binaries",
  "exports",
  "duplicates"
];
const generatedPathPrefixes = [
  "artifacts/",
  "coverage/",
  "logs/",
  "test-results/"
];

function sortUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function toPosixPath(value) {
  return value.replace(/\\/g, "/");
}

function isGeneratedPath(value) {
  const normalizedValue = toPosixPath(value);
  return generatedPathPrefixes.some((prefix) => normalizedValue.startsWith(prefix));
}

function loadJson(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`[dead-code] failed to read ${label} at ${filePath}: ${error.message}`);
  }
}

function loadBaseline() {
  const baseline = loadJson(baselinePath, "baseline");

  return Object.fromEntries(
    categories.map((category) => [category, sortUnique(Array.isArray(baseline[category]) ? baseline[category] : [])])
  );
}

function resolveKnipCliPath() {
  const knipModulePath = require.resolve("knip");
  return path.resolve(path.dirname(knipModulePath), "..", "bin", "knip.js");
}

function runKnip() {
  const knipCliPath = resolveKnipCliPath();
  const result = spawnSync(process.execPath, [knipCliPath, "--config", "knip.json", "--reporter", "json"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  if (result.error) {
    throw new Error(`[dead-code] failed to spawn knip: ${result.error.message}`);
  }

  if (![0, 1].includes(result.status ?? 1)) {
    throw new Error(
      `[dead-code] knip execution failed with exit code ${result.status ?? "unknown"}.\n${result.stderr.trim()}`
    );
  }

  const stdout = result.stdout.trim();
  if (!stdout) {
    throw new Error("[dead-code] knip returned no JSON output.");
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`[dead-code] invalid knip JSON output: ${error.message}`);
  }
}

function collectNamedFindings(issue, key) {
  return (issue[key] ?? [])
    .map((entry) => (typeof entry === "string" ? entry : entry?.name))
    .filter(Boolean)
    .map((name) => `${issue.file}::${name}`);
}

function collectDuplicateFindings(issue) {
  return (issue.duplicates ?? [])
    .map((group) =>
      `${issue.file}::${sortUnique(group.map((entry) => entry?.name).filter(Boolean)).join("|")}`
    )
    .filter((value) => !value.endsWith("::"));
}

function normalizeReport(report) {
  const issues = Array.isArray(report.issues)
    ? report.issues.filter((issue) => !isGeneratedPath(issue.file ?? ""))
    : [];

  return {
    files: sortUnique(Array.isArray(report.files) ? report.files.filter((value) => !isGeneratedPath(value)) : []),
    dependencies: sortUnique(issues.flatMap((issue) => collectNamedFindings(issue, "dependencies"))),
    devDependencies: sortUnique(issues.flatMap((issue) => collectNamedFindings(issue, "devDependencies"))),
    optionalPeerDependencies: sortUnique(
      issues.flatMap((issue) => collectNamedFindings(issue, "optionalPeerDependencies"))
    ),
    unlisted: sortUnique(issues.flatMap((issue) => collectNamedFindings(issue, "unlisted"))),
    binaries: sortUnique(issues.flatMap((issue) => collectNamedFindings(issue, "binaries"))),
    exports: sortUnique(issues.flatMap((issue) => collectNamedFindings(issue, "exports"))),
    duplicates: sortUnique(issues.flatMap((issue) => collectDuplicateFindings(issue)))
  };
}

function diffSnapshot(current, baseline) {
  const regressions = {};
  const improvements = {};

  for (const category of categories) {
    const currentSet = new Set(current[category]);
    const baselineSet = new Set(baseline[category]);

    regressions[category] = current[category].filter((value) => !baselineSet.has(value));
    improvements[category] = baseline[category].filter((value) => !currentSet.has(value));
  }

  return { regressions, improvements };
}

function summarizeCounts(snapshot) {
  return Object.fromEntries(categories.map((category) => [category, snapshot[category].length]));
}

function totalFindings(snapshot) {
  return categories.reduce((total, category) => total + snapshot[category].length, 0);
}

function formatCategoryName(category) {
  return category.replace(/([A-Z])/g, " $1").toLowerCase();
}

function renderMarkdown({ generatedAt, baseline, current, regressions, improvements }) {
  const lines = [
    "# Dead Code Report",
    "",
    `- Generated at: ${generatedAt}`,
    `- Baseline: \`${path.relative(repoRoot, baselinePath)}\``,
    `- Raw report: \`${path.relative(repoRoot, rawReportPath)}\``,
    `- Normalized report: \`${path.relative(repoRoot, normalizedReportPath)}\``,
    "",
    "| category | baseline | current | regressions | improvements |",
    "| --- | ---: | ---: | ---: | ---: |"
  ];

  for (const category of categories) {
    lines.push(
      `| ${formatCategoryName(category)} | ${baseline[category].length} | ${current[category].length} | ${regressions[category].length} | ${improvements[category].length} |`
    );
  }

  const regressionItems = categories.flatMap((category) =>
    regressions[category].map((value) => `- ${category}: \`${value}\``)
  );
  const improvementItems = categories.flatMap((category) =>
    improvements[category].map((value) => `- ${category}: \`${value}\``)
  );

  lines.push("", "## Regressions", "");
  lines.push(...(regressionItems.length > 0 ? regressionItems : ["- none"]));
  lines.push("", "## Improvements", "");
  lines.push(...(improvementItems.length > 0 ? improvementItems : ["- none"]));

  return `${lines.join("\n")}\n`;
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

mkdirSync(artifactDir, { recursive: true });

const baseline = loadBaseline();
const rawReport = runKnip();
const current = normalizeReport(rawReport);
const { regressions, improvements } = diffSnapshot(current, baseline);
const generatedAt = new Date().toISOString();
const hasRegressions = categories.some((category) => regressions[category].length > 0);

writeJson(rawReportPath, rawReport);
writeJson(normalizedReportPath, {
  generatedAt,
  ok: !hasRegressions,
  totals: {
    baseline: totalFindings(baseline),
    current: totalFindings(current)
  },
  counts: {
    baseline: summarizeCounts(baseline),
    current: summarizeCounts(current),
    regressions: summarizeCounts(regressions),
    improvements: summarizeCounts(improvements)
  },
  baseline,
  current,
  regressions,
  improvements
});
writeFileSync(
  markdownReportPath,
  renderMarkdown({ generatedAt, baseline, current, regressions, improvements }),
  "utf8"
);

console.log(`[dead-code] baseline: ${path.relative(repoRoot, baselinePath)}`);
console.log(
  `[dead-code] findings: baseline=${totalFindings(baseline)} current=${totalFindings(current)} regressions=${totalFindings(regressions)} improvements=${totalFindings(improvements)}`
);
console.log(`[dead-code] report: ${path.relative(repoRoot, markdownReportPath)}`);

if (hasRegressions) {
  for (const category of categories) {
    for (const value of regressions[category]) {
      console.error(`[dead-code] regression (${category}): ${value}`);
    }
  }

  process.exit(1);
}

console.log("[dead-code] no regressions against the committed baseline.");
