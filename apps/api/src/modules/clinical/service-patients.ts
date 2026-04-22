import {
  prisma,
  withTenantDatabaseContext
} from "@birthub/database";

import {
  APPOINTMENT_STATUS,
  CLINICAL_PATIENT_LIST_PAGE_LIMIT,
  PATIENT_STATUS,
  PREGNANCY_STATUS,
  assertFound,
  normalizeOptionalString,
  normalizeStringArray,
  parseOptionalDate,
  resolvePageLimit,
  type ClinicalContext,
  type NeonatalOutcome,
  type NeonatalSex,
  type PatientStatus,
  type PregnancyOutcome,
  type PregnancyRiskLevel,
  type PregnancyStatus
} from "./service-support.js";
import {
  deriveClinicalAlerts,
  findNextAppointment,
  serializeAppointment,
  serializePatient,
  serializePregnancyRecord
} from "./service-support.view.js";
import { createPatientRecordMethods } from "./service-patient-records.js";
import {
  asClinicalTransaction,
  buildAppointmentSelect,
  buildClinicalNoteSelect,
  buildPatientSelect,
  buildPatientWhere,
  buildPregnancyMutation,
  buildPregnancySelect,
  ensureClinicalRuntimeAvailable,
  type PatientListRecord
} from "./service-runtime.js";
import {
  getPatientDetailInternal,
  type PatientDetailPayload
} from "./service-runtime.records.js";

export type PregnancyRecordPayload = {
  abortions?: number;
  complications?: string[];
  estimatedDeliveryDate?: string | null;
  fetalCount?: number;
  gravidity?: number;
  lastMenstrualPeriod?: string | null;
  notes?: string | null;
  outcome?: PregnancyOutcome | null;
  outcomeDate?: string | null;
  parity?: number;
  previousCesareans?: number;
  riskLevel?: PregnancyRiskLevel;
  status?: PregnancyStatus;
};

export type CreatePatientPayload = {
  allergies?: string[];
  birthDate?: string | null;
  bloodType?: string | null;
  chronicConditions?: string[];
  documentId?: string | null;
  email?: string | null;
  fullName: string;
  medicalRecordNumber?: string | null;
  notes?: string | null;
  phone?: string | null;
  preferredName?: string | null;
  pregnancyRecord?: PregnancyRecordPayload;
  status?: PatientStatus;
};

export type UpdatePatientPayload = {
  allergies?: string[];
  birthDate?: string | null;
  bloodType?: string | null;
  chronicConditions?: string[];
  documentId?: string | null;
  email?: string | null;
  fullName?: string;
  medicalRecordNumber?: string | null;
  notes?: string | null;
  phone?: string | null;
  preferredName?: string | null;
  status?: PatientStatus;
};

export type SavePregnancyRecordInput = {
  patientId: string;
  payload: PregnancyRecordPayload;
  recordId?: string;
};

export type SaveNeonatalRecordInput = {
  patientId: string;
  payload: {
    apgar1?: number;
    apgar5?: number;
    birthLengthCm?: number;
    birthWeightGrams?: number;
    bornAt: string;
    headCircumferenceCm?: number;
    newbornName?: string | null;
    notes?: string | null;
    outcome?: NeonatalOutcome;
    pregnancyRecordId?: string | null;
    sex?: NeonatalSex | null;
  };
  recordId?: string;
};

