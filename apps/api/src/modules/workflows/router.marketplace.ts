import { Router } from "express";
import { Role } from "@birthub/database";
import { RequireRole, requireAuthenticatedSession } from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { requireTenantId } from "./router.js";
import { getWorkflowById, createWorkflow } from "./service.js";
import type { ApiConfig } from "@birthub/config";
import { validateBody } from "../../middleware/validate-body.js";
import { workflowCreateSchema } from "./schemas.js";

export function registerWorkflowMarketplaceRoutes(router: Router, config: ApiConfig): void {
  // Export workflow to JSON template
  router.get(
    "/api/v1/workflows/:id/export",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const workflowId = String(request.params.id ?? "");
      const workflow = await getWorkflowById(workflowId, tenantId);

      if (!workflow) {
        throw new ProblemDetailsError({
          detail: "Workflow not found.",
          status: 404,
          title: "Not Found"
        });
      }

      // Prepare template output, stripping sensitive data
      const template = {
        name: `${workflow.name} (Export)`,
        description: workflow.description ?? "",
        triggerType: workflow.triggerType,
        maxDepth: workflow.maxDepth,
        canvas: workflow.definition,
      };

      response.status(200).json({
        template,
        requestId: request.context.requestId
      });
    })
  );

  // Import workflow from template
  router.post(
    "/api/v1/workflows/import",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    validateBody(workflowCreateSchema),
    asyncHandler(async (request, response) => {
      const tenantId = requireTenantId(request);
      const payload = workflowCreateSchema.parse(request.body);
      const workflow = await createWorkflow(config, tenantId, payload);

      response.status(201).json({
        workflow: {
          id: workflow.id,
          name: workflow.name,
          status: workflow.status
        },
        requestId: request.context.requestId
      });
    })
  );

  // Public/Private Templates Marketplace endpoint
  router.get(
    "/api/v1/workflows/templates",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      // Stubbing templates since there's no DB model for templates yet
      const templates = [
        {
          id: "tpl_1",
          name: "Onboarding Automatico",
          description: "Fluxo padrao de boas-vindas com delay de 1 dia.",
          isPublic: true,
          triggerType: "EVENT",
          category: "Engagement",
        },
        {
          id: "tpl_2",
          name: "Sincronizacao CRM Diaria",
          description: "Rotina cron que sincroniza HubSpot a cada dia.",
          isPublic: true,
          triggerType: "CRON",
          category: "Operations",
        }
      ];

      response.status(200).json({
        items: templates,
        requestId: request.context.requestId
      });
    })
  );
}
