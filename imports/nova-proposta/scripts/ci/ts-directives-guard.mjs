#!/usr/bin/env node
// @ts-nocheck
//
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { buildEnv, projectRoot } from "./shared.mjs";

const baselinePath = path.join(projectRoot, "artifacts", "quality", "ts-directives-baseline.json");
const policyPath = path.join(projectRoot, "scripts", "ci", "runtime-governance-policy.json");
const shouldWriteBaseline = process.argv.includes("--write-baseline");
const sectionOrder = [
  "primaryRuntime",
  "compatOnly",
  "parked",
  "secondaryOperational",
  "tests",
  "scripts",
  "otherSource"
];
const sectionLabels = {
  compatOnly: "compat-only source",
  otherSource: "other source",
  parked: "parked source",
  primaryRuntime: "mounted runtime source",
  scripts: "script track",
  secondaryOperational: "secondary operational source",
  tests: "test track"
};
const trackedFiles = execSync("git ls-files", {
  cwd: projectRoot,
  encoding: "utf8",
  env: buildEnv()
})
  .trim()
  .split(/\r?\n/u)
  .filter(Boolean);
const sourceFiles = trackedFiles.filter((file) => /\.(ts|tsx|mts|cts)$/i.test(file));

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function escapeRegex(value) {
  return value.replace(/[.+?^${}()|[\]\\]/gu, "\\$&");
}

function globToRegex(pattern) {
  const normalized = normalizePath(pattern);
  const escaped = escapeRegex(
    normalized
      .replace(/\*\*/gu, "__GLOBSTAR__")
      .replace(/\*/gu, "__GLOB__")
  )
    .replace(/__GLOBSTAR__/gu, ".*")
    .replace(/__GLOB__/gu, "[^/]*");
  return new RegExp(`^${escaped}$`, "u");
}

function matchesAnyPattern(relativePath, patterns) {
  return patterns.some((pattern) => globToRegex(pattern).test(relativePath));
}

