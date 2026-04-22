import type { SupportedLocale } from "../../lib/i18n";

import type { SdrAutomaticLead } from "./sdr-automatic-data";
import type {
  LeadFilters,
  LiveDashboardMetrics
} from "./sdr-automatic-dashboard";
import {
  getLeadEngagementBoost,
  getLeadDashboardCopy,
  getLeadSupportPenalty,
  getSequencePlan,
  isEnglish
} from "./sdr-automatic-dashboard";

function findMatchedLead(leads: SdrAutomaticLead[], normalizedQuestion: string): SdrAutomaticLead | undefined {
  return leads.find((lead) => {
    return (
      normalizedQuestion.includes(lead.name.toLowerCase()) ||
      normalizedQuestion.includes(lead.company.toLowerCase()) ||
      normalizedQuestion.includes(lead.email.toLowerCase())
    );
  });
}

function buildSlaReply(
  locale: SupportedLocale,
  metrics: LiveDashboardMetrics,
  breachedLeads: SdrAutomaticLead[]
): string {
  if (breachedLeads.length === 0) {
    return isEnglish(locale)
      ? `There are no active SLA breaches in the current view. The queue is healthy for now, so the next best move is to protect the highest-scoring leads.`
      : `Nao ha violacoes de SLA ativas na visao atual. A fila esta saudavel por enquanto, entao o melhor proximo passo e proteger os leads com maior score.`;
  }

  const leadNames = breachedLeads.slice(0, 2).map((lead) => lead.name);
  const highlightedQueue = leadNames.join(isEnglish(locale) ? " and " : " e ");

  if (isEnglish(locale)) {
    return `${metrics.slaViolations} SLA breaches are active right now. The hardest pressure sits on ${highlightedQueue || "the filtered queue"}, so the safest next move is to clear those owners first.`;
  }

  return `${metrics.slaViolations} violacoes de SLA estao ativas agora. A maior pressao esta em ${highlightedQueue || "toda a fila filtrada"}, entao o proximo passo mais seguro e destravar esses owners primeiro.`;
}

function buildMetricsReply(locale: SupportedLocale, metrics: LiveDashboardMetrics): string {
  if (isEnglish(locale)) {
    return `The dashboard is tracking ${metrics.activeLeads} active leads, ${metrics.mqlsGenerated} MQLs, ${metrics.slaViolations} SLA breaches, and ${metrics.aiExecutions} AI runs. The conversion signal remains strongest at the top of the filtered queue.`;
  }

  return `O dashboard esta acompanhando ${metrics.activeLeads} leads ativos, ${metrics.mqlsGenerated} MQLs, ${metrics.slaViolations} violacoes de SLA e ${metrics.aiExecutions} execucoes de IA. O melhor sinal de conversao continua no topo da fila filtrada.`;
}

function buildScoreReply(locale: SupportedLocale, leads: SdrAutomaticLead[]): string {
  if (leads.length === 0) {
    return isEnglish(locale)
      ? "There are no leads in the current filtered view yet. Clear a filter or expand the date range to see more pipeline."
      : "Nao ha leads na visao filtrada atual. Limpe um filtro ou amplie a faixa de datas para ver mais pipeline.";
  }

  const summary = leads
    .slice(0, 3)
    .map((lead) => `${lead.name} (${lead.score})`)
    .join(", ");

  if (isEnglish(locale)) {
    return `The highest scores in the current view are ${summary}. Prioritize the first lead if the team only has one slot this cycle.`;
  }

  return `Os maiores scores na visao atual sao ${summary}. Priorize o primeiro lead se o time tiver apenas um slot neste ciclo.`;
}

function buildFilterReply(locale: SupportedLocale, filters: LeadFilters): string {
  const copy = getLeadDashboardCopy(locale);
  const activeFilters = [
    filters.query ? `${copy.emailColumn}: ${filters.query}` : null,
    filters.createdFrom ? `${copy.dateFromLabel}: ${filters.createdFrom}` : null,
    filters.createdTo ? `${copy.dateToLabel}: ${filters.createdTo}` : null,
    filters.regions.length > 0
      ? `${copy.regionFilterLabel}: ${filters.regions.map((region) => copy.regionLabels[region]).join(", ")}`
      : null,
    filters.stages.length > 0
      ? `${copy.stageFilterLabel}: ${filters.stages.map((stage) => copy.stageLabels[stage]).join(", ")}`
      : null,
    filters.scoreBands.length > 0
      ? `${copy.scoreFilterLabel}: ${filters.scoreBands.map((band) => copy.scoreBandLabels[band]).join(", ")}`
      : null
  ].filter((value): value is string => Boolean(value));

  if (activeFilters.length > 0) {
    return activeFilters.join(" | ");
  }

  return isEnglish(locale)
    ? "No filter is active right now. The table is showing the full recent lead queue."
    : "Nenhum filtro esta ativo agora. A tabela esta mostrando a fila completa de leads recentes.";
}

