import {
  prisma,
  withTenantDatabaseContext
} from "@birthub/database";

import {
  NEONATAL_OUTCOME,
  PREGNANCY_OUTCOME,
  PREGNANCY_STATUS,
  assertFound,
  normalizeOptionalString,
  parseRequiredDate,
  type ClinicalContext
} from "./service-support.js";
import {
  asClinicalTransaction,
  buildPregnancyMutation,
  ensureClinicalRuntimeAvailable
} from "./service-runtime.js";
import {
  findActivePregnancy,
  type PatientDetailPayload
} from "./service-runtime.records.js";
import type {
  SaveNeonatalRecordInput,
  SavePregnancyRecordInput
} from "./service-patients.js";

type PatientDetailGetter = (
  context: ClinicalContext,
  patientId: string
) => Promise<PatientDetailPayload>;

export function createPatientRecordMethods(getPatientDetail: PatientDetailGetter) {
  const savePregnancyRecord = async (
    context: ClinicalContext,
    input: SavePregnancyRecordInput
  ): Promise<PatientDetailPayload> => {
    ensureClinicalRuntimeAvailable();

    await withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      assertFound(
        await clinicalTx.patient.findFirst<{ id: string }>({
          select: {
            id: true
          },
          where: {
            deletedAt: null,
            id: input.patientId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Patient was not found for pregnancy save."
      );

      if (input.recordId) {
        assertFound(
          await clinicalTx.pregnancyRecord.findFirst<{ id: string }>({
            select: {
              id: true
            },
            where: {
              deletedAt: null,
              id: input.recordId,
              organizationId: context.organizationId,
              patientId: input.patientId,
              tenantId: context.tenantId
            }
          }),
          "Pregnancy record was not found."
        );

        if (input.payload.status === PREGNANCY_STATUS.ACTIVE) {
          await clinicalTx.pregnancyRecord.updateMany({
            data: {
              status: PREGNANCY_STATUS.CLOSED
            },
            where: {
              deletedAt: null,
              id: {
                not: input.recordId
              },
              organizationId: context.organizationId,
              patientId: input.patientId,
              status: PREGNANCY_STATUS.ACTIVE,
              tenantId: context.tenantId
            }
          });
        }

        await clinicalTx.pregnancyRecord.updateMany({
          data: buildPregnancyMutation(input.payload),
          where: {
            deletedAt: null,
            id: input.recordId,
            organizationId: context.organizationId,
            patientId: input.patientId,
            tenantId: context.tenantId
          }
        });
      } else {
        if (
          (input.payload.status ?? PREGNANCY_STATUS.ACTIVE) ===
          PREGNANCY_STATUS.ACTIVE
        ) {
          await clinicalTx.pregnancyRecord.updateMany({
            data: {
              status: PREGNANCY_STATUS.CLOSED
            },
            where: {
              deletedAt: null,
              organizationId: context.organizationId,
              patientId: input.patientId,
              status: PREGNANCY_STATUS.ACTIVE,
              tenantId: context.tenantId
            }
          });
        }

        await clinicalTx.pregnancyRecord.create({
          data: {
            ...buildPregnancyMutation(input.payload),
            organizationId: context.organizationId,
            patientId: input.patientId,
            status: input.payload.status ?? PREGNANCY_STATUS.ACTIVE,
            tenantId: context.tenantId
          }
        });
      }
    }, prisma);

    return getPatientDetail(context, input.patientId);
  };

  const saveNeonatalRecord = async (
    context: ClinicalContext,
    input: SaveNeonatalRecordInput
  ): Promise<PatientDetailPayload> => {
    ensureClinicalRuntimeAvailable();

    await withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      assertFound(
        await clinicalTx.patient.findFirst<{ id: string }>({
          select: {
            id: true
          },
          where: {
            deletedAt: null,
            id: input.patientId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Patient was not found for neonatal save."
      );

      const activePregnancy = await findActivePregnancy(tx, context, input.patientId);
      const pregnancyRecordId =
        normalizeOptionalString(input.payload.pregnancyRecordId) ??
        activePregnancy?.id ??
        null;

      const neonatalData = {
        ...(input.payload.apgar1 !== undefined
          ? { apgar1: input.payload.apgar1 }
          : {}),
        ...(input.payload.apgar5 !== undefined
          ? { apgar5: input.payload.apgar5 }
          : {}),
        ...(input.payload.birthLengthCm !== undefined
          ? { birthLengthCm: input.payload.birthLengthCm }
          : {}),
        ...(input.payload.birthWeightGrams !== undefined
          ? { birthWeightGrams: input.payload.birthWeightGrams }
          : {}),
        ...(input.payload.headCircumferenceCm !== undefined
          ? { headCircumferenceCm: input.payload.headCircumferenceCm }
          : {}),
        ...(input.payload.outcome !== undefined
          ? { outcome: input.payload.outcome }
          : {}),
        ...(input.payload.sex !== undefined ? { sex: input.payload.sex } : {}),
        bornAt: parseRequiredDate(input.payload.bornAt, "bornAt"),
        newbornName: normalizeOptionalString(input.payload.newbornName),
        notes: normalizeOptionalString(input.payload.notes),
        pregnancyRecordId
      };

      if (input.recordId) {
        assertFound(
          await clinicalTx.neonatalRecord.findFirst<{ id: string }>({
            select: {
              id: true
            },
            where: {
              deletedAt: null,
              id: input.recordId,
              organizationId: context.organizationId,
              patientId: input.patientId,
              tenantId: context.tenantId
            }
          }),
          "Neonatal record was not found."
        );

        await clinicalTx.neonatalRecord.updateMany({
          data: neonatalData,
          where: {
            deletedAt: null,
            id: input.recordId,
            organizationId: context.organizationId,
            patientId: input.patientId,
            tenantId: context.tenantId
          }
        });
      } else {
        await clinicalTx.neonatalRecord.create({
          data: {
            ...neonatalData,
            organizationId: context.organizationId,
            patientId: input.patientId,
            tenantId: context.tenantId
          }
        });
      }

      if (pregnancyRecordId) {
        await clinicalTx.pregnancyRecord.updateMany({
          data: {
            outcome:
              (input.payload.outcome ?? NEONATAL_OUTCOME.ALIVE) ===
              NEONATAL_OUTCOME.STILLBIRTH
                ? PREGNANCY_OUTCOME.STILLBIRTH
                : PREGNANCY_OUTCOME.LIVE_BIRTH,
            outcomeDate: parseRequiredDate(input.payload.bornAt, "bornAt"),
            status: PREGNANCY_STATUS.DELIVERED
          },
          where: {
            deletedAt: null,
            id: pregnancyRecordId,
            organizationId: context.organizationId,
            patientId: input.patientId,
            tenantId: context.tenantId
          }
        });
      }
    }, prisma);

    return getPatientDetail(context, input.patientId);
  };

  return {
    saveNeonatalRecord,
    savePregnancyRecord
  };
}
