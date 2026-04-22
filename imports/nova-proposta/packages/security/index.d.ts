export declare function sanitizeHtml(input: string): string;
export declare function createRateLimiter(max: number, windowMs: number): (key: string) => boolean;
export declare function scanSecrets(content: string): void;
export declare function buildCspHeader(directives: Record<string, string[]>): string;
//# sourceMappingURL=index.d.ts.map