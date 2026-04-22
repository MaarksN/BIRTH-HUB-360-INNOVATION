export type OutputType = "executive-report" | "technical-log";
export type OutputStatus = "COMPLETED" | "WAITING_APPROVAL";
export interface OutputRecord {
    agentId: string;
    approvedAt: string | null;
    approvedByUserId: string | null;
    content: string;
    createdAt: string;
    createdByUserId: string;
    id: string;
    outputHash: string;
    status: OutputStatus;
    tenantId: string;
    type: OutputType;
}
declare class OutputService {
    createOutput(input: {
        agentId: string;
        content: string;
        createdByUserId: string;
        organizationId: string;
        requireApproval?: boolean;
        tenantId: string;
        type: OutputType;
    }): Promise<OutputRecord>;
    listByTenant(tenantId: string, type?: OutputType): Promise<OutputRecord[]>;
    listByExecution(tenantId: string, executionId: string): Promise<OutputRecord[]>;
    getById(outputId: string, tenantId: string): Promise<OutputRecord | null>;
    approve(outputId: string, tenantId: string, approvedByUserId: string): Promise<OutputRecord | null>;
    verifyIntegrity(outputId: string, tenantId: string): Promise<{
        expectedHash: string;
        isValid: boolean;
        recalculatedHash: string;
    } | null>;
    prune(): Promise<number>;
}
export declare const outputService: OutputService;
export {};
