import { Prisma } from "@birthub/database";

import {
  CLINICAL_APPOINTMENT_PAGE_LIMIT,
  CLINICAL_NOTE_HISTORY_PAGE_LIMIT,
  CLINICAL_RECORD_PAGE_LIMIT,
  PREGNANCY_STATUS,
  assertFound,
  type AppointmentRecord,
  type AppointmentStatus,
  type ClinicalContext,
  type ClinicalNoteRecord,
  type NeonatalRecordModel,
  type PatientRecord,
  type PregnancyRecordModel
} from "./service-support.js";
import {
  buildGrowthCurve,
  deriveClinicalAlerts,
  findNextAppointment,
  serializeAppointment,
  serializeClinicalNote,
  serializeNeonatalRecord,
  serializePatient,
  serializePregnancyRecord
} from "./service-support.view.js";
import {
  asClinicalTransaction,
  buildAppointmentSelect,
  buildClinicalNoteSelect,
  buildNeonatalSelect,
  buildPatientSelect,
  buildPregnancySelect,
  type ClinicalModelQuery
} from "./service-runtime.js";

export async function listPregnancyRecords(
  tx: Prisma.TransactionClient,
  context: ClinicalContext,
  patientId: string
): Promise<PregnancyRecordModel[]> {
  const clinicalTx = asClinicalTransaction(tx);
  const records: PregnancyRecordModel[] = [];
  let cursorId: string | undefined;

  while (true) {
    const findArgs: Omit<ClinicalModelQuery, "data"> = {
      orderBy: [
        { status: "asc" },
        { estimatedDeliveryDate: "desc" },
        { createdAt: "desc" },
        { id: "desc" }
      ],
      select: buildPregnancySelect(),
      take: CLINICAL_RECORD_PAGE_LIMIT,
      where: {
        deletedAt: null,
        organizationId: context.organizationId,
        patientId,
        tenantId: context.tenantId
      }
    };

    if (cursorId) {
      findArgs.cursor = { id: cursorId };
      findArgs.skip = 1;
    }

    const page = await clinicalTx.pregnancyRecord.findMany<PregnancyRecordModel>(findArgs);
    records.push(...page);

    if (page.length < CLINICAL_RECORD_PAGE_LIMIT) {
      return records;
    }

    cursorId = page.at(-1)?.id;
  }
}

export async function listNeonatalRecords(
  tx: Prisma.TransactionClient,
  context: ClinicalContext,
  patientId: string
): Promise<NeonatalRecordModel[]> {
  const clinicalTx = asClinicalTransaction(tx);
  const records: NeonatalRecordModel[] = [];
  let cursorId: string | undefined;

  while (true) {
    const findArgs: Omit<ClinicalModelQuery, "data"> = {
      orderBy: [{ bornAt: "desc" }, { id: "desc" }],
      select: buildNeonatalSelect(),
      take: CLINICAL_RECORD_PAGE_LIMIT,
      where: {
        deletedAt: null,
        organizationId: context.organizationId,
        patientId,
        tenantId: context.tenantId
      }
    };

    if (cursorId) {
      findArgs.cursor = { id: cursorId };
      findArgs.skip = 1;
    }

    const page = await clinicalTx.neonatalRecord.findMany<NeonatalRecordModel>(findArgs);
    records.push(...page);

    if (page.length < CLINICAL_RECORD_PAGE_LIMIT) {
      return records;
    }

    cursorId = page.at(-1)?.id;
  }
}

