import type { CSSProperties } from "react";

const sectionCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid var(--border)",
  borderRadius: "1.25rem",
  display: "grid",
  gap: "1rem",
  padding: "1rem"
};

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
