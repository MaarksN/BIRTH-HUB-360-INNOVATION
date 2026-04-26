import { Prisma, prisma } from "@birthub/database";

export type AgentRuntimeEventName =
  | "agent.plan.created"
  | "agent.tool.started"
  | "agent.tool.completed"
  | "agent.tool.failed"
  | "agent.handoff.queued"
  | "agent.handoff.completed"
  | "agent.approval.required"
  | "agent.execution.completed"
  | "agent.execution.failed";

export async function emitAgentRuntimeEvent(input: {
  agentId: string;
  costBrl?: number;
  durationMs?: number;
  event: AgentRuntimeEventName;
  executionId: string;
  organizationId: string | null;
  parentExecutionId?: string | null;
  requestId: string;
  status: "COMPLETED" | "FAILED" | "IN_PROGRESS" | "WAITING_APPROVAL";
  tenantId: string;
  tool?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: `AGENT_RUNTIME_${input.event.toUpperCase().replace(/\./g, "_")}`,
      actorId: null,
      diff: {
        agentId: input.agentId,
        costBrl: input.costBrl ?? 0,
        durationMs: input.durationMs ?? 0,
        event: input.event,
        executionId: input.executionId,
        organizationId: input.organizationId,
        parentExecutionId: input.parentExecutionId ?? null,
        requestId: input.requestId,
        status: input.status,
        tenantId: input.tenantId,
        tool: input.tool ?? null
      } as Prisma.InputJsonValue,
      entityId: input.executionId,
      entityType: "agent_execution",
      tenantId: input.tenantId
    }
  });
}
