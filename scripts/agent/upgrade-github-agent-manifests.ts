// @ts-expect-error TODO: remover suppressão ampla
//
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { isInstallableManifest, loadManifestCatalog, type AgentManifest } from "@birthub/agents-core";

import {
  GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
  getGithubAgentCollectionRoot,
  getWorkspaceRoot
} from "./github-agent-collection";

const MARKET_GRADE_VERSION = "1.2.0";

const PROMPT_SECTIONS = [
  "IDENTIDADE E MISSAO",
  "QUANDO ACIONAR",
  "ENTRADAS OBRIGATORIAS",
  "RACIOCINIO OPERACIONAL ESPERADO",
  "MODO DE OPERACAO AUTONOMA",
  "ROTINA DE MONITORAMENTO E ANTECIPACAO",
  "CRITERIOS DE PRIORIZACAO",
  "CRITERIOS DE ESCALACAO",
  "OBJETIVOS PRIORITARIOS",
  "FERRAMENTAS ESPERADAS",
  "SAIDAS OBRIGATORIAS",
  "GUARDRAILS",
  "CHECKLIST DE QUALIDADE",
  "APRENDIZADO COMPARTILHADO",
  "FORMATO DE SAIDA"
] as const;

const MARKET_GRADE_SKILLS = [
  {
    description: "Processar sinais numericos e textuais para separar padrao, risco, outlier e urgencia acionavel.",
    name: "Data Processing Excellence"
  },
  {
    description: "Fundir sinais de varias fontes em uma leitura unica para decidir com mais confianca e menos ruido.",
    name: "Cross-Signal Fusion"
  },
  {
    description: "Modelar linguagem, risco e plano de execucao pelo segmento, maturidade e geografia do cliente.",
    name: "Segment Intelligence"
  },
  {
    description: "Converter diagnostico em recomendacoes prescritivas, priorizadas e com proximo passo claro.",
    name: "Prescriptive Recommendation Engine"
  },
  {
    description: "Salvar memoria operacional reutilizavel com contexto, decisao, evidencias e checkpoint.",
    name: "Operational Memory Writeback"
  },
  {
    description: "Detectar cedo sinais lideres, gargalos e anomalias antes que virem perda material ou incidente.",
    name: "Risk Radar"
  },
  {
    description: "Encontrar crescimento, expansao, ganho de eficiencia e upside antes da janela fechar.",
    name: "Opportunity Radar"
  },
  {
    description: "Adaptar linguagem, pitch, plano e criterio de decisao ao segmento e maturidade do cliente.",
    name: "Client Segment Adaptation"
  },
  {
    description: "Preparar contexto estruturado para handoff entre especialistas sem perda de continuidade.",
    name: "Agent Mesh Collaboration"
  },
  {
    description: "Aplicar governanca, aprovacao e rastreabilidade reforcadas em fluxos sensiveis.",
    name: "Governance Shield"
  },
  {
    description: "Transformar eventos reais de entrada em execucao governada, pronta para workflows e orquestracao.",
    name: "Workflow Trigger Readiness"
  }
];

const MARKET_GRADE_KEYWORDS = [
  "data processing",
  "cross-signal fusion",
  "segment intelligence",
  "prescriptive recommendations",
  "operational memory",
  "risk radar",
  "opportunity radar",
  "governance shield",
  "segment adaptation",
  "multi-agent collaboration",
  "workflow trigger readiness",
  "client segment",
  "next best action",
  "shared context"
];

const MARKET_GRADE_USE_CASES = [
  "data-processing",
  "cross-signal-fusion",
  "segment-intelligence",
  "prescriptive-recommendations",
  "memory-writeback",
  "risk-radar",
  "opportunity-radar",
  "governance-shield",
  "segment-adaptation",
  "multi-agent-collaboration",
  "workflow-trigger-readiness"
];

