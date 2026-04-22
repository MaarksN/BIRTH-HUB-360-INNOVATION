import type { ApiConfig } from "@birthub/config";
export declare function stubMethod(target: object, key: string, value: unknown): () => void;
export declare function createAuthTestApp(config?: ApiConfig): import("express").Express;
export declare function readSetCookies(response: {
    headers: Record<string, unknown>;
}): string[];
export declare function assertAuthCookies(config: ApiConfig, cookies: string[]): void;
