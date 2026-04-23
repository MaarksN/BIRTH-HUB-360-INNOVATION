import { z } from "zod";
import { BaseTool, type BaseToolOptions, type ToolExecutionContext } from "./baseTool.js";
declare const dbReadInputSchema: z.ZodObject<{
    params: z.ZodDefault<z.ZodArray<z.ZodUnknown>>;
    query: z.ZodString;
}, z.core.$strict>;
declare const dbReadOutputSchema: z.ZodObject<{
    rowCount: z.ZodNumber;
    rows: z.ZodArray<z.ZodUnknown>;
}, z.core.$strict>;
export type DbReadInput = z.infer<typeof dbReadInputSchema>;
export type DbReadOutput = z.infer<typeof dbReadOutputSchema>;
export type DbReadExecutor = (input: {
    params: unknown[];
    query: string;
    tenantId: string;
}) => Promise<unknown[]>;
export interface DbReadToolOptions extends BaseToolOptions {
    executor?: DbReadExecutor;
}
export declare class DbReadTool extends BaseTool<DbReadInput, DbReadOutput> {
    private readonly executor;
    constructor(options?: DbReadToolOptions);
    protected execute(input: DbReadInput, context: ToolExecutionContext): Promise<DbReadOutput>;
}
export {};
