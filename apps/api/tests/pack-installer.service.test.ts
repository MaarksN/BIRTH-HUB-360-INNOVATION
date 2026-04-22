// @ts-expect-error TODO: remover suppressão ampla
// 
import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@birthub/database";

import { PackInstallerService } from "../src/modules/packs/pack-installer.service.js";

function stubMethod(target: Record<string, unknown>, key: string, value: unknown): () => void {
  const original = target[key];
  target[key] = value;
  return () => {
    target[key] = original;
  };
}

void test("getPackStatus paginates tenant agents and groups pack metadata", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    config:
      index === 0
        ? {
            installedVersion: "1.0.0",
            latestAvailableVersion: "1.1.0",
            packId: "pack_alpha"
          }
        : {},
    id: `agent_${index.toString().padStart(3, "0")}`,
    status: index === 0 ? "ACTIVE" : "PAUSED"
  }));
  const secondPage = [
    {
      config: {
        installedVersion: "2.0.0",
        latestAvailableVersion: "2.0.0",
        packId: "pack_beta"
      },
      id: "agent_100",
      status: "PAUSED"
    }
  ];
  const restore = stubMethod(prisma.agent as unknown as Record<string, unknown>, "findMany", (args: Record<string, unknown>) => {
    calls.push(args);
    return Promise.resolve(calls.length === 1 ? firstPage : secondPage);
  });

  try {
    const service = new PackInstallerService();
    const status = await service.getPackStatus("tenant_alpha");

    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.take, 100);
    assert.deepEqual(calls[1]?.cursor, {
      id: "agent_099"
    });
    assert.equal(calls[1]?.skip, 1);
    assert.deepEqual(status, [
      {
        installedVersion: "1.0.0",
        latestAvailableVersion: "1.1.0",
        packId: "pack_alpha",
        status: "active"
      },
      {
        installedVersion: "2.0.0",
        latestAvailableVersion: "2.0.0",
        packId: "pack_beta",
        status: "installed"
      }
    ]);
  } finally {
    restore();
  }
});

void test("updatePackVersion updates every matching agent config and writes an audit log", async () => {
  const originalFindMany = prisma.agent.findMany.bind(prisma.agent);
  const originalTransaction = prisma.$transaction.bind(prisma);
  const updateCalls: Array<Record<string, unknown>> = [];
  let auditPayload: unknown = null;

  prisma.agent.findMany = (async () =>
    [
      {
        config: {
          installedVersion: "1.0.0",
          latestAvailableVersion: "1.0.0",
          packId: "pack_alpha"
        },
        id: "agent_1",
        status: "ACTIVE"
      },
      {
        config: {
          installedVersion: "1.0.0",
          latestAvailableVersion: "1.0.0",
          packId: "pack_alpha"
        },
        id: "agent_2",
        status: "PAUSED"
      },
      {
        config: {
          installedVersion: "1.0.0",
          latestAvailableVersion: "1.0.0",
          packId: "pack_beta"
        },
        id: "agent_3",
        status: "ACTIVE"
      }
    ]) as unknown as typeof prisma.agent.findMany;
  prisma.$transaction = (async (callback: (tx: {
    agent: {
      update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    auditLog: {
      create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
  }) => Promise<unknown>) =>
    callback({
      agent: {
        update: async (args: Record<string, unknown>) => {
          updateCalls.push(args);
          return args;
        }
      },
      auditLog: {
        create: async (args: Record<string, unknown>) => {
          auditPayload = args;
          return args;
        }
      }
    })) as unknown as typeof prisma.$transaction;

  try {
    const service = new PackInstallerService();
    const result = await service.updatePackVersion({
      actorId: "user_1",
      latestAvailableVersion: "1.2.0",
      packId: "pack_alpha",
      tenantId: "tenant_alpha"
    });

    assert.equal(updateCalls.length, 2);
    assert.deepEqual(
      updateCalls.map((entry) => entry.where),
      [{ id: "agent_1" }, { id: "agent_2" }]
    );
    assert.deepEqual(auditPayload, {
      data: {
        action: "PACK_VERSION_UPDATED",
        actorId: "user_1",
        diff: {
          affectedAgents: 2,
          latestAvailableVersion: "1.2.0",
          packId: "pack_alpha"
        },
        entityId: "pack_alpha",
        entityType: "agent_pack",
        tenantId: "tenant_alpha"
      }
    });
    assert.deepEqual(result, {
      affectedAgents: 2,
      latestAvailableVersion: "1.2.0",
      packId: "pack_alpha"
    });
  } finally {
    prisma.agent.findMany = originalFindMany;
    prisma.$transaction = originalTransaction;
  }
});

