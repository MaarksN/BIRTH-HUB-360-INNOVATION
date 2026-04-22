export type ExecutionStatus = "FAILED" | "SUCCESS";
export interface AgentRunLog {
    agentId: string;
    createdAt: Date;
    durationMs: number;
    status: ExecutionStatus;
    tenantId: string;
    toolCost: number;
}
export interface AgentMetricsSnapshot {
    agentId: string;
    execution_count: number;
    fail_rate: number;
    from: string;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    to: string;
    tool_cost: number;
}
export interface TenantDashboardSnapshot {
    accumulatedCost: number;
    mostUsedAgents: Array<{
        agentId: string;
        executions: number;
    }>;
    recentFailures: AgentRunLog[];
    tenantId: string;
}
export interface FailRateAlert {
    agentId: string;
    failRate: number;
    tenantId: string;
    windowMinutes: number;
}
export declare class AgentMetricsService {
    private readonly runLogs;
    recordRun(log: Omit<AgentRunLog, "createdAt"> & {
        createdAt?: Date;
    }): void;
    getMetrics(input: {
        agentId: string;
        tenantId: string;
        windowMinutes?: number;
    }): Promise<AgentMetricsSnapshot>;
    getTenantDashboard(tenantId: string): Promise<TenantDashboardSnapshot>;
    detectFailRateAlerts(tenantId: string, threshold?: number, windowMinutes?: number): Promise<FailRateAlert[]>;
    exportCsv(tenantId: string, agentId?: string): Promise<string>;
}
export declare const agentMetricsService: AgentMetricsService;
