import type { SupportedLocale } from "../../lib/i18n";

import type {
  CrmRegionSnapshot,
  LeadRegionId,
  LeadSequenceStatus,
  SdrAutomaticLead
} from "./sdr-automatic-data";
import {
  getLeadDashboardCopy,
  isEnglish,
  resolveSlaLabel
} from "./sdr-automatic-dashboard.copy";

export { getLeadDashboardCopy, isEnglish, resolveSlaLabel };
export {
  buildSupportReply,
  createLeadInsightFallback
} from "./sdr-automatic-support";

export const AVAILABLE_LEAD_COLUMNS = [
  "lead",
  "email",
  "company",
  "owner",
  "region",
  "stage",
  "sequenceStatus",
  "score",
  "source",
  "createdAt",
  "sla",
  "action"
] as const;

export const DEFAULT_PAGE_SIZE = 5;

export const DEFAULT_VISIBLE_COLUMNS = [
  "lead",
  "email",
  "company",
  "region",
  "stage",
  "sequenceStatus",
  "score",
  "source",
  "createdAt",
  "sla",
  "action"
] as const;

export type LeadColumnId = (typeof AVAILABLE_LEAD_COLUMNS)[number];

export type LeadColumnTooltipId = LeadColumnId | "region" | "sequenceStatus";

export type LeadScoreBandId = "critical" | "high" | "warm";

export type ChurnWatchEntry = {
  lead: SdrAutomaticLead;
  riskLabel: string;
  riskScore: number;
  company: string;
  owner: string;
  region: LeadRegionId;
  summary: string;
  tone: "critical" | "healthy" | "watch";
};

export type FunnelPoint = {
  count: number;
  fill: string;
  id: string;
  label: string;
};

export type PipelinePoint = {
  conversionRate: number;
  count: number;
  stage: SdrAutomaticLead["stage"];
  stageLabel: string;
};

export type RegionalPerformancePoint = {
  activeAccounts: number;
  pipelineCoverage: number;
  region: LeadRegionId;
  regionLabel: string;
  revenuePotential: number;
  slaCompliance: number;
  x: number;
  y: number;
};

export type LeadFilters = {
  createdFrom: string;
  createdTo: string;
  query: string;
  regions: LeadRegionId[];
  scoreBands: LeadScoreBandId[];
  stages: SdrAutomaticLead["stage"][];
};

export type LiveDashboardMetrics = {
  activeLeads: number;
  aiExecutions: number;
  mqlsGenerated: number;
  slaViolations: number;
  updatedAt: string;
};

export type TrendPoint = {
  label: string;
  leads: number;
  mqls: number;
  slaCompliance: number;
  slaViolations: number;
};

export type PendingTask = {
  completed: boolean;
  id: string;
  title: string;
};

export type PollingFrame = {
  activeLeadsDelta: number;
  aiExecutionsDelta: number;
  leadUpdates: Array<{
    id: string;
    scoreDelta?: number;
    slaDueAt?: string;
    slaStatus?: SdrAutomaticLead["slaStatus"];
    stage?: SdrAutomaticLead["stage"];
  }>;
  mqlsGeneratedDelta: number;
  slaViolationsDelta: number;
};

