import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDisasterRecoveryReadinessReport,
  renderDisasterRecoveryReadinessMarkdown,
  writeDisasterRecoveryReadinessReport
} from "./generate-disaster-recovery-report.ts";

test("buildDisasterRecoveryReadinessReport passes when backup, rollback and drill are healthy", () => {
  const report = buildDisasterRecoveryReadinessReport({
    backupHealth: {
      ok: true,
      backup: { latest: { name: "backup-001.dump" } }
    },
    drill: {
      checkedAt: "2026-04-10T12:00:00.000Z",
      owner: "platform-ops",
      scenario: "backup restore rehearsal",
      status: "pass",
      sufficient: true
    },
    rollbackEvidence: {
      checkedAt: "2026-04-10T12:00:00.000Z",
      ok: true,
      target: "production"
    }
  });

  assert.equal(report.overallStatus, "pass");
  assert.equal(report.blockers.length, 0);
  assert.match(renderDisasterRecoveryReadinessMarkdown(report), /overall_status: pass/);
});

test("buildDisasterRecoveryReadinessReport fails when drill is missing", () => {
  const report = buildDisasterRecoveryReadinessReport({
    backupHealth: {
      issues: [],
      ok: true,
      backup: { latest: { name: "backup-001.dump" } }
    },
    drill: null,
    rollbackEvidence: {
      checkedAt: "2026-04-10T12:00:00.000Z",
      ok: true,
      target: "production"
    }
  });

  assert.equal(report.overallStatus, "fail");
  assert.match(report.blockers[0], /Missing or insufficient/i);
});

test("buildDisasterRecoveryReadinessReport flags legacy drill artifacts as insufficient", () => {
  const report = buildDisasterRecoveryReadinessReport({
    backupHealth: {
      issues: [],
      ok: true,
      backup: { latest: { name: "backup-001.dump" } }
    },
    drill: {
      evidence: "JIRA-REL-LEGACY-001",
      notes: "legacy-drill",
      owner: "platform",
      recordedAt: "2026-04-10T12:00:00.000Z",
      rpoMinutes: 15,
      rtoMinutes: 60,
      target: "production"
    },
    rollbackEvidence: {
      checkedAt: "2026-04-10T12:00:00.000Z",
      ok: true,
      target: "production"
    }
  });

  assert.equal(report.overallStatus, "fail");
  assert.match(report.blockers[0], /insufficient for auditability/i);
});

test("writeDisasterRecoveryReadinessReport persists markdown and json outputs", () => {
  const rootDirectory = mkdtempSync(join(tmpdir(), "birthub-dr-report-"));

  try {
    const report = buildDisasterRecoveryReadinessReport({
      backupHealth: {
        issues: ["No backup files found."],
        ok: false
      },
      drill: null,
      rollbackEvidence: {
        checkedAt: "2026-04-10T12:00:00.000Z",
        ok: true,
        target: "production"
      }
    });
    const paths = writeDisasterRecoveryReadinessReport(report, rootDirectory);
    const markdown = readFileSync(paths.markdownPath, "utf8");
    const json = JSON.parse(readFileSync(paths.jsonPath, "utf8"));

    assert.match(markdown, /Disaster Recovery Report/);
    assert.equal(json.overallStatus, "fail");
  } finally {
    rmSync(rootDirectory, { force: true, recursive: true });
  }
});
