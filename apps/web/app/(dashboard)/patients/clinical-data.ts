"use client";

import { fetchWithSession } from "../../../lib/auth-client";

export type ClinicalAlert = {
  description: string;
  id: string;
  severity: "high" | "low" | "medium";
  title: string;
};

export type PatientSnapshot = {
  allergies: string[];
  birthDate: string | null;
  bloodType: string | null;
  chronicConditions: string[];
  createdAt: string;
  documentId: string | null;
  email: string | null;
  fullName: string;
  id: string;
  medicalRecordNumber: string | null;
  notes: string | null;
  phone: string | null;
  preferredName: string | null;
  status: "ACTIVE" | "ARCHIVED" | "INACTIVE";
  updatedAt: string;
};

export type PregnancyRecordSnapshot = {
  abortions: number;
  complications: string[];
  createdAt: string;
  daysUntilDueDate: number | null;
  estimatedDeliveryDate: string | null;
  fetalCount: number;
  gestationalAgeDays: number | null;
  gestationalAgeLabel: string | null;
  gravidity: number;
  id: string;
  lastMenstrualPeriod: string | null;
  notes: string | null;
  outcome: "ABORTION" | "LIVE_BIRTH" | "MISCARRIAGE" | "STILLBIRTH" | null;
  outcomeDate: string | null;
  parity: number;
  previousCesareans: number;
  riskLevel: "HIGH" | "LOW" | "MODERATE";
  status: "ACTIVE" | "CLOSED" | "DELIVERED";
  updatedAt: string;
};

export type AppointmentSnapshot = {
  bloodPressureDiastolic: number | null;
  bloodPressureSystolic: number | null;
  chiefComplaint: string | null;
  createdAt: string;
  durationMinutes: number;
  fetalHeartRateBpm: number | null;
  fetalWeightGrams: number | null;
  fundalHeightCm: number | null;
  id: string;
  location: string | null;
  patient: {
    fullName: string;
    id: string;
    preferredName: string | null;
  } | null;
  patientId: string;
  pregnancyRecordId: string | null;
  providerName: string | null;
  scheduledAt: string;
  status: "CANCELLED" | "CHECKED_IN" | "COMPLETED" | "NO_SHOW" | "SCHEDULED";
  summary: string | null;
  temperatureC: number | null;
  type: "EXAM" | "POSTPARTUM" | "PRENATAL" | "ULTRASOUND" | "VACCINATION";
  updatedAt: string;
  weightKg: number | null;
};

export type ClinicalNoteSnapshot = {
  appointmentId: string | null;
  assessment: string | null;
  author: {
    id: string;
    name: string;
  } | null;
  content: Record<string, unknown> | null;
  createdAt: string;
  id: string;
  isLatest: boolean;
  kind: "DISCHARGE" | "EVOLUTION" | "SOAP" | "TRIAGE";
  noteGroupId: string;
  objective: string | null;
  patientId: string;
  plan: string | null;
  pregnancyRecordId: string | null;
  subjective: string | null;
  title: string | null;
  updatedAt: string;
  version: number;
};

export type NeonatalRecordSnapshot = {
  apgar1: number | null;
  apgar5: number | null;
  birthLengthCm: number | null;
  birthWeightGrams: number | null;
  bornAt: string;
  createdAt: string;
  headCircumferenceCm: number | null;
  id: string;
  newbornName: string | null;
  notes: string | null;
  outcome: "ALIVE" | "ICU" | "STILLBIRTH" | "TRANSFERRED";
  sex: "FEMALE" | "MALE" | "UNDETERMINED" | null;
  updatedAt: string;
};

export type GrowthCurvePoint = {
  appointmentId: string;
  deviationPercent: number | null;
  fetalWeightGrams: number;
  gestationalWeek: number;
  recordedAt: string;
  referenceGrams: number | null;
};

export type PatientsResponse = {
  items: Array<{
    activePregnancy: PregnancyRecordSnapshot | null;
    alertCount: number;
    nextAppointment: AppointmentSnapshot | null;
    patient: PatientSnapshot;
  }>;
  requestId: string;
};

export type PatientDetailResponse = {
  activePregnancy: PregnancyRecordSnapshot | null;
  alerts: ClinicalAlert[];
  clinicalNotes: ClinicalNoteSnapshot[];
  growthCurve: GrowthCurvePoint[];
  neonatalRecords: NeonatalRecordSnapshot[];
  patient: PatientSnapshot;
  pregnancyRecords: PregnancyRecordSnapshot[];
  recentAppointments: AppointmentSnapshot[];
  requestId: string;
  upcomingAppointments: AppointmentSnapshot[];
};

export type AppointmentsResponse = {
  items: AppointmentSnapshot[];
  requestId: string;
  summary: {
    cancelled: number;
    completed: number;
    scheduled: number;
    total: number;
  };
  window: {
    anchorDate: string;
    from: string;
    label: string;
    to: string;
    view: "day" | "month" | "week";
  };
};

export type ClinicalNotesResponse = {
  items: ClinicalNoteSnapshot[];
  requestId: string;
};

export function calculateDueDateFromLmp(lastMenstrualPeriod: string | null): string | null {
  if (!lastMenstrualPeriod) {
    return null;
  }

  const source = new Date(lastMenstrualPeriod);
  if (Number.isNaN(source.getTime())) {
    return null;
  }

  const dueDate = new Date(source);
  dueDate.setDate(dueDate.getDate() + 280);
  return dueDate.toISOString();
}

