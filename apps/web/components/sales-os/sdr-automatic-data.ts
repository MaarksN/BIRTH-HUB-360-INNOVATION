import type { SupportedLocale } from "../../lib/i18n";

import {
  SDR_AUTOMATIC_COPY,
  SDR_AUTOMATIC_CRM_REGIONS,
  SDR_AUTOMATIC_LEADS,
  SDR_AUTOMATIC_TIME_SLOTS
} from "./sdr-automatic-data.catalog";

export type LeadRegionId =
  | "north-america"
  | "latin-america"
  | "europe"
  | "asia-pacific";

export type LeadLifecycleStage =
  | "subscriber"
  | "lead"
  | "mql"
  | "sql"
  | "opportunity"
  | "customer";

export type LeadSequenceStatus = "active" | "completed" | "paused";

export type LeadEngagement = {
  emailClicks: number;
  hotPages: string[];
  lastTouchpointAt: string;
  pageVisits: number;
};

export type LeadSupportSignal = {
  recentTickets: number;
  sentiment: "negative" | "neutral" | "positive";
  summary: string;
};

export type SdrAutomaticLead = {
  action: string;
  baseScore: number;
  city: string;
  company: string;
  companySize: string;
  country: string;
  createdAt: string;
  crmAnnualValue: number;
  email: string;
  engagement: LeadEngagement;
  id: string;
  latitude: number;
  lifecycleStage: LeadLifecycleStage;
  longitude: number;
  name: string;
  owner: string;
  priority: string;
  priorityTone: "critical" | "high" | "warm";
  region: LeadRegionId;
  role: string;
  score: number;
  sequenceStatus: LeadSequenceStatus;
  slaDueAt: string;
  slaStatus: "breached" | "healthy" | "watch";
  source: string;
  stage: "demo" | "negotiation" | "new" | "proposal" | "qualified";
  support: LeadSupportSignal;
};

export type SdrAutomaticLeadSeed = Omit<SdrAutomaticLead, "baseScore">;

export type SdrAutomaticTimeSlot = {
  label: string;
  recommended?: boolean;
};

export type CrmRegionSnapshot = {
  activeAccounts: number;
  lifecycle: Record<LeadLifecycleStage, number>;
  pipelineCoverage: number;
  region: LeadRegionId;
  revenuePotential: number;
  slaCompliance: number;
};

export type SdrAutomaticCopy = {
  actionPrimary: string;
  agendaCaption: string;
  agendaHelper: string;
  agendaSubtitle: string;
  agendaTitle: string;
  assistantHint: string;
  assistantSubtitle: string;
  assistantTitle: string;
  callFocus: string;
  handoffSubtitle: string;
  handoffTitle: string;
  heroDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  leadSubtitle: string;
  leadTitle: string;
  metrics: Array<{ label: string; value: string }>;
  moduleLabel: string;
  nextStepLabel: string;
  premiumDescription: string;
  premiumEyebrow: string;
  premiumLayersLabel: string;
  premiumOpenAgents: string;
  premiumSummaryLabel: string;
  premiumTitle: string;
  premiumViewAll: string;
  quickBrief: string;
  salesRepName: string;
  salesRepRole: string;
  sidebarTitle: string;
  spinLabel: string;
  summaryLabel: string;
  tableAction: string;
  tableLead: string;
  tablePriority: string;
  tableScore: string;
  tableSource: string;
  timelineLabel: string;
};

export type SdrAutomaticViewDefinition = {
  description: string;
  id: "agendador" | "assistente" | "handoff" | "leadScore";
  label: string;
};

type SdrAutomaticConfig = {
  copy: SdrAutomaticCopy;
  crmRegions: CrmRegionSnapshot[];
  leads: SdrAutomaticLead[];
  timeSlots: SdrAutomaticTimeSlot[];
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function calculateEngagementBoost(lead: Pick<SdrAutomaticLeadSeed, "engagement">): number {
  const hotIntentBoost = lead.engagement.hotPages.reduce((total, page) => {
    const normalizedPage = page.toLowerCase();

    if (
      normalizedPage.includes("pricing") ||
      normalizedPage.includes("roi") ||
      normalizedPage.includes("demo") ||
      normalizedPage.includes("integr")
    ) {
      return total + 2;
    }

    return total + 1;
  }, 0);

  return clamp(
    lead.engagement.emailClicks + Math.floor(lead.engagement.pageVisits / 2) + hotIntentBoost,
    0,
    12
  );
}

function calculateSupportPenalty(lead: Pick<SdrAutomaticLeadSeed, "support">): number {
  const sentimentPenalty =
    lead.support.sentiment === "negative" ? 4 : lead.support.sentiment === "neutral" ? 1 : 0;

  return clamp(sentimentPenalty + Math.max(0, lead.support.recentTickets - 1), 0, 8);
}

function hydrateLead(lead: SdrAutomaticLeadSeed): SdrAutomaticLead {
  return {
    ...lead,
    baseScore: lead.score,
    score: clamp(lead.score + calculateEngagementBoost(lead) - calculateSupportPenalty(lead), 0, 100)
  };
}

export function toneForScore(score: number): "critical" | "high" | "warm" {
  if (score >= 90) {
    return "critical";
  }

  if (score >= 75) {
    return "high";
  }

  return "warm";
}

export function getSdrAutomaticConfig(locale: SupportedLocale): SdrAutomaticConfig {
  return {
    copy: SDR_AUTOMATIC_COPY[locale],
    crmRegions: SDR_AUTOMATIC_CRM_REGIONS,
    leads: SDR_AUTOMATIC_LEADS[locale].map(hydrateLead),
    timeSlots: SDR_AUTOMATIC_TIME_SLOTS
  };
}

export function getSdrAutomaticViewDefinitions(
  copy: SdrAutomaticCopy
): SdrAutomaticViewDefinition[] {
  return [
    {
      description: copy.leadSubtitle,
      id: "leadScore",
      label: copy.leadTitle
    },
    {
      description: copy.assistantSubtitle,
      id: "assistente",
      label: copy.assistantTitle
    },
    {
      description: copy.agendaSubtitle,
      id: "agendador",
      label: copy.agendaTitle
    },
    {
      description: copy.handoffSubtitle,
      id: "handoff",
      label: copy.handoffTitle
    }
  ];
}
