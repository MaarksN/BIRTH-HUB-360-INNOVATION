"use client";

import Link from "next/link";

import type { PatientDetailResponse } from "../clinical-data";

export type PatientFormState = {
  allergies: string;
  bloodType: string;
  chronicConditions: string;
  email: string;
  fullName: string;
  notes: string;
  phone: string;
  preferredName: string;
  status: "ACTIVE" | "ARCHIVED" | "INACTIVE";
};

export type PregnancyFormState = {
  complications: string;
  fetalCount: string;
  gravidity: string;
  lastMenstrualPeriod: string;
  notes: string;
  parity: string;
  previousCesareans: string;
  riskLevel: "" | "HIGH" | "LOW" | "MODERATE";
  status: "" | "ACTIVE" | "CLOSED" | "DELIVERED";
};

export type NoteFormState = {
  assessment: string;
  objective: string;
  plan: string;
  subjective: string;
  title: string;
};

export type NeonatalFormState = {
  apgar1: string;
  apgar5: string;
  birthWeightGrams: string;
  bornAt: string;
  newbornName: string;
  notes: string;
  outcome: "" | "ALIVE" | "ICU" | "STILLBIRTH" | "TRANSFERRED";
  sex: "" | "FEMALE" | "MALE" | "UNDETERMINED";
};

export function PatientAlertsSection(props: { alerts: PatientDetailResponse["alerts"] }) {
  return (
    <section className="stats-grid">
      {props.alerts.length === 0 ? (
        <article>
          <small>Alertas</small>
          <strong>0</strong>
          <p style={{ marginBottom: 0 }}>Nenhum alerta clinico ativo com as regras minimas da fase.</p>
        </article>
      ) : (
        props.alerts.map((alert) => (
          <article
            key={alert.id}
            style={{
              borderLeft: `4px solid ${
                alert.severity === "high"
                  ? "#c1121f"
                  : alert.severity === "medium"
                    ? "#f59e0b"
                    : "#0f766e"
              }`
            }}
          >
            <small>{alert.severity.toUpperCase()}</small>
            <strong>{alert.title}</strong>
            <p style={{ marginBottom: 0 }}>{alert.description}</p>
          </article>
        ))
      )}
    </section>
  );
}

export function PatientProfileSection(props: {
  isPending: boolean;
  onChangeField: (field: keyof PatientFormState, value: string) => void;
  onRemovePatient: () => void;
  onSubmitPatient: () => void;
  patientForm: PatientFormState;
}) {
  return (
    <article style={{ display: "grid", gap: "0.85rem" }}>
      <div>
        <h2 style={{ margin: 0 }}>Dados da paciente</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Edicao rapida do cadastro canonico com suporte a alergias e cronicos.
        </p>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Nome completo
          <input onChange={(event) => props.onChangeField("fullName", event.target.value)} value={props.patientForm.fullName} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Nome preferido
          <input onChange={(event) => props.onChangeField("preferredName", event.target.value)} value={props.patientForm.preferredName} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Telefone
          <input onChange={(event) => props.onChangeField("phone", event.target.value)} value={props.patientForm.phone} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Email
          <input onChange={(event) => props.onChangeField("email", event.target.value)} value={props.patientForm.email} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Tipo sanguineo
          <input onChange={(event) => props.onChangeField("bloodType", event.target.value)} value={props.patientForm.bloodType} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Status
          <select onChange={(event) => props.onChangeField("status", event.target.value)} value={props.patientForm.status}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
        </label>
      </div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        Alergias
        <input onChange={(event) => props.onChangeField("allergies", event.target.value)} placeholder="latex, dipirona" value={props.patientForm.allergies} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        Condicoes cronicas
        <input onChange={(event) => props.onChangeField("chronicConditions", event.target.value)} placeholder="hipertensao, diabetes" value={props.patientForm.chronicConditions} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        Observacoes
        <textarea onChange={(event) => props.onChangeField("notes", event.target.value)} rows={4} value={props.patientForm.notes} />
      </label>
      <div className="panel-actions">
        <button className="action-button" disabled={props.isPending} onClick={props.onSubmitPatient} type="button">
          {props.isPending ? "Salvando..." : "Salvar cadastro"}
        </button>
        <button className="danger-button" disabled={props.isPending} onClick={props.onRemovePatient} type="button">
          Arquivar paciente
        </button>
      </div>
    </article>
  );
}

