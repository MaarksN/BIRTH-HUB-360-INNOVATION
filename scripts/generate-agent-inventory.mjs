import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COLLECTIONS = ["corporate-v1", "executive-premium-v1", "github-agents-v1"];
const DOMAINS = ["vendas", "CS", "financeiro", "compliance", "marketing", "ops", "executivo"];
const OUTPUT_DIR = path.join("docs", "agents");

const FUNCTIONAL_OWNERS = {
  vendas: "CRO / VP Sales",
  CS: "VP Customer Success",
  financeiro: "CFO / Finance Ops",
  compliance: "General Counsel / Compliance Officer",
  marketing: "CMO / Growth",
  ops: "COO / RevOps",
  executivo: "CEO / Chief of Staff"
};

const OWNER_OVERRIDES = {
  "ceo-pack": "CEO",
  "cfo-pack": "CFO",
  "cro-pack": "CRO",
  "cmo-pack": "CMO",
  "coo-pack": "COO",
  "cto-pack": "CTO",
  "rh-pack": "Head of People",
  "legal-pack": "General Counsel",
  "policy-and-approval-guard-pack": "Compliance Officer",
  "agent-mesh-orchestrator-pack": "COO / Platform Ops",
  "maestro-orchestrator-pack": "COO / Platform Ops",
  "context-memory-pack": "COO / Platform Ops",
  "knowledge-pack": "COO / Platform Ops",
  "planner-github-pack": "COO / Platform Ops",
  "implementer-github-pack": "COO / Platform Ops",
  "reviewer-github-pack": "COO / Platform Ops"
};

const DOMAIN_OVERRIDES = {
  "account-manager-pack": "vendas",
  "admin-ops-pack": "ops",
  "agent-mesh-orchestrator-pack": "ops",
  "call-review-pack": "vendas",
  "ceo-pack": "executivo",
  "cfo-pack": "financeiro",
  "closer-copilot-pack": "vendas",
  "closing-forecast-pack": "vendas",
  "cmo-pack": "marketing",
  "communication-pack": "ops",
  "context-memory-pack": "ops",
  "coo-pack": "ops",
  "crm-sync-pack": "ops",
  "cro-pack": "vendas",
  "cs-pack": "CS",
  "cto-pack": "ops",
  "customer-health-pack": "CS",
  "deal-risk-pack": "vendas",
  "enablement-coach-pack": "vendas",
  "finance-pack": "financeiro",
  "follow-up-pack": "vendas",
  "forecast-intelligence-pack": "vendas",
  "knowledge-pack": "ops",
  "kpi-analyst-pack": "ops",
  "lead-enrichment-pack": "vendas",
  "lead-hunter-pack": "vendas",
  "legal-pack": "compliance",
  "maestro-orchestrator-pack": "ops",
  "meeting-booker-pack": "vendas",
  "objection-handling-pack": "vendas",
  "onboarding-sales-pack": "vendas",
  "ops-pack": "ops",
  "pipeline-auditor-pack": "vendas",
  "policy-and-approval-guard-pack": "compliance",
  "productivity-pack": "ops",
  "proposal-pack": "vendas",
  "qualification-pack": "vendas",
  "revops-intelligence-pack": "ops",
  "rh-pack": "ops",
  "roleplay-trainer-pack": "vendas",
  "sales-manager-pack": "vendas",
  "sales-pack": "vendas",
  "sdr-outreach-pack": "vendas",
  "boardprep-ai-premium-pack": "executivo",
  "brand-guardian-premium-pack": "marketing",
  "budget-fluid-premium-pack": "financeiro",
  "capital-allocator-premium-pack": "executivo",
  "churn-deflector-premium-pack": "CS",
  "competitor-xray-premium-pack": "marketing",
  "crisis-navigator-premium-pack": "executivo",
  "culture-pulse-premium-pack": "ops",
  "expansion-mapper-premium-pack": "CS",
  "market-sentinel-premium-pack": "executivo",
  "narrative-weaver-premium-pack": "executivo",
  "pipeline-oracle-premium-pack": "vendas",
  "pricing-optimizer-premium-pack": "vendas",
  "quota-architect-premium-pack": "vendas",
  "trend-catcher-premium-pack": "executivo",
  "advocacy-finder-github-pack": "CS",
  "agency-auditor-github-pack": "marketing",
  "audit-bot-github-pack": "compliance",
  "bottleneck-detector-github-pack": "ops",
  "brand-guardian-github-pack": "marketing",
  "budget-fluid-github-pack": "financeiro",
  "burn-rate-monitor-github-pack": "financeiro",
  "cap-table-manager-github-pack": "financeiro",
  "capacity-planner-github-pack": "ops",
  "cash-flow-clairvoyant-github-pack": "financeiro",
  "channel-mixer-github-pack": "marketing",
  "churn-deflector-github-pack": "CS",
  "competitor-x-ray-github-pack": "marketing",
  "compliance-enforcer-github-pack": "compliance",
  "culture-pulse-github-pack": "ops",
  "deal-desk-autopilot-github-pack": "vendas",
  "escalation-predictor-github-pack": "CS",
  "expansion-mapper-github-pack": "CS",
  "forecast-rollup-github-pack": "vendas",
  "fx-risk-manager-github-pack": "financeiro",
  "global-brand-localizer-github-pack": "marketing",
  "health-score-architect-github-pack": "CS",
  "journey-architect-github-pack": "CS",
  "marketing-tech-architect-github-pack": "marketing",
  "pipeline-oracle-github-pack": "vendas",
  "playbook-generator-github-pack": "vendas",
  "pricing-optimizer-github-pack": "vendas",
  "quota-architect-github-pack": "vendas",
  "renewal-forecast-engine-github-pack": "CS",
  "resource-balancer-github-pack": "ops",
  "sentiment-aggregator-github-pack": "CS",
  "spend-controller-github-pack": "financeiro",
  "supply-chain-sync-github-pack": "ops",
  "tax-optimizer-github-pack": "financeiro",
  "territory-mapper-github-pack": "vendas",
  "tiering-optimizer-github-pack": "vendas",
  "vendor-negotiator-github-pack": "financeiro",
  "vip-concierge-github-pack": "CS",
  "planner-github-pack": "ops",
  "implementer-github-pack": "ops",
  "reviewer-github-pack": "ops"
};

