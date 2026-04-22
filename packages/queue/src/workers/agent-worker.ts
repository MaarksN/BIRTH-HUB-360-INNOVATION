import { BaseWorker } from "./base-worker.js";

export interface AgentJobPayload { agentId: string; input: Record<string, unknown>; shouldFail?: boolean }

export class AgentWorker extends BaseWorker<AgentJobPayload> {
  protected process(payload: AgentJobPayload): Promise<void> {
    if (payload.shouldFail) throw new Error("AGENT_FAILED");
    return Promise.resolve();
  }
}
