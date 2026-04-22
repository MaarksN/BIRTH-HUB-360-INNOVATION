export const CHATBOOK_TOOLS = [
  "busca_interna",
  "busca_web",
  "simulacao",
  "acao_plataforma",
  "resumo",
  "comparacao",
  "suporte"
] as const;

export type ChatbookTool = (typeof CHATBOOK_TOOLS)[number];

export type ChatbookIntent =
  | "busca_interna"
  | "busca_web"
  | "simulacao"
  | "acao_plataforma"
  | "resumo"
  | "comparacao"
  | "suporte";

export interface ChatbookLivePlatformResult {
  href: string;
  id: string;
  module: string;
  subtitle: string;
  title: string;
  type: string;
}

export interface ChatbookAttachmentContext {
  contentType?: string;
  name: string;
  size?: number;
  text: string;
}

export interface ChatbookSourceItem {
  confidence: number;
  href: string | null;
  id: string;
  kind: string;
  module: string;
  origin: "plataforma" | "web";
  sourceLabel: string;
  summary: string;
  title: string;
}

export interface ChatbookActionSuggestion {
  description: string;
  href: string | null;
  id: string;
  kind: "abrir_tela" | "gerar_rascunho" | "filtrar_dados" | "executar_fluxo";
  label: string;
}

export interface ChatbookExecutionPlan {
  approvalRequired: boolean;
  auditLabel: string;
  checklist: string[];
  prefilledFields: Array<{
    label: string;
    source: "hipotese" | "plataforma" | "simulacao" | "usuario" | "web";
    value: string;
  }>;
  status: "rascunho";
  targetModule: string;
}

export interface ChatbookScenario {
  annualDelta: number;
  annualValue: number;
  label: string;
  monthlyValue: number;
  tone: "baseline" | "recommended" | "positive" | "cautious";
}

export interface ChatbookSimulation {
  assumptions: string[];
  conclusion: string;
  dataPoints: Array<{
    label: string;
    origin: "hipotese" | "plataforma";
    value: string;
  }>;
  gains: string[];
  risks: string[];
  scenarios: ChatbookScenario[];
}

export interface ChatbookRouterDecision {
  confidenceLabel: "alto" | "medio" | "baixo";
  formatIdealDeResposta: string;
  ferramentasNecessarias: ChatbookTool[];
  intencaoPrincipal: ChatbookIntent;
  nivelDeConfianca: number;
}

export interface ChatbookReply {
  actions: ChatbookActionSuggestion[];
  decisionTrail: string[];
  demoMode: boolean;
  executionPlan: ChatbookExecutionPlan;
  quickFollowUps: string[];
  requestId: string;
  router: ChatbookRouterDecision;
  sections: {
    plataforma: string[];
    proximaAcaoRecomendada: string;
    resumo: string;
    simulacao: string[];
    web: string[];
  };
  simulation: ChatbookSimulation | null;
  sources: {
    plataforma: ChatbookSourceItem[];
    web: ChatbookSourceItem[];
  };
  warnings: string[];
}

export interface ChatbookQueryInput {
  attachmentContexts?: ChatbookAttachmentContext[];
  attachmentNames?: string[];
  livePlatformResults?: ChatbookLivePlatformResult[];
  message: string;
  preferredTools?: ChatbookTool[];
  requestId: string;
  simulationInput?: Partial<SimulationProfile>;
  voiceEnabled?: boolean;
}

interface SimulationProfile {
  activeUsers: number;
  annualVolume: number;
  currentMonthlyCost: number;
  currentPlan: string;
  name: string;
  onboardingBacklog: number;
  recommendedPlan: string;
}

interface PlatformCatalogEntry {
  href: string | null;
  id: string;
  kind: string;
  keywords: string[];
  module: string;
  simulationProfile?: SimulationProfile;
  sourceLabel: string;
  summary: string;
  title: string;
}

interface WebCatalogEntry {
  href: string;
  id: string;
  kind: string;
  keywords: string[];
  module: string;
  sourceLabel: string;
  summary: string;
  title: string;
}

