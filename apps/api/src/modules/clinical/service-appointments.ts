import {
  prisma,
  withTenantDatabaseContext
} from "@birthub/database";

import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  assertFound,
  normalizeOptionalString,
  parseRequiredDate,
  type AppointmentRecord,
  type AppointmentStatus,
  type AppointmentType,
  type ClinicalContext,
  type DateWindowView
} from "./service-support.js";
import { serializeAppointment } from "./service-support.view.js";
import {
  asClinicalTransaction,
  buildAppointmentSelect,
  buildDateWindow,
  ensureClinicalRuntimeAvailable
} from "./service-runtime.js";
import {
  findActivePregnancy,
  listAppointmentsInWindow
} from "./service-runtime.records.js";

type CreateAppointmentPayload = {
  bloodPressureDiastolic?: number;
  bloodPressureSystolic?: number;
  chiefComplaint?: string | null;
  durationMinutes?: number;
  fetalHeartRateBpm?: number;
  fetalWeightGrams?: number;
  fundalHeightCm?: number;
  location?: string | null;
  patientId: string;
  pregnancyRecordId?: string | null;
  providerName?: string | null;
  scheduledAt: string;
  status?: AppointmentStatus;
  summary?: string | null;
  temperatureC?: number;
  type?: AppointmentType;
  weightKg?: number;
};

type UpdateAppointmentPayload = {
  bloodPressureDiastolic?: number;
  bloodPressureSystolic?: number;
  chiefComplaint?: string | null;
  durationMinutes?: number;
  fetalHeartRateBpm?: number;
  fetalWeightGrams?: number;
  fundalHeightCm?: number;
  location?: string | null;
  pregnancyRecordId?: string | null;
  providerName?: string | null;
  scheduledAt?: string;
  status?: AppointmentStatus;
  summary?: string | null;
  temperatureC?: number;
  type?: AppointmentType;
  weightKg?: number;
};

