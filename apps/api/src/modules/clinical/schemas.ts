import { z } from "zod";

const optionalTrimmedString = z.string().trim().min(1).optional();
const optionalStringArray = z.array(z.string().trim().min(1)).optional().default([]);
const optionalDateString = z.string().trim().min(4).optional();
const optionalNumber = z.coerce.number().optional();
const optionalInteger = z.coerce.number().int().optional();
const optionalEnumString = z.string().trim().min(1).optional();
const optionalNullableEnumString = z.string().trim().min(1).nullable().optional();
const PATIENT_LIST_PAGE_LIMIT = 100;
const CLINICAL_NOTE_LIST_PAGE_LIMIT = 50;

export const patientListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PATIENT_LIST_PAGE_LIMIT).optional(),
  riskLevel: optionalEnumString,
  search: z.string().trim().optional(),
  status: optionalEnumString
});

export const pregnancyRecordSchema = z.object({
  abortions: optionalInteger,
  complications: optionalStringArray,
  estimatedDeliveryDate: optionalDateString,
  fetalCount: z.coerce.number().int().min(1).max(5).optional(),
  gravidity: z.coerce.number().int().min(0).optional(),
  lastMenstrualPeriod: optionalDateString,
  notes: optionalTrimmedString,
  outcome: optionalNullableEnumString,
  outcomeDate: optionalDateString,
  parity: z.coerce.number().int().min(0).optional(),
  previousCesareans: z.coerce.number().int().min(0).optional(),
  riskLevel: optionalEnumString,
  status: optionalEnumString
});

export const createPatientSchema = z.object({
  allergies: optionalStringArray,
  birthDate: optionalDateString,
  bloodType: optionalTrimmedString,
  chronicConditions: optionalStringArray,
  documentId: optionalTrimmedString,
  email: z.string().email().optional(),
  fullName: z.string().trim().min(2),
  medicalRecordNumber: optionalTrimmedString,
  notes: optionalTrimmedString,
  phone: optionalTrimmedString,
  preferredName: optionalTrimmedString,
  pregnancyRecord: pregnancyRecordSchema.optional(),
  status: optionalEnumString
});

export const updatePatientSchema = createPatientSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one patient field is required."
  }
);

export const neonatalRecordSchema = z.object({
  apgar1: z.coerce.number().int().min(0).max(10).optional(),
  apgar5: z.coerce.number().int().min(0).max(10).optional(),
  birthLengthCm: optionalNumber,
  birthWeightGrams: optionalInteger,
  bornAt: z.string().trim().min(4),
  headCircumferenceCm: optionalNumber,
  newbornName: optionalTrimmedString,
  notes: optionalTrimmedString,
  outcome: optionalEnumString,
  pregnancyRecordId: optionalTrimmedString,
  sex: optionalNullableEnumString
});

export const appointmentQuerySchema = z.object({
  date: z.string().trim().optional(),
  patientId: z.string().trim().optional(),
  status: optionalEnumString,
  view: z.enum(["day", "week", "month"]).default("week")
});

export const createAppointmentSchema = z.object({
  bloodPressureDiastolic: optionalInteger,
  bloodPressureSystolic: optionalInteger,
  chiefComplaint: optionalTrimmedString,
  durationMinutes: z.coerce.number().int().positive().max(480).optional(),
  fetalHeartRateBpm: optionalInteger,
  fetalWeightGrams: optionalInteger,
  fundalHeightCm: optionalNumber,
  location: optionalTrimmedString,
  patientId: z.string().trim().min(1),
  pregnancyRecordId: optionalTrimmedString,
  providerName: optionalTrimmedString,
  scheduledAt: z.string().trim().min(4),
  status: optionalEnumString,
  summary: optionalTrimmedString,
  temperatureC: optionalNumber,
  type: optionalEnumString,
  weightKg: optionalNumber
});

const { patientId: _appointmentPatientId, scheduledAt: _appointmentScheduledAt, ...appointmentUpdateShape } =
  createAppointmentSchema.shape;

export const updateAppointmentSchema = z
  .object({
    ...appointmentUpdateShape,
    scheduledAt: z.string().trim().min(4).optional()
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one appointment field is required."
  });

export const clinicalNoteQuerySchema = z
  .object({
    appointmentId: z.string().trim().optional(),
    limit: z.coerce.number().int().min(1).max(CLINICAL_NOTE_LIST_PAGE_LIMIT).optional(),
    patientId: z.string().trim().optional()
  })
  .refine((value) => Boolean(value.appointmentId || value.patientId), {
    message: "patientId or appointmentId is required."
  });

const clinicalNoteObjectSchema = z.object({
  appointmentId: optionalTrimmedString,
  assessment: optionalTrimmedString,
  content: z.record(z.string(), z.unknown()).nullable().optional(),
  kind: optionalEnumString,
  objective: optionalTrimmedString,
  patientId: z.string().trim().min(1),
  plan: optionalTrimmedString,
  pregnancyRecordId: optionalTrimmedString,
  subjective: optionalTrimmedString,
  title: optionalTrimmedString
});

export const clinicalNoteSchema = clinicalNoteObjectSchema
  .refine(
    (value) =>
      Boolean(
        value.title ||
          value.subjective ||
          value.objective ||
          value.assessment ||
          value.plan ||
          value.content
      ),
    {
      message: "At least one clinical note section is required."
    }
  );

const { patientId: _clinicalNotePatientId, ...clinicalNoteUpdateShape } =
  clinicalNoteObjectSchema.shape;

export const clinicalNoteUpdateSchema = z
  .object(clinicalNoteUpdateShape)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one clinical note field is required."
  });
