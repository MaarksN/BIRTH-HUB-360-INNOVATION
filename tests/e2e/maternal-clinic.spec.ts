// @ts-expect-error TODO: remover suppressão ampla
import { expect, test } from "@playwright/test";

import {
  bootstrapSession,
  skipUnlessClinicalWorkspaceEnabled
} from "./support";

skipUnlessClinicalWorkspaceEnabled();

test("maternal dashboard flows render patient list and detail with mocked API", async ({ page }) => {
  await bootstrapSession(page);

  await page.route("**/api/v1/patients?**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [
          {
            activePregnancy: {
              complications: [],
              createdAt: "2026-04-01T12:00:00.000Z",
              daysUntilDueDate: 120,
              estimatedDeliveryDate: "2026-08-05T12:00:00.000Z",
              fetalCount: 1,
              gestationalAgeDays: 140,
              gestationalAgeLabel: "20 sem 0 d",
              gravidity: 1,
              id: "preg_1",
              lastMenstrualPeriod: "2025-10-29T00:00:00.000Z",
              notes: null,
              outcome: null,
              outcomeDate: null,
              parity: 0,
              previousCesareans: 0,
              riskLevel: "HIGH",
              status: "ACTIVE",
              updatedAt: "2026-04-01T12:00:00.000Z"
            },
            alertCount: 2,
            nextAppointment: null,
            patient: {
              allergies: [],
              birthDate: "1998-06-10T00:00:00.000Z",
              bloodType: null,
              chronicConditions: [],
              createdAt: "2026-04-01T12:00:00.000Z",
              documentId: null,
              email: "maria@clinic.local",
              fullName: "Maria da Silva",
              id: "patient_1",
              medicalRecordNumber: "BH-001",
              notes: null,
              phone: "(11) 99999-0000",
              preferredName: "Maria",
              status: "ACTIVE",
              updatedAt: "2026-04-01T12:00:00.000Z"
            }
          }
        ],
        requestId: "req_e2e"
      }),
      contentType: "application/json",
      status: 200
    });
  });

  await page.route("**/api/v1/patients/patient_1", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        activePregnancy: {
          complications: ["hipertensao gestacional"],
          createdAt: "2026-04-01T12:00:00.000Z",
          daysUntilDueDate: 120,
          estimatedDeliveryDate: "2026-08-05T12:00:00.000Z",
          fetalCount: 1,
          gestationalAgeDays: 140,
          gestationalAgeLabel: "20 sem 0 d",
          gravidity: 1,
          id: "preg_1",
          lastMenstrualPeriod: "2025-10-29T00:00:00.000Z",
          notes: "Gestacao acompanhada",
          outcome: null,
          outcomeDate: null,
          parity: 0,
          previousCesareans: 0,
          riskLevel: "HIGH",
          status: "ACTIVE",
          updatedAt: "2026-04-01T12:00:00.000Z"
        },
        alerts: [
          {
            description: "A gestacao ativa esta marcada como alto risco e precisa de acompanhamento prioritario.",
            id: "high-risk",
            severity: "high",
            title: "Gestacao de alto risco"
          }
        ],
        clinicalNotes: [],
        growthCurve: [
          {
            appointmentId: "appt_1",
            deviationPercent: 2,
            fetalWeightGrams: 1010,
            gestationalWeek: 28,
            recordedAt: "2026-04-01T12:00:00.000Z",
            referenceGrams: 1005
          }
        ],
        neonatalRecords: [],
        patient: {
          allergies: [],
          birthDate: "1998-06-10T00:00:00.000Z",
          bloodType: null,
          chronicConditions: [],
          createdAt: "2026-04-01T12:00:00.000Z",
          documentId: null,
          email: "maria@clinic.local",
          fullName: "Maria da Silva",
          id: "patient_1",
          medicalRecordNumber: "BH-001",
          notes: null,
          phone: "(11) 99999-0000",
          preferredName: "Maria",
          status: "ACTIVE",
          updatedAt: "2026-04-01T12:00:00.000Z"
        },
        pregnancyRecords: [],
        recentAppointments: [],
        requestId: "req_e2e",
        upcomingAppointments: []
      }),
      contentType: "application/json",
      status: 200
    });
  });

  await page.goto("/patients");
  await expect(page.getByRole("heading", { name: "Pacientes" })).toBeVisible();
  await expect(page.getByText("Maria da Silva")).toBeVisible();

  await page.goto("/patients/patient_1");
  await expect(page.getByRole("heading", { name: "Maria da Silva" })).toBeVisible();
  await expect(page.getByText("Gestacao de alto risco")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Curva de crescimento fetal" })).toBeVisible();
});