const PLATFORM_CATALOG: PlatformCatalogEntry[] = [
  {
    href: "/packs",
    id: "planos-governanca-2026",
    kind: "documento",
    keywords: [
      "plano",
      "planos",
      "comparar",
      "comparacao",
      "economia",
      "orcamento",
      "proposta",
      "cliente",
      "melhor"
    ],
    module: "Packs",
    sourceLabel: "Base de conhecimento interna",
    summary:
      "Tabela de elegibilidade, faixas de usuarios, gatilhos de upgrade e margem esperada por plano.",
    title: "Politica comercial de planos e upgrades"
  },
  {
    href: "/reports",
    id: "relatorio-eficiencia-operacional",
    kind: "relatorio",
    keywords: [
      "roi",
      "retorno",
      "operacional",
      "eficiencia",
      "custo",
      "economia",
      "anual",
      "cenario"
    ],
    module: "Reports",
    sourceLabel: "Relatorios do workspace",
    summary:
      "Mostra custo por operacao, horas poupadas por automacao, payback e variacao mensal de margem.",
    title: "Dashboard de eficiencia operacional"
  },
  {
    href: "/sales-os",
    id: "sales-os-playbook",
    kind: "playbook",
    keywords: [
      "cliente",
      "proposta",
      "roteiro",
      "comparar",
      "plano",
      "economia",
      "script",
      "vendas"
    ],
    module: "Sales OS",
    sourceLabel: "Playbook comercial",
    summary:
      "Playbook para diagnostico comercial, comparacao de planos e construcao de proposta consultiva.",
    title: "Playbook de recomendacao consultiva"
  },
  {
    href: "/outputs",
    id: "rascunhos-executivos",
    kind: "output",
    keywords: [
      "gerar",
      "rascunho",
      "proposta",
      "resumo",
      "executivo",
      "documento",
      "comparacao"
    ],
    module: "Outputs",
    sourceLabel: "Central de outputs",
    summary:
      "Templates de proposta, memorando executivo e comparativo de cenarios para compartilhar com o cliente.",
    title: "Modelos de proposta e resumo executivo"
  },
  {
    href: "/conversations",
    id: "tickets-suporte-implantacao",
    kind: "ticket",
    keywords: [
      "ticket",
      "suporte",
      "implantacao",
      "onboarding",
      "pendencia",
      "cliente",
      "historico"
    ],
    module: "Conversations",
    sourceLabel: "Historico de tickets",
    summary:
      "Thread com pendencias de implantacao, gargalos recorrentes e pedidos de treinamento do cliente.",
    title: "Tickets e mensagens do cliente"
  },
  {
    href: "/patients",
    id: "cliente-acme-materna",
    kind: "cadastro",
    keywords: [
      "acme",
      "materna",
      "cliente",
      "economia",
      "plano",
      "usuarios",
      "roi",
      "melhor",
      "cenario"
    ],
    module: "CRM",
    simulationProfile: {
      activeUsers: 42,
      annualVolume: 920,
      currentMonthlyCost: 18400,
      currentPlan: "Growth Lite",
      name: "Acme Materna",
      onboardingBacklog: 17,
      recommendedPlan: "Growth Assistido"
    },
    sourceLabel: "Cadastro do cliente",
    summary:
      "Conta com 42 usuarios ativos, plano Growth Lite, backlog de onboarding alto e forte uso de automacoes.",
    title: "Cliente Acme Materna"
  },
  {
    href: "/patients",
    id: "cliente-aurora-clinica",
    kind: "cadastro",
    keywords: [
      "aurora",
      "clinica",
      "cliente",
      "financeiro",
      "orcamento",
      "plano",
      "cenario"
    ],
    module: "CRM",
    simulationProfile: {
      activeUsers: 18,
      annualVolume: 470,
      currentMonthlyCost: 9600,
      currentPlan: "Starter Pro",
      name: "Clinica Aurora",
      onboardingBacklog: 6,
      recommendedPlan: "Starter Plus"
    },
    sourceLabel: "Cadastro do cliente",
    summary:
      "Conta media com operacao enxuta, sensivel a preco e bom potencial para padronizacao de processos.",
    title: "Cliente Clinica Aurora"
  }
];

const WEB_REFERENCE_CATALOG: WebCatalogEntry[] = [
  {
    href: "https://www.sebrae.com.br",
    id: "web-sebrae-gestao",
    kind: "referencia",
    keywords: ["mercado", "gestao", "eficiencia", "orcamento", "roi", "cenario"],
    module: "SEBRAE",
    sourceLabel: "SEBRAE",
    summary:
      "Conteudo util para benchmark de produtividade, formacao de preco e boas praticas operacionais.",
    title: "Guias de gestao e produtividade"
  },
  {
    href: "https://www.gov.br/ans",
    id: "web-ans-regulatorio",
    kind: "regulatorio",
    keywords: ["ans", "legislacao", "regulatorio", "saude", "plano", "norma", "validacao"],
    module: "ANS",
    sourceLabel: "Portal oficial ANS",
    summary:
      "Base oficial para validar pontos regulatorios, comunicados e referencias publicas do setor.",
    title: "Referencias oficiais do setor de saude"
  },
  {
    href: "https://www.ibge.gov.br",
    id: "web-ibge-contexto",
    kind: "dados",
    keywords: ["mercado", "demografia", "cidade", "setor", "demanda", "benchmark"],
    module: "IBGE",
    sourceLabel: "IBGE",
    summary:
      "Indicadores publicos para cruzar potencial regional, perfil de demanda e contexto economico.",
    title: "Indicadores publicos para analise de contexto"
  },
  {
    href: "https://www.mckinsey.com",
    id: "web-mckinsey-automation",
    kind: "benchmark",
    keywords: ["automacao", "produtividade", "benchmark", "operacional", "eficiencia", "tendencia"],
    module: "McKinsey",
    sourceLabel: "McKinsey Insights",
    summary:
      "Estudos de referencia sobre automacao, produtividade e impacto operacional em servicos.",
    title: "Benchmarks de automacao e produtividade"
  },
  {
    href: "https://www.microsoft.com",
    id: "web-microsoft-voice",
    kind: "tecnologia",
    keywords: ["voz", "speech", "stt", "tts", "transcricao", "assistente"],
    module: "Speech stack",
    sourceLabel: "Documentacao de voz",
    summary:
      "Referencias para speech-to-text, text-to-speech e experiencias com fallback para digitacao.",
    title: "Boas praticas para interfaces por voz"
  }
];

