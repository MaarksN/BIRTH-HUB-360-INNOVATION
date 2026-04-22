import type { ApiConfig } from "@birthub/config";
import {
  MembershipStatus,
  Role,
  SessionStatus,
  prisma
} from "@birthub/database";
import { createLogger } from "@birthub/logger";

import {
  createAccessToken,
  createRefreshToken,
  createSecureSessionId,
  randomToken,
  sha256
} from "./crypto.js";
import {
  nowPlusHours,
  nowPlusMinutes,
  resolveConcurrentSessionLimit,
  type SessionTokens
} from "./auth.service.shared.js";
import {
  hasExplicitDatabaseUrl,
  isDatabaseUnavailableError
} from "../../lib/database-availability.js";

const logger = createLogger("auth-sessions");
const ACTIVE_SESSION_ENFORCEMENT_LIMIT = 250;
const ACTIVE_SESSION_LIST_LIMIT = 100;

async function enforceConcurrentSessionLimit(input: {
  organizationId: string;
  role: Role;
  sessionId: string;
  tenantId: string;
  userId: string;
}): Promise<void> {
  const limit = resolveConcurrentSessionLimit(input.role);

  const activeSessions = await prisma.session.findMany({
    where: {
      organizationId: input.organizationId,
      revokedAt: null,
      tenantId: input.tenantId,
      userId: input.userId
    },
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true
    },
    take: ACTIVE_SESSION_ENFORCEMENT_LIMIT
  });

  if (activeSessions.length <= limit) {
    return;
  }

  const activeWithoutCurrent = activeSessions.filter((session) => session.id !== input.sessionId);
  const sessionsToKeep = Math.max(0, limit - 1);
  const sessionsToRevoke = activeWithoutCurrent.slice(sessionsToKeep).map((session) => session.id);

  if (sessionsToRevoke.length === 0) {
    return;
  }

  await prisma.session.updateMany({
    where: {
      id: {
        in: sessionsToRevoke
      },
      revokedAt: null,
      tenantId: input.tenantId
    },
    data: {
      revokedAt: new Date(),
      status: SessionStatus.REVOKED
    }
  });
}

export async function createSession(input: {
  accessMode?: string;
  breakGlassExpiresAt?: Date;
  breakGlassGrantId?: string;
  breakGlassReason?: string;
  breakGlassTicket?: string;
  config: ApiConfig;
  impersonatedByUserId?: string;
  ipAddress: string | null;
  organizationId: string;
  role?: Role;
  tenantId: string;
  userAgent: string | null;
  userId: string;
}): Promise<{ sessionId: string; tokens: SessionTokens }> {
  const sessionId = createSecureSessionId();
  const accessToken = createAccessToken({
    organizationId: input.organizationId,
    role: input.role ?? null,
    secret: input.config.SESSION_SECRET,
    sessionId,
    tenantId: input.tenantId,
    ttlMinutes: input.config.API_AUTH_TOKEN_TTL_MINUTES,
    userId: input.userId
  });
  const refreshToken = createRefreshToken();
  const csrfToken = randomToken(24);
  const expiresAt = nowPlusMinutes(input.config.API_AUTH_TOKEN_TTL_MINUTES);
  const refreshExpiresAt = nowPlusHours(input.config.API_AUTH_SESSION_TTL_HOURS);

  const created = await prisma.session.create({
    data: {
      id: sessionId,
      csrfToken,
      expiresAt,
      ipAddress: input.ipAddress,
      organizationId: input.organizationId,
      refreshExpiresAt,
      refreshTokenHash: sha256(refreshToken),
      tenantId: input.tenantId,
      token: sha256(accessToken),
      userAgent: input.userAgent,
      userId: input.userId
    }
  });

  if (input.role) {
    await enforceConcurrentSessionLimit({
      organizationId: input.organizationId,
      role: input.role,
      sessionId: created.id,
      tenantId: input.tenantId,
      userId: input.userId
    });
  }

  return {
    sessionId: created.id,
    tokens: {
      csrfToken,
      expiresAt,
      refreshToken,
      token: accessToken
    }
  };
}

async function revokeAllSessionsForIdentity(input: {
  organizationId: string;
  tenantId: string;
  userId: string;
}): Promise<number> {
  const result = await prisma.session.updateMany({
    data: {
      revokedAt: new Date()
    },
    where: {
      organizationId: input.organizationId,
      revokedAt: null,
      tenantId: input.tenantId,
      userId: input.userId
    }
  });

  return result.count;
}

