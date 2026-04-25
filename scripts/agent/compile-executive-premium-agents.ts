import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  PREMIUM_PILLARS,
  TOTAL_PREMIUM_LAYER_COUNT,
  type AgentManifest
} from "@birthub/agents-core";

import {
  KNOWN_TOOL_DESCRIPTIONS,
  KNOWN_TOOL_SCHEMAS,
  STANDARD_POLICY_ACTIONS,
  getWorkspaceRoot,
  slugify,
  splitSentences,
  titleCase,
  uniqueStrings
} from "./github-agent-collection";

const EXECUTIVE_COLLECTION_DIRNAME = "executive-premium-v1";
const EXECUTIVE_COLLECTION_DESCRIPTOR_ID = "executive-premium-v1-catalog";
const EXECUTIVE_COLLECTION_NAME = "Executive Premium Agents Collection";
const EXECUTIVE_COLLECTION_VERSION = "1.0.0";
const EXECUTIVE_SOURCE_SUBDIR = "source";

const EXECUTIVE_PREMIUM_TOOL_SCHEMAS: Record<string, object> = {
  "alert-dispatcher": {
    type: "object",
    properties: {
      audience: { type: "string" },
      priority: { type: "string", enum: ["critical", "high", "normal"] },
      summary: { type: "string" }
    },
    required: ["audience", "summary"]
  },
  "approval-choreographer": {
    type: "object",
    properties: {
      approvers: { type: "array", items: { type: "string" } },
      artifact: { type: "object" },
      rationale: { type: "string" }
    },
    required: ["approvers", "artifact"]
  },
  "evidence-scorecard": {
    type: "object",
    properties: {
      evidence: { type: "array", items: { type: "object" } },
      confidenceScale: { type: "string" },
      hypothesis: { type: "array", items: { type: "string" } }
    }
  }
};

const EXECUTIVE_PREMIUM_TOOL_DESCRIPTIONS: Record<string, string> = {
  "alert-dispatcher": "Emitir alerta preventivo priorizado com contexto, risco e proximo checkpoint.",
  "approval-choreographer": "Organizar aprovacoes, dependencias humanas e excecoes de policy com rastreabilidade.",
  "evidence-scorecard": "Pontuar qualidade de evidencia, confianca, lacunas e necessidade de escalacao."
};

const EXECUTION_HARNESS_PHRASES = [
  "status `success`",
  "status `fallback`",
  "fallback aplicado",
  "output `status=error`",
  "todos eventos emitidos",
  "output esperado",
  "validar evento de observabilidade",
  "executar teste com",
  "simular falha",
  "acompanhar `observability.events`",
  "mode=human_handoff"
];

const EXECUTION_HARNESS_LABELS = [
  "sucesso nominal",
  "dados faltantes",
  "falha parcial de tool",
  "hard fail",
  "observabilidade",
  "output esperado",
  "criterio",
  "como verificar"
];

const EXECUTIVE_COMMON_PROMPT_PHRASES = [
  "camadas premium",
  "score premium consolidado",
  "memoria operacional premium",
  "handoff governado",
  "recomendacoes prescritivas priorizadas",
  "plano preventivo com dono, prazo e checkpoint",
  "riscos priorizados com mitigacao",
  "producir recomendacoes prescritivas"
];

function normalizePromptText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

function filterCommonBullets(values: string[], phrases: string[]): string[] {
  return values.filter((value) => {
    const normalized = normalizePromptText(value);
    return normalized.length > 0 && !phrases.some((phrase) => normalized.includes(phrase));
  });
}

function isHarnessLabel(value: string): boolean {
  return EXECUTION_HARNESS_LABELS.includes(normalizePromptText(value));
}

const DEFAULT_INPUTS = [
  "objetivo do usuario ou evento gatilho",
  "contexto operacional relevante",
  "restricoes e limites de execucao",
  "tenant e escopo da decisao executiva"
];

