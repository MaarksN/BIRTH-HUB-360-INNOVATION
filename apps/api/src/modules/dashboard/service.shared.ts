import { Prisma, prisma } from "@birthub/database";
import type { ConnectorImplementationStage } from "@birthub/integrations";

import { getBillingSnapshot } from "../billing/service.js";

type PipelineItem = { stage: string; value: number; trend: string };
type HealthScoreItem = { client: string; score: number; risk: string; nps: number };
type FinanceItem = { label: string; value: string; delta: string };
type AttributionItem = { source: string; leads: number; conversion: string; cac: string };
type ContractItem = { customer: string; status: string; mrr: string; owner: string };
type IntegrationActivityItem = {
  createdAt: string;
  direction: string;
  eventType: string;
  id: string;
  provider: string;
  responseStatus: number | null;
};
type ConnectorStatusItem = {
  accountId: string;
  checkedAt: string | null;
  healthStatus: string | null;
  implementationStage: ConnectorImplementationStage;
  lastError: string | null;
  lastExecutionAt: string | null;
  lastExecutionStatus: string | null;
  provider: string;
  runtimeImplemented: boolean;
  status: string;
};
type ClinicalMetricItem = { label: string; value: number; delta: string };
type ClinicalAlertItem = {
  description: string;
  href: string;
  id: string;
  severity: "high" | "low" | "medium";
  title: string;
};
type ClinicalSpotlightItem = {
  gestationalAgeLabel: string | null;
  latestNoteTitle: string | null;
  nextAppointmentAt: string | null;
  patientId: string;
  patientName: string;
  riskLevel: "HIGH" | "LOW" | "MODERATE";
  status: "ACTIVE" | "CLOSED" | "DELIVERED";
};

export type DashboardMetrics = {
  finance: FinanceItem[];
  pipeline: PipelineItem[];
};

export type DashboardAgentStatuses = {
  healthScore: HealthScoreItem[];
};

export type DashboardRecentTasks = {
  attribution: AttributionItem[];
  contracts: ContractItem[];
};

export type DashboardIntegrationActivity = {
  connectors: ConnectorStatusItem[];
  items: IntegrationActivityItem[];
};

export type DashboardBillingSummary = {
  finance: FinanceItem[];
};

export type DashboardClinicalSummary = {
  alerts: ClinicalAlertItem[];
  metrics: ClinicalMetricItem[];
  spotlight: ClinicalSpotlightItem[];
};

export type DashboardOnboarding = {
  enabled: boolean;
  items: Array<{
    complete: boolean;
    ctaHref: string;
    ctaLabel: string;
    description: string;
    id: string;
    title: string;
  }>;
  nextHref: string;
  progress: number;
};

export function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function readNumber(value: Record<string, unknown> | null, key: string): number | null {
  if (!value) {
    return null;
  }

  const candidate = value[key];
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return candidate;
  }

  if (typeof candidate === "string" && candidate.trim().length > 0) {
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function readString(value: Record<string, unknown> | null, key: string): string | null {
  if (!value) {
    return null;
  }

  const candidate = value[key];
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : null;
}

export function clampScore(value: number): number {
  return Math.max(1, Math.min(100, Math.round(value)));
}

export function riskFromScore(score: number): string {
  if (score >= 80) {
    return "baixo";
  }

  if (score >= 60) {
    return "médio";
  }

  return "alto";
}

export function formatCurrencyFromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format((cents ?? 0) / 100);
}

