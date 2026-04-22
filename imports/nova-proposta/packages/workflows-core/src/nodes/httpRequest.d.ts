import type { WorkflowRuntimeContext } from "../types.js";
interface HttpRequestNodeConfig {
    auth?: {
        bearer?: string | undefined;
    } | undefined;
    body?: unknown;
    headers?: Record<string, string> | undefined;
    method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    timeout_ms?: number;
    url: string;
    webhookSecret?: string | undefined;
}
export declare function executeHttpRequestNode(config: HttpRequestNodeConfig, context: WorkflowRuntimeContext, rateLimiter?: {
    consume: (key: string, limit: number, windowSeconds: number) => Promise<void>;
}): Promise<{
    body: unknown;
    headers: Record<string, string>;
    status: number;
}>;
export type { HttpRequestNodeConfig };
