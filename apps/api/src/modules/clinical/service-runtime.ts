import {
  Prisma,
  prisma
} from "@birthub/database";

import {
  assertPrismaModelsAvailable,
  readPrismaModel
} from "../../lib/prisma-runtime.js";
import {
  CLINICAL_RUNTIME_MODELS,
  PREGNANCY_STATUS,
  addDays,
  calculateEstimatedDeliveryDate,
  normalizeOptionalString,
  normalizeStringArray,
  parseOptionalDate,
  startOfDay,
  type AppointmentRecord,
  type ClinicalNoteRecord,
  type DateWindowView,
  type PatientRecord,
  type PatientStatus,
  type PregnancyRecordModel,
  type PregnancyRiskLevel,
  type PregnancyOutcome,
  type PregnancyStatus
} from "./service-support.js";

export type ClinicalModelQuery = {
  cursor?: {
    id: string;
  };
  data?: object;
  include?: object;
  orderBy?: object | object[];
  select?: object;
  skip?: number;
  take?: number;
  where?: object;
};

export type ClinicalModelDelegate = {
  create<TResult extends object>(args: ClinicalModelQuery & { data: object }): Promise<TResult>;
  findFirst<TResult extends object>(
    args: Omit<ClinicalModelQuery, "cursor" | "data" | "skip" | "take">
  ): Promise<TResult | null>;
  findMany<TResult extends object>(
    args: Omit<ClinicalModelQuery, "data">
  ): Promise<TResult[]>;
  updateMany(
    args: ClinicalModelQuery & { data: object; where: object }
  ): Promise<Prisma.BatchPayload>;
};

export type ClinicalTransactionClient = Prisma.TransactionClient & {
  appointment: ClinicalModelDelegate;
  clinicalNote: ClinicalModelDelegate;
  neonatalRecord: ClinicalModelDelegate;
  patient: ClinicalModelDelegate;
  pregnancyRecord: ClinicalModelDelegate;
};

export type PatientListRecord = {
  appointments: AppointmentRecord[];
  clinicalNotes: ClinicalNoteRecord[];
  pregnancyRecords: PregnancyRecordModel[];
} & PatientRecord;

export function asClinicalTransaction(
  tx: Prisma.TransactionClient
): ClinicalTransactionClient {
  readPrismaModel<ClinicalModelDelegate>(tx, "appointment", "the clinical module");
  readPrismaModel<ClinicalModelDelegate>(tx, "clinicalNote", "the clinical module");
  readPrismaModel<ClinicalModelDelegate>(tx, "neonatalRecord", "the clinical module");
  readPrismaModel<ClinicalModelDelegate>(tx, "patient", "the clinical module");
  readPrismaModel<ClinicalModelDelegate>(tx, "pregnancyRecord", "the clinical module");

  return tx as unknown as ClinicalTransactionClient;
}

export function ensureClinicalRuntimeAvailable(): void {
  assertPrismaModelsAvailable(prisma, CLINICAL_RUNTIME_MODELS, "the clinical module");
}

export function buildPatientWhere(input: {
  organizationId: string;
  riskLevel?: PregnancyRiskLevel | undefined;
  search?: string | undefined;
  status?: PatientStatus | undefined;
  tenantId: string;
}) {
  const normalizedSearch = input.search?.trim();

  return {
    deletedAt: null,
    organizationId: input.organizationId,
    tenantId: input.tenantId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.riskLevel
      ? {
          pregnancyRecords: {
            some: {
              deletedAt: null,
              riskLevel: input.riskLevel,
              status: PREGNANCY_STATUS.ACTIVE
            }
          }
        }
      : {}),
    ...(normalizedSearch
      ? {
          OR: [
            {
              fullName: {
                contains: normalizedSearch,
                mode: "insensitive"
              }
            },
            {
              preferredName: {
                contains: normalizedSearch,
                mode: "insensitive"
              }
            },
            {
              medicalRecordNumber: {
                contains: normalizedSearch,
                mode: "insensitive"
              }
            },
            {
              email: {
                contains: normalizedSearch,
                mode: "insensitive"
              }
            }
          ]
        }
      : {})
  };
}

export function buildPatientSelect() {
  return {
    allergies: true,
    birthDate: true,
    bloodType: true,
    chronicConditions: true,
    createdAt: true,
    documentId: true,
    email: true,
    fullName: true,
    id: true,
    medicalRecordNumber: true,
    notes: true,
    phone: true,
    preferredName: true,
    status: true,
    updatedAt: true
  } as const;
}

