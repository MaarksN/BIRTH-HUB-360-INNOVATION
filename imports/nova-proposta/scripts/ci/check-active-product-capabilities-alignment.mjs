// @ts-nocheck
//
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

const canonicalDocPath = "docs/operations/active-product-capabilities.md";
const productCapabilitiesSourcePath = "packages/config/src/product-capabilities.ts";
const protectedOperationalDocs = [
  "docs/README.md",
  "docs/index.md",
  "docs/service-catalog.md",
  "docs/LGPD_OPERACIONAL.md",
  "docs/tenant-deletion-policy.md",
  "docs/security/pentest-plan-cross-tenant.md",
  "docs/operations/core-boundaries-communication.md"
];

const blockedOperationalExamples = [
  {
    needle: "/api/v1/patients",
    reason: "clinical patient APIs remain preserved outside the default product path"
  },
  {
    needle: "/api/v1/appointments",
    reason: "clinical appointment APIs remain preserved outside the default product path"
  },
  {
    needle: "/api/fhir/R4",
    reason: "FHIR facade routes remain disabled by default"
  },
  {
    needle: "/api/v1/privacy/consents",
    reason: "advanced privacy consent routes remain disabled by default"
  },
  {
    needle: "/api/v1/privacy/retention",
    reason: "advanced privacy retention routes remain disabled by default"
  }
];

function readProjectFile(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Required file not found: ${relativePath}`);
  }

  return readFileSync(absolutePath, "utf8");
}

function extractCapabilityDefaults(source) {
  const matches = [...source.matchAll(/^\s*([A-Z0-9_]+): envBoolean\.default\((true|false)\)/gm)];

  if (matches.length === 0) {
    throw new Error("Unable to extract product capability defaults from source.");
  }

  return matches.map(([, envName, defaultValue]) => ({
    envName,
    defaultValue
  }));
}

function collectBlockedExampleViolations(relativePath, content) {
  const violations = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const { needle, reason } of blockedOperationalExamples) {
      if (line.includes(needle)) {
        violations.push(
          `${relativePath}:${index + 1} uses "${needle}", but ${reason}.`
        );
      }
    }
  });

  return violations;
}

function referencesCanonicalDoc(relativePath, content) {
  const docDirectory = path.posix.dirname(relativePath.replace(/\\/g, "/"));
  const relativeReference = path.posix.relative(docDirectory, canonicalDocPath);
  const referenceCandidates = [
    canonicalDocPath,
    relativeReference,
    `./${relativeReference}`
  ];

  return referenceCandidates.some((candidate) => content.includes(candidate));
}

const violations = [];
const canonicalDoc = readProjectFile(canonicalDocPath);
const productCapabilitiesSource = readProjectFile(productCapabilitiesSourcePath);
const capabilityDefaults = extractCapabilityDefaults(productCapabilitiesSource);

for (const { envName, defaultValue } of capabilityDefaults) {
  const expectedLine = `- \`${envName}=${defaultValue}\``;

  if (!canonicalDoc.includes(expectedLine)) {
    violations.push(
      `${canonicalDocPath} is missing the canonical default capability line ${expectedLine}.`
    );
  }
}

for (const relativePath of protectedOperationalDocs) {
  const content = readProjectFile(relativePath);

  if (!referencesCanonicalDoc(relativePath, content)) {
    violations.push(
      `${relativePath} must reference ${canonicalDocPath} as the operational source of truth.`
    );
  }

  violations.push(...collectBlockedExampleViolations(relativePath, content));
}

if (violations.length > 0) {
  console.error("Active product capability alignment check failed.");
  console.error(
    "Operational docs must point to the canonical capability reference and avoid disabled-domain runtime examples."
  );
  for (const violation of violations) {
    console.error(` - ${violation}`);
  }
  process.exit(1);
}

console.log("Active product capability alignment check passed.");