export function formatDelta(current: number, previous: number, unit: string): string {
  const delta = current - previous;
  if (delta === 0) {
    return "estável vs período anterior";
  }

  const signal = delta > 0 ? "+" : "";
  return `${signal}${delta} ${unit} vs período anterior`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export async function loadOrganizationContext(organizationId: string, tenantId: string) {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previousMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    organization,
    activityWindow,
    customers,
    customerTotalCount,
    newCustomersCurrent,
    newCustomersPrevious,
    workflowCurrent,
    workflowPrevious,
    agentCurrent,
    agentPrevious,
    paidInvoicesCurrent,
    paidInvoicesPrevious,
    pastDueInvoices,
    defaultOwnerMembership,
    snapshot
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: {
        id: organizationId,
        tenantId
      }
    }),
    prisma.tenantActivityWindow.findUnique({
      where: {
        tenantId_windowDays: {
          tenantId,
          windowDays: 30
        }
      }
    }),
    prisma.customer.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      take: 10,
      where: {
        organizationId,
        tenantId
      }
    }),
    prisma.customer.count({
      where: {
        organizationId,
        tenantId
      }
    }),
    prisma.customer.count({
      where: {
        createdAt: {
          gte: monthAgo
        },
        organizationId,
        tenantId
      }
    }),
    prisma.customer.count({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lt: monthAgo
        },
        organizationId,
        tenantId
      }
    }),
    prisma.workflowExecution.count({
      where: {
        organizationId,
        startedAt: {
          gte: monthAgo
        },
        tenantId
      }
    }),
    prisma.workflowExecution.count({
      where: {
        organizationId,
        startedAt: {
          gte: previousMonthStart,
          lt: monthAgo
        },
        tenantId
      }
    }),
    prisma.agentExecution.count({
      where: {
        organizationId,
        startedAt: {
          gte: monthAgo
        },
        tenantId
      }
    }),
    prisma.agentExecution.count({
      where: {
        organizationId,
        startedAt: {
          gte: previousMonthStart,
          lt: monthAgo
        },
        tenantId
      }
    }),
    prisma.invoice.aggregate({
      _count: {
        _all: true
      },
      _sum: {
        amountPaidCents: true
      },
      where: {
        createdAt: {
          gte: monthAgo
        },
        organizationId,
        status: "paid",
        tenantId
      }
    }),
    prisma.invoice.aggregate({
      _count: {
        _all: true
      },
      _sum: {
        amountPaidCents: true
      },
      where: {
        createdAt: {
          gte: previousMonthStart,
          lt: monthAgo
        },
        organizationId,
        status: "paid",
        tenantId
      }
    }),
    prisma.invoice.count({
      where: {
        organizationId,
        status: "past_due",
        tenantId
      }
    }),
    prisma.membership.findFirst({
      include: {
        user: true
      },
      orderBy: {
        createdAt: "asc"
      },
      where: {
        organizationId,
        role: {
          in: ["OWNER", "ADMIN"]
        },
        tenantId
      }
    }),
    getBillingSnapshot(organizationId, 3)
  ]);

  if (!organization) {
    throw new Error("DASHBOARD_ORGANIZATION_NOT_FOUND");
  }

  const plan = await prisma.subscription.findFirst({
    include: {
      plan: true
    },
    orderBy: {
      updatedAt: "desc"
    },
    where: {
      organizationId,
      tenantId
    }
  });

  return {
    activityWindow,
    customers,
    customerTotalCount,
    defaultOwnerName: defaultOwnerMembership?.user.name ?? "Equipe BirthHub",
    newCustomersCurrent,
    newCustomersPrevious,
    organization,
    paidInvoicesCurrent,
    paidInvoicesPrevious,
    pastDueInvoices,
    planMonthlyPriceCents: plan?.plan.monthlyPriceCents ?? 0,
    snapshot,
    workflowCurrent,
    workflowPrevious,
    agentCurrent,
    agentPrevious
  };
}

export type OrganizationContext = Awaited<ReturnType<typeof loadOrganizationContext>>;

export function buildFinanceRows(input: {
  creditBalanceCents: number;
  paidCurrentCents: number;
  paidCurrentCount: number;
  paidPreviousCents: number;
  pastDueInvoices: number;
  planMonthlyPriceCents: number;
  planName: string;
  planStatus: string | null;
}): FinanceItem[] {
  return [
    {
      delta: `${input.planName}${input.planStatus ? ` · ${input.planStatus}` : ""}`,
      label: "MRR",
      value: formatCurrencyFromCents(input.planMonthlyPriceCents)
    },
    {
      delta: formatDelta(input.paidCurrentCents, input.paidPreviousCents, "em receita"),
      label: "Receita 30d",
      value: formatCurrencyFromCents(input.paidCurrentCents)
    },
    {
      delta: `${input.paidCurrentCount} faturas pagas · ${input.pastDueInvoices} em atraso`,
      label: "Créditos",
      value: formatCurrencyFromCents(input.creditBalanceCents)
    }
  ];
}
