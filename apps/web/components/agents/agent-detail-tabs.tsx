"use client";

import { useState } from "react";

import type { AgentSnapshot } from "../../lib/agents";

type TabKey = "executions" | "logs" | "manifest" | "overview";

interface AgentDetailTabsProps {
  agent: AgentSnapshot;
}

const TABS: TabKey[] = ["overview", "executions", "logs", "manifest"];

function readManifestAgent(manifest: Record<string, unknown>): {
  description: string;
  prompt: string;
} {
  if (!manifest.agent || typeof manifest.agent !== "object") {
    return {
      description: "",
      prompt: ""
    };
  }

  const agent = manifest.agent as Record<string, unknown>;

  return {
    description: typeof agent.description === "string" ? agent.description : "",
    prompt: typeof agent.prompt === "string" ? agent.prompt : ""
  };
}

function readLatestLatency(agent: AgentSnapshot): number {
  return Math.max(0, ...agent.executions.map((execution) => execution.durationMs));
}

export function AgentDetailTabs({ agent }: Readonly<AgentDetailTabsProps>) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const manifestAgent = readManifestAgent(agent.manifest);

  return (
    <section className="agent-stack">
      <nav className="agent-tab-nav">
        {TABS.map((tab) => (
          <button
            className="agent-tab-button"
            data-active={activeTab === tab}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <article className="agent-stack">
          <div className="agent-panel">
            <h3 className="agent-body-copy">Overview</h3>
            <p className="agent-muted agent-body-copy">{manifestAgent.description}</p>
            <p className="agent-body-copy">
              Status instalado: <strong>{agent.status}</strong> · status fonte: <strong>{agent.sourceStatus}</strong>
            </p>
            <p className="agent-body-copy">
              Catalogo: <strong>{agent.catalogAgentId}</strong> · versao instalada: <strong>{agent.version}</strong>
            </p>
            <p className="agent-body-copy">
              Runtime: <strong>{agent.runtimeProvider}</strong>
            </p>
            <p className="agent-body-copy">Tags: {agent.tags.join(", ")}</p>
            <p className="agent-body-copy">Keywords: {agent.keywords.join(", ")}</p>
          </div>

          <div className="agent-stat-grid">
            <div>
              <small className="agent-stat-label">execution_count</small>
              <p className="agent-stat-value">{agent.executionCount}</p>
            </div>
            <div>
              <small className="agent-stat-label">fail_rate</small>
              <p className="agent-stat-value">{Math.round(agent.failRate * 100)}%</p>
            </div>
            <div>
              <small className="agent-stat-label">last_run</small>
              <p className="agent-stat-value agent-stat-value--compact">
                {agent.lastRun ? new Date(agent.lastRun).toLocaleString("pt-BR") : "Nunca executado"}
              </p>
            </div>
            <div>
              <small className="agent-stat-label">max latency</small>
              <p className="agent-stat-value">{readLatestLatency(agent)}ms</p>
            </div>
          </div>

          <div className="agent-panel">
            <h3 className="agent-body-copy">Prompt oficial</h3>
            <textarea
              className="agent-textarea agent-textarea--code"
              readOnly
              rows={12}
              value={manifestAgent.prompt}
            />
          </div>
        </article>
      ) : null}

      {activeTab === "executions" ? (
        <article className="agent-panel">
          <h3 className="agent-body-copy">Executions</h3>
          <table className="agent-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Modo</th>
                <th>Inicio</th>
                <th>Duracao</th>
              </tr>
            </thead>
            <tbody>
              {agent.executions.map((execution) => (
                <tr key={execution.id}>
                  <td>{execution.id}</td>
                  <td>{execution.status}</td>
                  <td>{execution.mode}</td>
                  <td>
                    {new Date(execution.startedAt).toLocaleString("pt-BR")}
                  </td>
                  <td>{execution.durationMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
          {agent.executions.length === 0 ? (
            <p className="agent-empty-state agent-muted">Nenhuma execucao persistida ainda.</p>
          ) : null}
        </article>
      ) : null}

      {activeTab === "logs" ? (
        <article className="agent-panel">
          <h3 className="agent-body-copy">Logs recentes</h3>
          <ul className="agent-log-list">
            {agent.logs.map((logLine) => (
              <li key={logLine}>{logLine}</li>
            ))}
          </ul>
          {agent.logs.length === 0 ? (
            <p className="agent-empty-state agent-muted">Nenhum log persistido ainda.</p>
          ) : null}
        </article>
      ) : null}

      {activeTab === "manifest" ? (
        <article className="agent-panel">
          <h3 className="agent-body-copy">Manifest</h3>
          <pre className="agent-code-block">{JSON.stringify(agent.manifest, null, 2)}</pre>
        </article>
      ) : null}
    </section>
  );
}
