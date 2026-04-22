import Link from "next/link";

import type { AppointmentSnapshot, AppointmentsResponse } from "./clinical-data";
import type {
  AppointmentFormState,
  AppointmentsBoardView
} from "./appointments-board.model";

const fieldStyle = { display: "grid", gap: "0.35rem" } as const;
const formGridStyle = {
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))"
} as const;

interface AppointmentsBoardHeaderProps {
  description: string;
  patientId?: string;
  title: string;
}

export function AppointmentsBoardHeader({
  description,
  patientId,
  title
}: Readonly<AppointmentsBoardHeaderProps>) {
  return (
    <header className="hero-card">
      <span className="badge">Agenda clinica</span>
      <h1>{title}</h1>
      <p style={{ marginBottom: 0 }}>{description}</p>
      {patientId ? (
        <div className="hero-actions" style={{ marginTop: "0.9rem" }}>
          <Link href={`/patients/${patientId}`}>Voltar ao prontuario</Link>
          <Link className="ghost-button" href="/appointments">
            Abrir agenda geral
          </Link>
        </div>
      ) : null}
    </header>
  );
}

interface AppointmentsBoardFiltersSectionProps {
  date: string;
  error: string | null;
  isLoading: boolean;
  onDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onViewChange: (value: AppointmentsBoardView) => void;
  status: string;
  summary: AppointmentsResponse["summary"] | null;
  view: AppointmentsBoardView;
  windowLabel: string;
}

export function AppointmentsBoardFiltersSection({
  date,
  error,
  isLoading,
  onDateChange,
  onStatusChange,
  onViewChange,
  status,
  summary,
  view,
  windowLabel
}: Readonly<AppointmentsBoardFiltersSectionProps>) {
  return (
    <section className="panel" style={{ display: "grid", gap: "0.85rem" }}>
      <div className="filter-row">
        <input onChange={(event) => onDateChange(event.target.value)} type="date" value={date} />
        <select onChange={(event) => onViewChange(event.target.value as AppointmentsBoardView)} value={view}>
          <option value="day">Dia</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
        </select>
        <select onChange={(event) => onStatusChange(event.target.value)} value={status}>
          <option value="">Todos os status</option>
          <option value="SCHEDULED">Agendada</option>
          <option value="CHECKED_IN">Check-in</option>
          <option value="COMPLETED">Concluida</option>
          <option value="CANCELLED">Cancelada</option>
          <option value="NO_SHOW">Falta</option>
        </select>
      </div>

      {error ? <p style={{ color: "#9d0208", margin: 0 }}>{error}</p> : null}
      {isLoading ? <p style={{ margin: 0 }}>Carregando agenda...</p> : null}

      {!isLoading && summary ? (
        <div className="stats-grid">
          <article>
            <small>Janela</small>
            <strong>{windowLabel}</strong>
          </article>
          <article>
            <small>Total</small>
            <strong>{summary.total}</strong>
          </article>
          <article>
            <small>Em aberto</small>
            <strong>{summary.scheduled}</strong>
          </article>
          <article>
            <small>Concluidas</small>
            <strong>{summary.completed}</strong>
          </article>
        </div>
      ) : null}
    </section>
  );
}

interface AppointmentsBoardCreateSectionProps {
  canSubmit: boolean;
  form: AppointmentFormState;
  isPending: boolean;
  patientId?: string;
  onSubmit: () => void;
  onUpdateForm: (patch: Partial<AppointmentFormState>) => void;
}

