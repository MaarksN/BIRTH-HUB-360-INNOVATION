import assert from "node:assert/strict";
import test from "node:test";

import { prisma, type Prisma } from "@birthub/database";

import {
  enqueueAuditEvent,
  ensureAuditFlushLoop,
  flushAuditBuffer,
  getAuditBufferSize,
  resetAuditBufferForTests
} from "../src/audit/buffer.js";

function createAuditEvent(index: number): Prisma.AuditLogCreateManyInput {
  return {
    action: `TEST_${index}`,
    entityId: `entity_${index}`,
    entityType: "unit-test",
    tenantId: "tenant_1"
  } as Prisma.AuditLogCreateManyInput;
}

void test("ensureAuditFlushLoop only registers one interval", () => {
  resetAuditBufferForTests();
  const originalSetInterval = globalThis.setInterval;
  let calls = 0;

  globalThis.setInterval = (((
    callback: TimerHandler,
    delay?: number
  ) => {
    void callback;
    assert.equal(delay, 5_000);
    calls += 1;
    return {
      ref: () => undefined,
      refresh: () => undefined,
      unref: () => undefined
    } as unknown as NodeJS.Timeout;
  }) as unknown as typeof setInterval);

  try {
    ensureAuditFlushLoop();
    ensureAuditFlushLoop();
    assert.equal(calls, 1);
  } finally {
    globalThis.setInterval = originalSetInterval;
    resetAuditBufferForTests();
  }
});

void test("flushAuditBuffer returns zero when no events are queued", async () => {
  resetAuditBufferForTests();
  assert.equal(await flushAuditBuffer(), 0);
});

void test("enqueueAuditEvent flushes once the batch reaches the threshold", async () => {
  resetAuditBufferForTests();
  const originalSetInterval = globalThis.setInterval;
  const originalCreateMany = prisma.auditLog.createMany.bind(prisma.auditLog);
  const flushedBatches: number[] = [];

  globalThis.setInterval = (((
    _callback: TimerHandler,
    _delay?: number
  ) =>
    ({
      ref: () => undefined,
      refresh: () => undefined,
      unref: () => undefined
    }) as unknown as NodeJS.Timeout) as unknown as typeof setInterval);

  prisma.auditLog.createMany = ((args: { data: unknown[] }) => {
    flushedBatches.push(args.data.length);
    return Promise.resolve({ count: args.data.length });
  }) as unknown as typeof prisma.auditLog.createMany;

  try {
    for (let index = 0; index < 100; index += 1) {
      enqueueAuditEvent(createAuditEvent(index));
    }

    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(flushedBatches, [100]);
    assert.equal(getAuditBufferSize(), 0);
  } finally {
    prisma.auditLog.createMany = originalCreateMany;
    globalThis.setInterval = originalSetInterval;
    resetAuditBufferForTests();
  }
});
