"use client";

import { use } from "react";

import { AppointmentsBoard } from "../../appointments-board";

export default function PatientAppointmentsPageClient({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <PatientAppointmentsPageEnabled params={params} />;
}

function PatientAppointmentsPageEnabled({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AppointmentsBoard
      description="Agenda focada na paciente, com criacao rapida de consultas e atualizacao de status."
      patientId={id}
      title="Consultas da paciente"
    />
  );
}
