"use client";

import { use, useEffect, useMemo, useState, useTransition } from "react";
import ReactFlow from "reactflow";
import { Background, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

import type { WorkflowCanvas } from "@birthub/workflows-core/nextjs";

import { fetchWithSession } from "../../../../../lib/auth-client";
import { canvasToFlow, nodeTypes } from "../edit/workflow-editor-helpers";

type WorkflowRevisionSnapshot = {
  createdAt: string;
  definition: WorkflowCanvas;
  id: string;
  version: number;
};

type WorkflowRevisionGraph = {
  edges: ReturnType<typeof canvasToFlow>["edges"];
  nodes: ReturnType<typeof canvasToFlow>["nodes"];
};

type WorkflowRevisionsResponse = {
  items: WorkflowRevisionSnapshot[];
};

type WorkflowRevisionsModel = {
  error: string | null;
  graph: WorkflowRevisionGraph;
  isPending: boolean;
  revisions: WorkflowRevisionSnapshot[];
  saveMessage: string | null;
  selectedRevision: WorkflowRevisionSnapshot | null;
  selectedRevisionId: string;
  setSelectedRevisionId: (revisionId: string) => void;
  revertRevision: () => void;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorkflowRevisionSnapshot(value: unknown): value is WorkflowRevisionSnapshot {
  return (
    isObjectRecord(value) &&
    typeof value.createdAt === "string" &&
    isObjectRecord(value.definition) &&
    typeof value.id === "string" &&
    typeof value.version === "number"
  );
}

function parseWorkflowRevisionsResponse(value: unknown): WorkflowRevisionsResponse {
  if (!isObjectRecord(value) || !Array.isArray(value.items) || !value.items.every(isWorkflowRevisionSnapshot)) {
    throw new Error("Resposta de revisoes invalida.");
  }

  return {
    items: value.items
  };
}

function StatusBanner(props: {
  color: string;
  message: string;
  tone: "error" | "success";
}) {
  return (
    <div
      style={{
        background: props.tone === "success" ? "#edfdf4" : "#fff5f5",
        borderRadius: "8px",
        color: props.color,
        padding: "0.5rem 1rem"
      }}
    >
      {props.message}
    </div>
  );
}

function RevisionsHeader(props: {
  error: string | null;
  saveMessage: string | null;
  workflowId: string;
}) {
  return (
    <header
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between"
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>Workflow Revisions - {props.workflowId}</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Historico de alteracoes no workflow. Ver diff visual e restaurar versoes.
        </p>
      </div>
      {props.saveMessage ? (
        <StatusBanner color="#1b4332" message={props.saveMessage} tone="success" />
      ) : null}
      {props.error ? <StatusBanner color="#9d0208" message={props.error} tone="error" /> : null}
    </header>
  );
}

function RevisionsSidebar(props: {
  revisions: WorkflowRevisionSnapshot[];
  selectedRevisionId: string;
  setSelectedRevisionId: (revisionId: string) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #d9e2ec",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          background: "#f1f5f9",
          borderBottom: "1px solid #d9e2ec",
          fontWeight: 600,
          padding: "0.65rem"
        }}
      >
        Versoes
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {props.revisions.map((revision) => (
          <div
            key={revision.id}
            onClick={() => props.setSelectedRevisionId(revision.id)}
            style={{
              alignItems: "center",
              background: props.selectedRevisionId === revision.id ? "#e0f2fe" : "white",
              borderBottom: "1px solid #e2e8f0",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              padding: "0.85rem"
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>v{revision.version}</div>
              <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                {new Date(revision.createdAt).toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevisionCanvasPanel(props: {
  graph: WorkflowRevisionGraph;
  isCurrentRevision: boolean;
  isPending: boolean;
  onRevert: () => void;
  selectedRevision: WorkflowRevisionSnapshot | null;
}) {
  return (
    <div
      style={{
        border: "1px solid #d9e2ec",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "white",
          borderBottom: "1px solid #d9e2ec",
          display: "flex",
          justifyContent: "space-between",
          padding: "0.65rem"
        }}
      >
        <div style={{ fontWeight: 600 }}>
          Visualizacao do Canvas - v{props.selectedRevision?.version}
        </div>
        <button
          disabled={props.isPending || props.isCurrentRevision || !props.selectedRevision}
          onClick={props.onRevert}
          style={{
            background: props.isCurrentRevision ? "#e2e8f0" : "#2563eb",
            border: "none",
            borderRadius: "6px",
            color: props.isCurrentRevision ? "#94a3b8" : "white",
            cursor: props.isCurrentRevision ? "not-allowed" : "pointer",
            fontWeight: 600,
            padding: "0.4rem 1rem"
          }}
        >
          Reverter para v{props.selectedRevision?.version}
        </button>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        {props.graph.nodes.length > 0 ? (
          <ReactFlow
            edges={props.graph.edges}
            fitView
            nodes={props.graph.nodes}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            panOnDrag
          >
            <MiniMap />
            <Background gap={20} />
          </ReactFlow>
        ) : null}
      </div>
    </div>
  );
}

function useWorkflowRevisionsModel(workflowId: string): WorkflowRevisionsModel {
  const [revisions, setRevisions] = useState<WorkflowRevisionSnapshot[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadRevisions(): Promise<void> {
      try {
        setError(null);
        const response = await fetchWithSession(`/api/v1/workflows/${workflowId}/revisions`);
        if (!response.ok) {
          throw new Error("Falha ao carregar historico.");
        }

        const payload = parseWorkflowRevisionsResponse((await response.json()) as unknown);
        if (cancelled) {
          return;
        }

        setRevisions(payload.items);
        setSelectedRevisionId((current) => current || payload.items[0]?.id || "");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Falha ao carregar historico.");
        }
      }
    }

    void loadRevisions();

    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  const selectedRevision = useMemo(
    () => revisions.find((revision) => revision.id === selectedRevisionId) ?? revisions[0] ?? null,
    [revisions, selectedRevisionId]
  );

  const graph = useMemo<WorkflowRevisionGraph>(() => {
    if (!selectedRevision) {
      return { edges: [], nodes: [] };
    }

    const definition: WorkflowCanvas = selectedRevision.definition;
    return canvasToFlow(definition, "PUBLISHED");
  }, [selectedRevision]);

  const revertRevision = () => {
    if (!selectedRevision) {
      return;
    }

    startTransition(() => {
      setError(null);
      setSaveMessage(null);
      void (async () => {
        try {
          const response = await fetchWithSession(`/api/v1/workflows/${workflowId}/revert`, {
            body: JSON.stringify({ version: selectedRevision.version }),
            headers: {
              "content-type": "application/json"
            },
            method: "POST"
          });

          if (!response.ok) {
            throw new Error("Falha ao reverter fluxo.");
          }

          const revisionsResponse = await fetchWithSession(`/api/v1/workflows/${workflowId}/revisions`);
          if (!revisionsResponse.ok) {
            throw new Error("Falha ao recarregar historico apos reversao.");
          }

          const payload = parseWorkflowRevisionsResponse((await revisionsResponse.json()) as unknown);
          setRevisions(payload.items);
          setSelectedRevisionId(payload.items[0]?.id ?? "");
          setSaveMessage(
            `Revertido com sucesso para a versao ${selectedRevision.version}. O workflow foi salvo como rascunho (DRAFT).`
          );
        } catch (revertError) {
          setError(revertError instanceof Error ? revertError.message : "Falha ao reverter fluxo.");
        }
      })();
    });
  };

  return {
    error,
    graph,
    isPending,
    revisions,
    revertRevision,
    saveMessage,
    selectedRevision,
    selectedRevisionId,
    setSelectedRevisionId
  };
}

export default function WorkflowRevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const model = useWorkflowRevisionsModel(id);

  return (
    <section
      style={{
        display: "grid",
        gap: "0.85rem",
        gridTemplateRows: "auto 1fr",
        height: "calc(100vh - 110px)"
      }}
    >
      <RevisionsHeader error={model.error} saveMessage={model.saveMessage} workflowId={id} />
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "300px minmax(0, 1fr)",
          minHeight: 0
        }}
      >
        <RevisionsSidebar
          revisions={model.revisions}
          selectedRevisionId={model.selectedRevisionId}
          setSelectedRevisionId={model.setSelectedRevisionId}
        />
        <RevisionCanvasPanel
          graph={model.graph}
          isCurrentRevision={model.revisions[0]?.id === model.selectedRevisionId}
          isPending={model.isPending}
          onRevert={model.revertRevision}
          selectedRevision={model.selectedRevision}
        />
      </div>
    </section>
  );
}

