import { prisma } from "@birthub/database";

import { assertPrismaModelsAvailable, readPrismaModel } from "../../lib/prisma-runtime.js";
import { type DashboardClinicalSummary } from "./service.shared.js";

const ACTIVE_PREGNANCY_STATUS = "ACTIVE";
const HIGH_PREGNANCY_RISK = "HIGH";
const APPOINTMENT_STATUSES_IN_PROGRESS = ["CHECKED_IN", "SCHEDULED"] as const;
const DASHBOARD_CLINICAL_RUNTIME_MODELS = [
  "appointment",
  "neonatalRecord",
  "patient",
  "pregnancyRecord"
] as const;

type DashboardCountDelegate = {
  count(args: { where: object }): Promise<number>;
};

type DashboardFindManyDelegate = {
  findMany<TResult extends object>(args: object): Promise<TResult[]>;
};

type DashboardSpotlightPatientRecord = {
  appointments: Array<{
    scheduledAt: Date;
  }>;
  clinicalNotes: Array<{
    title: string | null;
  }>;
  fullName: string;
  id: string;
  pregnancyRecords: Array<{
    estimatedDeliveryDate: Date | null;
    lastMenstrualPeriod: Date | null;
    riskLevel: "HIGH" | "LOW" | "MODERATE" | null;
    status: "ACTIVE" | "CLOSED" | "DELIVERED" | null;
  }>;
};

function ensureDashboardClinicalRuntimeAvailable(): void {
  assertPrismaModelsAvailable(
    prisma,
    DASHBOARD_CLINICAL_RUNTIME_MODELS,
    "the dashboard clinical summary"
  );
}

function readDashboardClinicalModel<T>(
  modelName: (typeof DASHBOARD_CLINICAL_RUNTIME_MODELS)[number]
): T {
  return readPrismaModel<T>(prisma, modelName, "the dashboard clinical summary");
}

