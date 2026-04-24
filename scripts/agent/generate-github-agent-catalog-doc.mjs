// @ts-nocheck
// 
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getWorkspaceRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function toPosixPath(value) {
  return value.replace(/\\/g, "/");
}

function formatIsoDate(value) {
  return new Date(value).toISOString();
}

function quoteCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function groupBy(items, selector) {
  const groups = new Map();

  for (const item of items) {
    const key = selector(item);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
      continue;
    }
    groups.set(key, [item]);
  }

  return groups;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonWithFallback(primaryPath, fallbackPath) {
  try {
    return await readJson(primaryPath);
  } catch {
    return readJson(fallbackPath);
  }
}

async function loadInstallableAgents(collectionRoot) {
  const entries = await readdir(collectionRoot, { withFileTypes: true });
  const agents = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestPath = path.join(collectionRoot, entry.name, "manifest.json");
    const readinessPath = path.join(collectionRoot, entry.name, "readiness.json");
    const evidencePath = path.join(collectionRoot, entry.name, "evidence.json");

    try {
      const manifest = await readJson(manifestPath);
      const readiness = await readJson(readinessPath);

      if (manifest?.agent?.kind !== "agent") {
        continue;
      }

      agents.push({
        description: manifest.agent.description,
        domain: manifest.tags?.domain?.[0] ?? "unknown",
        evidencePath: toPosixPath(path.relative(getWorkspaceRoot(), evidencePath)),
        id: manifest.agent.id,
        keywords: manifest.keywords ?? [],
        level: manifest.tags?.level?.join(", ") ?? "",
        manifestPath: toPosixPath(path.relative(getWorkspaceRoot(), manifestPath)),
        name: manifest.agent.name,
        persona: manifest.tags?.persona?.join(", ") ?? "",
        readinessOverall: Boolean(readiness?.readiness?.overall),
        readinessPath: toPosixPath(path.relative(getWorkspaceRoot(), readinessPath)),
        skillCount: Array.isArray(manifest.skills) ? manifest.skills.length : 0,
        toolCount: Array.isArray(manifest.tools) ? manifest.tools.length : 0,
        useCases: manifest.tags?.["use-case"] ?? [],
        version: manifest.agent.version
      });
    } catch {
      // Ignore incomplete directories that are not installable manifests.
    }
  }

  return agents.sort((left, right) => left.name.localeCompare(right.name, "en"));
}

function renderMarkdown({
  descriptor,
  domainSummary,
  generatedAt,
  installableAgents,
  readinessReport
}) {
  const lines = [
    "# GitHub Agents Compiled Collection",
    "",
    "Catalogo operacional gerado a partir dos manifests compilados em `packages/agent-packs/github-agents-v1`.",
    "",
    "## Snapshot",
    `- generatedAt: ${generatedAt}`,
    `- descriptorId: ${descriptor.agent.id}`,
    `- collectionVersion: ${descriptor.agent.version}`,
    `- installableAgents: ${installableAgents.length}`,
    `- readinessPassed: ${readinessReport.passedCount}/${readinessReport.installableCount}`,
    `- readinessFailures: ${readinessReport.failures.length}`,
    "",
    "## Domain Summary",
    "| Domain | Agents | Ready |",
    "| --- | ---: | ---: |"
  ];

  for (const summary of domainSummary) {
    lines.push(`| ${quoteCell(summary.domain)} | ${summary.total} | ${summary.ready} |`);
  }

  lines.push("", "## Installable Agents");

  const groups = groupBy(installableAgents, (entry) => entry.domain);
  const sortedDomains = Array.from(groups.keys()).sort((left, right) =>
    left.localeCompare(right, "en")
  );

  for (const domain of sortedDomains) {
    const agents = groups.get(domain) ?? [];
    lines.push(
      "",
      `### ${domain}`,
      "",
      "| Agent | ID | Persona | Skills | Tools | Ready | Description |",
      "| --- | --- | --- | ---: | ---: | ---: | --- |"
    );

    for (const agent of agents) {
      lines.push(
        `| ${quoteCell(agent.name)} | ${quoteCell(agent.id)} | ${quoteCell(agent.persona)} | ${agent.skillCount} | ${agent.toolCount} | ${agent.readinessOverall ? "yes" : "no"} | ${quoteCell(agent.description)} |`
      );
    }
  }

  lines.push(
    "",
    "## Sources",
    `- descriptor: \`${toPosixPath(path.join("packages", "agent-packs", "github-agents-v1", "manifest.json"))}\``,
    `- readiness: \`${toPosixPath(path.join("artifacts", "agent-readiness", "github-agents-v1-readiness-report.json"))}\``,
    `- collection report: \`${toPosixPath(path.join("packages", "agent-packs", "github-agents-v1", "collection-report.json"))}\``
  );

  return `${lines.join("\n")}\n`;
}

async function main() {
  const workspaceRoot = getWorkspaceRoot();
  const collectionRoot = path.join(workspaceRoot, "packages", "agent-packs", "github-agents-v1");
  const docsRoot = path.join(workspaceRoot, "docs", "agent-packs");
  const descriptorPath = path.join(collectionRoot, "manifest.json");
  const readinessPath = path.join(collectionRoot, "readiness-gate-report.json");
  const readinessArtifactPath = path.join(
    workspaceRoot,
    "artifacts",
    "agent-readiness",
    "github-agents-v1-readiness-report.json"
  );
  const outputDocPath = path.join(docsRoot, "github-agents-v1-catalog.mdx");
  const outputJsonPath = path.join(docsRoot, "github-agents-v1-installables.json");

  const descriptor = await readJson(descriptorPath);
  const readinessReport = await readJsonWithFallback(readinessArtifactPath, readinessPath);
  const installableAgents = await loadInstallableAgents(collectionRoot);
  const domainSummary = Array.from(groupBy(installableAgents, (entry) => entry.domain).entries())
    .map(([domain, agents]) => ({
      domain,
      ready: agents.filter((agent) => agent.readinessOverall).length,
      total: agents.length
    }))
    .sort((left, right) => left.domain.localeCompare(right.domain, "en"));

  const generatedAt = formatIsoDate(new Date());
  const outputJson = {
    collection: {
      descriptorId: descriptor.agent.id,
      generatedAt,
      installableAgents: installableAgents.length,
      readinessFailures: readinessReport.failures.length,
      readinessPassed: readinessReport.passedCount,
      readinessTotal: readinessReport.installableCount,
      version: descriptor.agent.version
    },
    domains: domainSummary,
    installableAgents
  };

  await mkdir(docsRoot, { recursive: true });
  await writeFile(
    outputDocPath,
    renderMarkdown({
      descriptor,
      domainSummary,
      generatedAt,
      installableAgents,
      readinessReport
    }),
    "utf8"
  );
  await writeFile(outputJsonPath, `${JSON.stringify(outputJson, null, 2)}\n`, "utf8");

  console.log(
    `Generated ${path.relative(workspaceRoot, outputDocPath)} and ${path.relative(workspaceRoot, outputJsonPath)} for ${installableAgents.length} agents.`
  );
}

void main();
