import type { ApiConfig } from "@birthub/config";
import { prisma } from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { hashPassword, randomToken } from "../auth/crypto.js";
import {
  listOrganizationsForRetentionSweep,
  listRetentionPoliciesForOrganization,
  listSuspendedUsersForRetention
} from "./retention.pagination.js";
import {
  DEFAULT_RETENTION_POLICIES,
  RETENTION_DATA_CATEGORY,
  RETENTION_EXECUTION_MODE,
  REDACTED_OUTPUT_CONTENT,
  anonymizedEmail,
  readRetentionModel,
  redactedContentHash,
  type RetentionAction,
  type RetentionDataCategory,
  type RetentionExecutionDelegate,
  type RetentionExecutionMode,
  type RetentionPolicyDelegate,
} from "./retention.shared.js";
import { findOrganizationByReference } from "./service.js";

async function ensureDefaultPolicies(input: {
  organizationId: string;
  tenantId: string;
}) {
  const retentionPolicyModel = readRetentionModel<RetentionPolicyDelegate>("dataRetentionPolicy");
  await prisma.$transaction(
    DEFAULT_RETENTION_POLICIES.map((policy) =>
      retentionPolicyModel.upsert({
        create: {
          action: policy.action,
          dataCategory: policy.dataCategory,
          legalBasis: policy.legalBasis,
          organizationId: input.organizationId,
          retentionDays: policy.retentionDays,
          tenantId: input.tenantId
        },
        update: {},
        where: {
          organizationId_dataCategory: {
            dataCategory: policy.dataCategory,
            organizationId: input.organizationId
          }
        }
      })
    )
  );
}

async function resolveOrganization(input: { organizationReference: string }) {
  const organization = await findOrganizationByReference(input.organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for retention policy.",
      status: 404,
      title: "Not Found"
    });
  }

  await ensureDefaultPolicies({
    organizationId: organization.id,
    tenantId: organization.tenantId
  });

  return organization;
}

async function executePolicy(input: {
  config: ApiConfig;
  mode: RetentionExecutionMode;
  organizationId: string;
  policy: {
    action: RetentionAction;
    dataCategory: RetentionDataCategory;
    id: string;
    retentionDays: number;
  };
  tenantId: string;
}) {
  const retentionExecutionModel = readRetentionModel<RetentionExecutionDelegate>("dataRetentionExecution");
  const cutoff = new Date(Date.now() - input.policy.retentionDays * 24 * 60 * 60 * 1000);
  let affectedCount = 0;
  let scannedCount = 0;

  switch (input.policy.dataCategory) {
    case RETENTION_DATA_CATEGORY.OUTPUT_ARTIFACTS: {
      const where = {
        createdAt: {
          lt: cutoff
        },
        organizationId: input.organizationId
      };
      scannedCount = await prisma.outputArtifact.count({ where });

      if (input.mode !== RETENTION_EXECUTION_MODE.DRY_RUN && scannedCount > 0) {
        const result = await prisma.outputArtifact.updateMany({
          data: {
            content: REDACTED_OUTPUT_CONTENT,
            contentHash: redactedContentHash()
          },
          where
        });
        affectedCount = result.count;
      }
      break;
    }
    case RETENTION_DATA_CATEGORY.LOGIN_ALERTS: {
      const where = {
        createdAt: {
          lt: cutoff
        },
        organizationId: input.organizationId
      };
      scannedCount = await prisma.loginAlert.count({ where });

      if (input.mode !== RETENTION_EXECUTION_MODE.DRY_RUN && scannedCount > 0) {
        const result = await prisma.loginAlert.deleteMany({ where });
        affectedCount = result.count;
      }
      break;
    }
    case RETENTION_DATA_CATEGORY.MFA_CHALLENGES: {
      const where = {
        createdAt: {
          lt: cutoff
        },
        organizationId: input.organizationId
      };
      scannedCount = await prisma.mfaChallenge.count({ where });

      if (input.mode !== RETENTION_EXECUTION_MODE.DRY_RUN && scannedCount > 0) {
        const result = await prisma.mfaChallenge.deleteMany({ where });
        affectedCount = result.count;
      }
      break;
    }
    case RETENTION_DATA_CATEGORY.MFA_RECOVERY_CODES: {
      const where = {
        OR: [
          {
            createdAt: {
              lt: cutoff
            }
          },
          {
            usedAt: {
              lt: cutoff
            }
          }
        ],
        tenantId: input.tenantId
      };
      scannedCount = await prisma.mfaRecoveryCode.count({ where });

      if (input.mode !== RETENTION_EXECUTION_MODE.DRY_RUN && scannedCount > 0) {
        const result = await prisma.mfaRecoveryCode.deleteMany({ where });
        affectedCount = result.count;
      }
      break;
    }
    case RETENTION_DATA_CATEGORY.SUSPENDED_USERS: {
      const users = await listSuspendedUsersForRetention({
        organizationId: input.organizationId,
        cutoff
      });
      scannedCount = users.length;

      if (input.mode !== RETENTION_EXECUTION_MODE.DRY_RUN && users.length > 0) {
        await Promise.all(
          users.map(async (user) => {
            const passwordHash = await hashPassword(
              randomToken(18),
              input.config.AUTH_BCRYPT_SALT_ROUNDS
            );
            await prisma.user.update({
              data: {
                email: anonymizedEmail(user.id),
                mfaEnabled: false,
                mfaSecret: null,
                name: "Deleted User",
                passwordHash
              },
              where: {
                id: user.id
              }
            });
          })
        );
        affectedCount = users.length;
      }
      break;
    }
    default:
      break;
  }

  const execution = await retentionExecutionModel.create({
    data: {
      action: input.policy.action,
      dataCategory: input.policy.dataCategory,
      mode: input.mode,
      organizationId: input.organizationId,
      policyId: input.policy.id,
      scannedCount,
      affectedCount,
      tenantId: input.tenantId
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "privacy.retention.executed",
      diff: {
        after: {
          action: input.policy.action,
          affectedCount,
          dataCategory: input.policy.dataCategory,
          mode: input.mode,
          scannedCount
        },
        before: {}
      },
      entityId: execution.id,
      entityType: "data_retention_execution",
      tenantId: input.tenantId
    }
  });

  return {
    affectedCount,
    dataCategory: input.policy.dataCategory,
    executionId: execution.id,
    scannedCount
  };
}

