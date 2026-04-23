import { z } from "zod";
export declare const MANIFEST_VERSION: "1.0.0";
declare const keywordListSchema: z.ZodArray<z.ZodString>;
export declare const manifestTagsSchema: z.ZodObject<{
    domain: z.ZodArray<z.ZodString>;
    level: z.ZodArray<z.ZodString>;
    persona: z.ZodArray<z.ZodString>;
    "use-case": z.ZodArray<z.ZodString>;
    industry: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const skillManifestSchema: z.ZodObject<{
    description: z.ZodString;
    id: z.ZodString;
    inputSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    name: z.ZodString;
    outputSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export declare const toolManifestSchema: z.ZodObject<{
    description: z.ZodString;
    id: z.ZodString;
    inputSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    name: z.ZodString;
    outputSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timeoutMs: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export declare const policyManifestSchema: z.ZodObject<{
    actions: z.ZodArray<z.ZodString>;
    effect: z.ZodEnum<{
        allow: "allow";
        deny: "deny";
    }>;
    id: z.ZodString;
    name: z.ZodString;
}, z.core.$strict>;
export declare const agentDescriptorSchema: z.ZodObject<{
    changelog: z.ZodDefault<z.ZodArray<z.ZodString>>;
    description: z.ZodString;
    id: z.ZodString;
    kind: z.ZodDefault<z.ZodEnum<{
        agent: "agent";
        catalog: "catalog";
    }>>;
    name: z.ZodString;
    prompt: z.ZodString;
    tenantId: z.ZodDefault<z.ZodString>;
    version: z.ZodString;
}, z.core.$strict>;
export declare const agentManifestSchema: z.ZodObject<{
    agent: z.ZodObject<{
        changelog: z.ZodDefault<z.ZodArray<z.ZodString>>;
        description: z.ZodString;
        id: z.ZodString;
        kind: z.ZodDefault<z.ZodEnum<{
            agent: "agent";
            catalog: "catalog";
        }>>;
        name: z.ZodString;
        prompt: z.ZodString;
        tenantId: z.ZodDefault<z.ZodString>;
        version: z.ZodString;
    }, z.core.$strict>;
    keywords: z.ZodArray<z.ZodString>;
    manifestVersion: z.ZodLiteral<"1.0.0">;
    policies: z.ZodArray<z.ZodObject<{
        actions: z.ZodArray<z.ZodString>;
        effect: z.ZodEnum<{
            allow: "allow";
            deny: "deny";
        }>;
        id: z.ZodString;
        name: z.ZodString;
    }, z.core.$strict>>;
    skills: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        id: z.ZodString;
        inputSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        name: z.ZodString;
        outputSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strict>>;
    tags: z.ZodObject<{
        domain: z.ZodArray<z.ZodString>;
        level: z.ZodArray<z.ZodString>;
        persona: z.ZodArray<z.ZodString>;
        "use-case": z.ZodArray<z.ZodString>;
        industry: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    tools: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        id: z.ZodString;
        inputSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        name: z.ZodString;
        outputSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        timeoutMs: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type AgentManifest = z.infer<typeof agentManifestSchema>;
export type AgentManifestTags = z.infer<typeof manifestTagsSchema>;
export type AgentManifestKeywords = z.infer<typeof keywordListSchema>;
export {};
