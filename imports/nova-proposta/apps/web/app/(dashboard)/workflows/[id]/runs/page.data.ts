import type { Edge, Node } from "reactflow";

import type { WorkflowCanvas } from "@birthub/workflows-core/nextjs";

import { fetchWithSession } from "../../../../../lib/auth-client";

export type WorkflowExecutionSnapshot = {
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  id: string;
  isDryRun?: boolean;
  startedAt: string;
  status: "CANCELLED" | "FAILED" | "RUNNING" | "SUCCESS" | "WAITING";
  stepResults: Array<{
    errorMessage: string | null;
    input: Record<string, unknown> | null;
    output: Record<string, unknown> | null;
    status: "FAILED" | "SKIPPED" | "SUCCESS" | "WAITING";
    step: {
      id: string;
      key: string;
      name: string;
      type: string;
    };
  }>;
};

export type WorkflowResponse = {
  workflow: {
    definition: WorkflowCanvas | null;
    executions: WorkflowExecutionSnapshot[];
    name: string;
  };
};

export const WORKFLOW_RUNS_TIMEOUT_MS = 10_000;

export function buildGraph(canvas: WorkflowCanvas | null): {
  edges: Edge[];
  nodes: Node[];
} {
  const safeCanvas =
    canvas ??
    ({
      steps: [],
      transitions: []
    } satisfies WorkflowCanvas);
  const nodes = safeCanvas.steps.map((step, index) => ({
    data: { label: step.name },
    id: step.key,
    position: {
      x: (index % 4) * 260,
      y: Math.floor(index / 4) * 170
    },
    type: "default"
  }));
  const edges = safeCanvas.transitions.map((transition, index) => ({
    id: `edge_${index + 1}`,
    label: transition.route === "ALWAYS" ? undefined : transition.route,
    source: transition.source,
    target: transition.target,
    type: "smoothstep"
  }));

  return { edges, nodes };
}

export function maskSecrets(payload: Record<string, unknown>): string {
  const clone = { ...payload };
  for (const key of Object.keys(clone)) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.includes("secret") || normalizedKey.includes("token")) {
      clone[key] = "***";
    }
  }

  return JSON.stringify(clone, null, 2);
}

export async function loadWorkflowRuns(workflowId: string): Promise<WorkflowResponse> {
  const response = await fetchWithSession(`/api/v1/workflows/${encodeURIComponent(workflowId)}`, {
    timeoutMessage: `Falha ao carregar workflow dentro do limite de ${WORKFLOW_RUNS_TIMEOUT_MS}ms.`,
    timeoutMs: WORKFLOW_RUNS_TIMEOUT_MS
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar workflow (${response.status}).`);
  }

  return (await response.json()) as WorkflowResponse;
}

export async function retryWorkflowRun(input: {
  failedExecutionId: string;
  failedStepKey?: string | undefined;
  workflowId: string;
}): Promise<void> {
  const response = await fetchWithSession(
    `/api/v1/workflows/${encodeURIComponent(input.workflowId)}/run`,
    {
    body: JSON.stringify({
      async: true,
      payload: {},
      retry: {
        fromExecutionId: input.failedExecutionId,
        ...(input.failedStepKey ? { fromStepKey: input.failedStepKey } : {})
      }
    }),
    headers: {
      "content-type": "application/json"
    },
    method: "POST",
    timeoutMessage: `Falha ao reenfileirar workflow dentro do limite de ${WORKFLOW_RUNS_TIMEOUT_MS}ms.`,
      timeoutMs: WORKFLOW_RUNS_TIMEOUT_MS
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao reenfileirar workflow (${response.status}).`);
  }
}

