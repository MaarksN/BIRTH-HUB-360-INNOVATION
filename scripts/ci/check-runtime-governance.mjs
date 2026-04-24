#!/usr/bin/env node
// @ts-nocheck
//
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { formatNow, projectRoot } from "./shared.mjs";

const policyPath = path.join(projectRoot, "scripts", "ci", "runtime-governance-policy.json");
const artifactDirectory = path.join(projectRoot, "artifacts", "runtime-governance");
const reportJsonPath = path.join(artifactDirectory, "runtime-governance-report.json");
const reportMarkdownPath = path.join(artifactDirectory, "runtime-governance-report.md");

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function readJson(absolutePath) {
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function readText(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function markerFromPolicyPath(relativePath) {
  return normalizePath(relativePath)
    .replace(/^apps\/api\/src\//u, "")
    .replace(/\.[^.]+$/u, "");
}

const report = {
  checks: {},
  failures: [],
  generatedAt: formatNow()
};

function addCheck(name, ok, details = {}) {
  report.checks[name] = {
    status: ok ? "pass" : "fail",
    ...details
  };

  if (!ok) {
    report.failures.push(name);
  }
}

if (!existsSync(policyPath)) {
  console.error("[check-runtime-governance] missing policy manifest");
  process.exit(1);
}

const policy = readJson(policyPath);
const sourceOfTruth = policy.runtimeCanonical.sourceOfTruth.map((entry) => normalizePath(entry));
const compatOnlyPaths = policy.runtimeCanonical.compatOnly.map((entry) => normalizePath(entry.path));
const parkedPaths = policy.runtimeCanonical.parked.map((entry) => normalizePath(entry.path));
const moduleRoutesPath = "apps/api/src/app/module-routes.ts";
const appPath = "apps/api/src/app.ts";
const corePath = "apps/api/src/app/core.ts";

for (const runtimePath of sourceOfTruth) {
  addCheck(`source-of-truth-exists:${runtimePath}`, existsSync(path.join(projectRoot, runtimePath)), {
    path: runtimePath
  });
}

for (const compatPath of compatOnlyPaths) {
  addCheck(`compat-surface-exists:${compatPath}`, existsSync(path.join(projectRoot, compatPath)), {
    classification: "compat-only",
    path: compatPath
  });
}

for (const parkedPath of parkedPaths) {
  addCheck(`parked-surface-exists:${parkedPath}`, existsSync(path.join(projectRoot, parkedPath)), {
    classification: "not-mounted/parked",
    path: parkedPath
  });
}

const sourceOfTruthContents = Object.fromEntries(
  sourceOfTruth.map((relativePath) => [relativePath, readText(relativePath)])
);
const appContents = sourceOfTruthContents[appPath] ?? "";
const moduleRoutesContents = sourceOfTruthContents[moduleRoutesPath] ?? "";

for (const compatPath of compatOnlyPaths) {
  const marker = markerFromPolicyPath(compatPath);
  const leakingFiles = sourceOfTruth
    .filter((relativePath) => sourceOfTruthContents[relativePath]?.includes(marker))
    .filter((relativePath) => relativePath !== compatPath);

  addCheck(`compat-not-in-source-of-truth:${compatPath}`, leakingFiles.length === 0, {
    leakingFiles,
    marker,
    path: compatPath
  });
}

for (const parkedPath of parkedPaths) {
  const marker = markerFromPolicyPath(parkedPath);
  const leakingFiles = [moduleRoutesPath, appPath, corePath].filter((relativePath) =>
    sourceOfTruthContents[relativePath]?.includes(marker)
  );

  addCheck(`parked-not-mounted:${parkedPath}`, leakingFiles.length === 0, {
    leakingFiles,
    marker,
    path: parkedPath
  });
}

addCheck(
  "app-composition-uses-module-routes",
  appContents.includes("mountModuleRouters("),
  {
    path: appPath
  }
);
addCheck(
  "app-composition-uses-operational-routes",
  appContents.includes("registerOperationalRoutes("),
  {
    path: appPath
  }
);
addCheck(
  "app-composition-uses-error-pipeline",
  appContents.includes("registerGlobalErrorHandling("),
  {
    path: appPath
  }
);
addCheck(
  "module-routes-does-not-mount-clinical-or-fhir",
  !moduleRoutesContents.includes("clinical") && !moduleRoutesContents.includes("fhir"),
  {
    path: moduleRoutesPath
  }
);

mkdirSync(artifactDirectory, { recursive: true });
writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const markdown = [
  "# Runtime Governance Report",
  "",
  `Generated at: ${report.generatedAt}`,
  "",
  "| Check | Status | Details |",
  "| --- | --- | --- |"
];

for (const [name, payload] of Object.entries(report.checks)) {
  const details = { ...payload };
  delete details.status;
  markdown.push(
    `| ${name} | ${payload.status.toUpperCase()} | ${JSON.stringify(details).replaceAll("|", "\\|")} |`
  );
}

writeFileSync(reportMarkdownPath, `${markdown.join("\n")}\n`, "utf8");

if (report.failures.length > 0) {
  console.error("[check-runtime-governance] failed checks:");
  for (const failure of report.failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[check-runtime-governance] OK");
