import type { Express } from "express";
export declare function stubMethod(target: object, key: string, value: unknown): () => void;
export declare function createAuthenticatedApiTestApp(input: {
    contextOverrides?: Record<string, unknown>;
    mountPath?: string;
    router: unknown;
    useJson?: boolean;
}): Express;
