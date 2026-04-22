import assert from "node:assert/strict";
import test from "node:test";

import { ConnectorExecutionError } from "./errors.js";
import {
  DEFAULT_IDEMPOTENCY_TTL_SECONDS,
  buildIdempotencyKey,
  ensureNotDuplicate,
} from "./idempotency.js";
import { runWithLogging } from "./run.js";
import type {
  ConnectorExecutionContext,
  ExecutionLogEntry,
  IdempotencyStore,
} from "./types.js";

function createContext(
  overrides: Partial<ConnectorExecutionContext> = {},
): ConnectorExecutionContext {
  return {
    tenantId: "tenant_123",
    provider: "asaas",
    action: "pix.create",
    eventId: "evt_123",
    externalEventId: "ext_123",
    credentials: {
      provider: "asaas",
      tenantId: "tenant_123",
      secrets: {},
    },
    payload: {},
    ...overrides,
  };
}

void test("buildIdempotencyKey and ensureNotDuplicate store the first event", async () => {
  const seen = new Set<string>();
  const store: IdempotencyStore = {
    async has(key) {
      return seen.has(key);
    },
    async put(key) {
      seen.add(key);
    },
  };

  const ctx = createContext({ idempotencyStore: store });
  const expectedKey = "tenant_123:asaas:pix.create:ext_123";

  assert.equal(buildIdempotencyKey(ctx), expectedKey);

  await ensureNotDuplicate(ctx);
  assert.equal(seen.has(expectedKey), true);
});

void test("ensureNotDuplicate rejects duplicated external events", async () => {
  const key = "tenant_123:asaas:pix.create:ext_123";
  const store: IdempotencyStore = {
    async has(candidate) {
      return candidate === key;
    },
    async put() {},
  };

  const ctx = createContext({ idempotencyStore: store });

  await assert.rejects(
    ensureNotDuplicate(ctx),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "DUPLICATE_EVENT",
  );
});

void test("ensureNotDuplicate prefers atomic idempotency claims with TTL", async () => {
  const calls: Array<{
    key: string;
    options?: { ttlSeconds?: number };
    value?: Record<string, unknown>;
  }> = [];
  const store: IdempotencyStore = {
    async claim(key, value, options) {
      calls.push({ key, options, value });
      return true;
    },
    async has() {
      throw new Error("has should not be called when claim is available");
    },
    async put() {
      throw new Error("put should not be called when claim is available");
    },
  };

  await ensureNotDuplicate(createContext({ idempotencyStore: store }));

  assert.deepEqual(calls, [
    {
      key: "tenant_123:asaas:pix.create:ext_123",
      options: { ttlSeconds: DEFAULT_IDEMPOTENCY_TTL_SECONDS },
      value: {
        eventId: "evt_123",
        externalEventId: "ext_123",
      },
    },
  ]);
});

void test("runWithLogging logs successful executions", async () => {
  const entries: ExecutionLogEntry[] = [];
  const ctx = createContext({
    executionLogger: {
      async log(entry) {
        entries.push(entry);
      },
    },
  });

  const result = await runWithLogging(ctx, async () => ({
    created: true,
    result: { id: "pay_123" },
  }));

  assert.equal(result.ok, true);
  assert.equal(result.status, "success");
  assert.deepEqual(result.result, {
    created: true,
    result: { id: "pay_123" },
  });
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.status, "success");
});

void test("runWithLogging turns duplicate errors into duplicate results", async () => {
  const entries: ExecutionLogEntry[] = [];
  const ctx = createContext({
    executionLogger: {
      async log(entry) {
        entries.push(entry);
      },
    },
  });

  const result = await runWithLogging(ctx, async () => {
    throw new ConnectorExecutionError(
      "DUPLICATE_EVENT",
      "Already processed",
      false,
    );
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, "duplicate");
  assert.deepEqual(result.result, { duplicate: true });
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.status, "duplicate");
});