export type LeadDashboardCopy = {
  activeAccountsLabel: string;
  activeLeadsLabel: string;
  addTaskLabel: string;
  aiAgentLabel: string;
  aiAnalysisLabel: string;
  aiButtonTooltipBullets: string[];
  aiButtonTooltipTitle: string;
  aiExecutionsLabel: string;
  aiTooltipEmpty: string;
  aiTooltipLoading: string;
  chatbotEmpty: string;
  chatbotGreeting: string;
  chatbotPromptPlaceholder: string;
  chatbotQuickPrompts: string[];
  chatbotSend: string;
  chatbotTitle: string;
  churnAgentLabel: string;
  churnEmptyLabel: string;
  churnRefreshLabel: string;
  churnSubtitle: string;
  churnTitle: string;
  clearFiltersLabel: string;
  columnTooltips: Record<LeadColumnTooltipId, string>;
  columnsLabel: string;
  conversionRateLabel: string;
  createdAtColumn: string;
  dateFilterLabel: string;
  dateFromLabel: string;
  dateToLabel: string;
  distributionTitle: string;
  emailColumn: string;
  emailSearchPlaceholder: string;
  exportCsvLabel: string;
  filterTooltips: {
    columns: string;
    date: string;
    region: string;
    score: string;
    stage: string;
  };
  filtersTitle: string;
  funnelSubtitle: string;
  funnelTitle: string;
  leadsByStageHint: string;
  leadsTrendTitle: string;
  leadsTrendSubtitle: string;
  leadsVisibleLabel: (visible: number, total: number) => string;
  mapActiveRegionLabel: string;
  mapSubtitle: string;
  mapTitle: string;
  metricsUpdatedLabel: (seconds: number) => string;
  mqlsGeneratedLabel: string;
  nextPageLabel: string;
  noLeadsLabel: string;
  noTasksLabel: string;
  pageLabel: (page: number, totalPages: number) => string;
  pipelineCoverageLabel: string;
  pipelineSubtitle: string;
  pipelineTitle: string;
  previousPageLabel: string;
  regionColumn: string;
  scoreBandLabels: Record<LeadScoreBandId, string>;
  regionFilterLabel: string;
  regionLabels: Record<LeadRegionId, string>;
  revenuePotentialLabel: string;
  riskLevelLabels: Record<ChurnWatchEntry["tone"], string>;
  scoreColumn: string;
  scoreFilterLabel: string;
  sendSequenceLabel: string;
  sequenceStatusColumn: string;
  sequenceStatusLabels: Record<LeadSequenceStatus, string>;
  slaComplianceLabel: string;
  slaBreachedLabel: string;
  slaColumn: string;
  slaHealthyLabel: string;
  slaTrendTitle: string;
  slaTrendSubtitle: string;
  slaViolationsLabel: string;
  slaWatchLabel: string;
  sourceColumn: string;
  stageColumn: string;
  stageFilterLabel: string;
  stageLabels: Record<SdrAutomaticLead["stage"], string>;
  taskPlaceholder: string;
  tasksTitle: string;
};

export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  createdFrom: "",
  createdTo: "",
  query: "",
  regions: [],
  scoreBands: [],
  stages: []
};

export const LEAD_POLLING_FRAMES: PollingFrame[] = [
  {
    activeLeadsDelta: 1,
    aiExecutionsDelta: 3,
    leadUpdates: [
      {
        id: "lead_carla_souza",
        scoreDelta: 1,
        slaDueAt: "2026-04-15T10:40:00.000Z",
        slaStatus: "breached",
        stage: "proposal"
      }
    ],
    mqlsGeneratedDelta: 1,
    slaViolationsDelta: 1
  },
  {
    activeLeadsDelta: 0,
    aiExecutionsDelta: 2,
    leadUpdates: [
      {
        id: "lead_bia_ferreira",
        scoreDelta: 3,
        slaDueAt: "2026-04-15T11:50:00.000Z",
        slaStatus: "watch",
        stage: "qualified"
      }
    ],
    mqlsGeneratedDelta: 1,
    slaViolationsDelta: 0
  },
  {
    activeLeadsDelta: 1,
    aiExecutionsDelta: 4,
    leadUpdates: [
      {
        id: "lead_diego_silva",
        scoreDelta: 4,
        slaDueAt: "2026-04-15T12:35:00.000Z",
        slaStatus: "watch",
        stage: "demo"
      }
    ],
    mqlsGeneratedDelta: 1,
    slaViolationsDelta: 0
  },
  {
    activeLeadsDelta: 0,
    aiExecutionsDelta: 2,
    leadUpdates: [
      {
        id: "lead_fernando_costa",
        scoreDelta: 2,
        slaDueAt: "2026-04-15T10:55:00.000Z",
        slaStatus: "breached",
        stage: "proposal"
      }
    ],
    mqlsGeneratedDelta: 1,
    slaViolationsDelta: 1
  }
];

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function formatTrendWindowLabel(locale: SupportedLocale, date: Date): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

export function getScoreBand(score: number): LeadScoreBandId {
  if (score >= 90) {
    return "critical";
  }

  if (score >= 80) {
    return "high";
  }

  return "warm";
}

