import type { ManagedAgentPolicy } from "@birthub/agents-core";

import { decryptConnectorsMap } from "../../lib/encryption.js";
import type { AgentConfigSnapshot } from "./service.types.js";

const DEFAULT_AGENT_VERSION = "1.0.0";
const DEFAULT_AGENT_STATUS = "installed";
const DEFAULT_RUNTIME_PROVIDER = "manifest-runtime";

function createDefaultAgentConfig(): AgentConfigSnapshot {
  return {
    connectors: {},
    installedAt: null,
    installedVersion: DEFAULT_AGENT_VERSION,
    latestAvailableVersion: DEFAULT_AGENT_VERSION,
    managedPolicies: [],
    packId: null,
    runtimeProvider: DEFAULT_RUNTIME_PROVIDER,
    sourceAgentId: null,
    status: DEFAULT_AGENT_STATUS
  };
}

function readConfigCandidate(config: unknown): Record<string, unknown> | null {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return null;
  }

  return config as Record<string, unknown>;
}

function parseConfigConnectors(candidate: Record<string, unknown>): Record<string, unknown> {
  const rawConnectors =
    candidate.connectors && typeof candidate.connectors === "object" && !Array.isArray(candidate.connectors)
      ? (candidate.connectors as Record<string, unknown>)
      : {};

  return decryptConnectorsMap(rawConnectors);
}

function isManagedPolicyCandidate(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const policy = value as Record<string, unknown>;
  return (
    typeof policy.id === "string" &&
    typeof policy.name === "string" &&
    typeof policy.effect === "string" &&
    Array.isArray(policy.actions)
  );
}

function toManagedPolicy(policy: Record<string, unknown>): ManagedAgentPolicy {
  const effect: ManagedAgentPolicy["effect"] = policy.effect === "deny" ? "deny" : "allow";
  const actions = Array.isArray(policy.actions) ? policy.actions : [];

  return {
    actions: actions.filter((value): value is string => typeof value === "string"),
    effect,
    id: policy.id as string,
    name: policy.name as string,
    ...(typeof policy.enabled === "boolean" ? { enabled: policy.enabled } : {}),
    ...(typeof policy.reason === "string" ? { reason: policy.reason } : {})
  } satisfies ManagedAgentPolicy;
}

function parseManagedPolicies(candidate: Record<string, unknown>): ManagedAgentPolicy[] {
  if (!Array.isArray(candidate.managedPolicies)) {
    return [];
  }

  return candidate.managedPolicies
    .filter(isManagedPolicyCandidate)
    .map((policy) => toManagedPolicy(policy));
}

function parseRuntimeProvider(candidate: Record<string, unknown>): AgentConfigSnapshot["runtimeProvider"] {
  const runtime =
    candidate.runtime && typeof candidate.runtime === "object" && candidate.runtime !== null
      ? (candidate.runtime as Record<string, unknown>)
      : {};

  return runtime.provider === "python-orchestrator" ? "python-orchestrator" : DEFAULT_RUNTIME_PROVIDER;
}

function parseInstalledVersion(candidate: Record<string, unknown>): string {
  return typeof candidate.installedVersion === "string"
    ? candidate.installedVersion
    : DEFAULT_AGENT_VERSION;
}

function parseLatestAvailableVersion(
  candidate: Record<string, unknown>,
  installedVersion: string
): string {
  return typeof candidate.latestAvailableVersion === "string"
    ? candidate.latestAvailableVersion
    : typeof candidate.installedVersion === "string"
      ? candidate.installedVersion
      : installedVersion;
}

export function parseAgentConfig(config: unknown): AgentConfigSnapshot {
  const candidate = readConfigCandidate(config);

  if (!candidate) {
    return createDefaultAgentConfig();
  }

  const installedVersion = parseInstalledVersion(candidate);

  return {
    connectors: parseConfigConnectors(candidate),
    installedAt: typeof candidate.installedAt === "string" ? candidate.installedAt : null,
    installedVersion,
    latestAvailableVersion: parseLatestAvailableVersion(candidate, installedVersion),
    managedPolicies: parseManagedPolicies(candidate),
    packId: typeof candidate.packId === "string" ? candidate.packId : null,
    runtimeProvider: parseRuntimeProvider(candidate),
    sourceAgentId: typeof candidate.sourceAgentId === "string" ? candidate.sourceAgentId : null,
    status: typeof candidate.status === "string" ? candidate.status : DEFAULT_AGENT_STATUS
  };
}

export function normalizeConfigObject(config: unknown): Record<string, unknown> {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }

  return { ...(config as Record<string, unknown>) };
}

export function mergeManagedPolicies(
  currentPolicies: ManagedAgentPolicy[],
  nextPolicy: ManagedAgentPolicy
): ManagedAgentPolicy[] {
  const merged = new Map<string, ManagedAgentPolicy>();

  for (const policy of [...currentPolicies, nextPolicy]) {
    merged.set(policy.id, policy);
  }

  return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
}