export function AppointmentsBoardCreateSection({
  canSubmit,
  form,
  isPending,
  patientId,
  onSubmit,
  onUpdateForm
}: Readonly<AppointmentsBoardCreateSectionProps>) {
  return (
    <section className="panel" style={{ display: "grid", gap: "0.85rem" }}>
      <h2 style={{ margin: 0 }}>Nova consulta</h2>
      <div className="stats-grid" style={formGridStyle}>
        {!patientId ? (
          <label style={fieldStyle}>
            Patient ID
            <input
              onChange={(event) => onUpdateForm({ patientId: event.target.value })}
              placeholder="cuid do paciente"
              value={form.patientId}
            />
          </label>
        ) : null}
        <label style={fieldStyle}>
          Data e hora
          <input
            onChange={(event) => onUpdateForm({ scheduledAt: event.target.value })}
            type="datetime-local"
            value={form.scheduledAt}
          />
        </label>
        <label style={fieldStyle}>
          Tipo
          <select
            onChange={(event) =>
              onUpdateForm({ type: event.target.value as AppointmentFormState["type"] })
            }
            value={form.type}
          >
            <option value="PRENATAL">Prenatal</option>
            <option value="ULTRASOUND">Ultrassom</option>
            <option value="EXAM">Exame</option>
            <option value="POSTPARTUM">Puerperio</option>
            <option value="VACCINATION">Vacinacao</option>
          </select>
        </label>
        <label style={fieldStyle}>
          Profissional
          <input
            onChange={(event) => onUpdateForm({ providerName: event.target.value })}
            value={form.providerName}
          />
        </label>
        <label style={fieldStyle}>
          Queixa principal
          <input
            onChange={(event) => onUpdateForm({ chiefComplaint: event.target.value })}
            value={form.chiefComplaint}
          />
        </label>
        <label style={fieldStyle}>
          Sistolica
          <input
            onChange={(event) => onUpdateForm({ bloodPressureSystolic: event.target.value })}
            value={form.bloodPressureSystolic}
          />
        </label>
        <label style={fieldStyle}>
          Diastolica
          <input
            onChange={(event) => onUpdateForm({ bloodPressureDiastolic: event.target.value })}
            value={form.bloodPressureDiastolic}
          />
        </label>
        <label style={fieldStyle}>
          FCF
          <input
            onChange={(event) => onUpdateForm({ fetalHeartRateBpm: event.target.value })}
            value={form.fetalHeartRateBpm}
          />
        </label>
        <label style={fieldStyle}>
          Peso fetal (g)
          <input
            onChange={(event) => onUpdateForm({ fetalWeightGrams: event.target.value })}
            value={form.fetalWeightGrams}
          />
        </label>
      </div>
      <label style={fieldStyle}>
        Resumo
        <textarea
          onChange={(event) => onUpdateForm({ summary: event.target.value })}
          rows={3}
          value={form.summary}
        />
      </label>
      <button className="action-button" disabled={!canSubmit} onClick={onSubmit} type="button">
        {isPending ? "Salvando..." : "Criar consulta"}
      </button>
    </section>
  );
}

interface AppointmentsBoardTableSectionProps {
  appointments: AppointmentSnapshot[];
  isLoading: boolean;
  onChangeStatus: (
    appointmentId: string,
    nextStatus: AppointmentSnapshot["status"]
  ) => void;
  onRemove: (appointmentId: string) => void;
  patientName?: string;
}

export function AppointmentsBoardTableSection({
  appointments,
  isLoading,
  onChangeStatus,
  onRemove,
  patientName
}: Readonly<AppointmentsBoardTableSectionProps>) {
  return (
    <section className="panel">
      <h2 style={{ marginTop: 0 }}>Consultas</h2>
      {!isLoading && appointments.length === 0 ? (
        <p style={{ marginBottom: 0 }}>Nenhuma consulta nesta janela.</p>
      ) : null}
      {appointments.length > 0 ? (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Data</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Indicadores</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <strong>
                      {appointment.patient?.preferredName ??
                        appointment.patient?.fullName ??
                        patientName ??
                        appointment.patientId}
                    </strong>
                    {appointment.patient?.id ? (
                      <div>
                        <Link href={`/patients/${appointment.patient.id}`}>Abrir</Link>
                      </div>
                    ) : null}
                  </td>
                  <td>{new Date(appointment.scheduledAt).toLocaleString("pt-BR")}</td>
                  <td>{appointment.type}</td>
                  <td>{appointment.status}</td>
                  <td>
                    PA {appointment.bloodPressureSystolic ?? "-"} /{" "}
                    {appointment.bloodPressureDiastolic ?? "-"}
                    <br />
                    FCF {appointment.fetalHeartRateBpm ?? "-"} · Peso{" "}
                    {appointment.fetalWeightGrams ?? "-"}
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: "0.45rem" }}>
                      <select
                        defaultValue={appointment.status}
                        onChange={(event) =>
                          onChangeStatus(
                            appointment.id,
                            event.target.value as AppointmentSnapshot["status"]
                          )
                        }
                      >
                        <option value="SCHEDULED">Agendada</option>
                        <option value="CHECKED_IN">Check-in</option>
                        <option value="COMPLETED">Concluida</option>
                        <option value="CANCELLED">Cancelada</option>
                        <option value="NO_SHOW">Falta</option>
                      </select>
                      <button className="danger-button" onClick={() => onRemove(appointment.id)} type="button">
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

