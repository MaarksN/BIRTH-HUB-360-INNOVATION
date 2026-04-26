"use client";

import Link from "next/link";

import type { PatientsResponse } from "./clinical-data";

type CreatePatientForm = {
  birthDate: string;
  email: string;
  fullName: string;
  lastMenstrualPeriod: string;
  medicalRecordNumber: string;
  phone: string;
  preferredName: string;
  riskLevel: "" | "HIGH" | "LOW" | "MODERATE";
};

type PatientsPageContentProps = {
  error: string | null;
  form: CreatePatientForm;
  isLoading: boolean;
  isPending: boolean;
  onCreateFormChange: (field: keyof CreatePatientForm, value: string) => void;
  onFilterChange: (field: "riskLevel" | "search" | "status", value: string) => void;
  onSubmitCreatePatient: () => void;
  patients: PatientsResponse["items"];
  riskLevel: string;
  search: string;
  status: string;
};

function formatPatientDate(
  value: unknown,
  format: "date" | "dateTime",
  fallback: string
): string {
  if (value instanceof Date || typeof value === "number" || typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return format === "date"
        ? parsed.toLocaleDateString("pt-BR")
        : parsed.toLocaleString("pt-BR");
    }
  }

  return fallback;
}

function PatientsCreateSection(props: {
  form: CreatePatientForm;
  isPending: boolean;
  onChangeField: (field: keyof CreatePatientForm, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="panel" style={{ display: "grid", gap: "0.85rem" }}>
      <div>
        <h2>Novo paciente</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          O cadastro pode nascer com DUM e classificacao de risco para ativar DPP, alertas e agenda.
        </p>
      </div>

      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Nome completo
          <input
            onChange={(event) => props.onChangeField("fullName", event.target.value)}
            placeholder="Maria Silva"
            value={props.form.fullName}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Nome preferido
          <input
            onChange={(event) => props.onChangeField("preferredName", event.target.value)}
            placeholder="Maria"
            value={props.form.preferredName}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Prontuario
          <input
            onChange={(event) => props.onChangeField("medicalRecordNumber", event.target.value)}
            placeholder="BH-001"
            value={props.form.medicalRecordNumber}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Nascimento
          <input
            onChange={(event) => props.onChangeField("birthDate", event.target.value)}
            type="date"
            value={props.form.birthDate}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Telefone
          <input
            onChange={(event) => props.onChangeField("phone", event.target.value)}
            placeholder="(11) 99999-0000"
            value={props.form.phone}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Email
          <input
            onChange={(event) => props.onChangeField("email", event.target.value)}
            placeholder="paciente@clinic.local"
            value={props.form.email}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          DUM
          <input
            onChange={(event) => props.onChangeField("lastMenstrualPeriod", event.target.value)}
            type="date"
            value={props.form.lastMenstrualPeriod}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Risco gestacional
          <select
            onChange={(event) => props.onChangeField("riskLevel", event.target.value)}
            value={props.form.riskLevel}
          >
            <option value="">Nao definir agora</option>
            <option value="LOW">Baixo</option>
            <option value="MODERATE">Moderado</option>
            <option value="HIGH">Alto</option>
          </select>
        </label>
      </div>

      <div className="panel-actions">
        <button
          className="action-button"
          disabled={!props.form.fullName.trim() || props.isPending}
          onClick={props.onSubmit}
          type="button"
        >
          {props.isPending ? "Salvando..." : "Criar paciente"}
        </button>
      </div>
    </section>
  );
}

function PatientsListSection(props: {
  error: string | null;
  isLoading: boolean;
  onFilterChange: (field: "riskLevel" | "search" | "status", value: string) => void;
  patients: PatientsResponse["items"];
  riskLevel: string;
  search: string;
  status: string;
}) {
  return (
    <section className="panel" style={{ display: "grid", gap: "0.85rem" }}>
      <div className="filter-row">
        <input
          aria-label="Buscar pacientes"
          onChange={(event) => props.onFilterChange("search", event.target.value)}
          placeholder="Buscar por nome, email ou prontuario"
          value={props.search}
        />
        <select onChange={(event) => props.onFilterChange("status", event.target.value)} value={props.status}>
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
        <select onChange={(event) => props.onFilterChange("riskLevel", event.target.value)} value={props.riskLevel}>
          <option value="">Todo risco</option>
          <option value="LOW">Baixo</option>
          <option value="MODERATE">Moderado</option>
          <option value="HIGH">Alto</option>
        </select>
      </div>

      {props.error ? <p style={{ color: "#9d0208", margin: 0 }}>{props.error}</p> : null}
      {props.isLoading ? <p style={{ margin: 0 }}>Carregando pacientes...</p> : null}

      {!props.isLoading && props.patients.length === 0 ? (
        <div className="panel" style={{ padding: "1rem" }}>
          <strong>Nenhum paciente encontrado</strong>
          <p style={{ marginBottom: 0 }}>
            Ajuste os filtros ou crie o primeiro cadastro para liberar agenda, alertas e notas.
          </p>
        </div>
      ) : null}

      {!props.isLoading ? (
        <div
          className="stats-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {props.patients.map((entry) => (
            <article key={entry.patient.id}>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between" }}>
                <div>
                  <strong>{entry.patient.fullName}</strong>
                  <p style={{ color: "var(--muted)", margin: "0.3rem 0 0" }}>
                    {entry.patient.preferredName ?? "Sem nome preferido"} ·{" "}
                    {entry.patient.medicalRecordNumber ?? "Sem prontuario"}
                  </p>
                </div>
                <span className="badge">{entry.patient.status}</span>
              </div>

              <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.8rem" }}>
                <span>Risco ativo: {entry.activePregnancy?.riskLevel ?? "Nao informado"}</span>
                <span>
                  DPP:{" "}
                  {formatPatientDate(
                    entry.activePregnancy?.estimatedDeliveryDate,
                    "date",
                    "Nao calculada"
                  )}
                </span>
                <span>Alertas: {entry.alertCount}</span>
                <span>
                  Proxima consulta:{" "}
                  {formatPatientDate(
                    entry.nextAppointment?.scheduledAt,
                    "dateTime",
                    "Nao agendada"
                  )}
                </span>
              </div>

              <div className="panel-actions" style={{ marginTop: "0.9rem" }}>
                <Link className="action-button" href={`/patients/${entry.patient.id}`}>
                  Abrir prontuario
                </Link>
                <Link className="ghost-button" href={`/patients/${entry.patient.id}/appointments`}>
                  Consultas
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PatientsPageContent(props: PatientsPageContentProps) {
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header className="hero-card">
        <span className="badge">Nucleo materno-infantil</span>
        <h1>Pacientes</h1>
        <p style={{ marginBottom: 0 }}>
          Cadastro clinico minimo para fluxo real de paciente, gestacao, agenda e nota clinica.
        </p>
      </header>

      <PatientsCreateSection
        form={props.form}
        isPending={props.isPending}
        onChangeField={props.onCreateFormChange}
        onSubmit={props.onSubmitCreatePatient}
      />
      <PatientsListSection
        error={props.error}
        isLoading={props.isLoading}
        onFilterChange={props.onFilterChange}
        patients={props.patients}
        riskLevel={props.riskLevel}
        search={props.search}
        status={props.status}
      />
    </section>
  );
}
