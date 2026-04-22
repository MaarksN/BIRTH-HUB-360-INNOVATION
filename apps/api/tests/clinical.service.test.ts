// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import {
  prisma,
  runWithTenantContext
} from "@birthub/database";

import { clinicalService } from "../src/modules/clinical/service.js";
import { injectPrismaDelegates } from "./prisma-runtime-test-helpers.js";

const CLINICAL_RUNTIME_DELEGATES = [
  "appointment",
  "clinicalNote",
  "neonatalRecord",
  "patient",
  "pregnancyRecord"
] as const;
const APPOINTMENT_STATUS = {
  COMPLETED: "COMPLETED",
  SCHEDULED: "SCHEDULED"
} as const;
const APPOINTMENT_TYPE = {
  PRENATAL: "PRENATAL"
} as const;
const PATIENT_STATUS = {
  ACTIVE: "ACTIVE"
} as const;
const PREGNANCY_RISK_LEVEL = {
  LOW: "LOW"
} as const;
const PREGNANCY_STATUS = {
  ACTIVE: "ACTIVE",
  DELIVERED: "DELIVERED"
} as const;

type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];
type PregnancyStatus = (typeof PREGNANCY_STATUS)[keyof typeof PREGNANCY_STATUS];

function stubMethod(target: Record<string, unknown>, key: string, value: unknown): () => void {
  const original = target[key];
  target[key] = value;
  return () => {
    target[key] = original;
  };
}

function createPatientRecord(id: string) {
  return {
    allergies: [],
    birthDate: new Date("1992-02-01T00:00:00.000Z"),
    bloodType: "O+",
    chronicConditions: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    documentId: "123456789",
    email: "patient@example.com",
    fullName: "Maria Silva",
    id,
    medicalRecordNumber: "MRN-001",
    notes: null,
    phone: null,
    preferredName: "Maria",
    status: PATIENT_STATUS.ACTIVE,
    updatedAt: new Date("2026-04-01T00:00:00.000Z")
  };
}

function createPregnancyRecord(id: string, status: PregnancyStatus) {
  return {
    abortions: 0,
    complications: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    estimatedDeliveryDate: new Date("2026-10-01T00:00:00.000Z"),
    fetalCount: 1,
    gravidity: 1,
    id,
    lastMenstrualPeriod: new Date("2026-01-01T00:00:00.000Z"),
    notes: null,
    outcome: null,
    outcomeDate: null,
    parity: 0,
    previousCesareans: 0,
    riskLevel: PREGNANCY_RISK_LEVEL.LOW,
    status,
    updatedAt: new Date("2026-04-01T00:00:00.000Z")
  };
}

function createNeonatalRecord(id: string) {
  return {
    apgar1: 8,
    apgar5: 9,
    birthLengthCm: 49,
    birthWeightGrams: 3200,
    bornAt: new Date("2026-03-01T00:00:00.000Z"),
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    headCircumferenceCm: 34,
    id,
    newbornName: "Bebe Teste",
    notes: null,
    outcome: "ALIVE",
    sex: "FEMALE",
    updatedAt: new Date("2026-03-01T00:00:00.000Z")
  };
}

function createAppointment(id: string, scheduledAt: string, status: AppointmentStatus) {
  return {
    bloodPressureDiastolic: null,
    bloodPressureSystolic: null,
    chiefComplaint: null,
    createdAt: new Date(scheduledAt),
    durationMinutes: 30,
    fetalHeartRateBpm: null,
    fetalWeightGrams: null,
    fundalHeightCm: null,
    id,
    location: null,
    patient: {
      fullName: "Maria Silva",
      id: "patient_1",
      preferredName: "Maria"
    },
    patientId: "patient_1",
    pregnancyRecordId: null,
    providerName: "Dra. Ana",
    scheduledAt: new Date(scheduledAt),
    status,
    summary: null,
    temperatureC: null,
    type: APPOINTMENT_TYPE.PRENATAL,
    updatedAt: new Date(scheduledAt),
    weightKg: null
  };
}

function createClinicalNote(id: string, version: number) {
  return {
    appointmentId: null,
    assessment: null,
    author: null,
    content: null,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    id,
    isLatest: version === 101,
    kind: "EVOLUTION",
    noteGroupId: "note_group_1",
    objective: null,
    patientId: "patient_1",
    plan: null,
    pregnancyRecordId: null,
    subjective: null,
    title: `Nota ${version}`,
    updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    version
  };
}

function createTransactionMock(overrides: Record<string, unknown>) {
  return {
    $executeRaw: () => Promise.resolve(1),
    appointment: {
      findMany: () => Promise.resolve([])
    },
    clinicalNote: {
      findMany: () => Promise.resolve([])
    },
    neonatalRecord: {
      findMany: () => Promise.resolve([])
    },
    patient: {
      findFirst: () => Promise.resolve(null)
    },
    pregnancyRecord: {
      findMany: () => Promise.resolve([])
    },
    ...overrides
  };
}

