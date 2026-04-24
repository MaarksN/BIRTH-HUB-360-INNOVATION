import { getWebConfig, type ProductCapabilities as SharedProductCapabilities } from "./web-config";

export type ProductCapabilities = SharedProductCapabilities;

function withWebEnvDefaults(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...env,
    NEXT_PUBLIC_ENVIRONMENT: env.NEXT_PUBLIC_ENVIRONMENT ?? "development",
  };
}

export function getProductCapabilities(env: NodeJS.ProcessEnv = process.env): ProductCapabilities {
  const config = getWebConfig(withWebEnvDefaults(env));

  return {
    clinicalWorkspaceEnabled: config.clinicalWorkspaceEnabled,
    fhirFacadeEnabled: config.fhirFacadeEnabled,
    privacyAdvancedEnabled: config.privacyAdvancedEnabled,
    privacySelfServiceEnabled: config.privacySelfServiceEnabled,
  };
}

export function isDashboardNavigationItemEnabled(
  href: string,
  capabilities: ProductCapabilities = getProductCapabilities()
): boolean {
  void capabilities;

  if (isClinicalWorkspacePath(href)) {
    return false;
  }

  return true;
}

export function isClinicalWorkspacePath(path: string): boolean {
  const normalizedPath = path.split("?")[0]?.split("#")[0] ?? path;

  return (
    normalizedPath === "/patients" ||
    normalizedPath.startsWith("/patients/") ||
    normalizedPath === "/appointments" ||
    normalizedPath.startsWith("/appointments/")
  );
}

export function sanitizeCapabilityScopedLink(
  path: string | null,
  capabilities: ProductCapabilities = getProductCapabilities()
): string | null {
  void capabilities;

  if (!path) {
    return null;
  }

  if (isClinicalWorkspacePath(path)) {
    return null;
  }

  return path;
}
