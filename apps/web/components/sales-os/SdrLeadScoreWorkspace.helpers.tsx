import type { SupportedLocale } from "../../lib/i18n";

import type { SdrAutomaticLead } from "./sdr-automatic-data";
import {
  calculateChurnRiskScore,
  getLeadDashboardCopy,
  getLeadEngagementBoost,
  getLeadSupportPenalty,
  getScoreBand,
  getSequencePlan,
  resolveSlaLabel
} from "./sdr-automatic-dashboard";
import { createLeadInsightFallback } from "./sdr-automatic-support";

export type SupportMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export type LeadInsightDetail = {
  highlights: string[];
  recommendedActions: string[];
  scoreBreakdown: Array<{
    label: string;
    value: string;
  }>;
  summary: string;
};

export type LeadInsightState = {
  detail: LeadInsightDetail;
  source: string;
  status: "error" | "loading" | "ready";
};

export type LeadSequenceDetail = {
  cadenceLabel: string;
  rationale: string[];
  steps: Array<{
    label: string;
    subject: string;
  }>;
  summary: string;
};

export type LeadSequenceState = {
  detail: LeadSequenceDetail;
  source: string;
  status: "error" | "loading" | "ready";
};

export function buildId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function buildScoreFillColor(score: number): string {
  const band = getScoreBand(score);

  if (band === "critical") {
    return "#f97316";
  }

  if (band === "high") {
    return "#f59e0b";
  }

  return "#0ea5e9";
}

export function buildStageColor(stage: SdrAutomaticLead["stage"]): string {
  switch (stage) {
    case "proposal":
      return "#f97316";
    case "negotiation":
      return "#ef4444";
    case "demo":
      return "#0ea5e9";
    case "qualified":
      return "#14b8a6";
    case "new":
    default:
      return "#22c55e";
  }
}

export function buildSequenceStatusTone(status: SdrAutomaticLead["sequenceStatus"]) {
  if (status === "completed") {
    return "healthy" as const;
  }

  if (status === "paused") {
    return "watch" as const;
  }

  return "active" as const;
}

export function compactInsight(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 420 ? `${compact.slice(0, 417)}...` : compact;
}

export function buildLeadInsightDetail(
  lead: SdrAutomaticLead,
  locale: SupportedLocale,
  agentSummary?: string
): LeadInsightDetail {
  const copy = getLeadDashboardCopy(locale);
  const engagement = lead.engagement ?? {
    emailClicks: 0,
    hotPages: [],
    lastTouchpointAt: lead.createdAt,
    pageVisits: 0
  };
  const engagementBoost = getLeadEngagementBoost(lead);
  const supportPenalty = getLeadSupportPenalty(lead);
  const sequencePlan = getSequencePlan(lead, locale);
  const churnRisk = calculateChurnRiskScore(lead);
  const fallbackSummary = createLeadInsightFallback(lead, locale);
  const summary = compactInsight(agentSummary && agentSummary.trim().length > 0 ? agentSummary : fallbackSummary);

  return {
    highlights: [
      locale === "en-US"
        ? `${engagement.emailClicks} email clicks and ${engagement.pageVisits} high-intent page visits from ${copy.regionLabels[lead.region ?? "latin-america"]}.`
        : `${engagement.emailClicks} cliques em e-mail e ${engagement.pageVisits} visitas de alta intencao vindas de ${copy.regionLabels[lead.region ?? "latin-america"]}.`,
      locale === "en-US"
        ? `Key pages: ${engagement.hotPages.slice(0, 3).join(", ")}.`
        : `Paginas-chave: ${engagement.hotPages.slice(0, 3).join(", ")}.`,
      locale === "en-US"
        ? `SLA is ${resolveSlaLabel(locale, lead.slaStatus).toLowerCase()} and churn pressure is ${churnRisk}/100.`
        : `SLA esta ${resolveSlaLabel(locale, lead.slaStatus).toLowerCase()} e a pressao de churn esta em ${churnRisk}/100.`
    ],
    recommendedActions: [
      locale === "en-US"
        ? `Primary next step: ${lead.action}.`
        : `Proximo passo principal: ${lead.action}.`,
      locale === "en-US"
        ? `Trigger sequence: ${sequencePlan.primarySubject}.`
        : `Disparar sequencia: ${sequencePlan.primarySubject}.`,
      locale === "en-US"
        ? `Owner focus: unblock ${lead.owner} before the score cools down.`
        : `Foco do owner: destravar ${lead.owner} antes que o score esfrie.`
    ],
    scoreBreakdown: [
      {
        label: locale === "en-US" ? "Base fit" : "Fit base",
        value: `${lead.baseScore}`
      },
      {
        label: locale === "en-US" ? "Engagement lift" : "Ganho de engajamento",
        value: `+${engagementBoost}`
      },
      {
        label: locale === "en-US" ? "Churn drag" : "Arrasto de churn",
        value: `-${supportPenalty}`
      },
      {
        label: locale === "en-US" ? "Final predictive score" : "Score preditivo final",
        value: `${lead.score}`
      }
    ],
    summary
  };
}