const SECTION_HEADINGS = [
  "IDENTIDADE E MISSAO",
  "QUANDO ACIONAR",
  "QUANDO USAR",
  "QUANDO NAO ACIONAR",
  "ENTRADAS OBRIGATORIAS",
  "RACIOCINIO OPERACIONAL ESPERADO",
  "MODO DE OPERACAO AUTONOMA",
  "ROTINA DE MONITORAMENTO E ANTECIPACAO",
  "CRITERIOS DE PRIORIZACAO",
  "CRITERIOS DE ESCALACAO",
  "OBJETIVOS PRIORITARIOS",
  "OBJETIVO",
  "FERRAMENTAS ESPERADAS",
  "FERRAMENTAS REAIS",
  "SAIDAS OBRIGATORIAS",
  "SAIDA ESPERADA",
  "GUARDRAILS",
  "GUARDRAILS ESPECIFICOS",
  "CHECKLIST DE QUALIDADE",
  "CRITERIOS DE QUALIDADE",
  "CRITERIOS DE QUALIDADE ESPECIFICOS",
  "APRENDIZADO COMPARTILHADO",
  "PROTOCOLO PREMIUM GLOBAL 100",
  "PROTOCOLO PREMIUM COMUM",
  "PILARES PREMIUM",
  "COMUNICACAO PREMIUM",
  "DECISAO PREMIUM",
  "FORMATO DE SAIDA"
];

