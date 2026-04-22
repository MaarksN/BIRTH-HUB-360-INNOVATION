"use client";

import "reactflow/dist/style.css";

import { use, useEffect, useMemo, useState, useTransition } from "react";

import ReactFlow, { Background, MiniMap, type Edge, type Node } from "reactflow";

import {
  buildGraph,
  loadWorkflowRuns,
  maskSecrets,
  retryWorkflowRun,
  type WorkflowExecutionSnapshot
} from "./page.data";

type WorkflowGraph = {
  edges: Edge[];
  nodes: Node[];
};

type WorkflowRunsMetrics = {
  bottleneck:
    | {
        avgDuration: number;
        nodeId: string;
      }
    | undefined;
  dryRunsCount: number;
  failures: number;
  meanDuration: number;
  successes: number;
};

type WorkflowRunsModel = {
  decoratedEdges: Edge[];
  decoratedNodes: Node[];
  error: string | null;
  isPending: boolean;
  metrics: WorkflowRunsMetrics;
  retrySelectedRun: (run: WorkflowExecutionSnapshot) => void;
  runs: WorkflowExecutionSnapshot[];
  selectedNodeId: string | null;
  selectedRun: WorkflowExecutionSnapshot | null;
  selectedRunId: string;
  selectNode: (nodeId: string | null) => void;
  selectRun: (runId: string) => void;
  selectedStepResult: WorkflowExecutionSnapshot["stepResults"][number] | null;
  workflowName: string;
};

function buildMetrics(runs: WorkflowExecutionSnapshot[]): WorkflowRunsMetrics {
  const successes = runs.filter((run) => run.status === "SUCCESS" && !run.isDryRun).length;
  const failures = runs.filter((run) => run.status === "FAILED" && !run.isDryRun).length;
  const dryRunsCount = runs.filter((run) => run.isDryRun).length;
  const meanDuration =
    runs.reduce((sum, run) => sum + (run.durationMs ?? 0), 0) / Math.max(runs.length, 1);
  const byNode: Record<string, number[]> = {};

  for (const run of runs) {
    for (const result of run.stepResults) {
      const bucket = byNode[result.step.key] ?? [];
      bucket.push(run.durationMs ?? 0);
      byNode[result.step.key] = bucket;
    }
  }

  const bottleneck = Object.entries(byNode)
    .map(([nodeId, durations]) => ({
      avgDuration: durations.reduce((sum, value) => sum + value, 0) / durations.length,
      nodeId
    }))
    .sort((left, right) => right.avgDuration - left.avgDuration)[0];

  return {
    bottleneck,
    dryRunsCount,
    failures,
    meanDuration,
    successes
  };
}

function decorateEdges(graph: WorkflowGraph, executedStepKeys: Set<string>): Edge[] {
  return graph.edges.map((edge) => {
    const executed = executedStepKeys.has(edge.source) && executedStepKeys.has(edge.target);
    return {
      ...edge,
      animated: executed,
      style: {
        stroke: executed ? "#2d6a4f" : "#94a3b8",
        strokeWidth: executed ? 3 : 1.4
      }
    };
  });
}

function decorateNodes(
  graph: WorkflowGraph,
  executedStepKeys: Set<string>,
  failedStepKey: string | null
): Node[] {
  return graph.nodes.map((node) => {
    const failed = failedStepKey === node.id;
    const executed = executedStepKeys.has(node.id);
    return {
      ...node,
      style: {
        background: failed ? "#fff5f5" : executed ? "#ecfff5" : "#f8fafc",
        border: failed ? "2px solid #c1121f" : executed ? "2px solid #1b4332" : "1px solid #cbd5e1",
        borderRadius: 10,
        fontWeight: 600,
        padding: "0.25rem 0.55rem"
      }
    };
  });
}

function RunsMetricsPanel(props: { metrics: WorkflowRunsMetrics }) {
  return (
    <div
      style={{
        background: "#f8fbff",
        border: "1px solid #d9e2ec",
        borderRadius: 14,
        display: "grid",
        gap: "0.75rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        padding: "0.75rem"
      }}
    >
      <div>
        <small style={{ color: "#4f5d75" }}>Sucessos</small>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{props.metrics.successes}</div>
      </div>
      <div>
        <small style={{ color: "#4f5d75" }}>Falhas</small>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{props.metrics.failures}</div>
      </div>
      <div>
        <small style={{ color: "#4f5d75" }}>Dry Runs</small>
        <div style={{ color: "#0284c7", fontSize: 22, fontWeight: 700 }}>
          {props.metrics.dryRunsCount}
        </div>
      </div>
      <div>
        <small style={{ color: "#4f5d75" }}>Duracao media</small>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          {Math.round(props.metrics.meanDuration)} ms
        </div>
      </div>
      <div>
        <small style={{ color: "#4f5d75" }}>Gargalo</small>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          {props.metrics.bottleneck ? props.metrics.bottleneck.nodeId : "n/a"}
        </div>
      </div>
    </div>
  );
}

