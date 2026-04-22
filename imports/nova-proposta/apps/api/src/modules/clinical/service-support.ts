import { Prisma } from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
export type ClinicalContext = {
  organizationId: string;
  tenantId: string;
  userId?: string | null;
};

export type DateWindowView = "day" | "month" | "week";

export const CLINICAL_APPOINTMENT_PAGE_LIMIT = 250;
export const CLINICAL_NOTE_HISTORY_PAGE_LIMIT = 100;
export const CLINICAL_RECORD_PAGE_LIMIT = 100;
export const CLINICAL_NOTE_LIST_PAGE_LIMIT = 50;
export const CLINICAL_PATIENT_LIST_PAGE_LIMIT = 100;
export const CLINICAL_RUNTIME_MODELS = [
  "appointment",
  "clinicalNote",
  "neonatalRecord",
  "patient",
  "pregnancyRecord"
] as const;

export const PREGNANCY_RISK_LEVEL = {
  HIGH: "HIGH"
} as const;

export const PREGNANCY_STATUS = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
  DELIVERED: "DELIVERED"
} as const;

export const PATIENT_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED"
} as const;

export const APPOINTMENT_STATUS = {
  CANCELLED: "CANCELLED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
  SCHEDULED: "SCHEDULED"
} as const;

export const APPOINTMENT_TYPE = {
  PRENATAL: "PRENATAL"
} as const;

export const NEONATAL_OUTCOME = {
  ALIVE: "ALIVE",
  STILLBIRTH: "STILLBIRTH"
} as const;

export const PREGNANCY_OUTCOME = {
  LIVE_BIRTH: "LIVE_BIRTH",
  STILLBIRTH: "STILLBIRTH"
} as const;

export const CLINICAL_NOTE_KIND = {
  SOAP: "SOAP"
} as const;

export type PregnancyRiskLevel = "HIGH" | "LOW" | "MODERATE";
export type PregnancyStatus = keyof typeof PREGNANCY_STATUS;
export type PatientStatus = "ACTIVE" | "ARCHIVED" | "INACTIVE";
export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;
export type AppointmentType = keyof typeof APPOINTMENT_TYPE;
export type PregnancyOutcome = "LIVE_BIRTH" | "STILLBIRTH";
export type NeonatalOutcome = "ALIVE" | "ICU" | "STILLBIRTH" | "TRANSFERRED";
export type ClinicalNoteKind = keyof typeof CLINICAL_NOTE_KIND;
export type NeonatalSex = "FEMALE" | "MALE" | "UNDETERMINED";

export type PatientRecord = {
  allergies: string[];
  birthDate: Date | null;
  bloodType: string | null;
  chronicConditions: string[];
  createdAt: Date;
  documentId: string | null;
  email: string | null;
  fullName: string;
  id: string;
  medicalRecordNumber: string | null;
  notes: string | null;
  phone: string | null;
  preferredName: string | null;
  status: PatientStatus;
  updatedAt: Date;
};

export type PregnancyRecordModel = {
  abortions: number;
  complications: string[];
  createdAt: Date;
  estimatedDeliveryDate: Date | null;
  fetalCount: number;
  gravidity: number;
  id: string;
  lastMenstrualPeriod: Date | null;
  notes: string | null;
  outcome: PregnancyOutcome | null;
  outcomeDate: Date | null;
  parity: number;
  previousCesareans: number;
  riskLevel: PregnancyRiskLevel;
  status: PregnancyStatus;
  updatedAt: Date;
};

export type AppointmentRecord = {
  bloodPressureDiastolic: number | null;
  bloodPressureSystolic: number | null;
  chiefComplaint: string | null;
  createdAt: Date;
  durationMinutes: number;
  fetalHeartRateBpm: number | null;
  fetalWeightGrams: number | null;
  fundalHeightCm: number | null;
  id: string;
  location: string | null;
  patient?: {
    fullName: string;
    id: string;
    preferredName: string | null;
  } | null;
  patientId: string;
  pregnancyRecordId: string | null;
  providerName: string | null;
  scheduledAt: Date;
  status: AppointmentStatus;
  summary: string | null;
  temperatureC: number | null;
  type: AppointmentType;
  updatedAt: Date;
  weightKg: number | null;
};

export type ClinicalNoteRecord = {
  appointmentId: string | null;
  assessment: string | null;
  author?: {
    id: string;
    name: string;
  } | null;
  content: Prisma.JsonValue | null;
  createdAt: Date;
  id: string;
  isLatest: boolean;
  kind: ClinicalNoteKind;
  noteGroupId: string;
  objective: string | null;
  patientId: string;
  plan: string | null;
  pregnancyRecordId: string | null;
  subjective: string | null;
  title: string | null;
  updatedAt: Date;
  version: number;
};