export function createPatientMethods() {
  const getPatientDetail = async (
    context: ClinicalContext,
    patientId: string
  ): Promise<PatientDetailPayload> => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(
      async (tx) => getPatientDetailInternal(tx, context, patientId),
      prisma
    );
  };

  const createPatient = async (
    context: ClinicalContext,
    payload: CreatePatientPayload
  ) => {
    ensureClinicalRuntimeAvailable();

    const patientId = await withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      const patient = await clinicalTx.patient.create<{ id: string }>({
        data: {
          allergies: normalizeStringArray(payload.allergies),
          birthDate: parseOptionalDate(payload.birthDate),
          bloodType: normalizeOptionalString(payload.bloodType),
          chronicConditions: normalizeStringArray(payload.chronicConditions),
          documentId: normalizeOptionalString(payload.documentId),
          email: normalizeOptionalString(payload.email),
          fullName: payload.fullName.trim(),
          medicalRecordNumber: normalizeOptionalString(payload.medicalRecordNumber),
          notes: normalizeOptionalString(payload.notes),
          organizationId: context.organizationId,
          phone: normalizeOptionalString(payload.phone),
          preferredName: normalizeOptionalString(payload.preferredName),
          status: payload.status ?? PATIENT_STATUS.ACTIVE,
          tenantId: context.tenantId
        },
        select: {
          id: true
        }
      });

      if (payload.pregnancyRecord) {
        await clinicalTx.pregnancyRecord.create({
          data: {
            ...buildPregnancyMutation(payload.pregnancyRecord),
            organizationId: context.organizationId,
            patientId: patient.id,
            tenantId: context.tenantId
          }
        });
      }

      return patient.id;
    }, prisma);

    return getPatientDetail(context, patientId);
  };

  const listPatients = async (
    context: ClinicalContext,
    filters: {
      limit?: number;
      riskLevel?: PregnancyRiskLevel;
      search?: string;
      status?: PatientStatus;
    }
  ) => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      const patientPageLimit = resolvePageLimit(
        filters.limit,
        CLINICAL_PATIENT_LIST_PAGE_LIMIT
      );
      const patients = await clinicalTx.patient.findMany<PatientListRecord>({
        include: {
          appointments: {
            orderBy: {
              scheduledAt: "desc"
            },
            select: buildAppointmentSelect(false),
            take: 8,
            where: {
              deletedAt: null,
              tenantId: context.tenantId
            }
          },
          clinicalNotes: {
            orderBy: {
              updatedAt: "desc"
            },
            select: buildClinicalNoteSelect(),
            take: 1,
            where: {
              deletedAt: null,
              isLatest: true,
              tenantId: context.tenantId
            }
          },
          pregnancyRecords: {
            orderBy: [{ estimatedDeliveryDate: "asc" }, { createdAt: "desc" }],
            select: buildPregnancySelect(),
            take: 3,
            where: {
              deletedAt: null,
              tenantId: context.tenantId
            }
          },
          ...buildPatientSelect()
        },
        orderBy: [{ createdAt: "desc" }, { fullName: "asc" }],
        take: patientPageLimit,
        where: buildPatientWhere({
          organizationId: context.organizationId,
          riskLevel: filters.riskLevel,
          search: filters.search,
          status: filters.status,
          tenantId: context.tenantId
        })
      });

      return {
        items: patients.map((patient) => {
          const activePregnancy =
            patient.pregnancyRecords.find(
              (record) => record.status === PREGNANCY_STATUS.ACTIVE
            ) ?? null;
          const nextAppointment = findNextAppointment(patient.appointments);
          const latestAppointment = patient.appointments[0] ?? null;
          const latestClinicalNote = patient.clinicalNotes[0] ?? null;
          const alerts = deriveClinicalAlerts({
            activePregnancy,
            latestAppointment,
            latestClinicalNote,
            nextAppointment
          });

          return {
            activePregnancy: activePregnancy
              ? serializePregnancyRecord(activePregnancy)
              : null,
            alertCount: alerts.length,
            nextAppointment: nextAppointment
              ? serializeAppointment(nextAppointment)
              : null,
            patient: serializePatient(patient)
          };
        }),
        pageSize: patientPageLimit
      };
    }, prisma);
  };

  const updatePatient = async (
    context: ClinicalContext,
    patientId: string,
    payload: UpdatePatientPayload
  ) => {
    ensureClinicalRuntimeAvailable();

    await withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      assertFound(
        await clinicalTx.patient.findFirst<{ id: string }>({
          select: {
            id: true
          },
          where: {
            deletedAt: null,
            id: patientId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Patient was not found for update."
      );

      await clinicalTx.patient.updateMany({
        data: {
          ...(payload.fullName ? { fullName: payload.fullName.trim() } : {}),
          ...(payload.status ? { status: payload.status } : {}),
          ...(payload.birthDate !== undefined
            ? { birthDate: parseOptionalDate(payload.birthDate) }
            : {}),
          ...(payload.bloodType !== undefined
            ? { bloodType: normalizeOptionalString(payload.bloodType) }
            : {}),
          ...(payload.documentId !== undefined
            ? { documentId: normalizeOptionalString(payload.documentId) }
            : {}),
          ...(payload.email !== undefined
            ? { email: normalizeOptionalString(payload.email) }
            : {}),
          ...(payload.medicalRecordNumber !== undefined
            ? {
                medicalRecordNumber: normalizeOptionalString(
                  payload.medicalRecordNumber
                )
              }
            : {}),
          ...(payload.notes !== undefined
            ? { notes: normalizeOptionalString(payload.notes) }
            : {}),
          ...(payload.phone !== undefined
            ? { phone: normalizeOptionalString(payload.phone) }
            : {}),
          ...(payload.preferredName !== undefined
            ? { preferredName: normalizeOptionalString(payload.preferredName) }
            : {}),
          ...(payload.allergies !== undefined
            ? { allergies: normalizeStringArray(payload.allergies) }
            : {}),
          ...(payload.chronicConditions !== undefined
            ? { chronicConditions: normalizeStringArray(payload.chronicConditions) }
            : {})
        },
        where: {
          deletedAt: null,
          id: patientId,
          organizationId: context.organizationId,
          tenantId: context.tenantId
        }
      });
    }, prisma);

    return getPatientDetail(context, patientId);
  };

  const deletePatient = async (context: ClinicalContext, patientId: string) => {
    ensureClinicalRuntimeAvailable();

    const deletedAt = new Date();

    return withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      assertFound(
        await clinicalTx.patient.findFirst<{ id: string }>({
          select: {
            id: true
          },
          where: {
            deletedAt: null,
            id: patientId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Patient was not found for deletion."
      );

      await Promise.all([
        clinicalTx.patient.updateMany({
          data: {
            deletedAt,
            status: PATIENT_STATUS.ARCHIVED
          },
          where: {
            deletedAt: null,
            id: patientId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        clinicalTx.pregnancyRecord.updateMany({
          data: {
            deletedAt,
            status: PREGNANCY_STATUS.CLOSED
          },
          where: {
            deletedAt: null,
            organizationId: context.organizationId,
            patientId,
            tenantId: context.tenantId
          }
        }),
        clinicalTx.appointment.updateMany({
          data: {
            deletedAt,
            status: APPOINTMENT_STATUS.CANCELLED
          },
          where: {
            deletedAt: null,
            organizationId: context.organizationId,
            patientId,
            tenantId: context.tenantId
          }
        }),
        clinicalTx.clinicalNote.updateMany({
          data: {
            deletedAt,
            isLatest: false,
            supersededAt: deletedAt
          },
          where: {
            deletedAt: null,
            organizationId: context.organizationId,
            patientId,
            tenantId: context.tenantId
          }
        }),
        clinicalTx.neonatalRecord.updateMany({
          data: {
            deletedAt
          },
          where: {
            deletedAt: null,
            organizationId: context.organizationId,
            patientId,
            tenantId: context.tenantId
          }
        })
      ]);

      return {
        deleted: true,
        patientId
      };
    }, prisma);
  };

  const { saveNeonatalRecord, savePregnancyRecord } = createPatientRecordMethods(
    getPatientDetail
  );

  return {
    createPatient,
    listPatients,
    getPatientDetail,
    updatePatient,
    deletePatient,
    savePregnancyRecord,
    saveNeonatalRecord
  };
}
