import { z } from "zod";
export declare const orchestratorInputSchema: z.ZodObject<{
    objective: z.ZodString;
    availableAgents: z.ZodArray<z.ZodString>;
    maxSteps: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const orchestratorOutputSchema: z.ZodObject<{
    plan: z.ZodArray<z.ZodObject<{
        reason: z.ZodString;
        sequence: z.ZodNumber;
        subAgentId: z.ZodString;
    }, z.core.$strip>>;
    queueAgentIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type OrchestratorInput = z.infer<typeof orchestratorInputSchema>;
export type OrchestratorOutput = z.infer<typeof orchestratorOutputSchema>;
export declare function runOrchestratorSkill(input: OrchestratorInput): Promise<OrchestratorOutput>;
export declare const orchestratorSkillTemplate: {
    id: string;
    inputSchema: z.ZodObject<{
        objective: z.ZodString;
        availableAgents: z.ZodArray<z.ZodString>;
        maxSteps: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    outputSchema: z.ZodObject<{
        plan: z.ZodArray<z.ZodObject<{
            reason: z.ZodString;
            sequence: z.ZodNumber;
            subAgentId: z.ZodString;
        }, z.core.$strip>>;
        queueAgentIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    run: typeof runOrchestratorSkill;
};