function RunsTable(props: {
  isPending: boolean;
  retrySelectedRun: (run: WorkflowExecutionSnapshot) => void;
  runs: WorkflowExecutionSnapshot[];
  selectedRunId: string;
  selectRun: (runId: string) => void;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #d9e2ec",
        borderRadius: 14,
        overflow: "hidden"
      }}
    >
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead style={{ background: "#f1f5f9" }}>
          <tr>
            <th style={{ padding: "0.65rem", textAlign: "left" }}>Run</th>
            <th style={{ padding: "0.65rem", textAlign: "left" }}>Status</th>
            <th style={{ padding: "0.65rem", textAlign: "left" }}>Data</th>
            <th style={{ padding: "0.65rem", textAlign: "left" }}>Duracao</th>
            <th style={{ padding: "0.65rem", textAlign: "left" }}>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {props.runs.map((run) => (
            <tr
              key={run.id}
              style={{
                background:
                  props.selectedRunId === run.id
                    ? "#eff6ff"
                    : run.isDryRun
                      ? "#f0f9ff"
                      : undefined
              }}
            >
              <td style={{ borderTop: "1px solid #e2e8f0", padding: "0.65rem" }}>
                {run.id}
                {run.isDryRun ? (
                  <span
                    style={{
                      background: "#bae6fd",
                      borderRadius: 4,
                      color: "#0369a1",
                      fontSize: 10,
                      marginLeft: 6,
                      padding: "2px 4px"
                    }}
                  >
                    DRY RUN
                  </span>
                ) : null}
              </td>
              <td style={{ borderTop: "1px solid #e2e8f0", padding: "0.65rem" }}>{run.status}</td>
              <td style={{ borderTop: "1px solid #e2e8f0", padding: "0.65rem" }}>
                {new Date(run.completedAt ?? run.startedAt).toLocaleString("pt-BR")}
              </td>
              <td style={{ borderTop: "1px solid #e2e8f0", padding: "0.65rem" }}>
                {run.durationMs ?? 0} ms
              </td>
              <td style={{ borderTop: "1px solid #e2e8f0", padding: "0.65rem" }}>
                <button
                  onClick={() => props.selectRun(run.id)}
                  style={{ marginRight: 8 }}
                  type="button"
                >
                  Debug
                </button>
                {run.status === "FAILED" ? (
                  <button
                    disabled={props.isPending}
                    onClick={() => props.retrySelectedRun(run)}
                    type="button"
                  >
                    Retry falha
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RunsDebugger(props: {
  decoratedEdges: Edge[];
  decoratedNodes: Node[];
  onNodeSelect: (nodeId: string | null) => void;
  selectedRun: WorkflowExecutionSnapshot | null;
  selectedStepResult: WorkflowExecutionSnapshot["stepResults"][number] | null;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        gridTemplateColumns: "minmax(0, 1fr) 360px",
        minHeight: 360
      }}
    >
      <div style={{ border: "1px solid #d9e2ec", borderRadius: 14, overflow: "hidden" }}>
        <ReactFlow
          edges={props.decoratedEdges}
          fitView
          nodes={props.decoratedNodes}
          nodesDraggable={false}
          onNodeClick={(_, node) => props.onNodeSelect(node.id)}
          panOnDrag={false}
        >
          <MiniMap />
          <Background gap={20} />
        </ReactFlow>
      </div>
      <aside
        style={{
          border: "1px solid #d9e2ec",
          borderRadius: 14,
          display: "grid",
          gridTemplateRows: "auto auto 1fr 1fr 1fr",
          padding: "0.7rem"
        }}
      >
        <h4 style={{ margin: 0 }}>Visual Debugger</h4>
        <small style={{ color: "#4f5d75" }}>
          Clique no no para inspecionar input/output real com secrets mascarados.
        </small>
        <div>
          <h5 style={{ marginBottom: 6 }}>Trigger Payload</h5>
          <pre style={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap" }}>
            {props.selectedRun?.triggerPayload ? maskSecrets(props.selectedRun.triggerPayload) : "{}"}
          </pre>
        </div>
        <div>
          <h5 style={{ marginBottom: 6 }}>Input</h5>
          <pre style={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap" }}>
            {props.selectedStepResult?.input ? maskSecrets(props.selectedStepResult.input) : "{}"}
          </pre>
        </div>
        <div>
          <h5 style={{ marginBottom: 6 }}>Output</h5>
          <pre style={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap" }}>
            {props.selectedStepResult?.output ? maskSecrets(props.selectedStepResult.output) : "{}"}
          </pre>
          {props.selectedStepResult ? (
            <small style={{ color: "#4f5d75" }}>
              tentativa {props.selectedStepResult.attempt} ·{" "}
              {props.selectedStepResult.durationMs ?? 0} ms
              {props.selectedStepResult.errorCode
                ? ` · ${props.selectedStepResult.errorCode}`
                : ""}
              {props.selectedStepResult.nextRetryAt
                ? ` · retry ${new Date(props.selectedStepResult.nextRetryAt).toLocaleString("pt-BR")}`
                : ""}
              {props.selectedStepResult.errorMessage
                ? ` · ${props.selectedStepResult.errorMessage}`
                : ""}
            </small>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function useWorkflowRunsModel(workflowId: string): WorkflowRunsModel {
  const [workflowName, setWorkflowName] = useState(workflowId);
  const [graph, setGraph] = useState<WorkflowGraph>({ edges: [], nodes: [] });
  const [runs, setRuns] = useState<WorkflowExecutionSnapshot[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadWorkflow(): Promise<void> {
      try {
        setError(null);
        const payload = await loadWorkflowRuns(workflowId);
        if (cancelled) {
          return;
        }

        setWorkflowName(payload.workflow.name);
        setGraph(buildGraph(payload.workflow.definition));
        setRuns(payload.workflow.executions);
        setSelectedRunId(payload.workflow.executions[0]?.id ?? "");
        setSelectedNodeId(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Falha ao carregar execucoes.");
        }
      }
    }

    void loadWorkflow();

    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );

  const executedStepKeys = useMemo(
    () => new Set(selectedRun?.stepResults.map((result) => result.step.key) ?? []),
    [selectedRun]
  );

  const failedStepKey = useMemo(
    () => selectedRun?.stepResults.find((result) => result.status === "FAILED")?.step.key ?? null,
    [selectedRun]
  );

  const metrics = useMemo(() => buildMetrics(runs), [runs]);
  const decoratedEdges = useMemo(() => decorateEdges(graph, executedStepKeys), [graph, executedStepKeys]);
  const decoratedNodes = useMemo(
    () => decorateNodes(graph, executedStepKeys, failedStepKey),
    [graph, executedStepKeys, failedStepKey]
  );
  const selectedStepResult = useMemo(
    () =>
      selectedNodeId && selectedRun
        ? selectedRun.stepResults.find((result) => result.step.key === selectedNodeId) ?? null
        : null,
    [selectedNodeId, selectedRun]
  );

  const retrySelectedRun = (run: WorkflowExecutionSnapshot) => {
    startTransition(() => {
      setError(null);
      void (async () => {
        try {
          await retryWorkflowRun({
            failedExecutionId: run.id,
            failedStepKey: run.stepResults.find((result) => result.status === "FAILED")?.step.key,
            workflowId
          });
          setError("Retry aceito. Recarregue em alguns segundos para ver a nova run.");
        } catch (retryError) {
          setError(
            retryError instanceof Error
              ? retryError.message
              : "Falha ao reenfileirar workflow."
          );
        }
      })();
    });
  };

  return {
    decoratedEdges,
    decoratedNodes,
    error,
    isPending,
    metrics,
    retrySelectedRun,
    runs,
    selectedNodeId,
    selectedRun,
    selectedRunId,
    selectedStepResult,
    selectNode: setSelectedNodeId,
    selectRun: setSelectedRunId,
    workflowName
  };
}

export default function WorkflowRunsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const model = useWorkflowRunsModel(id);

  return (
    <section style={{ display: "grid", gap: "0.85rem" }}>
      <header>
        <h2 style={{ margin: 0 }}>Workflow Runs - {model.workflowName}</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Historico de execucoes reais, debugger visual e retry do workflow publicado.
        </p>
      </header>

      {model.error ? <p style={{ color: "#9d0208", margin: 0 }}>{model.error}</p> : null}

      <RunsMetricsPanel metrics={model.metrics} />
      <RunsTable
        isPending={model.isPending}
        retrySelectedRun={model.retrySelectedRun}
        runs={model.runs}
        selectedRunId={model.selectedRunId}
        selectRun={model.selectRun}
      />
      <RunsDebugger
        decoratedEdges={model.decoratedEdges}
        decoratedNodes={model.decoratedNodes}
        onNodeSelect={model.selectNode}
        selectedRun={model.selectedRun}
        selectedStepResult={model.selectedStepResult}
      />
    </section>
  );
}

