//
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const RELEASE_VERSION = "1.0.0";
const GENERATED_RELEASE_FILENAMES = new Set([
  "checksums-manifest.sha256",
  "release-artifact-catalog.json",
  "source-manifest.json"
]);

type ArtifactEntry = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

function parseFlag(name: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : undefined;
}

async function listFiles(folder: string): Promise<string[]> {
  if (!existsSync(folder)) {
    return [];
  }

  const dirents = await readdir(folder, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (entry) => {
      const absolute = join(folder, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolute);
      }

      return [absolute];
    })
  );

  return files.flat();
}

async function sha256(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

function normalizeEntryPath(root: string, filePath: string): string {
  return relative(root, filePath).replaceAll("\\", "/");
}

async function buildChecksumManifest(paths: string[], root: string): Promise<ArtifactEntry[]> {
  const entries: ArtifactEntry[] = [];

  for (const filePath of [...new Set(paths)].sort((left, right) => left.localeCompare(right))) {
    const info = await stat(filePath);
    if (!info.isFile()) {
      continue;
    }

    entries.push({
      path: normalizeEntryPath(root, filePath),
      sha256: await sha256(filePath),
      sizeBytes: info.size
    });
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

function readGitValue(args: string[], fallback: string): string {
  try {
    return execSync(`git ${args.join(" ")}`, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return fallback;
  }
}

function resolveSourceManifest(runDate: string) {
  const sourceSha = parseFlag("--source-sha") ?? readGitValue(["rev-parse", "HEAD"], "unknown");
  const sourceRef =
    parseFlag("--source-ref") ??
    readGitValue(["rev-parse", "--abbrev-ref", "HEAD"], sourceSha !== "unknown" ? sourceSha : "local");

  return {
    generatedAt: runDate,
    runId: parseFlag("--run-id") ?? null,
    sourceEvent: parseFlag("--source-event") ?? "local",
    sourceRef,
    sourceSha,
    workflow: parseFlag("--workflow") ?? "local-release-bundle"
  };
}

async function writeJson(filePath: string, payload: unknown) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const root = process.cwd();
  const releaseDir = resolve(root, "artifacts", "release");
  const sbomDir = resolve(root, "artifacts", "sbom");
  const manifestsDir = resolve(root, "releases", "manifests");
  const notesDir = resolve(root, "releases", "notes");
  const logsDir = resolve(root, "logs", "releases");
  const runDate = new Date().toISOString();
  const semverTag = parseFlag("--tag") ?? `v${RELEASE_VERSION}`;

  await mkdir(releaseDir, { recursive: true });
  await mkdir(sbomDir, { recursive: true });
  await mkdir(manifestsDir, { recursive: true });
  await mkdir(notesDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });

  const existingReleaseArtifacts = (await listFiles(releaseDir)).filter((filePath) => {
    const relativePath = normalizeEntryPath(root, filePath);
    if (relativePath.startsWith("artifacts/release/logs/")) {
      return false;
    }

    const fileName = filePath.split(/[/\\]/u).at(-1) ?? "";
    return !GENERATED_RELEASE_FILENAMES.has(fileName);
  });
  const materialReleaseArtifacts = existingReleaseArtifacts.filter((filePath) => {
    const fileName = filePath.split(/[/\\]/u).at(-1) ?? "";
    return !GENERATED_RELEASE_FILENAMES.has(fileName);
  });
  const sbomArtifacts = await listFiles(sbomDir);

  if (materialReleaseArtifacts.length === 0 && sbomArtifacts.length === 0) {
    throw new Error("No release artifacts found under artifacts/release or artifacts/sbom.");
  }

  const catalogPath = resolve(manifestsDir, "release_artifact_catalog.md");
  const summaryPath = resolve(releaseDir, "release-artifact-catalog.json");
  const checksumPath = resolve(releaseDir, "checksums-manifest.sha256");
  const sourceManifestPath = resolve(releaseDir, "source-manifest.json");
  const logPath = resolve(logsDir, `release-${RELEASE_VERSION}-${runDate.replaceAll(":", "-")}.log`);
  const releaseNotesPath = resolve(notesDir, `v${RELEASE_VERSION}.md`);

  await writeJson(sourceManifestPath, resolveSourceManifest(runDate));

  const releaseNotes = [
    `# Release Notes v${RELEASE_VERSION}`,
    "",
    `- Date: ${runDate}`,
    `- Tag preparada: ${semverTag}`,
    "",
    "## Pacote de release",
    "",
    "- SBOM (`artifacts/sbom/bom.xml`) incorporado ao pacote.",
    "- Manifesto de checksums (`artifacts/release/checksums-manifest.sha256`) atualizado.",
    "- Source manifest (`artifacts/release/source-manifest.json`) incorporado ao pacote.",
    "- Catalogo auditavel (`releases/manifests/release_artifact_catalog.md`) atualizado.",
    "",
    "## Operacional",
    "",
    "- Workflow de CD exige preflight, evidencias operacionais e gates antes do deploy de producao.",
    "- Script de rollback disponivel em `scripts/ops/rollback-release.sh`.",
    "",
    "## Tag semantica da release",
    "",
    "```bash",
    `git tag ${semverTag}`,
    `git push origin ${semverTag}`,
    "```"
  ].join("\n");
  await writeFile(releaseNotesPath, `${releaseNotes}\n`, "utf8");

  const logArtifacts = [...materialReleaseArtifacts, ...sbomArtifacts, sourceManifestPath, releaseNotesPath]
    .map((filePath) => normalizeEntryPath(root, filePath))
    .sort((left, right) => left.localeCompare(right));
  const logBody = [
    `release_version=${RELEASE_VERSION}`,
    `semver_tag=${semverTag}`,
    `generated_at=${runDate}`,
    `artifact_count=${logArtifacts.length}`,
    ...logArtifacts.map((artifactPath) => `artifact=${artifactPath}`)
  ].join("\n");
  await writeFile(logPath, `${logBody}\n`, "utf8");

  const catalogArtifacts = await buildChecksumManifest(
    [...materialReleaseArtifacts, ...sbomArtifacts, sourceManifestPath, releaseNotesPath, logPath],
    root
  );
  const catalog = [
    "# Release Artifact Catalog",
    "",
    `- Release version: ${RELEASE_VERSION}`,
    `- Semantic tag candidate: ${semverTag}`,
    `- Generated at: ${runDate}`,
    "",
    "| Artifact | SHA-256 | Size (bytes) |",
    "| --- | --- | ---: |",
    ...catalogArtifacts.map((entry) => `| \`${entry.path}\` | \`${entry.sha256}\` | ${entry.sizeBytes} |`)
  ].join("\n");
  await writeFile(catalogPath, `${catalog}\n`, "utf8");

  await writeJson(summaryPath, {
    artifacts: catalogArtifacts,
    generatedAt: runDate,
    logPath: normalizeEntryPath(root, logPath),
    releaseVersion: RELEASE_VERSION,
    semverTag,
    sourceManifestPath: normalizeEntryPath(root, sourceManifestPath)
  });

  const finalArtifacts = await buildChecksumManifest(
    [
      ...materialReleaseArtifacts,
      ...sbomArtifacts,
      sourceManifestPath,
      summaryPath,
      catalogPath,
      releaseNotesPath,
      logPath
    ].filter((filePath) => resolve(filePath) !== checksumPath),
    root
  );
  const checksumBody = finalArtifacts.map((entry) => `${entry.sha256}  ${entry.path}`).join("\n");
  await writeFile(checksumPath, `${checksumBody}\n`, "utf8");

  process.stdout.write(`Release artifacts materialized (${finalArtifacts.length} files).\n`);
  process.stdout.write(`Source manifest: ${relative(root, sourceManifestPath)}\n`);
  process.stdout.write(`Checksum manifest: ${relative(root, checksumPath)}\n`);
  process.stdout.write(`Catalog: ${relative(root, catalogPath)}\n`);
  process.stdout.write(`Release notes: ${relative(root, releaseNotesPath)}\n`);
  process.stdout.write(`Release log: ${relative(root, logPath)}\n`);
  process.stdout.write(`Summary JSON: ${relative(root, summaryPath)}\n`);
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
