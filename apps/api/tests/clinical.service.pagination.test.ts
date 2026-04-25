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
  SCHEDULED: "SCHEDULED"
} as const;
const CLINICAL_NOTE_KIND = {
  SOAP: "SOAP"
} as const;
const NEONATAL_OUTCOME = {
  ALIVE: "ALIVE"
} as const;
const PREGNANCY_STATUS = {
  ACTIVE: "ACTIVE"
} as const;

function isTransactionCallback<TClient>(
  input: unknown
): input is (client: TClient) => unknown {
  return typeof input === "function";
}

function stubMethod(target: Record<string, unknown>, key: string, value: unknown): () => void {
  const original = target[key];
  target[key] = value;
  return () => {
    target[key] = original;
  };
}

const clinicalContext = {
  organizationId: "org_alpha",
  tenantId: "tenant_alpha",
  userId: "user_alpha"
} as const;

void test("getPatientDetail bounds pregnancy and neonatal history reads", async () => {
  const pregnancyCalls: Array<Record<string, unknown>> = [];
  const neonatalCalls: Array<Record<string, unknown>> = [];
  const transactionClient = {
    $executeRaw: () => Promise.resolve(undefined),
    appointment: {
      findMany: () => Promise.resolve([])
    },
    clinicalNote: {
      findMany: () => Promise.resolve([])
    },
    neonatalRecord: {
      findMany: (args: Record<string, unknown>) => {
        neonatalCalls.push(args);
        return Promise.resolve([
          {
            apgar1: null,
            apgar5: null,
            birthLengthCm: null,
            birthWeightGrams: null,
            bornAt: new Date("2026-04-07T10:00:00.000Z"),
            createdAt: new Date("2026-04-07T10:00:00.000Z"),
            headCircumferenceCm: null,
            id: "neo_1",
            newbornName: "Baby Alpha",
            notes: null,
            outcome: NEONATAL_OUTCOME.ALIVE,
            sex: null,
            updatedAt: new Date("2026-04-07T10:00:00.000Z")
          }
        ]);
      }
    },
    patient: {
      findFirst: () =>
        Promise.resolve({
          allergies: [],
          birthDate: new Date("1990-01-01T00:00:00.000Z"),
          bloodType: null,
          chronicConditions: [],
          createdAt: new Date("2026-04-07T10:00:00.000Z"),
          documentId: null,
          email: null,
          fullName: "Patient Alpha",
          id: "patient_alpha",
          medicalRecordNumber: "MRN-001",
          notes: null,
          phone: null,
          preferredName: null,
          status: "ACTIVE",
          updatedAt: new Date("2026-04-07T10:00:00.000Z")
        })
    },
    pregnancyRecord: {
      findMany: (args: Record<string, unknown>) => {
        pregnancyCalls.push(args);
        return Promise.resolve([
          {
            abortions: 0,
            complications: [],
            createdAt: new Date("2026-04-07T10:00:00.000Z"),
            estimatedDeliveryDate: new Date("2026-09-07T10:00:00.000Z"),
            fetalCount: 1,
            gravidity: 1,
            id: "pregnancy_1",
            lastMenstrualPeriod: new Date("2026-01-07T10:00:00.000Z"),
            notes: null,
            outcome: null,
            outcomeDate: null,
            parity: 0,
            previousCesareans: 0,
            riskLevel: "LOW",
            status: PREGNANCY_STATUS.ACTIVE,
            updatedAt: new Date("2026-04-07T10:00:00.000Z")
          }
        ]);
      }
    }
  };
  const restores = [
    injectPrismaDelegates(prisma, CLINICAL_RUNTIME_DELEGATES),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", (callback: unknown) => {
      if (isTransactionCallback<typeof transactionClient>(callback)) {
        return callback(transactionClient);
      }

      return Promise.resolve(callback);
    })
  ];

  try {
    const payload = await runWithTenantContext(
      {
        source: "authenticated",
        tenantId: clinicalContext.tenantId,
        userId: clinicalContext.userId
      },
      () => clinicalService.getPatientDetail(clinicalContext, "patient_alpha")
    );

    assert.equal(payload.patient.id, "patient_alpha");
    assert.equal(pregnancyCalls[0]?.take, 100);
    assert.equal(neonatalCalls[0]?.take, 100);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

void test("listAppointments and getClinicalNoteHistory apply explicit limits", async () => {
  const appointmentCalls: Array<Record<string, unknown>> = [];
  const noteHistoryCalls: Array<Record<string, unknown>> = [];
  const transactionClient = {
    $executeRaw: () => Promise.resolve(undefined),
    appointment: {
      findMany: (args: Record<string, unknown>) => {
        appointmentCalls.push(args);
        return Promise.resolve([
          {
            bloodPressureDiastolic: null,
            bloodPressureSystolic: null,
            chiefComplaint: null,
            createdAt: new Date("2026-04-07T10:00:00.000Z"),
            durationMinutes: 30,
            fetalHeartRateBpm: null,
            fetalWeightGrams: null,
            fundalHeightCm: null,
            id: "appointment_1",
            location: null,
            patient: {
              fullName: "Patient Alpha",
              id: "patient_alpha",
              preferredName: null
            },
            patientId: "patient_alpha",
            pregnancyRecordId: null,
            providerName: null,
            scheduledAt: new Date("2026-04-07T10:00:00.000Z"),
            status: APPOINTMENT_STATUS.SCHEDULED,
            summary: null,
            temperatureC: null,
            type: "PRENATAL",
            updatedAt: new Date("2026-04-07T10:00:00.000Z"),
            weightKg: null
          }
        ]);
      }
    },
    clinicalNote: {
      findMany: (args: Record<string, unknown>) => {
        noteHistoryCalls.push(args);
        return Promise.resolve([
          {
            appointmentId: null,
            author: null,
            assessment: null,
            content: null,
            createdAt: new Date("2026-04-07T10:00:00.000Z"),
            id: "note_1",
            isLatest: true,
            kind: CLINICAL_NOTE_KIND.SOAP,
            noteGroupId: "group_1",
            objective: null,
            patientId: "patient_alpha",
            plan: null,
            pregnancyRecordId: null,
            subjective: null,
            title: "Initial note",
            updatedAt: new Date("2026-04-07T10:00:00.000Z"),
            version: 1
          }
        ]);
      }
    },
    neonatalRecord: {
      findMany: () => Promise.resolve([])
    },
    patient: {
      findFirst: () => Promise.resolve(null)
    },
    pregnancyRecord: {
      findMany: () => Promise.resolve([])
    }
  };
  const restores = [
    injectPrismaDelegates(prisma, CLINICAL_RUNTIME_DELEGATES),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", (callback: unknown) => {
      if (isTransactionCallback<typeof transactionClient>(callback)) {
        return callback(transactionClient);
      }

      return Promise.resolve(callback);
    })
  ];

  try {
    const appointmentPayload = await runWithTenantContext(
      {
        source: "authenticated",
        tenantId: clinicalContext.tenantId,
        userId: clinicalContext.userId
      },
      () =>
        clinicalService.listAppointments(clinicalContext, {
          view: "week"
        })
    );
    const notePayload = await runWithTenantContext(
      {
        source: "authenticated",
        tenantId: clinicalContext.tenantId,
        userId: clinicalContext.userId
      },
      () => clinicalService.getClinicalNoteHistory(clinicalContext, "group_1")
    );

    assert.equal(appointmentPayload.items.length, 1);
    assert.equal(notePayload.items.length, 1);
    assert.equal(appointmentCalls[0]?.take, 250);
    assert.equal(noteHistoryCalls[0]?.take, 100);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

void test("listPatients and listClinicalNotes respect requested limits", async () => {
  const patientCalls: Array<Record<string, unknown>> = [];
  const noteCalls: Array<Record<string, unknown>> = [];
  const transactionClient = {
    $executeRaw: () => Promise.resolve(undefined),
    appointment: {
      findMany: () => Promise.resolve([])
    },
    clinicalNote: {
      findMany: (args: Record<string, unknown>) => {
        noteCalls.push(args);
        return Promise.resolve([
          {
            appointmentId: null,
            author: null,
            assessment: null,
            content: null,
            createdAt: new Date("2026-04-07T10:00:00.000Z"),
            id: "note_1",
            isLatest: true,
            kind: CLINICAL_NOTE_KIND.SOAP,
            noteGroupId: "group_1",
            objective: null,
            patientId: "patient_alpha",
            plan: null,
            pregnancyRecordId: null,
            subjective: null,
            title: "Initial note",
            updatedAt: new Date("2026-04-07T10:00:00.000Z"),
            version: 1
          }
        ]);
      }
    },
    neonatalRecord: {
      findMany: () => Promise.resolve([])
    },
    patient: {
      findMany: (args: Record<string, unknown>) => {
        patientCalls.push(args);
        return Promise.resolve([
          {
            allergies: [],
            birthDate: new Date("1990-01-01T00:00:00.000Z"),
            bloodType: null,
            chronicConditions: [],
            createdAt: new Date("2026-04-07T10:00:00.000Z"),
            documentId: null,
            email: null,
            fullName: "Patient Alpha",
            id: "patient_alpha",
            medicalRecordNumber: "MRN-001",
            notes: null,
            phone: null,
            preferredName: null,
            status: "ACTIVE",
            updatedAt: new Date("2026-04-07T10:00:00.000Z"),
            appointments: [],
            clinicalNotes: [],
            pregnancyRecords: []
          }
        ]);
      }
    },
    pregnancyRecord: {
      findMany: () => Promise.resolve([])
    }
  };
  const restores = [
    injectPrismaDelegates(prisma, CLINICAL_RUNTIME_DELEGATES),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", (callback: unknown) => {
      if (isTransactionCallback<typeof transactionClient>(callback)) {
        return callback(transactionClient);
      }

      return Promise.resolve(callback);
    })
  ];

  try {
    const patientPayload = await runWithTenantContext(
      {
        source: "authenticated",
        tenantId: clinicalContext.tenantId,
        userId: clinicalContext.userId
      },
      () =>
        clinicalService.listPatients(clinicalContext, {
          limit: 40
        })
    );
    const notePayload = await runWithTenantContext(
      {
        source: "authenticated",
        tenantId: clinicalContext.tenantId,
        userId: clinicalContext.userId
      },
      () =>
        clinicalService.listClinicalNotes(clinicalContext, {
          limit: 10,
          patientId: "patient_alpha"
        })
    );

    assert.equal(patientPayload.pageSize, 40);
    assert.equal(notePayload.pageSize, 10);
    assert.equal(patientCalls[0]?.take, 40);
    assert.equal(noteCalls[0]?.take, 10);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

