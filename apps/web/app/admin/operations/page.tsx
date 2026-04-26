"use client";

import { useEffect, useState } from "react";

import { fetchWithSession, getStoredSession } from "../../../lib/auth-client";

export default function OperationsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setError(null);
    if (!query) return;

    try {
      const response = await fetchWithSession(`/api/bff/api/v1/admin/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Erro na busca");
      }
      const data = await response.json();
      setResults(data.results);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <main style={{ padding: "1.5rem", maxWidth: 1240, margin: "0 auto" }}>
      <h1>Operação e Suporte</h1>
      <p style={{ color: "var(--muted)" }}>Visão administrativa para busca de tenants, workflows, execuções e conectores.</p>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Buscar por tenant, ID de workflow, execution, ou connector..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="action-button" onClick={handleSearch}>
            Buscar
          </button>
        </div>
        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
      </div>

      {results && (
        <div style={{ marginTop: "2rem", display: "grid", gap: "2rem" }}>
          <section>
            <h2>Tenants</h2>
            {results.tenants?.length === 0 ? <p>Nenhum tenant encontrado</p> : (
              <ul>
                {results.tenants?.map((t: any) => (
                  <li key={t.id}><strong>{t.name}</strong> ({t.tenantId}) - {t.slug}</li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Workflows</h2>
            {results.workflows?.length === 0 ? <p>Nenhum workflow encontrado</p> : (
              <ul>
                {results.workflows?.map((w: any) => (
                  <li key={w.id}><strong>{w.name}</strong> - {w.id} ({w.status})</li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Execuções</h2>
            {results.executions?.length === 0 ? <p>Nenhuma execução encontrada</p> : (
              <ul>
                {results.executions?.map((e: any) => (
                  <li key={e.id}>
                    <a href={`/admin/operations/executions/${e.id}`}>
                      {e.id}
                    </a> - Status: {e.status}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Conectores</h2>
            {results.connectors?.length === 0 ? <p>Nenhum conector encontrado</p> : (
              <ul>
                {results.connectors?.map((c: any) => (
                  <li key={c.id}><strong>{c.provider}</strong> ({c.status}) - Org: {c.organizationId}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      <AuditLogsPanel />
      <TroubleshootingPanel />
    </main>
  );
}

function AuditLogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithSession('/api/bff/api/v1/admin/audit-logs')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => setLoadError("Nao foi possivel carregar a trilha de auditoria."));
  }, []);

  return (
    <section className="panel" style={{ marginTop: "2rem" }}>
      <h2>Trilha de Auditoria (Operacional)</h2>
      {loadError ? <p style={{ color: "red" }}>{loadError}</p> : logs.length === 0 ? <p>Sem logs recentes.</p> : (
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          <table className="table" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Ação</th>
                <th>Ator</th>
                <th>Tenant</th>
                <th>Entidade</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td><strong>{log.action}</strong></td>
                  <td>{log.actorId}</td>
                  <td>{log.tenantId}</td>
                  <td>{log.entityType} ({log.entityId})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TroubleshootingPanel() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithSession('/api/bff/api/v1/analytics/operations')
      .then(res => res.json())
      .then(data => setMetrics(data.metrics || null))
      .catch(() => setLoadError("Nao foi possivel carregar metricas operacionais."));
  }, []);

  return (
    <section className="panel" style={{ marginTop: "2rem" }}>
      <h2>Troubleshooting Guiado & Saúde</h2>
      {loadError ? <p style={{ color: "red" }}>{loadError}</p> : !metrics ? <p>Carregando métricas de operação...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <h3>Playbook: Retries & Queue</h3>
            <p><strong>Fila Atual:</strong> {metrics.queue?.queueName ?? "N/A"}</p>
            <p><strong>Backlog:</strong> {metrics.queue?.pending ?? 0} pendentes</p>
            <p><strong>Em Execução:</strong> {metrics.queue?.active ?? 0}</p>
            {metrics.queue?.pending > 100 && (
              <div style={{ color: "red", padding: "0.5rem", border: "1px solid red" }}>
                <strong>Alerta:</strong> Fila alta! Verifique a saúde dos workers de processamento do agente.
              </div>
            )}
          </div>
          <div>
            <h3>Providers Degradados</h3>
            {metrics.failRateAlerts?.length > 0 ? (
              <ul>
                {metrics.failRateAlerts.map((a: any) => (
                  <li key={`${a.tenantId}-${a.agentId}`}>
                    {a.agentId} no tenant {a.tenantId}: {(a.failRate * 100).toFixed(2)}% falhas
                  </li>
                ))}
              </ul>
            ) : <p>Nenhum alerta de provider ou agente degradado no momento.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
