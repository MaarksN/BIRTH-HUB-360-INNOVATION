import type { WorkflowRuntimeContext } from "../types.js";
export interface AgentHandoffConfig {
    context?: Record<string, unknown> | undefined;
    correlationId?: string | undefined;
    sourceAgentId: string;
    summary: string;
    targetAgentId: string;
    threadId?: string | undefined;
}
export interface HandoffExecutor {
    execute: (args: {
        context: Record<string, unknown>;
        contextSummary: string;
        correlationId: string;
        executionId: string;
        sourceAgentId: string;
        summary: string;
        tenantId: string;
        targetAgentId: string;
        threadId?: string;
        workflowId: string;
    }) => Promise<unknown>;
}
export declare function executeAgentHandoffNode(config: AgentHandoffConfig, context: WorkflowRuntimeContext, executor: HandoffExecutor): Promise<unknown>;