function normalizeViolations(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function createEmptySection() {
  return {
    noCheck: [],
    tsIgnore: []
  };
}

function createEmptySections() {
  return Object.fromEntries(sectionOrder.map((section) => [section, createEmptySection()]));
}

function readPolicy() {
  if (!existsSync(policyPath)) {
    throw new Error(
      `Missing runtime governance policy at ${path.relative(projectRoot, policyPath).replaceAll("\\", "/")}`
    );
  }

  const raw = JSON.parse(readFileSync(policyPath, "utf8"));

  return {
    compatOnly: raw.runtimeCanonical.compatOnly.map((entry) => normalizePath(entry.path)),
    excludedFromPrimaryBaseline: raw.typedExceptionGovernance.excludedFromPrimaryBaseline.map((entry) =>
      normalizePath(entry)
    ),
    parked: raw.runtimeCanonical.parked.map((entry) => normalizePath(entry.path)),
    primaryRuntimeExemptions: raw.typedExceptionGovernance.primaryBaseline.runtimeMountedSourceExemptions.map(
      (entry) => normalizePath(entry)
    ),
    primaryRuntimeRoots: raw.typedExceptionGovernance.primaryBaseline.runtimeMountedSourceRoots.map((entry) =>
      normalizePath(entry)
    ),
    secondaryOperational: raw.typedExceptionGovernance.secondaryOperationalLayers.map((entry) =>
      normalizePath(entry.path)
    ),
    separateTrackPatterns: raw.typedExceptionGovernance.separateTracks.map((entry) => ({
      classification: entry.classification,
      path: normalizePath(entry.path)
    }))
  };
}

function classifyFile(relativePath, policy) {
  if (matchesAnyPattern(relativePath, policy.excludedFromPrimaryBaseline)) {
    return "excluded";
  }

  for (const track of policy.separateTrackPatterns) {
    if (!globToRegex(track.path).test(relativePath)) {
      continue;
    }

    if (track.classification === "test") {
      return "tests";
    }

    if (track.classification === "script") {
      return "scripts";
    }
  }

  if (matchesAnyPattern(relativePath, policy.compatOnly)) {
    return "compatOnly";
  }

  if (matchesAnyPattern(relativePath, policy.parked)) {
    return "parked";
  }

  if (matchesAnyPattern(relativePath, policy.secondaryOperational)) {
    return "secondaryOperational";
  }

  const matchesPrimaryRoot = policy.primaryRuntimeRoots.some((root) => {
    const normalizedRoot = normalizePath(root);
    return relativePath === normalizedRoot || relativePath.startsWith(`${normalizedRoot}/`);
  });

  if (matchesPrimaryRoot && !matchesAnyPattern(relativePath, policy.primaryRuntimeExemptions)) {
    return "primaryRuntime";
  }

  return "otherSource";
}

function hasJustification(rawTail) {
  const normalized = rawTail.replace(/^[-:]+\s*/u, "").trim();
  return normalized.length >= 12;
}

function buildSnapshot(generatedAt, scannedFiles, scannedBySection, sections) {
  const normalizedSections = Object.fromEntries(
    sectionOrder.map((section) => [
      section,
      {
        noCheck: normalizeViolations(sections[section].noCheck),
        tsIgnore: normalizeViolations(sections[section].tsIgnore)
      }
    ])
  );

  return {
    formatVersion: 2,
    generatedAt,
    policyPath: path.relative(projectRoot, policyPath).replaceAll("\\", "/"),
    scannedBySection,
    scannedFiles,
    sections: normalizedSections
  };
}

function collectViolations(policy) {
  const sections = createEmptySections();
  const missingFiles = [];
  const scannedBySection = {
    compatOnly: 0,
    excluded: 0,
    otherSource: 0,
    parked: 0,
    primaryRuntime: 0,
    scripts: 0,
    secondaryOperational: 0,
    tests: 0
  };

  for (const file of sourceFiles) {
    const relativePath = normalizePath(file);
    const classification = classifyFile(relativePath, policy);
    scannedBySection[classification] += 1;

    if (classification === "excluded") {
      continue;
    }

    const absolutePath = path.join(projectRoot, relativePath);
    if (!existsSync(absolutePath)) {
      missingFiles.push(relativePath);
      continue;
    }

    const content = readFileSync(absolutePath, "utf8");
    const lines = content.split(/\r?\n/u);

    for (const [index, line] of lines.entries()) {
      const lineNumber = index + 1;
      const violation = `${relativePath}:${lineNumber}`;
      if (/@ts-nocheck\b/u.test(line)) {
        sections[classification].noCheck.push(violation);
        continue;
      }

      const ignoreMatch = line.match(/@ts-ignore\b(.*)$/u);
      if (!ignoreMatch) {
        continue;
      }

      if (!hasJustification(ignoreMatch[1] ?? "")) {
        sections[classification].tsIgnore.push(violation);
      }
    }
  }

  return {
    missingFiles: normalizeViolations(missingFiles),
    snapshot: buildSnapshot(new Date().toISOString(), sourceFiles.length, scannedBySection, sections)
  };
}

function coerceSection(rawSection) {
  return {
    noCheck: normalizeViolations(Array.isArray(rawSection?.noCheck) ? rawSection.noCheck : []),
    tsIgnore: normalizeViolations(Array.isArray(rawSection?.tsIgnore) ? rawSection.tsIgnore : [])
  };
}

function convertV1Baseline(raw, policy) {
  const sections = createEmptySections();
  const noCheck = normalizeViolations(Array.isArray(raw.noCheck) ? raw.noCheck : []);
  const tsIgnore = normalizeViolations(Array.isArray(raw.tsIgnore) ? raw.tsIgnore : []);

  for (const violation of noCheck) {
    const relativePath = normalizePath(violation.split(":")[0] ?? "");
    const classification = classifyFile(relativePath, policy);
    if (classification === "excluded") {
      continue;
    }
    sections[classification].noCheck.push(violation);
  }

  for (const violation of tsIgnore) {
    const relativePath = normalizePath(violation.split(":")[0] ?? "");
    const classification = classifyFile(relativePath, policy);
    if (classification === "excluded") {
      continue;
    }
    sections[classification].tsIgnore.push(violation);
  }

  return buildSnapshot(
    typeof raw.generatedAt === "string" ? raw.generatedAt : null,
    Number(raw.scannedFiles ?? 0),
    {
      compatOnly: 0,
      excluded: 0,
      otherSource: 0,
      parked: 0,
      primaryRuntime: 0,
      scripts: 0,
      secondaryOperational: 0,
      tests: 0
    },
    sections
  );
}

function readBaseline(policy) {
  if (!existsSync(baselinePath)) {
    return null;
  }

  const raw = JSON.parse(readFileSync(baselinePath, "utf8"));

  if (Number(raw.formatVersion ?? 1) >= 2 && raw.sections) {
    return {
      formatVersion: Number(raw.formatVersion ?? 2),
      generatedAt: typeof raw.generatedAt === "string" ? raw.generatedAt : null,
      policyPath:
        typeof raw.policyPath === "string"
          ? raw.policyPath
          : path.relative(projectRoot, policyPath).replaceAll("\\", "/"),
      scannedBySection: raw.scannedBySection ?? {},
      scannedFiles: Number(raw.scannedFiles ?? 0),
      sections: Object.fromEntries(sectionOrder.map((section) => [section, coerceSection(raw.sections[section])]))
    };
  }

  return convertV1Baseline(raw, policy);
}

function writeBaseline(snapshot) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

function diffViolations(current, baseline) {
  const baselineSet = new Set(baseline);
  return current.filter((value) => !baselineSet.has(value));
}

function summarizeSnapshot(snapshot) {
  return sectionOrder.map((section) => ({
    noCheck: snapshot.sections[section].noCheck.length,
    section,
    tsIgnore: snapshot.sections[section].tsIgnore.length
  }));
}

const policy = readPolicy();
const { missingFiles, snapshot: current } = collectViolations(policy);

if (missingFiles.length > 0) {
  console.error("[ts-directives-guard] FAILED");
  console.error("- Git-tracked TypeScript files are missing from the working tree:");
  for (const relativePath of missingFiles) {
    console.error(`  - ${relativePath}`);
  }
  console.error(
    "- Restore, stage, or remove the tracked paths from git before re-running the guard."
  );
  process.exit(1);
}

if (shouldWriteBaseline) {
  writeBaseline(current);
  console.log(
    `[ts-directives-guard] baseline updated at ${path.relative(projectRoot, baselinePath).replaceAll("\\", "/")}`
  );
  for (const entry of summarizeSnapshot(current)) {
    console.log(
      `- ${sectionLabels[entry.section]}: ${entry.noCheck} @ts-nocheck, ${entry.tsIgnore} unjustified @ts-ignore`
    );
  }
  process.exit(0);
}

const baseline = readBaseline(policy);

if (!baseline) {
  console.error("[ts-directives-guard] FAILED");
  console.error(
    `- Baseline file is missing: ${path.relative(projectRoot, baselinePath).replaceAll("\\", "/")}`
  );
  console.error("- Run `node scripts/ci/ts-directives-guard.mjs --write-baseline` to capture the current debt.");
  process.exit(1);
}

const comparisons = sectionOrder.map((section) => ({
  newNoCheck: diffViolations(current.sections[section].noCheck, baseline.sections[section].noCheck),
  newTsIgnore: diffViolations(current.sections[section].tsIgnore, baseline.sections[section].tsIgnore),
  retiredNoCheck: diffViolations(baseline.sections[section].noCheck, current.sections[section].noCheck),
  retiredTsIgnore: diffViolations(baseline.sections[section].tsIgnore, current.sections[section].tsIgnore),
  section
}));

const hasFailures = comparisons.some(
  (entry) => entry.newNoCheck.length > 0 || entry.newTsIgnore.length > 0
);

if (hasFailures) {
  console.error("[ts-directives-guard] FAILED");
  for (const entry of comparisons) {
    if (entry.newNoCheck.length === 0 && entry.newTsIgnore.length === 0) {
      continue;
    }

    console.error(`- ${sectionLabels[entry.section]} changed beyond the committed baseline:`);

    if (entry.newNoCheck.length > 0) {
      const headline =
        entry.section === "primaryRuntime"
          ? "  - New @ts-nocheck directives in mounted runtime are prohibited:"
          : "  - New @ts-nocheck directives exceeded the classified baseline:";
      console.error(headline);
      for (const violation of entry.newNoCheck) {
        console.error(`    - ${violation}`);
      }
    }

    if (entry.newTsIgnore.length > 0) {
      console.error("  - New @ts-ignore directives require inline justification (>=12 chars after directive):");
      for (const violation of entry.newTsIgnore) {
        console.error(`    - ${violation}`);
      }
    }
  }

  process.exitCode = 1;
} else {
  console.log("[ts-directives-guard] OK");
  for (const entry of comparisons) {
    const currentSection = current.sections[entry.section];
    console.log(
      `- ${sectionLabels[entry.section]}: ${currentSection.noCheck.length} @ts-nocheck, ${currentSection.tsIgnore.length} unjustified @ts-ignore`
    );
  }

  const retiredNoCheckViolations = comparisons.reduce(
    (total, entry) => total + entry.retiredNoCheck.length,
    0
  );
  const retiredTsIgnoreViolations = comparisons.reduce(
    (total, entry) => total + entry.retiredTsIgnore.length,
    0
  );

  if (retiredNoCheckViolations > 0 || retiredTsIgnoreViolations > 0) {
    console.log(
      `- Improvements detected: ${retiredNoCheckViolations} @ts-nocheck and ${retiredTsIgnoreViolations} @ts-ignore removed from classified baseline coverage`
    );
  }
}
