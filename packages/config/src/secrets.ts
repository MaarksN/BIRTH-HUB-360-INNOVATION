import { commaSeparatedList } from "./shared.js";

export type SecretBackend =
  | "aws-secrets-manager"
  | "azure-key-vault"
  | "env"
  | "gcp-secret-manager"
  | "literal"
  | "vault";

export interface SecretSourceDescriptor {
  backend: SecretBackend;
  externalized: boolean;
  managed: boolean;
  raw: string;
  reference?: string | undefined;
}

export interface ResolvedSecretDescriptor {
  candidates: string[];
  externalized: boolean;
  fallbackSources: SecretSourceDescriptor[];
  managedBackends: SecretBackend[];
  primarySource: SecretSourceDescriptor;
}

const secretReferenceCatalog = {
  "aws-sm": {
    backend: "aws-secrets-manager",
    externalized: true,
    managed: true
  },
  "azure-kv": {
    backend: "azure-key-vault",
    externalized: true,
    managed: true
  },
  env: {
    backend: "env",
    externalized: true,
    managed: false
  },
  "gcp-sm": {
    backend: "gcp-secret-manager",
    externalized: true,
    managed: true
  },
  vault: {
    backend: "vault",
    externalized: true,
    managed: true
  }
} as const satisfies Record<
  string,
  {
    backend: SecretBackend;
    externalized: boolean;
    managed: boolean;
  }
>;

const secretReferencePattern =
  /^(?<scheme>env|vault|aws-sm|gcp-sm|azure-kv):\/\/(?<reference>.+)$/i;

function normalizeSecretCandidate(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function parseSecretFallbacks(
  value: string | readonly string[] | undefined
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((candidate) => normalizeSecretCandidate(candidate))
      .filter((candidate): candidate is string => Boolean(candidate));
  }

  return commaSeparatedList.parse(value ?? "");
}

export function resolveSecretCandidates(
  primary: string | undefined,
  fallbacks: string | readonly string[] | undefined = []
): string[] {
  return [...new Set([normalizeSecretCandidate(primary), ...parseSecretFallbacks(fallbacks)].filter(
    (candidate): candidate is string => Boolean(candidate)
  ))];
}

export function describeSecretSource(value: string): SecretSourceDescriptor {
  const normalized = value.trim();
  const matchedReference = normalized.match(secretReferencePattern);

  if (!matchedReference?.groups) {
    return {
      backend: "literal",
      externalized: false,
      managed: false,
      raw: normalized
    };
  }

  const scheme = matchedReference.groups.scheme.toLowerCase();
  const reference = matchedReference.groups.reference.trim();
  const descriptor = secretReferenceCatalog[scheme as keyof typeof secretReferenceCatalog];

  if (!descriptor || !reference) {
    return {
      backend: "literal",
      externalized: false,
      managed: false,
      raw: normalized
    };
  }

  return {
    backend: descriptor.backend,
    externalized: descriptor.externalized,
    managed: descriptor.managed,
    raw: normalized,
    reference
  };
}

export function describeResolvedSecret(input: {
  fallbacks?: string | readonly string[] | undefined;
  primary: string;
}): ResolvedSecretDescriptor {
  const candidates = resolveSecretCandidates(input.primary, input.fallbacks);
  const [primaryCandidate, ...fallbackCandidates] = candidates;
  const primarySource = describeSecretSource(primaryCandidate ?? input.primary);
  const fallbackSources = fallbackCandidates.map((candidate) => describeSecretSource(candidate));

  return {
    candidates,
    externalized:
      primarySource.externalized || fallbackSources.some((candidate) => candidate.externalized),
    fallbackSources,
    managedBackends: [
      ...new Set(
        [primarySource, ...fallbackSources]
          .filter((candidate) => candidate.managed)
          .map((candidate) => candidate.backend)
      )
    ],
    primarySource
  };
}
