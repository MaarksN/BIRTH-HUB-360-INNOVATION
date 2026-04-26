import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBackupHealthReport,
  renderBackupHealthText,
  writeBackupHealthReport
} from "./check-backup-health.ts";

test("buildBackupHealthReport reports missing backup directory without throwing", () => {
  const rootDirectory = join(tmpdir(), "birthub-missing-backup-dir");
  rmSync(rootDirectory, { force: true, recursive: true });

  const report = buildBackupHealthReport({
    rootDirectory
  });

  assert.equal(report.ok, false);
  assert.match(report.issues[0], /Backup directory is missing/i);
});

test("buildBackupHealthReport passes when backup and wal are fresh", () => {
  const rootDirectory = join(tmpdir(), `birthub-backup-health-${Date.now()}`);
  const backupsDir = join(rootDirectory, "backups");
  const walDir = join(rootDirectory, "wal");
  mkdirSync(backupsDir, { recursive: true });
  mkdirSync(walDir, { recursive: true });
  writeFileSync(join(backupsDir, "backup-001.dump"), "ok", "utf8");
  writeFileSync(join(walDir, "wal-001"), "ok", "utf8");

  try {
    const report = buildBackupHealthReport({
      backupsDir,
      maxBackupAgeMinutes: 60,
      maxWalLagMinutes: 60,
      rootDirectory
    });

    assert.equal(report.ok, true);
    assert.equal(report.status, "pass");
    assert.ok(report.backup.latest);
    assert.match(renderBackupHealthText(report), /Status: PASS/);
  } finally {
    rmSync(rootDirectory, { force: true, recursive: true });
  }
});

test("writeBackupHealthReport persists json and text outputs", () => {
  const rootDirectory = join(tmpdir(), `birthub-backup-health-write-${Date.now()}`);
  mkdirSync(rootDirectory, { recursive: true });

  try {
    const report = buildBackupHealthReport({
      rootDirectory
    });
    const outputPath = join(rootDirectory, "artifacts", "backups", "backup-health.json");
    const paths = writeBackupHealthReport(report, outputPath);

    assert.equal(paths.jsonPath, outputPath);
    assert.match(paths.textPath, /backup-health\.txt$/);
  } finally {
    rmSync(rootDirectory, { force: true, recursive: true });
  }
});

test("buildBackupHealthReport ignores self-generated metadata files", () => {
  const rootDirectory = join(tmpdir(), `birthub-backup-health-ignore-${Date.now()}`);
  const backupsDir = join(rootDirectory, "artifacts", "backups");
  mkdirSync(backupsDir, { recursive: true });
  writeFileSync(join(backupsDir, "backup-health.json"), "{}", "utf8");
  writeFileSync(join(backupsDir, "backup-health.txt"), "status", "utf8");
  writeFileSync(join(backupsDir, "drill-rto-rpo.json"), "{}", "utf8");

  try {
    const report = buildBackupHealthReport({
      rootDirectory
    });

    assert.equal(report.ok, false);
    assert.match(report.issues[0], /No backup files found/i);
  } finally {
    rmSync(rootDirectory, { force: true, recursive: true });
  }
});
