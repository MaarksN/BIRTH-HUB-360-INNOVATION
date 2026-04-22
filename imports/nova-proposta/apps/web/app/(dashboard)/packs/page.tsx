"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fetchWithSession } from "../../../lib/auth-client";
import {
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT,
  isExecutivePremiumPack
} from "../../../lib/executive-premium";

type PackStatus = {
  installedVersion: string;
  latestAvailableVersion: string;
  packId: string;
  status: "active" | "degraded" | "failed" | "installed";
};

const PACKS_REQUEST_TIMEOUT_MS = 8_000;

function buildHeaders() {
  return {
    "content-type": "application/json"
  };
}

function badgeTone(status: PackStatus["status"]): string {
  if (status === "active") {
    return "#1b4332";
  }

  if (status === "installed" || status === "degraded") {
    return "#9f4d00";
  }

  return "#9d0208";
}

type ExecutivePremiumSummaryProps = {
  activeCount: number;
  packs: PackStatus[];
};

function ExecutivePremiumSummary({ activeCount, packs }: ExecutivePremiumSummaryProps) {
  const hasPremium = packs.length > 0;
  const cardStyle = {
    background: hasPremium
      ? "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,58,138,0.92))"
      : "rgba(255,255,255,0.9)",
    border: hasPremium ? "1px solid rgba(148, 163, 184, 0.28)" : "1px solid var(--border)",
    borderRadius: 18,
    color: hasPremium ? "#f8fafc" : "inherit",
    display: "grid",
    gap: "0.7rem",
    padding: "1rem"
  } as const;
  const labelStyle = {
    color: hasPremium ? "rgba(248,250,252,0.78)" : "var(--muted)",
    letterSpacing: "0.08em",
    textTransform: "uppercase"
  } as const;
  const summaryStyle = {
    color: hasPremium ? "rgba(248,250,252,0.9)" : "var(--muted)",
    margin: 0
  } as const;
  const badgeStyle = {
    background: hasPremium ? "rgba(255,255,255,0.12)" : "rgba(30,58,138,0.08)",
    border: hasPremium ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(30,58,138,0.14)",
    borderRadius: 999,
    padding: "0.35rem 0.75rem"
  } as const;

  return (
    <section style={cardStyle}>
      <div style={{ display: "grid", gap: "0.3rem" }}>
        <small style={labelStyle}>Executive Premium</small>
        <strong style={{ fontSize: "1.05rem" }}>
          {hasPremium
            ? "Colecao premium executiva instalada neste tenant"
            : "Colecao premium executiva disponivel para instalar"}
        </strong>
        <p style={summaryStyle}>
          {hasPremium
            ? "Os agentes premium executivos agora aparecem com governanca reforcada, memoria decisoria e camadas premium compartilhadas."
            : "Instale os agentes executivos premium para trazer score de evidencia, radar de risco, handoff governado e narrativa executiva para board e C-level."}
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        <span style={badgeStyle}>{packs.length} packs premium</span>
        <span style={badgeStyle}>{activeCount} ativos</span>
        <span style={badgeStyle}>{EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} camadas premium</span>
      </div>
    </section>
  );
}

type PackCardProps = {
  onUninstall: (packId: string) => void;
  onUpdate: (packId: string) => void;
  pack: PackStatus;
};

function PackCard({ onUninstall, onUpdate, pack }: PackCardProps) {
  const isPremium = isExecutivePremiumPack(pack.packId);
  const hasUpdate = pack.latestAvailableVersion !== pack.installedVersion;
  const cardStyle = {
    background: isPremium
      ? "linear-gradient(180deg, rgba(30,58,138,0.1), rgba(255,255,255,0.92))"
      : "rgba(255,255,255,0.88)",
    border: isPremium ? "1px solid rgba(30,58,138,0.22)" : "1px solid var(--border)",
    borderRadius: 16,
    display: "grid",
    gap: "0.6rem",
    padding: "1rem"
  } as const;

  return (
    <article key={pack.packId} style={cardStyle}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <strong>{pack.packId}</strong>
        <span style={{ color: badgeTone(pack.status), fontWeight: 700, textTransform: "uppercase" }}>
          {pack.status}
        </span>
      </div>
      {isPremium ? (
        <small
          style={{
            color: "var(--accent-strong)",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase"
          }}
        >
          Executive Premium
        </small>
      ) : null}
      <small>Instalado: {pack.installedVersion}</small>
      <small>Disponivel: {pack.latestAvailableVersion}</small>
      {hasUpdate ? (
        <small style={{ color: "#9f4d00" }}>Update disponivel para {pack.latestAvailableVersion}</small>
      ) : (
        <small style={{ color: "var(--muted)" }}>Sem update pendente no momento.</small>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => void onUpdate(pack.packId)} type="button">
          Update to v2.0
        </button>
        <button onClick={() => void onUninstall(pack.packId)} type="button">
          Desinstalar
        </button>
      </div>
    </article>
  );
}

type PackGridProps = {
  onUninstall: (packId: string) => void;
  onUpdate: (packId: string) => void;
  packs: PackStatus[];
};

function PackGrid({ onUninstall, onUpdate, packs }: PackGridProps) {
  return (
    <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
      {packs.length === 0 ? (
        <article
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "1rem"
          }}
        >
          Nenhum pack instalado para este tenant.
        </article>
      ) : (
        packs.map((pack) => (
          <PackCard
            key={pack.packId}
            onUninstall={onUninstall}
            onUpdate={onUpdate}
            pack={pack}
          />
        ))
      )}
    </div>
  );
}

