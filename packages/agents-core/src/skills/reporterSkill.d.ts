import { z } from "zod";
export declare const reporterInputSchema: z.ZodObject<{
    format: z.ZodDefault<z.ZodEnum<{
        markdown: "markdown";
        pdf: "pdf";
    }>>;
    metrics: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const reporterOutputSchema: z.ZodObject<{
    content: z.ZodString;
    format: z.ZodEnum<{
        markdown: "markdown";
        pdf: "pdf";
    }>;
}, z.core.$strip>;
export type ReporterInput = z.infer<typeof reporterInputSchema>;
export type ReporterOutput = z.infer<typeof reporterOutputSchema>;
export declare function runReporterSkill(input: ReporterInput): Promise<ReporterOutput>;
export declare const reporterSkillTemplate: {
    id: string;
    inputSchema: z.ZodObject<{
        format: z.ZodDefault<z.ZodEnum<{
            markdown: "markdown";
            pdf: "pdf";
        }>>;
        metrics: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            value: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    outputSchema: z.ZodObject<{
        content: z.ZodString;
        format: z.ZodEnum<{
            markdown: "markdown";
            pdf: "pdf";
        }>;
    }, z.core.$strip>;
    run: typeof runReporterSkill;
};
