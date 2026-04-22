import { redirect } from "next/navigation";

import { fetchProductJson } from "./product-api.server";

export type AppRole = "READONLY" | "MEMBER" | "ADMIN" | "OWNER" | "SUPER_ADMIN";

type PlanSnapshot = {
  code?: string;
  creditBalanceCents?: number;
  currentPeriodEnd?: string | null;
  hardLocked?: boolean;
  isPaid?: boolean;
  isWithinGracePeriod?: boolean;
  name?: string;
  secondsUntilHardLock?: number | null;
  status?: string | null;
};

export interface WebSessionProfile {
  plan: PlanSnapshot;
  requestId: string;
  user: {
    id: string;
    organizationId: string;
    role: AppRole | null;
    tenantId: string;
  };
}

const rolePriority: Record<AppRole, number> = {
  READONLY: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
  SUPER_ADMIN: 4
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRole(value: unknown): AppRole | null {
  if (typeof value !== "string") {
    return null;
  }

  return value in rolePriority ? (value as AppRole) : null;
}

function parseSessionProfile(payload: unknown): WebSessionProfile {
  if (!isRecord(payload)) {
    throw new Error("Invalid session payload.");
  }

  const user = payload.user;
  if (!isRecord(user)) {
    throw new Error("Session payload is missing the user snapshot.");
  }

  const id = typeof user.id === "string" ? user.id : null;
  const organizationId = typeof user.organizationId === "string" ? user.organizationId : null;
  const tenantId = typeof user.tenantId === "string" ? user.tenantId : null;
  const role = parseRole(user.role);
  const requestId = typeof payload.requestId === "string" ? payload.requestId : null;

  if (!id || !organizationId || !tenantId || !requestId) {
    throw new Error("Session payload is missing required fields.");
  }

  return {
    plan: isRecord(payload.plan) ? payload.plan : {},
    requestId,
    user: {
      id,
      organizationId,
      role,
      tenantId
    }
  };
}

export function hasMinimumRole(role: AppRole | null, minimumRole: AppRole): boolean {
  if (!role) {
    return false;
  }

  return rolePriority[role] >= rolePriority[minimumRole];
}

export async function getAuthenticatedWebSession(): Promise<WebSessionProfile> {
  return parseSessionProfile(await fetchProductJson<unknown>("/api/v1/me"));
}

export async function requireAuthenticatedWebSession(options?: {
  minimumRole?: AppRole;
  onForbiddenRedirectTo?: string;
}): Promise<WebSessionProfile> {
  const profile = await getAuthenticatedWebSession();

  if (options?.minimumRole && !hasMinimumRole(profile.user.role, options.minimumRole)) {
    redirect(options.onForbiddenRedirectTo ?? "/dashboard");
  }

  return profile;
}
