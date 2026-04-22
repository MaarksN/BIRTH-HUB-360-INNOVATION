import { prisma } from "@birthub/database";

import {
  RETENTION_POLICY_PAGE_SIZE,
  RETENTION_SWEEP_ORGANIZATION_PAGE_SIZE,
  RETENTION_SUSPENDED_USER_PAGE_SIZE,
  USER_STATUS,
  readRetentionModel,
  sortPolicies,
  type OrganizationPageRecord,
  type RetentionPolicyDelegate,
  type RetentionPolicyRecord,
  type SuspendedUserRecord
} from "./retention.shared.js";

async function listRetentionPoliciesPage(input: {
  enabled?: boolean | undefined;
  organizationId: string;
  cursorId?: string | undefined;
}): Promise<RetentionPolicyRecord[]> {
  const retentionPolicyModel = readRetentionModel<RetentionPolicyDelegate>("dataRetentionPolicy");
  const where = {
    organizationId: input.organizationId,
    ...(input.enabled !== undefined ? { enabled: input.enabled } : {})
  };

  if (input.cursorId) {
    return retentionPolicyModel.findMany({
      cursor: {
        id: input.cursorId
      },
      orderBy: {
        id: "asc"
      },
      skip: 1,
      take: RETENTION_POLICY_PAGE_SIZE,
      where
    });
  }

  return retentionPolicyModel.findMany({
    orderBy: {
      id: "asc"
    },
    take: RETENTION_POLICY_PAGE_SIZE,
    where
  });
}

export async function listRetentionPoliciesForOrganization(input: {
  enabled?: boolean | undefined;
  organizationId: string;
  cursorId?: string | undefined;
}): Promise<RetentionPolicyRecord[]> {
  const page = await listRetentionPoliciesPage(input);
  const lastPolicy = page.at(-1);

  if (!lastPolicy || page.length < RETENTION_POLICY_PAGE_SIZE) {
    return input.cursorId ? page : sortPolicies(page);
  }

  const nextPage = await listRetentionPoliciesForOrganization({
    ...input,
    cursorId: lastPolicy.id
  });

  return input.cursorId ? page.concat(nextPage) : sortPolicies(page.concat(nextPage));
}

async function listOrganizationsPage(cursorId?: string): Promise<OrganizationPageRecord[]> {
  const select = {
    id: true,
    tenantId: true
  };

  if (cursorId) {
    return prisma.organization.findMany({
      cursor: {
        id: cursorId
      },
      orderBy: {
        id: "asc"
      },
      select,
      skip: 1,
      take: RETENTION_SWEEP_ORGANIZATION_PAGE_SIZE
    });
  }

  return prisma.organization.findMany({
    orderBy: {
      id: "asc"
    },
    select,
    take: RETENTION_SWEEP_ORGANIZATION_PAGE_SIZE
  });
}

export async function listOrganizationsForRetentionSweep(
  cursorId?: string
): Promise<OrganizationPageRecord[]> {
  const page = await listOrganizationsPage(cursorId);
  const lastOrganization = page.at(-1);

  if (!lastOrganization || page.length < RETENTION_SWEEP_ORGANIZATION_PAGE_SIZE) {
    return page;
  }

  return page.concat(await listOrganizationsForRetentionSweep(lastOrganization.id));
}

async function listSuspendedUsersPage(input: {
  organizationId: string;
  cutoff: Date;
  cursorId?: string | undefined;
}): Promise<SuspendedUserRecord[]> {
  const where = {
    memberships: {
      some: {
        organizationId: input.organizationId
      }
    },
    status: USER_STATUS.SUSPENDED,
    suspendedAt: {
      lte: input.cutoff
    }
  };

  if (input.cursorId) {
    return prisma.user.findMany({
      cursor: {
        id: input.cursorId
      },
      orderBy: {
        id: "asc"
      },
      select: {
        id: true
      },
      skip: 1,
      take: RETENTION_SUSPENDED_USER_PAGE_SIZE,
      where
    });
  }

  return prisma.user.findMany({
    orderBy: {
      id: "asc"
    },
    select: {
      id: true
    },
    take: RETENTION_SUSPENDED_USER_PAGE_SIZE,
    where
  });
}

export async function listSuspendedUsersForRetention(input: {
  organizationId: string;
  cutoff: Date;
  cursorId?: string | undefined;
}): Promise<SuspendedUserRecord[]> {
  const page = await listSuspendedUsersPage(input);
  const lastUser = page.at(-1);

  if (!lastUser || page.length < RETENTION_SUSPENDED_USER_PAGE_SIZE) {
    return page;
  }

  return page.concat(
    await listSuspendedUsersForRetention({
      ...input,
      cursorId: lastUser.id
    })
  );
}
