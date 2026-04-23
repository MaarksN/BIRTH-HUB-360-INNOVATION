// @ts-nocheck
// 
import path from "node:path";
import { promises as fs } from "node:fs";

import {
  auditRoot,
  ensureDir,
  readText,
  repoRoot,
  reportDateParts,
  writeJson,
  writeText
} from "./shared-prime.mjs";

const MASTER_SOURCE_PATH = "audit/divida_tecnica.json";
const PROGRAM_SOURCE_PATH = "docs/technical-debt/tracker.json";
const PRIME_REPORT_FILENAME = "03-scored-report.json";

const SOURCE_CONFIG = {
  master: {
    label: "Relatorio Master",
    namespace: "MASTER"
  },
  program: {
    label: "Technical Debt Program",
    namespace: "PROGRAM"
  },
  auditor_prime: {
    label: "Auditor Prime",
    namespace: "APR"
  }
};

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function normalizeProgramItems(sourceJson) {
  return (sourceJson.items ?? []).map((item) => ({
    canonicalId: `${SOURCE_CONFIG.program.namespace}-${item.id}`,
    domain: item.domain,
    legacyId: item.id,
    owner: item.owner ?? null,
    priority: item.priority ?? null,
    residualRisk: item.residualRisk ?? null,
    source: "program",
    sourcePath: PROGRAM_SOURCE_PATH,
    status: item.status ?? null,
    title: item.title
  }));
}

function normalizeMasterItems(sourceJson) {
  return (sourceJson.achados ?? []).map((item) => ({
    canonicalId: `${SOURCE_CONFIG.master.namespace}-${item.id}`,
    domain: item.dominio ?? null,
    legacyId: item.id,
    owner: null,
    priority: item.severidade ?? null,
    residualRisk: item.classificacao_honestidade_operacional ?? null,
    source: "master",
    sourcePath: MASTER_SOURCE_PATH,
    status: item.status_atual ?? null,
    title: item.titulo
  }));
}

function normalizePrimeItems(sourceJson, sourcePath) {
  return (sourceJson.debtItems ?? []).map((item) => ({
    canonicalId: `${SOURCE_CONFIG.auditor_prime.namespace}-${item.id}`,
    domain: item.dimensionLabel ?? item.dimension ?? null,
    legacyId: item.id,
    owner: null,
    priority: item.severity ?? null,
    residualRisk: item.phase ?? null,
    source: "auditor_prime",
    sourcePath,
    status: item.severity ?? null,
    title: item.title
  }));
}

async function findLatestPrimeReport() {
  const supportBase = path.join(auditRoot, ".auditor-prime");
  const entries = await fs.readdir(supportBase, { withFileTypes: true });
  const datedDirectories = entries
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  for (const dateOnly of datedDirectories) {
    const absolutePath = path.join(supportBase, dateOnly, PRIME_REPORT_FILENAME);
    try {
      await fs.access(absolutePath);
      return {
        absolutePath,
        dateOnly,
        relativePath: path
          .relative(repoRoot, absolutePath)
          .replaceAll("\\", "/")
      };
    } catch {
      // try next directory
    }
  }

  throw new Error("Nao foi possivel localizar nenhum 03-scored-report.json em audit/.auditor-prime.");
}

function summarizeSource(items) {
  const ids = items
    .map((item) => item.legacyId)
    .sort((left, right) => left.localeCompare(right));

  return {
    count: items.length,
    firstId: ids[0] ?? null,
    lastId: ids.at(-1) ?? null
  };
}

function buildCollisionRecords(items) {
  const groups = new Map();

  for (const item of items) {
    const current = groups.get(item.legacyId) ?? [];
    current.push(item);
    groups.set(item.legacyId, current);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([legacyId, group]) => ({
      bareId: legacyId,
      namespaces: group.map((item) => item.canonicalId),
      recommendation: `Usar somente IDs qualificados por namespace (${group
        .map((item) => item.canonicalId)
        .join(", ")}). O bare ID ${legacyId} fica proibido em novos docs, PRs e runbooks.`,
      sources: group.map((item) => ({
        canonicalId: item.canonicalId,
        domain: item.domain,
        source: SOURCE_CONFIG[item.source].label,
        sourcePath: item.sourcePath,
        title: item.title
      }))
    }));
}

