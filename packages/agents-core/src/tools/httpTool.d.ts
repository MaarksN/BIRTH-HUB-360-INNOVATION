import { z } from "zod";
import { BaseTool, type BaseToolOptions, type ToolExecutionContext } from "./baseTool.js";
declare const httpInputSchema: z.ZodObject<{
    body: z.ZodOptional<z.ZodUnknown>;
    headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    method: z.ZodDefault<z.ZodEnum<{
        GET: "GET";
        PATCH: "PATCH";
        POST: "POST";
        DELETE: "DELETE";
        PUT: "PUT";
    }>>;
    query: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    retries: z.ZodDefault<z.ZodNumber>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
    url: z.ZodString;
}, z.core.$strict>;
declare const httpOutputSchema: z.ZodObject<{
    attempt: z.ZodNumber;
    body: z.ZodUnknown;
    headers: z.ZodRecord<z.ZodString, z.ZodString>;
    status: z.ZodNumber;
}, z.core.$strict>;
export type HttpToolInput = z.infer<typeof httpInputSchema>;
export type HttpToolOutput = z.infer<typeof httpOutputSchema>;
export interface HttpToolOptions extends BaseToolOptions {
    allowlistByTenant?: Record<string, string[]>;
    fetchImpl?: typeof fetch;
}
export declare class HttpTool extends BaseTool<HttpToolInput, HttpToolOutput> {
    private readonly allowlistByTenant;
    private readonly fetchImpl;
    constructor(options?: HttpToolOptions);
    protected execute(input: HttpToolInput, context: ToolExecutionContext): Promise<HttpToolOutput>;
}
export {};
