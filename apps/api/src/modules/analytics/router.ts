import { Role } from "@birthub/database";
import { Router } from "express";
import type { Request } from "express";

import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import type { TenantAnalyticsScope } from "./analytics.types.js";
import { dateRangeSchema } from "./schemas.js";
import { analyticsRouterService } from "./service.js";

function getTenantAnalyticsScope(request: Request): TenantAnalyticsScope {
  const { organizationId, tenantId } = request.context;

  if (!organizationId || !tenantId) {
    throw new ProblemDetailsError({
      detail: "A valid tenant session is required.",
      status: 401,
      title: "Unauthorized"
    });
  }

  return {
    organizationId,
    tenantId
  };
}

export function createAnalyticsRouter(): Router {
  const router = Router();

  router.get(
    "/usage",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const range = dateRangeSchema.parse(request.query);
      const scope = getTenantAnalyticsScope(request);
      const usage = await analyticsRouterService.getUsageMetrics({
        ...scope,
        ...(range.from ? { from: new Date(range.from) } : {}),
        ...(range.to ? { to: new Date(range.to) } : {})
      });

      response.status(200).json({
        items: usage,
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/executive",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const scope = getTenantAnalyticsScope(request);

      response.status(200).json({
        metrics: await analyticsRouterService.getExecutiveMetrics(scope),
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/cohort",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const scope = getTenantAnalyticsScope(request);

      response.status(200).json({
        items: await analyticsRouterService.getCohortMetrics(scope),
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/billing/export",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const range = dateRangeSchema.parse(request.query);
      const scope = getTenantAnalyticsScope(request);
      const csv = await analyticsRouterService.exportBillingCsv({
        ...scope,
        ...(range.from ? { from: new Date(range.from) } : {}),
        ...(range.to ? { to: new Date(range.to) } : {})
      });

      response.setHeader("Content-Disposition", 'attachment; filename="billing-export.csv"');
      response.type("text/csv").send(csv);
    })
  );

  router.get(
    "/active-tenants",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const scope = getTenantAnalyticsScope(request);

      response.status(200).json({
        metrics: await analyticsRouterService.getActiveTenantsMetrics(scope),
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/cs-risk",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const scope = getTenantAnalyticsScope(request);

      response.status(200).json({
        items: await analyticsRouterService.getCsRiskAccounts(scope),
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/quality-report",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      response.status(200).json({
        items: await analyticsRouterService.getQualityReport(),
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/agent-performance",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      response.status(200).json({
        metrics: await analyticsRouterService.getGlobalAgentPerformance(),
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/master-dashboard",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      response.status(200).json({
        metrics: await analyticsRouterService.getMasterAdminDashboard(),
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/operations",
    requireAuthenticatedSession,
    RequireRole(Role.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      response.status(200).json({
        metrics: await analyticsRouterService.getOperationsDashboard(),
        requestId: request.context.requestId
      });
    })
  );

  return router;
}