async function listAgentSourceDirectories(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

async function cleanGeneratedCollection(collectionRoot: string): Promise<void> {
  const entries = await readdir(collectionRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === EXECUTIVE_SOURCE_SUBDIR) {
      continue;
    }

    await rm(path.join(collectionRoot, entry.name), { force: true, recursive: true });
  }
}

function readScalar(rawText: string, key: string): string {
  const match = rawText.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

function extractNestedYamlList(rawText: string, parentKey: string, childKey: string): string[] {
  const lines = rawText.replace(/\r/g, "").split("\n");
  const result: string[] = [];
  let inParent = false;
  let inChild = false;

  for (const line of lines) {
    if (/^\S/.test(line)) {
      const normalized = line.trim();
      if (normalized === `${parentKey}:`) {
        inParent = true;
        inChild = false;
        continue;
      }

      if (inParent) {
        break;
      }
    }

    if (!inParent) {
      continue;
    }

    if (/^ {2}\S/.test(line)) {
      const normalized = line.trim();
      if (normalized === `${childKey}:`) {
        inChild = true;
        continue;
      }

      inChild = false;
    }

    if (!inChild) {
      continue;
    }

    const itemMatch = line.match(/^ {4}-\s+(.+)$/);
    if (itemMatch?.[1]) {
      result.push(itemMatch[1].trim());
    }
  }

  return uniqueStrings(result);
}

function extractTopLevelSchemaProperties(rawText: string, schemaKey: string): string[] {
  const lines = rawText.replace(/\r/g, "").split("\n");
  const result: string[] = [];
  let inSchema = false;
  let inProperties = false;

  for (const line of lines) {
    if (/^\S/.test(line)) {
      const normalized = line.trim();
      if (normalized === `${schemaKey}:`) {
        inSchema = true;
        inProperties = false;
        continue;
      }

      if (inSchema) {
        break;
      }
    }

    if (!inSchema) {
      continue;
    }

    if (/^ {2}\S/.test(line)) {
      const normalized = line.trim();
      if (normalized === "properties:") {
        inProperties = true;
        continue;
      }

      if (inProperties) {
        break;
      }
    }

    if (!inProperties) {
      continue;
    }

    const propertyMatch = line.match(/^ {4}([A-Za-z0-9_]+):\s*$/);
    if (propertyMatch?.[1]) {
      result.push(propertyMatch[1].trim());
    }
  }

  return uniqueStrings(result);
}

function parseMarkdownSections(rawText: string): Record<string, string> {
  const sections = new Map<string, string[]>();
  let currentHeading: string | null = null;

  for (const rawLine of rawText.replace(/\r/g, "").split("\n")) {
    const headingMatch = rawLine.match(/^##\s+(.+?)\s*$/);
    if (headingMatch?.[1]) {
      currentHeading = headingMatch[1].trim();
      sections.set(currentHeading, []);
      continue;
    }

    if (currentHeading) {
      sections.get(currentHeading)?.push(rawLine.trimEnd());
    }
  }

  return Object.fromEntries(
    Array.from(sections.entries()).map(([heading, lines]) => [heading, lines.join("\n").trim()])
  );
}

function parsePromptMetadata(rawText: string) {
  const sections = parseMarkdownSections(rawText);

  return {
    context:
      rawText.match(/\*\*Context:\*\*\s*(.+)$/m)?.[1]?.trim() ??
      "Operar com contexto executivo, risco explicito e prontidao para decisao.",
    objective:
      rawText.match(/\*\*Objective:\*\*\s*(.+)$/m)?.[1]?.trim() ??
      "Entregar uma recomendacao executiva clara, governada e acionavel.",
    persona:
      rawText.match(/\*\*Persona:\*\*\s*(.+)$/m)?.[1]?.trim() ??
      "You are an executive operator focused on clarity, governance, and decision quality.",
    sections
  };
}

function parseAcceptanceRows(rawText: string) {
  const rows: Array<{
    criterion: string;
    evidence: string;
    expectedOutput: string;
    verification: string;
  }> = [];

  const lines = rawText.replace(/\r/g, "").split("\n");

  for (const line of lines) {
    if (!line.startsWith("|")) {
      continue;
    }

    if (line.includes("---") || line.includes("Criterio")) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length < 5) {
      continue;
    }

    rows.push({
      criterion: cells[0] ?? "",
      evidence: cells[4] ?? "",
      expectedOutput: cells[2] ?? "",
      verification: cells[3] ?? ""
    });
  }

  return rows;
}

function parseToolIds(rawText: string): string[] {
  const arrayMatch = rawText.match(/TOOL_IDS\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!arrayMatch?.[1]) {
    return [];
  }

  return uniqueStrings(
    Array.from(arrayMatch[1].matchAll(/"([^"]+)"/g)).map((match) => match[1] ?? "").filter(Boolean)
  );
}

function toHumanLabel(value: string): string {
  const withSpaces = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (["AI", "CRM", "ERP", "HR", "KPI", "CFO", "CEO", "COO", "CTO", "CRO"].includes(upper)) {
        return upper;
      }

      if (upper === "XRAY") {
        return "X-Ray";
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function sentenceFromProperty(propertyName: string): string {
  const label = toHumanLabel(propertyName).toLowerCase();
  return `${label} devidamente contextualizado`;
}

function normalizeSentence(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[.]+$/g, "").trim();
}

function inferDomainTags(corpus: string): string[] {
  const text = corpus.toLowerCase();
  const tags = new Set<string>(["management"]);

  if (/(board|capital|budget|pricing|quota|pipeline|forecast|margin|revenue)/.test(text)) {
    tags.add("finance");
  }

  if (/(churn|expansion|renewal|retention|market|trend|growth)/.test(text)) {
    tags.add("growth");
  }

  if (/(brand|narrative|communication|crisis)/.test(text)) {
    tags.add("communications");
  }

  if (/(culture|people|leadership|engagement)/.test(text)) {
    tags.add("people");
  }

  if (/(competitor|market|pricing|quota|pipeline)/.test(text)) {
    tags.add("strategy");
  }

  return Array.from(tags).slice(0, 3);
}

function inferIndustryTags(domainTags: string[]): string[] {
  if (domainTags.includes("finance")) {
    return ["sales", "finance"];
  }

  if (domainTags.includes("growth") || domainTags.includes("strategy")) {
    return ["sales", "cross-industry"];
  }

  return ["cross-industry"];
}

function inferUseCases(slug: string, objectives: string[]): string[] {
  return uniqueStrings([
    slug,
    "executive-premium",
    "decision-support",
    "premium-governance",
    ...objectives.map((item) => slugify(item))
  ]).slice(0, 6);
}

function deriveObjectives(input: {
  acceptanceRows: ReturnType<typeof parseAcceptanceRows>;
  contractDescription: string;
  promptObjective: string;
  promptContext: string;
}): string[] {
  const acceptanceObjectives = input.acceptanceRows
    .flatMap((row) => splitSentences(row.expectedOutput))
    .map(normalizeSentence)
    .filter((item) => item.length >= 12);

  const contextualObjectives = [
    normalizeSentence(input.promptObjective),
    normalizeSentence(input.contractDescription),
    ...splitSentences(input.promptContext).map(normalizeSentence)
  ].filter((item) => item.length >= 12);

  return uniqueStrings(
    filterCommonBullets([...contextualObjectives, ...acceptanceObjectives], [
      ...EXECUTION_HARNESS_PHRASES,
      ...EXECUTIVE_COMMON_PROMPT_PHRASES
    ])
  ).slice(0, 6);
}

function deriveOutputs(agentLabel: string, objectives: string[]): string[] {
  return uniqueStrings(filterCommonBullets([
    `${agentLabel} brief pronto para decisao`,
    ...objectives
  ], [...EXECUTION_HARNESS_PHRASES, ...EXECUTIVE_COMMON_PROMPT_PHRASES])).slice(0, 6);
}

function deriveGuardrails(promptSections: Record<string, string>): string[] {
  return uniqueStrings([
    ...promptSections["Explicit Restrictions"]
      ?.split("\n")
      .map((line) => line.trim().replace(/^-+\s*/, ""))
      .filter(Boolean),
    ...splitSentences(promptSections["Anti-Hallucination Guardrail"] ?? ""),
    ...splitSentences(promptSections["Fallback Instructions"] ?? "")
  ]).slice(0, 10);
}

function deriveQualityChecklist(acceptanceRows: ReturnType<typeof parseAcceptanceRows>): string[] {
  const acceptanceChecklist = acceptanceRows.flatMap((row) => [
    normalizeSentence(row.criterion),
    normalizeSentence(row.verification)
  ]);

  return uniqueStrings(
    filterCommonBullets(
      acceptanceChecklist.filter((item) => item.length >= 8 && !isHarnessLabel(item)),
      EXECUTION_HARNESS_PHRASES
    )
  ).slice(0, 10);
}

function pushBulletSection(lines: string[], heading: string, bullets: string[]): void {
  if (bullets.length === 0) {
    return;
  }

  lines.push(heading, ...bullets.map((item) => `- ${item}`), "");
}

function buildSkills(agentId: string, objectives: string[]): AgentManifest["skills"] {
  const objectiveSkills = objectives.slice(0, 6).map((objective) => ({
    description: objective,
    id: `${agentId}.skill.${slugify(objective).slice(0, 64) || "objective"}`,
    inputSchema: { type: "object" },
    name: titleCase(objective.replace(/[.:]/g, "")),
    outputSchema: { type: "object" }
  }));

  const premiumSkills = PREMIUM_PILLARS.map((pillar) => ({
    description: pillar.purpose,
    id: `${agentId}.skill.${pillar.id}`,
    inputSchema: { type: "object" },
    name: pillar.name,
    outputSchema: { type: "object" }
  }));

  return [...objectiveSkills, ...premiumSkills];
}

function prettifyToolName(toolId: string): string {
  return titleCase(toolId.replace(/[-_]+/g, " "))
    .replace(/\bCrm\b/g, "CRM")
    .replace(/\bErp\b/g, "ERP")
    .replace(/\bHr\b/g, "HR")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bKpi\b/g, "KPI");
}

function buildTools(agentId: string, sourceToolIds: string[]): AgentManifest["tools"] {
  const toolIds = uniqueStrings([
    ...sourceToolIds,
    "data-processor",
    "evidence-scorecard",
    "memory-vault",
    "recommendation-engine",
    "segment-adapter",
    "premium-layer-engine",
    "approval-choreographer",
    "workflow-trigger-router",
    "handoff",
    "alert-dispatcher"
  ]);

  return toolIds.map((toolId) => ({
    description:
      EXECUTIVE_PREMIUM_TOOL_DESCRIPTIONS[toolId] ??
      KNOWN_TOOL_DESCRIPTIONS[toolId] ??
      `Executar a capacidade premium '${toolId}' de forma governada e rastreavel.`,
    id: `${agentId}.tool.${slugify(toolId)}`,
    inputSchema:
      EXECUTIVE_PREMIUM_TOOL_SCHEMAS[toolId] ??
      (KNOWN_TOOL_SCHEMAS[toolId] as object) ??
      { type: "object" },
    name: prettifyToolName(toolId),
    outputSchema: { type: "object" },
    timeoutMs: 15_000
  }));
}

function buildOutputFormat(agentId: string, outputs: string[]): string {
  const deliverables = outputs.slice(0, 6).map((item) => `    "${item}"`).join(",\n");

  return `{
  "agent_id": "${agentId}",
  "summary": "",
  "status": "stable | watch | critical",
  "evidence_confidence": "low | medium | high",
  "leading_indicators": [],
  "emerging_risks": [],
  "opportunities_to_capture": [],
  "decisions_to_anticipate": [],
  "preventive_action_plan": [],
  "specialist_deliverables": [
${deliverables}
  ],
  "premium_layers_activated": [],
  "premium_score": 0,
  "memory_writeback_required": true,
  "approvals_or_dependencies": [],
  "next_checkpoint": ""
}`;
}

function renderPrompt(input: {
  agentId: string;
  agentLabel: string;
  context: string;
  guardrails: string[];
  inputs: string[];
  mission: string;
  objectives: string[];
  outputs: string[];
  persona: string;
  qualityChecklist: string[];
  toolNames: string[];
  whenToUse: string[];
}): string {
  const lines = [
    `Voce e o ${input.agentLabel} da ${EXECUTIVE_COLLECTION_NAME}.`,
    "",
    "IDENTIDADE E MISSAO",
    `Persona premium: ${input.persona}`,
    `Missao: ${input.mission}`,
    `Contexto executivo: ${input.context}`,
    "",
    "QUANDO ACIONAR",
    ...input.whenToUse.map((item) => `- ${item}`),
    "",
    "ENTRADAS OBRIGATORIAS",
    ...input.inputs.map((item) => `- ${item}`),
    "",
    "OBJETIVOS PRIORITARIOS",
    ...input.objectives.map((item) => `- ${item}`),
    "",
    "FERRAMENTAS ESPERADAS",
    ...input.toolNames.map((item) => `- ${item}`),
    "",
    "SAIDAS OBRIGATORIAS",
    ...input.outputs.map((item) => `- ${item}`),
    ""
  ];

  pushBulletSection(lines, "GUARDRAILS ESPECIFICOS", input.guardrails);
  pushBulletSection(lines, "CRITERIOS DE QUALIDADE ESPECIFICOS", input.qualityChecklist);

  lines.push(
    "FORMATO DE SAIDA",
    buildOutputFormat(input.agentId, input.outputs)
  );

  return lines.join("\n");
}

function buildManifest(input: {
  agentLabel: string;
  contractDescription: string;
  contractEvents: string[];
  contractMetrics: string[];
  folderName: string;
  guardrails: string[];
  inputs: string[];
  objectives: string[];
  promptContext: string;
  promptObjective: string;
  promptPersona: string;
  qualityChecklist: string[];
  sourceToolIds: string[];
  whenToUse: string[];
}): AgentManifest {
  const agentId = `${slugify(input.folderName)}-premium-pack`;
  const corpus = [
    input.contractDescription,
    input.promptContext,
    input.promptObjective,
    input.promptPersona,
    input.sourceToolIds.join(" ")
  ].join(" ");
  const domainTags = inferDomainTags(corpus);
  const outputs = deriveOutputs(input.agentLabel, input.objectives);
  const tools = buildTools(agentId, input.sourceToolIds);
  const toolNames = tools.map((tool) => tool.name);
  const mission = `${input.promptObjective} ${input.contractDescription}`.trim();
  const prompt = renderPrompt({
    agentId,
    agentLabel: input.agentLabel,
    context: input.promptContext,
    guardrails: input.guardrails,
    inputs: input.inputs,
    mission,
    objectives: input.objectives,
    outputs,
    persona: input.promptPersona,
    qualityChecklist: input.qualityChecklist,
    toolNames,
    whenToUse: input.whenToUse
  });

  return {
    agent: {
      changelog: [
        `${EXECUTIVE_COLLECTION_VERSION} - Migrated from packages/agents/executivos/${input.folderName} into the canonical executive-premium-v1 collection`,
        `${EXECUTIVE_COLLECTION_VERSION} - Upgraded with ${TOTAL_PREMIUM_LAYER_COUNT} premium layers, communication rigor and decision intelligence`
      ],
      description: input.contractDescription,
      id: agentId,
      kind: "agent",
      name: input.agentLabel,
      prompt,
      tenantId: "catalog",
      version: EXECUTIVE_COLLECTION_VERSION
    },
    keywords: uniqueStrings([
      slugify(input.agentLabel).replace(/-/g, " "),
      input.folderName,
      ...domainTags,
      ...inferIndustryTags(domainTags),
      ...input.sourceToolIds,
      ...input.objectives.map((item) => item.toLowerCase()),
      ...PREMIUM_PILLARS.map((pillar) => pillar.id),
      "executive premium agents",
      "premium-100",
      "communication-premium",
      "decision-intelligence",
      "manifest runtime",
      "premium governance"
    ]).slice(0, 28),
    manifestVersion: "1.0.0",
    policies: [
      {
        actions: uniqueStrings([
          ...STANDARD_POLICY_ACTIONS,
          "alert:emit",
          "handoff:delegate",
          "evidence:score"
        ]),
        effect: "allow",
        id: `${agentId}.policy.standard`,
        name: "Executive premium governed execution policy"
      }
    ],
    skills: buildSkills(agentId, input.objectives),
    tags: {
      domain: domainTags,
      industry: inferIndustryTags(domainTags),
      level: ["suite"],
      persona: [slugify(input.agentLabel)],
      "use-case": inferUseCases(slugify(input.folderName), input.objectives)
    },
    tools
  };
}

async function buildManifestFromSourceDir(sourceDir: string): Promise<{
  manifest: AgentManifest;
  outputDirName: string;
}> {
  const folderName = path.basename(sourceDir);
  const [contractText, promptText, acceptanceText, toolsText] = await Promise.all([
    readFile(path.join(sourceDir, "contract.yaml"), "utf8"),
    readFile(path.join(sourceDir, "system_prompt.md"), "utf8"),
    readFile(path.join(sourceDir, "acceptance.md"), "utf8"),
    readFile(path.join(sourceDir, "tools.ts"), "utf8")
  ]);

  const prompt = parsePromptMetadata(promptText);
  const acceptanceRows = parseAcceptanceRows(acceptanceText);
  const contractDescription = readScalar(contractText, "description");
  const topLevelInputs = extractTopLevelSchemaProperties(contractText, "input_schema").map(sentenceFromProperty);
  const sourceToolIds = parseToolIds(toolsText);
  const agentLabel = `${toHumanLabel(readScalar(contractText, "name") || folderName)} Premium Agent`;
  const contractEvents = extractNestedYamlList(contractText, "observability", "events");
  const contractMetrics = extractNestedYamlList(contractText, "observability", "metrics");
  const objectives = deriveObjectives({
    acceptanceRows,
    contractDescription,
    promptContext: prompt.context,
    promptObjective: prompt.objective
  });
  const guardrails = uniqueStrings([
    ...deriveGuardrails(prompt.sections),
    "nunca executar acao irreversivel sem score de evidencia suficiente",
    "nunca emitir recomendacao premium sem explicitar sinais, lacunas e dependencias"
  ]).slice(0, 10);
  const qualityChecklist = uniqueStrings([
    ...deriveQualityChecklist(acceptanceRows),
    ...contractEvents.map((item) => `validar evento de observabilidade: ${item}`),
    ...contractMetrics.map((item) => `registrar metrica de observabilidade: ${item}`)
  ]).slice(0, 12);
  const inputs = uniqueStrings([
    ...DEFAULT_INPUTS,
    ...topLevelInputs,
    "evidencias e sinais relevantes do periodo",
    "restricoes de governanca, aprovacao e prazo"
  ]).slice(0, 8);
  const whenToUse = uniqueStrings([
    contractDescription,
    prompt.objective,
    ...splitSentences(prompt.context)
  ]).slice(0, 6);
  const manifest = buildManifest({
    agentLabel,
    contractDescription,
    contractEvents,
    contractMetrics,
    folderName,
    guardrails,
    inputs,
    objectives,
    promptContext: prompt.context,
    promptObjective: prompt.objective,
    promptPersona: prompt.persona,
    qualityChecklist,
    sourceToolIds,
    whenToUse
  });

  return {
    manifest,
    outputDirName: `${folderName}-premium-pack`
  };
}

function buildCollectionManifest(): AgentManifest {
  return {
    agent: {
      changelog: [
        `${EXECUTIVE_COLLECTION_VERSION} - Introduced the canonical collection for 15 executive premium agents migrated into agent-packs`,
        `${EXECUTIVE_COLLECTION_VERSION} - Added ${TOTAL_PREMIUM_LAYER_COUNT} shared premium layers with communication rigor and decision intelligence`
      ],
      description:
        "Collection descriptor for the executive premium lineup migrated into the canonical agent-packs catalog with reinforced governance, evidence scoring and multi-layer premium execution.",
      id: EXECUTIVE_COLLECTION_DESCRIPTOR_ID,
      kind: "catalog",
      name: EXECUTIVE_COLLECTION_NAME,
      prompt: [
        "Coordinate and expose the Executive Premium Agents Collection, highlighting the canonical migration into agent-packs, the runtime premium protocol and the governed executive standard.",
        "",
        "Use the collection metadata to discover the right executive specialist, explain the domain fit and preserve the canonical source manifests in agent-packs."
      ].join("\n"),
      tenantId: "catalog",
      version: EXECUTIVE_COLLECTION_VERSION
    },
    keywords: [
      "executive premium agents",
      "canonical agent-packs",
      "executive lineup",
      "premium-100",
      "premium layers",
      "decision memory grid",
      "communication-premium",
      "evidence scorecard",
      "governed execution"
    ],
    manifestVersion: "1.0.0",
    policies: [
      {
        actions: ["report:read", "audit:write"],
        effect: "allow",
        id: `${EXECUTIVE_COLLECTION_DESCRIPTOR_ID}.policy.catalog`,
        name: "Executive premium collection governance policy"
      }
    ],
    skills: [
      {
        description: "Expose collection metadata, migration context and premium-layer governance.",
        id: `${EXECUTIVE_COLLECTION_DESCRIPTOR_ID}.skill.collection-governance`,
        inputSchema: { type: "object" },
        name: "Collection Governance",
        outputSchema: { type: "object" }
      },
      {
        description: "Support discovery, segmentation and documentation of the executive premium lineup.",
        id: `${EXECUTIVE_COLLECTION_DESCRIPTOR_ID}.skill.collection-discovery`,
        inputSchema: { type: "object" },
        name: "Collection Discovery",
        outputSchema: { type: "object" }
      }
    ],
    tags: {
      domain: ["management", "strategy"],
      industry: ["cross-industry"],
      level: ["suite"],
      persona: ["catalog-admin"],
      "use-case": ["discover", "governance", "executive-premium"]
    },
    tools: [
      {
        description: "Expose collection metadata for marketplace and documentation surfaces.",
        id: `${EXECUTIVE_COLLECTION_DESCRIPTOR_ID}.tool.collection-index`,
        inputSchema: { type: "object" },
        name: "Collection Index",
        outputSchema: { type: "object" },
        timeoutMs: 15_000
      }
    ]
  };
}

async function main(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  const collectionRoot = path.join(
    workspaceRoot,
    "packages",
    "agent-packs",
    EXECUTIVE_COLLECTION_DIRNAME
  );
  const sourceRoot = path.join(collectionRoot, EXECUTIVE_SOURCE_SUBDIR);

  await mkdir(collectionRoot, { recursive: true });
  await cleanGeneratedCollection(collectionRoot);

  const sourceDirs = await listAgentSourceDirectories(sourceRoot);
  const collectionManifest = buildCollectionManifest();
  await writeFile(
    path.join(collectionRoot, "manifest.json"),
    `${JSON.stringify(collectionManifest, null, 2)}\n`,
    "utf8"
  );

  for (const sourceDir of sourceDirs) {
    const { manifest, outputDirName } = await buildManifestFromSourceDir(sourceDir);
    const outputDir = path.join(collectionRoot, outputDirName);
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  console.log(
    `Compiled ${sourceDirs.length} executive premium agents into ${path.relative(workspaceRoot, collectionRoot)}.`
  );
}

void main();
