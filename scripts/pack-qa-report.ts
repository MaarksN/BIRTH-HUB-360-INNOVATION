// @ts-expect-error TODO: remover suppressão ampla
// 
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMMON_PREMIUM_PROTOCOL_MARKER,
  GLOBAL_PREMIUM_PROTOCOL_MARKER,
  REQUIRED_RUNTIME_PROMPT_SECTION_GROUPS,
  REQUIRED_RUNTIME_PROTOCOL_CLAUSES,
  enhanceManifestWithPremiumProtocol,
  isInstallableManifest,
  loadManifestCatalog,
  runAgentDryRun
} from "@birthub/agents-core";

function toDocSlug(agentId: string): string {
  return agentId.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
}

function countCoveredSections(prompt: string): number {
  return REQUIRED_RUNTIME_PROMPT_SECTION_GROUPS.filter((sectionGroup) =>
    sectionGroup.anyOf.some((section) => prompt.includes(section))
  ).length;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

async function main(): Promise<void> {
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(scriptsDir, "..");
  const catalog = await loadManifestCatalog(path.join(root, "packages", "agent-packs"));
  const installableCatalog = catalog.filter((entry) => isInstallableManifest(entry.manifest));
  const catalogDescriptors = catalog.filter((entry) => !isInstallableManifest(entry.manifest));
  const docsDir = path.join(root, "docs", "agent-packs");
  const docsSet = new Set(
    (await readdir(docsDir))
      .filter((fileName) => fileName.endsWith(".mdx"))
      .map((fileName) => fileName.toLowerCase())
  );

  const dryRunResults = await Promise.all(
    catalog.map(async (entry) => ({
      agentId: entry.manifest.agent.id,
      dryRun: await runAgentDryRun(entry.manifest)
    }))
  );

  const docsCoverage = await Promise.all(
    catalog.map(async (entry) => {
      return {
        agentId: entry.manifest.agent.id,
        exists: docsSet.has(`${toDocSlug(entry.manifest.agent.id)}.mdx`)
      };
    })
  );

  const allDryRunsOk = dryRunResults.every((result) => result.dryRun.logs.length > 0);
  const docsOkCount = docsCoverage.filter((item) => item.exists).length;
  const promptRichness = installableCatalog.map((entry) => ({
    agentId: entry.manifest.agent.id,
    coveredSections: countCoveredSections(enhanceManifestWithPremiumProtocol(entry.manifest).agent.prompt),
    hasGlobalProtocol: enhanceManifestWithPremiumProtocol(entry.manifest).agent.prompt.includes(
      GLOBAL_PREMIUM_PROTOCOL_MARKER
    ),
    hasCommonProtocol: enhanceManifestWithPremiumProtocol(entry.manifest).agent.prompt.includes(
      COMMON_PREMIUM_PROTOCOL_MARKER
    ),
    hasAllRuntimeClauses: REQUIRED_RUNTIME_PROTOCOL_CLAUSES.every((clause) =>
      enhanceManifestWithPremiumProtocol(entry.manifest).agent.prompt.toLowerCase().includes(clause.toLowerCase())
    ),
    keywordCount: entry.manifest.keywords.length,
    promptLength: entry.manifest.agent.prompt.length
  }));
  const perAgentScores = promptRichness.map((row) => {
    const docsExists = docsCoverage.find((item) => item.agentId === row.agentId)?.exists ?? false;
    const dryRun = dryRunResults.find((item) => item.agentId === row.agentId)?.dryRun;

    const sectionScore = Math.round((row.coveredSections / REQUIRED_RUNTIME_PROMPT_SECTION_GROUPS.length) * 30);
    const keywordScore = Math.min(20, row.keywordCount);
    const globalProtocolScore = row.hasGlobalProtocol ? 8 : 0;
    const commonProtocolScore = row.hasCommonProtocol ? 7 : 0;
    const runtimeClauseScore = row.hasAllRuntimeClauses ? 15 : 0;
    const dryRunScore = dryRun?.logs.length ? 20 : 0;
    const docsScore = docsExists ? 10 : 0;

    return {
      agentId: row.agentId,
      score:
        sectionScore +
        keywordScore +
        globalProtocolScore +
        commonProtocolScore +
        runtimeClauseScore +
        dryRunScore +
        docsScore
    };
  });
  const domainDistribution = installableCatalog.reduce<Record<string, number>>((bucket, entry) => {
    for (const domain of entry.manifest.tags.domain) {
      bucket[domain] = (bucket[domain] ?? 0) + 1;
    }
    return bucket;
  }, {});
  const levelDistribution = installableCatalog.reduce<Record<string, number>>((bucket, entry) => {
    for (const level of entry.manifest.tags.level) {
      bucket[level] = (bucket[level] ?? 0) + 1;
    }
    return bucket;
  }, {});

  console.log("=== Cycle 5 Pack QA Report ===");
  console.log(`Catalog agents: ${catalog.length}`);
  console.log(`Installable agents: ${installableCatalog.length}`);
  console.log(`Catalog descriptors: ${catalogDescriptors.length}`);
  console.log(`Dry-run success: ${allDryRunsOk ? "OK" : "FAIL"}`);
  console.log(`Docs coverage: ${docsOkCount}/${catalog.length}`);
  console.log(
    `Average runtime prompt section coverage: ${average(promptRichness.map((item) => item.coveredSections)).toFixed(2)}/${REQUIRED_RUNTIME_PROMPT_SECTION_GROUPS.length}`
  );
  console.log(`Average keyword count: ${average(promptRichness.map((item) => item.keywordCount)).toFixed(2)}`);
  console.log(
    `Global premium protocol coverage: ${
      promptRichness.filter((item) => item.hasGlobalProtocol).length
    }/${installableCatalog.length}`
  );
  console.log(
    `Common premium protocol coverage: ${
      promptRichness.filter((item) => item.hasCommonProtocol).length
    }/${installableCatalog.length}`
  );
  console.log(
    `Runtime protocol clause coverage: ${
      promptRichness.filter((item) => item.hasAllRuntimeClauses).length
    }/${installableCatalog.length}`
  );
  console.log(`Average prompt length: ${Math.round(average(promptRichness.map((item) => item.promptLength)))}`);
  console.log(`Domain distribution: ${JSON.stringify(domainDistribution)}`);
  console.log(`Level distribution: ${JSON.stringify(levelDistribution)}`);
  console.log(
    `Quality score leaderboard: ${perAgentScores
      .slice()
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map((item) => `${item.agentId}:${item.score}`)
      .join(", ")}`
  );
}

void main();