const SCORE_TERMS = {
  compliance: {
    weight: 5,
    terms: [
      "compliance",
      "audit",
      "auditor",
      "policy",
      "approval",
      "legal",
      "clause",
      "contract",
      "nda",
      "risk",
      "regulatory",
      "sanction",
      "sar",
      "pep",
      "ubo",
      "kyc",
      "aml",
      "identity",
      "verification",
      "liveness",
      "fingerprint",
      "surveillance",
      "fraud",
      "crypto",
      "money-mule",
      "security-questionnaire",
      "high-risk",
      "jurisdiction",
      "transaction-hold",
      "velocity-rule",
      "licence",
      "license"
    ]
  },
  financeiro: {
    weight: 5,
    terms: [
      "finance",
      "financial",
      "cfo",
      "cash",
      "cash-flow",
      "budget",
      "burn",
      "bank",
      "invoice",
      "payment",
      "chargeback",
      "refund",
      "dunning",
      "collection",
      "aging",
      "accrual",
      "gl",
      "month-end",
      "tax",
      "margin",
      "fx",
      "liquidity",
      "credit",
      "debt",
      "reconciliation",
      "remittance",
      "proration",
      "capital",
      "cost",
      "spend",
      "close",
      "roi",
      "roas",
      "cac",
      "ltv"
    ]
  },
  CS: {
    weight: 4,
    terms: [
      "customer-success",
      "customer",
      "cs",
      "churn",
      "retention",
      "renewal",
      "adoption",
      "health-score",
      "health",
      "support",
      "ticket",
      "sla",
      "qbr",
      "onboarding",
      "outage",
      "kb",
      "faq",
      "escalation",
      "incident",
      "nps",
      "csat",
      "sentiment",
      "stickiness",
      "journey",
      "training-video",
      "vip",
      "welcome",
      "refund",
      "win-back",
      "upsell",
      "cross-sell",
      "white-space"
    ]
  },
  vendas: {
    weight: 4,
    terms: [
      "sales",
      "revenue",
      "cro",
      "lead",
      "deal",
      "pipeline",
      "forecast",
      "quota",
      "territory",
      "account",
      "prospect",
      "outreach",
      "sdr",
      "bdr",
      "close",
      "closer",
      "call",
      "demo",
      "poc",
      "objection",
      "proposal",
      "quote",
      "pricing",
      "discount",
      "win-loss",
      "icp",
      "battlecard",
      "qualification",
      "meeting",
      "booking",
      "rfp",
      "renewal-contract",
      "conversion",
      "enablement",
      "rep-coach"
    ]
  },
  marketing: {
    weight: 4,
    terms: [
      "marketing",
      "growth",
      "cmo",
      "brand",
      "ad",
      "campaign",
      "content",
      "seo",
      "serp",
      "utm",
      "audience",
      "keyword",
      "landing-page",
      "media-mix",
      "copy",
      "newsletter",
      "webinar",
      "viral",
      "subject-line",
      "ab-test",
      "positioning",
      "attribution",
      "influencer",
      "backlink",
      "creative",
      "topic-cluster",
      "persona",
      "nurturer"
    ]
  },
  ops: {
    weight: 3,
    terms: [
      "ops",
      "operations",
      "process",
      "workflow",
      "api",
      "webhook",
      "integration",
      "data",
      "analytics",
      "dashboard",
      "sql",
      "migration",
      "architecture",
      "capacity",
      "resource",
      "project",
      "deadline",
      "shift",
      "automation",
      "orchestrator",
      "knowledge",
      "productivity",
      "memory",
      "cleaner",
      "duplicate",
      "sync",
      "scheduler",
      "routing",
      "planner",
      "implementer",
      "reviewer",
      "product",
      "feature",
      "release",
      "requirements",
      "user-story"
    ]
  },
  executivo: {
    weight: 4,
    terms: [
      "executive",
      "ceo",
      "board",
      "chief-of-staff",
      "strategy",
      "strategic",
      "kpi",
      "market-sentinel",
      "trend",
      "scenario",
      "crisis",
      "narrative",
      "capital-allocator",
      "boardprep",
      "board-prep",
      "one-on-one",
      "stakeholder-update",
      "market-share",
      "annual-report",
      "macro-factor"
    ]
  }
};

const SOURCE_DOMAIN_SCORES = {
  "marketing growth": { marketing: 8 },
  "vendas e fechamento": { vendas: 8 },
  "vendas e prospeccao": { vendas: 8 },
  "customer success e suporte": { CS: 8 },
  "executivos e estrategia": { executivo: 7 },
  "dados e bi": { ops: 7, executivo: 1 },
  "revops e inteligencia": { ops: 6, vendas: 4 },
  "fintech/risco/compliance": { compliance: 7, financeiro: 4 },
  "financeiro/juridico/administrativo": { financeiro: 6, compliance: 4, ops: 2 },
  geral: { ops: 6 }
};

const SOURCE_TAG_DOMAIN_SCORES = {
  sales: { vendas: 2 },
  revenue: { vendas: 2 },
  prospecting: { vendas: 2 },
  enablement: { vendas: 2 },
  growth: { marketing: 2 },
  marketing: { marketing: 2 },
  "customer-success": { CS: 2 },
  finance: { financeiro: 2 },
  legal: { compliance: 2 },
  compliance: { compliance: 2 },
  security: { compliance: 2 },
  governance: { compliance: 1, ops: 1 },
  operations: { ops: 2 },
  management: { executivo: 1, ops: 1 },
  technology: { ops: 2 },
  people: { ops: 2 },
  communications: { ops: 1, marketing: 1 },
  product: { ops: 2 },
  strategy: { executivo: 2 },
  analytics: { ops: 2 },
  executive: { executivo: 1 }
};

const CORE_GITHUB_IDS = new Set([
  "planner-github-pack",
  "implementer-github-pack",
  "reviewer-github-pack"
]);

const EXPERIMENTAL_TERMS = [
  "alt-data",
  "bypass",
  "clairvoyant",
  "ghost",
  "hacker",
  "morpher",
  "niche",
  "scout",
  "scraper",
  "sniper",
  "synthetic",
  "viral",
  "volatility",
  "x-ray"
];

const SPECIALIST_TERMS = [
  "ab-test",
  "activation",
  "adoption",
  "aging",
  "api",
  "arr",
  "audit",
  "bank",
  "brand",
  "budget",
  "campaign",
  "cash",
  "churn",
  "collection",
  "compliance",
  "contract",
  "conversion",
  "credit",
  "crm",
  "csat",
  "dashboard",
  "data",
  "deal",
  "discount",
  "dunning",
  "forecast",
  "health",
  "invoice",
  "lead",
  "margin",
  "onboarding",
  "payment",
  "pipeline",
  "playbook",
  "pricing",
  "process",
  "qbr",
  "quota",
  "reconciliation",
  "regulatory",
  "renewal",
  "retention",
  "revenue",
  "risk",
  "roi",
  "sales",
  "sanctions",
  "seo",
  "sla",
  "support",
  "tax",
  "ticket",
  "territory",
  "workflow"
];

