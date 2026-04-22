"use client";

import { useMemo, useState, useTransition } from "react";

import { getStoredSession } from "../../../../lib/auth-client";

import {
  DELETE_CONFIRMATION,
  clearStoredPrivacySession,
  exportPrivacyData,
  getErrorMessage,
  requestPrivacyAccountDeletion
} from "./privacy-self-service.data";
import {
  PrivacyDeletionSection,
  PrivacyExportSection
} from "./privacy-self-service.sections";

export default function PrivacySelfServicePageClient() {
  const session = useMemo(() => getStoredSession(), []);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const downloadExport = () => {
    startTransition(() => {
      void (async () => {
        try {
          setError(null);
          setNotice("Gerando exportacao do tenant...");

          const exportPayload = await exportPrivacyData();
          const url = URL.createObjectURL(exportPayload.blob);
          const link = document.createElement("a");

          link.href = url;
          link.download = exportPayload.fileName;
          link.click();
          URL.revokeObjectURL(url);
          setNotice("Exportacao concluida.");
        } catch (requestError) {
          setError(getErrorMessage(requestError, "Falha ao exportar dados."));
        }
      })();
    });
  };

  const requestDeletion = () => {
    startTransition(() => {
      void (async () => {
        try {
          setError(null);
          setNotice("Processando exclusao e anonimizacao da conta...");

          await requestPrivacyAccountDeletion(confirmation);
          clearStoredPrivacySession();
          window.location.assign("/login");
        } catch (requestError) {
          setError(getErrorMessage(requestError, "Falha ao excluir conta."));
        }
      })();
    });
  };

  return (
    <section style={{ display: "grid", gap: "1.25rem" }}>
      <header style={{ display: "grid", gap: "0.4rem" }}>
        <span className="badge">Privacidade self-service</span>
        <h1 style={{ margin: 0 }}>Portabilidade e exclusao</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Exportacao e exclusao de conta seguem ativos. Consentimentos avancados e retencao LGPD
          ficaram explicitamente desativados nesta implantacao ate que o schema e o dominio
          retornem com sustentacao end-to-end.
        </p>
      </header>

      <article
        style={{
          background: "rgba(255,255,255,0.78)",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: "1.25rem",
          display: "grid",
          gap: "0.75rem",
          padding: "1rem"
        }}
      >
        <strong>Superficies avancadas fora do fluxo ativo</strong>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          O produto nao exibe nem tenta operar consentimentos auditaveis por finalidade, politica
          de retencao, historico de execucoes ou dry-run manual enquanto os modelos
          `privacyConsent`, `privacyConsentEvent`, `dataRetentionPolicy` e
          `dataRetentionExecution` nao existirem de forma consistente no schema e no runtime.
        </p>
      </article>

      <PrivacyExportSection isPending={isPending} onDownload={downloadExport} />
      <PrivacyDeletionSection
        confirmation={confirmation}
        deleteConfirmation={DELETE_CONFIRMATION}
        isPending={isPending}
        onChangeConfirmation={setConfirmation}
        onDelete={requestDeletion}
      />

      {session ? (
        <small style={{ color: "var(--muted)" }}>
          Usuario ativo: {session.userId} no tenant {session.tenantId}
        </small>
      ) : null}
      {error ? <p style={{ color: "#a11d2d", margin: 0 }}>{error}</p> : null}
      {notice ? <p style={{ color: "var(--accent-strong)", margin: 0 }}>{notice}</p> : null}
    </section>
  );
}
