// 
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AgentManifest } from "@birthub/agents-core";

import {
  FOUNDATION_AGENT_OVERRIDES,
  type FoundationAgentOverride
} from "../packages/agent-packs/corporate-v1/source/foundation-agent-overrides";

import { CORPORATE_SCHEMAS } from "../packages/agent-packs/corporate-v1/source/schemas";

interface HtmlAgentRecord {
  code: string;
  category: string;
  title: string;
  mission: string;
  whenToUse: string[];
  whenNotToUse?: string[];
  expectedTools: string[];
  inputs: string[];
  outputs: string[];
  guardrails: string[];
  promptBase: string;
  promptSections: {
    mission: string;
    objectives: string[];
    rules: string[];
    outputFormat: string;
  };
}

interface GeneratedAgentSource {
  id: string;
  name: string;
  origin: "birthhub-html" | "foundation";
  category: string;
  description: string;
  mission: string;
  whenToUse: string[];
  whenNotToUse?: string[];
  inputs: string[];
  outputs: string[];
  guardrails: string[];
  qualityChecklist: string[];
  keywords: string[];
  skills: Array<{ name: string; description: string }>;
  tools: Array<{ name: string; description: string }>;
  tags: AgentManifest["tags"];
  outputFormat: string;
  prompt: string;
}

const OFFICIAL_COLLECTION_VERSION = "2.3.0";
const OFFICIAL_INSTALLABLE_COUNT = 43;

const AUTONOMOUS_KEYWORDS = [
  "automacao preventiva",
  "analise proativa",
  "sinais lideres",
  "deteccao de anomalias",
  "antecipacao de decisao",
  "alerta antecipado",
  "mitigacao preventiva",
  "next best action",
  "scenario planning",
  "risk radar",
  "10 premium layers",
  "trigger ingress"
];

const AUTONOMOUS_SKILLS = [
  {
    description:
      "Detectar cedo sinais lideres, anomalias, gargalos e riscos emergentes antes que virem incidente ou perda material.",
    name: "Radar Preventivo"
  },
  {
    description:
      "Antecipar decisoes que precisam ser tomadas nos proximos ciclos e propor a melhor acao dentro da janela ideal.",
    name: "Antecipacao de Decisao"
  },
  {
    description:
      "Transformar risco ou oportunidade em plano acionavel com prioridade, dono, prazo, checkpoint e criterio de escalacao.",
    name: "Plano Preventivo"
  }
];

const AUTONOMOUS_OUTPUTS = [
  "alertas preventivos priorizados",
  "decisoes que precisam ser antecipadas",
  "plano preventivo com dono, prazo e checkpoint",
  "oportunidades capturaveis antes da janela fechar"
];

const AUTONOMOUS_GUARDRAILS = [
  "nunca esperar um risco relevante virar incidente para alertar",
  "nunca deixar dependencia critica sem dono, prazo ou checkpoint",
  "sempre explicitar impacto, urgencia, reversibilidade e confianca",
  "sempre antecipar o que pode dar errado e o que pode ser capturado antes da janela fechar"
];

const AUTONOMOUS_CHECKLIST = [
  "antecipar decisoes criticas antes da janela fechar",
  "destacar sinais lideres, nao apenas sintomas tardios",
  "apresentar risco, impacto, urgencia, dono e prazo",
  "propor mitigacao preventiva e gatilho de escalacao"
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "").replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(value);
  }

  return result;
}

function enrichInputs(inputs: string[]): string[] {
  return uniqueStrings(inputs);
}

function enrichOutputs(outputs: string[]): string[] {
  return uniqueStrings(outputs);
}

function enrichGuardrails(guardrails: string[]): string[] {
  return uniqueStrings(guardrails);
}

function enrichChecklist(qualityChecklist: string[]): string[] {
  return uniqueStrings(qualityChecklist);
}

function enrichKeywords(values: string[], extra: string[] = []): string[] {
  return uniqueStrings([...values, ...extra]).slice(0, 20);
}

function enrichTags(tags: AgentManifest["tags"]): AgentManifest["tags"] {
  return tags;
}