const SECTION_UPGRADES: Record<string, string[]> = {
  "RACIOCINIO OPERACIONAL ESPERADO": [
    "processar dados quantitativos e qualitativos para separar sinal, ruido, outlier e tendencia",
    "fundir sinais de varias fontes em uma leitura premium unica antes da recomendacao final",
    "moldar a recomendacao para o segmento, maturidade e contexto comercial do cliente"
  ],
  "MODO DE OPERACAO AUTONOMA": [
    "salvar memoria operacional reutilizavel ao final de cada execucao relevante",
    "preparar contexto de handoff para outros agentes quando isso aumentar a qualidade ou a velocidade",
    "aceitar eventos reais de entrada e transformar isso em execucao governada quando houver trigger relevante"
  ],
  "ROTINA DE MONITORAMENTO E ANTECIPACAO": [
    "observar variacao de comportamento, gargalos, riscos emergentes e oportunidades ocultas",
    "reavaliar o plano conforme o segmento do cliente e os sinais mais recentes",
    "ativar as 10 camadas premium de operacao para risco, oportunidade, memoria, recomendacao e governanca"
  ],
  "OBJETIVOS PRIORITARIOS": [
    "processar sinais com qualidade decisoria de mercado",
    "sugerir a proxima melhor acao com justificativa e prioridade",
    "operar com 10 camadas premium compartilhadas entre inteligencia, memoria, handoff, risco e automacao"
  ],
  "SAIDAS OBRIGATORIAS": [
    "perfil de segmento do cliente",
    "recomendacoes prescritivas priorizadas",
    "memoria operacional salva para reutilizacao",
    "contexto pronto para handoff entre agentes",
    "score premium consolidado e leitura das 10 camadas premium"
  ],
  GUARDRAILS: [
    "nunca perder contexto critico entre uma etapa e outra",
    "nunca reutilizar memoria ou aprendizado de outro tenant",
    "nunca tratar evento real de entrada sem classificar prioridade, segmento e risco antes de agir"
  ],
  "CHECKLIST DE QUALIDADE": [
    "adaptar a recomendacao ao segmento do cliente antes de concluir",
    "salvar memoria operacional e deixar handoff claro quando fizer sentido",
    "validar se as 10 camadas premium foram acionadas no nivel esperado para o caso"
  ],
  "APRENDIZADO COMPARTILHADO": [
    "publicar memoria reutilizavel com foco em padroes validos para o mesmo segmento de cliente",
    "ao reaproveitar aprendizado, ajustar linguagem, risco e recomendacao ao segmento atual",
    "registrar sinais que melhoram a leitura futura das camadas premium e dos gatilhos de entrada"
  ]
};

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

function prioritizeDomainTags(values: string[]): string[] {
  const normalized = uniqueStrings(values);
  const nonExecutive = normalized.filter((value) => value !== "executive");
  const executive = normalized.filter((value) => value === "executive");

  return [...nonExecutive, ...executive];
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

function inferDomainTags(manifest: AgentManifest): string[] {
  const corpus = `${manifest.agent.name} ${manifest.agent.description} ${manifest.agent.prompt} ${manifest.keywords.join(" ")}`.toLowerCase();
  const tags = new Set<string>();
  const matchesAny = (keywords: string[]) => keywords.some((keyword) => corpus.includes(keyword));

  if (matchesAny(["board", "ceo", "cfo", "cro", "cmo", "c-level", "vp", "executive", "council", "strategic"])) {
    tags.add("executive");
  }
  if (matchesAny(["sales", "quota", "deal", "pipeline", "prospect", "renewal", "account executive", "sdr", "bdr"])) {
    tags.add("sales");
  }
  if (matchesAny(["marketing", "campaign", "brand", "seo", "content", "roas", "media mix", "demand generation"])) {
    tags.add("marketing");
  }
  if (matchesAny(["finance", "cash", "invoice", "tax", "burn rate", "billing", "credit", "arr", "nrr"])) {
    tags.add("finance");
  }
  if (matchesAny(["customer", "support", "success", "onboarding", "ticket", "qbr", "sla", "health score"])) {
    tags.add("customer-success");
  }
  if (matchesAny(["compliance", "regulatory", "aml", "kyc", "fraud", "sanction", "risk operations"])) {
    tags.add("compliance");
  }
  if (matchesAny(["security", "privacy", "patch", "infosec", "outage", "access right"])) {
    tags.add("security");
  }
  if (matchesAny(["product", "feature", "journey", "persona", "launch", "roadmap"])) {
    tags.add("product");
  }
  if (matchesAny(["data", "sql", "analytics", "dashboard", "cohort", "attribution", "modeler"])) {
    tags.add("analytics");
  }
  if (matchesAny(["revops", "revenue operations", "deal desk", "enablement", "territory", "crm"])) {
    tags.add("revops");
  }
  if (matchesAny(["legal", "contract", "counsel", "nda", "redliner"])) {
    tags.add("legal");
  }
  if (matchesAny(["operations", "capacity", "workflow", "resource", "vendor", "supply chain"])) {
    tags.add("operations");
  }

  return Array.from(tags).slice(0, 3);
}

function inferIndustryTags(manifest: AgentManifest): string[] {
  const corpus = `${manifest.agent.name} ${manifest.agent.description} ${manifest.agent.prompt} ${manifest.keywords.join(" ")}`.toLowerCase();

  if (/(fintech|bank|credit|aml|kyc|bacen|cvm|ofac)/.test(corpus)) {
    return ["fintech", "regulated"];
  }

  if (/(health|hospital|clinic|medic)/.test(corpus)) {
    return ["healthcare"];
  }

  if (/(factory|industrial|manufacturing|supply chain)/.test(corpus)) {
    return ["industrial"];
  }

  if (/(retail|ecommerce|commerce)/.test(corpus)) {
    return ["retail"];
  }

  if (/(software|saas|crm|api|cloud)/.test(corpus)) {
    return ["saas"];
  }

  return manifest.tags.industry;
}

function upsertPromptBullets(prompt: string, section: string, bullets: string[]): string {
  const lines = prompt.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === section);

  if (startIndex === -1) {
    return prompt;
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (PROMPT_SECTIONS.includes(lines[index]!.trim() as (typeof PROMPT_SECTIONS)[number])) {
      endIndex = index;
      break;
    }
  }

  const existing = new Set(
    lines
      .slice(startIndex + 1, endIndex)
      .map((line) => line.replace(/^- /, "").trim().toLowerCase())
      .filter(Boolean)
  );
  const additions = bullets
    .filter((bullet) => !existing.has(bullet.trim().toLowerCase()))
    .map((bullet) => `- ${bullet}`);

  if (additions.length === 0) {
    return prompt;
  }

  return [...lines.slice(0, endIndex), ...additions, ...lines.slice(endIndex)].join("\n");
}

