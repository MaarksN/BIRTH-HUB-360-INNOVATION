import assert from "node:assert/strict";
import test from "node:test";

import { CrossTenantAccessError } from "../src/errors/cross-tenant-access.error.js";
import { TenantRequiredError } from "../src/errors/tenant-required.error.js";
import { scopePrismaArgs, withTenantScope } from "../src/tenant-scope.js";

void test("withTenantScope injecta tenantId em leituras e escritas", async () => {
  const calls: Array<{ args: unknown; method: string }> = [];
  const client = {
    customer: {
      async create(args: unknown) {
        calls.push({ args, method: "create" });
        return {};
      },
      async findMany(args: unknown) {
        calls.push({ args, method: "findMany" });
        return [];
      },
      async update(args: unknown) {
        calls.push({ args, method: "update" });
        return {};
      }
    }
  };
  const scoped = withTenantScope(client, "tenant_alpha");

  await scoped.customer.findMany({ where: { status: "lead" } });
  await scoped.customer.create({ data: { email: "lead@example.com" } });
  await scoped.customer.update({
    data: { status: "active" },
    where: { id: "customer_1" }
  });

  assert.deepEqual(calls, [
    {
      args: {
        where: {
          status: "lead",
          tenantId: "tenant_alpha"
        }
      },
      method: "findMany"
    },
    {
      args: {
        data: {
          email: "lead@example.com",
          tenantId: "tenant_alpha"
        }
      },
      method: "create"
    },
    {
      args: {
        data: {
          status: "active"
        },
        where: {
          id: "customer_1",
          tenantId: "tenant_alpha"
        }
      },
      method: "update"
    }
  ]);
});

void test("scopePrismaArgs bloqueia tentativa cross-tenant", () => {
  assert.throws(
    () =>
      scopePrismaArgs({
        args: {
          where: {
            id: "customer_1",
            tenantId: "tenant_beta"
          }
        },
        model: "customer",
        operation: "findFirst",
        tenantId: "tenant_alpha"
      }),
    CrossTenantAccessError
  );
});

void test("withTenantScope exige tenantId explicito", () => {
  assert.throws(() => withTenantScope({}, " "), TenantRequiredError);
});