export async function listAppointmentsInWindow(
  tx: Prisma.TransactionClient,
  context: ClinicalContext,
  filters: {
    patientId?: string;
    status?: AppointmentStatus;
  },
  window: {
    from: Date;
    to: Date;
  }
): Promise<AppointmentRecord[]> {
  const clinicalTx = asClinicalTransaction(tx);
  const items: AppointmentRecord[] = [];
  let cursorId: string | undefined;

  while (true) {
    const findArgs: Omit<ClinicalModelQuery, "data"> = {
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: buildAppointmentSelect(true),
      take: CLINICAL_APPOINTMENT_PAGE_LIMIT,
      where: {
        deletedAt: null,
        organizationId: context.organizationId,
        scheduledAt: {
          gte: window.from,
          lt: window.to
        },
        tenantId: context.tenantId,
        ...(filters.patientId ? { patientId: filters.patientId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        patient: {
          deletedAt: null
        }
      }
    };

    if (cursorId) {
      findArgs.cursor = { id: cursorId };
      findArgs.skip = 1;
    }

    const page = await clinicalTx.appointment.findMany<AppointmentRecord>(findArgs);
    items.push(...page);

    if (page.length < CLINICAL_APPOINTMENT_PAGE_LIMIT) {
      return items;
    }

    cursorId = page.at(-1)?.id;
  }
}

export async function listClinicalNoteHistoryRecords(
  tx: Prisma.TransactionClient,
  context: ClinicalContext,
  noteGroupId: string
): Promise<ClinicalNoteRecord[]> {
  const clinicalTx = asClinicalTransaction(tx);
  const items: ClinicalNoteRecord[] = [];
  let cursorId: string | undefined;

  while (true) {
    const findArgs: Omit<ClinicalModelQuery, "data"> = {
      orderBy: [{ version: "desc" }, { id: "desc" }],
      select: buildClinicalNoteSelect(),
      take: CLINICAL_NOTE_HISTORY_PAGE_LIMIT,
      where: {
        deletedAt: null,
        noteGroupId,
        organizationId: context.organizationId,
        tenantId: context.tenantId
      }
    };

    if (cursorId) {
      findArgs.cursor = { id: cursorId };
      findArgs.skip = 1;
    }

    const page = await clinicalTx.clinicalNote.findMany<ClinicalNoteRecord>(findArgs);
    items.push(...page);

    if (page.length < CLINICAL_NOTE_HISTORY_PAGE_LIMIT) {
      return items;
    }

    cursorId = page.at(-1)?.id;
  }
}

export async function findActivePregnancy(
  tx: Prisma.TransactionClient,
  context: ClinicalContext,
  patientId: string
): Promise<PregnancyRecordModel | null> {
  return asClinicalTransaction(tx).pregnancyRecord.findFirst<PregnancyRecordModel>({
    orderBy: [{ estimatedDeliveryDate: "asc" }, { createdAt: "desc" }],
    select: buildPregnancySelect(),
    where: {
      deletedAt: null,
      organizationId: context.organizationId,
      patientId,
      status: PREGNANCY_STATUS.ACTIVE,
      tenantId: context.tenantId
    }
  });
}

export async function getClinicalNoteRecord(
  tx: Prisma.TransactionClient,
  context: ClinicalContext,
  noteId: string
): Promise<ClinicalNoteRecord> {
  return assertFound(
    await asClinicalTransaction(tx).clinicalNote.findFirst<ClinicalNoteRecord>({
      select: buildClinicalNoteSelect(),
      where: {
        deletedAt: null,
        id: noteId,
        organizationId: context.organizationId,
        tenantId: context.tenantId
      }
    }),
    "Clinical note could not be loaded for the active tenant."
  );
}

export async function getPatientDetailInternal(
  tx: Prisma.TransactionClient,
  context: ClinicalContext,
  patientId: string
) {
  const clinicalTx = asClinicalTransaction(tx);
  const patient = assertFound(
    await clinicalTx.patient.findFirst<PatientRecord>({
      select: buildPatientSelect(),
      where: {
        deletedAt: null,
        id: patientId,
        organizationId: context.organizationId,
        tenantId: context.tenantId
      }
    }),
    "Patient was not found for the active tenant."
  );

  const pregnancyRecords = await listPregnancyRecords(tx, context, patientId);
  const appointments = await clinicalTx.appointment.findMany<AppointmentRecord>({
    orderBy: { scheduledAt: "desc" },
    select: buildAppointmentSelect(false),
    take: 24,
    where: {
      deletedAt: null,
      organizationId: context.organizationId,
      patientId,
      tenantId: context.tenantId
    }
  });
  const clinicalNotes = await clinicalTx.clinicalNote.findMany<ClinicalNoteRecord>({
    orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
    select: buildClinicalNoteSelect(),
    take: 20,
    where: {
      deletedAt: null,
      isLatest: true,
      organizationId: context.organizationId,
      patientId,
      tenantId: context.tenantId
    }
  });
  const neonatalRecords = await listNeonatalRecords(tx, context, patientId);

  const activePregnancy =
    pregnancyRecords.find((item) => item.status === PREGNANCY_STATUS.ACTIVE) ?? null;
  const latestAppointment = appointments[0] ?? null;
  const nextAppointment = findNextAppointment(appointments);
  const latestClinicalNote = clinicalNotes[0] ?? null;

  return {
    activePregnancy: activePregnancy ? serializePregnancyRecord(activePregnancy) : null,
    alerts: deriveClinicalAlerts({
      activePregnancy,
      latestAppointment,
      latestClinicalNote,
      nextAppointment
    }),
    clinicalNotes: clinicalNotes.map((item) => serializeClinicalNote(item)),
    growthCurve: buildGrowthCurve({
      activePregnancy,
      appointments
    }),
    neonatalRecords: neonatalRecords.map((item) => serializeNeonatalRecord(item)),
    patient: serializePatient(patient),
    pregnancyRecords: pregnancyRecords.map((item) => serializePregnancyRecord(item)),
    recentAppointments: appointments.slice(0, 6).map((item) => serializeAppointment(item)),
    upcomingAppointments: appointments
      .filter((appointment) => appointment.scheduledAt >= new Date())
      .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime())
      .slice(0, 6)
      .map((item) => serializeAppointment(item))
  };
}

export type PatientDetailPayload = Awaited<
  ReturnType<typeof getPatientDetailInternal>
>;
