#!/usr/bin/env node
// @ts-nocheck
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "artifacts", "security", "dast-governance.json");
const textPath = path.join(root, "artifacts", "security", "dast-governance.txt");

function normalizeBoolean(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "true";
}

function looksLikePlaceholder(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.length === 0 || ["todo", "placeholder", "changeme", "example.com"].some((token) => normalized.includes(token));
}

const branchRef = process.env.GITHUB_REF ?? "";
const eventName = process.env.GITHUB_EVENT_NAME ?? "";
const zapTargetUrl = (process.env.ZAP_TARGET_URL ?? "").trim();
const requireDast = normalizeBoolean(process.env.REQUIRE_DAST) || branchRef === "refs/heads/main";
const validUrl = /^https?:\/\/.+/iu.test(zapTargetUrl) && !looksLikePlaceholder(zapTargetUrl);

const report = {
  branchRef,
  checkedAt: new Date().toISOString(),
  eventName,
  ok: !requireDast || validUrl,
  requireDast,
  targetConfigured: validUrl,
  targetUrlRedacted: validUrl ? zapTargetUrl.replace(/:\/\/([^/]+)@/u, "://REDACTED@") : null
};

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(
  textPath,
  [
    `Checked at: ${report.checkedAt}`,
    `Event: ${eventName || "unknown"}`,
    `Branch: ${branchRef || "unknown"}`,
    `Require DAST: ${report.requireDast ? "yes" : "no"}`,
    `Target configured: ${report.targetConfigured ? "yes" : "no"}`,
    `Status: ${report.ok ? "PASS" : "FAIL"}`
  ].join("\n"),
  "utf8"
);

if (!report.ok) {
  console.error("DAST governance requires vars.ZAP_TARGET_URL on protected release branches.");
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
