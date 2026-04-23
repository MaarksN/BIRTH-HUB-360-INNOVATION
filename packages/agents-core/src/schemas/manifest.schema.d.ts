import { z } from "zod";
export declare const SUPPORTED_AGENT_API_VERSION = "1.0.0";
export declare const agentManifestSchema: z.ZodObject<{
    apiVersion: z.ZodDefault<z.ZodString>;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    system_prompt: z.ZodString;
    memory_ttl: z.ZodDefault<z.ZodNumber>;
    restrictions: z.ZodDefault<z.ZodObject<{
        allowDomains: z.ZodDefault<z.ZodArray<z.ZodString>>;
        allowTools: z.ZodDefault<z.ZodArray<z.ZodString>>;
        denyTools: z.ZodDefault<z.ZodArray<z.ZodString>>;
        maxSteps: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>;
    skills: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        version: z.ZodString;
    }, z.core.$strict>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tools: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        maxCalls: z.ZodDefault<z.ZodNumber>;
        timeoutMs: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type AgentManifest = z.infer<typeof agentManifestSchema>;