void test.skip("clinicalService.getPatientDetail paginates pregnancy and neonatal records", async () => {
  const pregnancyCalls: Array<Record<string, unknown>> = [];
  const neonatalCalls: Array<Record<string, unknown>> = [];
  let pregnancyPageIndex = 0;
  let neonatalPageIndex = 0;
  const pregnancyPages = [
    Array.from({ length: 100 }, (_, index) =>
      createPregnancyRecord(
        `preg_${index.toString().padStart(3, "0")}`,
        index === 0 ? PREGNANCY_STATUS.ACTIVE : PREGNANCY_STATUS.DELIVERED
      )
    ),
    [createPregnancyRecord("preg_100", PREGNANCY_STATUS.DELIVERED)]
  ];
  const neonatalPages = [
    Array.from({ length: 100 }, (_, index) =>
      createNeonatalRecord(`neo_${index.toString().padStart(3, "0")}`)
    ),
    [createNeonatalRecord("neo_100")]
  ];
  const tx = createTransactionMock({
    clinicalNote: {
      findMany: () => Promise.resolve([])
    },
    neonatalRecord: {
      findMany: (args: Record<string, unknown>) => {
        neonatalCalls.push(args);
        return Promise.resolve(neonatalPages[neonatalPageIndex++] ?? []);
      }
    },
    patient: {
      findFirst: () => Promise.resolve(createPatientRecord("patient_1"))
    },
    pregnancyRecord: {
      findMany: (args: Record<string, unknown>) => {
        pregnancyCalls.push(args);
        return Promise.resolve(pregnancyPages[pregnancyPageIndex++] ?? []);
      }
    }
  });
  const restores = [
    injectPrismaDelegates(prisma, CLINICAL_RUNTIME_DELEGATES),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", (callback: (value: unknown) => Promise<unknown>) =>
      callback(tx)
    )
  ];

  try {
    const result = await runWithTenantContext(
      {
        source: "authenticated",
        tenantId: "tenant_clinic",
        userId: "user_clinic"
      },
      () =>
        clinicalService.getPatientDetail(
          {
            organizationId: "org_clinic",
            tenantId: "tenant_clinic",
            userId: "user_clinic"
          },
          "patient_1"
        )
    );

    assert.equal(pregnancyCalls.length, 2);
    assert.equal(neonatalCalls.length, 2);
    assert.equal(result.pregnancyRecords.length, 101);
    assert.equal(result.neonatalRecords.length, 101);
    assert.deepEqual(pregnancyCalls[1]?.cursor, {
      id: "preg_099"
    });
    assert.deepEqual(neonatalCalls[1]?.cursor, {
      id: "neo_099"
    });
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

void test.skip("clinicalService.listAppointments paginates the windowed appointment list", async () => {
  const appointmentCalls: Array<Record<string, unknown>> = [];
  let appointmentPageIndex = 0;
  const appointmentPages = [
    Array.from({ length: 250 }, (_, index) =>
      createAppointment(
        `appt_${index.toString().padStart(3, "0")}`,
        `2026-04-0${(index % 5) + 1}T09:00:00.000Z`,
        APPOINTMENT_STATUS.SCHEDULED
      )
    ),
    [createAppointment("appt_250", "2026-04-06T09:00:00.000Z", APPOINTMENT_STATUS.COMPLETED)]
  ];
  const tx = createTransactionMock({
    appointment: {
      findMany: (args: Record<string, unknown>) => {
        appointmentCalls.push(args);
        return Promise.resolve(appointmentPages[appointmentPageIndex++] ?? []);
      }
    }
  });
  const restores = [
    injectPrismaDelegates(prisma, CLINICAL_RUNTIME_DELEGATES),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", (callback: (value: unknown) => Promise<unknown>) =>
      callback(tx)
    )
  ];

  try {
    const result = await runWithTenantContext(
      {
        source: "authenticated",
        tenantId: "tenant_clinic",
        userId: "user_clinic"
      },
      () =>
        clinicalService.listAppointments(
          {
            organizationId: "org_clinic",
            tenantId: "tenant_clinic",
            userId: "user_clinic"
          },
          {
            anchorDate: "2026-04-01",
            view: "month"
          }
        )
    );

    assert.equal(appointmentCalls.length, 2);
    assert.equal(result.items.length, 251);
    assert.equal(result.summary.total, 251);
    assert.equal(result.summary.scheduled, 250);
    assert.equal(result.summary.completed, 1);
    assert.deepEqual(appointmentCalls[1]?.cursor, {
      id: "appt_249"
    });
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

void test.skip("clinicalService.getClinicalNoteHistory paginates the note timeline", async () => {
  const noteCalls: Array<Record<string, unknown>> = [];
  let notePageIndex = 0;
  const notePages = [
    Array.from({ length: 100 }, (_, index) => createClinicalNote(`note_${index}`, 101 - index)),
    [createClinicalNote("note_100", 1)]
  ];
  const tx = createTransactionMock({
    clinicalNote: {
      findMany: (args: Record<string, unknown>) => {
        noteCalls.push(args);
        return Promise.resolve(notePages[notePageIndex++] ?? []);
      }
    }
  });
  const restores = [
    injectPrismaDelegates(prisma, CLINICAL_RUNTIME_DELEGATES),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", (callback: (value: unknown) => Promise<unknown>) =>
      callback(tx)
    )
  ];

  try {
    const result = await runWithTenantContext(
      {
        source: "authenticated",
        tenantId: "tenant_clinic",
        userId: "user_clinic"
      },
      () =>
        clinicalService.getClinicalNoteHistory(
          {
            organizationId: "org_clinic",
            tenantId: "tenant_clinic",
            userId: "user_clinic"
          },
          "note_group_1"
        )
    );

    assert.equal(noteCalls.length, 2);
    assert.equal(result.items.length, 101);
    assert.deepEqual(noteCalls[1]?.cursor, {
      id: "note_99"
    });
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

