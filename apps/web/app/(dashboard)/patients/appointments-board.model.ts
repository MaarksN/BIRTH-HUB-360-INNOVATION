"use client";

import { useEffect, useState, useTransition } from "react";

import {
  buildAgendaHeading,
  createAppointment,
  deleteAppointment,
  loadAppointments,
  updateAppointment,
  type AppointmentSnapshot,
  type AppointmentsResponse
} from "./clinical-data";

export type AppointmentsBoardView = "day" | "month" | "week";

export type AppointmentFormState = {
  bloodPressureDiastolic: string;
  bloodPressureSystolic: string;
  chiefComplaint: string;
  fetalHeartRateBpm: string;
  fetalWeightGrams: string;
  patientId: string;
  providerName: string;
  scheduledAt: string;
  summary: string;
  type: "EXAM" | "POSTPARTUM" | "PRENATAL" | "ULTRASOUND" | "VACCINATION";
};

const baseAppointmentForm: AppointmentFormState = {
  bloodPressureDiastolic: "",
  bloodPressureSystolic: "",
  chiefComplaint: "",
  fetalHeartRateBpm: "",
  fetalWeightGrams: "",
  patientId: "",
  providerName: "",
  scheduledAt: "",
  summary: "",
  type: "PRENATAL"
};

export function createInitialAppointmentForm(patientId?: string): AppointmentFormState {
  return {
    ...baseAppointmentForm,
    patientId: patientId ?? ""
  };
}

function parseNumericField(value: string): number | undefined {
  return value ? Number(value) : undefined;
}

export function buildCreateAppointmentPayload(
  form: AppointmentFormState,
  patientId?: string
): Record<string, unknown> {
  const bloodPressureDiastolic = parseNumericField(form.bloodPressureDiastolic);
  const bloodPressureSystolic = parseNumericField(form.bloodPressureSystolic);
  const fetalHeartRateBpm = parseNumericField(form.fetalHeartRateBpm);
  const fetalWeightGrams = parseNumericField(form.fetalWeightGrams);

  return {
    ...(bloodPressureDiastolic !== undefined ? { bloodPressureDiastolic } : {}),
    ...(bloodPressureSystolic !== undefined ? { bloodPressureSystolic } : {}),
    ...(form.chiefComplaint ? { chiefComplaint: form.chiefComplaint } : {}),
    ...(fetalHeartRateBpm !== undefined ? { fetalHeartRateBpm } : {}),
    ...(fetalWeightGrams !== undefined ? { fetalWeightGrams } : {}),
    patientId: patientId ?? form.patientId,
    ...(form.providerName ? { providerName: form.providerName } : {}),
    scheduledAt: form.scheduledAt,
    ...(form.summary ? { summary: form.summary } : {}),
    type: form.type
  };
}

function getAppointmentsBoardError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export interface AppointmentsBoardModel {
  appointments: AppointmentSnapshot[];
  canSubmit: boolean;
  date: string;
  error: string | null;
  form: AppointmentFormState;
  isLoading: boolean;
  isPending: boolean;
  status: string;
  summary: AppointmentsResponse["summary"] | null;
  view: AppointmentsBoardView;
  windowLabel: string;
  patchAppointmentStatus: (
    appointmentId: string,
    nextStatus: AppointmentSnapshot["status"]
  ) => void;
  removeAppointment: (appointmentId: string) => void;
  setDate: (value: string) => void;
  setStatus: (value: string) => void;
  setView: (value: AppointmentsBoardView) => void;
  submitAppointment: () => void;
  updateForm: (patch: Partial<AppointmentFormState>) => void;
}

export function useAppointmentsBoardModel(input: {
  patientId?: string;
}): AppointmentsBoardModel {
  const [view, setView] = useState<AppointmentsBoardView>("week");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("");
  const [appointments, setAppointments] = useState<AppointmentSnapshot[]>([]);
  const [summary, setSummary] = useState<AppointmentsResponse["summary"] | null>(null);
  const [windowLabel, setWindowLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<AppointmentFormState>(createInitialAppointmentForm(input.patientId));
  const [isPending, startTransition] = useTransition();

  const refresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const payload = await loadAppointments({
        date,
        ...(input.patientId ? { patientId: input.patientId } : {}),
        ...(status ? { status } : {}),
        view
      });
      setAppointments(payload.items);
      setSummary(payload.summary);
      setWindowLabel(buildAgendaHeading(payload.window.label, payload.window.anchorDate));
    } catch (loadError) {
      setError(getAppointmentsBoardError(loadError, "Falha ao carregar agenda."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [date, input.patientId, status, view]);

  useEffect(() => {
    setForm((current) =>
      current.patientId === (input.patientId ?? "")
        ? current
        : {
            ...current,
            patientId: input.patientId ?? ""
          }
    );
  }, [input.patientId]);

  const updateForm = (patch: Partial<AppointmentFormState>) => {
    setForm((current) => ({
      ...current,
      ...patch
    }));
  };

  const submitAppointment = () => {
    startTransition(() => {
      void (async () => {
        try {
          await createAppointment(buildCreateAppointmentPayload(form, input.patientId));
          setForm(createInitialAppointmentForm(input.patientId));
          await refresh();
        } catch (saveError) {
          setError(getAppointmentsBoardError(saveError, "Falha ao criar consulta."));
        }
      })();
    });
  };

  const patchAppointmentStatus = (
    appointmentId: string,
    nextStatus: AppointmentSnapshot["status"]
  ) => {
    startTransition(() => {
      void (async () => {
        try {
          await updateAppointment(appointmentId, { status: nextStatus });
          await refresh();
        } catch (saveError) {
          setError(getAppointmentsBoardError(saveError, "Falha ao atualizar consulta."));
        }
      })();
    });
  };

  const removeAppointment = (appointmentId: string) => {
    startTransition(() => {
      void (async () => {
        try {
          await deleteAppointment(appointmentId);
          await refresh();
        } catch (deleteError) {
          setError(getAppointmentsBoardError(deleteError, "Falha ao remover consulta."));
        }
      })();
    });
  };

  return {
    appointments,
    canSubmit: Boolean((input.patientId ?? form.patientId) && form.scheduledAt) && !isPending,
    date,
    error,
    form,
    isLoading,
    isPending,
    patchAppointmentStatus,
    removeAppointment,
    setDate,
    setStatus,
    setView,
    status,
    submitAppointment,
    summary,
    updateForm,
    view,
    windowLabel
  };
}

