import assert from "node:assert/strict";
import test from "node:test";

import { ExecutionSource, prisma } from "@birthub/database";

import {
  persistExecutionFinished,
  persistExecutionStarted
} from "./worker.execution-state.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

void test("worker execution persistence scopes writes by tenant", async () => {
  let upsertArgs: unknown = null;
  let updateArgs: unknown = null;
  const restores = [
    stubMethod(prisma.agentExecution, "upsert", (args: unknown) => {
      upsertArgs = args;
      return Promise.resolve({ id: "exec_1" });
    }),
    stubMethod(prisma.agentExecution, "update", (args: unknown) => {
      updateArgs = args;
      return Promise.resolve({ id: "exec_1" });
    })
  ];

  try {
    await persistExecutionStarted({
      agentId: "agent_1",
      executionId: "exec_1",
      inputPayload: {
        prompt: "hello"
      },
      organizationId: "org_1",
      source: ExecutionSource.MANUAL,
      tenantId: "tenant_1",
      userId: "user_1"
    });

    await persistExecutionFinished({
      executionId: "exec_1",
      status: "SUCCESS",
      tenantId: "tenant_1"
    });

    assert.equal((upsertArgs as { where?: { tenantId?: string } }).where?.tenantId, "tenant_1");
    assert.equal((updateArgs as { where?: { tenantId?: string } }).where?.tenantId, "tenant_1");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