const QUICK_FOLLOW_UPS = [
  "Compare os planos deste cliente com foco em economia anual.",
  "Resuma em linguagem simples o que mudou e qual a proxima acao.",
  "Monte um cenario conservador e um otimista antes de gerar a proposta.",
  "Abra a tela mais relevante e diga que dado ainda falta para decidir."
] as const;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      normalizeText(value)
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
    )
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function scoreKeywords(tokens: string[], haystack: string[]): number {
  if (tokens.length === 0) {
    return 0;
  }

  const matches = tokens.reduce((count, token) => {
    return haystack.some((entry) => entry.includes(token)) ? count + 1 : count;
  }, 0);

  return matches / tokens.length;
}

function isSimulationTool(tool: ChatbookTool): boolean {
  return tool === "simulacao" || tool === "comparacao";
}

function detectIntent(message: string, preferredTools: ChatbookTool[]): {
  confidence: number;
  intent: ChatbookIntent;
  tools: ChatbookTool[];
} {
  const normalized = normalizeText(message);
  const scores: Record<ChatbookIntent, number> = {
    acao_plataforma: 0,
    busca_interna: 0,
    busca_web: 0,
    comparacao: 0,
    resumo: 0,
    simulacao: 0,
    suporte: 0
  };

  if (preferredTools.length > 0) {
    preferredTools.forEach((tool) => {
      scores[tool] += tool === "busca_interna" ? 1.2 : 1;
    });
  }

  if (/\b(cliente|cadastro|ticket|mensagem|documento|dashboard|faq|plataforma|registro)\b/.test(normalized)) {
    scores.busca_interna += 1.4;
  }

  if (/\b(web|mercado|legislacao|legislacao|benchmark|referencia|atual|atualizar|concorrencia|noticia)\b/.test(normalized)) {
    scores.busca_web += 1.3;
  }

  if (/\b(simul|cenario|orcamento|preco|roi|retorno|economia|anual|quanto|projecao)\b/.test(normalized)) {
    scores.simulacao += 1.5;
  }

  if (/\b(compare|comparar|versus|melhor plano|melhor opcao|diferenca)\b/.test(normalized)) {
    scores.comparacao += 2;
    scores.simulacao += 0.45;
  }

  if (/\b(abra|abrir|filtre|filtrar|gere|gerar|crie|criar|monte|preencha|executar|execute|dispare)\b/.test(normalized)) {
    scores.acao_plataforma += 1.5;
  }

  if (/\b(resuma|resumo|explique|linguagem simples|objetivo|executivo)\b/.test(normalized)) {
    scores.resumo += 1.2;
  }

  if (/\b(como|passo a passo|ajuda|suporte|orientacao)\b/.test(normalized)) {
    scores.suporte += 1.1;
  }

  const tools = new Set<ChatbookTool>(preferredTools);

  if (scores.busca_interna > 0 || preferredTools.length === 0) {
    tools.add("busca_interna");
  }

  if (scores.busca_web > 0) {
    tools.add("busca_web");
  }

  if (scores.simulacao > 0 || scores.comparacao > 0) {
    tools.add("simulacao");
  }

  if (scores.comparacao > 0) {
    tools.add("comparacao");
  }

  if (scores.acao_plataforma > 0) {
    tools.add("acao_plataforma");
  }

  if (scores.resumo > 0 || tools.size === 0) {
    tools.add("resumo");
  }

  if (scores.suporte > 0 && tools.size < 3) {
    tools.add("suporte");
  }

  const intentEntries = Object.entries(scores).sort((left, right) => right[1] - left[1]) as Array<
    [ChatbookIntent, number]
  >;
  const [intent, rawConfidence] = intentEntries[0] ?? ["busca_interna", 0.5];
  const confidence = clamp(0.42 + rawConfidence / 3.4, 0.48, 0.96);

  return {
    confidence,
    intent,
    tools: Array.from(tools)
  };
}

function mapPlatformResult(
  item: PlatformCatalogEntry,
  confidence: number
): ChatbookSourceItem {
  return {
    confidence,
    href: item.href,
    id: item.id,
    kind: item.kind,
    module: item.module,
    origin: "plataforma",
    sourceLabel: item.sourceLabel,
    summary: item.summary,
    title: item.title
  };
}

function mapWebResult(item: WebCatalogEntry, confidence: number): ChatbookSourceItem {
  return {
    confidence,
    href: item.href,
    id: item.id,
    kind: item.kind,
    module: item.module,
    origin: "web",
    sourceLabel: item.sourceLabel,
    summary: item.summary,
    title: item.title
  };
}

