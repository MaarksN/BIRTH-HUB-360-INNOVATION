#!/usr/bin/env node
// @ts-nocheck
//
import fs from "node:fs";
import { spawnSync } from "node:child_process";

import { buildEnv, projectRoot } from "./shared.mjs";

const gates = [];
const rawMinimumScore = process.env.RELEASE_SCORECARD_MIN_SCORE ?? "100";
const minimumScore = Number.parseInt(rawMinimumScore, 10);
const markdownOutputPath = "artifacts/release/scorecard.md";
const jsonOutputPath = "artifacts/release/scorecard.json";

function normalizeEvidence(evidence) {
  return [...new Set((Array.isArray(evidence) ? evidence : [evidence]).filter(Boolean))];
}

function gate(name, pass, detail, evidence = []) {
  gates.push({
    detail,
    evidence: normalizeEvidence(evidence),
    name,
    pass
  });
}

function runNodeScript(relativePath, args = [], options = {}) {
  const commandArgs = options.useTsx ? ["--import", "tsx", relativePath, ...args] : [relativePath, ...args];
  return spawnSync(process.execPath, commandArgs, {
    cwd: projectRoot,
    encoding: "utf8",
    env: buildEnv(),
    stdio: "pipe"
  });
}

function readJsonIfExists(relativePath) {
  if (!fs.existsSync(relativePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(relativePath, "utf8"));
  } catch (error) {
    return {
      __parseError: error instanceof Error ? error.message : String(error)
    };
  }
}

function formatEvidenceMarkdown(evidence) {
  return evidence.length > 0 ? evidence.map((item) => `\`${item}\``).join(", ") : "-";
}

function detailForCheck(report, id, fallbackDetail) {
  return report?.checks?.find((check) => check.id === id)?.detail ?? fallbackDetail;
}

try {
  const workspaceAudit = runNodeScript("scripts/ci/workspace-audit.mjs");
  gate(
    "Workspace audit",
    (workspaceAudit.status ?? 1) === 0,
    (workspaceAudit.status ?? 1) === 0
      ? "Workspace contract matches the canonical core lane"
      : "Workspace audit failed",
    ["scripts/ci/workspace-audit.mjs"]
  );

  const doctor = runNodeScript("scripts/ci/monorepo-doctor.mjs");
  gate(
    "Monorepo doctor",
    (doctor.status ?? 1) === 0,
    (doctor.status ?? 1) === 0
      ? "No critical findings in the canonical go-live scope"
      : "Critical findings found",
    ["scripts/ci/monorepo-doctor.mjs"]
  );
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  gate("Workspace audit", false, detail, ["scripts/ci/workspace-audit.mjs"]);
  gate("Monorepo doctor", false, detail, ["scripts/ci/monorepo-doctor.mjs"]);
}

const hasSecurityReport = fs.existsSync("docs/security/security-coverage-report.md");
gate(
  "Security baseline report",
  hasSecurityReport,
  hasSecurityReport ? "Report present" : "Missing docs/security/security-coverage-report.md",
  ["docs/security/security-coverage-report.md"]
);

const hasMigrationsLock = fs.existsSync("packages/database/prisma/migrations/migration_lock.toml");
gate(
  "Schema migration lock",
  hasMigrationsLock,
  hasMigrationsLock ? "Prisma lock present" : "Prisma migration lock missing",
  ["packages/database/prisma/migrations/migration_lock.toml"]
);

const hasSloDoc = fs.existsSync("docs/OBSERVABILIDADE_E_SLOS.md");
gate(
  "SLO baseline",
  hasSloDoc,
  hasSloDoc ? "SLO documentation present" : "Missing SLO document",
  ["docs/OBSERVABILIDADE_E_SLOS.md"]
);

const hasMutationSourceArtifact = fs.existsSync("artifacts/stryker/mutation.json");
const mutationEvidenceRun = hasMutationSourceArtifact
  ? runNodeScript("scripts/quality/generate-mutation-evidence.mjs")
  : null;
const mutationSummary = readJsonIfExists("artifacts/quality/mutation-summary.json");
const mutationSummaryReadable =
  mutationSummary && !mutationSummary.__parseError ? mutationSummary : null;
