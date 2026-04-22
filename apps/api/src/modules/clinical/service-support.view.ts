import {
  PREGNANCY_RISK_LEVEL,
  calculateDaysUntil,
  calculateEstimatedDeliveryDate,
  calculateGestationalAgeDays,
  formatGestationalAge,
  interpolateReferenceWeight,
  toIsoString,
  type AppointmentRecord,
  type ClinicalAlert,
  type ClinicalNoteRecord,
  type GrowthCurvePoint,
  type NeonatalRecordModel,
  type PatientRecord,
  type PregnancyRecordModel
} from "./service-support.js";

export function serializePatient(record: PatientRecord) {
  return {
    allergies: record.allergies,
    birthDate: toIsoString(record.birthDate),
    bloodType: record.bloodType,
    chronicConditions: record.chronicConditions,
    createdAt: record.createdAt.toISOString(),
    documentId: record.documentId,
    email: record.email,
    fullName: record.fullName,
    id: record.id,
    medicalRecordNumber: record.medicalRecordNumber,
    notes: record.notes,
    phone: record.phone,
    preferredName: record.preferredName,
    status: record.status,
    updatedAt: record.updatedAt.toISOString()
  };
}

export function serializePregnancyRecord(record: PregnancyRecordModel) {
  const estimatedDeliveryDate = calculateEstimatedDeliveryDate(record);
  const gestationalAgeDays = calculateGestationalAgeDays(record);
  const daysUntilDueDate = calculateDaysUntil(new Date(), estimatedDeliveryDate);

  return {
    abortions: record.abortions,
    complications: record.complications,
    createdAt: record.createdAt.toISOString(),
    daysUntilDueDate,
    estimatedDeliveryDate: toIsoString(estimatedDeliveryDate),
    fetalCount: record.fetalCount,
    gestationalAgeDays,
    gestationalAgeLabel: formatGestationalAge(gestationalAgeDays),
    gravidity: record.gravidity,
    id: record.id,
    lastMenstrualPeriod: toIsoString(record.lastMenstrualPeriod),
    notes: record.notes,
    outcome: record.outcome,
    outcomeDate: toIsoString(record.outcomeDate),
    parity: record.parity,
    previousCesareans: record.previousCesareans,
    riskLevel: record.riskLevel,
    status: record.status,
    updatedAt: record.updatedAt.toISOString()
  };
}

export function serializeAppointment(record: AppointmentRecord) {
  return {
    bloodPressureDiastolic: record.bloodPressureDiastolic,
    bloodPressureSystolic: record.bloodPressureSystolic,
    chiefComplaint: record.chiefComplaint,
    createdAt: record.createdAt.toISOString(),
    durationMinutes: record.durationMinutes,
    fetalHeartRateBpm: record.fetalHeartRateBpm,
    fetalWeightGrams: record.fetalWeightGrams,
    fundalHeightCm: record.fundalHeightCm,
    id: record.id,
    location: record.location,
    patient: record.patient,
    patientId: record.patientId,
    pregnancyRecordId: record.pregnancyRecordId,
    providerName: record.providerName,
    scheduledAt: record.scheduledAt.toISOString(),
    status: record.status,
    summary: record.summary,
    temperatureC: record.temperatureC,
    type: record.type,
    updatedAt: record.updatedAt.toISOString(),
    weightKg: record.weightKg
  };
}

export function serializeClinicalNote(record: ClinicalNoteRecord) {
  return {
    appointmentId: record.appointmentId,
    assessment: record.assessment,
    author: record.author,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
    id: record.id,
    isLatest: record.isLatest,
    kind: record.kind,
    noteGroupId: record.noteGroupId,
    objective: record.objective,
    patientId: record.patientId,
    plan: record.plan,
    pregnancyRecordId: record.pregnancyRecordId,
    subjective: record.subjective,
    title: record.title,
    updatedAt: record.updatedAt.toISOString(),
    version: record.version
  };
}

export function serializeNeonatalRecord(record: NeonatalRecordModel) {
  return {
    apgar1: record.apgar1,
    apgar5: record.apgar5,
    birthLengthCm: record.birthLengthCm,
    birthWeightGrams: record.birthWeightGrams,
    bornAt: record.bornAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    headCircumferenceCm: record.headCircumferenceCm,
    id: record.id,
    newbornName: record.newbornName,
    notes: record.notes,
    outcome: record.outcome,
    sex: record.sex,
    updatedAt: record.updatedAt.toISOString()
  };
}

export function createClinicalAlert(alert: ClinicalAlert): ClinicalAlert {
  return alert;
}

export function deriveRiskAlerts(activePregnancy: PregnancyRecordModel | null): ClinicalAlert[] {
  if (activePregnancy?.riskLevel !== PREGNANCY_RISK_LEVEL.HIGH) {
    return [];
  }

  return [
    createClinicalAlert({
      description: "A gestacao ativa esta marcada como alto risco e precisa de acompanhamento prioritario.",
      id: "high-risk-pregnancy",
      severity: "high",
      title: "Gestacao de alto risco"
    })
  ];
}

export function deriveDueDateAlerts(
  activePregnancy: PregnancyRecordModel | null,
  now: Date
): ClinicalAlert[] {
  const dueDate = calculateEstimatedDeliveryDate(activePregnancy ?? {});
  const daysUntilDueDate = calculateDaysUntil(now, dueDate);

  if (daysUntilDueDate === null) {
    return [];
  }

  if (daysUntilDueDate < 0) {
    return [
      createClinicalAlert({
        description: "A data provavel do parto ja passou e ainda nao existe desfecho registrado.",
        id: "overdue-dpp",
        severity: "high",
        title: "DPP ultrapassada"
      })
    ];
  }

  if (daysUntilDueDate <= 14) {
    return [
      createClinicalAlert({
        description: "A paciente entrou na janela final da gestacao e vale revisar plano de parto e sinais de alerta.",
        id: "near-dpp",
        severity: "medium",
        title: "DPP nas proximas duas semanas"
      })
    ];
  }

  return [];
}