const OVERLAP_RULES = [
  {
    id: "pipeline-forecast-deal-risk",
    label: "Pipeline, forecast e risco de deal",
    domain: "vendas",
    terms: ["pipeline", "forecast", "deal", "quota", "territory", "win-loss", "closing", "revenue", "arr", "acv"]
  },
  {
    id: "pricing-discount-quote",
    label: "Pricing, desconto e cotacao",
    domain: "vendas",
    terms: ["pricing", "price", "discount", "quote", "quoter", "waterfall", "tiering", "elasticity"]
  },
  {
    id: "lead-prospecting-outreach",
    label: "Lead, prospeccao e outbound",
    domain: "vendas",
    terms: ["lead", "prospect", "outreach", "sdr", "inbound", "icp", "meeting", "calendar", "event-qualifier"]
  },
  {
    id: "cs-health-retention",
    label: "Saude de cliente, churn, renovacao e expansao",
    domain: "CS",
    terms: ["churn", "retention", "renewal", "health", "adoption", "csat", "nps", "qbr", "upsell", "cross-sell", "stickiness", "white-space"]
  },
  {
    id: "support-ticket-sla",
    label: "Suporte, tickets, SLA e incidentes",
    domain: "CS",
    terms: ["ticket", "sla", "support", "incident", "outage", "faq", "kb", "l1", "l3", "escalation", "backlog"]
  },
  {
    id: "cash-billing-collections",
    label: "Caixa, billing, cobranca e reconciliacao",
    domain: "financeiro",
    terms: ["cash", "bank", "invoice", "payment", "chargeback", "refund", "dunning", "collection", "aging", "reconciliation", "remittance", "proration"]
  },
  {
    id: "fpna-budget-cost",
    label: "FP&A, budget, margem e custos",
    domain: "financeiro",
    terms: ["budget", "burn", "margin", "cost", "spend", "forecasting", "scenario", "financial", "finance", "capital", "liquidity", "fx"]
  },
  {
    id: "compliance-risk-audit",
    label: "Compliance, auditoria, policy e risco",
    domain: "compliance",
    terms: ["compliance", "audit", "policy", "regulatory", "risk", "approval", "surveillance", "security", "legal", "contract", "clause"]
  },
  {
    id: "kyc-aml-fraud",
    label: "KYC, AML, fraude e verificacao de identidade",
    domain: "compliance",
    terms: ["sanctions", "pep", "ubo", "sar", "identity", "verification", "liveness", "fingerprint", "money-mule", "crypto", "transaction", "fraud"]
  },
  {
    id: "marketing-campaign-content-seo",
    label: "Campanhas, conteudo, SEO e growth marketing",
    domain: "marketing",
    terms: ["campaign", "content", "seo", "serp", "utm", "keyword", "ad-", "adcopy", "creative", "webinar", "newsletter", "subject-line", "audience", "media-mix"]
  },
  {
    id: "brand-market-competitive",
    label: "Marca, mercado e inteligencia competitiva",
    domain: "marketing",
    terms: ["brand", "competitor", "market", "positioning", "battlecard", "trend", "share", "narrative"]
  },
  {
    id: "data-analytics-dashboard",
    label: "Dados, BI, dashboards e higiene de dados",
    domain: "ops",
    terms: ["data", "analytics", "dashboard", "sql", "cohort", "anomaly", "cleaner", "hygiene", "duplicate", "migration", "enrichment"]
  },
  {
    id: "process-workflow-automation",
    label: "Processos, workflows, integracoes e automacao",
    domain: "ops",
    terms: ["process", "workflow", "api", "webhook", "integration", "routing", "scheduler", "capacity", "resource", "project", "deadline", "shift", "orchestrator"]
  },
  {
    id: "enablement-coaching-playbooks",
    label: "Enablement, coaching e playbooks",
    domain: "vendas",
    terms: ["coach", "playbook", "training", "roleplay", "call-review", "transcript", "voice-pitch", "flashcard", "micro-learning", "rep-coach"]
  },
  {
    id: "executive-board-strategy",
    label: "Board, estrategia executiva e decisoes C-level",
    domain: "executivo",
    terms: ["board", "executive", "exec", "ceo", "strategic", "kpi", "stakeholder", "crisis", "scenario", "capital-allocator", "one-on-one", "annual-report"]
  },
  {
    id: "product-launch-feedback",
    label: "Produto, launch, feedback e requisitos",
    domain: "ops",
    terms: ["product", "feature", "launch", "release", "requirements", "user-story", "journey", "feedback"]
  }
];

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compact(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesTerm(text, rawTerm) {
  const term = normalize(rawTerm);

  if (term.length <= 3 || ["exec"].includes(term)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`, "u").test(text);
  }

  return text.includes(term);
}

function conceptKey(agentId) {
  return compact(
    agentId
      .replace(/-github-pack$/u, "")
      .replace(/-premium-pack$/u, "")
      .replace(/-pack$/u, "")
      .replace(/-agent$/u, "")
  );
}

function splitCamel(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

function humanizeAgentName(name, agentId) {
  const base = name
    .replace(/\bPremium Agent\b/gu, "")
    .replace(/\bAgent Pack\b/gu, "")
    .replace(/\bAgent\b/gu, "")
    .trim();
  const fallback = agentId
    .replace(/-github-pack$/u, "")
    .replace(/-premium-pack$/u, "")
    .replace(/-pack$/u, "")
    .replace(/-/g, " ");
  return splitCamel(base || fallback).replace(/\s+/g, " ").trim();
}

function cleanDescription(description) {
  return String(description ?? "")
    .replace(/\s+Opera com padrao premium[\s\S]*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPromptDomain(prompt) {
  const match = String(prompt ?? "").match(/Dom[íi]nio:\s*([^\n]+)/iu);
  return match?.[1]?.replace(/^-+\s*/u, "").trim() ?? "";
}

function extractSection(prompt, heading) {
  const lines = String(prompt ?? "").split(/\r?\n/u);
  const start = lines.findIndex((line) => line.trim() === heading);

  if (start === -1) {
    return "";
  }

  const collected = [];

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (SECTION_HEADINGS.includes(line)) {
      break;
    }

    collected.push(lines[index]);
  }

  return collected.join("\n").trim();
}

function extractBullets(section) {
  return section
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-+\s*/u, "").trim())
    .filter(Boolean);
}

function primaryUseCase(manifest) {
  const description = cleanDescription(manifest.agent.description);
  const concept = humanizeAgentName(manifest.agent.name, manifest.agent.id);

  if (/^use when structuring/i.test(description)) {
    return `Estruturar analise, decisao e plano de execucao para ${concept}.`;
  }

  if (description) {
    return description;
  }

  const objectives = extractBullets(extractSection(manifest.agent.prompt, "OBJETIVOS PRIORITARIOS"));

  if (objectives.length > 0) {
    return objectives[0];
  }

  return `Operar o caso de uso principal de ${concept}.`;
}

function addScore(scores, domain, value) {
  if (!DOMAINS.includes(domain)) {
    return;
  }

  scores[domain] = (scores[domain] ?? 0) + value;
}

function addScoreMap(scores, scoreMap) {
  for (const [domain, value] of Object.entries(scoreMap ?? {})) {
    addScore(scores, domain, value);
  }
}

function inferDomain(manifest, collection) {
  const agentId = manifest.agent.id;

  if (DOMAIN_OVERRIDES[agentId]) {
    return {
      domain: DOMAIN_OVERRIDES[agentId],
      basis: "manual-override"
    };
  }

  const promptDomain = extractPromptDomain(manifest.agent.prompt);
  const sourceDomainKey = normalize(promptDomain);
  const scores = Object.fromEntries(DOMAINS.map((domain) => [domain, 0]));

  addScoreMap(scores, SOURCE_DOMAIN_SCORES[sourceDomainKey]);

  const tagsDomain = manifest.tags?.domain ?? [];

  if (collection !== "github-agents-v1" || !promptDomain) {
    for (const tag of tagsDomain) {
      addScoreMap(scores, SOURCE_TAG_DOMAIN_SCORES[normalize(tag)]);
    }
  }

  const searchText = normalize(
    [
      agentId,
      manifest.agent.name,
      manifest.agent.description,
      promptDomain,
      ...(manifest.tags?.persona ?? [])
    ].join(" ")
  );

  for (const [domain, rule] of Object.entries(SCORE_TERMS)) {
    for (const term of rule.terms) {
      if (matchesTerm(searchText, term)) {
        addScore(scores, domain, rule.weight);
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [domain, score] = sorted[0];

  if (score > 0) {
    return {
      domain,
      basis: promptDomain ? "prompt-domain+rules" : "tags+rules"
    };
  }

  return {
    domain: "ops",
    basis: "fallback"
  };
}

function hasAnyTerm(agent, terms) {
  const text = normalize(`${agent.agent_id} ${agent.agent_name} ${agent.primary_use_case}`);
  return terms.some((term) => matchesTerm(text, term));
}

function inferPriority(agent, exactDuplicateGroup) {
  if (agent.collection === "corporate-v1" || CORE_GITHUB_IDS.has(agent.agent_id)) {
    return {
      priority_tier: "core",
      priority_rank: "P0"
    };
  }

  if (agent.collection === "executive-premium-v1" || exactDuplicateGroup) {
    return {
      priority_tier: "especialista",
      priority_rank: "P1"
    };
  }

  if (hasAnyTerm(agent, EXPERIMENTAL_TERMS)) {
    return {
      priority_tier: "experimental",
      priority_rank: "P3"
    };
  }

  if (hasAnyTerm(agent, SPECIALIST_TERMS)) {
    return {
      priority_tier: "especialista",
      priority_rank: "P1"
    };
  }

  return {
    priority_tier: "long_tail",
    priority_rank: "P2"
  };
}

function readinessState(readiness) {
  if (!readiness) {
    return "not-provided";
  }

  return readiness.readiness?.overall === true ? "ready" : "not-ready";
}

async function exists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function findManifestFiles(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const manifestFiles = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      manifestFiles.push(...(await findManifestFiles(entryPath)));
    } else if (entry.isFile() && entry.name === "manifest.json") {
      manifestFiles.push(entryPath);
    }
  }

  return manifestFiles;
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");

  if (/[",\n\r]/u.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(rows, columns) {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))
  ].join("\n");
}

function groupBy(rows, keyFn) {
  const groups = new Map();

  for (const row of rows) {
    const key = keyFn(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return groups;
}

function countBy(rows, keyFn) {
  return [...groupBy(rows, keyFn).entries()]
    .map(([key, group]) => ({ key, count: group.length }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function assignOverlapGroups(rows) {
  const byRule = new Map();

  for (const rule of OVERLAP_RULES) {
    const matched = rows.filter((row) => hasAnyTerm(row, rule.terms));

    if (matched.length >= 2) {
      byRule.set(rule.id, {
        group_id: `overlap-${rule.id}`,
        type: "thematic-overlap",
        label: rule.label,
        dominant_domain: rule.domain,
        agents: matched
      });
    }
  }

  for (const row of rows) {
    row.overlap_group_ids = [...byRule.values()]
      .filter((group) => group.agents.some((agent) => agent.agent_id === row.agent_id))
      .map((group) => group.group_id)
      .join("; ");
  }

  return [...byRule.values()];
}

function buildInventoryMarkdown(rows) {
  const lines = ["# Inventario dos agentes por colecao", ""];

  for (const collection of COLLECTIONS) {
    const collectionRows = rows.filter((row) => row.collection === collection);
    lines.push(`## ${collection} (${collectionRows.length})`, "");
    lines.push(
      markdownTable(
        ["agent_id", "dominio", "dono_funcional", "caso_de_uso_principal", "prioridade"],
        collectionRows.map((row) => [
          row.agent_id,
          row.domain,
          row.functional_owner,
          row.primary_use_case,
          `${row.priority_tier} (${row.priority_rank})`
        ])
      )
    );
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildTierMarkdown(rows) {
  const tiers = [
    ["core", "Core"],
    ["especialista", "Especialistas"],
    ["long_tail", "Long tail"],
    ["experimental", "Experimentais"]
  ];
  const lines = ["# Lista por nivel de prioridade", ""];

  for (const [tier, title] of tiers) {
    const tierRows = rows.filter((row) => row.priority_tier === tier);
    lines.push(`## ${title} (${tierRows.length})`, "");

    for (const row of tierRows) {
      lines.push(
        `- ${row.agent_id} (${row.collection}) - ${row.domain} - ${row.functional_owner} - ${row.primary_use_case}`
      );
    }

    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildSummaryMarkdown(rows, duplicateGroups, overlapGroups, generatedAt) {
  const byCollection = COLLECTIONS.map((collection) => [
    collection,
    rows.filter((row) => row.collection === collection).length,
    rows.filter((row) => row.collection === collection && row.has_readiness === "yes").length,
    rows.filter((row) => row.collection === collection && row.has_evidence === "yes").length
  ]);
  const byDomain = DOMAINS.map((domain) => [domain, rows.filter((row) => row.domain === domain).length]);
  const byPriority = countBy(rows, (row) => row.priority_tier).map(({ key, count }) => [key, count]);
  const completeness = rows.filter(
    (row) => row.functional_owner && row.domain && row.primary_use_case && row.priority_tier
  ).length;
  const collectionDomainRows = [];

  for (const collection of COLLECTIONS) {
    collectionDomainRows.push([
      collection,
      ...DOMAINS.map((domain) => rows.filter((row) => row.collection === collection && row.domain === domain).length)
    ]);
  }

  const lines = [
    "# Estado dos 392 agentes",
    "",
    `Gerado em: ${generatedAt}`,
    "",
    "Fonte canonica analisada: `packages/agent-packs`.",
    "Catalog descriptors foram excluidos da contagem: `corporate-v1-catalog`, `executive-premium-v1-catalog`, `github-agents-v1-catalog`.",
    "",
    "## Resultado executivo",
    "",
    `- Total de agentes instalaveis: ${rows.length}`,
    `- Com dono funcional, dominio, caso de uso principal e prioridade: ${completeness}/${rows.length}`,
    `- Duplicacoes exatas entre colecoes: ${duplicateGroups.length} grupos`,
    `- Sobreposicoes tematicas mapeadas: ${overlapGroups.length} grupos`,
    `- Readiness/evidence: ${rows.filter((row) => row.has_readiness === "yes").length}/${rows.length} readiness.json, ${rows.filter((row) => row.has_evidence === "yes").length}/${rows.length} evidence.json`,
    "",
    "## Criterio de classificacao",
    "",
    "- Dominio: inferido pelo dominio declarado no prompt quando existe; depois por overrides dos packs oficiais/premium e por termos do nome, tags, descricao e caso de uso.",
    "- Dono funcional: papel responsavel pelo dominio, com overrides para C-level e operacao de plataforma.",
    "- Prioridade: `core` para a linha oficial corporate e agentes de mesh essenciais; `especialista` para premium executivos, duplicatas de conceitos premium e casos recorrentes; `long_tail` para extensoes compiladas mais estreitas; `experimental` para conceitos especulativos, scouts, scrapers ou nomes de alto risco operacional.",
    "",
    "## Inventario por colecao",
    "",
    markdownTable(["Colecao", "Agentes", "Com readiness", "Com evidence"], byCollection),
    "",
    "## Dominio",
    "",
    markdownTable(["Dominio", "Agentes"], byDomain),
    "",
    "## Dominio por colecao",
    "",
    markdownTable(["Colecao", ...DOMAINS], collectionDomainRows),
    "",
    "## Nivel de prioridade",
    "",
    markdownTable(["Nivel", "Agentes"], byPriority),
    "",
    "## Duplicacoes exatas",
    ""
  ];

  if (duplicateGroups.length === 0) {
    lines.push("Nenhuma duplicacao exata detectada.");
  } else {
    lines.push(
      markdownTable(
        ["Grupo", "Conceito", "Agentes"],
        duplicateGroups.map((group) => [
          group.group_id,
          group.label,
          group.agents.map((agent) => `${agent.collection}:${agent.agent_id}`).join("<br>")
        ])
      )
    );
  }

  lines.push("", "## Sobreposicoes tematicas", "");
  lines.push(
    markdownTable(
      ["Grupo", "Dominio", "Agentes", "Colecoes"],
      overlapGroups.map((group) => [
        group.label,
        group.dominant_domain,
        group.agents.length,
        [...new Set(group.agents.map((agent) => agent.collection))].join(", ")
      ])
    )
  );
  lines.push("", "## Artefatos", "");
  lines.push("- `docs/agents/agent-inventory.csv`: linha a linha dos 392 agentes.");
  lines.push("- `docs/agents/agent-inventory.json`: inventario estruturado para automacao.");
  lines.push("- `docs/agents/agent-inventory-by-collection.md`: inventario humano por colecao.");
  lines.push("- `docs/agents/agent-tier-lists.md`: listas core, especialistas, long tail e experimentais.");
  lines.push("- `docs/agents/agent-overlap-map.csv`: duplicacoes e sobreposicoes.");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = path.resolve(scriptsDir, "..");
  const catalogRoot = path.join(workspaceRoot, "packages", "agent-packs");
  const outputDir = path.join(workspaceRoot, OUTPUT_DIR);
  const manifestFiles = await findManifestFiles(catalogRoot);
  const rawRows = [];

  for (const manifestPath of manifestFiles) {
    const relativePath = path.relative(workspaceRoot, manifestPath);
    const parts = relativePath.split(path.sep);
    const collection = parts[2];

    if (!COLLECTIONS.includes(collection)) {
      continue;
    }

    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

    if (manifest.agent?.kind !== "agent") {
      continue;
    }

    const packDir = path.dirname(manifestPath);
    const readinessPath = path.join(packDir, "readiness.json");
    const evidencePath = path.join(packDir, "evidence.json");
    const readiness = await readJsonIfExists(readinessPath);
    const evidence = await readJsonIfExists(evidencePath);
    const domainResult = inferDomain(manifest, collection);
    const relativeManifestPath = path.relative(workspaceRoot, manifestPath).replace(/\\/g, "/");
    const sourceDomain = extractPromptDomain(manifest.agent.prompt);
    const row = {
      collection,
      pack_dir: path.basename(packDir),
      agent_id: manifest.agent.id,
      agent_name: manifest.agent.name,
      version: manifest.agent.version,
      domain: domainResult.domain,
      domain_basis: domainResult.basis,
      source_domain: sourceDomain,
      functional_owner: OWNER_OVERRIDES[manifest.agent.id] ?? FUNCTIONAL_OWNERS[domainResult.domain],
      primary_use_case: primaryUseCase(manifest),
      priority_tier: "",
      priority_rank: "",
      readiness_status: readinessState(readiness),
      has_readiness: (await exists(readinessPath)) ? "yes" : "no",
      has_evidence: (await exists(evidencePath)) ? "yes" : "no",
      source_path: evidence?.sourcePath ?? readiness?.evidence?.sourcePath ?? "",
      source_checksum: evidence?.sourceChecksum ?? readiness?.evidence?.sourceChecksum ?? "",
      skills_count: manifest.skills?.length ?? 0,
      tools_count: manifest.tools?.length ?? 0,
      policies_count: manifest.policies?.length ?? 0,
      source_tags_domain: (manifest.tags?.domain ?? []).join("; "),
      source_tags_level: (manifest.tags?.level ?? []).join("; "),
      source_tags_use_case: (manifest.tags?.["use-case"] ?? []).join("; "),
      manifest_path: relativeManifestPath,
      canonical_concept_key: conceptKey(manifest.agent.id),
      exact_duplicate_group_id: "",
      overlap_group_ids: ""
    };

    rawRows.push(row);
  }

  rawRows.sort((a, b) => {
    const collectionDelta = COLLECTIONS.indexOf(a.collection) - COLLECTIONS.indexOf(b.collection);
    return collectionDelta || a.agent_id.localeCompare(b.agent_id);
  });

  const conceptGroups = [...groupBy(rawRows, (row) => row.canonical_concept_key).entries()]
    .filter(([, group]) => group.length > 1 && new Set(group.map((row) => row.collection)).size > 1)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const duplicateGroups = conceptGroups.map(([concept, agents], index) => ({
    group_id: `dup-${String(index + 1).padStart(3, "0")}`,
    type: "exact-duplicate",
    label: concept,
    dominant_domain: agents[0].domain,
    agents
  }));

  for (const group of duplicateGroups) {
    for (const agent of group.agents) {
      agent.exact_duplicate_group_id = group.group_id;
    }
  }

  for (const row of rawRows) {
    const priority = inferPriority(row, row.exact_duplicate_group_id);
    row.priority_tier = priority.priority_tier;
    row.priority_rank = priority.priority_rank;
  }

  const overlapGroups = assignOverlapGroups(rawRows);
  const overlapRows = [
    ...duplicateGroups,
    ...overlapGroups
  ].map((group) => ({
    group_id: group.group_id,
    type: group.type,
    label: group.label,
    dominant_domain: group.dominant_domain,
    agent_count: group.agents.length,
    collections: [...new Set(group.agents.map((agent) => agent.collection))].join("; "),
    agents: group.agents.map((agent) => `${agent.collection}:${agent.agent_id}`).join("; ")
  }));

  const requiredFields = ["functional_owner", "domain", "primary_use_case", "priority_tier"];
  const incompleteRows = rawRows.filter((row) => requiredFields.some((field) => !row[field]));

  if (rawRows.length !== 392) {
    throw new Error(`Expected 392 agents, found ${rawRows.length}.`);
  }

  if (incompleteRows.length > 0) {
    throw new Error(`Inventory has ${incompleteRows.length} incomplete rows.`);
  }

  await mkdir(outputDir, { recursive: true });

  const columns = [
    "collection",
    "pack_dir",
    "agent_id",
    "agent_name",
    "version",
    "domain",
    "domain_basis",
    "source_domain",
    "functional_owner",
    "primary_use_case",
    "priority_tier",
    "priority_rank",
    "readiness_status",
    "has_readiness",
    "has_evidence",
    "source_path",
    "source_checksum",
    "skills_count",
    "tools_count",
    "policies_count",
    "source_tags_domain",
    "source_tags_level",
    "source_tags_use_case",
    "manifest_path",
    "canonical_concept_key",
    "exact_duplicate_group_id",
    "overlap_group_ids"
  ];
  const generatedAt = new Date().toISOString();
  const summary = buildSummaryMarkdown(rawRows, duplicateGroups, overlapGroups, generatedAt);

  await writeFile(path.join(outputDir, "agent-inventory.csv"), `${toCsv(rawRows, columns)}\n`, "utf8");
  await writeFile(
    path.join(outputDir, "agent-inventory.json"),
    `${JSON.stringify({ generatedAt, source: "packages/agent-packs", agents: rawRows }, null, 2)}\n`,
    "utf8"
  );
  await writeFile(path.join(outputDir, "agent-overlap-map.csv"), `${toCsv(overlapRows, [
    "group_id",
    "type",
    "label",
    "dominant_domain",
    "agent_count",
    "collections",
    "agents"
  ])}\n`, "utf8");
  await writeFile(path.join(outputDir, "agent-portfolio-summary.md"), summary, "utf8");
  await writeFile(path.join(outputDir, "agent-inventory-by-collection.md"), buildInventoryMarkdown(rawRows), "utf8");
  await writeFile(path.join(outputDir, "agent-tier-lists.md"), buildTierMarkdown(rawRows), "utf8");

  console.log(`Generated inventory for ${rawRows.length} agents in ${OUTPUT_DIR}.`);
}

void main();