export function PatientPregnancySection(props: {
  detail: PatientDetailResponse;
  isPending: boolean;
  manualDueDate: string | null;
  onChangeField: (field: keyof PregnancyFormState, value: string) => void;
  onSubmitPregnancy: () => void;
  pregnancyForm: PregnancyFormState;
}) {
  return (
    <article style={{ display: "grid", gap: "0.85rem" }}>
      <div>
        <h2 style={{ margin: 0 }}>Gestacao ativa e DPP</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>Base de DPP, idade gestacional e rastreio de risco usada pela fase.</p>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          DUM
          <input onChange={(event) => props.onChangeField("lastMenstrualPeriod", event.target.value)} type="date" value={props.pregnancyForm.lastMenstrualPeriod} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Risco
          <select onChange={(event) => props.onChangeField("riskLevel", event.target.value)} value={props.pregnancyForm.riskLevel}>
            <option value="">Nao definido</option>
            <option value="LOW">Baixo</option>
            <option value="MODERATE">Moderado</option>
            <option value="HIGH">Alto</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Status
          <select onChange={(event) => props.onChangeField("status", event.target.value)} value={props.pregnancyForm.status}>
            <option value="">Nao definido</option>
            <option value="ACTIVE">Ativa</option>
            <option value="DELIVERED">Encerrada com parto</option>
            <option value="CLOSED">Fechada</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Gesta
          <input onChange={(event) => props.onChangeField("gravidity", event.target.value)} value={props.pregnancyForm.gravidity} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Para
          <input onChange={(event) => props.onChangeField("parity", event.target.value)} value={props.pregnancyForm.parity} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Cesareas previas
          <input onChange={(event) => props.onChangeField("previousCesareans", event.target.value)} value={props.pregnancyForm.previousCesareans} />
        </label>
      </div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        Complicacoes
        <input onChange={(event) => props.onChangeField("complications", event.target.value)} placeholder="hipertensao gestacional, anemia" value={props.pregnancyForm.complications} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        Observacoes da gestacao
        <textarea onChange={(event) => props.onChangeField("notes", event.target.value)} rows={4} value={props.pregnancyForm.notes} />
      </label>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <article>
          <small>DPP calculada</small>
          <strong>{props.manualDueDate ? new Date(props.manualDueDate).toLocaleDateString("pt-BR") : "N/D"}</strong>
        </article>
        <article>
          <small>IG atual</small>
          <strong>{props.detail.activePregnancy?.gestationalAgeLabel ?? "N/D"}</strong>
        </article>
        <article>
          <small>Dias para DPP</small>
          <strong>{props.detail.activePregnancy?.daysUntilDueDate ?? "N/D"}</strong>
        </article>
      </div>
      <div className="panel-actions">
        <button className="action-button" disabled={props.isPending} onClick={props.onSubmitPregnancy} type="button">
          {props.isPending ? "Salvando..." : "Salvar gestacao"}
        </button>
      </div>
    </article>
  );
}

