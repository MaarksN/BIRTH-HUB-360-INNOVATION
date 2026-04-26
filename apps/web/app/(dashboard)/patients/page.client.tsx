"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { ClinicalWorkspaceNotice } from "../../../components/dashboard/ClinicalWorkspaceNotice";
import {
  createPatient,
  loadPatients,
  type PatientsResponse
} from "./clinical-data";

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

const initialCreateForm: CreatePatientForm = {
  birthDate: "",
  email: "",
  fullName: "",
  lastMenstrualPeriod: "",
  medicalRecordNumber: "",
  phone: "",
  preferredName: "",
  riskLevel: ""
};

export default function PatientsPageClient() {
  return <PatientsPageEnabled />;
}

function PatientsPageEnabled() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [patients, setPatients] = useState<PatientsResponse["items"]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePatientForm>(initialCreateForm);
  const [isPending, startTransition] = useTransition();

  const refresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const payload = await loadPatients(search, status, riskLevel);
      setPatients(payload.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar pacientes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [riskLevel, search, status]);

  const submitCreatePatient = () => {
    startTransition(() => {
      void (async () => {
        try {
          setError(null);
          await createPatient({
            ...(form.birthDate ? { birthDate: form.birthDate } : {}),
            ...(form.email ? { email: form.email } : {}),
            fullName: form.fullName,
            ...(form.medicalRecordNumber ? { medicalRecordNumber: form.medicalRecordNumber } : {}),
            ...(form.phone ? { phone: form.phone } : {}),
            ...(form.preferredName ? { preferredName: form.preferredName } : {}),
            ...(form.lastMenstrualPeriod || form.riskLevel
              ? {
                  pregnancyRecord: {
                    ...(form.lastMenstrualPeriod
                      ? { lastMenstrualPeriod: form.lastMenstrualPeriod }
                      : {}),
                    ...(form.riskLevel ? { riskLevel: form.riskLevel } : {})
                  }
                }
              : {})
          });
          setForm(initialCreateForm);
          await refresh();
        } catch (createError) {
          setError(createError instanceof Error ? createError.message : "Falha ao criar paciente.");
        }
      })();
    });
  };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <ClinicalWorkspaceNotice />

      <header className="hero-card">
        <span className="badge">Workspace clinico preservado</span>
        <h1>Pacientes</h1>
        <p style={{ marginBottom: 0 }}>
          Superficie preservada para avaliacao controlada de paciente, gestacao, agenda e nota clinica, sem representar o caminho padrao do produto.
        </p>
      </header>

      <section className="panel" style={{ display: "grid", gap: "0.85rem" }}>
        <div>
          <h2>Novo paciente</h2>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>
            Use este formulario apenas em validacoes dirigidas da superficie clinica preservada.
          </p>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Nome completo
            <input
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Maria Silva"
              value={form.fullName}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Nome preferido
            <input
              onChange={(event) =>
                setForm((current) => ({ ...current, preferredName: event.target.value }))
              }
              placeholder="Maria"
              value={form.preferredName}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Prontuario
            <input
              onChange={(event) =>
                setForm((current) => ({ ...current, medicalRecordNumber: event.target.value }))
              }
              placeholder="BH-001"
              value={form.medicalRecordNumber}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Nascimento
            <input
              onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))}
              type="date"
              value={form.birthDate}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Telefone
            <input
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="(11) 99999-0000"
              value={form.phone}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Email
            <input
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="paciente@clinic.local"
              value={form.email}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            DUM
            <input
              onChange={(event) =>
                setForm((current) => ({ ...current, lastMenstrualPeriod: event.target.value }))
              }
              type="date"
              value={form.lastMenstrualPeriod}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Risco gestacional
            <select
              onChange={(event) => setForm((current) => ({ ...current, riskLevel: event.target.value as CreatePatientForm["riskLevel"] }))}
              value={form.riskLevel}
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
            disabled={!form.fullName.trim() || isPending}
            onClick={submitCreatePatient}
            type="button"
          >
            {isPending ? "Salvando..." : "Criar paciente"}
          </button>
        </div>
      </section>

      <section className="panel" style={{ display: "grid", gap: "0.85rem" }}>
        <div className="filter-row">
          <input
            aria-label="Buscar pacientes"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, email ou prontuario"
            value={search}
          />
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
          <select onChange={(event) => setRiskLevel(event.target.value)} value={riskLevel}>
            <option value="">Todo risco</option>
            <option value="LOW">Baixo</option>
            <option value="MODERATE">Moderado</option>
            <option value="HIGH">Alto</option>
          </select>
        </div>

        {error ? <p style={{ color: "#9d0208", margin: 0 }}>{error}</p> : null}
        {isLoading ? <p style={{ margin: 0 }}>Carregando pacientes...</p> : null}

        {!isLoading && patients.length === 0 ? (
          <div className="panel" style={{ padding: "1rem" }}>
            <strong>Nenhum paciente encontrado</strong>
            <p style={{ marginBottom: 0 }}>
              Ajuste os filtros ou crie um cadastro de avaliacao para explorar a superficie clinica preservada.
            </p>
          </div>
        ) : null}

        {!isLoading ? (
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {patients.map((entry) => (
              <article key={entry.patient.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
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
                  <span>DPP: {entry.activePregnancy?.estimatedDeliveryDate ? new Date(entry.activePregnancy.estimatedDeliveryDate).toLocaleDateString("pt-BR") : "Nao calculada"}</span>
                  <span>Alertas: {entry.alertCount}</span>
                  <span>
                    Proxima consulta:{" "}
                    {entry.nextAppointment
                      ? new Date(entry.nextAppointment.scheduledAt).toLocaleString("pt-BR")
                      : "Nao agendada"}
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
    </section>
  );
}
