// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import {
  ensurePrivacyConsents,
  savePrivacyConsentDecisions
} from "../src/modules/privacy/consent.service.js";

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

function stubMethod(target: Record<string, unknown>, key: string, value: unknown): () => void {
  const original = target[key];
  target[key] = value;
  return () => {
    target[key] = original;
  };
}

type PrivacyConsentUpsertCall = Record<string, unknown> & {
  create?: {
    purpose?: string;
  };
};

function isTransactionCallback<TClient>(
  input: unknown
): input is (client: TClient) => unknown {
  return typeof input === "function";
}

void test("ensurePrivacyConsents initializes the canonical consent purposes", async () => {
  const organization = {
    id: "org_alpha",
    tenantId: "tenant_alpha"
  };
  const upsertCalls: PrivacyConsentUpsertCall[] = [];
  const transactionClient = {
    privacyConsent: {
      upsert: (args: PrivacyConsentUpsertCall) => {
        upsertCalls.push(args);
        return Promise.resolve({});
      }
    }
  };

  const restores = [
    stubMethod(prisma.organization as unknown as Record<string, unknown>, "findFirst", () =>
      Promise.resolve(organization)
    ),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", (input: unknown) => {
      if (isTransactionCallback<typeof transactionClient>(input)) {
        return input(transactionClient);
      }

      return Array.isArray(input) ? Promise.all(input) : Promise.resolve(input);
    })
  ];

  try {
    const result = await ensurePrivacyConsents({
      organizationReference: organization.id,
      userId: "user_alpha"
    });

    assert.deepEqual(result, organization);
    assert.equal(upsertCalls.length, 3);
    assert.deepEqual(
      upsertCalls.map((call) => call.create?.purpose),
      [
        CONSENT_PURPOSE.ANALYTICS,
        CONSENT_PURPOSE.MARKETING,
        CONSENT_PURPOSE.HEALTH_DATA_SHARING
      ]
    );
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

void test("savePrivacyConsentDecisions bounds the consent snapshot read for LGPD recompute", async () => {
  const organization = {
    id: "org_alpha",
    tenantId: "tenant_alpha"
  };
  const consentSnapshotCalls: Array<Record<string, unknown>> = [];
  const originalPrivacyConsentModel: unknown = Reflect.get(prisma, "privacyConsent");

  Reflect.set(prisma, "privacyConsent", {
    upsert: () => Promise.resolve({})
  });

  const transactionClient = {
    auditLog: {
      create: () => Promise.resolve({})
    },
    privacyConsent: {
      upsert: () => Promise.resolve({}),
      findMany: (args: Record<string, unknown>) => {
        consentSnapshotCalls.push(args);
        return Promise.resolve([
          {
            purpose: CONSENT_PURPOSE.ANALYTICS,
            status: CONSENT_STATUS.GRANTED
          },
          {
            purpose: CONSENT_PURPOSE.MARKETING,
            status: CONSENT_STATUS.PENDING
          },
          {
            purpose: CONSENT_PURPOSE.HEALTH_DATA_SHARING,
            status: CONSENT_STATUS.PENDING
          }
        ]);
      },
      findUnique: () =>
        Promise.resolve({
          grantedAt: null,
          id: "consent_analytics",
          source: CONSENT_SOURCE.SETTINGS,
          status: CONSENT_STATUS.PENDING
        }),
      update: () =>
        Promise.resolve({
          id: "consent_analytics",
          purpose: CONSENT_PURPOSE.ANALYTICS,
          source: CONSENT_SOURCE.SETTINGS,
          status: CONSENT_STATUS.GRANTED
        })
    },
    privacyConsentEvent: {
      create: () => Promise.resolve({})
    },
    userPreference: {
      findUnique: () => Promise.resolve(null),
      upsert: () => Promise.resolve({})
    }
  };
  const restores = [
    stubMethod(prisma.organization as unknown as Record<string, unknown>, "findFirst", () =>
      Promise.resolve(organization)
    ),
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", (input: unknown) => {
      if (isTransactionCallback<typeof transactionClient>(input)) {
        return input(transactionClient);
      }

      return Array.isArray(input) ? Promise.all(input) : Promise.resolve(input);
    })
  ];

  try {
    const result = await savePrivacyConsentDecisions({
      decisions: [
        {
          purpose: CONSENT_PURPOSE.ANALYTICS,
          source: CONSENT_SOURCE.SETTINGS,
          status: CONSENT_STATUS.GRANTED
        }
      ],
      organizationReference: organization.id,
      userId: "user_alpha"
    });

    assert.equal(result.length, 1);
    assert.equal(consentSnapshotCalls.length, 1);
    assert.equal(consentSnapshotCalls[0]?.take, 3);
    assert.deepEqual(consentSnapshotCalls[0]?.orderBy, {
      purpose: "asc"
    });
  } finally {
    restores.reverse().forEach((restore) => restore());
    Reflect.set(prisma, "privacyConsent", originalPrivacyConsentModel);
  }
});