function buildMarkdown(input) {
  const sourceLines = input.sources.map(
    (source) =>
      `| ${source.label} | \`${source.namespace}-TD-xxx\` | \`${source.sourcePath}\` | ${source.count} | ${source.firstId ?? "-"} | ${source.lastId ?? "-"} |`
  );
  const collisionLines = input.collisions.map((collision) => {
    const aliases = collision.sources
      .map((source) => `\`${source.canonicalId}\` — ${source.title}`)
      .join("<br>");
    return `| \`${collision.bareId}\` | ${collision.sources.length} | ${aliases} | ${collision.recommendation} |`;
  });

  return [
    "# TD Catalog Reconciliation",
    "",
    `- Generated at: ${input.generatedAt}`,
    `- Latest auditor-prime support: \`${input.latestPrimeReport.relativePath}\``,
    `- Report date used from auditor-prime support: ${input.latestPrimeReport.dateOnly}`,
    "",
    "## Namespace Policy",
    "",
    "- IDs sem namespace ficam proibidos em novos docs, PRs, issues, runbooks e baselines.",
    "- Fontes historicas sao preservadas sem renomear o conteudo legado.",
    "- Referencia oficial a partir deste ciclo:",
    `  - \`${SOURCE_CONFIG.program.namespace}-TD-xxx\` para o programa em \`${PROGRAM_SOURCE_PATH}\``,
    `  - \`${SOURCE_CONFIG.master.namespace}-TD-xxx\` para o relatorio master em \`${MASTER_SOURCE_PATH}\``,
    `  - \`${SOURCE_CONFIG.auditor_prime.namespace}-TD-xxx\` para o auditor-prime em \`${input.latestPrimeReport.relativePath}\``,
    "",
    "## Source Inventory",
    "",
    "| Source | Namespace | File | Items | First ID | Last ID |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...sourceLines,
    "",
    "## Bare ID Collisions",
    "",
    "| Bare ID | Sources | Canonical aliases | Handling |",
    "| --- | ---: | --- | --- |",
    ...collisionLines,
    "",
    "## Canonical Reference Examples",
    "",
    `- \`${SOURCE_CONFIG.master.namespace}-TD-001\` = sessao refresh em memoria no relatorio master.`,
    `- \`${SOURCE_CONFIG.program.namespace}-TD-001\` = debt program sobre drift dos entrypoints de documentacao.`,
    `- \`${SOURCE_CONFIG.auditor_prime.namespace}-TD-001\` = hotspot de complexidade em AppointmentsBoard no auditor-prime.`,
    "",
    "## Operational Guidance",
    "",
    "- Quando for citar um item historico, use o ID namespaced e, se necessario, mencione o alias original uma unica vez.",
    "- Quando um documento novo depender de mais de um catalogo, declare a fonte explicitamente na primeira tabela do ciclo.",
    "- Se surgir um quarto catalogo, ele deve entrar com novo namespace antes de receber IDs `TD-*` reutilizados em texto livre.",
    ""
  ].join("\n");
}

async function main() {
  const masterJson = await readJson(MASTER_SOURCE_PATH);
  const programJson = await readJson(PROGRAM_SOURCE_PATH);
  const latestPrimeReport = await findLatestPrimeReport();
  const primeJson = JSON.parse(await fs.readFile(latestPrimeReport.absolutePath, "utf8"));

  const normalizedItems = [
    ...normalizeProgramItems(programJson),
    ...normalizeMasterItems(masterJson),
    ...normalizePrimeItems(primeJson, latestPrimeReport.relativePath)
  ];

  const sourceInventory = [
    {
      ...SOURCE_CONFIG.program,
      sourcePath: PROGRAM_SOURCE_PATH,
      ...summarizeSource(normalizedItems.filter((item) => item.source === "program"))
    },
    {
      ...SOURCE_CONFIG.master,
      sourcePath: MASTER_SOURCE_PATH,
      ...summarizeSource(normalizedItems.filter((item) => item.source === "master"))
    },
    {
      ...SOURCE_CONFIG.auditor_prime,
      sourcePath: latestPrimeReport.relativePath,
      ...summarizeSource(normalizedItems.filter((item) => item.source === "auditor_prime"))
    }
  ];

  const collisions = buildCollisionRecords(normalizedItems);
  const generatedAt = new Date().toISOString();
  const markdown = buildMarkdown({
    collisions,
    generatedAt,
    latestPrimeReport,
    sources: sourceInventory
  });

  const payload = {
    generatedAt,
    latestPrimeReport,
    policy: {
      bareIdsAllowedInNewReferences: false,
      namespaces: {
        auditorPrime: SOURCE_CONFIG.auditor_prime.namespace,
        master: SOURCE_CONFIG.master.namespace,
        program: SOURCE_CONFIG.program.namespace
      }
    },
    sources: sourceInventory,
    collisions,
    items: normalizedItems.sort((left, right) => {
      const sourceRank = {
        auditor_prime: 3,
        master: 2,
        program: 1
      };
      if (left.source !== right.source) {
        return sourceRank[left.source] - sourceRank[right.source];
      }
      return left.legacyId.localeCompare(right.legacyId);
    })
  };

  const auditJsonPath = path.join(auditRoot, "td-catalog-reconciliation.json");
  const auditMarkdownPath = path.join(auditRoot, "td-catalog-reconciliation.md");
  const artifactDir = path.join(repoRoot, "artifacts", "technical-debt");

  await ensureDir(artifactDir);
  await writeJson(auditJsonPath, payload);
  await writeText(auditMarkdownPath, `${markdown}\n`);
  await writeJson(path.join(artifactDir, "td-catalog-reconciliation-latest.json"), payload);
  await writeText(path.join(artifactDir, "td-catalog-reconciliation-latest.md"), `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        generatedAt,
        collisions: collisions.length,
        latestPrimeReport: latestPrimeReport.relativePath,
        sourceCounts: Object.fromEntries(
          sourceInventory.map((source) => [source.label, source.count])
        )
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