export async function listRetentionPolicies(input: {
  organizationReference: string;
}) {
  const retentionExecutionModel = readRetentionModel<RetentionExecutionDelegate>("dataRetentionExecution");
  const organization = await resolveOrganization({
    organizationReference: input.organizationReference
  });

  const [items, executions] = await Promise.all([
    listRetentionPoliciesForOrganization({
      organizationId: organization.id
    }),
    retentionExecutionModel.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 20,
      where: {
        organizationId: organization.id
      }
    })
  ]);

  return {
    executions,
    items
  };
}

export async function updateRetentionPolicies(input: {
  organizationReference: string;
  policies: Array<{
    action?: RetentionAction;
    dataCategory: RetentionDataCategory;
    enabled?: boolean;
    retentionDays?: number;
  }>;
}) {
  const organization = await resolveOrganization({
    organizationReference: input.organizationReference
  });

  await prisma.$transaction(
    input.policies.map((policy) =>
      readRetentionModel<RetentionPolicyDelegate>("dataRetentionPolicy").update({
        data: {
          ...(policy.action !== undefined ? { action: policy.action } : {}),
          ...(policy.enabled !== undefined ? { enabled: policy.enabled } : {}),
          ...(policy.retentionDays !== undefined
            ? { retentionDays: policy.retentionDays }
            : {})
        },
        where: {
          organizationId_dataCategory: {
            dataCategory: policy.dataCategory,
            organizationId: organization.id
          }
        }
      })
    )
  );

  return listRetentionPolicies({
    organizationReference: organization.id
  });
}

export async function runRetentionSweep(input: {
  config: ApiConfig;
  mode: RetentionExecutionMode;
  organizationReference?: string;
}) {
  const organizations = input.organizationReference
    ? [await resolveOrganization({ organizationReference: input.organizationReference })]
    : await listOrganizationsForRetentionSweep();

  const results = [];

  for (const organization of organizations) {
    await ensureDefaultPolicies({
      organizationId: organization.id,
      tenantId: organization.tenantId
    });

    const policies = await listRetentionPoliciesForOrganization({
      enabled: true,
      organizationId: organization.id
    });

    for (const policy of policies) {
      results.push(
        await executePolicy({
          config: input.config,
          mode: input.mode,
          organizationId: organization.id,
          policy,
          tenantId: organization.tenantId
        })
      );
    }
  }

  return results;
}
