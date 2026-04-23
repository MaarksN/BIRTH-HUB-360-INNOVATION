import { getWebConfig } from "./web-config";
import { cookies } from "next/headers";

import { fetchWithTimeout } from "./fetch-with-timeout";

const DASHBOARD_REQUEST_TIMEOUT_MS = 8_000;

export interface DashboardFinanceItem {
  delta: string;
  label: string;
  value: string;
}

export interface DashboardPipelineItem {
  stage: string;
  trend: string;
  value: number;
}

export interface DashboardHealthScoreItem {
  client: string;
  nps: number;
  risk: string;
  score: number;
}

export interface DashboardAttributionItem {
  cac: string;
  conversion: string;
  leads: number;
  source: string;
}

export interface DashboardContractItem {
  customer: string;
  mrr: string;
  owner: string;
  status: string;
}

export interface DashboardMetrics {
  finance: DashboardFinanceItem[];
  pipeline: DashboardPipelineItem[];
}

export interface DashboardAgentStatuses {
  healthScore: DashboardHealthScoreItem[];
}

export interface DashboardRecentTasks {
  attribution: DashboardAttributionItem[];
  contracts: DashboardContractItem[];
}

export interface DashboardBillingSummary {
  finance: DashboardFinanceItem[];
}

export interface DashboardSnapshot {
  agentStatuses: DashboardAgentStatuses;
  billingSummary: DashboardBillingSummary;
  metrics: DashboardMetrics;
  recentTasks: DashboardRecentTasks;
}

async function fetchDashboardJson<T>(path: string): Promise<T> {
  const config = getWebConfig();
  const cookieStore = typeof window === "undefined" ? await cookies() : null;
  const requestInit: RequestInit = {
    cache: "no-store",
    ...(typeof window === "undefined" ? {} : { credentials: "include" }),
    ...(cookieStore ? { headers: { cookie: cookieStore.toString() } } : {}),
  };
  const response = await fetchWithTimeout(`${config.NEXT_PUBLIC_API_URL}${path}`, {
    ...requestInit,
    timeoutMessage: `Dashboard API exceeded the ${DASHBOARD_REQUEST_TIMEOUT_MS}ms timeout budget for ${path}.`,
    timeoutMs: DASHBOARD_REQUEST_TIMEOUT_MS,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [metrics, agentStatuses, recentTasks, billingSummary] = await Promise.all([
    fetchDashboardJson<DashboardMetrics>("/api/v1/dashboard/metrics"),
    fetchDashboardJson<DashboardAgentStatuses>("/api/v1/dashboard/agent-statuses"),
    fetchDashboardJson<DashboardRecentTasks>("/api/v1/dashboard/recent-tasks"),
    fetchDashboardJson<DashboardBillingSummary>("/api/v1/dashboard/billing-summary"),
  ]);

  return {
    agentStatuses,
    billingSummary,
    metrics,
    recentTasks,
  };
}