async function tryResolveActiveMembershipRole(input: {
  organizationId: string;
  userId: string;
}): Promise<Role | undefined> {
  if (!hasExplicitDatabaseUrl()) {
    return undefined;
  }

  try {
    const membership = await prisma.membership.findUnique({
      select: {
        role: true,
        status: true
      },
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.userId
        }
      }
    });

    if (membership?.status === MembershipStatus.ACTIVE) {
      return membership.role;
    }

    return undefined;
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    logger.warn(
      {
        err: error,
        organizationId: input.organizationId,
        userId: input.userId
      },
      "Failed to resolve membership role during session refresh; continuing without embedded role claim"
    );

    return undefined;
  }
}

export async function createNewDeviceAlert(input: {
  ipAddress: string | null;
  organizationId: string;
  tenantId: string;
  userAgent: string | null;
  userId: string;
}) {
  const latestSession = await prisma.session.findFirst({
    orderBy: {
      createdAt: "desc"
    },
    where: {
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      userId: input.userId
    }
  });

  if (!latestSession) {
    return;
  }

  if (
    latestSession.ipAddress !== input.ipAddress ||
    latestSession.userAgent !== input.userAgent
  ) {
    await prisma.loginAlert.create({
      data: {
        ipAddress: input.ipAddress,
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        userAgent: input.userAgent,
        userId: input.userId
      }
    });
  }
}

export async function refreshSession(input: {
  config: ApiConfig;
  ipAddress: string | null;
  refreshToken: string;
  userAgent: string | null;
}): Promise<{
  breached: boolean;
  organizationId?: string;
  sessionId?: string;
  tenantId?: string;
  tokens?: SessionTokens;
  userId?: string;
}> {
  const refreshTokenHash = sha256(input.refreshToken);

  const current = await prisma.session.findFirst({
    where: {
      organizationId: {
        not: ""
      },
      refreshTokenHash
      ,
      tenantId: {
        not: ""
      }
    }
  });

  if (!current) {
    const revokedSession = await prisma.session.findFirst({
      where: {
        organizationId: {
          not: ""
        },
        refreshTokenHash,
        revokedAt: {
          not: null
        },
        tenantId: {
          not: ""
        }
      }
    });

    if (revokedSession) {
      await revokeAllSessionsForIdentity({
        organizationId: revokedSession.organizationId,
        tenantId: revokedSession.tenantId,
        userId: revokedSession.userId
      });

      return {
        breached: true
      };
    }

    return {
      breached: false
    };
  }

  if (
    current.revokedAt ||
    !current.refreshExpiresAt ||
    current.refreshExpiresAt.getTime() < Date.now()
  ) {
    return {
      breached: false
    };
  }

  const membershipRole = await tryResolveActiveMembershipRole({
    organizationId: current.organizationId,
    userId: current.userId
  });

  const nextSession = await createSession({
    config: input.config,
    ipAddress: input.ipAddress,
    organizationId: current.organizationId,
    ...(membershipRole
      ? {
          role: membershipRole
        }
      : {}),
    tenantId: current.tenantId,
    userAgent: input.userAgent,
    userId: current.userId
  });

  await prisma.session.update({
    data: {
      replacedBySessionId: nextSession.sessionId,
      revokedAt: new Date()
    },
    where: {
      id: current.id
    }
  });

  return {
    breached: false,
    organizationId: current.organizationId,
    sessionId: nextSession.sessionId,
    tenantId: current.tenantId,
    tokens: nextSession.tokens,
    userId: current.userId
  };
}

export async function revokeCurrentSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    data: {
      revokedAt: new Date()
    },
    where: {
      id: sessionId
    }
  });
}

export async function revokeAllSessions(input: {
  organizationId: string;
  tenantId: string;
  userId: string;
}): Promise<number> {
  return revokeAllSessionsForIdentity(input);
}

export async function listActiveSessions(input: {
  organizationId: string;
  tenantId: string;
  userId: string;
}) {
  return prisma.session.findMany({
    where: {
      organizationId: input.organizationId,
      revokedAt: null,
      tenantId: input.tenantId,
      userId: input.userId
    },
    orderBy: {
      lastActivityAt: "desc"
    },
    select: {
      id: true,
      ipAddress: true,
      lastActivityAt: true,
      userAgent: true
    },
    take: ACTIVE_SESSION_LIST_LIMIT
  });
}

export async function revokeSessionById(input: {
  organizationId: string;
  sessionId: string;
  tenantId: string;
  userId: string;
}) {
  const result = await prisma.session.updateMany({
    data: {
      revokedAt: new Date()
    },
    where: {
      id: input.sessionId,
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      userId: input.userId
    }
  });

  return result.count;
}
