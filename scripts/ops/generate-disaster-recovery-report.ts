// @ts-expect-error TODO: remover suppressão ampla
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

type ReadinessStatus = "fail" | "pass";

type ReadinessCheck = {
  artifactPath: string;
  detail: string;
  id: string;
  label: string;
  status: ReadinessStatus;
};

export type DisasterRecoveryReadinessReport = {
  backupHealth: unknown;
  blockers: string[];
  checks: ReadinessCheck[];
  drill: unknown;
  generatedAt: string;
  overallStatus: ReadinessStatus;
  rollbackEvidence: unknown;
};

type BuildDisasterRecoveryReadinessOptions = {
  backupHealth?: any;
  drill?: any;
  rollbackEvidence?: any;
};

function readJsonIfExists(filePath: string): any | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    return {
      __parseError: error instanceof Error ? error.message : String(error)
    };
  }
}

function normalizeLegacyDrill(drill: any): any {
  if (!drill || drill.__parseError) {
    return drill;
  }

  if (drill.sufficient === true || drill.status) {
    return drill;
  }

  if (drill.recordedAt && Number.isInteger(drill.rtoMinutes) && Number.isInteger(drill.rpoMinutes)) {
    return {
      ...drill,
      checkedAt: drill.recordedAt,
      environment: drill.target === "staging" ? "staging" : "production",
      evidence: {
        backupArtifact: "legacy-untracked",
        notes: drill.notes ?? null,
        rollbackEvidence: typeof drill.evidence === "string" ? drill.evidence : null,
        validationArtifact: null
      },
      objectives: {
        allMet: null,
        rpoMet: null,
        rpoMinutes: null,
        rtoMet: null,
        rtoMinutes: null
      },
      scenario: "legacy-unclassified",
      status: "warn",
      sufficient: false
    };
  }

  if (drill.checkedAt && Number.isInteger(drill.rtoMinutes) && Number.isInteger(drill.rpoMinutes)) {
    return {
      ...drill,
      evidence: {
        backupArtifact: "legacy-untracked",
        notes: null,
        rollbackEvidence: null,
        validationArtifact: null
      },
      environment: "production",
      objectives: {
        allMet: null,
        rpoMet: null,
        rpoMinutes: null,
        rtoMet: null,
        rtoMinutes: null
      },
      owner: "legacy-untracked",
      scenario: "legacy-unclassified",
      status: "pass",
      sufficient: true
    };
  }

  return drill;
}

function buildChecks(
  backupHealth: any,
  rollbackEvidence: any,
  drill: any
): { blockers: string[]; checks: ReadinessCheck[] } {
  const checks: ReadinessCheck[] = [];
  const blockers: string[] = [];

  const backupStatus = backupHealth?.ok === true ? "pass" : "fail";
  const backupDetail = backupHealth?.__parseError
    ? `Backup health artifact unreadable: ${backupHealth.__parseError}`
    : backupHealth?.ok === true
      ? `Latest backup ${backupHealth.backup?.latest?.name ?? "n/a"} is within freshness policy`
      : backupHealth?.issues?.length
        ? backupHealth.issues.join(" ")
        : "Missing or invalid artifacts/backups/backup-health.json.";
  checks.push({
    artifactPath: "artifacts/backups/backup-health.json",
    detail: backupDetail,
    id: "backup_health",
    label: "backup health",
    status: backupStatus
  });
  if (backupStatus === "fail") {
    blockers.push(backupDetail);
  }

  const rollbackStatus = rollbackEvidence?.ok === true ? "pass" : "fail";
  const rollbackDetail = rollbackEvidence?.__parseError
    ? `Rollback evidence unreadable: ${rollbackEvidence.__parseError}`
    : rollbackEvidence?.ok === true
      ? `Rollback rehearsal evidence recorded for ${rollbackEvidence.target} at ${rollbackEvidence.checkedAt}`
      : "Missing or invalid artifacts/release/production-rollback-evidence.json.";
  checks.push({
    artifactPath: "artifacts/release/production-rollback-evidence.json",
    detail: rollbackDetail,
    id: "rollback_evidence",
    label: "rollback evidence",
    status: rollbackStatus
  });
  if (rollbackStatus === "fail") {
    blockers.push(rollbackDetail);
  }

  const drillPass = drill?.sufficient === true && drill?.status === "pass";
  const drillStatus: ReadinessStatus = drillPass ? "pass" : "fail";
  const drillDetail = drill?.__parseError
    ? `DR drill artifact unreadable: ${drill.__parseError}`
    : drillPass
      ? `DR drill ${drill.scenario} owned by ${drill.owner} recorded at ${drill.checkedAt}`
      : drill?.status === "warn"
        ? `DR drill artifact exists but is insufficient for auditability (scenario=${drill.scenario}, backupArtifact=${drill.evidence?.backupArtifact ?? "missing"}, RTO=${drill.rtoMinutes}m, RPO=${drill.rpoMinutes}m).`
        : "Missing or insufficient artifacts/backups/drill-rto-rpo.json.";
  checks.push({
    artifactPath: "artifacts/backups/drill-rto-rpo.json",
    detail: drillDetail,
    id: "drill",
    label: "disaster recovery drill",
    status: drillStatus
  });
  if (drillStatus === "fail") {
    blockers.push(drillDetail);
  }

  return { blockers, checks };
}

