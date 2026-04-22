import { getWebConfig } from "@birthub/config/web";
import type { WorkflowCanvas } from "@birthub/workflows-core/nextjs";
import { cookies } from "next/headers";

import { fetchWithTimeout } from "@birthub/utils/fetch";

type WorkflowStatus = "ARCHIVED" | "DRAFT" | "PUBLISHED";

export interface WorkflowListItem {
  _count: {
    executions: number;
    steps: number;
  };
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  status: WorkflowStatus;
  stepLint?: {
    findings: unknown[];
    score: number;
    summary: {
      critical: number;
      info: number;
      warning: number;
    };
  } | null;
  triggerType: string;
  updatedAt: string;
  version: number;
}

export interface WorkflowExecutionSnapshot {
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  id: string;
  startedAt: string;
  status: "CANCELLED" | "FAILED" | "RUNNING" | "SUCCESS" | "WAITING";
  stepResults: Array<{
    errorMessage: string | null;
    finishedAt: string | null;
    id: string;
    input: Record<string, unknown> | null;
    output: Record<string, unknown> | null;
    startedAt: string;
    status: "FAILED" | "SKIPPED" | "SUCCESS" | "WAITING";
    step: {
      id: string;
      key: string;
      name: string;
      type: string;
    };
  }>;
}

export interface WorkflowDetail {
  definition: WorkflowCanvas | null;
  description: string | null;
  executions: WorkflowExecutionSnapshot[];
  id: string;
  name: string;
  status: WorkflowStatus;
  steps: Array<{
    config: Record<string, unknown>;
    id: string;
    isTrigger: boolean;
    key: string;
    name: string;
    type: string;
  }>;
  transitions: Array<{
    id: string;
    route: string;
    sourceStepId: string;
    targetStepId: string;
  }>;
  triggerType: string;
}

const WORKFLOWS_REQUEST_TIMEOUT_MS = 8_000;

async function fetchJson<T>(path: string): Promise<T> {
  const config = getWebConfig();
  const cookieStore = typeof window === "undefined" ? await cookies() : null;
  const requestInit: RequestInit = {
    cache: "no-store",
    ...(typeof window === "undefined" ? {} : { credentials: "include" }),
    ...(cookieStore ? { headers: { cookie: cookieStore.toString() } } : {})
  };
  const response = await fetchWithTimeout(`${config.NEXT_PUBLIC_API_URL}${path}`, {
    ...requestInit,
    timeoutMessage: `Workflows API exceeded the ${WORKFLOWS_REQUEST_TIMEOUT_MS}ms timeout budget for ${path}.`,
    timeoutMs: WORKFLOWS_REQUEST_TIMEOUT_MS
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function listWorkflows(): Promise<WorkflowListItem[]> {
  const payload = await fetchJson<{
    items?: WorkflowListItem[];
    requestId?: string;
  }>("/api/v1/workflows");

  return payload.items ?? [];
}

export async function getWorkflowById(id: string): Promise<WorkflowDetail | null> {
  try {
    const payload = await fetchJson<{
      requestId: string;
      workflow: WorkflowDetail;
    }>(`/api/v1/workflows/${encodeURIComponent(id)}`);
    return payload.workflow;
  } catch {
    return null;
  }
}
