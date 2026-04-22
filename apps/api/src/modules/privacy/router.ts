import type { ApiConfig } from "@birthub/config";
import {
  Role
} from "@birthub/database";
import { Router } from "express";

import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { validateBody } from "../../middleware/validate-body.js";
import {
  listPrivacyConsents,
  savePrivacyConsentDecisions
} from "./consent.service.js";
import {
  listRetentionPolicies,
  runRetentionSweep,
  updateRetentionPolicies
} from "./retention.service.js";
import {
  consentUpdateSchema,
  privacyDeleteRequestSchema,
  privacyDeleteResponseSchema,
  retentionRunSchema,
  retentionUpdateSchema
} from "./schemas.js";
import {
  deleteAccountAndPersonalData,
  exportTenantData,
  findOrganizationByReference,
  recordTenantDataExport
} from "./service.js";

function assertPrivacyAdvancedEnabled(config: ApiConfig): void {
  if (config.privacyAdvancedEnabled) {
    return;
  }

  throw new ProblemDetailsError({
    detail:
      "Advanced privacy controls are disabled for this deployment because the active schema does not sustain consent and retention domain models.",
    status: 404,
    title: "Not Found"
  });
}

export function createPrivacyRouter(config: ApiConfig): Router {
  const router = Router();

  router.get(
    "/consents",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      assertPrivacyAdvancedEnabled(config);
      const userId = request.context.userId;
      const organizationReference = request.context.organizationId;

      if (!userId || !organizationReference) {
        throw new ProblemDetailsError({
          detail: "Authenticated user and organization context are required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const payload = await listPrivacyConsents({
        organizationReference,
        userId
      });

      response.status(200).json({
        ...payload,
        requestId: request.context.requestId
      });
    })
  );

  router.put(
    "/consents",
    requireAuthenticatedSession,
    validateBody(consentUpdateSchema),
    asyncHandler(async (request, response) => {
      assertPrivacyAdvancedEnabled(config);
      const userId = request.context.userId;
      const organizationReference = request.context.organizationId;

      if (!userId || !organizationReference) {
        throw new ProblemDetailsError({
          detail: "Authenticated user and organization context are required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const body = consentUpdateSchema.parse(request.body);
      await savePrivacyConsentDecisions({
        decisions: body.decisions,
        organizationReference,
        userId
      });

      const payload = await listPrivacyConsents({
        organizationReference,
        userId
      });

      response.status(200).json({
        ...payload,
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/retention",
    requireAuthenticatedSession,
    RequireRole(Role.OWNER),
    asyncHandler(async (request, response) => {
      assertPrivacyAdvancedEnabled(config);
      const organizationReference = request.context.organizationId;

      if (!organizationReference) {
        throw new ProblemDetailsError({
          detail: "Active organization context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      response.status(200).json({
        ...(await listRetentionPolicies({ organizationReference })),
        requestId: request.context.requestId
      });
    })
  );

  router.put(
    "/retention",
    requireAuthenticatedSession,
    RequireRole(Role.OWNER),
    validateBody(retentionUpdateSchema),
    asyncHandler(async (request, response) => {
      assertPrivacyAdvancedEnabled(config);
      const organizationReference = request.context.organizationId;

      if (!organizationReference) {
        throw new ProblemDetailsError({
          detail: "Active organization context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const body = retentionUpdateSchema.parse(request.body);
      const policies = body.policies.map(
        (policy) =>
          ({
            dataCategory: policy.dataCategory,
            ...(policy.action !== undefined ? { action: policy.action } : {}),
            ...(policy.enabled !== undefined ? { enabled: policy.enabled } : {}),
            ...(policy.retentionDays !== undefined
              ? { retentionDays: policy.retentionDays }
              : {})
          }) as Parameters<typeof updateRetentionPolicies>[0]["policies"][number]
      );
      response.status(200).json({
        ...(await updateRetentionPolicies({
          organizationReference,
          policies
        })),
        requestId: request.context.requestId
      });
    })
  );

  router.post(
    "/retention/run",
    requireAuthenticatedSession,
    RequireRole(Role.OWNER),
    validateBody(retentionRunSchema),
    asyncHandler(async (request, response) => {
      assertPrivacyAdvancedEnabled(config);
      const organizationReference = request.context.organizationId;

      if (!organizationReference) {
        throw new ProblemDetailsError({
          detail: "Active organization context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const body = retentionRunSchema.parse(request.body);
      const organization = await findOrganizationByReference(organizationReference);

      if (!organization) {
        throw new ProblemDetailsError({
          detail: "Organization not found for retention execution.",
          status: 404,
          title: "Not Found"
        });
      }

      const result = await runRetentionSweep({
        config,
        mode: body.mode,
        organizationReference: organization.id
      });

      response.status(200).json({
        items: result,
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/export",
    requireAuthenticatedSession,
    RequireRole(Role.OWNER),
    asyncHandler(async (request, response) => {
      const payload = await exportTenantData({
        organizationReference: request.context.organizationId!,
        requestedByUserId: request.context.userId!
      });

      await recordTenantDataExport({
        organizationReference: request.context.organizationId!,
        userId: request.context.userId!
      });

      response.setHeader(
        "Content-Disposition",
        `attachment; filename="birthub360-${request.context.tenantId}-export.json"`
      );
      response.type("application/json").send(JSON.stringify(payload, null, 2));
    })
  );

  router.post(
    "/delete-account",
    requireAuthenticatedSession,
    validateBody(privacyDeleteRequestSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as { confirmationText: string };
      const result = await deleteAccountAndPersonalData({
        config,
        confirmationText: body.confirmationText,
        organizationReference: request.context.organizationId!,
        userId: request.context.userId!
      });

      response.status(200).json(
        privacyDeleteResponseSchema.parse({
          ...result,
          requestId: request.context.requestId
        })
      );
    })
  );

  return router;
}
