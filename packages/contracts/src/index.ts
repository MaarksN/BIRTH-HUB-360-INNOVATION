export type OutputType = "executive-report" | "technical-log";
export type OutputStatus = "COMPLETED" | "WAITING_APPROVAL";

export interface OutputRecord {
  agentId: string;
  approvedAt: string | null;
  approvedByUserId: string | null;
  content: string;
  createdAt: string;
  createdByUserId: string;
  id: string;
  outputHash: string;
  status: OutputStatus;
  tenantId: string;
  type: OutputType;
}

export interface AgentMetricsSnapshot {
  agentId: string;
  execution_count: number;
  fail_rate: number;
  from: string;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  to: string;
  tool_cost: number;
}
