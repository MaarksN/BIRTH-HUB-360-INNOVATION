import { randomUUID } from "node:crypto";

import {
  Prisma,
  prisma,
  withTenantDatabaseContext
} from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import {
  CLINICAL_NOTE_KIND,
  CLINICAL_NOTE_LIST_PAGE_LIMIT,
  assertFound,
  normalizeOptionalString,
  resolvePageLimit,
  toPrismaJsonInput,
  type ClinicalContext,
  type ClinicalNoteKind,
  type ClinicalNoteRecord
} from "./service-support.js";
import { serializeClinicalNote } from "./service-support.view.js";
import {
  asClinicalTransaction,
  buildClinicalNoteSelect,
  ensureClinicalRuntimeAvailable
} from "./service-runtime.js";
import {
  findActivePregnancy,
  getClinicalNoteRecord,
  listClinicalNoteHistoryRecords
} from "./service-runtime.records.js";

type ClinicalNotePayload = {
  appointmentId?: string | null;
  assessment?: string | null;
  content?: Prisma.JsonValue | null;
  kind?: ClinicalNoteKind;
  objective?: string | null;
  patientId: string;
  plan?: string | null;
  pregnancyRecordId?: string | null;
  subjective?: string | null;
  title?: string | null;
};

type ClinicalNoteUpdatePayload = {
  appointmentId?: string | null;
  assessment?: string | null;
  content?: Prisma.JsonValue | null;
  kind?: ClinicalNoteKind;
  objective?: string | null;
  plan?: string | null;
  pregnancyRecordId?: string | null;
  subjective?: string | null;
  title?: string | null;
};

type CurrentClinicalNoteRecord = {
  appointmentId: string | null;
  assessment: string | null;
  content: Prisma.JsonValue | null;
  id: string;
  kind: ClinicalNoteKind;
  objective: string | null;
  patientId: string;
  plan: string | null;
  pregnancyRecordId: string | null;
  subjective: string | null;
  title: string | null;
  version: number;
};