function startOfDay(value: Date): Date {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function calculateGestationalAgeLabel(input: {
  estimatedDeliveryDate: Date | null;
  lastMenstrualPeriod: Date | null;
}): string | null {
  const today = startOfDay(new Date());
  let gestationalAgeDays: number | null = null;

  if (input.lastMenstrualPeriod) {
    gestationalAgeDays = Math.floor(
      (today.getTime() - startOfDay(input.lastMenstrualPeriod).getTime()) /
        (24 * 60 * 60 * 1000)
    );
  } else if (input.estimatedDeliveryDate) {
    gestationalAgeDays =
      280 -
      Math.floor(
        (startOfDay(input.estimatedDeliveryDate).getTime() - today.getTime()) /
          (24 * 60 * 60 * 1000)
      );
  }

  if (gestationalAgeDays === null || gestationalAgeDays < 0) {
    return null;
  }

  const weeks = Math.floor(gestationalAgeDays / 7);
  const days = gestationalAgeDays % 7;
  return `${weeks} sem ${days} d`;
}

export async function getDashboardClinicalSummary(
  organizationId: string,
  tenantId: string
): Promise<DashboardClinicalSummary> {
  ensureDashboardClinicalRuntimeAvailable();
  const patientModel = readDashboardClinicalModel<DashboardCountDelegate & DashboardFindManyDelegate>("patient");
  const pregnancyRecordModel = readDashboardClinicalModel<DashboardCountDelegate>("pregnancyRecord");
  const appointmentModel = readDashboardClinicalModel<DashboardCountDelegate>("appointment");
  const neonatalRecordModel = readDashboardClinicalModel<DashboardCountDelegate>("neonatalRecord");

  const now = new Date();
  const today = startOfDay(now);
  const nextTwoWeeks = addDays(today, 14);

  const [
    activePatients,
    activePregnancies,
    highRiskPregnancies,
    nearDuePregnancies,
    scheduledFollowUps,
    neonatalRecords,
    spotlightPatients
  ] = await Promise.all([
    patientModel.count({
      where: {
        deletedAt: null,
        organizationId,
        status: "ACTIVE",
        tenantId
      }
    }),
    pregnancyRecordModel.count({
      where: {
        deletedAt: null,
        organizationId,
        status: ACTIVE_PREGNANCY_STATUS,
        tenantId
      }
    }),
    pregnancyRecordModel.count({
      where: {
        deletedAt: null,
        organizationId,
        riskLevel: HIGH_PREGNANCY_RISK,
        status: ACTIVE_PREGNANCY_STATUS,
        tenantId
      }
    }),
    pregnancyRecordModel.count({
      where: {
        deletedAt: null,
        estimatedDeliveryDate: {
          gte: today,
          lte: nextTwoWeeks
        },
        organizationId,
        status: ACTIVE_PREGNANCY_STATUS,
        tenantId
      }
    }),
    appointmentModel.count({
      where: {
        deletedAt: null,
        organizationId,
        scheduledAt: {
          gte: now
        },
        status: {
          in: APPOINTMENT_STATUSES_IN_PROGRESS
        },
        tenantId
      }
    }),
    neonatalRecordModel.count({
      where: {
        deletedAt: null,
        organizationId,
        tenantId
      }
    }),
    patientModel.findMany<DashboardSpotlightPatientRecord>({
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        clinicalNotes: {
          orderBy: {
            updatedAt: "desc"
          },
          select: {
            title: true
          },
          take: 1,
          where: {
            deletedAt: null,
            isLatest: true
          }
        },
        fullName: true,
        id: true,
        appointments: {
          orderBy: {
            scheduledAt: "asc"
          },
          select: {
            scheduledAt: true
          },
          take: 1,
          where: {
            deletedAt: null,
            scheduledAt: {
              gte: now
            },
            status: {
              in: APPOINTMENT_STATUSES_IN_PROGRESS
            }
          }
        },
        pregnancyRecords: {
          orderBy: {
            updatedAt: "desc"
          },
          select: {
            estimatedDeliveryDate: true,
            lastMenstrualPeriod: true,
            riskLevel: true,
            status: true
          },
          take: 1,
          where: {
            deletedAt: null,
            status: ACTIVE_PREGNANCY_STATUS
          }
        }
      },
      take: 4,
      where: {
        deletedAt: null,
        organizationId,
        tenantId
      }
    })
  ]);

  const alerts: DashboardClinicalSummary["alerts"] = [];

  if (highRiskPregnancies > 0) {
    alerts.push({
      description:
        "Gestacoes de alto risco exigem fila prioritaria na home e revisao de acompanhamento.",
      href: "/patients?riskLevel=HIGH",
      id: "high-risk-pregnancies",
      severity: "high",
      title: `${highRiskPregnancies} gestacao(oes) de alto risco`
    });
  }

  if (nearDuePregnancies > 0) {
    alerts.push({
      description:
        "Existem pacientes entrando na janela final da gestacao e sem espaco para perder acompanhamento.",
      href: "/appointments?view=week",
      id: "near-due-pregnancies",
      severity: "medium",
      title: `${nearDuePregnancies} DPP(s) nas proximas duas semanas`
    });
  }

  if (scheduledFollowUps === 0 && activePregnancies > 0) {
    alerts.push({
      description:
        "Nao ha consultas futuras agendadas para a fila obstetrica ativa do tenant atual.",
      href: "/appointments",
      id: "missing-follow-ups",
      severity: "medium",
      title: "Agenda clinica sem retornos futuros"
    });
  }

  return {
    alerts,
    metrics: [
      {
        delta: activePregnancies > 0 ? `${activePregnancies} gestacoes em acompanhamento` : "sem gestacoes ativas",
        label: "Pacientes ativos",
        value: activePatients
      },
      {
        delta:
          highRiskPregnancies > 0
            ? `${highRiskPregnancies} com risco alto`
            : "sem casos de alto risco",
        label: "Gestacoes ativas",
        value: activePregnancies
      },
      {
        delta:
          nearDuePregnancies > 0
            ? `${nearDuePregnancies} com DPP <= 14 dias`
            : "sem DPP imediata",
        label: "Retornos futuros",
        value: scheduledFollowUps
      },
      {
        delta:
          neonatalRecords > 0
            ? `${neonatalRecords} registro(s) neonatal(is) persistido(s)`
            : "baseline neonatal ainda vazio",
        label: "Neonatais",
        value: neonatalRecords
      }
    ],
    spotlight: spotlightPatients.map((patient) => {
      const pregnancy = patient.pregnancyRecords[0];
      const nextAppointment = patient.appointments[0];
      const latestNote = patient.clinicalNotes[0];

      return {
        gestationalAgeLabel: pregnancy
          ? calculateGestationalAgeLabel({
              estimatedDeliveryDate: pregnancy.estimatedDeliveryDate,
              lastMenstrualPeriod: pregnancy.lastMenstrualPeriod
            })
          : null,
        latestNoteTitle: latestNote?.title ?? null,
        nextAppointmentAt: nextAppointment ? nextAppointment.scheduledAt.toISOString() : null,
        patientId: patient.id,
        patientName: patient.fullName,
        riskLevel: pregnancy?.riskLevel ?? "LOW",
        status: pregnancy?.status ?? "CLOSED"
      };
    })
  };
}
