import { executeManifestAgentRuntime } from "./runtime.orchestration.js";
import { Prisma, prisma } from "@birthub/database";
import type { AgentMetricsSnapshot, OutputRecord, OutputStatus, OutputType } from "@birthub/contracts";
import { createLogger } from "@birthub/logger";

const logger = createLogger("worker-runtime");

function mapOutputType(type: string): OutputType {
  return type === "technical-log" ? "technical-log" : "executive-report";
}

function mapOutputStatus(status: string): OutputStatus {
  return status === "WAITING_APPROVAL" ? "WAITING_APPROVAL" : "COMPLETED";
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
    status: mapOutputStatus(record.status),
    tenantId: record.tenantId,
    type: mapOutputType(record.type)
  };
}

async function listOutputsByExecution(tenantId: string, executionId: string): Promise<OutputRecord[]> {
  const links = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
    where: {
      action: "AGENT_OUTPUT_CREATED",
      entityId: executionId,
      entityType: "agent_execution",
      tenantId
    }
  });

  const outputIds = links
    .map((link) => {
      if (!link.diff || typeof link.diff !== "object") return null;
      const outputId = (link.diff as { outputId?: unknown }).outputId;
      return typeof outputId === "string" ? outputId : null;
    })
    .filter((value): value is string => value !== null);

  if (outputIds.length === 0) return [];

  const outputs = await prisma.outputArtifact.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
    where: { id: { in: outputIds }, tenantId }
  });

  return outputs.map((record) => toOutputRecord(record));
}

async function approveOutput(outputId: string, tenantId: string, approvedByUserId: string): Promise<OutputRecord | null> {
  const current = await prisma.outputArtifact.findFirst({ where: { id: outputId, tenantId } });
  if (!current) return null;

  const updated = await prisma.outputArtifact.update({
    data: { approvedAt: new Date(), approvedByUserId, status: "COMPLETED" },
    where: { id: current.id }
  });

  return toOutputRecord(updated);
}