export function createAppointmentMethods() {
  const getAppointment = async (
    context: ClinicalContext,
    appointmentId: string
  ) => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      const appointment = assertFound(
        await clinicalTx.appointment.findFirst<AppointmentRecord>({
          select: buildAppointmentSelect(true),
          where: {
            deletedAt: null,
            id: appointmentId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Appointment was not found for the active tenant."
      );

      return {
        appointment: serializeAppointment(appointment)
      };
    }, prisma);
  };

  const listAppointments = async (
    context: ClinicalContext,
    filters: {
      anchorDate?: string;
      patientId?: string;
      status?: AppointmentStatus;
      view: DateWindowView;
    }
  ) => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(async (tx) => {
      const window = buildDateWindow(filters.anchorDate, filters.view);
      const appointmentFilters: {
        patientId?: string;
        status?: AppointmentStatus;
      } = {};

      if (filters.patientId) {
        appointmentFilters.patientId = filters.patientId;
      }

      if (filters.status) {
        appointmentFilters.status = filters.status;
      }

      const items = await listAppointmentsInWindow(
        tx,
        context,
        appointmentFilters,
        window
      );

      const summary = items.reduce(
        (accumulator, item) => {
          accumulator.total += 1;
          if (
            item.status === APPOINTMENT_STATUS.SCHEDULED ||
            item.status === APPOINTMENT_STATUS.CHECKED_IN
          ) {
            accumulator.scheduled += 1;
          }
          if (item.status === APPOINTMENT_STATUS.COMPLETED) {
            accumulator.completed += 1;
          }
          if (
            item.status === APPOINTMENT_STATUS.CANCELLED ||
            item.status === APPOINTMENT_STATUS.NO_SHOW
          ) {
            accumulator.cancelled += 1;
          }
          return accumulator;
        },
        {
          cancelled: 0,
          completed: 0,
          scheduled: 0,
          total: 0
        }
      );

      return {
        items: items.map((item) => serializeAppointment(item)),
        summary,
        window: {
          anchorDate: window.anchorDate,
          from: window.from.toISOString(),
          label: window.label,
          to: window.to.toISOString(),
          view: window.view
        }
      };
    }, prisma);
  };

  const createAppointment = async (
    context: ClinicalContext,
    payload: CreateAppointmentPayload
  ) => {
    ensureClinicalRuntimeAvailable();

    const appointmentId = await withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      assertFound(
        await clinicalTx.patient.findFirst<{ id: string }>({
          select: {
            id: true
          },
          where: {
            deletedAt: null,
            id: payload.patientId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Patient was not found for appointment creation."
      );

      const activePregnancy = payload.pregnancyRecordId
        ? null
        : await findActivePregnancy(tx, context, payload.patientId);

      const appointment = await clinicalTx.appointment.create<{ id: string }>({
        data: {
          ...(payload.bloodPressureDiastolic !== undefined
            ? { bloodPressureDiastolic: payload.bloodPressureDiastolic }
            : {}),
          ...(payload.bloodPressureSystolic !== undefined
            ? { bloodPressureSystolic: payload.bloodPressureSystolic }
            : {}),
          ...(payload.durationMinutes !== undefined
            ? { durationMinutes: payload.durationMinutes }
            : {}),
          ...(payload.fetalHeartRateBpm !== undefined
            ? { fetalHeartRateBpm: payload.fetalHeartRateBpm }
            : {}),
          ...(payload.fetalWeightGrams !== undefined
            ? { fetalWeightGrams: payload.fetalWeightGrams }
            : {}),
          ...(payload.fundalHeightCm !== undefined
            ? { fundalHeightCm: payload.fundalHeightCm }
            : {}),
          ...(payload.temperatureC !== undefined
            ? { temperatureC: payload.temperatureC }
            : {}),
          ...(payload.weightKg !== undefined ? { weightKg: payload.weightKg } : {}),
          chiefComplaint: normalizeOptionalString(payload.chiefComplaint),
          location: normalizeOptionalString(payload.location),
          organizationId: context.organizationId,
          patientId: payload.patientId,
          pregnancyRecordId:
            normalizeOptionalString(payload.pregnancyRecordId) ??
            activePregnancy?.id ??
            null,
          providerName: normalizeOptionalString(payload.providerName),
          scheduledAt: parseRequiredDate(payload.scheduledAt, "scheduledAt"),
          status: payload.status ?? APPOINTMENT_STATUS.SCHEDULED,
          summary: normalizeOptionalString(payload.summary),
          tenantId: context.tenantId,
          type: payload.type ?? APPOINTMENT_TYPE.PRENATAL
        },
        select: {
          id: true
        }
      });

      return appointment.id;
    }, prisma);

    return getAppointment(context, appointmentId);
  };

  const updateAppointment = async (
    context: ClinicalContext,
    appointmentId: string,
    payload: UpdateAppointmentPayload
  ) => {
    ensureClinicalRuntimeAvailable();

    await withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      assertFound(
        await clinicalTx.appointment.findFirst<{ id: string }>({
          select: {
            id: true
          },
          where: {
            deletedAt: null,
            id: appointmentId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Appointment was not found for update."
      );

      await clinicalTx.appointment.updateMany({
        data: {
          ...(payload.bloodPressureDiastolic !== undefined
            ? { bloodPressureDiastolic: payload.bloodPressureDiastolic }
            : {}),
          ...(payload.bloodPressureSystolic !== undefined
            ? { bloodPressureSystolic: payload.bloodPressureSystolic }
            : {}),
          ...(payload.durationMinutes !== undefined
            ? { durationMinutes: payload.durationMinutes }
            : {}),
          ...(payload.fetalHeartRateBpm !== undefined
            ? { fetalHeartRateBpm: payload.fetalHeartRateBpm }
            : {}),
          ...(payload.fetalWeightGrams !== undefined
            ? { fetalWeightGrams: payload.fetalWeightGrams }
            : {}),
          ...(payload.fundalHeightCm !== undefined
            ? { fundalHeightCm: payload.fundalHeightCm }
            : {}),
          ...(payload.temperatureC !== undefined
            ? { temperatureC: payload.temperatureC }
            : {}),
          ...(payload.weightKg !== undefined ? { weightKg: payload.weightKg } : {}),
          ...(payload.type !== undefined ? { type: payload.type } : {}),
          ...(payload.status !== undefined ? { status: payload.status } : {}),
          ...(payload.scheduledAt !== undefined
            ? { scheduledAt: parseRequiredDate(payload.scheduledAt, "scheduledAt") }
            : {}),
          ...(payload.pregnancyRecordId !== undefined
            ? {
                pregnancyRecordId: normalizeOptionalString(payload.pregnancyRecordId)
              }
            : {}),
          ...(payload.chiefComplaint !== undefined
            ? { chiefComplaint: normalizeOptionalString(payload.chiefComplaint) }
            : {}),
          ...(payload.location !== undefined
            ? { location: normalizeOptionalString(payload.location) }
            : {}),
          ...(payload.providerName !== undefined
            ? { providerName: normalizeOptionalString(payload.providerName) }
            : {}),
          ...(payload.summary !== undefined
            ? { summary: normalizeOptionalString(payload.summary) }
            : {})
        },
        where: {
          deletedAt: null,
          id: appointmentId,
          organizationId: context.organizationId,
          tenantId: context.tenantId
        }
      });
    }, prisma);

    return getAppointment(context, appointmentId);
  };

  const deleteAppointment = async (
    context: ClinicalContext,
    appointmentId: string
  ) => {
    ensureClinicalRuntimeAvailable();

    return withTenantDatabaseContext(async (tx) => {
      const clinicalTx = asClinicalTransaction(tx);
      assertFound(
        await clinicalTx.appointment.findFirst<{ id: string }>({
          select: {
            id: true
          },
          where: {
            deletedAt: null,
            id: appointmentId,
            organizationId: context.organizationId,
            tenantId: context.tenantId
          }
        }),
        "Appointment was not found for deletion."
      );

      await clinicalTx.appointment.updateMany({
        data: {
          deletedAt: new Date(),
          status: APPOINTMENT_STATUS.CANCELLED
        },
        where: {
          deletedAt: null,
          id: appointmentId,
          organizationId: context.organizationId,
          tenantId: context.tenantId
        }
      });

      return {
        appointmentId,
        deleted: true
      };
    }, prisma);
  };

  return {
    listAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment
  };
}
