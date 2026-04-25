import assert from "node:assert/strict";
import test from "node:test";

import { Role, type Membership } from "@prisma/client";

import { prisma } from "../src/client.js";
import {
  buildTenantMembershipFilter,
  findMembershipForTenant,
  hasRequiredRole,
  requireMembershipForTenant
} from "../src/repositories/access-control.js";

function createMembership(): Membership {
  return {
    createdAt: new Date("2026-04-05T00:00:00.000Z"),
    id: "membership_1",
    organizationId: "org_1",
    role: Role.ADMIN,
    status: "ACTIVE",
    tenantId: "tenant_1",
    updatedAt: new Date("2026-04-05T00:00:00.000Z"),
    userId: "user_1"
  };
}

void test("hasRequiredRole respects the configured role priority", () => {
  assert.equal(hasRequiredRole(Role.OWNER, Role.ADMIN), true);
  assert.equal(hasRequiredRole(Role.MEMBER, Role.ADMIN), false);
  assert.equal(hasRequiredRole(Role.SUPER_ADMIN, Role.OWNER), true);
  assert.equal(hasRequiredRole(Role.READONLY, Role.MEMBER), false);
});

void test("findMembershipForTenant queries the composite membership key", async () => {
  const membership = createMembership();
  const original = prisma.membership.findUnique.bind(prisma.membership);
  let received: unknown = null;

  prisma.membership.findUnique = ((args: unknown) => {
    received = args;
    return Promise.resolve(membership);
  }) as typeof prisma.membership.findUnique;

  try {
    const result = await findMembershipForTenant("org_1", "user_1");

    assert.equal(result, membership);
    assert.deepEqual(received, {
      where: {
        organizationId_userId: {
          organizationId: "org_1",
          userId: "user_1"
        }
      }
    });
  } finally {
    prisma.membership.findUnique = original;
  }
});

void test("requireMembershipForTenant throws when membership is missing", async () => {
  const original = prisma.membership.findUnique.bind(prisma.membership);

  prisma.membership.findUnique = (() =>
    Promise.resolve(null)) as unknown as typeof prisma.membership.findUnique;

  try {
    await assert.rejects(() => requireMembershipForTenant("org_1", "user_1"), /MEMBERSHIP_NOT_FOUND/);
  } finally {
    prisma.membership.findUnique = original;
  }
});

void test("buildTenantMembershipFilter scopes lookups to organization and user", () => {
  assert.deepEqual(buildTenantMembershipFilter("org_1", "user_1"), {
    memberships: {
      some: {
        organizationId: "org_1",
        userId: "user_1"
      }
    }
  });
});
