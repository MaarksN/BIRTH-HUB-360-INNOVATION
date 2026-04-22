"use client";

import {
  AppointmentsBoardCreateSection,
  AppointmentsBoardFiltersSection,
  AppointmentsBoardHeader,
  AppointmentsBoardTableSection
} from "./appointments-board.sections";
import { useAppointmentsBoardModel } from "./appointments-board.model";

export function AppointmentsBoard(props: {
  description: string;
  patientId?: string;
  patientName?: string;
  title: string;
}) {
  const model = useAppointmentsBoardModel(
    props.patientId ? { patientId: props.patientId } : {}
  );

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <AppointmentsBoardHeader
        description={props.description}
        title={props.title}
        {...(props.patientId ? { patientId: props.patientId } : {})}
      />
      <AppointmentsBoardFiltersSection
        date={model.date}
        error={model.error}
        isLoading={model.isLoading}
        onDateChange={model.setDate}
        onStatusChange={model.setStatus}
        onViewChange={model.setView}
        status={model.status}
        summary={model.summary}
        view={model.view}
        windowLabel={model.windowLabel}
      />
      <AppointmentsBoardCreateSection
        canSubmit={model.canSubmit}
        form={model.form}
        isPending={model.isPending}
        onSubmit={model.submitAppointment}
        onUpdateForm={model.updateForm}
        {...(props.patientId ? { patientId: props.patientId } : {})}
      />
      <AppointmentsBoardTableSection
        appointments={model.appointments}
        isLoading={model.isLoading}
        onChangeStatus={model.patchAppointmentStatus}
        onRemove={model.removeAppointment}
        {...(props.patientName ? { patientName: props.patientName } : {})}
      />
    </section>
  );
}