export function createLeadInsightFallback(
  lead: SdrAutomaticLead,
  locale: SupportedLocale
): string {
  const copy = getLeadDashboardCopy(locale);
  const stageLabel = copy.stageLabels[lead.stage];
  const sequencePlan = getSequencePlan(lead, locale);
  const engagementBoost = getLeadEngagementBoost(lead);
  const supportPenalty = getLeadSupportPenalty(lead);
  const engagement = lead.engagement ?? {
    emailClicks: 0,
    hotPages: [],
    lastTouchpointAt: lead.createdAt,
    pageVisits: 0
  };
  const hotPages = engagement.hotPages.slice(0, 2).join(isEnglish(locale) ? ", " : " e ");

  if (isEnglish(locale)) {
    return `${lead.name} is at ${lead.score} points in ${stageLabel}. Engagement adds ${engagementBoost} points through ${engagement.emailClicks} email clicks and ${hotPages.toLowerCase()}, while support pressure removes ${supportPenalty}. The safest move is ${lead.action.toLowerCase()} with the sequence "${sequencePlan.primarySubject}".`;
  }

  return `${lead.name} esta com ${lead.score} pontos em ${stageLabel}. O engajamento soma ${engagementBoost} pontos com ${engagement.emailClicks} cliques em e-mail e ${hotPages.toLowerCase()}, enquanto o suporte reduz ${supportPenalty}. O movimento mais seguro e ${lead.action.toLowerCase()} com a sequencia "${sequencePlan.primarySubject}".`;
}

export function buildSupportReply(input: {
  filters: LeadFilters;
  leads: SdrAutomaticLead[];
  locale: SupportedLocale;
  metrics: LiveDashboardMetrics;
  question: string;
}): string {
  const { filters, leads, locale, metrics, question } = input;
  const copy = getLeadDashboardCopy(locale);
  const normalizedQuestion = question.toLowerCase();
  const orderedLeads = [...leads].sort((left, right) => right.score - left.score);
  const matchedLead = findMatchedLead(orderedLeads, normalizedQuestion);

  if (matchedLead) {
    return createLeadInsightFallback(matchedLead, locale);
  }

  if (normalizedQuestion.includes("sla")) {
    return buildSlaReply(
      locale,
      metrics,
      orderedLeads.filter((lead) => lead.slaStatus === "breached")
    );
  }

  if (
    normalizedQuestion.includes("mql") ||
    normalizedQuestion.includes("metrica") ||
    normalizedQuestion.includes("metric")
  ) {
    return buildMetricsReply(locale, metrics);
  }

  if (normalizedQuestion.includes("score") || normalizedQuestion.includes("top")) {
    return buildScoreReply(locale, orderedLeads);
  }

  if (normalizedQuestion.includes("filtro") || normalizedQuestion.includes("filter")) {
    return buildFilterReply(locale, filters);
  }

  if (
    normalizedQuestion.includes("regiao") ||
    normalizedQuestion.includes("region") ||
    normalizedQuestion.includes("territ")
  ) {
    const regionLabels = [
      ...new Set(orderedLeads.map((lead) => copy.regionLabels[lead.region ?? "latin-america"]))
    ].join(", ");

    return isEnglish(locale)
      ? `The filtered queue is concentrated in ${regionLabels || "all regions"}, with the best urgency sitting on the highest-scored accounts.`
      : `A fila filtrada esta concentrada em ${regionLabels || "todas as regioes"}, com a maior urgencia nas contas de maior score.`;
  }

  const [topLead] = orderedLeads;
  if (topLead) {
    return createLeadInsightFallback(topLead, locale);
  }

  return isEnglish(locale)
    ? "I can help with top leads, SLA pressure, MQL momentum, or the current filter state."
    : "Posso ajudar com top leads, pressao de SLA, ritmo de MQLs ou o estado atual dos filtros.";
}
