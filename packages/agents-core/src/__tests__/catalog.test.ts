import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  agentIdsMatch,
  canonicalizeAgentId,
  findManifestCatalogEntryByAgentId,
  isInstallableManifest,
  loadManifestCatalog,
  recommendAgentsForTenant,
  searchManifestCatalog,
  type ManifestCatalogEntry
} from "../manifest/catalog.js";
import { parseAgentManifest } from "../manifest/parser.js";
import {
  COMMON_PREMIUM_PROTOCOL_MARKER,
  GLOBAL_PREMIUM_PROTOCOL_MARKER,
  REQUIRED_RUNTIME_PROTOCOL_CLAUSES,
  enhanceManifestWithPremiumProtocol
} from "../runtime/premiumProtocol.js";
import { MANIFEST_VERSION, type AgentManifest } from "../manifest/schema.js";

type ManifestOverrides = {
  agent?: Partial<AgentManifest["agent"]>;
  keywords?: AgentManifest["keywords"];
  policies?: AgentManifest["policies"];
  skills?: AgentManifest["skills"];
  tags?: Partial<AgentManifest["tags"]>;
  tools?: AgentManifest["tools"];
};

function createManifest(overrides: ManifestOverrides = {}): AgentManifest {
  return parseAgentManifest({
    agent: {
      changelog: ["Initial release"],
      description: "Customer success follow-up agent",
      id: "pos-venda",
      kind: "agent",
      name: "Pos Venda",
      prompt: "Act as a post-sale operator.",
      tenantId: "catalog",
      version: "1.0.0",
      ...(overrides.agent ?? {})
    },
    keywords: ["customer-success", "retention", "handoff", "renewal", "support"],
    manifestVersion: MANIFEST_VERSION,
    policies: [
      {
        actions: ["tool:execute"],
        effect: "allow",
        id: "policy-1",
        name: "Default policy"
      }
    ],
    skills: [
      {
        description: "Coordinate post-sale execution",
        id: "skill-1",
        inputSchema: { type: "object" },
        name: "Post-sale",
        outputSchema: { type: "object" }
      }
    ],
    tags: {
      "use-case": ["retention"],
      domain: ["customer-success"],
      industry: ["saas"],
      level: ["specialist"],
      persona: ["csm"],
      ...(overrides.tags ?? {})
    },
    tools: [
      {
        description: "Track CRM state",
        id: "tool-1",
        inputSchema: { type: "object" },
        name: "CRM Tool",
        outputSchema: { type: "object" },
        timeoutMs: 1000
      }
    ],
    ...(overrides.keywords ? { keywords: overrides.keywords } : {}),
    ...(overrides.tools ? { tools: overrides.tools } : {}),
    ...(overrides.skills ? { skills: overrides.skills } : {}),
    ...(overrides.policies ? { policies: overrides.policies } : {})
  });
}

const manifest = createManifest();
const catalogManifest = createManifest({
  agent: {
    description: "Root catalog entry",
    id: "catalog-root",
    kind: "catalog",
    name: "Catalog Root"
  },
  keywords: ["directory", "discovery", "browse", "registry", "catalog"],
  tags: {
    "use-case": ["discovery"],
    domain: ["directories"],
    industry: ["platform"],
    level: ["catalog"],
    persona: ["operator"]
  }
});
const salesManifest = createManifest({
  agent: {
    description: "Sales pipeline copilot",
    id: "sales_copilot",
    name: "Sales Copilot"
  },
  keywords: ["sales", "pipeline", "forecast", "crm", "close"],
  tags: {
    "use-case": ["forecast"],
    domain: ["sales"],
    industry: ["sales"],
    level: ["specialist"],
    persona: ["ae"]
  }
});

const catalog: ManifestCatalogEntry[] = [
  {
    manifest,
    manifestPath: "/tmp/agent-packs/pos-venda/manifest.json"
  },
  {
    manifest: catalogManifest,
    manifestPath: "/tmp/agent-packs/catalog-root/manifest.json"
  },
  {
    manifest: salesManifest,
    manifestPath: "/tmp/agent-packs/sales-copilot/manifest.json"
  }
];

void test("canonicalizeAgentId normalizes underscores and spaces", () => {
  assert.equal(canonicalizeAgentId("pos_venda"), "pos-venda");
  assert.equal(canonicalizeAgentId(" Pos Venda "), "pos-venda");
  assert.equal(canonicalizeAgentId("Pos__Venda"), "pos-venda");
  assert.equal(canonicalizeAgentId(" Pos   Venda "), "pos-venda");
});

void test("findManifestCatalogEntryByAgentId resolves normalized aliases", () => {
  const entry = findManifestCatalogEntryByAgentId(catalog, "pos_venda");

  assert.ok(entry);
  assert.equal(entry?.manifest.agent.id, "pos-venda");
});

