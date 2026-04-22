import type { WorkflowRuntimeContext } from "../types.js";
export interface AgentExecuteConfig {
    agentId: string;
    input?: Record<string, unknown>;
    onError?: "continue" | "stop";
}
export interface AgentExecutor {
    execute: (args: {
        agentId: string;
        contextSummary: string;
        input: Record<string, unknown>;
    }) => Promise<unknown>;
}
export declare function executeAgentNode(config: AgentExecuteConfig, context: WorkflowRuntimeContext, executor: AgentExecutor): Promise<unknown>;
