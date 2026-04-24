import { randomUUID } from "node:crypto";

import { Prisma, prisma } from "@birthub/database";
import { getAgentQueueName } from "@birthub/queue";
import type { Queue } from "bullmq";

export async function enqueueSpecialistAgent(input: {
  agentQueue: Queue;
  context: Record<string, unknown>;
  correlationId?: string;
  executionId: string;
  organizationId: string | null;
  parentAgentId: string;
  priority: "high" | "normal" | "low";
  targetAgentId: string;
  tenantId: string;
  userId?: string | null;
}): Promise<{ childExecutionId: string; correlationId: string; queueName: string }> {
  const correlationId = input.correlationId ?? randomUUID();
  const childExecutionId = `handoff:${input.executionId}:${input.targetAgentId}:${randomUUID()}`;
  const queueName = getAgentQueueName(input.priority);

  await prisma.agentExecution.create({
    data: {
      agentId: input.targetAgentId,
      id: childExecutionId,
      input: {
        ...input.context,
        correlationId,
        parentExecutionId: input.executionId
      } as Prisma.InputJsonValue,
      metadata: {
        correlationId,
        parentExecutionId: input.executionId
      } as Prisma.InputJsonValue,
      organizationId: input.organizationId,
      source: "WORKFLOW",
      status: "RUNNING",
      tenantId: input.tenantId,
      userId: input.userId ?? null
    }
  });

  await input.agentQueue.add(
    "agent-execution",
    {
      agentId: input.targetAgentId,
      catalogAgentId: input.targetAgentId,
      executionId: childExecutionId,
      input: {
        ...input.context,
        correlationId,
        parentExecutionId: input.executionId
      },
      organizationId: input.organizationId ?? undefined,
      tenantId: input.tenantId,
      userId: input.userId ?? undefined
    },
    {
      jobId: `${input.tenantId}:${childExecutionId}`,
      priority: input.priority === "high" ? 1 : input.priority === "low" ? 10 : 5
    }
  );

  await prisma.auditLog.create({
    data: {
      action: "AGENT_HANDOFF_QUEUED",
      actorId: input.userId ?? null,
      diff: {
        childExecutionId,
        correlationId,
        parentExecutionId: input.executionId,
        queueName,
        targetAgentId: input.targetAgentId
      } as Prisma.InputJsonValue,
      entityId: childExecutionId,
      entityType: "agent_execution",
      tenantId: input.tenantId
    }
  });

  return {
    childExecutionId,
    correlationId,
    queueName
  };
}