function mergeSkillSources(
  primary: Array<{ description: string; name: string }>,
  secondary: Array<{ description: string; name: string }>
): Array<{ description: string; name: string }> {
  const seen = new Set<string>();
  const merged: Array<{ description: string; name: string }> = [];

  for (const item of [...primary, ...secondary]) {
    const key = `${item.name}`.trim().toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(item);
  }

  return merged;
}

function toManifestPath(rootDir: string, agentId: string): string {
  return path.join(rootDir, agentId, "manifest.json");
}

async function readCurrentManifest(rootDir: string, agentId: string): Promise<AgentManifest> {
  const manifestPath = toManifestPath(rootDir, agentId);
  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw) as AgentManifest;
}

function buildFoundationSeedManifest(override: FoundationAgentOverride): AgentManifest {
  const agentName = override.name ?? titleCase(override.id.replace(/-pack$/u, "").replace(/-/gu, " "));
  const skillDescriptions = uniqueStrings(override.seedSkills ?? override.outputs).slice(0, 8);
  const toolNames = uniqueStrings(
    override.toolNames ?? ["Agent Registry", "Context Memory", "Workflow Planner", "Agent Handoff"]
  ).slice(0, 6);
  const tags = enrichTags(
    override.seedTags ?? {
      domain: ["management"],
      industry: ["cross-industry"],
      level: ["suite"],
      persona: [slugify(agentName)],
      "use-case": [override.id.replace(/-pack$/u, "")]
    }
  );

  return {
    agent: {
      changelog: [
        `${OFFICIAL_COLLECTION_VERSION} - Seed manifest generated for official foundation agent`
      ],
      description: override.description ?? override.mission,
      id: override.id,
      kind: "agent",
      name: agentName,
      prompt: override.mission,
      tenantId: "catalog",
      version: OFFICIAL_COLLECTION_VERSION
    },
    keywords: enrichKeywords(override.keywords, [slugify(agentName), "foundation seed"]),
    manifestVersion: "1.0.0",
    policies: [buildPolicy(override.id, override.guardrails, toolNames)],
    skills: buildSkillEntries(
      override.id,
      skillDescriptions.map((description) => ({
        description,
        name: titleCase(description.replace(/[.:]/gu, ""))
      }))
    ),
    tags,
    tools: buildToolEntries(
      override.id,
      toolNames.map((name) => ({
        description: `Ferramenta operacional ${name} necessaria para ${agentName} funcionar com rastreabilidade e controle.`,
        name
      }))
    )
  };
}

async function resolveFoundationManifest(
  rootDir: string,
  override: FoundationAgentOverride
): Promise<AgentManifest> {
  try {
    return await readCurrentManifest(rootDir, override.id);
  } catch {
    return buildFoundationSeedManifest(override);
  }
}

function inferHtmlAgentId(record: HtmlAgentRecord): string {
  if (record.code === "A01") {
    return "maestro-orchestrator-pack";
  }

  const titleSlug = slugify(record.title).replace(/-bot$/, "");
  return `${titleSlug}-pack`;
}

function inferHtmlTags(record: HtmlAgentRecord, agentId: string): AgentManifest["tags"] {
  const category = normalizeWhitespace(record.category).toLowerCase();
  const persona = slugify(record.title).replace(/-bot$/, "");
  const useCase = agentId.replace(/-pack$/, "");

  if (category.includes("comando")) {
    return {
      domain: ["operations", "governance"],
      industry: ["sales"],
      level: ["suite"],
      persona: [persona],
      "use-case": [useCase, "multi-agent-execution"]
    };
  }

  if (category.includes("prospec")) {
    return {
      domain: ["sales", "prospecting"],
      industry: ["sales"],
      level: ["specialist"],
      persona: [persona],
      "use-case": [useCase, "pipeline-generation"]
    };
  }

  if (category.includes("fechamento") || category.includes("receita")) {
    return {
      domain: ["sales", "revenue"],
      industry: ["sales"],
      level: ["specialist"],
      persona: [persona],
      "use-case": [useCase, "revenue-execution"]
    };
  }

  if (category.includes("retenc") || category.includes("treinamento")) {
    return {
      domain: ["customer-success", "enablement"],
      industry: ["sales"],
      level: ["specialist"],
      persona: [persona],
      "use-case": [useCase, "retention-and-growth"]
    };
  }

  return {
    domain: ["operations", "enablement"],
    industry: ["sales"],
    level: ["specialist"],
    persona: [persona],
    "use-case": [useCase, "commercial-operations"]
  };
}

