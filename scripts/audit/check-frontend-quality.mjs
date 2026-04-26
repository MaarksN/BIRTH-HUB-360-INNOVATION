#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const artifactDir = path.join(repoRoot, "artifacts", "local-remediation");
const jsonPath = path.join(artifactDir, "frontend-quality-report.json");
const mdPath = path.join(artifactDir, "frontend-quality-report.md");

function gitFiles() {
  const raw = execSync("git ls-files apps/web", { cwd: repoRoot, encoding: "utf8" }).trim();
  return raw ? raw.split(/\r?\n/).filter((file) => /\.(tsx|ts)$/.test(file) && !file.includes("/.next/")) : [];
}

function matches(text, pattern) {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, text: line }))
    .filter((row) => pattern.test(row.text));
}

function lineFromIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function hasWrappedLabel(text, inputIndex) {
  const before = text.slice(0, inputIndex);
  const lastOpenLabel = before.lastIndexOf("<label");
  const lastCloseLabel = before.lastIndexOf("</label>");
  if (lastOpenLabel <= lastCloseLabel) return false;

  const nextCloseLabel = text.indexOf("</label>", inputIndex);
  const nextOpenLabel = text.indexOf("<label", inputIndex + 1);
  return nextCloseLabel !== -1 && (nextOpenLabel === -1 || nextCloseLabel < nextOpenLabel);
}

function collectTags(text, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[\\s\\S]*?>`, "gi");
  return [...text.matchAll(pattern)].map((match) => ({
    index: match.index ?? 0,
    line: lineFromIndex(text, match.index ?? 0),
    tag: match[0]
  }));
}

const files = gitFiles();
const findings = [];
for (const file of files) {
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  for (const row of matches(text, /useEffect\s*\(/)) findings.push({ file, line: row.line, rule: "useEffect-review" });
  for (const img of collectTags(text, "img")) {
    if (!/\balt\s*=/.test(img.tag)) findings.push({ file, line: img.line, rule: "img-missing-alt" });
  }
  for (const input of collectTags(text, "input")) {
    const hasAccessibleName = /\b(aria-label|aria-labelledby|id)\s*=/.test(input.tag) || hasWrappedLabel(text, input.index);
    if (!hasAccessibleName) findings.push({ file, line: input.line, rule: "input-needs-label-or-id" });
  }
  for (const row of matches(text, /\.toLocale(String|DateString|TimeString)\s*\(\s*\)/))
    findings.push({ file, line: row.line, rule: "implicit-locale" });
}

const counts = findings.reduce((acc, item) => {
  acc[item.rule] = (acc[item.rule] ?? 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  counts,
  findings: findings.slice(0, 200)
};

const lines = [
  "# Frontend Quality Report",
  "",
  `- Generated at: ${report.generatedAt}`,
  `- Scanned files: ${report.scannedFiles}`,
  "",
  "## Counts",
  "",
  ...Object.entries(counts).map(([rule, count]) => `- ${rule}: ${count}`),
  "",
  "## Findings",
  "",
  ...(report.findings.length
    ? report.findings.map((item) => `- ${item.file}:${item.line} ${item.rule}`)
    : ["- none"])
];

mkdirSync(artifactDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");
console.log(`[audit:frontend] wrote ${path.relative(repoRoot, mdPath)}`);
