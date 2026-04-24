export type TenantSource = "active-header" | "authenticated" | "seed" | "system";
export interface TenantContext {
    tenantId: string;
    tenantSlug?: string | null;
    userId?: string | null;
    source: TenantSource;
}
export declare function runWithTenantContext<T>(context: TenantContext, callback: () => T): T;
export declare function getTenantContext(): Readonly<TenantContext> | null;
export declare function requireTenantId(operation?: string): string;
