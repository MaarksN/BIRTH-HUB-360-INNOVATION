import { prisma } from "@birthub/database";

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

function percentile(values: number[], factor: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * factor) - 1));
  return sorted[index] ?? 0;
}

function mapStatus(status: string): OutputStatus {
  return status === "WAITING_APPROVAL" ? "WAITING_APPROVAL" : "COMPLETED";
}

function mapType(type: string): OutputType {
  return type === "technical-log" ? "technical-log" : "executive-report";
}

function toOutputRecord(record: {
  agentId: string;
  approvedAt: Date | null;
  approvedByUserId: string | null;
  content: string;
  contentHash: string;
  createdAt: Date;
  createdByUserId: string;
  id: string;
  status: string;
  tenantId: string;
  type: string;
}): OutputRecord {
  return {
    agentId: record.agentId,
    approvedAt: record.approvedAt?.toISOString() ?? null,
    approvedByUserId: record.approvedByUserId,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
    createdByUserId: record.createdByUserId,
    id: record.id,
    outputHash: record.contentHash,
    status: mapStatus(record.status),
    tenantId: record.tenantId,
    type: mapType(record.type)
  };
}

export async function listOutputsByExecution(
  tenantId: string,
  executionId: string
): Promise<OutputRecord[]> {
  const links = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 250,
    where: {
      action: "AGENT_OUTPUT_CREATED",
      entityId: executionId,
      entityType: "agent_execution",
      tenantId
    }
  });

  const outputIds = links
    .map((entry) => {
      if (!entry.diff || typeof entry.diff !== "object") {
        return null;
      }

      const outputId = (entry.diff as { outputId?: unknown }).outputId;
      return typeof outputId === "string" ? outputId : null;
    })
    .filter((value): value is string => value !== null);

  if (outputIds.length === 0) {
    return [];
  }

  const outputs = await prisma.outputArtifact.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 250,
    where: {
      id: {
        in: outputIds
      },
      tenantId
    }
  });

  return outputs.map((output) => toOutputRecord(output));
}

export async function approveOutput(
  outputId: string,
  tenantId: string,
  approvedByUserId: string
): Promise<OutputRecord | null> {
  const current = await prisma.outputArtifact.findFirst({
    where: {
      id: outputId,
      tenantId
    }
  });

  if (!current) {
    return null;
  }

  const updated = await prisma.outputArtifact.update({
    data: {
      approvedAt: new Date(),
      approvedByUserId,
      status: "COMPLETED"
    },
    where: {
      id: current.id
    }
  });

  return toOutputRecord(updated);
}

export async function getAgentMetrics(input: {
  agentId: string;
  tenantId: string;
  windowMinutes?: number;
}): Promise<AgentMetricsSnapshot> {
  const to = new Date();
  const from = new Date(to.getTime() - (input.windowMinutes ?? 60) * 60 * 1000);

  const logs = await prisma.agentExecution.findMany({
    where: {
      agentId: input.agentId,
      startedAt: {
        gte: from
      },
      tenantId: input.tenantId
    }
  });

  const normalized = logs
    .filter((log): log is typeof log & { status: "FAILED" | "SUCCESS" } => log.status !== "RUNNING" && log.status !== "WAITING_APPROVAL")
    .map((log) => {
      const metadata = log.metadata && typeof log.metadata === "object" ? (log.metadata as Record<string, unknown>) : {};
      const durationMs =
        log.completedAt instanceof Date
          ? Math.max(0, log.completedAt.getTime() - log.startedAt.getTime())
          : 0;

      return {
        durationMs,
        status: log.status,
        toolCost: typeof metadata.toolCost === "number" ? metadata.toolCost : 0
      };
    });

  const failures = normalized.filter((log) => log.status === "FAILED").length;
  const latencies = normalized.map((log) => log.durationMs);
  const totalCost = normalized.reduce((total, log) => total + log.toolCost, 0);

  return {
    agentId: input.agentId,
    execution_count: normalized.length,
    fail_rate: normalized.length > 0 ? failures / normalized.length : 0,
    from: from.toISOString(),
    p50_latency_ms: percentile(latencies, 0.5),
    p95_latency_ms: percentile(latencies, 0.95),
    p99_latency_ms: percentile(latencies, 0.99),
    to: to.toISOString(),
    tool_cost: Math.round(totalCost * 100) / 100
  };
}
