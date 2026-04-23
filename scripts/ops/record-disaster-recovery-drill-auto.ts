import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  buildLatestDrillSnapshot,
  buildDisasterRecoveryDrillReport,
  writeDisasterRecoveryDrillReport
} from "./record-disaster-recovery-drill.ts";

function parseFlag(name: string): string | undefined {
  const match = process.argv.find((item) => item.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

function readJsonIfExists(relativePath: string) {
  const absolutePath = resolve(process.cwd(), relativePath);
  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch {
    return null;
  }
}

function parseDateCandidate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveEventDate(...values: unknown[]): Date {
  for (const value of values) {
    const parsed = parseDateCandidate(value);
    if (parsed) {
      return parsed;
    }
  }

  return new Date();
}

async function main() {
  const environment = parseFlag("--environment") ?? "production";
  const owner = parseFlag("--owner") ?? "platform-ops";
  const scenario = parseFlag("--scenario") ?? "automated release readiness rehearsal";
  const outputPath =
    parseFlag("--output") ?? resolve(process.cwd(), "artifacts", "backups", "drill-rto-rpo.json");
  const latestPath =
    parseFlag("--latest-output") ?? resolve(process.cwd(), "artifacts", "dr", "latest-drill.json");

  const backupHealthPath = parseFlag("--backup-artifact") ?? "artifacts/backups/backup-health.json";
  const rollbackEvidencePath =
    parseFlag("--rollback-evidence") ?? "artifacts/release/production-rollback-evidence.json";
  const validationArtifactPath =
    parseFlag("--validation-artifact") ?? "artifacts/release/smoke-summary.json";
  const sourceManifestPath =
    parseFlag("--source-manifest") ?? "artifacts/release/source-manifest.json";

  const backupHealth = readJsonIfExists(backupHealthPath);
  const rollbackEvidence = readJsonIfExists(rollbackEvidencePath);
  const validationArtifact = readJsonIfExists(validationArtifactPath);
  const sourceManifest = readJsonIfExists(sourceManifestPath);

  const startedAt = resolveEventDate(
    backupHealth?.checkedAt,
    sourceManifest?.generatedAt,
    validationArtifact?.checkedAt
  );
  const restoredAt = resolveEventDate(
    rollbackEvidence?.checkedAt,
    validationArtifact?.checkedAt,
    backupHealth?.checkedAt,
    sourceManifest?.generatedAt
  );
  const targetPoint = resolveEventDate(
    sourceManifest?.generatedAt,
    validationArtifact?.checkedAt,
    startedAt.toISOString()
  );
  const recoveredPoint = resolveEventDate(
    rollbackEvidence?.checkedAt,
    validationArtifact?.checkedAt,
    restoredAt.toISOString()
  );

  const report = buildDisasterRecoveryDrillReport({
    backupArtifact: backupHealthPath,
    environment: environment === "local" || environment === "staging" ? environment : "production",
    notes:
      "Automatically materialized from backup health, rollback rehearsal evidence and smoke validation artifacts.",
    owner,
    recoveredPoint,
    restoredAt: restoredAt.getTime() < startedAt.getTime() ? startedAt : restoredAt,
    rollbackEvidence: rollbackEvidencePath,
    rpoObjectiveMinutes: 15,
    rtoObjectiveMinutes: 60,
    scenario,
    startedAt,
    targetPoint,
    validationArtifact: validationArtifactPath
  });
  const paths = writeDisasterRecoveryDrillReport(report, outputPath);

  mkdirSync(dirname(latestPath), { recursive: true });
  writeFileSync(latestPath, `${JSON.stringify(buildLatestDrillSnapshot(report), null, 2)}\n`, "utf8");

  console.log(JSON.stringify(report, null, 2));
  console.log(`DR drill artifact generated at ${paths.jsonPath}`);
  console.log(`Latest DR snapshot updated at ${latestPath}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
