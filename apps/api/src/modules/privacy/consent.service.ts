import {
  ensureUserPreference,
  prisma
} from "@birthub/database";

import { readPrismaModel } from "../../lib/prisma-runtime.js";
import { ProblemDetailsError } from "../../lib/problem-details.js";
import { findOrganizationByReference } from "./service.js";

const CONSENT_PURPOSE = {
  ANALYTICS: "ANALYTICS",
  HEALTH_DATA_SHARING: "HEALTH_DATA_SHARING",
  MARKETING: "MARKETING"
} as const;

const CONSENT_SOURCE = {
  SETTINGS: "SETTINGS"
} as const;

const CONSENT_STATUS = {
  GRANTED: "GRANTED",
  PENDING: "PENDING",
  REVOKED: "REVOKED"
} as const;

const COOKIE_CONSENT_STATUS = {
  ACCEPTED: "ACCEPTED",
  PENDING: "PENDING",
  REJECTED: "REJECTED"
} as const;

const LAWFUL_BASIS = {
  CONSENT: "CONSENT",
  HEALTH_PROTECTION: "HEALTH_PROTECTION"
} as const;

type ConsentPurpose = (typeof CONSENT_PURPOSE)[keyof typeof CONSENT_PURPOSE];
type ConsentSource = (typeof CONSENT_SOURCE)[keyof typeof CONSENT_SOURCE];
type ConsentStatus = (typeof CONSENT_STATUS)[keyof typeof CONSENT_STATUS];
type CookieConsentStatus = (typeof COOKIE_CONSENT_STATUS)[keyof typeof COOKIE_CONSENT_STATUS];
type PrivacyConsentRecord = {
  grantedAt: Date | null;
  id: string;
  purpose: ConsentPurpose;
  source: ConsentSource;
  status: ConsentStatus;
};

type PrivacyConsentDelegate = {
  findMany<TResult extends object>(args: object): Promise<TResult[]>;
  findUnique(args: { where: object }): Promise<PrivacyConsentRecord | null>;
  update(args: { data: object; where: { id: string } }): Promise<PrivacyConsentRecord>;
  upsert(args: { create: object; update: object; where: object }): Promise<PrivacyConsentRecord>;
};

type PrivacyConsentEventDelegate = {
  create(args: { data: object }): Promise<unknown>;
  findMany<TResult extends object>(args: object): Promise<TResult[]>;
};

type AuditLogDelegate = {
  create(args: { data: object }): Promise<unknown>;
};

type UserPreferenceDelegate = {
  findUnique(args: { where: object }): Promise<{
    lgpdConsentedAt: Date | null;
  } | null>;
  upsert(args: { create: object; update: object; where: object }): Promise<unknown>;
};

type UserPreferenceRecord = {
  cookieConsent: string | null;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  lgpdConsentedAt?: Date | null;
  lgpdConsentStatus?: string | null;
  lgpdConsentVersion?: string | null;
  lgpdLegalBasis?: string | null;
  marketingEmails: boolean;
  pushNotifications: boolean;
};

function readPrivacyModel<T>(name: "privacyConsent" | "privacyConsentEvent"): T {
  return readPrismaModel<T>(prisma, name, "privacy consent");
}

const DEFAULT_CONSENT_PURPOSES = [
  CONSENT_PURPOSE.ANALYTICS,
  CONSENT_PURPOSE.MARKETING,
  CONSENT_PURPOSE.HEALTH_DATA_SHARING
] as const;
const CONSENT_VERSION = "2026-04";
const CONSENT_PURPOSE_LIST_LIMIT = DEFAULT_CONSENT_PURPOSES.length;

type ConsentSnapshot = {
  purpose: ConsentPurpose;
  status: ConsentStatus;
};

type LgpdPreferenceState = {
  consentedAt: Date | null;
  legalBasis:
    | "CONSENT"
    | "CONTRACT"
    | "HEALTH_PROTECTION"
    | "LEGAL_OBLIGATION"
    | "LEGITIMATE_INTEREST";
  status: "ACCEPTED" | "PENDING" | "REJECTED";
  version: string;
};

function mapAnalyticsConsent(status: ConsentStatus): CookieConsentStatus {
  switch (status) {
    case CONSENT_STATUS.GRANTED:
      return COOKIE_CONSENT_STATUS.ACCEPTED;
    case CONSENT_STATUS.REVOKED:
      return COOKIE_CONSENT_STATUS.REJECTED;
    default:
      return COOKIE_CONSENT_STATUS.PENDING;
  }
}

