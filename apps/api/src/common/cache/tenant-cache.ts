import { deleteCacheKeys } from "./cache-store.js";

export interface CachedTenant {
  id: string;
  slug: string | null;
  tenantId: string;
}

function normalizeReference(reference: string): string {
  return reference.trim().toLowerCase();
}

function buildTenantCacheKey(reference: string): string {
  return `tenant:${normalizeReference(reference)}`;
}

export async function invalidateTenantCache(references: Array<string | null | undefined>): Promise<void> {
  const keys = Array.from(
    new Set(
      references
        .filter((reference): reference is string => Boolean(reference?.trim()))
        .map((reference) => buildTenantCacheKey(reference))
    )
  );

  await deleteCacheKeys(keys);
}