export function createClinicalNoteMethods() {
  const listClinicalNotes = async (
    context: ClinicalContext,
    filters: {
      appointmentId?: string;
      limit?: number;
      patientId?: string;
    }
  ) => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      const notePageLimit = resolvePageLimit(
        filters.limit,
        CLINICAL_NOTE_LIST_PAGE_LIMIT
      );
      const items = await clinicalTx.clinicalNote.findMany<ClinicalNoteRecord>({
        orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
        select: buildClinicalNoteSelect(),
        take: notePageLimit,
        where: {
          deletedAt: null,
          isLatest: true,
          organizationId: context.organizationId,
          tenantId: context.tenantId,
          ...(filters.appointmentId ? { appointmentId: filters.appointmentId } : {}),
          ...(filters.patientId ? { patientId: filters.patientId } : {})
        }
      });

      return {
        items: items.map((item) => serializeClinicalNote(item)),
        pageSize: notePageLimit
      };
    }, prisma);
  };

  const getClinicalNoteHistory = async (
    context: ClinicalContext,
    noteGroupId: string
  ) => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(async (tx) => {
      const items = await listClinicalNoteHistoryRecords(tx, context, noteGroupId);

      if (items.length === 0) {
        throw new ProblemDetailsError({
          detail: "Clinical note history was not found.",
          status: 404,
          title: "Not Found"
        });
      }

      return {
        items: items.map((item) => serializeClinicalNote(item))
      };
    }, prisma);
  };

  const createClinicalNote = async (
    context: ClinicalContext,
    payload: ClinicalNotePayload
  ) => {
    ensureClinicalRuntimeAvailable();

    const noteGroupId = randomUUID();

    return withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      assertFound(
        await clinicalTx.patient.findFirst<{ id: string }>({
          select: {
            id: true
          },
          where: {
            deletedAt: null,
            id: payload.patientId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Patient was not found for note creation."
      );

      const appointment = payload.appointmentId
        ? await clinicalTx.appointment.findFirst<{
            id: string;
            pregnancyRecordId: string | null;
          }>({
            select: {
              id: true,
              pregnancyRecordId: true
            },
            where: {
              deletedAt: null,
              id: payload.appointmentId,
              organizationId: context.organizationId,
              patientId: payload.patientId,
              tenantId: context.tenantId
            }
          })
        : null;

      const activePregnancy =
        normalizeOptionalString(payload.pregnancyRecordId) ||
        appointment?.pregnancyRecordId
          ? null
          : await findActivePregnancy(tx, context, payload.patientId);
      const content = toPrismaJsonInput(payload.content);

      const createdNote = await clinicalTx.clinicalNote.create<{ id: string }>({
        data: {
          appointmentId: normalizeOptionalString(payload.appointmentId),
          assessment: normalizeOptionalString(payload.assessment),
          authoredByUserId: context.userId ?? null,
          ...(content !== undefined ? { content } : {}),
          isLatest: true,
          kind: payload.kind ?? CLINICAL_NOTE_KIND.SOAP,
          noteGroupId,
          objective: normalizeOptionalString(payload.objective),
          organizationId: context.organizationId,
          patientId: payload.patientId,
          plan: normalizeOptionalString(payload.plan),
          pregnancyRecordId:
            normalizeOptionalString(payload.pregnancyRecordId) ??
            appointment?.pregnancyRecordId ??
            activePregnancy?.id ??
            null,
          subjective: normalizeOptionalString(payload.subjective),
          tenantId: context.tenantId,
          title: normalizeOptionalString(payload.title),
          version: 1
        },
        select: {
          id: true
        }
      });
      const note = await getClinicalNoteRecord(tx, context, createdNote.id);

      return {
        note: serializeClinicalNote(note)
      };
    }, prisma);
  };

  const updateClinicalNote = async (
    context: ClinicalContext,
    noteGroupId: string,
    payload: ClinicalNoteUpdatePayload
  ) => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      const current = assertFound(
        await clinicalTx.clinicalNote.findFirst<CurrentClinicalNoteRecord>({
          orderBy: {
            version: "desc"
          },
          select: {
            appointmentId: true,
            assessment: true,
            content: true,
            id: true,
            kind: true,
            objective: true,
            patientId: true,
            plan: true,
            pregnancyRecordId: true,
            subjective: true,
            title: true,
            version: true
          },
          where: {
            deletedAt: null,
            isLatest: true,
            noteGroupId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Clinical note was not found for update."
      );

      const now = new Date();
      await clinicalTx.clinicalNote.updateMany({
        data: {
          isLatest: false,
          supersededAt: now
        },
        where: {
          deletedAt: null,
          id: current.id,
          organizationId: context.organizationId,
          tenantId: context.tenantId
        }
      });
      const content =
        payload.content !== undefined
          ? toPrismaJsonInput(payload.content)
          : toPrismaJsonInput(current.content);

      const createdNote = await clinicalTx.clinicalNote.create<{ id: string }>({
        data: {
          appointmentId:
            payload.appointmentId !== undefined
              ? normalizeOptionalString(payload.appointmentId)
              : current.appointmentId,
          assessment:
            payload.assessment !== undefined
              ? normalizeOptionalString(payload.assessment)
              : current.assessment,
          authoredByUserId: context.userId ?? null,
          ...(content !== undefined ? { content } : {}),
          isLatest: true,
          kind: payload.kind ?? current.kind,
          noteGroupId,
          objective:
            payload.objective !== undefined
              ? normalizeOptionalString(payload.objective)
              : current.objective,
          organizationId: context.organizationId,
          patientId: current.patientId,
          plan:
            payload.plan !== undefined
              ? normalizeOptionalString(payload.plan)
              : current.plan,
          pregnancyRecordId:
            payload.pregnancyRecordId !== undefined
              ? normalizeOptionalString(payload.pregnancyRecordId)
              : current.pregnancyRecordId,
          previousVersionId: current.id,
          subjective:
            payload.subjective !== undefined
              ? normalizeOptionalString(payload.subjective)
              : current.subjective,
          tenantId: context.tenantId,
          title:
            payload.title !== undefined
              ? normalizeOptionalString(payload.title)
              : current.title,
          version: current.version + 1
        },
        select: {
          id: true
        }
      });
      const note = await getClinicalNoteRecord(tx, context, createdNote.id);

      return {
        note: serializeClinicalNote(note)
      };
    }, prisma);
  };

  const deleteClinicalNote = async (
    context: ClinicalContext,
    noteGroupId: string
  ) => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      const existing = await clinicalTx.clinicalNote.findFirst<{ id: string }>({
        select: {
          id: true
        },
        where: {
          deletedAt: null,
          noteGroupId,
          organizationId: context.organizationId,
          tenantId: context.tenantId
        }
      });

      if (!existing) {
        throw new ProblemDetailsError({
          detail: "Clinical note was not found for deletion.",
          status: 404,
          title: "Not Found"
        });
      }

      await clinicalTx.clinicalNote.updateMany({
        data: {
          deletedAt: new Date(),
          isLatest: false
        },
        where: {
          deletedAt: null,
          noteGroupId,
          organizationId: context.organizationId,
          tenantId: context.tenantId
        }
      });

      return {
        deleted: true,
        noteGroupId
      };
    }, prisma);
  };

  return {
    listClinicalNotes,
    getClinicalNoteHistory,
    createClinicalNote,
    updateClinicalNote,
    deleteClinicalNote
  };
}
