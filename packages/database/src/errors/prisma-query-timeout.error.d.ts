export declare class PrismaQueryTimeoutError extends Error {
    readonly model: string | undefined;
    readonly operation: string;
    readonly timeoutMs: number;
    constructor(operation: string, timeoutMs: number, model?: string);
}
