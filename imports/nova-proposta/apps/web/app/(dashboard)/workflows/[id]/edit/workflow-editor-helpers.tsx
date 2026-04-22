import { Handle, Position, type Edge, type Node, type NodeProps } from "reactflow";

import {
  stepSchema as rawStepSchema,
  validateDag as rawValidateDag
} from "@birthub/workflows-core/nextjs";

import { fetchWithSession } from "../../../../../lib/auth-client";

export type BuilderNodeData = {
  category: "action" | "condition" | "trigger";
  config: Record<string, unknown>;
  hasError?: boolean;
  label: string;
  stepType:
    | "TRIGGER_WEBHOOK"
    | "HTTP_REQUEST"
    | "CONDITION"
    | "SEND_NOTIFICATION"
    | "DELAY"
    | "TRANSFORMER"
    | "AI_TEXT_EXTRACT"
    | "AGENT_EXECUTE"
    | "AGENT_HANDOFF"
    | "CRM_UPSERT"
    | "WHATSAPP_SEND"
    | "GOOGLE_EVENT"
    | "MS_EVENT"
    | "CODE"
    | "TRIGGER_CRON"
    | "TRIGGER_EVENT";
  status: "draft" | "published";
};

type WorkflowCanvas = {
  steps: Array<{
    config: Record<string, unknown>;
    isTrigger?: boolean;
    key: string;
    name: string;
    type: BuilderNodeData["stepType"];
  }>;
  transitions: Array<{
    route?: WorkflowRoute;
    source: string;
    target: string;
  }>;
};

export type WorkflowResponse = {
  workflow: {
    definition: WorkflowCanvas | null;
    executions?: Array<{
      id: string;
      status: string;
      stepResults: Array<{
        status: string;
        step: {
          key: string;
        };
      }>;
    }>;
    name: string;
    status: "ARCHIVED" | "DRAFT" | "PUBLISHED";
  };
};

export type SidebarValues = {
  configJson: string;
  label: string;
};

export type ValidationResult = {
  errors: string[];
  invalidNodeIds: string[];
};

export type WorkflowSimulationResult = {
  executionId: string;
  runStatus: "FAILED" | "SUCCESS";
  stepStatuses: Record<string, "FAILED" | "SUCCESS" | "WAITING">;
};

export const FALLBACK_CANVAS: WorkflowCanvas = {
  steps: [
    {
      config: { method: "POST", path: "/webhooks/trigger/default" },
      isTrigger: true,
      key: "trigger_1",
      name: "Webhook Trigger",
      type: "TRIGGER_WEBHOOK"
    }
  ],
  transitions: []
};

const WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS = 10_000;

type WorkflowRoute = "ALWAYS" | "FALLBACK" | "IF_FALSE" | "IF_TRUE" | "ON_FAILURE" | "ON_SUCCESS";

type StepSchemaLike = {
  safeParse: (input: unknown) => {
    success: boolean;
  };
};

type DagValidationInput = {
  edges: Array<{
    route: WorkflowRoute;
    source: string;
    target: string;
  }>;
  nodes: Array<{
    id: string;
    isTrigger: boolean;
    type: BuilderNodeData["stepType"];
  }>;
};

const stepSchema = rawStepSchema as unknown as StepSchemaLike;
const validateDag = rawValidateDag as unknown as (input: DagValidationInput) => void;

function stepTypeToCategory(stepType: BuilderNodeData["stepType"]): BuilderNodeData["category"] {
  if (stepType.startsWith("TRIGGER")) {
    return "trigger";
  }

  if (stepType === "CONDITION") {
    return "condition";
  }

  return "action";
}

function handleStyle(color: string) {
  return {
    background: color,
    border: "2px solid #fff",
    height: 12,
    width: 12
  };
}