function buildFinalSequenceSubject(lead: SdrAutomaticLead, locale: SupportedLocale): string {
  if (lead.stage === "proposal" || lead.stage === "negotiation") {
    return locale === "en-US"
      ? `Mutual action plan for ${lead.company}`
      : `Plano mutuo para ${lead.company}`;
  }

  if (lead.stage === "demo") {
    return locale === "en-US"
      ? `Questions before the demo for ${lead.company}`
      : `Perguntas antes da demo para ${lead.company}`;
  }

  return locale === "en-US"
    ? `Proof points for ${lead.company}`
    : `Provas de valor para ${lead.company}`;
}

function createLeadSequenceFallback(lead: SdrAutomaticLead, locale: SupportedLocale): string {
  const copy = getLeadDashboardCopy(locale);
  const sequencePlan = getSequencePlan(lead, locale);
  const hotPages = lead.engagement.hotPages.slice(0, 2).join(", ");
  const hotPageSummary = hotPages.length > 0
    ? hotPages
    : locale === "en-US"
      ? "pricing and integration pages"
      : "paginas de preco e integracao";

  if (locale === "en-US") {
    return `${lead.name} should enter a ${sequencePlan.cadenceLabel.toLowerCase()} cadence because ${copy.stageLabels[lead.stage].toLowerCase()} leads at ${lead.score} points are still showing intent through ${lead.engagement.emailClicks} email clicks and ${hotPageSummary}. Start with a direct value recap, follow with proof, and close the loop with one CTA tied to ${lead.action.toLowerCase()}.`;
  }

  return `${lead.name} deve entrar em uma cadencia de ${sequencePlan.cadenceLabel.toLowerCase()} porque leads em ${copy.stageLabels[lead.stage].toLowerCase()} com ${lead.score} pontos ainda mostram intencao por meio de ${lead.engagement.emailClicks} cliques em e-mail e ${hotPageSummary}. Comece com uma recapitulacao de valor, siga com prova social e feche com um CTA unico ligado a ${lead.action.toLowerCase()}.`;
}

export function buildLeadSequenceDetail(
  lead: SdrAutomaticLead,
  locale: SupportedLocale,
  agentSummary?: string
): LeadSequenceDetail {
  const copy = getLeadDashboardCopy(locale);
  const sequencePlan = getSequencePlan(lead, locale);
  const engagementBoost = getLeadEngagementBoost(lead);
  const supportPenalty = getLeadSupportPenalty(lead);
  const summary = compactInsight(
    agentSummary && agentSummary.trim().length > 0
      ? agentSummary
      : createLeadSequenceFallback(lead, locale)
  );
  const currency = new Intl.NumberFormat(locale, {
    currency: locale === "en-US" ? "USD" : "BRL",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(lead.crmAnnualValue);

  return {
    cadenceLabel: sequencePlan.cadenceLabel,
    rationale: [
      locale === "en-US"
        ? `Lead score ${lead.score} in ${copy.stageLabels[lead.stage]} with ${engagementBoost} engagement points.`
        : `Lead score ${lead.score} em ${copy.stageLabels[lead.stage]} com ${engagementBoost} pontos de engajamento.`,
      locale === "en-US"
        ? `Target account in ${copy.regionLabels[lead.region]} with ${currency} of CRM potential.`
        : `Conta alvo em ${copy.regionLabels[lead.region]} com ${currency} de potencial no CRM.`,
      locale === "en-US"
        ? `Support pressure removes ${supportPenalty} points, so the CTA should stay singular and urgent.`
        : `A pressao de suporte remove ${supportPenalty} pontos, entao o CTA deve continuar unico e urgente.`
    ],
    steps: [
      {
        label: locale === "en-US" ? "Day 0" : "Dia 0",
        subject: sequencePlan.primarySubject
      },
      {
        label: locale === "en-US" ? "Day 3" : "Dia 3",
        subject: sequencePlan.followUpSubject
      },
      {
        label: locale === "en-US" ? "Day 6" : "Dia 6",
        subject: buildFinalSequenceSubject(lead, locale)
      }
    ],
    summary
  };
}
