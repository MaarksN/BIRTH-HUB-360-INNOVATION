import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type DrillStatus = "pass" | "warn";
type DrillEnvironment = "local" | "production" | "staging";

export type DisasterRecoveryDrillReport = {
  checkedAt: string;
  environment: DrillEnvironment;
  evidence: {
    backupArtifact: string;
    notes: string | null;
    rollbackEvidence: string | null;
    validationArtifact: string | null;
  };
  objectives: {
    allMet: boolean | null;
    rpoMet: boolean | null;
    rpoMinutes: number | null;
    rtoMet: boolean | null;
    rtoMinutes: number | null;
  };
  owner: string;
  recoveredPoint: string;
  restoredAt: string;
  rpoMinutes: number;
  rtoMinutes: number;
  scenario: string;
  startedAt: string;
  status: DrillStatus;
  sufficient: true;
  targetPoint: string;
};

type LatestDrillSnapshot = {
  checkedAt: string;
  status: "recorded";
  sufficient: true;
  drill: DisasterRecoveryDrillReport;
};

type BuildDisasterRecoveryDrillOptions = {
  backupArtifact: string;
  checkedAt?: Date;
  environment?: DrillEnvironment;
  notes?: string | null;
  owner: string;
  recoveredPoint: Date;
  restoredAt: Date;
  rollbackEvidence?: string | null;
  rpoObjectiveMinutes?: number | null;
  rtoObjectiveMinutes?: number | null;
  scenario: string;
  startedAt: Date;
  targetPoint: Date;
  validationArtifact?: string | null;
};

function validateText(label: string, value: string | undefined, minimumLength = 4): string {
  const normalized = value?.trim() ?? "";
  if (normalized.length < minimumLength) {
    throw new Error(`${label} is required and must be at least ${minimumLength} characters long.`);
  }

  const lowered = normalized.toLowerCase();
  if (["todo", "replace", "placeholder", "changeme"].some((token) => lowered.includes(token))) {
    throw new Error(`${label} contains placeholder markers and is not valid.`);
  }

  return normalized;
}

function parseFlag(name: string): string | undefined {
  const flag = process.argv.find((item) => item.startsWith(`${name}=`));
  return flag ? flag.slice(name.length + 1) : undefined;
}

function mustParseDate(flagName: string): Date {
  const raw = parseFlag(flagName);
  if (!raw) {
    throw new Error(`Missing required flag ${flagName}=<ISO date>.`);
  }

  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) {
    throw new Error(`Invalid ISO date for ${flagName}: ${raw}`);
  }

  return value;
}

