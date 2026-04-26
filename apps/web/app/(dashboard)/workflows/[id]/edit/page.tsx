"use client";

import "reactflow/dist/style.css";

import { use, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";

import { getWebConfig } from "../../../../../lib/web-config";
import { WORKFLOW_CONNECTOR_ACTIONS, WORKFLOW_EVENT_TOPICS } from "@birthub/workflows-core/nextjs";
import { Play, Save, Shuffle, Zap } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from "reactflow";

import {
  applySidebarValues,
  autoLayout,
  buildValidation,
  decorateNodes,
  loadWorkflowSimulationResult,
  loadWorkflowDefinition,
  nodeTypes,
  saveWorkflowDefinition,
  startWorkflowDryRun,
  type BuilderNodeData,
  type SidebarValues,
} from "./workflow-editor-helpers";

type WorkflowStatus = "ARCHIVED" | "DRAFT" | "PUBLISHED";

const apiBaseUrl = getWebConfig().NEXT_PUBLIC_API_URL;
function useWorkflowForm(selectedNode: Node<BuilderNodeData> | null): UseFormReturn<SidebarValues> {
  const form = useForm<SidebarValues>({
    defaultValues: {
      configJson: JSON.stringify(selectedNode?.data.config ?? {}, null, 2),
      label: selectedNode?.data.label ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      configJson: JSON.stringify(selectedNode?.data.config ?? {}, null, 2),
      label: selectedNode?.data.label ?? "",
    });
  }, [form, selectedNode]);

  return form;
}

function useWorkflowLoader({
  id,
  setEdges,
  setLoadingError,
  setNodes,
  setSelectedNodeId,
  setWorkflowName,
  setWorkflowStatus,
}: {
  id: string;
  setEdges: (edges: Edge[]) => void;
  setLoadingError: (message: string | null) => void;
  setNodes: (nodes: Node<BuilderNodeData>[]) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowStatus: (status: WorkflowStatus) => void;
}) {
  useEffect(() => {
    let cancelled = false;

    void loadWorkflowDefinition(apiBaseUrl, id)
      .then(({ flow, payload }) => {
        if (cancelled) {
          return;
        }

        setWorkflowName(payload.workflow.name);
        setWorkflowStatus(payload.workflow.status);
        setNodes(autoLayout(flow.nodes));
        setEdges(flow.edges);
        setSelectedNodeId(flow.nodes[0]?.id ?? null);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadingError(error instanceof Error ? error.message : "Falha ao carregar workflow.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    id,
    setEdges,
    setLoadingError,
    setNodes,
    setSelectedNodeId,
    setWorkflowName,
    setWorkflowStatus,
  ]);
}

function StatusNotice({
  background,
  border,
  children,
  color,
}: {
  background: string;
  border: string;
  children: ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        background,
        border,
        borderRadius: 10,
        color,
        fontSize: 12,
        marginTop: 6,
        padding: "0.65rem",
      }}
    >
      {children}
    </div>
  );
}

function WorkflowEditorCanvas({
  decoratedNodes,
  edges,
  isPending,
  onConnectEdge,
  onEdgesChange,
  onNodesChange,
  onPickNode,
  onPublish,
  onSave,
  onShuffle,
  validationErrors,
  workflowId,
  workflowName,
  workflowStatus,
  setWorkflowName,
  simulating,
  onSimulate,
}: {
  decoratedNodes: Node<BuilderNodeData>[];
  edges: Edge[];
  isPending: boolean;
  onConnectEdge: (connection: Connection) => void;
  onEdgesChange: OnEdgesChange;
  onNodesChange: OnNodesChange;
  onPickNode: (nodeId: string) => void;
  onPublish: () => void;
  onSave: () => void;
  onShuffle: () => void;
  setWorkflowName: (name: string) => void;
  validationErrors: string[];
  workflowName: string;
  workflowId: string;
  workflowStatus: WorkflowStatus;
  simulating: boolean;
  onSimulate: () => void;
}) {
  const actionsDisabled = isPending || validationErrors.length > 0 || simulating;

  return (
    <div
      style={{
        border: "1px solid #d0d8e1",
        borderRadius: 16,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          alignItems: "center",
          background: "linear-gradient(120deg, #0f4c5c, #1a936f)",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          padding: "0.7rem 0.9rem",
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <input
            aria-label="Nome do workflow"
            onChange={(event) => setWorkflowName(event.target.value)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              padding: "0.4rem 0.55rem",
            }}
            value={workflowName}
          />
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Status atual: {workflowStatus} · editor persistido no backend real.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => (window.location.href = `/workflows/${workflowId}/revisions`)}
            style={{ alignItems: "center", display: "inline-flex", gap: 6 }}
            type="button"
          >
            Revisoes
          </button>
          <button
            onClick={onShuffle}
            style={{ alignItems: "center", display: "inline-flex", gap: 6 }}
            type="button"
          >
            <Shuffle size={14} /> Organizar Canvas
          </button>
          <button
            disabled={actionsDisabled}
            onClick={onSave}
            style={{ alignItems: "center", display: "inline-flex", gap: 6 }}
            type="button"
          >
            <Save size={14} /> Salvar
          </button>
          <button
            disabled={actionsDisabled}
            onClick={onPublish}
            style={{ alignItems: "center", display: "inline-flex", gap: 6 }}
            type="button"
          >
            <Play size={14} /> Publicar
          </button>
          <button
            disabled={actionsDisabled}
            onClick={onSimulate}
            style={{ alignItems: "center", display: "inline-flex", gap: 6, background: "#0284c7" }}
            type="button"
          >
            <Play size={14} /> {simulating ? "Simulando..." : "Simular (Dry Run)"}
          </button>
        </div>
      </header>
      <div style={{ background: "radial-gradient(circle at 20% 0, #f6f9ff, #fff 60%)" }}>
        <ReactFlow
          edges={edges}
          fitView
          nodeTypes={nodeTypes}
          nodes={decoratedNodes}
          onConnect={onConnectEdge}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_event, node) => onPickNode(node.id)}
          onNodesChange={onNodesChange}
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background gap={20} size={1.2} />
        </ReactFlow>
      </div>
    </div>
  );
}

