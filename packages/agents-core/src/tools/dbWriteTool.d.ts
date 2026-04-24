import { z } from "zod";
import { BaseTool, type BaseToolOptions, type ToolExecutionContext } from "./baseTool.js";
declare const dbWriteInputSchema: z.ZodObject<{
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    operation: z.ZodEnum<{
        DELETE: "DELETE";
        INSERT: "INSERT";
        UPDATE: "UPDATE";
        UPSERT: "UPSERT";
    }>;
    table: z.ZodString;
    where: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
declare const dbWriteOutputSchema: z.ZodObject<{
    affectedRows: z.ZodNumber;
}, z.core.$strict>;
export type DbWriteInput = z.infer<typeof dbWriteInputSchema>;
export type DbWriteOutput = z.infer<typeof dbWriteOutputSchema>;
export interface DbWriteAuditEvent {
    action: "db-write";
    actorAgentId: string;
    digest: string;
    operation: DbWriteInput["operation"];
    table: string;
    tenantId: string;
}
export type DbWriteAuditPublisher = (event: DbWriteAuditEvent) => Promise<void>;
export type DbWriteExecutor = (input: {
    data: Record<string, unknown>;
    operation: DbWriteInput["operation"];
    table: string;
    tenantId: string;
    where: Record<string, unknown>;
}) => Promise<number>;
export interface DbWriteToolOptions extends BaseToolOptions {
    auditPublisher?: DbWriteAuditPublisher;
    executor?: DbWriteExecutor;
}
export declare class DbWriteTool extends BaseTool<DbWriteInput, DbWriteOutput> {
    private readonly auditPublisher;
    private readonly executor;
    constructor(options?: DbWriteToolOptions);
    protected execute(input: DbWriteInput, context: ToolExecutionContext): Promise<DbWriteOutput>;
}
export {};
