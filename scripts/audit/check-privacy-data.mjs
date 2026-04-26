#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const artifactDir = path.join(repoRoot, "artifacts", "local-remediation");
const jsonPath = path.join(artifactDir, "privacy-data-report.json");
const mdPath = path.join(artifactDir, "privacy-data-report.md");
const allowedSyntheticDomains =
  /@((?:[a-z0-9-]+\.)*example\.(?:com|org|net)|(?:[a-z0-9-]+\.)?redacted\.local|(?:[a-z0-9-]+\.)?staging\.birthub\.local|(?:[a-z0-9-]+\.)?test\.local|(?:[a-z0-9-]+\.)?birthub\.local|(?:[a-z0-9-]+\.)?birthhub\.local|(?:[a-z0-9-]+\.)?birthhub\.test|(?:[a-z0-9-]+\.)?birthub\.test|(?:[a-z0-9-]+\.)?birthub\.com|(?:[a-z0-9-]+\.)?birthhub\.com|(?:[a-z0-9-]+\.)?birthhub360\.com|(?:[a-z0-9-]+\.)?nova\.test|(?:[a-z0-9-]+\.)?acme\.com|b\.com|example\.ingest\.sentry\.io)\b/i;

function gitFiles() {
  const raw = execSync("git ls-files", { cwd: repoRoot, encoding: "utf8" }).trim();
  return raw ? raw.split(/\r?\n/).filter(Boolean) : [];
}

function shouldScan(file) {
  return /(\.test\.(ts|tsx|js)|fixture|fixtures|snapshot|snapshots|seed|seeds|\.json$)/i.test(file) &&
    !/(^|\/)(node_modules|dist|build|coverage|artifacts|audit|imports|\.ops|pnpm-lock\.yaml)/.test(file);
}

function isAllowedSyntheticToken(file, token) {
  if (!/\.test\.(ts|tsx|js)$/.test(file)) return false;
  return token.startsWith("sk_test_") || token.startsWith("pk_test_") || token === "sk_live_birthhub360";
}

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const cpfPattern = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
const tokenPattern = /\b(?:sk|pk|ghp|xoxb|ya29|AIza)[A-Za-z0-9_-]{16,}\b/g;

const findings = [];
for (const file of gitFiles().filter(shouldScan)) {
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  const emails = text.match(emailPattern) ?? [];
  for (const email of emails) {
    if (!allowedSyntheticDomains.test(email)) findings.push({ file, type: "email", sample: email });
  }
  for (const cpf of text.match(cpfPattern) ?? []) findings.push({ file, type: "cpf", sample: cpf });
  for (const token of text.match(tokenPattern) ?? []) {
    if (!isAllowedSyntheticToken(file, token)) findings.push({ file, type: "token-like", sample: `${token.slice(0, 8)}...` });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  findings,
  ok: findings.length === 0
};

const lines = [
  "# Privacy Data Report",
  "",
  `- Generated at: ${report.generatedAt}`,
  `- Findings: ${findings.length}`,
  "",
  "## Findings",
  "",
  ...(findings.length ? findings.map((item) => `- ${item.file}: ${item.type} ${item.sample}`) : ["- none"])
];

mkdirSync(artifactDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");
console.log(`[audit:privacy-data] wrote ${path.relative(repoRoot, mdPath)}`);
process.exit(report.ok ? 0 : 1);
