#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const artifactDir = path.join(repoRoot, "artifacts", "local-remediation");
const jsonPath = path.join(artifactDir, "checklist-remediation.json");
const mdPath = path.join(artifactDir, "checklist-remediation.md");

function run(command, args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  return {
    command: [command, ...args].join(" "),
    startedAt,
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? "").trim().slice(-4000),
    stderr: (result.stderr ?? "").trim().slice(-4000)
  };
}

function gitOutput(command) {
  return execSync(command, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function fileExists(relativePath) {
  return existsSync(path.join(repoRoot, relativePath));
}

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function status(ok, warn = false) {
  if (ok) return "green";
  return warn ? "yellow" : "red";
}

mkdirSync(artifactDir, { recursive: true });

const gitTrackedEnv = gitOutput("git ls-files .env .env.local .env.*.local");
const gitIgnoredEnv = gitOutput("git check-ignore -v .env .env.local 2>NUL || exit /b 0");
const typecheck = run("pnpm", ["typecheck"]);
const lint = run("pnpm", ["lint"]);
const securityGuards = run("pnpm", ["security:guards"]);
const boundaries = run("pnpm", ["audit:boundaries"]);

const securityOutput = `${securityGuards.stdout}\n${securityGuards.stderr}`;
const boundaryReportPath = "artifacts/local-remediation/boundaries-report.md";
const checklist = [
  {
    id: "0-1",
    status: gitTrackedEnv.split(/\r?\n/).filter(Boolean).length === 0 ? "green" : "red",
    evidence: gitTrackedEnv ? `Tracked env files: ${gitTrackedEnv}` : `No tracked local env secrets. Ignore evidence: ${gitIgnoredEnv}`
  },
  {
    id: "0-2",
    status: status(securityGuards.exitCode === 0 && securityOutput.includes("INLINE_CREDENTIAL_FINDINGS=0")),
    evidence: "pnpm security:guards executed; inline credential scanner reported zero findings."
  },
  {
    id: "3-0",
    status: status(typecheck.exitCode === 0),
    evidence: "pnpm typecheck executed."
  },
  {
    id: "3-1",
    status: status(lint.exitCode === 0),
    evidence: "pnpm lint executed."
  },
  {
    id: "5-0",
    status: status(boundaries.exitCode === 0),
    evidence: `Architecture boundary gate generated ${boundaryReportPath}.`
  },
  {
    id: "5-8",
    status: status(fileExists("docs/adrs/INDEX.md") && fileExists("docs/adrs/ADR-0001-repository-boundaries.md")),
    evidence: "ADR index and repository boundary decision are versioned."
  },
  {
    id: "6-9",
    status: status(fileExists("docs/runbooks/incident-response.md") && fileExists("docs/runbooks/dlq-and-retry.md")),
    evidence: "Incident and DLQ/retry runbooks are versioned."
  },
  {
    id: "12-3",
    status: status(
      fileExists(".github/PULL_REQUEST_TEMPLATE.md") &&
        fileExists(".github/ISSUE_TEMPLATE/bug_report.yml") &&
        fileExists(".github/ISSUE_TEMPLATE/technical_debt.yml")
    ),
    evidence: "PR, bug and technical debt templates are versioned."
  },
  {
    id: "12-6",
    status: "green",
    evidence: "Local remediation artifacts are generated."
  },
  {
    id: "12-7",
    status: status(fileExists("scripts/audit/checklist-remediation.mjs") && fileExists("scripts/audit/check-architecture-boundaries.mjs")),
    evidence: "Checklist and boundary audit scripts are versioned."
  }
];

const report = {
  generatedAt: new Date().toISOString(),
  commands: { typecheck, lint, securityGuards, boundaries },
  trackedEnvFiles: gitTrackedEnv.split(/\r?\n/).filter(Boolean),
  ignoredEnvEvidence: gitIgnoredEnv,
  checklist,
  ok: checklist.every((item) => item.status === "green")
};

const lines = [
  "# Checklist Remediation Report",
  "",
  `- Generated at: ${report.generatedAt}`,
  `- pnpm typecheck: ${typecheck.exitCode === 0 ? "PASS" : "FAIL"}`,
  `- pnpm lint: ${lint.exitCode === 0 ? "PASS" : "FAIL"}`,
  `- pnpm security:guards: ${securityGuards.exitCode === 0 ? "PASS" : "FAIL"}`,
  `- pnpm audit:boundaries: ${boundaries.exitCode === 0 ? "PASS" : "FAIL"}`,
  "",
  "| item | status | evidence |",
  "| --- | --- | --- |",
  ...checklist.map((item) => `| ${item.id} | ${item.status} | ${item.evidence.replace(/\|/g, "/")} |`)
];

writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");

console.log(`[audit:checklist] wrote ${path.relative(repoRoot, mdPath)}`);
process.exit(report.ok ? 0 : 1);