function WorkflowBuilderControls({
  connectorAction,
  onAddConnectorStep,
  onConnectorActionChange,
  onTriggerTopicChange,
  triggerTopic,
}: {
  connectorAction: (typeof WORKFLOW_CONNECTOR_ACTIONS)[number];
  onAddConnectorStep: () => void;
  onConnectorActionChange: (action: (typeof WORKFLOW_CONNECTOR_ACTIONS)[number]) => void;
  onTriggerTopicChange: (topic: (typeof WORKFLOW_EVENT_TOPICS)[number]) => void;
  triggerTopic: string;
}) {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#f8fafc",
        border: "1px solid #d0d8e1",
        borderRadius: 10,
        display: "flex",
        gap: "0.6rem",
        padding: "0.55rem",
      }}
    >
      <select
        onChange={(event) =>
          onTriggerTopicChange(event.target.value as (typeof WORKFLOW_EVENT_TOPICS)[number])
        }
        value={triggerTopic}
      >
        {WORKFLOW_EVENT_TOPICS.map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
      </select>
      <select
        onChange={(event) =>
          onConnectorActionChange(event.target.value as (typeof WORKFLOW_CONNECTOR_ACTIONS)[number])
        }
        value={connectorAction}
      >
        {WORKFLOW_CONNECTOR_ACTIONS.map((action) => (
          <option key={action} value={action}>
            {action}
          </option>
        ))}
      </select>
      <button onClick={onAddConnectorStep} type="button">
        <Zap size={14} /> Adicionar connector
      </button>
    </div>
  );
}

function WorkflowSidebar({
  form,
  loadingError,
  onSubmit,
  saveMessage,
  validationErrors,
}: {
  form: UseFormReturn<SidebarValues>;
  loadingError: string | null;
  onSubmit: (values: SidebarValues) => void;
  saveMessage: string | null;
  validationErrors: string[];
}) {
  return (
    <aside
      style={{
        background: "#fff",
        border: "1px solid #d0d8e1",
        borderRadius: 16,
        display: "grid",
        gap: "0.75rem",
        gridTemplateRows: "auto auto 1fr",
        padding: "0.9rem",
      }}
    >
      <h3 style={{ margin: 0 }}>Node Sidebar</h3>
      <div style={{ color: "#455a64", fontSize: 13 }}>
        Esta tela agora carrega e salva o canvas real do workflow. Edite um node e publique sem
        depender de `initialNodes`.
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "grid", gap: "0.55rem" }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Label</span>
          <input {...form.register("label")} />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Config JSON</span>
          <textarea
            {...form.register("configJson")}
            rows={14}
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
          {form.formState.errors.configJson ? (
            <small style={{ color: "#c1121f" }}>{form.formState.errors.configJson.message}</small>
          ) : null}
        </label>

        <button type="submit">
          <Zap size={14} /> Aplicar no Node
        </button>
      </form>

      {loadingError ? (
        <StatusNotice background="#fff5f5" border="1px solid #ffb3c1" color="#9d0208">
          {loadingError}
        </StatusNotice>
      ) : null}

      {saveMessage ? (
        <StatusNotice background="#edfdf4" border="1px solid #95d5b2" color="#1b4332">
          {saveMessage}
        </StatusNotice>
      ) : null}

      {validationErrors.length > 0 ? (
        <StatusNotice background="#fff5f5" border="1px solid #ffb3c1" color="#9d0208">
          {validationErrors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </StatusNotice>
      ) : (
        <StatusNotice background="#edfdf4" border="1px solid #95d5b2" color="#1b4332">
          Canvas valido. Pronto para salvar/publicar.
        </StatusNotice>
      )}
    </aside>
  );
}

