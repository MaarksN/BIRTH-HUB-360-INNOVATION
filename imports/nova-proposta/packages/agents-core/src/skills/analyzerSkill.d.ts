import { z } from "zod";
export declare const analyzerInputSchema: z.ZodObject<{
    context: z.ZodString;
    objective: z.ZodString;
}, z.core.$strip>;
export declare const analyzerOutputSchema: z.ZodObject<{
    insights: z.ZodArray<z.ZodString>;
    score: z.ZodNumber;
}, z.core.$strip>;
export type AnalyzerInput = z.infer<typeof analyzerInputSchema>;
export type AnalyzerOutput = z.infer<typeof analyzerOutputSchema>;
export declare function runAnalyzerSkill(input: AnalyzerInput): Promise<AnalyzerOutput>;
export declare const analyzerSkillTemplate: {
    id: string;
    inputSchema: z.ZodObject<{
        context: z.ZodString;
        objective: z.ZodString;
    }, z.core.$strip>;
    outputSchema: z.ZodObject<{
        insights: z.ZodArray<z.ZodString>;
        score: z.ZodNumber;
    }, z.core.$strip>;
    run: typeof runAnalyzerSkill;
};
