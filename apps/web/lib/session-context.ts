export const API_CSRF_COOKIE_NAME = "bh360_csrf";
export const ACTIVE_TENANT_COOKIE_NAME = "bh_active_tenant";
export const USER_ID_COOKIE_NAME = "bh_user_id";

export const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "bh_access_token";
export const LEGACY_REFRESH_TOKEN_STORAGE_KEY = "bh_refresh_token";
export const LEGACY_CSRF_STORAGE_KEY = "bh_csrf_token";
export const LEGACY_TENANT_STORAGE_KEY = "bh_tenant_id";
export const LEGACY_USER_ID_STORAGE_KEY = "bh_user_id";

export interface StoredSession {
  tenantId?: string;
  userId?: string;
}

function normalizeValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function readCookieValueFromHeader(
  cookieHeader: string | null | undefined,
  name: string
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return normalizeValue(decodeURIComponent(match.slice(name.length + 1)));
}

export function normalizeStoredSession(session: StoredSession | null): StoredSession | null {
  if (!session) {
    return null;
  }

  const tenantId = normalizeValue(session.tenantId);
  const userId = normalizeValue(session.userId);

  if (!tenantId && !userId) {
    return null;
  }

  return {
    ...(tenantId ? { tenantId } : {}),
    ...(userId ? { userId } : {})
  };
}