export default function WorkflowEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [workflowName, setWorkflowName] = useState(`Workflow ${id}`);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("DRAFT");
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [simulating, setSimulating] = useState(false);
  const [simulationPayload, setSimulationPayload] = useState("{}");
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<
    Record<string, "SUCCESS" | "FAILED" | "WAITING">
  >({});
  const [connectorAction, setConnectorAction] = useState<
    (typeof WORKFLOW_CONNECTOR_ACTIONS)[number]
  >(WORKFLOW_CONNECTOR_ACTIONS[0]);

  useWorkflowLoader({
    id,
    setEdges,
    setLoadingError,
    setNodes,
    setSelectedNodeId,
    setWorkflowName,
    setWorkflowStatus,
  });

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );
  const form = useWorkflowForm(selectedNode);
  const triggerTopic = useMemo(() => {
    const trigger = nodes.find((node) => node.data.stepType === "TRIGGER_EVENT");
    const topic = trigger?.data.config.topic;
    return typeof topic === "string" ? topic : WORKFLOW_EVENT_TOPICS[0];
  }, [nodes]);
  const validation = useMemo(() => buildValidation(nodes, edges), [edges, nodes]);
  const decoratedNodes = useMemo(() => {
    return decorateNodes(nodes, validation.invalidNodeIds).map((node) => {
      const simStatus = simulatedResults[node.id];
      if (!simStatus) return node;
      return {
        ...node,
        style: {
          background:
            simStatus === "FAILED" ? "#fff5f5" : simStatus === "SUCCESS" ? "#ecfff5" : "#f8fafc",
          border:
            simStatus === "FAILED"
              ? "2px solid #c1121f"
              : simStatus === "SUCCESS"
                ? "2px solid #1b4332"
                : "1px solid #cbd5e1",
        },
      };
    });
  }, [nodes, validation.invalidNodeIds, simulatedResults]);

  function handlePersist(status: Exclude<WorkflowStatus, "ARCHIVED">): void {
    setSaveMessage(null);
    startTransition(() => {
      void saveWorkflowDefinition(apiBaseUrl, id, workflowName, nodes, edges, status)
        .then((payload) => {
          setWorkflowStatus(payload.workflow.status);
          setSaveMessage(
            status === "PUBLISHED" ? "Workflow publicado." : "Workflow salvo em draft."
          );
        })
        .catch((error) => {
          setLoadingError(error instanceof Error ? error.message : "Falha ao salvar.");
        });
    });
  }

  async function runSimulation() {
    setSimulating(true);
    setShowSimulationModal(false);
    setLoadingError(null);
    setSimulatedResults({});
    setSaveMessage("Iniciando dry run...");

    try {
      const payload = JSON.parse(simulationPayload) as Record<string, unknown>;
      const { executionId } = await startWorkflowDryRun(apiBaseUrl, id, payload);

      // Poll para pegar os resultados da execucao
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 10) {
          clearInterval(poll);
          setSimulating(false);
          setLoadingError("Simulação demorou muito.");
          return;
        }

        try {
          const run = await loadWorkflowSimulationResult(apiBaseUrl, id, executionId);
          if (run) {
            clearInterval(poll);
            setSimulating(false);
            setSaveMessage(`Dry Run Finalizado: ${run.runStatus}`);
            setSimulatedResults(run.stepStatuses);
          }
        } catch (e) {
          clearInterval(poll);
          setSimulating(false);
          setLoadingError(e instanceof Error ? e.message : "Falha ao carregar simulacao.");
        }
      }, 1000);
    } catch (e) {
      setSimulating(false);
      setLoadingError(e instanceof Error ? e.message : "Payload invalido");
    }
  }

  function handleSidebarSubmit(values: SidebarValues): void {
    if (!selectedNodeId) {
      return;
    }

    try {
      setNodes((currentNodes) => applySidebarValues(currentNodes, selectedNodeId, values));
    } catch {
      form.setError("configJson", {
        message: "JSON invalido.",
      });
    }
  }

  function handleTriggerTopicChange(topic: (typeof WORKFLOW_EVENT_TOPICS)[number]): void {
    setNodes((currentNodes) => {
      const triggerIndex = currentNodes.findIndex((node) => node.data.category === "trigger");
      if (triggerIndex < 0) {
        return [
          {
            data: {
              category: "trigger",
              config: { topic },
              label: `Trigger ${topic}`,
              status: workflowStatus === "PUBLISHED" ? "published" : "draft",
              stepType: "TRIGGER_EVENT",
            },
            id: "trigger_event",
            position: { x: 0, y: 0 },
            type: "trigger",
          },
          ...currentNodes,
        ];
      }

      return currentNodes.map((node, index) =>
        index === triggerIndex
          ? {
              ...node,
              data: {
                ...node.data,
                category: "trigger",
                config: { topic },
                label: `Trigger ${topic}`,
                stepType: "TRIGGER_EVENT",
              },
              type: "trigger",
            }
          : node
      );
    });
  }

  function handleAddConnectorStep(): void {
    setNodes((currentNodes) => {
      const stepNumber = currentNodes.length + 1;
      const stepKey = `connector_${stepNumber}`;
      const previousStep = currentNodes.at(-1);
      if (previousStep) {
        setEdges((currentEdges) => [
          ...currentEdges,
          {
            id: `edge_${currentEdges.length + 1}`,
            source: previousStep.id,
            target: stepKey,
            type: "smoothstep",
          },
        ]);
      }

      return autoLayout([
        ...currentNodes,
        {
          data: {
            category: "action",
            config: {
              action: connectorAction,
              payload: {},
            },
            label: connectorAction,
            status: workflowStatus === "PUBLISHED" ? "published" : "draft",
            stepType: "CONNECTOR_ACTION",
          },
          id: stepKey,
          position: { x: 0, y: 0 },
          type: "action",
        },
      ]);
    });
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "0.75rem",
        gridTemplateColumns: "minmax(0, 1fr) 340px",
        height: "calc(100vh - 110px)",
      }}
    >
      <div style={{ display: "grid", gap: "0.55rem", minHeight: 0 }}>
        <WorkflowBuilderControls
          connectorAction={connectorAction}
          onAddConnectorStep={handleAddConnectorStep}
          onConnectorActionChange={setConnectorAction}
          onTriggerTopicChange={handleTriggerTopicChange}
          triggerTopic={triggerTopic}
        />
        <WorkflowEditorCanvas
          decoratedNodes={decoratedNodes}
          edges={edges}
          isPending={isPending}
          onConnectEdge={(connection) =>
            setEdges((currentEdges) => addEdge(connection, currentEdges))
          }
          onEdgesChange={onEdgesChange}
          onNodesChange={onNodesChange}
          onPickNode={setSelectedNodeId}
          onPublish={() => handlePersist("PUBLISHED")}
          onSave={() => handlePersist("DRAFT")}
          onShuffle={() => setNodes((currentNodes) => autoLayout(currentNodes))}
          setWorkflowName={setWorkflowName}
          validationErrors={validation.errors}
          workflowId={id}
          workflowName={workflowName}
          workflowStatus={workflowStatus}
          simulating={simulating}
          onSimulate={() => setShowSimulationModal(true)}
        />
      </div>
      <WorkflowSidebar
        form={form}
        loadingError={loadingError}
        onSubmit={handleSidebarSubmit}
        saveMessage={saveMessage}
        validationErrors={validation.errors}
      />

      {showSimulationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: 16,
              width: 400,
              display: "grid",
              gap: "1rem",
            }}
          >
            <h3 style={{ margin: 0 }}>Simular Dry Run</h3>
            <p style={{ margin: 0, fontSize: 13, color: "#455a64" }}>
              Insira o payload JSON de entrada. Side-effects (como chamadas HTTP reais) serão
              pulados. O resultado será projetado no canvas!
            </p>
            <textarea
              rows={8}
              value={simulationPayload}
              onChange={(e) => setSimulationPayload(e.target.value)}
              style={{ fontFamily: "monospace", width: "100%", padding: "0.5rem" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowSimulationModal(false)}
                type="button"
                style={{ background: "#e2e8f0", color: "#1e293b" }}
              >
                Cancelar
              </button>
              <button
                onClick={runSimulation}
                type="button"
                style={{ background: "#0284c7", color: "#fff" }}
              >
                Executar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
