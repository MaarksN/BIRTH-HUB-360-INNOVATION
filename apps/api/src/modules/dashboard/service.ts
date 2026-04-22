import { Prisma, prisma } from "@birthub/database";
import { getConnectorProviderDefinition, isConnectorProviderSlug } from "@birthub/integrations";

import {
  asObject,
  buildFinanceRows,
  clampScore,
  type DashboardAgentStatuses,
  type DashboardBillingSummary,
  type DashboardOnboarding,
  type DashboardIntegrationActivity,
  type DashboardMetrics,
  type DashboardRecentTasks,
  formatCurrencyFromCents,
  formatDelta,
  formatPercent,
  loadOrganizationContext,
  readNumber,
  readString,
  riskFromScore
} from "./service.shared.js";
import { ProblemDetailsError } from "../../lib/problem-details.js";
export { getDashboardClinicalSummary } from "./service.clinical.js";

async function updateOrganizationOnboardingFlag(input: {
  enabled: boolean;
  organizationId: string;
  tenantId: string;
}) {
  const organization = await prisma.organization.findFirst({
    select: {
      settings: true
    },
    where: {
      id: input.organizationId,
      tenantId: input.tenantId
    }
  });

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for dashboard onboarding settings.",
      status: 404,
      title: "Not Found"
    });
  }

  const settings = asObject(organization.settings) ?? {};

  return prisma.organization.update({
    data: {
      settings: {
        ...settings,
        onboarding: input.enabled
      }
    },
    where: {
      id: input.organizationId,
      tenantId: input.tenantId
    }
  });
}

export async function getDashboardMetrics(
  organizationId: string,
  tenantId: string
): Promise<DashboardMetrics> {
  const context = await loadOrganizationContext(organizationId, tenantId);

  return {
    finance: buildFinanceRows({
      creditBalanceCents: context.snapshot.creditBalanceCents,
      paidCurrentCents: context.paidInvoicesCurrent._sum.amountPaidCents ?? 0,
      paidCurrentCount: context.paidInvoicesCurrent._count._all ?? 0,
      paidPreviousCents: context.paidInvoicesPrevious._sum.amountPaidCents ?? 0,
      pastDueInvoices: context.pastDueInvoices,
      planMonthlyPriceCents: context.planMonthlyPriceCents,
      planName: context.snapshot.plan.name,
      planStatus: context.snapshot.status
    }),
    pipeline: [
      {
        stage: "Clientes ativos",
        trend: formatDelta(context.newCustomersCurrent, context.newCustomersPrevious, "clientes"),
        value: context.customerTotalCount
      },
      {
        stage: "Workflows 30d",
        trend: formatDelta(context.workflowCurrent, context.workflowPrevious, "execuções"),
        value: context.workflowCurrent
      },
      {
        stage: "Agentes 30d",
        trend: formatDelta(context.agentCurrent, context.agentPrevious, "execuções"),
        value: context.agentCurrent
      }
    ]
  };
}

export async function getDashboardAgentStatuses(
  organizationId: string,
  tenantId: string
): Promise<DashboardAgentStatuses> {
  const context = await loadOrganizationContext(organizationId, tenantId);
  const baseScore = clampScore(
    context.organization.healthScore -
      Math.min(context.activityWindow?.runFailures ?? 0, 25) -
      Math.min((context.activityWindow?.billingErrors ?? 0) * 2, 15)
  );

  const items = (context.customers.length > 0
    ? context.customers
    : [
        {
          metadata: null,
          name: context.organization.name
        }
      ]
  ).map((customer, index) => {
    const metadata = asObject(customer.metadata);
    const score = clampScore(
      readNumber(metadata, "healthScore") ??
        baseScore - index * 2 +
          Math.min(context.activityWindow?.activeUsers ?? 0, 10)
    );
    const nps = clampScore(readNumber(metadata, "nps") ?? score - 8);

    return {
      client: customer.name,
      nps,
      risk: riskFromScore(score),
      score
    };
  });

  return {
    healthScore: items
  };
}

export async function getDashboardRecentTasks(
  organizationId: string,
  tenantId: string
): Promise<DashboardRecentTasks> {
  const context = await loadOrganizationContext(organizationId, tenantId);
  const paidCurrentCents = context.paidInvoicesCurrent._sum.amountPaidCents ?? 0;
  const averageCustomerValueCents =
    context.customers.length > 0
      ? Math.round((context.planMonthlyPriceCents || paidCurrentCents || 0) / context.customers.length)
      : context.planMonthlyPriceCents || paidCurrentCents || 0;

  const contracts = context.customers.map((customer) => {
    const metadata = asObject(customer.metadata);

    return {
      customer: customer.name,
      mrr: formatCurrencyFromCents(
        readNumber(metadata, "mrrCents") ?? averageCustomerValueCents
      ),
      owner: readString(metadata, "ownerName") ?? context.defaultOwnerName,
      status: customer.status
    };
  });

  const groupedAttribution = new Map<string, number>();
  for (const customer of context.customers) {
    const metadata = asObject(customer.metadata);
    const source = readString(metadata, "source") ?? "direct";
    groupedAttribution.set(source, (groupedAttribution.get(source) ?? 0) + 1);
  }

  const attribution = Array.from(groupedAttribution.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([source, leads]) => ({
      cac: leads > 0 ? formatCurrencyFromCents(Math.round(paidCurrentCents / leads)) : formatCurrencyFromCents(0),
      conversion: context.customerTotalCount > 0 ? formatPercent(leads / context.customerTotalCount) : "0%",
      leads,
      source
    }));

  return {
    attribution,
    contracts
  };
}