export function buildDisasterRecoveryReadinessReport(
  options: BuildDisasterRecoveryReadinessOptions = {}
): DisasterRecoveryReadinessReport {
  const backupHealth = Object.prototype.hasOwnProperty.call(options, "backupHealth")
    ? options.backupHealth
    : readJsonIfExists(resolve(process.cwd(), "artifacts", "backups", "backup-health.json"));
  const rollbackEvidence = Object.prototype.hasOwnProperty.call(options, "rollbackEvidence")
    ? options.rollbackEvidence
    : readJsonIfExists(resolve(process.cwd(), "artifacts", "release", "production-rollback-evidence.json"));
  const drill = Object.prototype.hasOwnProperty.call(options, "drill")
    ? normalizeLegacyDrill(options.drill)
    : normalizeLegacyDrill(
        readJsonIfExists(resolve(process.cwd(), "artifacts", "backups", "drill-rto-rpo.json"))
      );
  const { blockers, checks } = buildChecks(backupHealth, rollbackEvidence, drill);

  return {
    backupHealth,
    blockers,
    checks,
    drill,
    generatedAt: new Date().toISOString(),
    overallStatus: blockers.length === 0 ? "pass" : "fail",
    rollbackEvidence
  };
}

export function renderDisasterRecoveryReadinessMarkdown(
  report: DisasterRecoveryReadinessReport
): string {
  const checksTable = report.checks
    .map(
      (check) =>
        `| ${check.label} | ${check.status} | \`${check.artifactPath}\` | ${check.detail} |`
    )
    .join("\n");
  const blockers = report.blockers.length > 0 ? report.blockers.map((item) => `- ${item}`).join("\n") : "- none";

  return `# Disaster Recovery Report

- generatedAt: ${report.generatedAt}
- overall_status: ${report.overallStatus}

## Checks

| Check | Status | Artifact | Detail |
| --- | --- | --- | --- |
${checksTable}

## Blockers

${blockers}
`;
}

export function writeDisasterRecoveryReadinessReport(
  report: DisasterRecoveryReadinessReport,
  rootDirectory: string = process.cwd()
): { jsonPath: string; markdownPath: string } {
  const artifactsDirectory = resolve(rootDirectory, "artifacts", "dr");
  const docsDirectory = resolve(rootDirectory, "docs", "evidence");
  const jsonPath = resolve(artifactsDirectory, "readiness-report.json");
  const markdownPath = resolve(docsDirectory, "disaster-recovery-report.md");

  mkdirSync(artifactsDirectory, { recursive: true });
  mkdirSync(docsDirectory, { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(markdownPath, renderDisasterRecoveryReadinessMarkdown(report), "utf8");

  return { jsonPath, markdownPath };
}

function isExecutedAsScript(): boolean {
  const entryPoint = process.argv[1];
  return Boolean(entryPoint) && resolve(entryPoint) === fileURLToPath(import.meta.url);
}

if (isExecutedAsScript()) {
  const report = buildDisasterRecoveryReadinessReport();
  const paths = writeDisasterRecoveryReadinessReport(report);

  console.log(`DR readiness report generated at ${paths.markdownPath}`);
  console.log(`DR readiness artifact generated at ${paths.jsonPath}`);

  if (report.overallStatus !== "pass") {
    process.exitCode = 1;
  }
}
