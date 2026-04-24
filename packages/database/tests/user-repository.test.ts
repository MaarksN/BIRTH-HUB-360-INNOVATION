import assert from "node:assert/strict";
import test from "node:test";

import { Role, UserStatus } from "@prisma/client";

import { prisma } from "../src/client.js";
import { listUsersByTenant, updateMembershipRole } from "../src/repositories/user-repository.js";

void test("listUsersByTenant builds membership, status and search filters", async () => {
  const originalFindMany = prisma.user.findMany.bind(prisma.user);
  let received: unknown = null;

  prisma.user.findMany = ((args: unknown) => {
    received = args;
    return Promise.resolve([{ id: "user_1" }] as never);
  }) as unknown as typeof prisma.user.findMany;

  try {
    const result = await listUsersByTenant("org_1", {
      role: Role.ADMIN,
      search: "alice",
      status: UserStatus.ACTIVE
    });

    assert.deepEqual(result, [{ id: "user_1" }]);
    assert.deepEqual(received, {
      include: {
        memberships: {
          where: {
            organizationId: "org_1"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100,
      where: {
        OR: [
          {
            email: {
              contains: "alice",
              mode: "insensitive"
            }
          },
          {
            name: {
              contains: "alice",
              mode: "insensitive"
            }
          }
        ],
        memberships: {
          some: {
            organizationId: "org_1",
            role: Role.ADMIN
          }
        },
        status: UserStatus.ACTIVE
      }
    });
  } finally {
    prisma.user.findMany = originalFindMany;
  }
});

void test("updateMembershipRole forwards the compound membership key", async () => {
  const originalUpdate = prisma.membership.update.bind(prisma.membership);
  let received: unknown = null;

  prisma.membership.update = ((args: unknown) => {
    received = args;
    return Promise.resolve({ role: Role.ADMIN } as never);
  }) as unknown as typeof prisma.membership.update;

  try {
    const result = await updateMembershipRole("org_1", "user_1", Role.ADMIN);

    assert.deepEqual(result, { role: Role.ADMIN });
    assert.deepEqual(received, {
      data: {
        role: Role.ADMIN
      },
      where: {
        organizationId_userId: {
          organizationId: "org_1",
          userId: "user_1"
        }
      }
    });
  } finally {
    prisma.membership.update = originalUpdate;
  }
});