async function getAgentMetrics(tenantId: string, agentId: string, windowMinutes = 60): Promise<AgentMetricsSnapshot> {
  const to = new Date();
  const from = new Date(to.getTime() - windowMinutes * 60 * 1000);
  const rows = await prisma.agentExecution.findMany({
    orderBy: { startedAt: "desc" },
    take: 1000,
    where: { agentId, tenantId, startedAt: { gte: from } }
  });
  const logs = rows.filter((row) => row.status === "FAILED" || row.status === "SUCCESS");
  const failures = logs.filter((log) => log.status === "FAILED").length;
  const latencies = logs.map((log) => (log.completedAt ? Math.max(0, log.completedAt.getTime() - log.startedAt.getTime()) : 0));
  const totalCost = logs.reduce((sum, log) => {
    if (!log.metadata || typeof log.metadata !== "object") return sum;
    const cost = (log.metadata as { toolCost?: unknown }).toolCost;
    return sum + (typeof cost === "number" && Number.isFinite(cost) ? cost : 0);
  }, 0);
  const percentile = (values: number[], p: number): number => {
    if (values.length === 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
    return sorted[idx] ?? 0;
  };

  return {
    agentId,
    execution_count: logs.length,
    fail_rate: logs.length > 0 ? failures / logs.length : 0,
    from: from.toISOString(),
    p50_latency_ms: percentile(latencies, 0.5),
    p95_latency_ms: percentile(latencies, 0.95),
    p99_latency_ms: percentile(latencies, 0.99),
    to: to.toISOString(),
    tool_cost: Math.round(totalCost * 100) / 100
  };
}

class InMemoryRedis {
  private readonly data = new Map<string, { expiresAt?: number; value: string }>();

  async get(key: string): Promise<string | null> {
    const current = this.data.get(key);
    if (!current) {
      return null;
    }

    if (current.expiresAt !== undefined && current.expiresAt <= Date.now()) {
      this.data.delete(key);
      return null;
    }

    return current.value;
  }

  async set(key: string, value: string, ...args: Array<string | number>): Promise<"OK" | null> {
    const options = args.map((arg) => String(arg).toUpperCase());
    const hasNx = options.includes("NX");
    const exIndex = options.indexOf("EX");
    const expiresAt =
      exIndex >= 0 && args[exIndex + 1] ? Date.now() + Number(args[exIndex + 1]) * 1000 : undefined;

    if (hasNx && this.data.has(key)) {
      return null;
    }

    this.data.set(key, {
      ...(expiresAt !== undefined ? { expiresAt } : {}),
      value
    });

    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.data.delete(key) ? 1 : 0;
  }
}

async function main(): Promise<void> {
  const executionId = process.env.RUNTIME_TEST_EXECUTION_ID;
  const agentId = process.env.RUNTIME_TEST_AGENT_ID;
  const organizationId = process.env.RUNTIME_TEST_ORGANIZATION_ID;
  const tenantId = process.env.RUNTIME_TEST_TENANT_ID;
  const userId = process.env.RUNTIME_TEST_USER_ID;

  if (!executionId || !agentId || !organizationId || !tenantId || !userId) {
    throw new Error("Runtime integration harness is missing required env vars.");
  }

  const runtimeResult = await executeManifestAgentRuntime({
    agentId,
    executionId,
    input: {
      company: "Acme Orbit",
      objective: "Avaliar sinais comerciais da conta",
      sessionId: "runtime-session-1",
      tenantId
    },
    organizationId,
    redis: new InMemoryRedis() as never,
    source: "MANUAL",
    tenantId,
    userId
  });

  await prisma.agentExecution.update({
    data: {
      completedAt: runtimeResult.status === "WAITING_APPROVAL" ? null : new Date(),
      metadata: runtimeResult.metadata as Prisma.InputJsonValue,
      output: runtimeResult.output as Prisma.InputJsonValue,
      outputHash: runtimeResult.outputHash,
      status: runtimeResult.status
    },
    where: {
      id: executionId
    }
  });

  const outputs = await listOutputsByExecution(tenantId, executionId);
  const approvedOutput =
    outputs[0] && outputs[0].status === "WAITING_APPROVAL"
      ? await approveOutput(outputs[0].id, tenantId, userId)
      : outputs[0] ?? null;

  if (approvedOutput) {
    await prisma.agentExecution.update({
      data: {
        completedAt: new Date(),
        status: "SUCCESS"
      },
      where: {
        id: executionId
      }
    });
  }

  const metrics = await getAgentMetrics(tenantId, agentId, 60);
  const [memoryEntryCount, learningPublishedCount, budgetEvents, persistedExecution] =
    await Promise.all([
      prisma.auditLog.count({
        where: {
          action: "AGENT_MEMORY_SET",
          tenantId
        }
      }),
      prisma.auditLog.count({
        where: {
          action: "AGENT_LEARNING_PUBLISHED",
          tenantId
        }
      }),
      prisma.agentBudgetEvent.findMany({
        orderBy: {
          createdAt: "asc"
        },
        where: {
          agentId,
          tenantId
        }
      }),
      prisma.agentExecution.findUniqueOrThrow({
        where: {
          id: executionId
        }
      })
    ]);

  const summary = {
    approvedOutputStatus: approvedOutput?.status ?? null,
    budgetEventKinds: budgetEvents.map((event) => event.kind),
    executionStatus: persistedExecution.status,
    learningPublishedCount,
    memoryEntryCount,
    metrics: {
      execution_count: metrics.execution_count,
      tool_cost: metrics.tool_cost
    },
    outputCount: outputs.length
  };

  logger.info(summary, "Runtime integration harness completed");
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

void main().catch((error) => {
  logger.error({ error }, "Runtime integration harness failed");
  process.exitCode = 1;
});