function buildKeywordSet(input: {
  title: string;
  category: string;
  expectedTools: string[];
  inputs: string[];
  outputs: string[];
  extra?: string[];
}): string[] {
  const tokens = [
    input.title,
    input.category,
    ...input.expectedTools,
    ...input.inputs,
    ...input.outputs,
    ...(input.extra ?? [])
  ]
    .flatMap((value) =>
      normalizeWhitespace(value)
        .split(/[,/()\-]| e | and /i)
        .map((item) => item.trim())
        .filter((item) => item.length >= 3)
    )
    .map((item) => item.toLowerCase());

  return uniqueStrings(tokens).slice(0, 18);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function buildSkillEntries(
  agentId: string,
  items: Array<{ description: string; name: string; inputSchema?: Record<string, unknown>; outputSchema?: Record<string, unknown> }>
): AgentManifest["skills"] {
  return items.slice(0, 8).map((item, index) => ({
    description: item.description,
    id: `${agentId}.skill.${slugify(item.name || `skill-${index + 1}`)}`,
    inputSchema: item.inputSchema ?? { type: "object" },
    name: item.name,
    outputSchema: item.outputSchema ?? { type: "object" }
  }));
}

function buildToolEntries(
  agentId: string,
  items: Array<{ description: string; name: string; inputSchema?: Record<string, unknown>; outputSchema?: Record<string, unknown> }>
): AgentManifest["tools"] {
  return items.slice(0, 6).map((item, index) => ({
    description: item.description,
    id: `${agentId}.tool.${slugify(item.name || `tool-${index + 1}`)}`,
    inputSchema: item.inputSchema ?? { type: "object" },
    name: item.name,
    outputSchema: item.outputSchema ?? { type: "object" },
    timeoutMs: 15000
  }));
}

function buildPolicy(agentId: string, guardrails: string[], toolNames: string[]): AgentManifest["policies"][number] {
  const actions = uniqueStrings([
    "tool:execute",
    "monitor:read",
    "memory:read",
    "memory:write",
    "learning:read",
    "learning:write",
    "alert:write",
    "workflow:trigger",
    "decision:recommend",
    "audit:write",
    "report:read",
    "approval:request"
  ]);

  return {
    actions,
    effect: "allow",
    id: `${agentId}.policy.standard`,
    name: "Default governed autonomous operating policy"
  };
}

function buildEscalationCriteria(): string[] {
  return [];
}

function buildCompiledPrompt(input: {
  name: string;
  category: string;
  mission: string;
  whenToUse: string[];
  whenNotToUse?: string[];
  inputs: string[];
  outputs: string[];
  objectives: string[];
  rules: string[];
  tools: string[];
  guardrails: string[];
  qualityChecklist: string[];
  outputFormat: string;
}): string {
  const sections = [
    `Voce e o ${input.name} da BirthHub 360 Official Collection.`,
    "",
    "IDENTIDADE E MISSAO",
    input.mission,
    "",
    "QUANDO ACIONAR",
    ...input.whenToUse.map((item) => `- ${item}`),
    "",
    ...(input.whenNotToUse && input.whenNotToUse.length > 0
      ? ["QUANDO NAO ACIONAR", ...input.whenNotToUse.map((item) => `- ${item}`), ""]
      : []),
    "ENTRADAS OBRIGATORIAS",
    ...input.inputs.map((item) => `- ${item}`),
    "",
    "OBJETIVOS PRIORITARIOS",
    ...input.objectives.map((item) => `- ${item}`),
    "",
    "FERRAMENTAS ESPERADAS",
    ...input.tools.map((item) => `- ${item}`),
    "",
    "SAIDAS OBRIGATORIAS",
    ...input.outputs.map((item) => `- ${item}`),
    "",
    "GUARDRAILS ESPECIFICOS",
    ...uniqueStrings([...input.rules, ...input.guardrails]).map((item) => `- ${item}`),
    "",
    "CRITERIOS DE QUALIDADE ESPECIFICOS",
    ...input.qualityChecklist.map((item) => `- ${item}`),
    "",
    "FORMATO DE SAIDA",
    input.outputFormat
  ];

  return sections.join("\n");
}

function buildDefaultOutputFormat(agentId: string, outputs: string[]): string {
  return JSON.stringify(
    {
      agent_id: agentId,
      summary: "",
      status: "stable | watch | critical",
      leading_indicators: [],
      emerging_risks: [],
      opportunities_to_capture: [],
      decisions_to_anticipate: [
        {
          decision: "",
          why_now: "",
          due_window: "",
          owner: "",
          recommended_action: ""
        }
      ],
      preventive_action_plan: [
        {
          action: "",
          owner: "",
          deadline: "",
          checkpoint: "",
          expected_impact: ""
        }
      ],
        specialist_deliverables: outputs.slice(0, 6),
        approvals_or_dependencies: [],
        next_checkpoint: "",
        premium_layers: [],
        premium_score: 0,
        confidence: "low | medium | high"
      },
    null,
    2
  );
}


function buildFoundationAgent(
  manifest: AgentManifest,
  override: FoundationAgentOverride
): GeneratedAgentSource {
  const enrichedInputs = enrichInputs(override.inputs);
  const enrichedOutputs = enrichOutputs(override.outputs);
  const enrichedGuardrails = enrichGuardrails(override.guardrails);
  const qualityChecklist = enrichChecklist(override.qualityChecklist);
  const outputFormat = buildDefaultOutputFormat(override.id, enrichedOutputs);

  return {
    category: override.category,
    description: override.description ?? override.mission,
    guardrails: enrichedGuardrails,
    id: override.id,
    inputs: enrichedInputs,
    keywords: enrichKeywords(override.keywords, [
      slugify(manifest.agent.name),
      "executive automation",
      "preventive analysis",
      "autonomous execution"
    ]),
    mission: override.mission,
    name: manifest.agent.name,
    origin: "foundation",
    outputFormat,
    outputs: enrichedOutputs,
    prompt: buildCompiledPrompt({
      category: override.category,
      guardrails: enrichedGuardrails,
      inputs: enrichedInputs,
      mission: override.mission,
      name: manifest.agent.name,
      objectives: uniqueStrings([
        ...manifest.skills
          .filter((skill) => !AUTONOMOUS_SKILLS.some((s) => s.name === skill.name))
          .map((skill) => skill.description)
      ]),
      outputFormat,
      outputs: enrichedOutputs,
      qualityChecklist,
      rules: [
        "usar apenas ferramentas e politicas autorizadas",
        "manter rastreabilidade e contexto de negocio",
        "escalar para aprovacao humana quando o risco exigir"
      ],
      tools: manifest.tools.map((tool) => tool.name),
      whenNotToUse: override.whenNotToUse,
      whenToUse: override.whenToUse
    }),
    qualityChecklist,
    skills: mergeSkillSources(
      manifest.skills
        .filter((skill) => !AUTONOMOUS_SKILLS.some((s) => s.name === skill.name))
        .map((skill) => {
          const schema = CORPORATE_SCHEMAS[override.id]?.skills?.[slugify(skill.name)];
          return {
            description: skill.description,
            name: skill.name,
            inputSchema: schema?.input ?? { type: "object" },
            outputSchema: schema?.output ?? { type: "object" }
          };
        }),
      []
    ),
    tags: enrichTags(manifest.tags),
    tools: manifest.tools.map((tool) => {
      const schema = CORPORATE_SCHEMAS[override.id]?.tools?.[slugify(tool.name)];
      return {
        description: tool.description,
        name: tool.name,
        inputSchema: schema?.input ?? { type: "object" },
        outputSchema: schema?.output ?? { type: "object" }
      };
    }),
    whenToUse: override.whenToUse
  };
}

function buildHtmlAgent(record: HtmlAgentRecord, qualityChecklist: string[]): GeneratedAgentSource {
  const agentId = inferHtmlAgentId(record);
  const enrichedGuardrails = enrichGuardrails(record.guardrails);
  const enrichedInputs = uniqueStrings([...record.inputs]);
  const enrichedOutputs = uniqueStrings([...record.outputs]);
  const objectiveLines = uniqueStrings(
    record.promptSections.objectives.length > 0 ? record.promptSections.objectives : enrichedOutputs
  );

  const outputFormat = buildDefaultOutputFormat(agentId, enrichedOutputs);

  return {
    category: record.category,
    description: record.mission,
    guardrails: enrichedGuardrails,
    id: agentId,
    inputs: enrichedInputs,
    keywords: buildKeywordSet({
      title: record.title,
      category: record.category,
      expectedTools: record.expectedTools,
      inputs: enrichedInputs,
      outputs: enrichedOutputs,
      extra: ["executive automation", "preventive analysis", "autonomous execution"]
    }),
    mission: record.mission,
    name: record.title,
    origin: "birthhub-html",
    outputFormat,
    outputs: enrichedOutputs,
    qualityChecklist,
    skills: mergeSkillSources(
      objectiveLines.slice(0, 5).map((objective) => {
        const schema = CORPORATE_SCHEMAS[slugify(record.title)]?.skills?.[slugify(objective)];
        return {
          description: objective,
          name: titleCase(objective),
          inputSchema: schema?.input ?? { type: "object" },
          outputSchema: schema?.output ?? { type: "object" }
        };
      }),
      []
    ),
    tags: enrichTags({
      domain: [slugify(record.category)],
      industry: ["cross-industry"],
      level: ["operational"],
      persona: [slugify(record.title)],
      "use-case": [slugify(record.category)]
    }),
    tools: record.expectedTools.map((toolName) => {
      const schema = CORPORATE_SCHEMAS[slugify(record.title)]?.tools?.[slugify(toolName)];
      return {
        description: `Operational tool ${toolName} required by ${record.title}.`,
        name: toolName,
        inputSchema: schema?.input ?? { type: "object" },
        outputSchema: schema?.output ?? { type: "object" }
      };
    }),
    prompt: buildCompiledPrompt({
      category: record.category,
      guardrails: enrichedGuardrails,
      inputs: enrichedInputs,
      mission: record.mission,
      name: record.title,
      objectives: objectiveLines,
      outputFormat,
      outputs: enrichedOutputs,
      qualityChecklist,
      rules: record.promptSections.rules,
      tools: record.expectedTools,
      whenNotToUse: record.whenNotToUse,
      whenToUse: record.whenToUse
    }),
    whenNotToUse: record.whenNotToUse,
    whenToUse: record.whenToUse
  };
}

function toManifest(source: GeneratedAgentSource): AgentManifest {
  return {
    agent: {
      changelog: [
        `${OFFICIAL_COLLECTION_VERSION} - BirthHub 360 collection upgraded with autonomous preventive operation, segment adaptation and stronger shared learning`
      ],
      description: source.description,
      id: source.id,
      kind: "agent",
      name: source.name,
      prompt: source.prompt,
      tenantId: "catalog",
      version: OFFICIAL_COLLECTION_VERSION
    },
    keywords: source.keywords,
    manifestVersion: "1.0.0",
    policies: [buildPolicy(source.id, source.guardrails, source.tools.map((tool) => tool.name))],
    skills: buildSkillEntries(source.id, source.skills),
    tags: source.tags,
    tools: buildToolEntries(source.id, source.tools)
  };
}

function buildCollectionDescriptor(installableCount: number): AgentManifest {
  return {
    agent: {
      changelog: [
        `${OFFICIAL_COLLECTION_VERSION} - BirthHub 360 descriptor updated for the autonomous preventive ${installableCount}-agent official lineup`
      ],
      description:
        "Collection descriptor for the unified BirthHub 360 official lineup of governed, preventive and high-performance autonomous agents.",
      id: "corporate-v1-catalog",
      kind: "catalog",
      name: "BirthHub 360 Official Collection",
      prompt:
        "Coordinate and expose the full BirthHub 360 official collection, separating collection governance from installable agents and highlighting the autonomous preventive operating model and agent mesh routing.",
      tenantId: "catalog",
      version: OFFICIAL_COLLECTION_VERSION
    },
    keywords: [
      "birthhub 360",
      "official collection",
      "agent catalog",
      "marketplace governance",
      "collection descriptor"
    ],
    manifestVersion: "1.0.0",
    policies: [
      {
        actions: ["report:read", "audit:write"],
        effect: "allow",
        id: "corporate-v1-catalog.policy.standard",
        name: "Collection governance policy"
      }
    ],
    skills: [
      {
        description: "Expose catalog metadata and collection governance across the marketplace.",
        id: "corporate-v1-catalog.skill.collection-governance",
        inputSchema: { type: "object" },
        name: "Collection Governance",
        outputSchema: { type: "object" }
      },
      {
        description: "Support discovery, documentation and segmentation of the official lineup.",
        id: "corporate-v1-catalog.skill.collection-discovery",
        inputSchema: { type: "object" },
        name: "Collection Discovery",
        outputSchema: { type: "object" }
      }
    ],
    tags: {
      domain: ["management"],
      industry: ["sales"],
      level: ["suite"],
      persona: ["catalog-admin"],
      "use-case": ["discover", "governance"]
    },
    tools: [
      {
        description: "Expose official collection metadata for marketplace and documentation surfaces.",
        id: "corporate-v1-catalog.tool.collection-index",
        inputSchema: { type: "object" },
        name: "Collection Index",
        outputSchema: { type: "object" },
        timeoutMs: 15000
      }
    ]
  };
}

async function cleanGeneratedAgentDirs(rootDir: string, keepIds: Set<string>): Promise<void> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const managedDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  await Promise.all(
    managedDirs
      .filter((dirName) => !keepIds.has(dirName))
      .map((dirName) => rm(path.join(rootDir, dirName), { force: true, recursive: true }))
  );
}