function WorkflowNode({ data }: NodeProps<BuilderNodeData>) {
  const palette =
    data.category === "trigger"
      ? { accent: "#0466c8", bg: "#eef6ff" }
      : data.category === "condition"
        ? { accent: "#9f4d00", bg: "#fff6eb" }
        : { accent: "#0a7f4f", bg: "#ecfff5" };

  return (
    <div
      style={{
        background: palette.bg,
        border: `2px solid ${data.hasError ? "#c1121f" : palette.accent}`,
        borderRadius: 12,
        boxShadow: "0 10px 18px rgba(0,0,0,0.08)",
        minWidth: 210,
        padding: "0.75rem 0.9rem"
      }}
    >
      <Handle position={Position.Left} style={handleStyle(palette.accent)} type="target" />
      <div style={{ color: "#4f4f4f", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
        {data.stepType}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{data.label}</div>
      <div style={{ color: "#667085", fontSize: 12, marginTop: 2 }}>
        status: {data.status}
      </div>
      <Handle position={Position.Right} style={handleStyle(palette.accent)} type="source" />
    </div>
  );
}

export const nodeTypes = {
  action: WorkflowNode,
  condition: WorkflowNode,
  trigger: WorkflowNode
} as const;

export function autoLayout(nodes: Node<BuilderNodeData>[]): Node<BuilderNodeData>[] {
  return nodes.map((node, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    return {
      ...node,
      position: {
        x: column * 280,
        y: row * 180
      }
    };
  });
}

export function normalizeEdgeRoute(label: Edge["label"]): WorkflowRoute {
  if (typeof label !== "string") {
    return "ALWAYS";
  }

  if (label === "IF_TRUE" || label === "IF_FALSE" || label === "ON_FAILURE" || label === "ON_SUCCESS" || label === "FALLBACK") {
    return label;
  }

  return "ALWAYS";
}

export function canvasToFlow(
  canvas: WorkflowCanvas,
  workflowStatus: "ARCHIVED" | "DRAFT" | "PUBLISHED"
): {
  edges: Edge[];
  nodes: Node<BuilderNodeData>[];
} {
  const nodes = canvas.steps.map((step, index) => ({
    data: {
      category: stepTypeToCategory(step.type),
      config: step.config,
      label: step.name,
      status: workflowStatus === "PUBLISHED" ? ("published" as const) : ("draft" as const),
      stepType: step.type
    },
    id: step.key,
    position: {
      x: (index % 4) * 280,
      y: Math.floor(index / 4) * 180
    },
    type: stepTypeToCategory(step.type)
  }));
  const edges = canvas.transitions.map((transition, index) => ({
    id: `edge_${index + 1}`,
    label: transition.route === "ALWAYS" ? undefined : transition.route,
    source: transition.source,
    target: transition.target,
    type: "smoothstep"
  }));

  return {
    edges,
    nodes
  };
}

export function flowToCanvas(nodes: Node<BuilderNodeData>[], edges: Edge[]): WorkflowCanvas {
  return {
    steps: nodes.map((node) => ({
      config: node.data.config,
      ...(node.data.stepType.startsWith("TRIGGER") ? { isTrigger: true } : {}),
      key: node.id,
      name: node.data.label,
      type: node.data.stepType
    })),
    transitions: edges.map((edge) => ({
      route: normalizeEdgeRoute(edge.label),
      source: edge.source,
      target: edge.target
    }))
  } as WorkflowCanvas;
}

export function buildValidation(nodes: Node<BuilderNodeData>[], edges: Edge[]): ValidationResult {
  const nodeErrors = new Set<string>();
  const messages: string[] = [];

  for (const node of nodes) {
    const parsed = stepSchema.safeParse({
      config: node.data.config,
      key: node.id,
      name: node.data.label,
      type: node.data.stepType
    });

    if (!parsed.success) {
      nodeErrors.add(node.id);
      messages.push(`${node.data.label}: configuracao invalida para ${node.data.stepType}.`);
    }
  }

  try {
    validateDag({
      edges: edges.map((edge) => ({
        route: normalizeEdgeRoute(edge.label),
        source: edge.source,
        target: edge.target
      })),
      nodes: nodes.map((node) => ({
        id: node.id,
        isTrigger: node.data.stepType.startsWith("TRIGGER"),
        type: node.data.stepType
      }))
    });
  } catch (error) {
    messages.push(error instanceof Error ? error.message : "Erro de DAG.");
  }

  return {
    errors: messages,
    invalidNodeIds: Array.from(nodeErrors).sort()
  };
}

export function decorateNodes(
  nodes: Node<BuilderNodeData>[],
  invalidNodeIds: string[]
): Node<BuilderNodeData>[] {
  const invalidIds = new Set(invalidNodeIds);

  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      hasError: invalidIds.has(node.id)
    }
  }));
}

