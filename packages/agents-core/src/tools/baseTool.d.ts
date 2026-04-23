import type { ZodType } from "zod";
import { type PolicyContext, type PolicyEngine } from "../policy/engine.js";
export interface ToolCostMetadata {
    estimatedCostUsd?: number;
    unit?: "call" | "token";
}
export interface ToolExecutionContext {
    agentId: string;
    tenantId: string;
    action?: string;
    timeoutMs?: number;
    policyContext?: PolicyContext;
    allowlistedDomains?: string[];
    traceId?: string;
}
export interface ToolDefinition<TInput, TOutput> {
    name: string;
    description?: string;
    inputSchema: ZodType<TInput>;
    outputSchema: ZodType<TOutput>;
    timeoutMs?: number;
    cost?: ToolCostMetadata;
}
export interface BaseToolOptions {
    policyEngine?: PolicyEngine;
}
export declare abstract class BaseTool<TInput, TOutput> {
    readonly name: string;
    readonly description: string | undefined;
    readonly timeoutMs: number;
    readonly cost: ToolCostMetadata | undefined;
    protected readonly inputSchema: ZodType<TInput>;
    protected readonly outputSchema: ZodType<TOutput>;
    protected readonly policyEngine: PolicyEngine | undefined;
    constructor(definition: ToolDefinition<TInput, TOutput>, options?: BaseToolOptions);
    run(rawInput: unknown, context: ToolExecutionContext): Promise<TOutput>;
    protected abstract execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;
    private withTimeout;
}