export function formatGestationalAgeFromDays(days: number | null): string {
  if (days === null || days < 0) {
    return "Nao calculado";
  }

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  return `${weeks} sem ${remainingDays} d`;
}

export function buildGrowthCurvePath(
  points: GrowthCurvePoint[],
  width = 420,
  height = 180
): string {
  if (points.length === 0) {
    return "";
  }

  const maxWeight = Math.max(...points.map((point) => point.fetalWeightGrams), 1);
  const maxWeek = Math.max(...points.map((point) => point.gestationalWeek), 1);

  return points
    .map((point, index) => {
      const x = (point.gestationalWeek / maxWeek) * (width - 24) + 12;
      const y = height - (point.fetalWeightGrams / maxWeight) * (height - 24) - 12;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function buildAgendaHeading(windowLabel: string, anchorDate: string): string {
  const parsed = new Date(`${anchorDate}T12:00:00`);
  return `${windowLabel} · ${parsed.toLocaleDateString("pt-BR")}`;
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetchWithSession(input, init);

  if (!response.ok) {
    let message = `Falha ao carregar dados (${response.status}).`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      // noop
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function loadPatients(search = "", status = "", riskLevel = "") {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }
  if (status) {
    params.set("status", status);
  }
  if (riskLevel) {
    params.set("riskLevel", riskLevel);
  }

  return requestJson<PatientsResponse>(`/api/v1/patients?${params.toString()}`);
}

export async function createPatient(payload: Record<string, unknown>) {
  return requestJson<PatientDetailResponse>("/api/v1/patients", {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
}

export async function loadPatientDetail(patientId: string) {
  return requestJson<PatientDetailResponse>(`/api/v1/patients/${encodeURIComponent(patientId)}`);
}

export async function updatePatient(patientId: string, payload: Record<string, unknown>) {
  return requestJson<PatientDetailResponse>(`/api/v1/patients/${encodeURIComponent(patientId)}`, {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    },
    method: "PATCH"
  });
}

export async function savePregnancyRecord(
  patientId: string,
  payload: Record<string, unknown>,
  recordId?: string
) {
  const path = recordId
    ? `/api/v1/patients/${encodeURIComponent(patientId)}/pregnancy-records/${encodeURIComponent(recordId)}`
    : `/api/v1/patients/${encodeURIComponent(patientId)}/pregnancy-records`;
  return requestJson<PatientDetailResponse>(path, {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    },
    method: recordId ? "PATCH" : "POST"
  });
}

export async function saveNeonatalRecord(
  patientId: string,
  payload: Record<string, unknown>,
  recordId?: string
) {
  const path = recordId
    ? `/api/v1/patients/${encodeURIComponent(patientId)}/neonatal-records/${encodeURIComponent(recordId)}`
    : `/api/v1/patients/${encodeURIComponent(patientId)}/neonatal-records`;
  return requestJson<PatientDetailResponse>(path, {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    },
    method: recordId ? "PATCH" : "POST"
  });
}

export async function deletePatient(patientId: string) {
  return requestJson<{ deleted: boolean; patientId: string; requestId: string }>(
    `/api/v1/patients/${encodeURIComponent(patientId)}`,
    {
      method: "DELETE"
    }
  );
}

export async function loadAppointments(input: {
  date: string;
  patientId?: string;
  status?: string;
  view: "day" | "month" | "week";
}) {
  const params = new URLSearchParams({
    date: input.date,
    view: input.view
  });
  if (input.patientId) {
    params.set("patientId", input.patientId);
  }
  if (input.status) {
    params.set("status", input.status);
  }

  return requestJson<AppointmentsResponse>(`/api/v1/appointments?${params.toString()}`);
}

export async function createAppointment(payload: Record<string, unknown>) {
  return requestJson<{ appointment: AppointmentSnapshot; requestId: string }>("/api/v1/appointments", {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
}

export async function updateAppointment(appointmentId: string, payload: Record<string, unknown>) {
  return requestJson<{ appointment: AppointmentSnapshot; requestId: string }>(
    `/api/v1/appointments/${encodeURIComponent(appointmentId)}`,
    {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json"
      },
      method: "PATCH"
    }
  );
}

export async function deleteAppointment(appointmentId: string) {
  return requestJson<{ appointmentId: string; deleted: boolean; requestId: string }>(
    `/api/v1/appointments/${encodeURIComponent(appointmentId)}`,
    {
      method: "DELETE"
    }
  );
}

export async function loadClinicalNotes(patientId: string) {
  return requestJson<ClinicalNotesResponse>(
    `/api/v1/clinical-notes?patientId=${encodeURIComponent(patientId)}`
  );
}

export async function createClinicalNote(payload: Record<string, unknown>) {
  return requestJson<{ note: ClinicalNoteSnapshot; requestId: string }>("/api/v1/clinical-notes", {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
}

export async function updateClinicalNote(noteGroupId: string, payload: Record<string, unknown>) {
  return requestJson<{ note: ClinicalNoteSnapshot; requestId: string }>(
    `/api/v1/clinical-notes/${encodeURIComponent(noteGroupId)}`,
    {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json"
      },
      method: "PATCH"
    }
  );
}

export async function deleteClinicalNote(noteGroupId: string) {
  return requestJson<{ deleted: boolean; noteGroupId: string; requestId: string }>(
    `/api/v1/clinical-notes/${encodeURIComponent(noteGroupId)}`,
    {
      method: "DELETE"
    }
  );
}

