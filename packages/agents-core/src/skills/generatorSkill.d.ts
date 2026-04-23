import { z } from "zod";
export declare const generatorInputSchema: z.ZodObject<{
    brief: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<{
        markdown: "markdown";
        html: "html";
    }>>;
    tone: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const generatorOutputSchema: z.ZodObject<{
    artifact: z.ZodString;
    format: z.ZodEnum<{
        markdown: "markdown";
        html: "html";
    }>;
}, z.core.$strip>;
export type GeneratorInput = z.infer<typeof generatorInputSchema>;
export type GeneratorOutput = z.infer<typeof generatorOutputSchema>;
export declare function runGeneratorSkill(input: GeneratorInput): Promise<GeneratorOutput>;
export declare const generatorSkillTemplate: {
    id: string;
    inputSchema: z.ZodObject<{
        brief: z.ZodString;
        format: z.ZodDefault<z.ZodEnum<{
            markdown: "markdown";
            html: "html";
        }>>;
        tone: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    outputSchema: z.ZodObject<{
        artifact: z.ZodString;
        format: z.ZodEnum<{
            markdown: "markdown";
            html: "html";
        }>;
    }, z.core.$strip>;
    run: typeof runGeneratorSkill;
};
