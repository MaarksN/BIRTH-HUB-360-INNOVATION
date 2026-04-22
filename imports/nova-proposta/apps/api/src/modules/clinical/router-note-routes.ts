import { Role } from "@birthub/database";
import type { Router } from "express";

import { Auditable } from "../../audit/auditable.js";
import { RequireRole, requireAuthenticatedSession } from "../../common/guards/index.js";
import { asyncHandler } from "../../lib/problem-details.js";
import { requireStringValue } from "../../lib/request-values.js";
import { validateBody } from "../../middleware/validate-body.js";
import {
  clinicalNoteQuerySchema,
  clinicalNoteSchema,
  clinicalNoteUpdateSchema
} from "./schemas.js";
import { clinicalService } from "./service.js";

type ClinicalContextRequest = {
  context: {
    organizationId: string | null;
    requestId?: string;
    tenantId: string | null;
    userId: string | null;
  };
};

type ResolveClinicalContext = (request: ClinicalContextRequest) => {
  organizationId: string;
  tenantId: string;
  userId?: string | null;
};

export function registerClinicalNoteRoutes(
  router: Router,
  requireClinicalContext: ResolveClinicalContext
): void {
  router.get(
    "/clinical-notes",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const filters = clinicalNoteQuerySchema.parse(
        request.query
      ) as Parameters<typeof clinicalService.listClinicalNotes>[1];
      const payload = await clinicalService.listClinicalNotes(requireClinicalContext(request), filters);

      response.status(200).json({
        ...payload,
        requestId: request.context.requestId
      });
    })
  );

  router.get(
    "/clinical-notes/:noteGroupId/history",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const noteGroupId = requireStringValue(
        request.params.noteGroupId,
        "A valid clinical note group id is required."
      );
      const payload = await clinicalService.getClinicalNoteHistory(
        requireClinicalContext(request),
        noteGroupId
      );

      response.status(200).json({
        ...payload,
        requestId: request.context.requestId
      });
    })
  );

  router.post(
    "/clinical-notes",
    requireAuthenticatedSession,
    RequireRole(Role.MEMBER),
    validateBody(clinicalNoteSchema),
    asyncHandler(
      Auditable({
        action: "clinical_note.created",
        entityType: "clinical_note",
        requireActor: true,
        resolveEntityId: (_request, _response, result) =>
          typeof result === "object" && result && "note" in result
            ? String((result as { note?: { noteGroupId?: string } }).note?.noteGroupId ?? "")
            : undefined
      })(async (request, response) => {
        const payload = await clinicalService.createClinicalNote(
          requireClinicalContext(request),
          clinicalNoteSchema.parse(request.body) as Parameters<typeof clinicalService.createClinicalNote>[1]
        );

        response.status(201).json({
          ...payload,
          requestId: request.context.requestId
        });
        return payload;
      })
    )
  );

  router.patch(
    "/clinical-notes/:noteGroupId",
    requireAuthenticatedSession,
    RequireRole(Role.MEMBER),
    validateBody(clinicalNoteUpdateSchema),
    asyncHandler(
      Auditable({
        action: "clinical_note.versioned",
        entityType: "clinical_note",
        requireActor: true,
        resolveEntityId: (request) => request.params.noteGroupId
      })(async (request, response) => {
        const noteGroupId = requireStringValue(
          request.params.noteGroupId,
          "A valid clinical note group id is required."
        );
        const payload = await clinicalService.updateClinicalNote(
          requireClinicalContext(request),
          noteGroupId,
          clinicalNoteUpdateSchema.parse(request.body) as Parameters<
            typeof clinicalService.updateClinicalNote
          >[2]
        );

        response.status(200).json({
          ...payload,
          requestId: request.context.requestId
        });
        return payload;
      })
    )
  );

  router.delete(
    "/clinical-notes/:noteGroupId",
    requireAuthenticatedSession,
    RequireRole(Role.MEMBER),
    asyncHandler(
      Auditable({
        action: "clinical_note.deleted",
        entityType: "clinical_note",
        requireActor: true,
        resolveEntityId: (request) => request.params.noteGroupId
      })(async (request, response) => {
        const noteGroupId = requireStringValue(
          request.params.noteGroupId,
          "A valid clinical note group id is required."
        );
        const payload = await clinicalService.deleteClinicalNote(
          requireClinicalContext(request),
          noteGroupId
        );

        response.status(200).json({
          ...payload,
          requestId: request.context.requestId
        });
        return payload;
      })
    )
  );
}