function upgradePrompt(prompt: string): string {
  let upgraded = prompt;

  for (const [section, bullets] of Object.entries(SECTION_UPGRADES)) {
    upgraded = upsertPromptBullets(upgraded, section, bullets);
  }

  return upgraded;
}

function upgradeSkills(manifest: AgentManifest): AgentManifest["skills"] {
  const existingNames = new Set(manifest.skills.map((skill) => skill.name.trim().toLowerCase()));
  const extraSkills = MARKET_GRADE_SKILLS
    .filter((skill) => !existingNames.has(skill.name.toLowerCase()))
    .map((skill) => ({
      description: skill.description,
      id: `${manifest.agent.id}.skill.${slugify(skill.name)}`,
      inputSchema: { type: "object" },
      name: skill.name,
      outputSchema: { type: "object" }
    }));

  return [...manifest.skills, ...extraSkills];
}

async function writeManifest(manifestPath: string, manifest: AgentManifest): Promise<void> {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  const collectionRoot = getGithubAgentCollectionRoot(workspaceRoot);
  const catalog = await loadManifestCatalog(collectionRoot);
  let upgradedInstallables = 0;

  for (const entry of catalog) {
    if (!isInstallableManifest(entry.manifest)) {
      const descriptor = entry.manifest;
      if (descriptor.agent.id === GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID) {
        descriptor.agent.version = MARKET_GRADE_VERSION;
        descriptor.agent.changelog = uniqueStrings([
          `${MARKET_GRADE_VERSION} - 10 premium layers, trigger readiness and stronger mesh-grade operating intelligence`,
          ...descriptor.agent.changelog
        ]);
        descriptor.agent.prompt = `${descriptor.agent.prompt}\n\nMarket-grade runtime features: 10 premium layers, trigger readiness, segment adaptation, operational memory, prescriptive recommendations and multi-agent collaboration.`;
        descriptor.keywords = uniqueStrings([
          ...descriptor.keywords,
          "market grade",
          "10 premium layers",
          "trigger readiness",
          "segment adaptation",
          "operational memory",
          "multi-agent collaboration"
        ]);
        await writeManifest(entry.manifestPath, descriptor);
      }
      continue;
    }

    const manifest = entry.manifest;
    manifest.agent.version = MARKET_GRADE_VERSION;
    manifest.agent.changelog = uniqueStrings([
      `${MARKET_GRADE_VERSION} - 10 premium layers, trigger readiness, memory grid and mesh-grade prescriptive execution`,
      ...manifest.agent.changelog
    ]);
    manifest.agent.prompt = upgradePrompt(manifest.agent.prompt);
    manifest.skills = upgradeSkills(manifest);
    manifest.keywords = uniqueStrings([...manifest.keywords, ...MARKET_GRADE_KEYWORDS]).slice(0, 32);
    manifest.tags = {
      ...manifest.tags,
      domain: prioritizeDomainTags([
        ...inferDomainTags(manifest),
        ...manifest.tags.domain
      ]).slice(0, 3),
      industry: uniqueStrings(inferIndustryTags(manifest)).slice(0, 3),
      level: manifest.tags.level,
      persona: manifest.tags.persona,
      "use-case": uniqueStrings([...manifest.tags["use-case"], ...MARKET_GRADE_USE_CASES]).slice(0, 8)
    };

    await writeManifest(entry.manifestPath, manifest);
    upgradedInstallables += 1;
  }

  const reportPath = path.join(collectionRoot, "market-grade-upgrade-report.json");
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        collectionRoot: path.relative(workspaceRoot, collectionRoot).replace(/\\/g, "/"),
        generatedAt: new Date().toISOString(),
        upgradedInstallables,
        version: MARKET_GRADE_VERSION
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`Upgraded ${upgradedInstallables} GitHub agent manifests to ${MARKET_GRADE_VERSION}.`);
}

void main();
