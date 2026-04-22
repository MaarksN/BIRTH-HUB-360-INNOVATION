import { BaseWorker } from "./base-worker.js";
export interface AgentJobPayload {
    agentId: string;
    input: Record<string, unknown>;
    shouldFail?: boolean;
}
export declare class AgentWorker extends BaseWorker<AgentJobPayload> {
    protected process(payload: AgentJobPayload): Promise<void>;
}
