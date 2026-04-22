import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const policyPath = path.join(__dirname, "license-policy.json");

function runPnpmLicenses() {
  const result = spawnSync("pnpm", ["licenses", "list", "--json"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: process.env
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "pnpm licenses list failed.");
  }

  return result.stdout;
}

function loadPolicy() {
  const raw = readFileSync(policyPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.allowedLicenses)) {
    throw new Error("license-policy.json must provide an allowedLicenses array.");
  }

  return new Set(parsed.allowedLicenses);
}

function normalizePackagesByLicense(rawOutput) {
  const parsed = JSON.parse(rawOutput);
  const entries = Object.entries(parsed);

  return entries
    .map(([license, packages]) => ({
      license,
      packages: Array.isArray(packages)
        ? packages.map((pkg) => ({
            license: typeof pkg.license === "string" ? pkg.license : license,
            name: typeof pkg.name === "string" ? pkg.name : "unknown",
            versions: Array.isArray(pkg.versions) ? pkg.versions : []
          }))
        : []
    }))
    .sort((left, right) => left.license.localeCompare(right.license));
}

function formatPackageLabel(pkg) {
  const versions = pkg.versions.length > 0 ? `@${pkg.versions.join(",")}` : "";
  return `${pkg.name}${versions}`;
}

function main() {
  const allowList = loadPolicy();
  const packagesByLicense = normalizePackagesByLicense(runPnpmLicenses());
  const violations = packagesByLicense.filter(({ license }) => !allowList.has(license));

  if (violations.length === 0) {
    console.log(
      `[license-check] PASS (${packagesByLicense.length} license identifiers approved by policy)`
    );
    return;
  }

  const details = violations.flatMap(({ license, packages }) => {
    const preview = packages.slice(0, 8).map(formatPackageLabel).join(", ");
    const suffix = packages.length > 8 ? `, ... (+${packages.length - 8} more)` : "";
    return `- ${license}: ${preview}${suffix}`;
  });

  throw new Error(
    [
      "[license-check] Unapproved dependency licenses detected.",
      `Policy file: ${policyPath}`,
      ...details
    ].join("\n")
  );
}

main();
