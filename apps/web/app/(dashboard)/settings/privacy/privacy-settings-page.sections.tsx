import type { CSSProperties } from "react";

import {
  consentCopy,
  formatConsentStatus,
  formatDate,
  formatExecutionMode,
  formatRetentionAction,
  retentionCopy,
  type ConsentPurpose,
  type ConsentStatus,
  type PrivacyConsent,
  type PrivacyConsentEvent,
  type PrivacyConsentPreferences,
  type RetentionAction,
  type RetentionExecution,
  type RetentionPolicy,
  type RetentionRunResult
} from "./privacy-settings-page.data";

const sectionCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid var(--border)",
  borderRadius: "1.25rem",
  display: "grid",
  gap: "1rem",
  padding: "1rem"
};

export function PrivacyPageHeader() {
  return (
    <header style={{ display: "grid", gap: "0.4rem" }}>
      <span className="badge">LGPD e Privacy Ops</span>
      <h1 style={{ margin: 0 }}>Privacidade, consentimento e retencao</h1>
      <p style={{ color: "var(--muted)", margin: 0 }}>
        Esta tela concentra o baseline operacional de compliance: consentimentos LGPD,
        historico auditavel, politicas de retencao, exportacao e exclusao com anonimizacao.
      </p>
    </header>
  );
}

interface PrivacyConsentSectionProps {
  consentHistory: PrivacyConsentEvent[];
  consentPreferences: PrivacyConsentPreferences | null;
  consents: PrivacyConsent[];
  isLoading: boolean;
  isPending: boolean;
  onSave: () => void;
  onUpdateStatus: (purpose: ConsentPurpose, status: ConsentStatus) => void;
}

