// @ts-expect-error TODO: remover suppressão ampla
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSecurityCoverageReport,
  renderSecurityCoverageMarkdown,
  writeSecurityCoverageReport,
} from "./generate-security-report.ts";

test("buildSecurityCoverageReport normalizes statuses and computes overall status", () => {
  const report = buildSecurityCoverageReport({
    DAST_TARGET_STRATEGY: "local-web-login-route",
    DAST_TARGET_URL: "http://127.0.0.1:3001/login",
    NPM_AUDIT_STATUS: "success",
    PYTHON_SECURITY_STATUS: "failure",
    RBAC_STATUS: "success",
    SEMGREP_STATUS: "success",
    ZAP_STATUS: "success",
  });

  assert.equal(report.overallStatus, "fail");
  assert.equal(
    report.checks.find((check) => check.id === "python_security")?.status,
    "failure",
  );
  assert.equal(report.dast.targetUrl, "http://127.0.0.1:3001/login");

  const markdown = renderSecurityCoverageMarkdown(report);
  assert.match(markdown, /python security \| failure/i);
  assert.match(markdown, /overall_status: fail/);
});

test("writeSecurityCoverageReport persists markdown and json outputs", () => {
  const rootDirectory = mkdtempSync(join(tmpdir(), "birthub-security-report-"));

  try {
    const report = buildSecurityCoverageReport({
      DAST_TARGET_URL: "http://127.0.0.1:3001/login",
      NPM_AUDIT_STATUS: "success",
      PYTHON_SECURITY_STATUS: "success",
      RBAC_STATUS: "success",
      SEMGREP_STATUS: "success",
      ZAP_STATUS: "success",
    });

    const paths = writeSecurityCoverageReport(report, rootDirectory);
    const markdown = readFileSync(paths.markdownPath, "utf8");
    const json = JSON.parse(readFileSync(paths.jsonPath, "utf8"));

    assert.match(
      markdown,
      /dast_target_url: `http:\/\/127\.0\.0\.1:3001\/login`/,
    );
    assert.equal(json.overallStatus, "pass");
    assert.equal(json.checks.length, 5);
  } finally {
    rmSync(rootDirectory, { force: true, recursive: true });
  }
});