export async function getDashboardBillingSummary(
  organizationId: string,
  tenantId: string
): Promise<DashboardBillingSummary> {
  const context = await loadOrganizationContext(organizationId, tenantId);

  return {
    finance: buildFinanceRows({
      creditBalanceCents: context.snapshot.creditBalanceCents,
      paidCurrentCents: context.paidInvoicesCurrent._sum.amountPaidCents ?? 0,
      paidCurrentCount: context.paidInvoicesCurrent._count._all ?? 0,
      paidPreviousCents: context.paidInvoicesPrevious._sum.amountPaidCents ?? 0,
      pastDueInvoices: context.pastDueInvoices,
      planMonthlyPriceCents: context.planMonthlyPriceCents,
      planName: context.snapshot.plan.name,
      planStatus: context.snapshot.status
    })
  };
}

export async function getDashboardIntegrationActivity(
  organizationId: string,
  tenantId: string
): Promise<DashboardIntegrationActivity> {
  const [items, connectorAccounts] = await Promise.all([
    prisma.crmSyncEvent.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        createdAt: true,
        direction: true,
        eventType: true,
        id: true,
        provider: true,
        responseStatus: true
      },
      take: 10,
      where: {
        organizationId,
        tenantId
      }
    }),
    prisma.connectorAccount.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        id: true,
        lastSyncAt: true,
        metadata: true,
        provider: true,
        status: true
      },
      where: {
        organizationId,
        tenantId
      }
    })
  ]);

  return {
    connectors: connectorAccounts.map((account) => {
      const metadata = asObject(account.metadata);
      const connectorHealth = asObject(metadata?.connectorHealth as Prisma.JsonValue | undefined);
      const lastExecution = asObject(metadata?.lastExecution as Prisma.JsonValue | undefined);
      const providerDefinition = isConnectorProviderSlug(account.provider)
        ? getConnectorProviderDefinition(account.provider)
        : null;
      const implementationStage = providerDefinition?.implementationStage ?? "planned";
      const runtimeImplemented = implementationStage === "implemented";

      return {
        accountId: account.id,
        checkedAt: runtimeImplemented ? readString(connectorHealth, "checkedAt") : null,
        healthStatus: runtimeImplemented ? readString(connectorHealth, "status") : null,
        implementationStage,
        lastError:
          runtimeImplemented
            ? readString(asObject(connectorHealth?.error as Prisma.JsonValue | undefined), "message") ??
              readString(asObject(lastExecution?.error as Prisma.JsonValue | undefined), "message")
            : null,
        lastExecutionAt: runtimeImplemented
          ? readString(lastExecution, "ranAt") ?? account.lastSyncAt?.toISOString() ?? null
          : null,
        lastExecutionStatus: runtimeImplemented ? readString(lastExecution, "status") : null,
        provider: account.provider,
        runtimeImplemented,
        status: account.status
      };
    }),
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString()
    }))
  };
}

export async function getDashboardOnboarding(input: {
  organizationId: string;
  tenantId: string;
  userId: string;
}): Promise<DashboardOnboarding> {
  const context = await loadOrganizationContext(input.organizationId, input.tenantId);
  const [workflowCount, outputCount, notificationPreference] = await Promise.all([
    prisma.workflow.count({
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId
      }
    }),
    prisma.outputArtifact.count({
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId
      }
    }),
    prisma.userPreference.findFirst({
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        userId: input.userId
      }
    })
  ]);

  const onboardingEnabled = asObject(context.organization.settings)?.onboarding !== false;

  const items = [
    {
      complete: true,
      ctaHref: "/dashboard",
      ctaLabel: "Abrir home",
      description: "Checar indicadores, billing e riscos operacionais.",
      id: "dashboard-home",
      title: "Explorar a home do dashboard"
    },
    {
      complete: workflowCount > 0,
      ctaHref: "/workflows",
      ctaLabel: "Criar workflow",
      description: "Publicar o primeiro fluxo operacional com trigger e CTA.",
      id: "workflow-first",
      title: "Criar ou revisar workflows"
    },
    {
      complete: notificationPreference?.inAppNotifications ?? true,
      ctaHref: "/notifications",
      ctaLabel: "Configurar feed",
      description: "Ativar o feed in-app e validar o sino de notificacoes.",
      id: "notifications-feed",
      title: "Configurar notificacoes"
    },
    {
      complete: outputCount > 0,
      ctaHref: "/reports",
      ctaLabel: "Abrir reports",
      description: "Visualizar artefatos exportaveis e validar integridade.",
      id: "reports-review",
      title: "Abrir reports e exports"
    }
  ];

  return {
    enabled: onboardingEnabled,
    items,
    nextHref: items.find((item) => !item.complete)?.ctaHref ?? "/dashboard",
    progress: items.length === 0 ? 100 : Math.round((items.filter((item) => item.complete).length / items.length) * 100)
  };
}

export async function setDashboardOnboardingEnabled(input: {
  enabled: boolean;
  organizationId: string;
  tenantId: string;
}) {
  return updateOrganizationOnboardingFlag(input);
}
