"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

import { fetchWithSession } from "../../lib/auth-client";
import {
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT,
  isExecutivePremiumPack
} from "../../lib/executive-premium";

type Step = 1 | 2 | 3 | 4;

interface PackInstallerProps {
  apiUrl: string;
  availablePacks: Array<{
    description: string;
    id: string;
    name: string;
  }>;
}

const PACK_INSTALL_TIMEOUT_MS = 8_000;

export function PackInstaller({ apiUrl, availablePacks }: Readonly<PackInstallerProps>) {
  const defaultPackId =
    availablePacks.find((pack) => isExecutivePremiumPack(pack.id))?.id ?? availablePacks[0]?.id ?? "";
  const [step, setStep] = useState<Step>(1);
  const [selectedPackId, setSelectedPackId] = useState<string>(defaultPackId);
  const [activateAgents, setActivateAgents] = useState(true);
  const [connectors, setConnectors] = useState({
    crmProvider: "hubspot",
    emailProvider: "smtp",
    storageProvider: "s3"
  });
  const [status, setStatus] = useState<string>("");

  const selectedPack = useMemo(
    () => availablePacks.find((pack) => pack.id === selectedPackId) ?? availablePacks[0],
    [availablePacks, selectedPackId]
  );
  const selectedPackIsExecutivePremium = selectedPack ? isExecutivePremiumPack(selectedPack.id) : false;

  async function installPack(): Promise<void> {
    setStatus("Instalando agente oficial...");

    const response = await fetchWithSession(`${apiUrl}/api/v1/packs/install`, {
      body: JSON.stringify({
        activateAgents,
        agentId: selectedPackId,
        connectors,
        packId: selectedPackId
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      timeoutMessage: `Falha ao instalar pack dentro do limite de ${PACK_INSTALL_TIMEOUT_MS}ms.`,
      timeoutMs: PACK_INSTALL_TIMEOUT_MS
    });

    if (!response.ok) {
      setStatus(`Falha na instalacao (${response.status}).`);
      return;
    }

    setStatus("Agente oficial instalado com sucesso.");
    setStep(4);
  }

  return (
    <section
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        display: "grid",
        gap: "1rem",
        padding: "1rem"
      }}
    >
      <header style={{ display: "grid", gap: "0.3rem" }}>
        <strong>Official Agent Installer</strong>
        <small style={{ color: "var(--muted)" }}>Step {step} of 4</small>
        <small style={{ color: "var(--muted)" }}>
          Packs executivos premium aparecem priorizados no topo para ativacao rapida.
        </small>
      </header>

      {step === 1 ? (
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <label htmlFor="pack-select">Selecionar agente oficial</label>
          <select
            id="pack-select"
            onChange={(event) => setSelectedPackId(event.target.value)}
            value={selectedPackId}
          >
            {availablePacks.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {isExecutivePremiumPack(pack.id) ? `Premium · ${pack.name}` : pack.name}
              </option>
            ))}
          </select>
          {selectedPackIsExecutivePremium ? (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,58,138,0.92))",
                border: "1px solid rgba(148, 163, 184, 0.22)",
                borderRadius: 14,
                color: "#f8fafc",
                display: "grid",
                gap: "0.45rem",
                padding: "0.85rem"
              }}
            >
              <strong>Executive Premium pronto para instalar</strong>
              <small style={{ color: "rgba(248,250,252,0.82)" }}>
                {EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} camadas premium com governanca reforcada,
                score de evidencia e handoff executivo.
              </small>
              <Link href={EXECUTIVE_PREMIUM_COLLECTION_HREF} style={{ color: "#bfdbfe" }}>
                Ver colecao premium completa
              </Link>
            </div>
          ) : null}
          <button onClick={() => setStep(2)} type="button">
            Continuar
          </button>
        </div>
      ) : null}

      {step === 2 && selectedPack ? (
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <strong>{selectedPack.name}</strong>
          {selectedPackIsExecutivePremium ? (
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
          <p style={{ margin: 0 }}>{selectedPack.description}</p>
          {selectedPackIsExecutivePremium ? (
            <div
              style={{
                background: "rgba(30,58,138,0.08)",
                border: "1px solid rgba(30,58,138,0.16)",
                borderRadius: 14,
                display: "grid",
                gap: "0.35rem",
                padding: "0.85rem"
              }}
            >
              <small>
                Recomendado para board, C-level, estrategia, risco, memoria decisoria e handoff
                entre especialistas.
              </small>
              <small>
                Inclui {EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} camadas premium compartilhadas para
                recomendacao prescritiva e governanca.
              </small>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setStep(1)} type="button">
              Voltar
            </button>
            <button onClick={() => setStep(3)} type="button">
              Configurar conectores
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <label>
            CRM
            <select
              onChange={(event) =>
                setConnectors((current) => ({ ...current, crmProvider: event.target.value }))
              }
              value={connectors.crmProvider}
            >
              <option value="hubspot">HubSpot</option>
              <option value="salesforce">Salesforce</option>
            </select>
          </label>

          <label>
            Email
            <select
              onChange={(event) =>
                setConnectors((current) => ({ ...current, emailProvider: event.target.value }))
              }
              value={connectors.emailProvider}
            >
              <option value="smtp">SMTP</option>
              <option value="sendgrid">SendGrid</option>
            </select>
          </label>

          <label>
            Storage
            <select
              onChange={(event) =>
                setConnectors((current) => ({ ...current, storageProvider: event.target.value }))
              }
              value={connectors.storageProvider}
            >
              <option value="s3">S3</option>
              <option value="supabase">Supabase Storage</option>
            </select>
          </label>

          <label style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
            <input
              checked={activateAgents}
              onChange={(event) => setActivateAgents(event.target.checked)}
              type="checkbox"
            />
            Ativar agentes ao finalizar instalacao
          </label>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setStep(2)} type="button">
              Voltar
            </button>
            <button onClick={() => void installPack()} type="button">
              Instalar pack
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <strong>Ativacao concluida</strong>
          <p style={{ margin: 0 }}>Agente {selectedPack?.name} pronto para uso.</p>
          {selectedPackIsExecutivePremium ? (
            <small style={{ color: "var(--accent-strong)" }}>
              Camadas premium executivas prontas para operacao governada.
            </small>
          ) : null}
          <button onClick={() => setStep(1)} type="button">
            Instalar outro agente
          </button>
        </div>
      ) : null}

      {status ? <small style={{ color: "var(--accent-strong)" }}>{status}</small> : null}
    </section>
  );
}

