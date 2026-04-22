export { getAgentQueueName } from "@birthub/queue";

export type AgentQueuePriority = "high" | "normal";

export interface AgentQueuePayload {
  agentId: string;
  executionId: string;
  input: Record<string, unknown>;
  priority?: AgentQueuePriority;
  tenantId: string;
  toolCalls?: Array<{
    input: unknown;
    tool: string;
  }>;
}

