import Link from "next/link";

import { listInstalledAgents } from "../../../lib/agents";
import {
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT,
  isExecutivePremiumPack
} from "../../../lib/executive-premium";

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default async function AgentsPage() {
  const agents = await listInstalledAgents();
  const executivePremiumAgents = agents.filter((agent) => isExecutivePremiumPack(agent.catalogAgentId));
  const totalCost = agents.reduce((acc, agent) => acc + agent.executionCount * 0.0015, 0);
  const recentFailures = agents.flatMap((agent) =>
    agent.executions
      .filter((execution) => execution.status === "FAILED")
      .map((execution) => ({ agent: agent.name, execution }))
  );

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h2 style={{ margin: 0 }}>Agents</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Linha oficial de agentes instalados com manifesto real, dry-run persistido e aprendizado compartilhado governado.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
          <Link href="/agents/chatbook-inteligentissimo">Abrir ChatBook Inteligentissimo</Link>
          <Link href={EXECUTIVE_PREMIUM_COLLECTION_HREF}>Abrir colecao premium executiva</Link>
          <Link href="/packs">Ver packs instalados</Link>
        </div>
      </header>

      <div
        className="panel"
        style={{
          display: "grid",
          gap: "0.85rem"
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <span className="badge">Novo workspace</span>
            <strong>ChatBook Inteligentissimo</strong>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Camada central de inteligencia com busca interna, complemento web, voz,
              simuladores e sugestao de acoes assistidas.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
            <Link href="/agents/chatbook-inteligentissimo">Abrir workspace</Link>
            <Link className="ghost-button" href="/outputs">
              Ver outputs
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
          }}
        >
          <div className="agent-panel agent-panel--compact">
            <small className="agent-muted">Busca</small>
            <strong>Plataforma + web</strong>
            <span className="agent-muted">Origem separada e confianca explicita.</span>
          </div>
          <div className="agent-panel agent-panel--compact">
            <small className="agent-muted">Voz</small>
            <strong>STT + TTS</strong>
            <span className="agent-muted">Fallback para digitacao no mesmo fluxo.</span>
          </div>
          <div className="agent-panel agent-panel--compact">
            <small className="agent-muted">Simuladores</small>
            <strong>Cenarios editaveis</strong>
            <span className="agent-muted">Base, recomendado, otimista e conservador.</span>
          </div>
          <div className="agent-panel agent-panel--compact">
            <small className="agent-muted">Acoes</small>
            <strong>Copiloto operacional</strong>
            <span className="agent-muted">Packs, reports, outputs e workflows.</span>
          </div>
        </div>
      </div>

      {agents.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            padding: "1rem"
          }}
        >
          <h3 style={{ marginTop: 0 }}>Nenhum agente oficial instalado</h3>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>
            Instale agentes no marketplace para acompanhar execucoes reais, politicas publicadas e logs persistidos.
          </p>
        </div>
      ) : null}

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          padding: "1rem"
        }}
      >
        <div>
          <small style={{ color: "var(--muted)" }}>Agentes mais usados</small>
          <ul style={{ marginBottom: 0, marginTop: "0.35rem", paddingLeft: "1rem" }}>
            {agents
              .slice()
              .sort((left, right) => right.executionCount - left.executionCount)
              .map((agent) => (
                <li key={`usage-${agent.id}`}>
                  {agent.name}: {agent.executionCount} execucoes
                </li>
              ))}
          </ul>
        </div>
        <div>
          <small style={{ color: "var(--muted)" }}>Falhas recentes</small>
          <ul style={{ marginBottom: 0, marginTop: "0.35rem", paddingLeft: "1rem" }}>
            {recentFailures.length === 0 ? <li>Sem falhas recentes</li> : null}
            {recentFailures.slice(0, 4).map(({ agent, execution }) => (
              <li key={`failure-${execution.id}`}>
                {agent}: {execution.id}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <small style={{ color: "var(--muted)" }}>Custo acumulado</small>
          <p style={{ fontSize: "1.4rem", margin: 0 }}>${totalCost.toFixed(3)}</p>
        </div>
        <div>
          <small style={{ color: "var(--muted)" }}>Executive Premium</small>
          <p style={{ fontSize: "1.4rem", margin: 0 }}>{executivePremiumAgents.length}</p>
          <small style={{ color: "var(--muted)" }}>
            {EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} camadas premium compartilhadas
          </small>
        </div>
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          overflow: "hidden"
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead style={{ background: "rgba(30, 58, 138, 0.09)" }}>
            <tr>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Nome</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Versao</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Status</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Catalogo</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Ultima execucao</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Fail rate</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr
                key={agent.id}
                style={{
                  background: isExecutivePremiumPack(agent.catalogAgentId)
                    ? "rgba(30,58,138,0.05)"
                    : "transparent"
                }}
              >
                <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                  <div style={{ display: "grid", gap: "0.2rem" }}>
                    <span>{agent.name}</span>
                    {isExecutivePremiumPack(agent.catalogAgentId) ? (
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
                  </div>
                </td>
                <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>{agent.version}</td>
                <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>{agent.status}</td>
                <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>{agent.catalogAgentId}</td>
                <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                  {agent.lastRun ? new Date(agent.lastRun).toLocaleString("pt-BR") : "Nunca executado"}
                </td>
                <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                  {toPercent(agent.failRate)}
                </td>
                <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link href={`/agents/${agent.id}`}>Overview</Link>
                    <Link href={`/agents/${agent.id}/run`}>Run</Link>
                    <Link href={`/agents/${agent.id}/policies`}>Policies</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