type MessageFeedbackProps = {
  message: string;
};

function MessageFeedback({ message }: MessageFeedbackProps) {
  if (!message) {
    return null;
  }

  return <small style={{ color: "var(--accent-strong)" }}>{message}</small>;
}
export default function PacksPage() {
  const [packs, setPacks] = useState<PackStatus[]>([]);
  const [message, setMessage] = useState("");

  const executivePremiumPacks = packs.filter((pack) => isExecutivePremiumPack(pack.packId));
  const executivePremiumActiveCount = executivePremiumPacks.filter((pack) => pack.status === "active").length;

  async function refresh(): Promise<void> {
    const response = await fetchWithSession("/api/v1/packs/status", {
      headers: buildHeaders(),
      timeoutMessage: `Falha ao carregar packs dentro do limite de ${PACKS_REQUEST_TIMEOUT_MS}ms.`,
      timeoutMs: PACKS_REQUEST_TIMEOUT_MS
    });

    if (!response.ok) {
      setMessage(`Falha ao carregar packs (${response.status}).`);
      return;
    }

    const payload = (await response.json()) as { packs: PackStatus[] };
    setPacks(payload.packs);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function updateToV2(packId: string): Promise<void> {
    setMessage(`Sinalizando update ${packId} -> v2.0...`);

    const response = await fetchWithSession(`/api/v1/packs/${encodeURIComponent(packId)}/version`, {
      body: JSON.stringify({
        latestAvailableVersion: "2.0.0"
      }),
      headers: buildHeaders(),
      method: "POST",
      timeoutMessage: `Falha ao atualizar pack dentro do limite de ${PACKS_REQUEST_TIMEOUT_MS}ms.`,
      timeoutMs: PACKS_REQUEST_TIMEOUT_MS
    });

    setMessage(response.ok ? `Pack ${packId} sinalizado para update v2.0.` : `Falha ao atualizar ${packId}.`);
    if (response.ok) {
      await refresh();
    }
  }

  async function uninstall(packId: string): Promise<void> {
    setMessage(`Desinstalando ${packId}...`);

    const response = await fetchWithSession("/api/v1/packs/uninstall", {
      body: JSON.stringify({ packId }),
      headers: buildHeaders(),
      method: "POST",
      timeoutMessage: `Falha ao remover pack dentro do limite de ${PACKS_REQUEST_TIMEOUT_MS}ms.`,
      timeoutMs: PACKS_REQUEST_TIMEOUT_MS
    });

    setMessage(response.ok ? `Pack ${packId} removido.` : `Falha ao remover ${packId}.`);
    if (response.ok) {
      await refresh();
    }
  }

  return (
    <main style={{ display: "grid", gap: "1rem", padding: "1.5rem" }}>
      <header style={{ display: "grid", gap: "0.4rem" }}>
        <h1 style={{ margin: 0 }}>Status dos Packs Instalados</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Painel para monitorar packs `active`, `degraded`, `failed` e acionar update para v2.0.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link href={EXECUTIVE_PREMIUM_COLLECTION_HREF}>Abrir colecao premium executiva</Link>
          <Link href="/sales-os">Ver no Sales OS</Link>
        </div>
      </header>

      <ExecutivePremiumSummary
        activeCount={executivePremiumActiveCount}
        packs={executivePremiumPacks}
      />

      <PackGrid onUninstall={uninstall} onUpdate={updateToV2} packs={packs} />

      <MessageFeedback message={message} />
    </main>
  );
}