async function main(): Promise<void> {
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = path.resolve(scriptsDir, "..");
  const collectionRoot = path.join(workspaceRoot, "packages", "agent-packs", "corporate-v1");
  const sourceRoot = path.join(collectionRoot, "source");
  const htmlSourcePath = path.join(sourceRoot, "birthhub-html-agents.json");
  const officialSourcePath = path.join(sourceRoot, "official-collection.json");

  const htmlAgents = JSON.parse(await readFile(htmlSourcePath, "utf8")) as HtmlAgentRecord[];
  const foundationAgents = await Promise.all(
    FOUNDATION_AGENT_OVERRIDES.map(async (override) =>
      buildFoundationAgent(await resolveFoundationManifest(collectionRoot, override), override)
    )
  );
  const htmlGeneratedAgents = htmlAgents.map((record) => buildHtmlAgent(record, AUTONOMOUS_CHECKLIST));
  const combinedAgents = [...foundationAgents, ...htmlGeneratedAgents].sort((left, right) =>
    left.name.localeCompare(right.name)
  );

  if (combinedAgents.length !== OFFICIAL_INSTALLABLE_COUNT) {
    throw new Error(`Expected ${OFFICIAL_INSTALLABLE_COUNT} installable agents, found ${combinedAgents.length}.`);
  }

  const keptIds = new Set<string>(combinedAgents.map((agent) => agent.id));
  keptIds.add("corporate-v1-catalog");
  keptIds.add("source");
  keptIds.add("config");
  keptIds.add("prompts");
  keptIds.add("tests");

  await cleanGeneratedAgentDirs(collectionRoot, keptIds);

  for (const agent of combinedAgents) {
    const manifest = toManifest(agent);
    const targetDir = path.join(collectionRoot, agent.id);
    await mkdir(targetDir, { recursive: true });
    await writeFile(path.join(targetDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  await writeFile(
    path.join(collectionRoot, "manifest.json"),
    `${JSON.stringify(buildCollectionDescriptor(combinedAgents.length), null, 2)}\n`,
    "utf8"
  );

  await writeFile(
    officialSourcePath,
    `${JSON.stringify(
      {
        collection: {
          id: "birthhub-360-official-collection",
          installableCount: combinedAgents.length,
          manifestDescriptorId: "corporate-v1-catalog",
          name: "BirthHub 360 Official Collection",
          version: OFFICIAL_COLLECTION_VERSION
        },
        generatedAt: new Date().toISOString(),
        agents: combinedAgents
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`Generated BirthHub 360 official collection with ${combinedAgents.length} installable agents.`);
}

void main();