function deriveLgpdPreferenceState(
  items: ConsentSnapshot[],
  currentConsentedAt: Date | null
): LgpdPreferenceState {
  const byPurpose = new Map(items.map((item) => [item.purpose, item.status]));
  const statuses = DEFAULT_CONSENT_PURPOSES.map(
    (purpose) => byPurpose.get(purpose) ?? CONSENT_STATUS.PENDING
  );
  const status = statuses.some((value) => value === CONSENT_STATUS.PENDING)
    ? "PENDING"
    : statuses.every((value) => value === CONSENT_STATUS.REVOKED)
      ? "REJECTED"
      : "ACCEPTED";
  const healthDataGranted =
    byPurpose.get(CONSENT_PURPOSE.HEALTH_DATA_SHARING) === CONSENT_STATUS.GRANTED;

  return {
    consentedAt: status === "ACCEPTED" ? currentConsentedAt ?? new Date() : null,
    legalBasis: healthDataGranted ? LAWFUL_BASIS.HEALTH_PROTECTION : LAWFUL_BASIS.CONSENT,
    status,
    version: CONSENT_VERSION
  };
}

async function applyConsentDecision(input: {
  decision: {
    purpose: ConsentPurpose;
    source: ConsentSource;
    status: ConsentStatus;
  };
  organization: {
    id: string;
    tenantId: string;
  };
  tx: object;
  userId: string;
}) {
  const privacyConsentModel = readPrismaModel<PrivacyConsentDelegate>(
    input.tx,
    "privacyConsent",
    "privacy consent"
  );
  const privacyConsentEventModel = readPrismaModel<PrivacyConsentEventDelegate>(
    input.tx,
    "privacyConsentEvent",
    "privacy consent"
  );
  const auditLogModel = readPrismaModel<AuditLogDelegate>(input.tx, "auditLog", "privacy consent");
  const userPreferenceModel = readPrismaModel<UserPreferenceDelegate>(
    input.tx,
    "userPreference",
    "privacy consent"
  );
  const current = await privacyConsentModel.findUnique({
    where: {
      organizationId_userId_purpose: {
        organizationId: input.organization.id,
        purpose: input.decision.purpose,
        userId: input.userId
      }
    }
  });

  if (!current) {
    throw new ProblemDetailsError({
      detail: "Consent state was not initialized for this user.",
      status: 409,
      title: "Conflict"
    });
  }

  const nextGrantedAt =
    input.decision.status === CONSENT_STATUS.GRANTED ? new Date() : current.grantedAt;
  const nextRevokedAt =
    input.decision.status === CONSENT_STATUS.REVOKED ? new Date() : null;

  const updated = await privacyConsentModel.update({
    data: {
      grantedAt: input.decision.status === CONSENT_STATUS.GRANTED ? nextGrantedAt : null,
      lastChangedAt: new Date(),
      revokedAt: nextRevokedAt,
      source: input.decision.source,
      status: input.decision.status
    },
    where: {
      id: current.id
    }
  });

  if (current.status !== input.decision.status || current.source !== input.decision.source) {
    await Promise.all([
      privacyConsentEventModel.create({
        data: {
          lawfulBasis: LAWFUL_BASIS.CONSENT,
          newStatus: input.decision.status,
          organizationId: input.organization.id,
          previousStatus: current.status,
          purpose: input.decision.purpose,
          source: input.decision.source,
          tenantId: input.organization.tenantId,
          userId: input.userId
        }
      }),
      auditLogModel.create({
        data: {
          action: "privacy.consent.updated",
          actorId: input.userId,
          diff: {
            after: {
              purpose: input.decision.purpose,
              source: input.decision.source,
              status: input.decision.status
            },
            before: {
              source: current.source,
              status: current.status
            }
          },
          entityId: current.id,
          entityType: "privacy_consent",
          tenantId: input.organization.tenantId
        }
      })
    ]);
  }

  if (input.decision.purpose === CONSENT_PURPOSE.ANALYTICS) {
    await userPreferenceModel.upsert({
      create: {
        cookieConsent: mapAnalyticsConsent(input.decision.status),
        organizationId: input.organization.id,
        tenantId: input.organization.tenantId,
        userId: input.userId
      },
      update: {
        cookieConsent: mapAnalyticsConsent(input.decision.status)
      },
      where: {
        organizationId_userId: {
          organizationId: input.organization.id,
          userId: input.userId
        }
      }
    });
  }

  if (input.decision.purpose === CONSENT_PURPOSE.MARKETING) {
    await userPreferenceModel.upsert({
      create: {
        marketingEmails: input.decision.status === CONSENT_STATUS.GRANTED,
        organizationId: input.organization.id,
        tenantId: input.organization.tenantId,
        userId: input.userId
      },
      update: {
        marketingEmails: input.decision.status === CONSENT_STATUS.GRANTED
      },
      where: {
        organizationId_userId: {
          organizationId: input.organization.id,
          userId: input.userId
        }
      }
    });
  }

  return updated;
}

