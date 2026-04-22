import { createHash } from "node:crypto";

import { prisma, type Prisma } from "@birthub/database";

import { readPrismaModel } from "../../lib/prisma-runtime.js";

const LAWFUL_BASIS = {
  LEGAL_OBLIGATION: "LEGAL_OBLIGATION",
  LEGITIMATE_INTEREST: "LEGITIMATE_INTEREST"
} as const;

export const RETENTION_ACTION = {
  ANONYMIZE: "ANONYMIZE",
  DELETE: "DELETE"
} as const;

export const RETENTION_DATA_CATEGORY = {
  LOGIN_ALERTS: "LOGIN_ALERTS",
  MFA_CHALLENGES: "MFA_CHALLENGES",
  MFA_RECOVERY_CODES: "MFA_RECOVERY_CODES",
  OUTPUT_ARTIFACTS: "OUTPUT_ARTIFACTS",
  SUSPENDED_USERS: "SUSPENDED_USERS"
} as const;

export const RETENTION_EXECUTION_MODE = {
  DRY_RUN: "DRY_RUN"
} as const;

export const USER_STATUS = {
  SUSPENDED: "SUSPENDED"
} as const;

export type LawfulBasis = (typeof LAWFUL_BASIS)[keyof typeof LAWFUL_BASIS];
export type RetentionAction = (typeof RETENTION_ACTION)[keyof typeof RETENTION_ACTION];
export type RetentionDataCategory = (typeof RETENTION_DATA_CATEGORY)[keyof typeof RETENTION_DATA_CATEGORY];
export type RetentionExecutionMode = "DRY_RUN" | "EXECUTE";

export type RetentionPolicyRecord = {
  action: RetentionAction;
  dataCategory: RetentionDataCategory;
  id: string;
  retentionDays: number;
};

export type RetentionExecutionRecord = {
  id: string;
};

export type RetentionPolicyDelegate = {
  findMany<TResult extends object>(args: object): Prisma.PrismaPromise<TResult[]>;
  update(args: { data: object; where: object }): Prisma.PrismaPromise<RetentionPolicyRecord>;
  upsert(args: {
    create: object;
    update: object;
    where: object;
  }): Prisma.PrismaPromise<RetentionPolicyRecord>;
};

export type RetentionExecutionDelegate = {
  create(args: { data: object }): Prisma.PrismaPromise<RetentionExecutionRecord>;
  findMany<TResult extends object>(args: object): Prisma.PrismaPromise<TResult[]>;
};

export type OrganizationPageRecord = {
  id: string;
  tenantId: string;
};

export type SuspendedUserRecord = {
  id: string;
};

export function readRetentionModel<T>(
  name: "dataRetentionExecution" | "dataRetentionPolicy"
): T {
  return readPrismaModel<T>(prisma, name, "privacy retention");
}

export const REDACTED_OUTPUT_CONTENT = "[REDACTED BY RETENTION POLICY]";
export const RETENTION_POLICY_PAGE_SIZE = 25;
export const RETENTION_SWEEP_ORGANIZATION_PAGE_SIZE = 100;
export const RETENTION_SUSPENDED_USER_PAGE_SIZE = 100;

export const DEFAULT_RETENTION_POLICIES: Array<{
  action: RetentionAction;
  dataCategory: RetentionDataCategory;
  legalBasis: LawfulBasis;
  retentionDays: number;
}> = [
  {
    action: RETENTION_ACTION.ANONYMIZE,
    dataCategory: RETENTION_DATA_CATEGORY.OUTPUT_ARTIFACTS,
    legalBasis: LAWFUL_BASIS.LEGITIMATE_INTEREST,
    retentionDays: 30
  },
  {
    action: RETENTION_ACTION.DELETE,
    dataCategory: RETENTION_DATA_CATEGORY.LOGIN_ALERTS,
    legalBasis: LAWFUL_BASIS.LEGITIMATE_INTEREST,
    retentionDays: 90
  },
  {
    action: RETENTION_ACTION.DELETE,
    dataCategory: RETENTION_DATA_CATEGORY.MFA_CHALLENGES,
    legalBasis: LAWFUL_BASIS.LEGITIMATE_INTEREST,
    retentionDays: 7
  },
  {
    action: RETENTION_ACTION.DELETE,
    dataCategory: RETENTION_DATA_CATEGORY.MFA_RECOVERY_CODES,
    legalBasis: LAWFUL_BASIS.LEGAL_OBLIGATION,
    retentionDays: 180
  },
  {
    action: RETENTION_ACTION.ANONYMIZE,
    dataCategory: RETENTION_DATA_CATEGORY.SUSPENDED_USERS,
    legalBasis: LAWFUL_BASIS.LEGAL_OBLIGATION,
    retentionDays: 90
  }
];

export function anonymizedEmail(userId: string): string {
  return `deleted+${userId}@privacy.birthhub360.invalid`;
}

export function redactedContentHash() {
  return createHash("sha256").update(REDACTED_OUTPUT_CONTENT, "utf8").digest("hex");
}

export function sortPolicies<T extends { dataCategory: string; id: string }>(policies: T[]) {
  return policies.sort(
    (left, right) =>
      left.dataCategory.localeCompare(right.dataCategory) || left.id.localeCompare(right.id)
  );
}
