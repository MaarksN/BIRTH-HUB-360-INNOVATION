"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchWithSession } from "../../../../../lib/auth-client";

export default function AdminExecutionDebugPage() {
  const params = useParams();
  const executionId = params.id as string;
  const [execution, setExecution] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExecution() {
      try {
        const response = await fetchWithSession(`/api/bff/api/v1/admin/executions/${executionId}`);
        if (!response.ok) {
          throw new Error("Falha ao buscar execução");
        }
        const data = await response.json();
        setExecution(data.execution);
      } catch (e: any) {
        setError(e.message);
      }
    }

    if (executionId) {
      loadExecution();
    }
  }, [executionId]);


  const handleCancel = async () => {
    try {
      const response = await fetchWithSession(`/api/bff/api/v1/admin/executions/${executionId}/cancel`, { method: "POST" });
      if (!response.ok) throw new Error("Erro ao cancelar");
      alert("Execução cancelada com sucesso!");
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReplay = async () => {
    try {
      const response = await fetchWithSession(`/api/bff/api/v1/admin/executions/${executionId}/replay`, { method: "POST" });
      if (!response.ok) throw new Error("Erro ao dar replay");
      const data = await response.json();
      alert(`Replay criado com sucesso! Nova execução: ${data.newExecutionId}`);
      window.location.href = `/admin/operations/executions/${data.newExecutionId}`;
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (error) {
    return <div style={{ padding: "1.5rem", color: "red" }}>{error}</div>;
  }

  if (!execution) {
    return <div style={{ padding: "1.5rem" }}>Carregando...</div>;
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: 1240, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><h1>Debug de Execução: {executionId}</h1> <div><button onClick={handleCancel} className="action-button" style={{ marginRight: "1rem", background: "red" }}>Cancelar</button> <button onClick={handleReplay} className="action-button">Replay</button></div></div>
      <div className="panel" style={{ marginTop: "1rem" }}>
        <p><strong>Tenant ID:</strong> {execution.tenantId}</p>
        <p><strong>Org ID:</strong> {execution.organizationId}</p>
        <p><strong>Workflow ID:</strong> {execution.workflowId}</p>
        <p><strong>Status:</strong> {execution.status}</p>
        <p><strong>Trigger:</strong> {execution.triggerType}</p>
        <p><strong>Event Source:</strong> {execution.eventSource || "N/A"}</p>
        <p><strong>Idempotency Key:</strong> {execution.idempotencyKey || "N/A"}</p>
      </div>

      <h2 style={{ marginTop: "2rem" }}>Steps</h2>
      <div style={{ display: "grid", gap: "1rem" }}>
        {execution.stepResults?.map((step: any) => (
          <div key={step.id} className="panel">
            <h3>Step ID: {step.stepId} (Attempt: {step.attempt})</h3>
            <p><strong>Status:</strong> {step.status}</p>
            <p><strong>Duration:</strong> {step.durationMs}ms</p>
            {step.errorMessage && <p style={{ color: "red" }}><strong>Error:</strong> {step.errorMessage}</p>}
            <details>
              <summary>Ver Payload (Mascarado)</summary>
              <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "4px" }}>
                {JSON.stringify(
                  { input: step.input, output: step.output, preview: step.outputPreview },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        ))}
        {execution.stepResults?.length === 0 && <p>Nenhum step executado.</p>}
      </div>
    </main>
  );
}