export async function ensurePrivacyConsents(input: {
  organizationReference: string;
  userId: string;
}) {
  const organization = await findOrganizationByReference(input.organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for privacy consent.",
      status: 404,
      title: "Not Found"
    });
  }

  await prisma.$transaction(async (tx) => {
    const privacyConsentModel = readPrismaModel<PrivacyConsentDelegate>(
      tx,
      "privacyConsent",
      "privacy consent"
    );

    await Promise.all(
      DEFAULT_CONSENT_PURPOSES.map((purpose) =>
        privacyConsentModel.upsert({
          create: {
            lawfulBasis: LAWFUL_BASIS.CONSENT,
            organizationId: organization.id,
            purpose,
            source: CONSENT_SOURCE.SETTINGS,
            tenantId: organization.tenantId,
            userId: input.userId
          },
          update: {},
          where: {
            organizationId_userId_purpose: {
              organizationId: organization.id,
              purpose,
              userId: input.userId
            }
          }
        })
      )
    );
  });

  return organization;
}

export async function listPrivacyConsents(input: {
  organizationReference: string;
  userId: string;
}) {
  const privacyConsentModel = readPrivacyModel<PrivacyConsentDelegate>("privacyConsent");
  const privacyConsentEventModel = readPrivacyModel<PrivacyConsentEventDelegate>("privacyConsentEvent");
  const organization = await ensurePrivacyConsents(input);
  const [items, history] = await Promise.all([
    privacyConsentModel.findMany<PrivacyConsentRecord>({
      orderBy: {
        purpose: "asc"
      },
      take: CONSENT_PURPOSE_LIST_LIMIT,
      where: {
        organizationId: organization.id,
        userId: input.userId
      }
    }),
    privacyConsentEventModel.findMany<Record<string, unknown>>({
      orderBy: {
        createdAt: "desc"
      },
      take: 20,
      where: {
        organizationId: organization.id,
        userId: input.userId
      }
    })
  ]);
  const preferences = (await ensureUserPreference({
    organizationId: organization.id,
    tenantId: organization.tenantId,
    userId: input.userId
  })) as UserPreferenceRecord;

  return {
    history,
    items,
    preferences: {
      cookieConsent: preferences.cookieConsent,
      emailNotifications: preferences.emailNotifications,
      inAppNotifications: preferences.inAppNotifications,
      lgpdConsentedAt: preferences.lgpdConsentedAt ?? null,
      lgpdConsentStatus: preferences.lgpdConsentStatus ?? null,
      lgpdConsentVersion: preferences.lgpdConsentVersion ?? null,
      lgpdLegalBasis: preferences.lgpdLegalBasis ?? null,
      marketingEmails: preferences.marketingEmails,
      pushNotifications: preferences.pushNotifications
    }
  };
}

export async function savePrivacyConsentDecisions(input: {
  decisions: Array<{
    purpose: ConsentPurpose;
    source: ConsentSource;
    status: ConsentStatus;
  }>;
  organizationReference: string;
  userId: string;
}) {
  const organization = await ensurePrivacyConsents({
    organizationReference: input.organizationReference,
    userId: input.userId
  });

  const updatedItems = await prisma.$transaction(async (tx) => {
    const userPreferenceModel = readPrismaModel<UserPreferenceDelegate>(
      tx,
      "userPreference",
      "privacy consent"
    );
    const privacyConsentModel = readPrismaModel<PrivacyConsentDelegate>(
      tx,
      "privacyConsent",
      "privacy consent"
    );
    const currentPreference = await userPreferenceModel.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: input.userId
        }
      }
    });
    const results = await Promise.all(
      input.decisions.map((decision) =>
        applyConsentDecision({
          decision,
          organization,
          tx,
          userId: input.userId
        })
      )
    );

    const currentItems = await privacyConsentModel.findMany<ConsentSnapshot>({
      orderBy: {
        purpose: "asc"
      },
      select: {
        purpose: true,
        status: true
      },
      take: CONSENT_PURPOSE_LIST_LIMIT,
      where: {
        organizationId: organization.id,
        userId: input.userId
      }
    });
    const lgpdState = deriveLgpdPreferenceState(
      currentItems,
      currentPreference?.lgpdConsentedAt ?? null
    );

    await userPreferenceModel.upsert({
      create: {
        lgpdConsentedAt: lgpdState.consentedAt,
        lgpdConsentStatus: lgpdState.status,
        lgpdConsentVersion: lgpdState.version,
        lgpdLegalBasis: lgpdState.legalBasis,
        organizationId: organization.id,
        tenantId: organization.tenantId,
        userId: input.userId
      },
      update: {
        lgpdConsentedAt: lgpdState.consentedAt,
        lgpdConsentStatus: lgpdState.status,
        lgpdConsentVersion: lgpdState.version,
        lgpdLegalBasis: lgpdState.legalBasis
      },
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: input.userId
        }
      }
    });

    return results;
  });

  return updatedItems;
}
