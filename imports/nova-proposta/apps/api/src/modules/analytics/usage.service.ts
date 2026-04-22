import { prisma } from "@birthub/database";

import type { DateRange, TenantAnalyticsScope } from "./analytics.types.js";
import { resolveDateRange } from "./analytics.utils.js";

const ACTIVE_TENANT_WINDOW_LIMIT = 2_000;

export async function getUsageMetrics(input: Partial<DateRange> & TenantAnalyticsScope) {
  const { from, to } = resolveDateRange(input);
  const usage = await prisma.usageRecord.groupBy({
    _sum: {
      quantity: true
    },
    by: ["metric", "tenantId"],
    where: {
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      occurredAt: {
        gte: from,
        lte: to
      }
    }
  });

  return usage.map((row) => ({
    metric: row.metric,
    quantity: row._sum.quantity ?? 0,
    tenantId: row.tenantId
  }));
}

export async function getActiveTenantsMetrics(input: TenantAnalyticsScope) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [workflowDau, workflowMau, usageMau] = await Promise.all([
    prisma.workflowExecution.findMany({
      distinct: ["tenantId"],
      select: {
        tenantId: true
      },
      take: ACTIVE_TENANT_WINDOW_LIMIT,
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        startedAt: {
          gte: dayAgo
        }
      }
    }),
    prisma.workflowExecution.findMany({
      distinct: ["tenantId"],
      select: {
        tenantId: true
      },
      take: ACTIVE_TENANT_WINDOW_LIMIT,
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        startedAt: {
          gte: monthAgo
        }
      }
    }),
    prisma.usageRecord.findMany({
      distinct: ["tenantId"],
      select: {
        tenantId: true
      },
      take: ACTIVE_TENANT_WINDOW_LIMIT,
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        metric: {
          startsWith: "agent."
        },
        occurredAt: {
          gte: monthAgo
        }
      }
    })
  ]);
  const monthlyActive = new Set<string>([
    ...workflowMau.map((row) => row.tenantId),
    ...usageMau.map((row) => row.tenantId)
  ]);

  return {
    dau: workflowDau.length,
    mau: monthlyActive.size
  };
}