function parseOptionalInteger(flagName: string): number | null {
  const raw = parseFlag(flagName);
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid integer for ${flagName}: ${raw}`);
  }

  return value;
}

function parseEnvironment(raw: string | undefined): DrillEnvironment {
  const normalized = raw?.trim().toLowerCase() ?? "production";
  if (normalized === "local" || normalized === "staging" || normalized === "production") {
    return normalized;
  }

  throw new Error("Invalid --environment value. Use local, staging or production.");
}

function computeObjectiveStatus(actual: number, objective: number | null): boolean | null {
  if (objective === null) {
    return null;
  }

  return actual <= objective;
}

export function buildDisasterRecoveryDrillReport(
  options: BuildDisasterRecoveryDrillOptions
): DisasterRecoveryDrillReport {
  const owner = validateText("Owner", options.owner);
  const scenario = validateText("Scenario", options.scenario, 6);
  const backupArtifact = validateText("Backup artifact", options.backupArtifact, 8);
  const rollbackEvidence =
    options.rollbackEvidence && options.rollbackEvidence.trim().length > 0
      ? validateText("Rollback evidence", options.rollbackEvidence, 8)
      : null;
  const validationArtifact =
    options.validationArtifact && options.validationArtifact.trim().length > 0
      ? validateText("Validation artifact", options.validationArtifact, 8)
      : null;
  const notes =
    options.notes && options.notes.trim().length > 0 ? validateText("Notes", options.notes, 8) : null;

  if (options.restoredAt.getTime() < options.startedAt.getTime()) {
    throw new Error("restoredAt must be greater than or equal to startedAt.");
  }

  const rtoMinutes = Math.round((options.restoredAt.getTime() - options.startedAt.getTime()) / 60000);
  const rpoMinutes = Math.round(
    Math.abs(options.targetPoint.getTime() - options.recoveredPoint.getTime()) / 60000
  );
  const rtoMet = computeObjectiveStatus(rtoMinutes, options.rtoObjectiveMinutes ?? null);
  const rpoMet = computeObjectiveStatus(rpoMinutes, options.rpoObjectiveMinutes ?? null);
  const allMet =
    rtoMet === null && rpoMet === null ? null : [rtoMet, rpoMet].every((value) => value !== false);

  return {
    checkedAt: (options.checkedAt ?? new Date()).toISOString(),
    environment: options.environment ?? "production",
    evidence: {
      backupArtifact,
      notes,
      rollbackEvidence,
      validationArtifact
    },
    objectives: {
      allMet,
      rpoMet,
      rpoMinutes: options.rpoObjectiveMinutes ?? null,
      rtoMet,
      rtoMinutes: options.rtoObjectiveMinutes ?? null
    },
    owner,
    recoveredPoint: options.recoveredPoint.toISOString(),
    restoredAt: options.restoredAt.toISOString(),
    rpoMinutes,
    rtoMinutes,
    scenario,
    startedAt: options.startedAt.toISOString(),
    status: allMet === false ? "warn" : "pass",
    sufficient: true,
    targetPoint: options.targetPoint.toISOString()
  };
}

export function buildLatestDrillSnapshot(report: DisasterRecoveryDrillReport): LatestDrillSnapshot {
  return {
    checkedAt: report.checkedAt,
    status: "recorded",
    sufficient: true,
    drill: report
  };
}

export function renderDisasterRecoveryDrillText(report: DisasterRecoveryDrillReport): string {
  const lines = [
    `Checked at: ${report.checkedAt}`,
    `Status: ${report.status.toUpperCase()}`,
    `Environment: ${report.environment}`,
    `Owner: ${report.owner}`,
    `Scenario: ${report.scenario}`,
    `RTO minutes: ${report.rtoMinutes}`,
    `RPO minutes: ${report.rpoMinutes}`,
    `Backup artifact: ${report.evidence.backupArtifact}`
  ];

  if (report.evidence.rollbackEvidence) {
    lines.push(`Rollback evidence: ${report.evidence.rollbackEvidence}`);
  }

  if (report.evidence.validationArtifact) {
    lines.push(`Validation artifact: ${report.evidence.validationArtifact}`);
  }

  if (report.evidence.notes) {
    lines.push(`Notes: ${report.evidence.notes}`);
  }

  if (report.objectives.allMet !== null) {
    lines.push(
      `Objectives: RTO=${report.objectives.rtoMet ? "MET" : "MISS"}, RPO=${
        report.objectives.rpoMet ? "MET" : "MISS"
      }`
    );
  }

  return `${lines.join("\n")}\n`;
}

export function writeDisasterRecoveryDrillReport(
  report: DisasterRecoveryDrillReport,
  outputPath: string = resolve(process.cwd(), "artifacts", "backups", "drill-rto-rpo.json")
): { jsonPath: string; textPath: string } {
  const textPath = outputPath.replace(/\.json$/i, ".txt");

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(textPath, renderDisasterRecoveryDrillText(report), "utf8");

  return {
    jsonPath: outputPath,
    textPath
  };
}

function writeJson(filePath: string, payload: unknown) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function isExecutedAsScript(): boolean {
  const entryPoint = process.argv[1];
  return Boolean(entryPoint) && resolve(entryPoint) === fileURLToPath(import.meta.url);
}

if (isExecutedAsScript()) {
  const report = buildDisasterRecoveryDrillReport({
    backupArtifact: parseFlag("--backup-artifact") ?? "",
    environment: parseEnvironment(parseFlag("--environment")),
    notes: parseFlag("--notes") ?? null,
    owner: parseFlag("--owner") ?? "",
    recoveredPoint: mustParseDate("--recovered-point"),
    restoredAt: mustParseDate("--restored-at"),
    rollbackEvidence: parseFlag("--rollback-evidence") ?? null,
    rpoObjectiveMinutes: parseOptionalInteger("--rpo-objective-minutes"),
    rtoObjectiveMinutes: parseOptionalInteger("--rto-objective-minutes"),
    scenario: parseFlag("--scenario") ?? "",
    startedAt: mustParseDate("--started-at"),
    targetPoint: mustParseDate("--target-point"),
    validationArtifact: parseFlag("--validation-artifact") ?? null
  });
  const outputPath =
    parseFlag("--output") ?? resolve(process.cwd(), "artifacts", "backups", "drill-rto-rpo.json");
  const latestPath =
    parseFlag("--latest-output") ?? resolve(process.cwd(), "artifacts", "dr", "latest-drill.json");
  const paths = writeDisasterRecoveryDrillReport(report, outputPath);

  writeJson(latestPath, buildLatestDrillSnapshot(report));

  console.log(JSON.stringify(report, null, 2));
  console.log(`DR drill artifact generated at ${paths.jsonPath}`);
  console.log(`DR drill text summary generated at ${paths.textPath}`);
  console.log(`Latest DR snapshot updated at ${latestPath}`);
}