export function getLeadEngagementBoost(lead: SdrAutomaticLead): number {
  const engagement = lead.engagement;

  if (!engagement) {
    return 0;
  }

  const hotIntentBoost = engagement.hotPages.reduce((total, page) => {
    const normalizedPage = page.toLowerCase();

    if (
      normalizedPage.includes("pricing") ||
      normalizedPage.includes("preco") ||
      normalizedPage.includes("roi") ||
      normalizedPage.includes("demo") ||
      normalizedPage.includes("integr")
    ) {
      return total + 2;
    }

    return total + 1;
  }, 0);

  return clamp(engagement.emailClicks + Math.floor(engagement.pageVisits / 2) + hotIntentBoost, 0, 14);
}

export function getLeadSupportPenalty(lead: SdrAutomaticLead): number {
  const support = lead.support;

  if (!support) {
    return 0;
  }

  const sentimentPenalty =
    support.sentiment === "negative" ? 4 : support.sentiment === "neutral" ? 1 : 0;

  return clamp(sentimentPenalty + Math.max(0, support.recentTickets - 1), 0, 10);
}

export function calculateChurnRiskScore(lead: SdrAutomaticLead): number {
  const slaPenalty =
    lead.slaStatus === "breached" ? 22 : lead.slaStatus === "watch" ? 10 : 0;
  const sequencePenalty = lead.sequenceStatus === "paused" ? 12 : 0;

  return clamp(
    28 + getLeadSupportPenalty(lead) * 6 + slaPenalty + sequencePenalty - getLeadEngagementBoost(lead) * 2,
    6,
    96
  );
}

export function getSequencePlan(
  lead: SdrAutomaticLead,
  locale: SupportedLocale
): {
  cadenceLabel: string;
  followUpSubject: string;
  primarySubject: string;
} {
  const english = isEnglish(locale);
  const company = lead.company;

  if (lead.stage === "proposal" || lead.stage === "negotiation") {
    return {
      cadenceLabel: english ? "Decision acceleration" : "Aceleracao de decisao",
      followUpSubject: english ? `ROI case for ${company}` : `Caso de ROI para ${company}`,
      primarySubject: english
        ? `Executive recap for ${company}`
        : `Resumo executivo para ${company}`
    };
  }

  if (lead.stage === "demo") {
    return {
      cadenceLabel: english ? "Demo confirmation" : "Confirmacao de demo",
      followUpSubject: english
        ? `Agenda and stakeholders for ${company}`
        : `Agenda e stakeholders de ${company}`,
      primarySubject: english
        ? `Demo prep for ${company}`
        : `Preparacao de demo para ${company}`
    };
  }

  return {
    cadenceLabel: english ? "Qualification nurture" : "Nurture de qualificacao",
    followUpSubject: english
      ? `Buying signals from ${company}`
      : `Sinais de compra de ${company}`,
    primarySubject: english
      ? `Next best step for ${company}`
      : `Proximo melhor passo para ${company}`
  };
}

