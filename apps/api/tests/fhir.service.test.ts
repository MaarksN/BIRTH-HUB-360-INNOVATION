// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import { fhirService } from "../src/modules/fhir/service.js";
import { injectPrismaDelegates } from "./prisma-runtime-test-helpers.js";

function stubMethod(target: Record<string, unknown>, key: string, value: unknown): () => void {
  const original = target[key];
  target[key] = value;
  return () => {
    target[key] = original;
  };
}

void test("fhirService.searchPatients keeps the explicit patient search limit", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const restores = [
    injectPrismaDelegates(prisma, ["patient"]),
    stubMethod(prisma.patient as unknown as Record<string, unknown>, "findMany", (args: Record<string, unknown>) => {
      calls.push(args);
      return Promise.resolve([]);
    })
  ];

  try {
    const bundle = await fhirService.searchPatients(
      {
        organizationId: "org_clinic",
        tenantId: "tenant_clinic",
        userId: "user_clinic"
      },
      {
        identifier: "MRN-001"
      },
      "https://example.test/api/fhir/R4"
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.take, 25);
    assert.equal(bundle.resourceType, "Bundle");
    assert.equal(bundle.type, "searchset");
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

void test("fhirService.getAppointment maps appointment status without Prisma runtime enums", async () => {
  const restores = [
    injectPrismaDelegates(prisma, ["appointment"]),
    stubMethod(prisma.appointment as unknown as Record<string, unknown>, "findFirst", async () => ({
      chiefComplaint: null,
      durationMinutes: 30,
      id: "appointment_1",
      location: "Sala 3",
      patient: {
        fullName: "Patient Alpha",
        id: "patient_alpha",
        preferredName: null
      },
      patientId: "patient_alpha",
      providerName: "Dra. Ana",
      scheduledAt: new Date("2026-04-07T10:00:00.000Z"),
      status: "CHECKED_IN",
      summary: "Retorno",
      type: "PRENATAL",
      updatedAt: new Date("2026-04-07T10:00:00.000Z")
    }))
  ];

  try {
    const resource = await fhirService.getAppointment(
      {
        organizationId: "org_clinic",
        tenantId: "tenant_clinic",
        userId: "user_clinic"
      },
      "appointment_1"
    );

    assert.equal(resource.resourceType, "Appointment");
    assert.equal(resource.status, "checked-in");
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

