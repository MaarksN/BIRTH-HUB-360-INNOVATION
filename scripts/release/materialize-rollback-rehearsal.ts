import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type RollbackTarget = "production" | "staging";

type RollbackCheck = {
  detail: string;
  id: string;
  ok: boolean;
  path: string;
};

function parseFlag(name: string): string | undefined {
  const match = process.argv.find((item) => item.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

function parseTarget(): RollbackTarget {
  const value = parseFlag("--target") ?? "production";
  if (value === "production" || value === "staging") {
    return value;
  }

  throw new Error("Missing or invalid --target flag. Use --target=staging or --target=production.");
}

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(resolve(process.cwd(), relativePath), "utf8"));
}

function ensureFile(relativePath: string, id: string): RollbackCheck {
  return existsSync(resolve(process.cwd(), relativePath))
    ? { detail: "present", id, ok: true, path: relativePath }
    : { detail: "missing", id, ok: false, path: relativePath };
}

function ensureJsonOk(relativePath: string, id: string, expectedTarget?: RollbackTarget): RollbackCheck {
  const fileCheck = ensureFile(relativePath, id);
  if (!fileCheck.ok) {
    return fileCheck;
  }

  const payload = readJson(relativePath);
  if (payload?.ok !== true) {
    return { detail: "json present but ok != true", id, ok: false, path: relativePath };
  }

  if (expectedTarget && payload?.target && payload.target !== expectedTarget) {
    return {
      detail: `json target mismatch (${payload.target})`,
      id,
      ok: false,
      path: relativePath
    };
  }

  return { detail: "json ok=true", id, ok: true, path: relativePath };
}

function ensureSourceManifest(relativePath: string): RollbackCheck {
  const fileCheck = ensureFile(relativePath, "source_manifest");
  if (!fileCheck.ok) {
    return fileCheck;
  }

  const payload = readJson(relativePath);
  const requiredFields = ["generatedAt", "sourceEvent", "sourceRef", "sourceSha"];
  const missingFields = requiredFields.filter((field) => {
    const value = payload?.[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    return {
      detail: `missing required fields: ${missingFields.join(", ")}`,
      id: "source_manifest",
      ok: false,
      path: relativePath
    };
  }

  return {
    detail: `source manifest bound to ${payload.sourceEvent}/${payload.sourceRef}`,
    id: "source_manifest",
    ok: true,
    path: relativePath
  };
}

function buildRollbackEvidence(target: RollbackTarget) {
  const checks = [
    ensureJsonOk(`artifacts/release/${target}-preflight-summary.json`, "preflight", target),
    ensureJsonOk("artifacts/release/smoke-summary.json", "smoke"),
    ensureSourceManifest("artifacts/release/source-manifest.json"),
    ensureFile("artifacts/release/checksums-manifest.sha256", "checksum_manifest"),
    ensureFile("artifacts/release/release-artifact-catalog.json", "release_catalog_json"),
    ensureFile("artifacts/sbom/bom.xml", "sbom_xml"),
    ensureFile("artifacts/sbom/sbom.spdx.json", "sbom_spdx"),
    ensureFile("releases/manifests/release_artifact_catalog.md", "release_catalog_markdown"),
    ensureFile("releases/notes/v1.0.0.md", "release_notes")
  ];
  const sourceManifest = existsSync(resolve(process.cwd(), "artifacts/release/source-manifest.json"))
    ? readJson("artifacts/release/source-manifest.json")
    : null;
  const ok = checks.every((check) => check.ok);

  return {
    checkedAt: new Date().toISOString(),
    checks,
    evidenceArtifacts: checks.filter((check) => check.ok).map((check) => check.path),
    mode: "automated_release_rehearsal",
    notes: parseFlag("--notes") ?? null,
    ok,
    source: sourceManifest
      ? {
          generatedAt: sourceManifest.generatedAt ?? null,
          sourceEvent: sourceManifest.sourceEvent ?? null,
          sourceRef: sourceManifest.sourceRef ?? null,
          sourceSha: sourceManifest.sourceSha ?? null
        }
      : null,
    summary: ok
      ? "Rollback rehearsal evidence derived from preflight, smoke, source manifest and release bundle artifacts."
      : "Rollback rehearsal evidence is incomplete; at least one prerequisite artifact is missing or invalid.",
    target
  };
}

async function main() {
  const target = parseTarget();
  const report = buildRollbackEvidence(target);
  const outputPath =
    parseFlag("--output") ??
    resolve(process.cwd(), "artifacts", "release", `${target}-rollback-evidence.json`);
  const textPath = outputPath.replace(/\.json$/i, ".txt");

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(
    textPath,
    [
      `Target: ${target}`,
      `Checked at: ${report.checkedAt}`,
      `Mode: ${report.mode}`,
      ...report.checks.map((check) => `${check.ok ? "PASS" : "FAIL"} ${check.path} (${check.detail})`),
      `Status: ${report.ok ? "PASS" : "FAIL"}`
    ].join("\n"),
    "utf8"
  );

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
