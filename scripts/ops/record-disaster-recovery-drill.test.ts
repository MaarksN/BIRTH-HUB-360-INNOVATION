import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDisasterRecoveryDrillReport,
  renderDisasterRecoveryDrillText,
  writeDisasterRecoveryDrillReport
} from "./record-disaster-recovery-drill.ts";

test("buildDisasterRecoveryDrillReport computes RTO/RPO and objective status", () => {
  const report = buildDisasterRecoveryDrillReport({
    backupArtifact: "artifacts/backups/backup-health.json",
    checkedAt: new Date("2026-04-10T12:00:00.000Z"),
    environment: "staging",
    owner: "platform-ops",
    recoveredPoint: new Date("2026-04-10T11:40:00.000Z"),
    restoredAt: new Date("2026-04-10T11:45:00.000Z"),
    rollbackEvidence: "artifacts/release/production-rollback-evidence.json",
    rpoObjectiveMinutes: 15,
    rtoObjectiveMinutes: 30,
    scenario: "backup restore rehearsal",
    startedAt: new Date("2026-04-10T11:20:00.000Z"),
    targetPoint: new Date("2026-04-10T11:30:00.000Z"),
    validationArtifact: "artifacts/release/smoke-summary.json"
  });

  assert.equal(report.environment, "staging");
  assert.equal(report.rtoMinutes, 25);
  assert.equal(report.rpoMinutes, 10);
  assert.equal(report.objectives.allMet, true);
  assert.equal(report.status, "pass");
  assert.match(renderDisasterRecoveryDrillText(report), /Objectives: RTO=MET, RPO=MET/);
});

test("buildDisasterRecoveryDrillReport rejects placeholder owner", () => {
  assert.throws(
    () =>
      buildDisasterRecoveryDrillReport({
        backupArtifact: "artifacts/backups/backup-health.json",
        owner: "todo-owner",
        recoveredPoint: new Date("2026-04-10T11:40:00.000Z"),
        restoredAt: new Date("2026-04-10T11:45:00.000Z"),
        scenario: "backup restore rehearsal",
        startedAt: new Date("2026-04-10T11:20:00.000Z"),
        targetPoint: new Date("2026-04-10T11:30:00.000Z")
      }),
    /Owner contains placeholder markers/i
  );
});

test("writeDisasterRecoveryDrillReport persists json and text outputs", () => {
  const rootDirectory = mkdtempSync(join(tmpdir(), "birthub-dr-drill-"));

  try {
    const report = buildDisasterRecoveryDrillReport({
      backupArtifact: "artifacts/backups/backup-health.json",
      owner: "platform-ops",
      recoveredPoint: new Date("2026-04-10T11:40:00.000Z"),
      restoredAt: new Date("2026-04-10T11:45:00.000Z"),
      scenario: "backup restore rehearsal",
      startedAt: new Date("2026-04-10T11:20:00.000Z"),
      targetPoint: new Date("2026-04-10T11:30:00.000Z")
    });
    const outputPath = join(rootDirectory, "artifacts", "backups", "drill-rto-rpo.json");
    const paths = writeDisasterRecoveryDrillReport(report, outputPath);
    const json = JSON.parse(readFileSync(paths.jsonPath, "utf8"));

    assert.equal(json.sufficient, true);
    assert.match(paths.textPath, /drill-rto-rpo\.txt$/);
  } finally {
    rmSync(rootDirectory, { force: true, recursive: true });
  }
});
