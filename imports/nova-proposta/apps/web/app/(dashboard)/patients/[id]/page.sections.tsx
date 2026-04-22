"use client";

import Link from "next/link";

import { ClinicalWorkspaceNotice } from "../../../../components/dashboard/ClinicalWorkspaceNotice";

import type { PatientDetailResponse } from "../clinical-data";
import {
  ClinicalNotesSection,
  GrowthCurveSection,
  NeonatalSection,
  PatientAlertsSection,
  PatientPregnancySection,
  PatientProfileSection,
  RecentAppointmentsSection,
  type NeonatalFormState,
  type NoteFormState,
  type PatientFormState,
  type PregnancyFormState
} from "./page.parts";

type PatientDetailContentProps = {
  detail: PatientDetailResponse | null;
  editingNoteGroupId: string | null;
  error: string | null;
  growthPath: string;
  isLoading: boolean;
  isPending: boolean;
  manualDueDate: string | null;
  neonatalForm: NeonatalFormState;
  noteForm: NoteFormState;
  onDeleteNote: (noteGroupId: string) => void;
  onNeonatalFieldChange: (field: keyof NeonatalFormState, value: string) => void;
  onNoteFieldChange: (field: keyof NoteFormState, value: string) => void;
  onPatientFieldChange: (field: keyof PatientFormState, value: string) => void;
  onPregnancyFieldChange: (field: keyof PregnancyFormState, value: string) => void;
  onRemovePatient: () => void;
  onStartNewNote: () => void;
  onStartNoteVersion: (note: PatientDetailResponse["clinicalNotes"][number]) => void;
  onSubmitNeonatal: () => void;
  onSubmitNote: () => void;
  onSubmitPatient: () => void;
  onSubmitPregnancy: () => void;
  patientForm: PatientFormState | null;
  pregnancyForm: PregnancyFormState | null;
};

export function PatientDetailContent(props: PatientDetailContentProps) {
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <ClinicalWorkspaceNotice />
      {props.error ? <p style={{ color: "#9d0208", margin: 0 }}>{props.error}</p> : null}
      {props.isLoading || !props.detail || !props.patientForm || !props.pregnancyForm ? (
        <p>Carregando prontuario...</p>
      ) : null}

      {!props.isLoading && props.detail && props.patientForm && props.pregnancyForm ? (
        <>
          <header className="hero-card">
            <span className="badge">Prontuario clinico preservado</span>
            <h1 style={{ marginBottom: "0.4rem" }}>{props.detail.patient.fullName}</h1>
            <p style={{ marginBottom: 0 }}>
              {props.detail.patient.medicalRecordNumber ?? "Sem prontuario"} ·{" "}
              {props.detail.patient.phone ?? "Sem telefone"} ·{" "}
              {props.detail.patient.email ?? "Sem email"}
            </p>
            <div className="hero-actions" style={{ marginTop: "0.9rem" }}>
              <Link href={`/patients/${props.detail.patient.id}/appointments`}>Consultas da paciente</Link>
              <Link className="ghost-button" href="/appointments">
                Agenda geral
              </Link>
            </div>
          </header>

          <PatientAlertsSection alerts={props.detail.alerts} />

          <section className="stats-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
            <PatientProfileSection
              isPending={props.isPending}
              onChangeField={props.onPatientFieldChange}
              onRemovePatient={props.onRemovePatient}
              onSubmitPatient={props.onSubmitPatient}
              patientForm={props.patientForm}
            />
            <PatientPregnancySection
              detail={props.detail}
              isPending={props.isPending}
              manualDueDate={props.manualDueDate}
              onChangeField={props.onPregnancyFieldChange}
              onSubmitPregnancy={props.onSubmitPregnancy}
              pregnancyForm={props.pregnancyForm}
            />
          </section>

          <section className="stats-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
            <GrowthCurveSection detail={props.detail} growthPath={props.growthPath} />
            <NeonatalSection
              detail={props.detail}
              isPending={props.isPending}
              neonatalForm={props.neonatalForm}
              onChangeField={props.onNeonatalFieldChange}
              onSubmitNeonatal={props.onSubmitNeonatal}
            />
          </section>

          <ClinicalNotesSection
            detail={props.detail}
            editingNoteGroupId={props.editingNoteGroupId}
            isPending={props.isPending}
            noteForm={props.noteForm}
            onChangeField={props.onNoteFieldChange}
            onDeleteNote={props.onDeleteNote}
            onStartNewNote={props.onStartNewNote}
            onStartVersion={props.onStartNoteVersion}
            onSubmitNote={props.onSubmitNote}
          />

          <RecentAppointmentsSection detail={props.detail} />
        </>
      ) : null}
    </section>
  );
}
