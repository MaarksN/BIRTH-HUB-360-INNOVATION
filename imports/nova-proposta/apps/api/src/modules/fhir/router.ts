import type { ApiConfig } from "@birthub/config";
import { prisma, Role } from "@birthub/database";
import { Router } from "express";

import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import {
  asyncHandler,
  ProblemDetailsError
} from "../../lib/problem-details.js";
import { fhirService } from "./service.js";

const FHIR_JSON_CONTENT_TYPE = "application/fhir+json; charset=utf-8";

type FhirAuditInput = {
  action: "read" | "search";
  actorId: string;
  entityId: string;
  organizationId: string;
  resourceType: "Appointment" | "CapabilityStatement" | "Patient";
  tenantId: string;
};

export interface FhirRouterDependencies {
  config?: Pick<ApiConfig, "fhirFacadeEnabled">;
  recordAudit?: (input: FhirAuditInput) => Promise<void>;
  service?: typeof fhirService;
}

function defaultRecordAudit(input: FhirAuditInput) {
  return prisma.auditLog.create({
    data: {
      action: input.action === "search" ? "fhir.resource.search" : "fhir.resource.read",
      actorId: input.actorId,
      diff: {
        after: {
          organizationId: input.organizationId,
          resourceType: input.resourceType
        },
        before: {}
      },
      entityId: input.entityId,
      entityType: "fhir_resource",
      tenantId: input.tenantId
    }
  }).then(() => undefined);
}

function requireFhirContext(request: {
  context: {
    impersonatedByUserId: string | null;
    organizationId: string | null;
    tenantId: string | null;
    userId: string | null;
  };
}) {
  if (!request.context.organizationId || !request.context.tenantId || !request.context.userId) {
    throw new ProblemDetailsError({
      detail: "Authenticated FHIR context is required.",
      status: 401,
      title: "Unauthorized"
    });
  }

  return {
    actorId: request.context.impersonatedByUserId ?? request.context.userId,
    organizationId: request.context.organizationId,
    tenantId: request.context.tenantId,
    userId: request.context.userId
  };
}

function resolveBaseUrl(request: {
  get(name: string): string | undefined;
  protocol: string;
}): string {
  const host = request.get("host") ?? "localhost";
  return `${request.protocol}://${host}/api/fhir/R4`;
}

export function createFhirRouter(
  dependencies: FhirRouterDependencies = {}
): Router {
  const router = Router();
  const fhirFacadeEnabled = dependencies.config?.fhirFacadeEnabled === true;
  const service = dependencies.service ?? fhirService;
  const recordAudit = dependencies.recordAudit ?? defaultRecordAudit;

  router.use((request, _response, next) => {
    if (fhirFacadeEnabled) {
      next();
      return;
    }

    next(
      new ProblemDetailsError({
        detail:
          "The FHIR facade router is disabled because interoperability remains outside the active product until schema support is reintroduced.",
        status: 404,
        title: "Not Found"
      })
    );
  });

  router.use("/api/fhir/R4", requireAuthenticatedSession, RequireRole(Role.MEMBER));

  router.get(
    "/api/fhir/R4/metadata",
    asyncHandler(async (request, response) => {
      const context = requireFhirContext(request);
      const payload = service.metadata(resolveBaseUrl(request));

      await recordAudit({
        action: "read",
        actorId: context.actorId,
        entityId: "CapabilityStatement",
        organizationId: context.organizationId,
        resourceType: "CapabilityStatement",
        tenantId: context.tenantId
      });

      response.setHeader("content-type", FHIR_JSON_CONTENT_TYPE);
      response.status(200).send(payload);
    })
  );

  router.get(
    "/api/fhir/R4/Patient/:id",
    asyncHandler(async (request, response) => {
      const context = requireFhirContext(request);
      const payload = await service.getPatient(context, String(request.params.id ?? ""));

      await recordAudit({
        action: "read",
        actorId: context.actorId,
        entityId: `Patient/${payload.id}`,
        organizationId: context.organizationId,
        resourceType: "Patient",
        tenantId: context.tenantId
      });

      response.setHeader("content-type", FHIR_JSON_CONTENT_TYPE);
      response.status(200).send(payload);
    })
  );

  router.get(
    "/api/fhir/R4/Patient",
    asyncHandler(async (request, response) => {
      const context = requireFhirContext(request);
      const payload = await service.searchPatients(
        context,
        {
          ...(typeof request.query.identifier === "string"
            ? { identifier: request.query.identifier }
            : {}),
          ...(typeof request.query.name === "string" ? { name: request.query.name } : {})
        },
        resolveBaseUrl(request)
      );

      await recordAudit({
        action: "search",
        actorId: context.actorId,
        entityId: "Patient/search",
        organizationId: context.organizationId,
        resourceType: "Patient",
        tenantId: context.tenantId
      });

      response.setHeader("content-type", FHIR_JSON_CONTENT_TYPE);
      response.status(200).send(payload);
    })
  );

  router.get(
    "/api/fhir/R4/Appointment/:id",
    asyncHandler(async (request, response) => {
      const context = requireFhirContext(request);
      const payload = await service.getAppointment(context, String(request.params.id ?? ""));

      await recordAudit({
        action: "read",
        actorId: context.actorId,
        entityId: `Appointment/${payload.id}`,
        organizationId: context.organizationId,
        resourceType: "Appointment",
        tenantId: context.tenantId
      });

      response.setHeader("content-type", FHIR_JSON_CONTENT_TYPE);
      response.status(200).send(payload);
    })
  );

  return router;
}

