import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type ReleaseTarget = "production" | "staging";
type ReleaseStage = "all" | "bundle" | "preflight" | "rollback" | "smoke";

type CheckResult = {
  detail: string;
  ok: boolean;
  path: string;
};

function parseFlag(name: string): string | undefined {
  const match = process.argv.find((item) => item.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

function parseTarget(): ReleaseTarget {
  const raw = parseFlag("--target");
  if (raw === "production" || raw === "staging") {
    return raw;
  }

  throw new Error("Missing or invalid --target flag. Use --target=staging or --target=production.");
}

function parseStage(): ReleaseStage {
  const raw = parseFlag("--stage") ?? "all";
  if (raw === "all" || raw === "bundle" || raw === "preflight" || raw === "rollback" || raw === "smoke") {
    return raw;
  }

  throw new Error("Missing or invalid --stage flag. Use --stage=preflight|smoke|rollback|bundle|all.");
}

function summaryPath(target: ReleaseTarget, stage: ReleaseStage): string {
  return resolve(process.cwd(), "artifacts", "release", `${target}-${stage}-evidence-summary.json`);
}

async function sha256(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function ensureFile(relativePath: string): Promise<CheckResult> {
  const absolutePath = resolve(process.cwd(), relativePath);

  try {
    await access(absolutePath);
    return {
      detail: "present",
      ok: true,
      path: relativePath
    };
  } catch {
    return {
      detail: "missing",
      ok: false,
      path: relativePath
    };
  }
}

async function ensureJsonOk(relativePath: string, expectedTarget?: ReleaseTarget): Promise<CheckResult> {
  const presence = await ensureFile(relativePath);
  if (!presence.ok) {
    return presence;
  }

  const raw = await readFile(resolve(process.cwd(), relativePath), "utf8");
  const payload = JSON.parse(raw);

  if (payload.ok !== true) {
    return {
      detail: "json present but ok != true",
      ok: false,
      path: relativePath
    };
  }

  if (expectedTarget && payload.target && payload.target !== expectedTarget) {
    return {
      detail: `json target mismatch (${payload.target})`,
      ok: false,
      path: relativePath
    };
  }

  return {
    detail: "json ok=true",
    ok: true,
    path: relativePath
  };
}

async function ensureSourceManifest(relativePath: string): Promise<CheckResult> {
  const presence = await ensureFile(relativePath);
  if (!presence.ok) {
    return presence;
  }

  const payload = JSON.parse(await readFile(resolve(process.cwd(), relativePath), "utf8"));
  const missingFields = ["generatedAt", "sourceEvent", "sourceRef", "sourceSha"].filter((key) => {
    const value = payload[key];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    return {
      detail: `missing required fields: ${missingFields.join(", ")}`,
      ok: false,
      path: relativePath
    };
  }

  if (!/^[0-9a-f]{40}$/i.test(payload.sourceSha)) {
    return {
      detail: `sourceSha is not a full git SHA (${payload.sourceSha})`,
      ok: false,
      path: relativePath
    };
  }

  return {
    detail: `source manifest bound to ${payload.sourceEvent}/${payload.sourceRef}`,
    ok: true,
    path: relativePath
  };
}

async function ensureChecksumManifest(relativePath: string, requiredEntries: string[]): Promise<CheckResult> {
  const presence = await ensureFile(relativePath);
  if (!presence.ok) {
    return presence;
  }

  const manifestPath = resolve(process.cwd(), relativePath);
  const lines = (await readFile(manifestPath, "utf8"))
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      detail: "checksum manifest is empty",
      ok: false,
      path: relativePath
    };
  }

  const parsedEntries: Array<{ digest: string; filePath: string }> = [];
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/iu);
    if (!match) {
      return {
        detail: `invalid checksum line: ${line}`,
        ok: false,
        path: relativePath
      };
    }

    parsedEntries.push({
      digest: match[1],
      filePath: match[2]
    });
  }

  const listedPaths = new Set(parsedEntries.map((entry) => entry.filePath));
  const missingEntries = requiredEntries.filter((entry) => !listedPaths.has(entry));
  if (missingEntries.length > 0) {
    return {
      detail: `required entries missing from checksum manifest: ${missingEntries.join(", ")}`,
      ok: false,
      path: relativePath
    };
  }

  for (const entry of parsedEntries) {
    const absolutePath = resolve(process.cwd(), entry.filePath);
    try {
      await access(absolutePath);
    } catch {
      return {
        detail: `listed file is missing: ${entry.filePath}`,
        ok: false,
        path: relativePath
      };
    }

    const actualDigest = await sha256(absolutePath);
    if (actualDigest !== entry.digest) {
      return {
        detail: `checksum mismatch for ${entry.filePath}`,
        ok: false,
        path: relativePath
      };
    }
  }

  return {
    detail: `validated ${parsedEntries.length} checksum entries`,
    ok: true,
    path: relativePath
  };
}

async function stageChecks(target: ReleaseTarget, stage: ReleaseStage): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  if (stage === "preflight" || stage === "all") {
    checks.push(
      await ensureJsonOk(
        `artifacts/release/${target === "staging" ? "staging" : "production"}-preflight-summary.json`,
        target
      )
    );
  }

  if (stage === "smoke" || stage === "all") {
    checks.push(await ensureJsonOk("artifacts/release/smoke-summary.json"));
  }

  if (stage === "rollback" || stage === "all") {
    checks.push(
      await ensureJsonOk(
        `artifacts/release/${target === "staging" ? "staging" : "production"}-rollback-evidence.json`,
        target
      )
    );
  }

  if (stage === "bundle" || stage === "all") {
    const requiredBundleEntries = [
      "artifacts/release/release-artifact-catalog.json",
      "artifacts/release/source-manifest.json",
      "artifacts/sbom/bom.xml",
      "artifacts/sbom/sbom.spdx.json",
      "releases/manifests/release_artifact_catalog.md",
      "releases/notes/v1.0.0.md"
    ];

    checks.push(await ensureChecksumManifest("artifacts/release/checksums-manifest.sha256", requiredBundleEntries));
    checks.push(await ensureFile("artifacts/release/release-artifact-catalog.json"));
    checks.push(await ensureSourceManifest("artifacts/release/source-manifest.json"));
    checks.push(await ensureFile("artifacts/sbom/bom.xml"));
    checks.push(await ensureFile("artifacts/sbom/sbom.spdx.json"));
    checks.push(await ensureFile("releases/manifests/release_artifact_catalog.md"));
    checks.push(await ensureFile("releases/notes/v1.0.0.md"));
  }

  return checks;
}

async function main() {
  const target = parseTarget();
  const stage = parseStage();
  const checks = await stageChecks(target, stage);
  const ok = checks.every((check) => check.ok);
  const report = {
    checkedAt: new Date().toISOString(),
    checks,
    ok,
    stage,
    target
  };

  const outputPath = summaryPath(target, stage);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(
    outputPath.replace(/\.json$/i, ".txt"),
    [
      `Target: ${target}`,
      `Stage: ${stage}`,
      `Checked at: ${report.checkedAt}`,
      ...checks.map((check) => `${check.ok ? "PASS" : "FAIL"} ${check.path} (${check.detail})`),
      `Status: ${ok ? "PASS" : "FAIL"}`
    ].join("\n"),
    "utf8"
  );

  if (!ok) {
    const failed = checks
      .filter((check) => !check.ok)
      .map((check) => `${check.path} (${check.detail})`)
      .join(", ");
    throw new Error(`Release evidence verification failed for ${stage}/${target}: ${failed}`);
  }

  console.log(JSON.stringify(report, null, 2));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
