export declare class ExceededQuotaError extends Error {
    readonly current: number;
    readonly limit: number;
    readonly resetAt: string;
    readonly resourceType: string;
    readonly tenantId: string;
    readonly upgradeUrl: string;
    constructor(input: {
        current: number;
        limit: number;
        resetAt: string;
        resourceType: string;
        tenantId: string;
        upgradeUrl?: string;
    });
}