export function buildPregnancySelect() {
  return {
    abortions: true,
    complications: true,
    createdAt: true,
    estimatedDeliveryDate: true,
    fetalCount: true,
    gravidity: true,
    id: true,
    lastMenstrualPeriod: true,
    notes: true,
    outcome: true,
    outcomeDate: true,
    parity: true,
    previousCesareans: true,
    riskLevel: true,
    status: true,
    updatedAt: true
  } as const;
}

export function buildAppointmentSelect(includePatient = true) {
  return {
    bloodPressureDiastolic: true,
    bloodPressureSystolic: true,
    chiefComplaint: true,
    createdAt: true,
    durationMinutes: true,
    fetalHeartRateBpm: true,
    fetalWeightGrams: true,
    fundalHeightCm: true,
    id: true,
    location: true,
    patient: includePatient
      ? {
          select: {
            fullName: true,
            id: true,
            preferredName: true
          }
        }
      : false,
    patientId: true,
    pregnancyRecordId: true,
    providerName: true,
    scheduledAt: true,
    status: true,
    summary: true,
    temperatureC: true,
    type: true,
    updatedAt: true,
    weightKg: true
  } as const;
}

export function buildClinicalNoteSelect() {
  return {
    appointmentId: true,
    assessment: true,
    author: {
      select: {
        id: true,
        name: true
      }
    },
    content: true,
    createdAt: true,
    id: true,
    isLatest: true,
    kind: true,
    noteGroupId: true,
    objective: true,
    patientId: true,
    plan: true,
    pregnancyRecordId: true,
    subjective: true,
    title: true,
    updatedAt: true,
    version: true
  } as const;
}

export function buildNeonatalSelect() {
  return {
    apgar1: true,
    apgar5: true,
    birthLengthCm: true,
    birthWeightGrams: true,
    bornAt: true,
    createdAt: true,
    headCircumferenceCm: true,
    id: true,
    newbornName: true,
    notes: true,
    outcome: true,
    sex: true,
    updatedAt: true
  } as const;
}

export function buildPregnancyMutation(data: {
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
}) {
  const lastMenstrualPeriod = parseOptionalDate(data.lastMenstrualPeriod);
  const estimatedDeliveryDate = calculateEstimatedDeliveryDate({
    estimatedDeliveryDate: parseOptionalDate(data.estimatedDeliveryDate),
    lastMenstrualPeriod
  });

  return {
    ...(data.abortions !== undefined ? { abortions: data.abortions } : {}),
    ...(data.fetalCount !== undefined ? { fetalCount: data.fetalCount } : {}),
    ...(data.gravidity !== undefined ? { gravidity: data.gravidity } : {}),
    ...(data.outcome !== undefined ? { outcome: data.outcome } : {}),
    ...(data.parity !== undefined ? { parity: data.parity } : {}),
    ...(data.previousCesareans !== undefined ? { previousCesareans: data.previousCesareans } : {}),
    ...(data.riskLevel !== undefined ? { riskLevel: data.riskLevel } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    complications: normalizeStringArray(data.complications),
    estimatedDeliveryDate,
    lastMenstrualPeriod,
    notes: normalizeOptionalString(data.notes),
    outcomeDate: parseOptionalDate(data.outcomeDate)
  };
}

export function buildDateWindow(
  anchorDate: string | undefined,
  view: DateWindowView
) {
  const reference = parseOptionalDate(anchorDate ?? null) ?? new Date();
  const anchor = startOfDay(reference);
  const from = new Date(anchor);
  const to =
    view === "day"
      ? addDays(from, 1)
      : view === "week"
        ? (() => {
            const day = from.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const weekStart = addDays(from, diffToMonday);
            weekStart.setHours(0, 0, 0, 0);
            from.setTime(weekStart.getTime());
            return addDays(from, 7);
          })()
        : (() => {
            from.setDate(1);
            from.setHours(0, 0, 0, 0);
            const monthEnd = new Date(from);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            return monthEnd;
          })();

  return {
    anchorDate: from.toISOString().slice(0, 10),
    from,
    label:
      view === "day"
        ? "Agenda do dia"
        : view === "week"
          ? "Agenda da semana"
          : "Agenda do mes",
    to,
    view
  };
}