export function applySidebarValues(
  nodes: Node<BuilderNodeData>[],
  selectedNodeId: string,
  values: SidebarValues
): Node<BuilderNodeData>[] {
  const config = JSON.parse(values.configJson) as Record<string, unknown>;

  return nodes.map((node) =>
    node.id === selectedNodeId
      ? {
          ...node,
          data: {
            ...node.data,
            config,
            label: values.label
          }
        }
      : node
  );
}

export async function loadWorkflowDefinition(apiBaseUrl: string, workflowId: string) {
  const response = await fetchWithSession(
    `${apiBaseUrl}/api/v1/workflows/${encodeURIComponent(workflowId)}`,
    {
      timeoutMessage: `Falha ao carregar workflow dentro do limite de ${WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS}ms.`,
      timeoutMs: WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao carregar workflow (${response.status}).`);
  }

  const payload = (await response.json()) as WorkflowResponse;
  const canvas = payload.workflow.definition ?? FALLBACK_CANVAS;

  return {
    flow: canvasToFlow(canvas, payload.workflow.status),
    payload
  };
}

export async function saveWorkflowDefinition(
  apiBaseUrl: string,
  workflowId: string,
  workflowName: string,
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  status: "DRAFT" | "PUBLISHED"
): Promise<WorkflowResponse> {
  const response = await fetchWithSession(
    `${apiBaseUrl}/api/v1/workflows/${encodeURIComponent(workflowId)}`,
    {
      body: JSON.stringify({
        canvas: flowToCanvas(nodes, edges),
        name: workflowName,
        status
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "PUT",
      timeoutMessage: `Falha ao salvar workflow dentro do limite de ${WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS}ms.`,
      timeoutMs: WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao salvar workflow (${response.status}).`);
  }

  return (await response.json()) as WorkflowResponse;
}

export async function startWorkflowDryRun(
  apiBaseUrl: string,
  workflowId: string,
  payload: Record<string, unknown>
): Promise<{
  executionId: string;
}> {
  const response = await fetchWithSession(
    `${apiBaseUrl}/api/v1/workflows/${encodeURIComponent(workflowId)}/run`,
    {
      body: JSON.stringify({
        async: false,
        dryRun: true,
        payload
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      timeoutMessage: `Falha ao iniciar dry run dentro do limite de ${WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS}ms.`,
      timeoutMs: WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS
    }
  );

  if (!response.ok) {
    throw new Error(`Erro: ${response.status}`);
  }

  return (await response.json()) as {
    executionId: string;
  };
}

export async function loadWorkflowSimulationResult(
  apiBaseUrl: string,
  workflowId: string,
  executionId: string
): Promise<WorkflowSimulationResult | null> {
  const response = await fetchWithSession(
    `${apiBaseUrl}/api/v1/workflows/${encodeURIComponent(workflowId)}`,
    {
      timeoutMessage: `Falha ao consultar dry run dentro do limite de ${WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS}ms.`,
      timeoutMs: WORKFLOW_EDITOR_REQUEST_TIMEOUT_MS
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao consultar simulacao (${response.status}).`);
  }

  const payload = (await response.json()) as WorkflowResponse;
  const run = payload.workflow.executions?.find((candidate) => candidate.id === executionId);

  if (!run || (run.status !== "SUCCESS" && run.status !== "FAILED")) {
    return null;
  }

  return {
    executionId,
    runStatus: run.status,
    stepStatuses: run.stepResults.reduce<Record<string, "FAILED" | "SUCCESS" | "WAITING">>(
      (accumulator, result) => ({
        ...accumulator,
        [result.step.key]: result.status as "FAILED" | "SUCCESS" | "WAITING"
      }),
      {}
    )
  };
}

