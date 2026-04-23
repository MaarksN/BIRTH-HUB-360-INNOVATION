import type { AgentManifest } from "./schema.js";
export interface ManifestCatalogEntry {
    manifest: AgentManifest;
    manifestPath: string;
}
export interface ManifestSearchFilters {
    domains?: string[];
    industries?: string[];
    levels?: string[];
    personas?: string[];
    tags?: string[];
    useCases?: string[];
}
export interface ManifestSearchResult {
    facets: {
        domains: Record<string, number>;
        industries: Record<string, number>;
        levels: Record<string, number>;
        personas: Record<string, number>;
        tags: Record<string, number>;
        useCases: Record<string, number>;
    };
    page: number;
    pageSize: number;
    results: Array<ManifestCatalogEntry & {
        score: number;
    }>;
    total: number;
}
export declare function isInstallableManifest(manifest: AgentManifest): boolean;
export declare function canonicalizeAgentId(value: string): string;
export declare function agentIdsMatch(left: string, right: string): boolean;
export declare function findManifestCatalogEntryByAgentId(catalog: ManifestCatalogEntry[], agentId: string): ManifestCatalogEntry | null;
export declare function loadManifestCatalog(baseDir: string): Promise<ManifestCatalogEntry[]>;
export declare function searchManifestCatalog(catalog: ManifestCatalogEntry[], input: {
    filters?: ManifestSearchFilters;
    includeCatalogEntries?: boolean;
    page?: number;
    pageSize?: number;
    query?: string;
}): ManifestSearchResult;
export declare function recommendAgentsForTenant(catalog: ManifestCatalogEntry[], tenantIndustry: string, limit?: number): Array<ManifestCatalogEntry & {
    recommendationScore: number;
}>;
