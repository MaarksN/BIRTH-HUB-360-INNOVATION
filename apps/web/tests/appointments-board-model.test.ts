import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCreateAppointmentPayload,
  createInitialAppointmentForm,
  type AppointmentFormState
} from "../app/(dashboard)/patients/appointments-board.model";

void test("appointments board model seeds the patient id into the initial form", () => {
  assert.equal(createInitialAppointmentForm("patient_123").patientId, "patient_123");
  assert.equal(createInitialAppointmentForm().type, "PRENATAL");
});

void test("appointments board model builds payloads with numeric coercion and omits empty fields", () => {
  const form = {
    ...createInitialAppointmentForm("patient_form"),
    bloodPressureDiastolic: "70",
    bloodPressureSystolic: "110",
    chiefComplaint: "Dor lombar",
    fetalHeartRateBpm: "148",
    fetalWeightGrams: "",
    patientId: "patient_form",
    providerName: "Dra. Lia",
    scheduledAt: "2026-04-08T13:30",
    summary: "",
    type: "ULTRASOUND"
  } satisfies AppointmentFormState;

  const payload = buildCreateAppointmentPayload(form, "patient_prop");

  assert.deepEqual(payload, {
    bloodPressureDiastolic: 70,
    bloodPressureSystolic: 110,
    chiefComplaint: "Dor lombar",
    fetalHeartRateBpm: 148,
    patientId: "patient_prop",
    providerName: "Dra. Lia",
    scheduledAt: "2026-04-08T13:30",
    type: "ULTRASOUND"
  });
});