gate(
  "Mutation lane",
  mutationSummaryReadable?.ok === true &&
    (!hasMutationSourceArtifact || (mutationEvidenceRun?.status ?? 1) === 0),
  mutationSummaryReadable
    ? `Score ${mutationSummaryReadable.score}% vs threshold ${mutationSummaryReadable.thresholds.break} on ${mutationSummaryReadable.counts.total} mutants`
    : mutationSummary?.__parseError
      ? `Mutation summary unreadable: ${mutationSummary.__parseError}`
      : "Missing artifacts/quality/mutation-summary.json",
  [
    "artifacts/quality/mutation-summary.json",
    "docs/evidence/mutation-report.md",
    ...(hasMutationSourceArtifact ? ["artifacts/stryker/mutation.json"] : [])
  ]
);

const deadCodeRun = runNodeScript("scripts/quality/check-dead-code.mjs");
const deadCodeSummary = readJsonIfExists("artifacts/quality/dead-code/knip-report.json");
const deadCodeReadable = deadCodeSummary && !deadCodeSummary.__parseError ? deadCodeSummary : null;
gate(
  "Dead code regression",
  (deadCodeRun.status ?? 1) === 0 && deadCodeReadable?.ok === true,
  deadCodeReadable
    ? `Current=${deadCodeReadable.totals.current}, regressions=${Object.values(
        deadCodeReadable.counts?.regressions ?? {}
      ).reduce((sum, value) => sum + value, 0)}`
    : deadCodeSummary?.__parseError
      ? `Dead code report unreadable: ${deadCodeSummary.__parseError}`
      : "Missing artifacts/quality/dead-code/knip-report.json",
  [
    "artifacts/quality/dead-code/knip-report.json",
    "docs/evidence/dead-code-report.md",
    "artifacts/quality/knip-baseline.json"
  ]
);

const rollbackEvidence = readJsonIfExists("artifacts/release/production-rollback-evidence.json");
const rollbackEvidenceReadable = rollbackEvidence && !rollbackEvidence.__parseError ? rollbackEvidence : null;
gate(
  "Rollback evidence",
  rollbackEvidenceReadable?.ok === true,
  rollbackEvidenceReadable
    ? rollbackEvidenceReadable.summary ??
      `Rollback rehearsal evidence recorded for ${rollbackEvidenceReadable.target} at ${rollbackEvidenceReadable.checkedAt}`
    : rollbackEvidence?.__parseError
      ? `Rollback evidence unreadable: ${rollbackEvidence.__parseError}`
      : "Missing artifacts/release/production-rollback-evidence.json.",
  ["artifacts/release/production-rollback-evidence.json"]
);

if (!Number.isInteger(minimumScore) || minimumScore < 0 || minimumScore > 100) {
  gate(
    "Minimum score threshold",
    false,
    `Invalid RELEASE_SCORECARD_MIN_SCORE='${rawMinimumScore}' (expected integer 0-100)`
  );
}

const passedGates = gates.filter((entry) => entry.pass).length;
const totalGates = gates.length;
const score = totalGates === 0 ? 0 : Math.round((passedGates / totalGates) * 100);
const thresholdPass = score >= minimumScore;
gate(
  "Score threshold",
  thresholdPass,
  thresholdPass
    ? `Score ${score} meets minimum ${minimumScore}`
    : `Score ${score} is below minimum ${minimumScore}`
);

const payload = {
  gates,
  generatedAt: new Date().toISOString(),
  minimumScore,
  passedGates,
  score,
  totalGates
};

const md = [
  "# Release Scorecard",
  `Generated at: ${payload.generatedAt}`,
  `Minimum score threshold: ${minimumScore}`,
  `Score: ${score}`,
  "",
  "Canonical go-live scope: `apps/web`, `apps/api`, `apps/worker`, `packages/database`.",
  "Legacy and satellite surfaces stay outside the 2026-03-20 launch gate unless promoted explicitly.",
  "",
  "| Gate | Status | Detail | Evidence |",
  "| --- | --- | --- | --- |"
];

for (const entry of gates) {
  md.push(
    `| ${entry.name} | ${entry.pass ? "PASS" : "FAIL"} | ${entry.detail} | ${formatEvidenceMarkdown(entry.evidence)} |`
  );
}

fs.mkdirSync("artifacts/release", { recursive: true });
fs.writeFileSync(markdownOutputPath, md.join("\n"));
fs.writeFileSync(jsonOutputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(md.join("\n"));

if (gates.some((entry) => !entry.pass)) {
  process.exit(1);
}