void test("agent id helpers and installability honor catalog semantics", () => {
  assert.equal(agentIdsMatch("sales_copilot", "Sales Copilot"), true);
  assert.equal(agentIdsMatch("sales-copilot", "ops-copilot"), false);
  assert.equal(isInstallableManifest(manifest), true);
  assert.equal(isInstallableManifest(catalogManifest), false);
  assert.equal(findManifestCatalogEntryByAgentId(catalog, "missing-agent"), null);
});

void test("searchManifestCatalog filters installable entries, ranks matches and paginates", () => {
  const firstPage = searchManifestCatalog(catalog, {
    page: 1,
    pageSize: 1,
    query: "sales"
  });

  assert.equal(firstPage.page, 1);
  assert.equal(firstPage.pageSize, 1);
  assert.equal(firstPage.total, 1);
  assert.equal(firstPage.results.length, 1);
  assert.equal(firstPage.results[0]?.manifest.agent.id, "sales_copilot");
  assert.ok(firstPage.results[0]?.score > 0);
  assert.equal(firstPage.facets.domains.sales, 1);
  assert.equal(firstPage.facets.tags.sales, 2);

  const secondPage = searchManifestCatalog(catalog, {
    page: 2,
    pageSize: 1
  });

  assert.equal(secondPage.total, 2);
  assert.equal(secondPage.results.length, 1);
  assert.equal(secondPage.results[0]?.manifest.agent.id, "sales_copilot");
});

void test("searchManifestCatalog supports filters and optional catalog inclusion", () => {
  const installableOnly = searchManifestCatalog(catalog, {
    filters: {
      domains: ["directories"]
    }
  });
  assert.equal(installableOnly.total, 0);
  assert.equal(installableOnly.facets.domains.directories, undefined);

  const withCatalogEntries = searchManifestCatalog(catalog, {
    filters: {
      domains: ["directories"],
      tags: ["platform"]
    },
    includeCatalogEntries: true,
    query: "catalog"
  });

  assert.equal(withCatalogEntries.total, 1);
  assert.equal(withCatalogEntries.results[0]?.manifest.agent.id, "catalog-root");
  assert.equal(withCatalogEntries.facets.domains.directories, 1);
  assert.equal(withCatalogEntries.facets.tags.platform, 1);
});

void test("recommendAgentsForTenant boosts industry and sales-aligned agents", () => {
  const recommendations = recommendAgentsForTenant(catalog, "sales", 2);
  const topRecommendation = recommendations[0];
  const secondRecommendation = recommendations[1];

  assert.equal(recommendations.length, 2);
  assert.ok(topRecommendation !== undefined);
  assert.ok(secondRecommendation !== undefined);
  assert.equal(topRecommendation.manifest.agent.id, "sales_copilot");
  assert.ok(topRecommendation.recommendationScore > secondRecommendation.recommendationScore);
  assert.equal(recommendations.every((entry) => isInstallableManifest(entry.manifest)), true);
});

void test("loadManifestCatalog walks nested directories and only reads manifest.json files", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "birthhub-agents-catalog-"));

  try {
    const salesDir = path.join(tempDir, "sales-copilot");
    const nestedDir = path.join(tempDir, "nested", "catalog-root");
    await mkdir(salesDir, { recursive: true });
    await mkdir(nestedDir, { recursive: true });

    await writeFile(path.join(salesDir, "manifest.json"), JSON.stringify(salesManifest), "utf8");
    await writeFile(path.join(salesDir, "notes.txt"), "ignore me", "utf8");
    await writeFile(path.join(nestedDir, "manifest.json"), JSON.stringify(catalogManifest), "utf8");

    const loadedCatalog = await loadManifestCatalog(tempDir);
    const loadedIds = loadedCatalog.map((entry) => entry.manifest.agent.id).sort();

    assert.deepEqual(loadedIds, ["catalog-root", "sales_copilot"]);
    assert.equal(
      loadedCatalog.every((entry) => entry.manifestPath.endsWith("manifest.json")),
      true
    );
    assert.equal(
      loadedCatalog.every((entry) =>
        entry.manifest.agent.prompt.includes(GLOBAL_PREMIUM_PROTOCOL_MARKER)
      ),
      true
    );
    assert.equal(
      loadedCatalog.every((entry) => entry.manifest.keywords.includes("premium-100")),
      true
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});

void test("premium protocol enhancement injects the common runtime protocol", () => {
  const enhanced = enhanceManifestWithPremiumProtocol(manifest);

  assert.ok(enhanced.agent.prompt.includes(GLOBAL_PREMIUM_PROTOCOL_MARKER));
  assert.ok(enhanced.agent.prompt.includes(COMMON_PREMIUM_PROTOCOL_MARKER));

  for (const clause of REQUIRED_RUNTIME_PROTOCOL_CLAUSES) {
    assert.ok(enhanced.agent.prompt.toLowerCase().includes(clause.toLowerCase()));
  }
});