export function PrivacyConsentSection({
  consentHistory,
  consentPreferences,
  consents,
  isLoading,
  isPending,
  onSave,
  onUpdateStatus
}: Readonly<PrivacyConsentSectionProps>) {
  return (
    <article style={sectionCardStyle}>
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <strong>Consentimentos LGPD</strong>
        <p style={{ margin: 0 }}>
          Ajuste consentimentos por finalidade e acompanhe as ultimas alteracoes registradas.
        </p>
      </div>

      {consentPreferences ? (
        <div
          style={{
            background: "rgba(30, 58, 138,0.05)",
            border: "1px solid rgba(30, 58, 138,0.12)",
            borderRadius: "1rem",
            display: "grid",
            gap: "0.35rem",
            padding: "0.9rem"
          }}
        >
          <strong>Centro canonico de consentimento</strong>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Status geral: {consentPreferences.lgpdConsentStatus}. Base legal:{" "}
            {consentPreferences.lgpdLegalBasis.toLowerCase().replaceAll("_", " ")}. Versao ativa:{" "}
            {consentPreferences.lgpdConsentVersion}.
          </p>
          <small style={{ color: "var(--muted)" }}>
            Ultimo aceite registrado: {formatDate(consentPreferences.lgpdConsentedAt)}. Todas as
            alteracoes sao auditadas no backend e no historico abaixo.
          </small>
        </div>
      ) : null}

      {isLoading ? (
        <p style={{ color: "var(--muted)", margin: 0 }}>Carregando estado de privacidade...</p>
      ) : consents.length === 0 ? (
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Nenhum consentimento inicializado para o usuario atual.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {consents.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid rgba(15,23,42,0.08)",
                borderRadius: "1rem",
                display: "grid",
                gap: "0.6rem",
                padding: "0.9rem"
              }}
            >
              <div style={{ display: "grid", gap: "0.25rem" }}>
                <strong>{consentCopy[item.purpose].title}</strong>
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  {consentCopy[item.purpose].description}
                </p>
                <small style={{ color: "var(--muted)" }}>
                  Status atual: {formatConsentStatus(item.status)}. Ultima alteracao:{" "}
                  {formatDate(item.lastChangedAt)}.
                </small>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
                <button
                  disabled={isPending}
                  onClick={() => onUpdateStatus(item.purpose, "GRANTED")}
                  type="button"
                >
                  Conceder
                </button>
                <button
                  className="ghost-button"
                  disabled={isPending}
                  onClick={() => onUpdateStatus(item.purpose, "PENDING")}
                  type="button"
                >
                  Deixar pendente
                </button>
                <button
                  className="ghost-button"
                  disabled={isPending}
                  onClick={() => onUpdateStatus(item.purpose, "REVOKED")}
                  type="button"
                >
                  Revogar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <button disabled={isPending || isLoading || consents.length === 0} onClick={onSave} type="button">
          {isPending ? "Salvando..." : "Salvar consentimentos"}
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.5rem" }}>
        <strong>Historico recente</strong>
        {consentHistory.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Ainda nao ha eventos recentes de consentimento.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {consentHistory.slice(0, 8).map((event) => (
              <div
                key={event.id}
                style={{
                  borderTop: "1px solid rgba(15,23,42,0.08)",
                  display: "grid",
                  gap: "0.2rem",
                  paddingTop: "0.5rem"
                }}
              >
                <strong>{consentCopy[event.purpose].title}</strong>
                <small style={{ color: "var(--muted)" }}>
                  {formatDate(event.createdAt)} |{" "}
                  {formatConsentStatus(event.previousStatus ?? "PENDING")} para{" "}
                  {formatConsentStatus(event.newStatus)} via {event.source.toLowerCase()}.
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

interface PrivacyRetentionSectionProps {
  isLoading: boolean;
  isPending: boolean;
  retentionAccessDenied: boolean;
  retentionExecutions: RetentionExecution[];
  retentionPolicies: RetentionPolicy[];
  retentionRunItems: RetentionRunResult[];
  onRun: (mode: "DRY_RUN" | "MANUAL") => void;
  onSave: () => void;
  onUpdatePolicy: (
    dataCategory: RetentionPolicy["dataCategory"],
    next: Partial<Pick<RetentionPolicy, "action" | "enabled" | "retentionDays">>
  ) => void;
}

export function PrivacyRetentionSection({
  isLoading,
  isPending,
  retentionAccessDenied,
  retentionExecutions,
  retentionPolicies,
  retentionRunItems,
  onRun,
  onSave,
  onUpdatePolicy
}: Readonly<PrivacyRetentionSectionProps>) {
  return (
    <article style={sectionCardStyle}>
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <strong>Politica de retencao e anonimizacao</strong>
        <p style={{ margin: 0 }}>
          Owners podem revisar prazos por categoria, salvar a politica e executar dry-run antes
          da aplicacao manual.
        </p>
      </div>

      {retentionAccessDenied ? (
        <p style={{ color: "var(--muted)", margin: 0 }}>
          O estado de retencao esta disponivel apenas para o owner do tenant atual.
        </p>
      ) : isLoading ? (
        <p style={{ color: "var(--muted)", margin: 0 }}>Carregando politicas de retencao...</p>
      ) : retentionPolicies.length === 0 ? (
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Nenhuma politica carregada para o tenant atual.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {retentionPolicies.map((policy) => (
            <div
              key={policy.id}
              style={{
                border: "1px solid rgba(15,23,42,0.08)",
                borderRadius: "1rem",
                display: "grid",
                gap: "0.75rem",
                padding: "0.9rem"
              }}
            >
              <div style={{ display: "grid", gap: "0.25rem" }}>
                <strong>{policy.dataCategory}</strong>
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  {retentionCopy[policy.dataCategory]}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
                }}
              >
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Ativo</span>
                  <input
                    checked={policy.enabled}
                    onChange={(event) =>
                      onUpdatePolicy(policy.dataCategory, {
                        enabled: event.target.checked
                      })
                    }
                    type="checkbox"
                  />
                </label>
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Acao</span>
                  <select
                    onChange={(event) =>
                      onUpdatePolicy(policy.dataCategory, {
                        action: event.target.value as RetentionAction
                      })
                    }
                    value={policy.action}
                  >
                    <option value="ANONYMIZE">Anonimizar</option>
                    <option value="DELETE">Excluir</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Retencao (dias)</span>
                  <input
                    min={1}
                    onChange={(event) =>
                      onUpdatePolicy(policy.dataCategory, {
                        retentionDays: Number(event.target.value || policy.retentionDays)
                      })
                    }
                    type="number"
                    value={policy.retentionDays}
                  />
                </label>
              </div>

              <small style={{ color: "var(--muted)" }}>
                Base legal: {policy.legalBasis.toLowerCase().replaceAll("_", " ")}. Ultima
                atualizacao: {formatDate(policy.updatedAt)}. Acao atual:{" "}
                {formatRetentionAction(policy.action)}.
              </small>
            </div>
          ))}
        </div>
      )}

      {!retentionAccessDenied && retentionPolicies.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button disabled={isPending} onClick={onSave} type="button">
            {isPending ? "Salvando..." : "Salvar retencao"}
          </button>
          <button className="ghost-button" disabled={isPending} onClick={() => onRun("DRY_RUN")} type="button">
            Executar dry-run
          </button>
          <button className="ghost-button" disabled={isPending} onClick={() => onRun("MANUAL")} type="button">
            Executar agora
          </button>
        </div>
      ) : null}

      {!retentionAccessDenied ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <strong>Ultimas execucoes</strong>
          {retentionExecutions.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Nenhuma execucao de retencao registrada ate agora.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "0.45rem" }}>
              {retentionExecutions.slice(0, 8).map((execution) => (
                <div
                  key={execution.id}
                  style={{
                    borderTop: "1px solid rgba(15,23,42,0.08)",
                    display: "grid",
                    gap: "0.2rem",
                    paddingTop: "0.5rem"
                  }}
                >
                  <strong>{execution.dataCategory}</strong>
                  <small style={{ color: "var(--muted)" }}>
                    {formatDate(execution.createdAt)} | {formatExecutionMode(execution.mode)} |{" "}
                    {formatRetentionAction(execution.action)} | {execution.affectedCount} itens
                    afetados de {execution.scannedCount} avaliados.
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {!retentionAccessDenied && retentionRunItems.length > 0 ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <strong>Resultado da ultima execucao manual</strong>
          <div style={{ display: "grid", gap: "0.45rem" }}>
            {retentionRunItems.map((item) => (
              <div
                key={item.executionId}
                style={{
                  borderTop: "1px solid rgba(15,23,42,0.08)",
                  display: "grid",
                  gap: "0.2rem",
                  paddingTop: "0.5rem"
                }}
              >
                <strong>{item.dataCategory}</strong>
                <small style={{ color: "var(--muted)" }}>
                  {item.scannedCount} registros avaliados, {item.affectedCount} afetados.
                </small>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

interface PrivacyExportSectionProps {
  isPending: boolean;
  onDownload: () => void;
}

export function PrivacyExportSection({
  isPending,
  onDownload
}: Readonly<PrivacyExportSectionProps>) {
  return (
    <article style={sectionCardStyle}>
      <strong>Exportar meus dados</strong>
      <p style={{ margin: 0 }}>
        Gera um JSON consolidado do tenant atual, com organizacao, membros, workflows, billing,
        auditoria e metadados operacionais sem secrets.
      </p>
      <button disabled={isPending} onClick={onDownload} type="button">
        {isPending ? "Gerando..." : "Exportar meus dados"}
      </button>
    </article>
  );
}

interface PrivacyDeletionSectionProps {
  confirmation: string;
  deleteConfirmation: string;
  isPending: boolean;
  onChangeConfirmation: (value: string) => void;
  onDelete: () => void;
}

export function PrivacyDeletionSection({
  confirmation,
  deleteConfirmation,
  isPending,
  onChangeConfirmation,
  onDelete
}: Readonly<PrivacyDeletionSectionProps>) {
  return (
    <article
      style={{
        ...sectionCardStyle,
        border: "1px solid rgba(161,29,45,0.18)"
      }}
    >
      <strong>Solicitar exclusao de conta e dados pessoais</strong>
      <p style={{ margin: 0 }}>
        Fluxo estrito com soft-delete, obfuscacao de PII, revogacao de sessoes e cancelamento de
        cobranca do tenant quando aplicavel.
      </p>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Digite {deleteConfirmation}</span>
        <input onChange={(event) => onChangeConfirmation(event.target.value)} value={confirmation} />
      </label>
      <button
        disabled={isPending || confirmation !== deleteConfirmation}
        onClick={onDelete}
        type="button"
      >
        {isPending ? "Excluindo..." : "Solicitar Exclusao de Conta"}
      </button>
    </article>
  );
}