function searchPlatformCatalog(
  message: string,
  livePlatformResults: ChatbookLivePlatformResult[]
): {
  demoMatches: PlatformCatalogEntry[];
  sourceItems: ChatbookSourceItem[];
} {
  const tokens = tokenize(message);
  const liveMatches = livePlatformResults
    .map((item) => {
      const haystack = tokenize(`${item.title} ${item.subtitle} ${item.module} ${item.type}`);
      const confidence = 0.58 + scoreKeywords(tokens, haystack) * 0.32;

      return {
        confidence,
        item
      };
    })
    .filter((entry) => entry.confidence >= 0.62)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 4)
    .map((entry) => ({
      confidence: entry.confidence,
      href: entry.item.href,
      id: entry.item.id,
      kind: entry.item.type,
      module: entry.item.module,
      origin: "plataforma" as const,
      sourceLabel: "Busca viva da plataforma",
      summary: entry.item.subtitle,
      title: entry.item.title
    }));

  const demoMatches = PLATFORM_CATALOG
    .map((entry) => {
      const haystack = tokenize(`${entry.title} ${entry.summary} ${entry.module} ${entry.keywords.join(" ")}`);
      const confidence = 0.5 + scoreKeywords(tokens, haystack) * 0.44;

      return {
        confidence,
        entry
      };
    })
    .filter((entry) => entry.confidence >= 0.64)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, liveMatches.length > 0 ? 2 : 4)
    .map((entry) => entry.entry);

  const sourceItems = [
    ...liveMatches,
    ...demoMatches
      .filter((entry) => !liveMatches.some((live) => live.title === entry.title))
      .map((entry) => mapPlatformResult(entry, 0.64))
  ].slice(0, 4);

  return {
    demoMatches,
    sourceItems
  };
}

function normalizeAttachmentContexts(contexts: ChatbookAttachmentContext[]): ChatbookAttachmentContext[] {
  return contexts
    .map((context) => ({
      ...context,
      name: context.name.trim(),
      text: context.text.replace(/\s+/g, " ").trim().slice(0, 1_200)
    }))
    .filter((context) => context.name.length > 0 && context.text.length > 0)
    .slice(0, 4);
}

function mapAttachmentSources(contexts: ChatbookAttachmentContext[]): ChatbookSourceItem[] {
  return contexts.map((context, index) => ({
    confidence: 0.72,
    href: null,
    id: `attachment-${index}-${context.name}`,
    kind: context.contentType?.startsWith("text/") ? "documento_textual" : "anexo_textual",
    module: "Anexos",
    origin: "plataforma",
    sourceLabel: "Anexo enviado",
    summary: context.text,
    title: context.name
  }));
}

function searchWebCatalog(message: string): ChatbookSourceItem[] {
  const tokens = tokenize(message);
  const ranked = WEB_REFERENCE_CATALOG
    .map((entry) => {
      const haystack = tokenize(`${entry.title} ${entry.summary} ${entry.module} ${entry.keywords.join(" ")}`);
      const confidence = 0.46 + scoreKeywords(tokens, haystack) * 0.42;

      return {
        confidence,
        entry
      };
    })
    .filter((entry) => entry.confidence >= 0.62)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 3)
    .map((entry) => mapWebResult(entry.entry, entry.confidence));

  if (ranked.length > 0) {
    return ranked;
  }

  return WEB_REFERENCE_CATALOG.slice(0, 2).map((entry) => mapWebResult(entry, 0.62));
}

