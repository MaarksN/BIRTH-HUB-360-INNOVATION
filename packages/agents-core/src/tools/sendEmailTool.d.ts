import { z } from "zod";
import { BaseTool, type BaseToolOptions, type ToolExecutionContext } from "./baseTool.js";
declare const sendEmailInputSchema: z.ZodObject<{
    dynamicTemplateData: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    html: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    templateId: z.ZodOptional<z.ZodString>;
    to: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    tracking: z.ZodDefault<z.ZodObject<{
        clickTracking: z.ZodDefault<z.ZodBoolean>;
        openTracking: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
}, z.core.$strip>;
declare const sendEmailOutputSchema: z.ZodObject<{
    accepted: z.ZodBoolean;
    messageId: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodNumber;
}, z.core.$strict>;
export type SendEmailInput = z.infer<typeof sendEmailInputSchema>;
export type SendEmailOutput = z.infer<typeof sendEmailOutputSchema>;
export interface SendEmailToolOptions extends BaseToolOptions {
    apiKey?: string;
    fromEmail?: string;
    fetchImpl?: typeof fetch;
}
export declare class SendEmailTool extends BaseTool<SendEmailInput, SendEmailOutput> {
    private readonly apiKey;
    private readonly fetchImpl;
    private readonly fromEmail;
    constructor(options?: SendEmailToolOptions);
    protected execute(input: SendEmailInput, context: ToolExecutionContext): Promise<SendEmailOutput>;
}
export {};