export type ClinicalAlert = {
  description: string;
  id: string;
  severity: "high" | "low" | "medium";
  title: string;
};

export type NeonatalRecordModel = {
  apgar1: number | null;
  apgar5: number | null;
  birthLengthCm: number | null;
  birthWeightGrams: number | null;
  bornAt: Date;
  createdAt: Date;
  headCircumferenceCm: number | null;
  id: string;
  newbornName: string | null;
  notes: string | null;
  outcome: NeonatalOutcome;
  sex: NeonatalSex | null;
  updatedAt: Date;
};

export type GrowthCurvePoint = {
  appointmentId: string;
  deviationPercent: number | null;
  fetalWeightGrams: number;
  gestationalWeek: number;
  recordedAt: string;
  referenceGrams: number | null;
};

export type ReferenceWeightPoint = {
  grams: number;
  week: number;
};

export const FETAL_WEIGHT_REFERENCE_POINTS: ReferenceWeightPoint[] = [
  { grams: 320, week: 20 },
  { grams: 630, week: 24 },
  { grams: 1005, week: 28 },
  { grams: 1700, week: 32 },
  { grams: 2620, week: 36 },
  { grams: 3400, week: 40 }
];

export function assertFound<T>(value: T | null, detail: string): T {
  if (!value) {
    throw new ProblemDetailsError({
      detail,
      status: 404,
      title: "Not Found"
    });
  }

  return value;
}

export function resolvePageLimit(requested: number | undefined, max: number): number {
  if (!requested || Number.isNaN(requested) || requested <= 0) {
    return max;
  }

  return Math.min(requested, max);
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function normalizeOptionalString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeStringArray(value: string[] | undefined): string[] {
  return (value ?? [])
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ProblemDetailsError({
      detail: `Invalid date value '${value}'.`,
      status: 400,
      title: "Bad Request"
    });
  }

  return parsed;
}

export function parseRequiredDate(value: string | null | undefined, fieldName: string): Date {
  const parsed = parseOptionalDate(value);
  if (!parsed) {
    throw new ProblemDetailsError({
      detail: `${fieldName} is required.`,
      status: 400,
      title: "Bad Request"
    });
  }

  return parsed;
}

export function toPrismaJsonInput(
  value: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function calculateEstimatedDeliveryDate(input: {
  estimatedDeliveryDate?: Date | null;
  lastMenstrualPeriod?: Date | null;
}): Date | null {
  if (input.estimatedDeliveryDate) {
    return input.estimatedDeliveryDate;
  }

  if (!input.lastMenstrualPeriod) {
    return null;
  }

  return addDays(input.lastMenstrualPeriod, 280);
}

export function calculateGestationalAgeDays(input: {
  estimatedDeliveryDate?: Date | null;
  lastMenstrualPeriod?: Date | null;
  referenceDate?: Date;
}): number | null {
  const referenceDate = input.referenceDate ?? new Date();

  if (input.lastMenstrualPeriod) {
    return Math.floor(
      (startOfDay(referenceDate).getTime() - startOfDay(input.lastMenstrualPeriod).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  const estimatedDeliveryDate = calculateEstimatedDeliveryDate(input);
  if (!estimatedDeliveryDate) {
    return null;
  }

  return 280 - Math.floor(
    (startOfDay(estimatedDeliveryDate).getTime() - startOfDay(referenceDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export function formatGestationalAge(days: number | null): string | null {
  if (days === null || days < 0) {
    return null;
  }

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  return `${weeks} sem ${remainingDays} d`;
}

export function calculateDaysUntil(referenceDate: Date, targetDate: Date | null): number | null {
  if (!targetDate) {
    return null;
  }

  return Math.ceil(
    (startOfDay(targetDate).getTime() - startOfDay(referenceDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export function interpolateReferenceWeight(gestationalWeek: number): number | null {
  if (!Number.isFinite(gestationalWeek)) {
    return null;
  }

  const sorted = FETAL_WEIGHT_REFERENCE_POINTS;
  if (gestationalWeek <= sorted[0]!.week) {
    return sorted[0]!.grams;
  }
  if (gestationalWeek >= sorted[sorted.length - 1]!.week) {
    return sorted[sorted.length - 1]!.grams;
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index]!;
    const next = sorted[index + 1]!;
    if (gestationalWeek >= current.week && gestationalWeek <= next.week) {
      const ratio = (gestationalWeek - current.week) / (next.week - current.week);
      return Math.round(current.grams + (next.grams - current.grams) * ratio);
    }
  }

  return null;
}
