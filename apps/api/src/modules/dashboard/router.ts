import type { ApiConfig } from "@birthub/config";
import { Role } from "@birthub/database";
import { Router } from "express";
import type { Request } from "express";

import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { validateBody } from "../../middleware/validate-body.js";
import { dashboardOnboardingUpdateSchema } from "./schemas.js";
import {
  getDashboardAgentStatuses,
  getDashboardBillingSummary,
  getDashboardClinicalSummary,
  getDashboardIntegrationActivity,
  getDashboardMetrics,
  getDashboardOnboarding,
  getDashboardRecentTasks
} from "./service.js";
import { setDashboardOnboardingEnabled } from "./service.js";

function requireContext(request: Request): {
  organizationId: string;
  tenantId: string;
} {
  if (!request.context.organizationId || !request.context.tenantId) {
    throw new ProblemDetailsError({
      detail: "A valid authenticated tenant context is required.",
      status: 401,
      title: "Unauthorized"
    });
  }

  return {
    organizationId: request.context.organizationId,
    tenantId: request.context.tenantId
  };
}

export function createDashboardRouter(config: ApiConfig): Router {
  const router = Router();

  router.use("/api/v1/dashboard", requireAuthenticatedSession, RequireRole(Role.ADMIN));

  router.get(
    "/api/v1/dashboard/metrics",
    asyncHandler(async (request, response) => {
      const { organizationId, tenantId } = requireContext(request);
      response.status(200).json(await getDashboardMetrics(organizationId, tenantId));
    })
  );

  router.get(
    "/api/v1/dashboard/agent-statuses",
    asyncHandler(async (request, response) => {
      const { organizationId, tenantId } = requireContext(request);
      response.status(200).json(await getDashboardAgentStatuses(organizationId, tenantId));
    })
  );

  router.get(
    "/api/v1/dashboard/recent-tasks",
    asyncHandler(async (request, response) => {
      const { organizationId, tenantId } = requireContext(request);
      response.status(200).json(await getDashboardRecentTasks(organizationId, tenantId));
    })
  );

  router.get(
    "/api/v1/dashboard/billing-summary",
    asyncHandler(async (request, response) => {
      const { organizationId, tenantId } = requireContext(request);
      response.status(200).json(await getDashboardBillingSummary(organizationId, tenantId));
    })
  );

  router.get(
    "/api/v1/dashboard/integration-activity",
    asyncHandler(async (request, response) => {
      const { organizationId, tenantId } = requireContext(request);
      response.status(200).json(await getDashboardIntegrationActivity(organizationId, tenantId));
    })
  );

  router.get(
    "/api/v1/dashboard/clinical-summary",
    asyncHandler(async (request, response) => {
      if (!config.clinicalWorkspaceEnabled) {
        throw new ProblemDetailsError({
          detail:
            "The clinical workspace is disabled for this deployment because the active schema does not sustain the clinical domain.",
          status: 404,
          title: "Not Found"
        });
      }

      const { organizationId, tenantId } = requireContext(request);
      response.status(200).json(await getDashboardClinicalSummary(organizationId, tenantId));
    })
  );

  router.get(
    "/api/v1/dashboard/onboarding",
    asyncHandler(async (request, response) => {
      const { organizationId, tenantId } = requireContext(request);
      const userId = request.context.userId;

      if (!userId) {
        throw new ProblemDetailsError({
          detail: "A valid authenticated user context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      response.status(200).json(
        await getDashboardOnboarding({
          organizationId,
          tenantId,
          userId
        })
      );
    })
  );

  router.patch(
    "/api/v1/dashboard/onboarding",
    validateBody(dashboardOnboardingUpdateSchema),
    asyncHandler(async (request, response) => {
      const { organizationId, tenantId } = requireContext(request);
      const payload = dashboardOnboardingUpdateSchema.parse(request.body);

      await setDashboardOnboardingEnabled({
        enabled: payload.enabled,
        organizationId,
        tenantId
      });

      response.status(200).json({
        enabled: payload.enabled,
        requestId: request.context.requestId
      });
    })
  );

  return router;
}