export function filterLeads(leads: SdrAutomaticLead[], filters: LeadFilters): SdrAutomaticLead[] {
  const normalizedQuery = normalizeQuery(filters.query);
  const hasRegionFilter = filters.regions.length > 0;
  const hasStageFilter = filters.stages.length > 0;
  const hasScoreFilter = filters.scoreBands.length > 0;
  const fromDate = filters.createdFrom ? new Date(`${filters.createdFrom}T00:00:00`) : null;
  const toDate = filters.createdTo ? new Date(`${filters.createdTo}T23:59:59`) : null;

  return leads.filter((lead) => {
    if (normalizedQuery && !lead.email.toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    if (hasStageFilter && !filters.stages.includes(lead.stage)) {
      return false;
    }

    if (hasRegionFilter && (!lead.region || !filters.regions.includes(lead.region))) {
      return false;
    }

    if (hasScoreFilter && !filters.scoreBands.includes(getScoreBand(lead.score))) {
      return false;
    }

    const createdAt = new Date(lead.createdAt);

    if (fromDate && createdAt < fromDate) {
      return false;
    }

    if (toDate && createdAt > toDate) {
      return false;
    }

    return true;
  });
}

export function paginateLeads(
  leads: SdrAutomaticLead[],
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
): {
  currentPage: number;
  items: SdrAutomaticLead[];
  totalPages: number;
} {
  const totalPages = Math.max(1, Math.ceil(leads.length / pageSize));
  const currentPage = clamp(page, 1, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    items: leads.slice(start, start + pageSize),
    totalPages
  };
}

export function buildLeadCsv(leads: SdrAutomaticLead[], locale: SupportedLocale): string {
  const copy = getLeadDashboardCopy(locale);
  const header = [
    "Lead",
    copy.emailColumn,
    "Company",
    copy.stageColumn,
    copy.regionColumn,
    copy.sequenceStatusColumn,
    copy.scoreColumn,
    copy.sourceColumn,
    copy.createdAtColumn,
    copy.slaColumn,
    "Owner"
  ];

  const rows = leads.map((lead) => [
    lead.name,
    lead.email,
    lead.company,
    copy.stageLabels[lead.stage],
    copy.regionLabels[lead.region],
    copy.sequenceStatusLabels[lead.sequenceStatus],
    lead.score,
    lead.source,
    lead.createdAt,
    resolveSlaLabel(locale, lead.slaStatus),
    lead.owner
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function createInitialMetrics(leads: SdrAutomaticLead[]): LiveDashboardMetrics {
  return {
    activeLeads: leads.length,
    aiExecutions: 46,
    mqlsGenerated: leads.filter((lead) => lead.score >= 80).length,
    slaViolations: leads.filter((lead) => lead.slaStatus === "breached").length,
    updatedAt: new Date().toISOString()
  };
}

export function createInitialTrendSeries(locale: SupportedLocale): TrendPoint[] {
  const labels: readonly [string, string, string, string, string, string] = isEnglish(locale)
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Today"]
    : ["Seg", "Ter", "Qua", "Qui", "Sex", "Hoje"];

  return [
    { label: labels[0], leads: 18, mqls: 9, slaCompliance: 96, slaViolations: 1 },
    { label: labels[1], leads: 22, mqls: 10, slaCompliance: 95, slaViolations: 2 },
    { label: labels[2], leads: 24, mqls: 12, slaCompliance: 97, slaViolations: 1 },
    { label: labels[3], leads: 27, mqls: 13, slaCompliance: 94, slaViolations: 3 },
    { label: labels[4], leads: 25, mqls: 11, slaCompliance: 95, slaViolations: 2 },
    { label: labels[5], leads: 29, mqls: 14, slaCompliance: 93, slaViolations: 4 }
  ];
}

export function getStageDistribution(leads: SdrAutomaticLead[], locale: SupportedLocale) {
  const copy = getLeadDashboardCopy(locale);
  const counts = new Map<SdrAutomaticLead["stage"], number>();

  for (const lead of leads) {
    counts.set(lead.stage, (counts.get(lead.stage) ?? 0) + 1);
  }

  return (Object.keys(copy.stageLabels) as Array<SdrAutomaticLead["stage"]>).map((stage) => ({
    count: counts.get(stage) ?? 0,
    stage,
    stageLabel: copy.stageLabels[stage]
  }));
}

export function createInitialTasks(locale: SupportedLocale): PendingTask[] {
  return isEnglish(locale)
    ? [
        { completed: false, id: "task_follow_julia", title: "Follow up with Julia before the afternoon committee" },
        { completed: false, id: "task_sla_fernando", title: "Recover Fernando's SLA and confirm the owner" },
        { completed: true, id: "task_export_board", title: "Export the filtered lead list for the board update" }
      ]
    : [
        { completed: false, id: "task_follow_julia", title: "Fazer follow-up com Julia antes do comite da tarde" },
        { completed: false, id: "task_sla_fernando", title: "Recuperar o SLA do Fernando e confirmar ownership" },
        { completed: true, id: "task_export_board", title: "Exportar a lista filtrada para a atualizacao do board" }
      ];
}

export function applyPollingFrameToLeads(
  leads: SdrAutomaticLead[],
  frame: PollingFrame
): SdrAutomaticLead[] {
  return leads.map((lead) => {
    const update = frame.leadUpdates.find((item) => item.id === lead.id);

    if (!update) {
      return lead;
    }

    return {
      ...lead,
      score: clamp(lead.score + (update.scoreDelta ?? 0), 0, 100),
      ...(update.slaDueAt ? { slaDueAt: update.slaDueAt } : {}),
      ...(update.slaStatus ? { slaStatus: update.slaStatus } : {}),
      ...(update.stage ? { stage: update.stage } : {})
    };
  });
}

export function applyPollingFrameToMetrics(
  metrics: LiveDashboardMetrics,
  frame: PollingFrame
): LiveDashboardMetrics {
  return {
    activeLeads: Math.max(0, metrics.activeLeads + frame.activeLeadsDelta),
    aiExecutions: Math.max(0, metrics.aiExecutions + frame.aiExecutionsDelta),
    mqlsGenerated: Math.max(0, metrics.mqlsGenerated + frame.mqlsGeneratedDelta),
    slaViolations: Math.max(0, metrics.slaViolations + frame.slaViolationsDelta),
    updatedAt: new Date().toISOString()
  };
}

export function applyPollingFrameToTrend(
  trend: TrendPoint[],
  frame: PollingFrame,
  locale: SupportedLocale,
  now = new Date()
): TrendPoint[] {
  const lastPoint = trend[trend.length - 1];

  if (!lastPoint) {
    return trend;
  }

  const nextPoint: TrendPoint = {
    label: formatTrendWindowLabel(locale, now),
    leads: Math.max(0, lastPoint.leads + frame.activeLeadsDelta),
    mqls: Math.max(0, lastPoint.mqls + frame.mqlsGeneratedDelta),
    slaCompliance: clamp(
      lastPoint.slaCompliance + (frame.slaViolationsDelta === 0 ? 1 : -Math.max(1, frame.slaViolationsDelta * 2)),
      86,
      99
    ),
    slaViolations: Math.max(0, lastPoint.slaViolations + frame.slaViolationsDelta)
  };

  return [...trend.slice(Math.max(0, trend.length - 5)), nextPoint];
}

const REGION_LAYOUT: Record<LeadRegionId, { x: number; y: number }> = {
  "asia-pacific": { x: 82, y: 66 },
  "europe": { x: 56, y: 34 },
  "latin-america": { x: 28, y: 66 },
  "north-america": { x: 22, y: 30 }
};

const LIFECYCLE_LABELS: Record<
  "customer" | "lead" | "mql" | "opportunity" | "sql" | "subscriber",
  Record<SupportedLocale, string>
> = {
  customer: { "en-US": "Customer", "pt-BR": "Customer" },
  lead: { "en-US": "Lead", "pt-BR": "Lead" },
  mql: { "en-US": "MQL", "pt-BR": "MQL" },
  opportunity: { "en-US": "Opportunity", "pt-BR": "Oportunidade" },
  sql: { "en-US": "SQL", "pt-BR": "SQL" },
  subscriber: { "en-US": "Subscriber", "pt-BR": "Subscriber" }
};

export function getPipelineData(leads: SdrAutomaticLead[], locale: SupportedLocale): PipelinePoint[] {
  const copy = getLeadDashboardCopy(locale);
  const stages: SdrAutomaticLead["stage"][] = [
    "new",
    "qualified",
    "demo",
    "proposal",
    "negotiation"
  ];
  const counts = new Map<SdrAutomaticLead["stage"], number>();

  for (const lead of leads) {
    counts.set(lead.stage, (counts.get(lead.stage) ?? 0) + 1);
  }

  return stages.map((stage, index) => {
    const count = counts.get(stage) ?? 0;
    const previousStage = stages[index - 1];
    const previousCount = previousStage ? counts.get(previousStage) ?? 0 : count;

    return {
      conversionRate: index === 0 ? 100 : Math.round((count / Math.max(previousCount, 1)) * 100),
      count,
      stage,
      stageLabel: copy.stageLabels[stage]
    };
  });
}

export function buildLifecycleFunnelData(
  crmRegions: CrmRegionSnapshot[],
  locale: SupportedLocale,
  selectedRegions: LeadRegionId[]
): FunnelPoint[] {
  const focusedRegions =
    selectedRegions.length > 0
      ? crmRegions.filter((entry) => selectedRegions.includes(entry.region))
      : crmRegions;
  const lifecycleOrder: Array<keyof CrmRegionSnapshot["lifecycle"]> = [
    "subscriber",
    "lead",
    "mql",
    "sql",
    "opportunity",
    "customer"
  ];
  const fills = ["#dbeafe", "#7dd3fc", "#38bdf8", "#14b8a6", "#f59e0b", "#f97316"];

  return lifecycleOrder.map((stage, index) => ({
    count: focusedRegions.reduce((total, region) => total + region.lifecycle[stage], 0),
    fill: fills[index] ?? "#1d8f84",
    id: stage,
    label: LIFECYCLE_LABELS[stage][locale]
  }));
}

export function getRegionalPerformance(
  crmRegions: CrmRegionSnapshot[],
  leads: SdrAutomaticLead[],
  locale: SupportedLocale
): RegionalPerformancePoint[] {
  const copy = getLeadDashboardCopy(locale);
  const leadsByRegion = new Map<LeadRegionId, number>();

  for (const lead of leads) {
    const region = lead.region ?? "latin-america";
    leadsByRegion.set(region, (leadsByRegion.get(region) ?? 0) + 1);
  }

  return crmRegions.map((region) => {
    const layout = REGION_LAYOUT[region.region];
    const filteredLeadCount = leadsByRegion.get(region.region) ?? 0;

    return {
      activeAccounts: region.activeAccounts + filteredLeadCount,
      pipelineCoverage: Number((region.pipelineCoverage + filteredLeadCount * 0.02).toFixed(1)),
      region: region.region,
      regionLabel: copy.regionLabels[region.region],
      revenuePotential: region.revenuePotential + filteredLeadCount * 7500,
      slaCompliance: region.slaCompliance,
      x: layout.x,
      y: layout.y
    };
  });
}

export function getChurnWatchlist(
  leads: SdrAutomaticLead[],
  locale: SupportedLocale
): ChurnWatchEntry[] {
  const copy = getLeadDashboardCopy(locale);

  return [...leads]
    .map((lead) => {
      const riskScore = calculateChurnRiskScore(lead);
      const tone =
        riskScore >= 72 ? "critical" : riskScore >= 48 ? "watch" : "healthy";

      return {
        company: lead.company,
        lead,
        owner: lead.owner,
        region: lead.region ?? "latin-america",
        riskLabel: copy.riskLevelLabels[tone],
        riskScore,
        summary: lead.support?.summary ?? (isEnglish(locale) ? "Support is stable." : "Suporte estavel."),
        tone
      } satisfies ChurnWatchEntry;
    })
    .sort((left, right) => right.riskScore - left.riskScore)
    .slice(0, 4);
}

export function buildChurnSummaryFallback(
  leads: SdrAutomaticLead[],
  locale: SupportedLocale
): string {
  const watchlist = getChurnWatchlist(leads, locale).filter((entry) => entry.tone !== "healthy");

  if (watchlist.length === 0) {
    return isEnglish(locale)
      ? "The current queue is stable, with no major churn hotspots in the filtered slice."
      : "A fila atual esta estavel, sem hotspots relevantes de churn no recorte filtrado.";
  }

  const [firstEntry, secondEntry] = watchlist;

  if (!firstEntry) {
    return isEnglish(locale)
      ? "The current queue is stable, with no major churn hotspots in the filtered slice."
      : "A fila atual esta estavel, sem hotspots relevantes de churn no recorte filtrado.";
  }

  if (isEnglish(locale)) {
    return `${firstEntry.lead.company} leads the churn pressure at ${firstEntry.riskScore}/100, followed by ${secondEntry?.lead.company ?? "the rest of the queue"}. Support friction and SLA pressure are the main risk multipliers.`;
  }

  return `${firstEntry.lead.company} lidera a pressao de churn com ${firstEntry.riskScore}/100, seguida por ${secondEntry?.lead.company ?? "o restante da fila"}. Friccao de suporte e pressao de SLA sao os principais multiplicadores de risco.`;
}