function parseCurrencyHint(message: string): number | null {
  const normalized = normalizeText(message);
  const match = normalized.match(/r\$\s?([\d.]+)(?:,\d{2})?/i);

  if (!match?.[1]) {
    return null;
  }

  const numeric = Number(match[1].replace(/\./g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseUserHint(message: string): number | null {
  const normalized = normalizeText(message);
  const match = normalized.match(/(\d{1,4})\s*(usuarios|colaboradores|licencas|assentos)/i);

  if (!match?.[1]) {
    return null;
  }

  const numeric = Number(match[1]);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildSimulation(
  message: string,
  platformMatches: PlatformCatalogEntry[],
  simulationInput?: Partial<SimulationProfile>
): ChatbookSimulation {
  const matchedProfile =
    platformMatches.find((entry) => entry.simulationProfile)?.simulationProfile ??
    PLATFORM_CATALOG.find((entry) => entry.id === "cliente-acme-materna")?.simulationProfile;

  const hintedMonthlyCost = parseCurrencyHint(message);
  const hintedUsers = parseUserHint(message);
  const baseMonthlyCost =
    hintedMonthlyCost ??
    simulationInput?.currentMonthlyCost ??
    matchedProfile?.currentMonthlyCost ??
    14800;
  const activeUsers = hintedUsers ?? simulationInput?.activeUsers ?? matchedProfile?.activeUsers ?? 24;
  const annualVolume = simulationInput?.annualVolume ?? matchedProfile?.annualVolume ?? 600;
  const onboardingBacklog =
    simulationInput?.onboardingBacklog ?? matchedProfile?.onboardingBacklog ?? 9;
  const currentPlan =
    simulationInput?.currentPlan ?? matchedProfile?.currentPlan ?? "Plano atual nao identificado";
  const recommendedPlan =
    simulationInput?.recommendedPlan ??
    matchedProfile?.recommendedPlan ??
    "Plano com automacao assistida";
  const baselineAnnual = baseMonthlyCost * 12;
  const recommendedMonthly = Math.round(baseMonthlyCost * 0.82);
  const optimisticMonthly = Math.round(recommendedMonthly * 0.94);
  const conservativeMonthly = Math.round(recommendedMonthly * 1.08);
  const recommendedAnnual = recommendedMonthly * 12;
  const optimisticAnnual = optimisticMonthly * 12;
  const conservativeAnnual = conservativeMonthly * 12;
  const annualSavings = baselineAnnual - recommendedAnnual;
  const annualRoi = Math.round(annualSavings * 1.35);

  return {
    assumptions: [
      matchedProfile
        ? `Usei o cadastro demonstrativo de ${matchedProfile.name} como base operacional.`
        : "Usei parametros padrao do workspace demonstrativo.",
      simulationInput && Object.keys(simulationInput).length > 0
        ? "Apliquei os parametros editaveis enviados pelo simulador do workspace."
        : "Nenhum parametro editavel adicional foi enviado pelo simulador.",
      hintedMonthlyCost
        ? `Considerei o custo mensal informado pelo usuario (${formatCurrency(hintedMonthlyCost)}).`
        : "Sem custo mensal explicito, mantive a referencia media do workspace.",
      "A simulacao combina reducao de friccao operacional, upgrade de plano e consolidacao de processos."
    ],
    conclusion: `O melhor equilibrio entre economia e capacidade operacional fica no cenario recomendado, com economia anual estimada de ${formatCurrency(annualSavings)} e ROI potencial de ${formatCurrency(annualRoi)}.`,
    dataPoints: [
      {
        label: "Plano atual",
        origin: simulationInput?.currentPlan || matchedProfile ? "plataforma" : "hipotese",
        value: currentPlan
      },
      {
        label: "Plano recomendado",
        origin: simulationInput?.recommendedPlan || matchedProfile ? "plataforma" : "hipotese",
        value: recommendedPlan
      },
      {
        label: "Usuarios ativos",
        origin: hintedUsers || matchedProfile ? "plataforma" : "hipotese",
        value: `${activeUsers}`
      },
      {
        label: "Volume anual",
        origin: simulationInput?.annualVolume || matchedProfile ? "plataforma" : "hipotese",
        value: `${annualVolume} operacoes`
      }
    ],
    gains: [
      `${formatCurrency(annualSavings)} de economia anual no cenario recomendado.`,
      `Reducao estimada de ${Math.max(4, Math.round(activeUsers / 5))} horas semanais de operacao manual.`,
      `Melhor condicao para gerar proposta consultiva com base em um upgrade mais aderente.`
    ],
    risks: [
      `O cenario conservador ainda depende de reduzir o backlog atual (${onboardingBacklog} itens).`,
      "Se o uso real estiver abaixo da media, o ROI pode amadurecer mais lentamente no primeiro trimestre.",
      "A simulacao nao substitui validacao comercial com regras de desconto aprovadas."
    ],
    scenarios: [
      {
        annualDelta: 0,
        annualValue: baselineAnnual,
        label: "Cenario atual",
        monthlyValue: baseMonthlyCost,
        tone: "baseline"
      },
      {
        annualDelta: annualSavings,
        annualValue: recommendedAnnual,
        label: "Cenario recomendado",
        monthlyValue: recommendedMonthly,
        tone: "recommended"
      },
      {
        annualDelta: baselineAnnual - optimisticAnnual,
        annualValue: optimisticAnnual,
        label: "Cenario otimista",
        monthlyValue: optimisticMonthly,
        tone: "positive"
      },
      {
        annualDelta: baselineAnnual - conservativeAnnual,
        annualValue: conservativeAnnual,
        label: "Cenario conservador",
        monthlyValue: conservativeMonthly,
        tone: "cautious"
      }
    ]
  };
}

export function buildChatbookExportMarkdown(reply: ChatbookReply): string {
  const simulationLines = reply.simulation
    ? reply.simulation.scenarios.map(
        (scenario) =>
          `- ${scenario.label}: ${formatCurrency(scenario.annualValue)} ao ano; delta ${formatCurrency(scenario.annualDelta)}.`
      )
    : ["- Sem simulacao nesta resposta."];
  const platformLines = reply.sources.plataforma.map(
    (source) => `- ${source.title} (${source.module}): ${source.summary}`
  );
  const webLines = reply.sources.web.map(
    (source) => `- ${source.title} (${source.sourceLabel}): ${source.summary}`
  );
  const actionLines = reply.actions.map((action) => `- ${action.label}: ${action.description}`);
  const prefilledLines = reply.executionPlan.prefilledFields.map(
    (field) => `- ${field.label}: ${field.value} (${field.source})`
  );

  return [
    "# ChatBook Inteligentissimo",
    "",
    `Request: ${reply.requestId}`,
    `Intencao: ${reply.router.intencaoPrincipal}`,
    `Confianca: ${Math.round(reply.router.nivelDeConfianca * 100)}%`,
    "",
    "## Resumo",
    reply.sections.resumo,
    "",
    "## Plataforma",
    ...(platformLines.length > 0 ? platformLines : ["- Nenhuma fonte interna relevante retornada."]),
    "",
    "## Web",
    ...(webLines.length > 0 ? webLines : ["- Sem complemento web nesta resposta."]),
    "",
    "## Simulacao",
    ...simulationLines,
    "",
    "## Proximas acoes",
    ...(actionLines.length > 0 ? actionLines : ["- Sem acao sugerida."]),
    "",
    "## Execucao assistida",
    `Status: ${reply.executionPlan.status}`,
    `Modulo alvo: ${reply.executionPlan.targetModule}`,
    `Aprovacao obrigatoria: ${reply.executionPlan.approvalRequired ? "sim" : "nao"}`,
    `Auditoria: ${reply.executionPlan.auditLabel}`,
    "",
    "Campos pre-preenchidos:",
    ...(prefilledLines.length > 0 ? prefilledLines : ["- Nenhum campo pre-preenchido."]),
    "",
    "Checklist:",
    ...reply.executionPlan.checklist.map((step) => `- ${step}`),
    "",
    "## Trilha de decisao",
    ...reply.decisionTrail.map((step) => `- ${step}`)
  ].join("\n");
}

export function buildChatbookConversationDraft(reply: ChatbookReply): {
  initialMessage: string;
  subject: string;
} {
  const actionLines = reply.actions.map((action) => `- ${action.label}: ${action.description}`);
  const executionLines = reply.executionPlan.checklist.map((step) => `- ${step}`);
  const simulationSummary = reply.simulation
    ? reply.simulation.conclusion
    : "Sem simulacao nesta rodada.";

  return {
    initialMessage: [
      "Resumo gerado pelo ChatBook Inteligentissimo.",
      "",
      `Request: ${reply.requestId}`,
      `Intencao: ${reply.router.intencaoPrincipal}`,
      `Confianca: ${Math.round(reply.router.nivelDeConfianca * 100)}%`,
      "",
      "Resumo executivo:",
      reply.sections.resumo,
      "",
      "Simulacao:",
      simulationSummary,
      "",
      "Proximas acoes sugeridas:",
      ...(actionLines.length > 0 ? actionLines : ["- Revisar contexto e definir responsavel."]),
      "",
      "Execucao assistida:",
      `Status: ${reply.executionPlan.status}`,
      `Modulo alvo: ${reply.executionPlan.targetModule}`,
      `Aprovacao obrigatoria: ${reply.executionPlan.approvalRequired ? "sim" : "nao"}`,
      "",
      "Checklist de execucao:",
      ...executionLines,
      "",
      "Trilha de decisao:",
      ...reply.decisionTrail.map((step) => `- ${step}`)
    ].join("\n"),
    subject: `ChatBook: ${reply.router.intencaoPrincipal} - ${reply.requestId}`
  };
}

function buildActions(input: {
  platformSources: ChatbookSourceItem[];
  router: ChatbookRouterDecision;
  simulation: ChatbookSimulation | null;
}): ChatbookActionSuggestion[] {
  const actions: ChatbookActionSuggestion[] = [];

  if (input.simulation) {
    actions.push({
      description: "Abrir a central de packs para validar upgrade, desconto e enquadramento do cenario recomendado.",
      href: "/packs",
      id: "chatbook-open-packs",
      kind: "abrir_tela",
      label: "Abrir packs e validar plano"
    });
    actions.push({
      description: "Gerar um rascunho executivo com o comparativo atual vs recomendado.",
      href: "/outputs",
      id: "chatbook-draft-proposal",
      kind: "gerar_rascunho",
      label: "Gerar rascunho de proposta"
    });
  }

  if (
    input.router.ferramentasNecessarias.includes("acao_plataforma") ||
    input.platformSources.some((item) => item.module === "Conversations")
  ) {
    actions.push({
      description: "Levar o usuario direto para o historico operacional e continuar a execucao assistida.",
      href: "/conversations",
      id: "chatbook-open-conversations",
      kind: "abrir_tela",
      label: "Abrir historico operacional"
    });
  }

  if (input.platformSources.some((item) => item.module === "Reports")) {
    actions.push({
      description: "Filtrar os dashboards pelo cliente atual para revisar margem, ROI e produtividade.",
      href: "/reports",
      id: "chatbook-filter-reports",
      kind: "filtrar_dados",
      label: "Filtrar dashboards do cliente"
    });
  }

  if (actions.length < 4) {
    actions.push({
      description: "Disparar um fluxo guiado para consolidar dados, comparar cenarios e registrar a decisao.",
      href: "/workflows",
      id: "chatbook-run-workflow",
      kind: "executar_fluxo",
      label: "Executar fluxo assistido"
    });
  }

  return actions.slice(0, 4);
}

function inferExecutionTarget(actions: ChatbookActionSuggestion[]): string {
  const firstAction = actions[0];

  if (!firstAction?.href) {
    return "Workflows";
  }

  if (firstAction.href.startsWith("/packs")) {
    return "Packs";
  }

  if (firstAction.href.startsWith("/reports")) {
    return "Reports";
  }

  if (firstAction.href.startsWith("/conversations")) {
    return "Conversations";
  }

  if (firstAction.href.startsWith("/outputs")) {
    return "Outputs";
  }

  return "Workflows";
}

function buildExecutionPlan(input: {
  actions: ChatbookActionSuggestion[];
  platformSources: ChatbookSourceItem[];
  router: ChatbookRouterDecision;
  simulation: ChatbookSimulation | null;
  webSources: ChatbookSourceItem[];
}): ChatbookExecutionPlan {
  const recommendedScenario = input.simulation?.scenarios.find(
    (scenario) => scenario.tone === "recommended"
  );
  const prefilledFields: ChatbookExecutionPlan["prefilledFields"] = [
    {
      label: "Intencao classificada",
      source: "usuario",
      value: input.router.intencaoPrincipal
    }
  ];

  if (input.platformSources[0]) {
    prefilledFields.push({
      label: "Fonte interna principal",
      source: "plataforma",
      value: input.platformSources[0].title
    });
  }

  if (input.webSources[0]) {
    prefilledFields.push({
      label: "Referencia externa principal",
      source: "web",
      value: input.webSources[0].title
    });
  }

  if (recommendedScenario) {
    prefilledFields.push({
      label: "Economia anual estimada",
      source: "simulacao",
      value: formatCurrency(recommendedScenario.annualDelta)
    });
  }

  return {
    approvalRequired:
      input.actions.some((action) => action.kind === "executar_fluxo" || action.kind === "gerar_rascunho") ||
      input.simulation !== null ||
      input.router.nivelDeConfianca < 0.8,
    auditLabel: `chatbook-${input.router.intencaoPrincipal}-${Math.round(input.router.nivelDeConfianca * 100)}`,
    checklist: [
      `Revisar ${input.platformSources.length} fonte(s) da plataforma antes de agir.`,
      input.webSources.length > 0
        ? `Validar ${input.webSources.length} referencia(s) web e manter origem separada.`
        : "Sem referencia web nesta rodada; seguir apenas com contexto interno.",
      input.simulation
        ? "Confirmar hipoteses do simulador antes de gerar proposta ou workflow."
        : "Sem simulacao ativa; revisar se algum calculo ainda e necessario.",
      "Solicitar aprovacao do responsavel antes de criar output, workflow ou disparo operacional.",
      "Registrar a decisao final na thread operacional para auditoria."
    ],
    prefilledFields: prefilledFields.slice(0, 5),
    status: "rascunho",
    targetModule: inferExecutionTarget(input.actions)
  };
}

function buildSummary(
  router: ChatbookRouterDecision,
  platformSources: ChatbookSourceItem[],
  webSources: ChatbookSourceItem[],
  simulation: ChatbookSimulation | null
): string {
  const pieces: string[] = [];

  if (platformSources.length > 0) {
    pieces.push(`encontrei ${platformSources.length} sinais internos relevantes`);
  }

  if (webSources.length > 0) {
    pieces.push(`complementei com ${webSources.length} referencias externas`);
  }

  if (simulation) {
    const recommendedScenario = simulation.scenarios.find(
      (scenario) => scenario.tone === "recommended"
    );

    if (recommendedScenario) {
      pieces.push(
        `a simulacao indica economia anual estimada de ${formatCurrency(recommendedScenario.annualDelta)}`
      );
    }
  }

  if (pieces.length === 0) {
    pieces.push("organizei a pergunta para busca orientada na plataforma");
  }

  return `Resumo executivo: ${pieces.join(", ")}. Intencao principal identificada: ${router.intencaoPrincipal}.`;
}

function buildDecisionTrail(input: {
  attachmentContexts: ChatbookAttachmentContext[];
  attachmentNames: string[];
  router: ChatbookRouterDecision;
  usingLiveSearch: boolean;
  voiceEnabled: boolean;
}): string[] {
  const steps = [
    `Intencao principal classificada como ${input.router.intencaoPrincipal}.`,
    `Ferramentas acionadas: ${input.router.ferramentasNecessarias.join(", ")}.`,
    input.usingLiveSearch
      ? "Usei busca viva da plataforma antes de complementar com o catalogo demonstrativo."
      : "A busca interna ficou no modo demonstrativo ate a conexao completa com o indice vivo.",
    input.voiceEnabled
      ? "A experiencia de voz esta habilitada no navegador para STT e TTS."
      : "Sem voz ativa nesta interacao; mantive fallback total para digitacao."
  ];

  if (input.attachmentNames.length > 0) {
    steps.push(`Anexos recebidos no front-end: ${input.attachmentNames.join(", ")}.`);
  }

  if (input.attachmentContexts.length > 0) {
    steps.push(
      `Li conteudo textual de ${input.attachmentContexts.length} anexo(s): ${input.attachmentContexts
        .map((context) => context.name)
        .join(", ")}.`
    );
  }

  return steps;
}

export function isChatbookTool(value: unknown): value is ChatbookTool {
  return typeof value === "string" && (CHATBOOK_TOOLS as readonly string[]).includes(value);
}

export function getChatbookQuickCommands(): Array<{
  id: string;
  label: string;
  prompt: string;
}> {
  return [
    {
      id: "platform-search",
      label: "pesquise na plataforma",
      prompt: "Pesquise na plataforma tudo o que existe sobre este cliente e traga um resumo executivo."
    },
    {
      id: "web-search",
      label: "pesquise na web",
      prompt: "Pesquise referencias confiaveis na web para validar este cenario e diferencie a origem."
    },
    {
      id: "compare-options",
      label: "compare opcoes",
      prompt: "Compare os planos elegiveis, mostre ganhos e recomende a melhor opcao."
    },
    {
      id: "simulate",
      label: "simule este cenario",
      prompt: "Simule este cenario com base, recomendado, otimista e conservador, incluindo economia anual."
    },
    {
      id: "plain-language",
      label: "me explique em linguagem simples",
      prompt: "Explique em linguagem simples o que foi encontrado e qual a proxima acao."
    },
    {
      id: "draft",
      label: "crie um rascunho",
      prompt: "Monte um rascunho de proposta com resumo, comparacao e proxima etapa."
    }
  ];
}

export function buildChatbookReply(input: ChatbookQueryInput): ChatbookReply {
  const preferredTools = (input.preferredTools ?? []).filter(isChatbookTool);
  const attachmentContexts = normalizeAttachmentContexts(input.attachmentContexts ?? []);
  const attachmentSources = mapAttachmentSources(attachmentContexts);
  const routerSeed = detectIntent(input.message, preferredTools);
  const platformSearch = searchPlatformCatalog(input.message, input.livePlatformResults ?? []);
  const platformSources = [...attachmentSources, ...platformSearch.sourceItems].slice(0, 6);
  const shouldUseWeb =
    routerSeed.tools.includes("busca_web") ||
    (platformSources.length === 0 && !routerSeed.tools.includes("busca_web"));
  const webSources = shouldUseWeb ? searchWebCatalog(input.message) : [];
  const shouldSimulate = routerSeed.tools.some((tool) => isSimulationTool(tool));
  const simulation = shouldSimulate
    ? buildSimulation(input.message, platformSearch.demoMatches, input.simulationInput)
    : null;
  const confidenceBoost =
    (platformSources.length > 0 ? 0.08 : 0) +
    (webSources.length > 0 ? 0.04 : 0) +
    (simulation ? 0.08 : 0);
  const router: ChatbookRouterDecision = {
    confidenceLabel:
      routerSeed.confidence + confidenceBoost >= 0.8
        ? "alto"
        : routerSeed.confidence + confidenceBoost >= 0.64
          ? "medio"
          : "baixo",
    ferramentasNecessarias: Array.from(
      new Set(
        shouldUseWeb ? [...routerSeed.tools, "busca_web"] : routerSeed.tools
      )
    ),
    formatIdealDeResposta:
      "Resumo executivo, evidencias separadas por origem, simulacao quando houver e proxima acao pratica.",
    intencaoPrincipal: routerSeed.intent,
    nivelDeConfianca: clamp(routerSeed.confidence + confidenceBoost, 0.48, 0.97)
  };
  const actions = buildActions({
    platformSources,
    router,
    simulation
  });
  const executionPlan = buildExecutionPlan({
    actions,
    platformSources,
    router,
    simulation,
    webSources
  });
  const warnings = [
    "Modo MVP: a busca web usa um catalogo de fontes confiaveis prontas para integrar com um conector externo.",
    platformSearch.sourceItems.some((item) => item.sourceLabel === "Busca viva da plataforma")
      ? "Quando o indice interno responde, ele tem prioridade sobre o catalogo demonstrativo."
      : "Sem indice vivo suficiente, o agente caiu para o catalogo demonstrativo da plataforma."
  ];

  return {
    actions,
    decisionTrail: buildDecisionTrail({
      attachmentNames: input.attachmentNames ?? [],
      attachmentContexts,
      router,
      usingLiveSearch: platformSearch.sourceItems.some(
        (item) => item.sourceLabel === "Busca viva da plataforma"
      ),
      voiceEnabled: input.voiceEnabled === true
    }),
    demoMode: true,
    executionPlan,
    quickFollowUps: Array.from(QUICK_FOLLOW_UPS),
    requestId: input.requestId,
    router,
    sections: {
      plataforma:
        platformSources.length > 0
          ? platformSources.map(
              (item) => `${item.title}: ${item.summary} (${item.module}).`
            )
          : ["Nenhum registro suficientemente forte foi encontrado no indice interno desta rodada."],
      proximaAcaoRecomendada:
        actions[0]?.label ??
        "Abrir a tela mais relevante, revisar o contexto e decidir se devemos gerar um rascunho.",
      resumo: buildSummary(router, platformSources, webSources, simulation),
      simulacao:
        simulation?.scenarios.map(
          (scenario) =>
            `${scenario.label}: ${formatCurrency(scenario.annualValue)} por ano, delta de ${formatCurrency(scenario.annualDelta)}.`
        ) ?? [],
      web:
        webSources.length > 0
          ? webSources.map(
              (item) => `${item.title}: ${item.summary} (fonte ${item.sourceLabel}).`
            )
          : ["Sem complemento web nesta consulta."]
    },
    simulation,
    sources: {
      plataforma: platformSources,
      web: webSources
    },
    warnings
  };
}
