import {
  getProductCapabilities,
  type ProductCapabilities
} from "./product-capabilities";

export const ALLOWED_BFF_PREFIXES = [
  "api/v1/admin",
  "api/v1/analytics",
  "api/v1/apikeys",
  "api/v1/auth",
  "api/v1/billing",
  "api/v1/me",
  "api/v1/notifications",
  "api/v1/search",
  "api/v1/sessions",
  "api/v1/settings/webhooks",
  "api/v1/team",
  "api/v1/users",
  "api/v1/workflows",
  "api/v1/outputs"
] as const;

const PRIVACY_SELF_SERVICE_EXACT_PATHS = [
  "api/v1/privacy/delete-account",
  "api/v1/privacy/export"
] as const;

const PRIVACY_ADVANCED_PREFIXES = [
  "api/v1/privacy/consents",
  "api/v1/privacy/retention"
] as const;

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isBffPathAllowed(
  path: string,
  capabilities: ProductCapabilities = getProductCapabilities()
): boolean {
  if (ALLOWED_BFF_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return true;
  }

  if (
    capabilities.privacySelfServiceEnabled &&
    PRIVACY_SELF_SERVICE_EXACT_PATHS.some((candidate) => path === candidate)
  ) {
    return true;
  }

  if (
    capabilities.privacyAdvancedEnabled &&
    PRIVACY_ADVANCED_PREFIXES.some((prefix) => matchesPrefix(path, prefix))
  ) {
    return true;
  }

  return false;
}

export function resolveBrowserBffPath(input: string): string {
  if (!input.startsWith("/api/v1/")) {
    return input;
  }

  const normalizedPath = input.slice(1);
  return isBffPathAllowed(normalizedPath) ? `/api/bff/${normalizedPath}` : input;
}
