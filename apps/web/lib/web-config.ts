export type DeploymentEnvironment =
  | "development"
  | "test"
  | "staging"
  | "production"
  | "ci"
  | "ci-local";

export type ProductCapabilities = {
  clinicalWorkspaceEnabled: boolean;
  fhirFacadeEnabled: boolean;
  privacyAdvancedEnabled: boolean;
  privacySelfServiceEnabled: boolean;
};

export type WebConfig = ProductCapabilities & {
  CSP_REPORT_URI?: string;
  NEXTAUTH_SECRET?: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_CSP_REPORT_ONLY: boolean;
  NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: boolean;
  NEXT_PUBLIC_ENABLE_FHIR_FACADE: boolean;
  NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED: boolean;
  NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE: boolean;
  NEXT_PUBLIC_ENVIRONMENT: DeploymentEnvironment;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: number;
  SENTRY_AUTH_TOKEN?: string;
  WEB_PORT: number;
};

const DEPLOYMENT_ENVIRONMENTS = new Set<DeploymentEnvironment>([
  "development",
  "test",
  "staging",
  "production",
  "ci",
  "ci-local",
]);

function readOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function readNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readEnvironment(value: string | undefined): DeploymentEnvironment {
  if (value && DEPLOYMENT_ENVIRONMENTS.has(value as DeploymentEnvironment)) {
    return value as DeploymentEnvironment;
  }

  return "development";
}

export function getWebConfig(env: NodeJS.ProcessEnv = process.env): WebConfig {
  const NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE = readBoolean(
    env.NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE,
    false
  );
  const NEXT_PUBLIC_ENABLE_FHIR_FACADE = readBoolean(env.NEXT_PUBLIC_ENABLE_FHIR_FACADE, false);
  const NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED = readBoolean(
    env.NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED,
    false
  );
  const NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE = readBoolean(
    env.NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE,
    true
  );

  return {
    CSP_REPORT_URI: readOptionalString(env.CSP_REPORT_URI),
    NEXTAUTH_SECRET: readOptionalString(env.NEXTAUTH_SECRET),
    NEXT_PUBLIC_API_URL: readOptionalString(env.NEXT_PUBLIC_API_URL) ?? "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: readOptionalString(env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3001",
    NEXT_PUBLIC_CSP_REPORT_ONLY: readBoolean(env.NEXT_PUBLIC_CSP_REPORT_ONLY, true),
    NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE,
    NEXT_PUBLIC_ENABLE_FHIR_FACADE,
    NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED,
    NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE,
    NEXT_PUBLIC_ENVIRONMENT: readEnvironment(env.NEXT_PUBLIC_ENVIRONMENT),
    NEXT_PUBLIC_POSTHOG_HOST: readOptionalString(env.NEXT_PUBLIC_POSTHOG_HOST),
    NEXT_PUBLIC_POSTHOG_KEY: readOptionalString(env.NEXT_PUBLIC_POSTHOG_KEY),
    NEXT_PUBLIC_SENTRY_DSN: readOptionalString(env.NEXT_PUBLIC_SENTRY_DSN),
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: readNumber(
      env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      0.1
    ),
    SENTRY_AUTH_TOKEN: readOptionalString(env.SENTRY_AUTH_TOKEN),
    WEB_PORT: Math.max(1, Math.trunc(readNumber(env.WEB_PORT, 3001))),
    clinicalWorkspaceEnabled: NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE,
    fhirFacadeEnabled: NEXT_PUBLIC_ENABLE_FHIR_FACADE,
    privacyAdvancedEnabled: NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED,
    privacySelfServiceEnabled: NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE,
  };
}