export function deriveAppointmentAlerts(
  latestAppointment: AppointmentRecord | null,
  activePregnancy: PregnancyRecordModel | null,
  now: Date
): ClinicalAlert[] {
  if (!latestAppointment) {
    return activePregnancy
      ? [
          createClinicalAlert({
            description: "Existe gestacao ativa, mas ainda nao ha consulta registrada no modulo clinico.",
            id: "missing-follow-up",
            severity: "medium",
            title: "Sem consultas registradas"
          })
        ]
      : [];
  }

  const alerts: ClinicalAlert[] = [];
  const daysSinceLastAppointment = calculateDaysUntil(latestAppointment.scheduledAt, now);

  if (daysSinceLastAppointment !== null && daysSinceLastAppointment > 28) {
    alerts.push(
      createClinicalAlert({
        description: "Nao ha consulta recente registrada nas ultimas quatro semanas.",
        id: "follow-up-delay",
        severity: "medium",
        title: "Seguimento prenatal em atraso"
      })
    );
  }

  const systolic = latestAppointment.bloodPressureSystolic ?? 0;
  const diastolic = latestAppointment.bloodPressureDiastolic ?? 0;
  if (systolic >= 140 || diastolic >= 90) {
    alerts.push(
      createClinicalAlert({
        description: "A ultima consulta registrou pressao arterial em faixa de atencao.",
        id: "blood-pressure-alert",
        severity: "high",
        title: "Pressao arterial elevada"
      })
    );
  }

  const fetalHeartRate = latestAppointment.fetalHeartRateBpm ?? null;
  if (fetalHeartRate !== null && (fetalHeartRate < 110 || fetalHeartRate > 160)) {
    alerts.push(
      createClinicalAlert({
        description: "A frequencia cardiaca fetal registrada ficou fora da faixa usada pela tela.",
        id: "fetal-heart-rate-alert",
        severity: "medium",
        title: "FCF fora da faixa"
      })
    );
  }

  return alerts;
}

export function deriveMissingClinicalCoverageAlerts(
  activePregnancy: PregnancyRecordModel | null,
  nextAppointment: AppointmentRecord | null,
  latestClinicalNote: ClinicalNoteRecord | null
): ClinicalAlert[] {
  if (!activePregnancy) {
    return [];
  }

  const alerts: ClinicalAlert[] = [];

  if (!nextAppointment) {
    alerts.push(
      createClinicalAlert({
        description: "Nao existe consulta futura agendada para a gestacao ativa.",
        id: "missing-next-appointment",
        severity: "low",
        title: "Agenda futura ausente"
      })
    );
  }

  if (!latestClinicalNote) {
    alerts.push(
      createClinicalAlert({
        description: "Ainda nao existe nota clinica versionada para esta paciente.",
        id: "missing-clinical-note",
        severity: "low",
        title: "Sem nota clinica"
      })
    );
  }

  return alerts;
}

export function findNextAppointment(
  appointments: AppointmentRecord[],
  now: Date = new Date()
): AppointmentRecord | null {
  return (
    [...appointments]
      .filter((appointment) => appointment.scheduledAt >= now)
      .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime())[0] ?? null
  );
}

export function deriveClinicalAlerts(input: {
  activePregnancy: PregnancyRecordModel | null;
  latestAppointment: AppointmentRecord | null;
  latestClinicalNote: ClinicalNoteRecord | null;
  nextAppointment: AppointmentRecord | null;
}) {
  const now = new Date();

  return [
    ...deriveRiskAlerts(input.activePregnancy),
    ...deriveDueDateAlerts(input.activePregnancy, now),
    ...deriveAppointmentAlerts(input.latestAppointment, input.activePregnancy, now),
    ...deriveMissingClinicalCoverageAlerts(
      input.activePregnancy,
      input.nextAppointment,
      input.latestClinicalNote
    )
  ];
}

export function buildGrowthCurve(input: {
  activePregnancy: PregnancyRecordModel | null;
  appointments: AppointmentRecord[];
}): GrowthCurvePoint[] {
  const activePregnancy = input.activePregnancy;
  if (!activePregnancy) {
    return [];
  }

  return input.appointments
    .filter((appointment) => appointment.fetalWeightGrams !== null)
    .map((appointment) => {
      const gestationalAgeDays = calculateGestationalAgeDays({
        estimatedDeliveryDate: calculateEstimatedDeliveryDate(activePregnancy),
        lastMenstrualPeriod: activePregnancy.lastMenstrualPeriod,
        referenceDate: appointment.scheduledAt
      });
      const gestationalWeek = gestationalAgeDays ? Math.max(1, Math.round(gestationalAgeDays / 7)) : 0;
      const referenceGrams = gestationalWeek > 0 ? interpolateReferenceWeight(gestationalWeek) : null;
      const deviationPercent =
        referenceGrams && appointment.fetalWeightGrams
          ? Math.round(((appointment.fetalWeightGrams - referenceGrams) / referenceGrams) * 100)
          : null;

      return {
        appointmentId: appointment.id,
        deviationPercent,
        fetalWeightGrams: appointment.fetalWeightGrams ?? 0,
        gestationalWeek,
        recordedAt: appointment.scheduledAt.toISOString(),
        referenceGrams
      };
    })
    .filter((point) => point.gestationalWeek > 0)
    .sort((left, right) => left.gestationalWeek - right.gestationalWeek);
}
