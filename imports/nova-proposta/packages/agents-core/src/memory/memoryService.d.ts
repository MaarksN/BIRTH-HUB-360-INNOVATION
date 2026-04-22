import type { AgentLearningRecord } from "../types/index.js";
export type ConversationRole = "assistant" | "system" | "tool" | "user";
export interface ConversationMessage {
    role: ConversationRole;
    content: string;
    createdAt: string;
}
export interface ConversationContext {
    sessionId: string;
    messages: ConversationMessage[];
    metadata: Record<string, unknown>;
    updatedAt: string;
}
export interface AgentMemoryBackend {
    del(key: string): Promise<number>;
    get(key: string): Promise<string | null>;
    keys(pattern: string): Promise<string[]>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
}
export declare class InMemoryAgentMemoryBackend implements AgentMemoryBackend {
    private readonly records;
    private sweepExpired;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
}
export declare function estimateTokenCount(content: string): number;
export declare function compressConversationMessages(messages: ConversationMessage[], tokenBudget?: number, tokenEstimator?: (content: string) => number): ConversationMessage[];
export declare class AgentMemoryService {
    private readonly backend;
    constructor(backend?: AgentMemoryBackend);
    store<TValue>(tenantId: string, agentId: string, memoryKey: string, value: TValue, ttlSeconds?: number): Promise<string>;
    get<TValue>(tenantId: string, agentId: string, memoryKey: string): Promise<TValue | null>;
    delete(tenantId: string, agentId: string, memoryKey: string): Promise<number>;
    listByAgent(tenantId: string, agentId: string): Promise<string[]>;
    clearByAgent(tenantId: string, agentId: string): Promise<number>;
    clearBySession(tenantId: string, agentId: string, sessionId: string): Promise<number>;
    clearByTenant(tenantId: string): Promise<number>;
    publishSharedLearning(tenantId: string, record: AgentLearningRecord, ttlSeconds?: number): Promise<string>;
    getSharedLearning(tenantId: string, recordKey: string): Promise<AgentLearningRecord | null>;
    listSharedLearning(tenantId: string): Promise<AgentLearningRecord[]>;
    querySharedLearning(tenantId: string, input?: {
        approvedOnly?: boolean;
        keywords?: string[];
        minimumConfidence?: number;
    }): Promise<AgentLearningRecord[]>;
    upsertConversationContext(tenantId: string, agentId: string, context: ConversationContext, options?: {
        tokenBudget?: number;
        ttlSeconds?: number;
    }): Promise<ConversationContext>;
    getConversationContext(tenantId: string, agentId: string, sessionId: string): Promise<ConversationContext | null>;
    appendConversationMessage(tenantId: string, agentId: string, sessionId: string, message: Omit<ConversationMessage, "createdAt"> & {
        createdAt?: string;
    }, options?: {
        metadata?: Record<string, unknown>;
        tokenBudget?: number;
        ttlSeconds?: number;
    }): Promise<ConversationContext>;
}
