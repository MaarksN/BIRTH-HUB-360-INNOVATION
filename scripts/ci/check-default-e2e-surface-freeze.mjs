// @ts-nocheck
//
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const e2eRoot = path.join(projectRoot, "tests", "e2e");
const playwrightConfigCandidates = [
  path.join(projectRoot, "playwright.config.ts"),
  path.join(projectRoot, "tests", "e2e", "playwright.config.ts")
];

const guardedPatterns = [
  {
    allowMarkers: [
      "skipUnlessClinicalWorkspaceEnabled()",
      "default-surface-assertion: clinical-workspace-disabled"
    ],
    needles: ["/patients", "/appointments", "/api/v1/patients", "/api/v1/appointments"],
    reason: "clinical workspace remains outside the default product path"
  },
  {
    allowMarkers: ["skipUnlessPrivacyAdvancedEnabled()"],
    needles: ["/api/v1/privacy/consents", "/api/v1/privacy/retention"],
    reason: "advanced privacy remains disabled by default"
  },
  {
    allowMarkers: ["skipUnlessFhirFacadeEnabled()"],
    needles: ["/api/fhir/R4"],
    reason: "FHIR facade remains disabled by default"
  }
];

const forbiddenPlaywrightDefaults = [
  'NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: "true"',
  'BIRTHUB_ENABLE_CLINICAL_WORKSPACE: "true"',
  'NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED: "true"',
  'BIRTHUB_ENABLE_PRIVACY_ADVANCED: "true"',
  'NEXT_PUBLIC_ENABLE_FHIR_FACADE: "true"',
  'BIRTHUB_ENABLE_FHIR_FACADE: "true"'
];

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".spec.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toProjectRelative(fullPath) {
  return path.relative(projectRoot, fullPath).replace(/\\/g, "/");
}

function collectPatternViolations(relativePath, content) {
  const violations = [];
  const lines = content.split(/\r?\n/);

  for (const pattern of guardedPatterns) {
    const hasGuardMarker = pattern.allowMarkers.some((marker) => content.includes(marker));

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const needle = pattern.needles.find((candidate) => line.includes(candidate));

      if (!needle || hasGuardMarker) {
        continue;
      }

      violations.push(
        `${relativePath}:${index + 1} references "${needle}" without an explicit guard/assertion marker (${pattern.allowMarkers.join(" or ")}); ${pattern.reason}.`
      );
    }
  }

  return violations;
}

const violations = [];

for (const specPath of walk(e2eRoot)) {
  const relativePath = toProjectRelative(specPath);
  const content = readFileSync(specPath, "utf8");
  violations.push(...collectPatternViolations(relativePath, content));
}

const existingPlaywrightConfigPath = playwrightConfigCandidates.find((candidate) =>
  statSync(candidate, { throwIfNoEntry: false })?.isFile()
);

if (existingPlaywrightConfigPath) {
  const playwrightConfig = readFileSync(existingPlaywrightConfigPath, "utf8");
  for (const forbiddenDefault of forbiddenPlaywrightDefaults) {
    if (playwrightConfig.includes(forbiddenDefault)) {
      violations.push(
        `${toProjectRelative(existingPlaywrightConfigPath)} must not enable preserved capabilities by default (${forbiddenDefault}).`
      );
    }
  }
}

if (violations.length > 0) {
  console.error("Default e2e surface freeze check failed.");
  console.error(
    "Default Playwright lanes must stay on supported product surfaces unless a preserved-domain spec is explicitly capability-gated."
  );
  for (const violation of violations) {
    console.error(` - ${violation}`);
  }
  process.exit(1);
}

console.log(
  `Default e2e surface freeze check passed (${walk(e2eRoot).length} spec file(s) inspected).`
);
