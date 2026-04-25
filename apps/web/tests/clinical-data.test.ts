import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAgendaHeading,
  buildGrowthCurvePath,
  calculateDueDateFromLmp,
  formatGestationalAgeFromDays
} from "../app/(dashboard)/patients/clinical-data";

void test("clinical data helpers calculate DPP and gestational age labels", () => {
  const dueDate = calculateDueDateFromLmp("2026-01-01T00:00:00.000Z");

  assert.equal(dueDate?.slice(0, 10), "2026-10-08");
  assert.equal(formatGestationalAgeFromDays(196), "28 sem 0 d");
  assert.equal(formatGestationalAgeFromDays(null), "Nao calculado");
});

void test("clinical data helpers build svg path and agenda heading", () => {
  const path = buildGrowthCurvePath([
    {
      appointmentId: "appt_1",
      deviationPercent: -4,
      fetalWeightGrams: 1050,
      gestationalWeek: 28,
      recordedAt: "2026-04-01T12:00:00.000Z",
      referenceGrams: 1005
    },
    {
      appointmentId: "appt_2",
      deviationPercent: 3,
      fetalWeightGrams: 1750,
      gestationalWeek: 32,
      recordedAt: "2026-05-01T12:00:00.000Z",
      referenceGrams: 1700
    }
  ]);

  assert.match(path, /^M /);
  assert.match(path, /L /);
  assert.match(buildAgendaHeading("Agenda da semana", "2026-04-07"), /Agenda da semana/);
});