export function GrowthCurveSection(props: { detail: PatientDetailResponse; growthPath: string }) {
  return (
    <article style={{ display: "grid", gap: "0.8rem" }}>
      <div>
        <h2 style={{ margin: 0 }}>Curva de crescimento fetal</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>Base visual a partir do peso fetal registrado nas consultas. Uso de apoio, nao diagnostico.</p>
      </div>
      {props.detail.growthCurve.length === 0 ? (
        <p style={{ marginBottom: 0 }}>Sem medidas de peso fetal suficientes para desenhar a curva.</p>
      ) : (
        <>
          <svg height="180" style={{ background: "#f8fafc", borderRadius: 20, width: "100%" }} viewBox="0 0 420 180">
            <path d={props.growthPath} fill="none" stroke="#0f766e" strokeWidth="4" />
          </svg>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Peso fetal</th>
                  <th>Referencia</th>
                  <th>Desvio</th>
                </tr>
              </thead>
              <tbody>
                {props.detail.growthCurve.map((point) => (
                  <tr key={point.appointmentId}>
                    <td>{point.gestationalWeek}</td>
                    <td>{point.fetalWeightGrams} g</td>
                    <td>{point.referenceGrams ? `${point.referenceGrams} g` : "N/D"}</td>
                    <td>{point.deviationPercent !== null ? `${point.deviationPercent}%` : "N/D"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </article>
  );
}

export function NeonatalSection(props: {
  detail: PatientDetailResponse;
  isPending: boolean;
  neonatalForm: NeonatalFormState;
  onChangeField: (field: keyof NeonatalFormState, value: string) => void;
  onSubmitNeonatal: () => void;
}) {
  return (
    <article style={{ display: "grid", gap: "0.8rem" }}>
      <div>
        <h2 style={{ margin: 0 }}>Nascimento / neonatal</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>Registro simplificado do desfecho com dados minimos do recem-nascido.</p>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Nome do bebe
          <input onChange={(event) => props.onChangeField("newbornName", event.target.value)} value={props.neonatalForm.newbornName} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Nascimento
          <input onChange={(event) => props.onChangeField("bornAt", event.target.value)} type="datetime-local" value={props.neonatalForm.bornAt} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Sexo
          <select onChange={(event) => props.onChangeField("sex", event.target.value)} value={props.neonatalForm.sex}>
            <option value="">Nao informar</option>
            <option value="FEMALE">Feminino</option>
            <option value="MALE">Masculino</option>
            <option value="UNDETERMINED">Indeterminado</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Peso (g)
          <input onChange={(event) => props.onChangeField("birthWeightGrams", event.target.value)} value={props.neonatalForm.birthWeightGrams} />
        </label>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Apgar 1
          <input onChange={(event) => props.onChangeField("apgar1", event.target.value)} value={props.neonatalForm.apgar1} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Apgar 5
          <input onChange={(event) => props.onChangeField("apgar5", event.target.value)} value={props.neonatalForm.apgar5} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Desfecho
          <select onChange={(event) => props.onChangeField("outcome", event.target.value)} value={props.neonatalForm.outcome}>
            <option value="">Padrao</option>
            <option value="ALIVE">Vivo</option>
            <option value="ICU">UTI</option>
            <option value="TRANSFERRED">Transferido</option>
            <option value="STILLBIRTH">Natimorto</option>
          </select>
        </label>
      </div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        Observacoes
        <textarea onChange={(event) => props.onChangeField("notes", event.target.value)} rows={3} value={props.neonatalForm.notes} />
      </label>
      <button className="action-button" disabled={!props.neonatalForm.bornAt || props.isPending} onClick={props.onSubmitNeonatal} type="button">
        {props.isPending ? "Salvando..." : "Registrar nascimento"}
      </button>
      <div style={{ display: "grid", gap: "0.55rem" }}>
        {props.detail.neonatalRecords.length === 0 ? <p style={{ margin: 0 }}>Nenhum registro neonatal ainda.</p> : null}
        {props.detail.neonatalRecords.map((record) => (
          <div key={record.id} style={{ border: "1px solid var(--border)", borderRadius: 18, padding: "0.8rem" }}>
            <strong>{record.newbornName ?? "Recem-nascido sem nome"}</strong>
            <p style={{ margin: "0.35rem 0 0" }}>
              {new Date(record.bornAt).toLocaleString("pt-BR")} · {record.birthWeightGrams ?? "N/D"} g · {record.outcome}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function ClinicalNotesSection(props: {
  detail: PatientDetailResponse;
  editingNoteGroupId: string | null;
  isPending: boolean;
  noteForm: NoteFormState;
  onChangeField: (field: keyof NoteFormState, value: string) => void;
  onDeleteNote: (noteGroupId: string) => void;
  onStartNewNote: () => void;
  onStartVersion: (note: PatientDetailResponse["clinicalNotes"][number]) => void;
  onSubmitNote: () => void;
}) {
  return (
    <section className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <article style={{ display: "grid", gap: "0.8rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Notas clinicas</h2>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>Edicao cria nova versao, preservando historico do atendimento.</p>
          </div>
          <button className="ghost-button" onClick={props.onStartNewNote} type="button">
            Nova nota
          </button>
        </div>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Titulo
          <input onChange={(event) => props.onChangeField("title", event.target.value)} value={props.noteForm.title} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Subjetivo
          <textarea onChange={(event) => props.onChangeField("subjective", event.target.value)} rows={3} value={props.noteForm.subjective} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Objetivo
          <textarea onChange={(event) => props.onChangeField("objective", event.target.value)} rows={3} value={props.noteForm.objective} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Avaliacao
          <textarea onChange={(event) => props.onChangeField("assessment", event.target.value)} rows={3} value={props.noteForm.assessment} />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Plano
          <textarea onChange={(event) => props.onChangeField("plan", event.target.value)} rows={3} value={props.noteForm.plan} />
        </label>
        <button className="action-button" disabled={props.isPending} onClick={props.onSubmitNote} type="button">
          {props.isPending ? "Salvando..." : props.editingNoteGroupId ? "Criar nova versao" : "Salvar nota"}
        </button>
      </article>

      <article style={{ display: "grid", gap: "0.8rem" }}>
        <h2 style={{ margin: 0 }}>Historico recente</h2>
        {props.detail.clinicalNotes.length === 0 ? <p style={{ margin: 0 }}>Nenhuma nota clinica registrada.</p> : null}
        {props.detail.clinicalNotes.map((note) => (
          <div key={note.id} style={{ border: "1px solid var(--border)", borderRadius: 18, padding: "0.9rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between" }}>
              <strong>{note.title ?? note.kind}</strong>
              <span className="badge">v{note.version}</span>
            </div>
            <p style={{ color: "var(--muted)", margin: "0.35rem 0 0.65rem" }}>
              {new Date(note.updatedAt).toLocaleString("pt-BR")} · {note.author?.name ?? "Sem autoria"}
            </p>
            <p style={{ marginBottom: "0.65rem" }}>{note.assessment ?? note.subjective ?? "Sem resumo"}</p>
            <div className="panel-actions">
              <button className="ghost-button" onClick={() => props.onStartVersion(note)} type="button">
                Nova versao
              </button>
              <button className="danger-button" onClick={() => props.onDeleteNote(note.noteGroupId)} type="button">
                Remover
              </button>
            </div>
          </div>
        ))}
      </article>
    </section>
  );
}

export function RecentAppointmentsSection(props: { detail: PatientDetailResponse }) {
  return (
    <section className="panel">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Consultas recentes</h2>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>Ultimas consultas registradas e atalhos para agenda completa.</p>
        </div>
        <Link className="action-button" href={`/patients/${props.detail.patient.id}/appointments`}>
          Gerenciar consultas
        </Link>
      </div>
      {props.detail.recentAppointments.length === 0 ? (
        <p style={{ marginBottom: 0 }}>Nenhuma consulta registrada ainda.</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Resumo</th>
              </tr>
            </thead>
            <tbody>
              {props.detail.recentAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{new Date(appointment.scheduledAt).toLocaleString("pt-BR")}</td>
                  <td>{appointment.type}</td>
                  <td>{appointment.status}</td>
                  <td>{appointment.summary ?? appointment.chiefComplaint ?? "Sem resumo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
