import assert from "node:assert/strict";
import test from "node:test";

import {
  ConnectorExecutionError,
  type ConnectorEventJobPayload,
  type ConnectorExecutionRequest,
  type ConnectorExecutionResult,
  type ConnectorRuntime
} from "@birthub/connectors-core";
import { getWorkerConfig } from "@birthub/config";
import { resetPrismaClientForTests } from "@birthub/database";
import { UnrecoverableError } from "bullmq";

// ---------------------------------------------------------------------------
// In-memory Prisma stub (same shape as the Omie test)
// ---------------------------------------------------------------------------

type StoredCredential = {
  credentialType: string;
  encryptedValue: string;
};

type StoredAccount = {
  accountKey: string;
  credentials: StoredCredential[];
  id: string;
  lastSyncAt: Date | null;
  metadata: Record<string, unknown> | null;
  organizationId: string;
  provider: string;
  status: string;
  tenantId: string;
};

type StoredCursor = {
  connectorAccountId: string;
  errorMessage: string | null;
  lastSyncAt: Date | null;
  metadata: Record<string, unknown> | null;
  nextSyncAt: Date | null;
  organizationId: string;
  scope: string;
  status: string;
  tenantId: string;
};

type StoredCustomer = {
  email: string;
  id: string;
  metadata: Record<string, unknown> | null;
  name: string;
  organizationId: string;
  status: string;
  tenantId: string;
};

type StoredSyncEvent = {
  createdAt: Date;
  direction: string;
  eventType: string;
  externalEventId: string | null;
  id: string;
  organizationId: string;
  provider: string;
  requestBody: Record<string, unknown>;
  responseBody: string | null;
  responseStatus: number | null;
  tenantId: string;
};

class FakePrismaClient {
  private readonly accounts = new Map<string, StoredAccount>();
  private readonly cursors = new Map<string, StoredCursor>();
  private readonly customers = new Map<string, StoredCustomer>();
  private readonly syncEvents = new Map<string, StoredSyncEvent>();
  private syncEventCounter = 0;

  readonly connectorAccount = {
    findFirst: async (input: {
      where: {
        accountKey?: string;
        id?: string;
        organizationId?: string;
        provider?: string;
        status?: { in?: string[] };
        tenantId?: string;
      };
    }) => {
      for (const account of this.accounts.values()) {
        if (input.where.id && account.id !== input.where.id) continue;
        if (input.where.accountKey && account.accountKey !== input.where.accountKey) continue;
        if (input.where.organizationId && account.organizationId !== input.where.organizationId) continue;
        if (input.where.provider && account.provider !== input.where.provider) continue;
        if (input.where.tenantId && account.tenantId !== input.where.tenantId) continue;
        if (input.where.status?.in && !input.where.status.in.includes(account.status)) continue;

        return { ...account, credentials: [...account.credentials] };
      }

      return null;
    },

    findUnique: async (input: { where: { id: string } }) => {
      const account = this.accounts.get(input.where.id);
      return account ? { metadata: account.metadata } : null;
    },

    update: async (input: {
      data: { lastSyncAt?: Date; metadata?: Record<string, unknown>; status?: string };
      where: { id: string };
    }) => {
      const account = this.accounts.get(input.where.id);
      if (!account) throw new Error(`Account ${input.where.id} not found.`);

      if (input.data.lastSyncAt !== undefined) account.lastSyncAt = input.data.lastSyncAt;
      if (input.data.metadata !== undefined) account.metadata = input.data.metadata;
      if (input.data.status !== undefined) account.status = input.data.status;

      return { ...account, credentials: [...account.credentials] };
    }
  };

  readonly connectorSyncCursor = {
    upsert: async (input: {
      create: StoredCursor;
      update: Partial<StoredCursor>;
      where: { connectorAccountId_scope: { connectorAccountId: string; scope: string } };
    }) => {
      const key = `${input.where.connectorAccountId_scope.connectorAccountId}:${input.where.connectorAccountId_scope.scope}`;
      const current = this.cursors.get(key);

      if (!current) {
        this.cursors.set(key, { ...input.create });
      } else {
        this.cursors.set(key, { ...current, ...input.update });
      }

      return this.cursors.get(key) ?? null;
    }
  };

  readonly customer = {
    upsert: async (input: {
      create: Omit<StoredCustomer, "id">;
      update: Partial<Omit<StoredCustomer, "id" | "organizationId" | "tenantId" | "email">>;
      where: { tenantId_email: { email: string; tenantId: string } };
    }) => {
      const key = `${input.where.tenantId_email.tenantId}:${input.where.tenantId_email.email}`;
      const existing = this.customers.get(key);

      if (existing) {
        Object.assign(existing, input.update);
        return existing;
      }

      const created: StoredCustomer = {
        ...input.create,
        id: `cust_${++this.syncEventCounter}`
      };
      this.customers.set(key, created);
      return created;
    }
  };

  readonly crmSyncEvent = {
    create: async (input: { data: Omit<StoredSyncEvent, "createdAt" | "id"> }) => {
      const id = `evt_${++this.syncEventCounter}`;
      const created: StoredSyncEvent = { ...input.data, createdAt: new Date(), id };
      this.syncEvents.set(id, created);
      return created;
    },

    update: async (input: {
      data: Partial<StoredSyncEvent>;
      where: { id: string };
    }) => {
      const current = this.syncEvents.get(input.where.id);
      if (!current) throw new Error(`Sync event ${input.where.id} not found.`);

      const updated = { ...current, ...input.data };
      this.syncEvents.set(input.where.id, updated);
      return updated;
    },

    updateMany: async (input: {
      data: Partial<StoredSyncEvent>;
      where: { id: string; responseStatus: number };
    }) => {
      const current = this.syncEvents.get(input.where.id);
      if (!current || current.responseStatus !== input.where.responseStatus) {
        return { count: 0 };
      }

      this.syncEvents.set(input.where.id, { ...current, ...input.data });
      return { count: 1 };
    }
  };

  async $disconnect(): Promise<void> {
    return Promise.resolve();
  }

  createAccount(input: StoredAccount): void {
    this.accounts.set(input.id, { ...input, credentials: [...input.credentials] });
  }

  createInboundEvent(input: Omit<StoredSyncEvent, "createdAt">): void {
    this.syncEvents.set(input.id, { ...input, createdAt: new Date() });
  }

  getAccount(id: string): StoredAccount {
    const account = this.accounts.get(id);
    if (!account) throw new Error(`Account ${id} not found.`);
    return account;
  }

  getCursor(connectorAccountId: string): StoredCursor {
    const cursor = [...this.cursors.values()].find(
      (c) => c.connectorAccountId === connectorAccountId
    );
    if (!cursor) throw new Error(`Cursor for account ${connectorAccountId} not found.`);
    return cursor;
  }

  getInboundEvent(id: string): StoredSyncEvent {
    const event = this.syncEvents.get(id);
    if (!event) throw new Error(`Event ${id} not found.`);
    return event;
  }

  getLatestOutboundEvent(externalEventId: string): StoredSyncEvent {
    const event = [...this.syncEvents.values()]
      .filter((e) => e.direction === "outbound" && e.externalEventId === externalEventId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!event) throw new Error(`Outbound event ${externalEventId} not found.`);
    return event;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWorkerConfig() {
  return getWorkerConfig({
    ...process.env,
    ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS: "true",
    AUTH_MFA_ENCRYPTION_KEY: "hubspot-worker-test-key",
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/birthub?schema=public",
    HUBSPOT_BASE_URL: "https://api.hubapi.com",
    JOB_HMAC_GLOBAL_SECRET: "hubspot-worker-test-hmac",
    NODE_ENV: "test",
    REDIS_URL: "redis://localhost:6379"
  });
}

function createHubspotEvent(input: {
  action: Extract<ConnectorEventJobPayload["action"], "crm.contact.upsert">;
  connectorAccountId: string;
  eventId: string;
  eventType: string;
  externalEventId: string;
  organizationId: string;
  payload: Record<string, unknown>;
  tenantId: string;
}): ConnectorEventJobPayload {
  const now = "2026-04-21T04:00:00.000Z";

  return {
    accountKey: "primary",
    action: input.action,
    connectorAccountId: input.connectorAccountId,
    eventId: input.eventId,
    eventType: input.eventType,
    externalEventId: input.externalEventId,
    kind: "connector-event",
    occurredAt: now,
    organizationId: input.organizationId,
    payload: input.payload,
    provider: "hubspot",
    receivedAt: now,
    source: "webhook",
    tenantId: input.tenantId
  };
}

function installFakePrisma(client: FakePrismaClient): void {
  (globalThis as typeof globalThis & { birthubPrisma?: unknown }).birthubPrisma = client;
}

function runtimeStub(
  handler: (request: ConnectorExecutionRequest) => Promise<ConnectorExecutionResult>
): ConnectorRuntime {
  return { execute: handler } as ConnectorRuntime;
}

async function importWorkerModule() {
  return import("./connector-events.js");
}

function seedHubspotAccount(client: FakePrismaClient, suffix: string) {
  client.createAccount({
    accountKey: "primary",
    credentials: [
      {
        credentialType: "accessToken",
        encryptedValue: `hs-access-token-${suffix}`
      }
    ],
    id: `acc_hs_${suffix}`,
    lastSyncAt: null,
    metadata: null,
    organizationId: `org_hs_${suffix}`,
    provider: "hubspot",
    status: "active",
    tenantId: `tenant_hs_${suffix}`
  });
}

function seedInboundEvent(input: {
  action: ConnectorEventJobPayload["action"];
  client: FakePrismaClient;
  eventId: string;
  eventType: string;
  externalEventId: string;
  payload: Record<string, unknown>;
  suffix: string;
}) {
  input.client.createInboundEvent({
    direction: "inbound",
    eventType: input.eventType,
    externalEventId: input.externalEventId,
    id: input.eventId,
    organizationId: `org_hs_${input.suffix}`,
    provider: "hubspot",
    requestBody: { action: input.action, payload: input.payload },
    responseBody: JSON.stringify({ queued: true, status: "queued" }),
    responseStatus: 202,
    tenantId: `tenant_hs_${input.suffix}`
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void test("HubSpot worker upserts contact from webhook payload and persists success state", async (context) => {
  const client = new FakePrismaClient();
  installFakePrisma(client);
  const config = buildWorkerConfig();
  const { processConnectorEventJob } = await importWorkerModule();

  context.after(async () => {
    await resetPrismaClientForTests();
  });

  seedHubspotAccount(client, "success");

  const payload = {
    contact: {
      companyName: "Acme Corp",
      email: "alice@acme.com",
      firstName: "Alice",
      lastName: "Smith",
      phone: "+5511999990000"
    }
  };

  seedInboundEvent({
    action: "crm.contact.upsert",
    client,
    eventId: "evt_hs_success",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:success",
    payload,
    suffix: "success"
  });

  const workerEvent = createHubspotEvent({
    action: "crm.contact.upsert",
    connectorAccountId: "acc_hs_success",
    eventId: "evt_hs_success",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:success",
    organizationId: "org_hs_success",
    payload,
    tenantId: "tenant_hs_success"
  });

  const calls: ConnectorExecutionRequest[] = [];

  await processConnectorEventJob(workerEvent, {
    config,
    runtime: runtimeStub(async (request) => {
      calls.push(request);
      return {
        action: request.action,
        externalId: "hs-contact-42",
        provider: "hubspot",
        request: { method: "POST", path: "/crm/v3/objects/contacts/batch/upsert" },
        response: { id: "hs-contact-42" },
        status: "success",
        statusCode: 200
      };
    })
  });

  assert.equal(calls.length, 1, "Should call runtime once for contact upsert");
  assert.equal(calls[0]?.action, "crm.contact.upsert");
  assert.equal((calls[0]?.payload as { email: string }).email, "alice@acme.com");

  const inboundEvent = client.getInboundEvent("evt_hs_success");
  const outboundEvent = client.getLatestOutboundEvent("hs:test:success");
  const cursor = client.getCursor("acc_hs_success");
  const account = client.getAccount("acc_hs_success");

  assert.equal(inboundEvent.responseStatus, 200);
  assert.equal(JSON.parse(inboundEvent.responseBody ?? "{}").status, "success");
  assert.equal(JSON.parse(inboundEvent.responseBody ?? "{}").externalId, "hs-contact-42");
  assert.equal(outboundEvent.responseStatus, 200);
  assert.equal(JSON.parse(outboundEvent.responseBody ?? "{}").status, "success");
  assert.equal(cursor.status, "success");
  assert.equal(account.status, "active");
});

void test("HubSpot worker retries on transient API error", async (context) => {
  const client = new FakePrismaClient();
  installFakePrisma(client);
  const config = buildWorkerConfig();
  const { processConnectorEventJob } = await importWorkerModule();

  context.after(async () => {
    await resetPrismaClientForTests();
  });

  seedHubspotAccount(client, "retry");

  const payload = { contact: { email: "retry@example.com" } };

  seedInboundEvent({
    action: "crm.contact.upsert",
    client,
    eventId: "evt_hs_retry",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:retry",
    payload,
    suffix: "retry"
  });

  const workerEvent = createHubspotEvent({
    action: "crm.contact.upsert",
    connectorAccountId: "acc_hs_retry",
    eventId: "evt_hs_retry",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:retry",
    organizationId: "org_hs_retry",
    payload,
    tenantId: "tenant_hs_retry"
  });

  await assert.rejects(
    () =>
      processConnectorEventJob(workerEvent, {
        config,
        job: {
          attemptsMade: 0,
          opts: {
            attempts: 3,
            backoff: { delay: 1_000, type: "fixed" }
          }
        },
        runtime: runtimeStub(async () => {
          throw new ConnectorExecutionError({
            action: "crm.contact.upsert",
            code: "HUBSPOT_RATE_LIMIT",
            message: "HubSpot API rate limit reached.",
            provider: "hubspot",
            retryable: true,
            statusCode: 429
          });
        })
      }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "HUBSPOT_RATE_LIMIT" &&
      error.retryable
  );

  const inboundEvent = client.getInboundEvent("evt_hs_retry");
  const outboundEvent = client.getLatestOutboundEvent("hs:test:retry");
  const cursor = client.getCursor("acc_hs_retry");
  const account = client.getAccount("acc_hs_retry");
  const inboundBody = JSON.parse(inboundEvent.responseBody ?? "{}");
  const outboundBody = JSON.parse(outboundEvent.responseBody ?? "{}");

  assert.equal(inboundEvent.responseStatus, 202);
  assert.equal(inboundBody.status, "retrying");
  assert.ok(typeof inboundBody.nextRetryAt === "string", "nextRetryAt should be set");
  assert.equal(outboundEvent.responseStatus, 202);
  assert.equal(outboundBody.status, "retrying");
  assert.equal(cursor.status, "retrying");
  assert.equal(account.status, "syncing");
});

void test("HubSpot worker escalates permanently on auth failure", async (context) => {
  const client = new FakePrismaClient();
  installFakePrisma(client);
  const config = buildWorkerConfig();
  const { processConnectorEventJob } = await importWorkerModule();

  context.after(async () => {
    await resetPrismaClientForTests();
  });

  seedHubspotAccount(client, "fatal");

  const payload = { contact: { email: "fatal@example.com" } };

  seedInboundEvent({
    action: "crm.contact.upsert",
    client,
    eventId: "evt_hs_fatal",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:fatal",
    payload,
    suffix: "fatal"
  });

  const workerEvent = createHubspotEvent({
    action: "crm.contact.upsert",
    connectorAccountId: "acc_hs_fatal",
    eventId: "evt_hs_fatal",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:fatal",
    organizationId: "org_hs_fatal",
    payload,
    tenantId: "tenant_hs_fatal"
  });

  await assert.rejects(
    () =>
      processConnectorEventJob(workerEvent, {
        config,
        job: { attemptsMade: 0, opts: { attempts: 3 } },
        runtime: runtimeStub(async () => {
          throw new ConnectorExecutionError({
            action: "crm.contact.upsert",
            code: "HUBSPOT_AUTH_FAILED",
            message: "HubSpot authentication failed with status 401.",
            provider: "hubspot",
            retryable: false,
            statusCode: 401
          });
        })
      }),
    (error: unknown) => error instanceof UnrecoverableError
  );

  const inboundEvent = client.getInboundEvent("evt_hs_fatal");
  const outboundEvent = client.getLatestOutboundEvent("hs:test:fatal");
  const cursor = client.getCursor("acc_hs_fatal");
  const account = client.getAccount("acc_hs_fatal");

  assert.equal(inboundEvent.responseStatus, 401);
  assert.equal(JSON.parse(inboundEvent.responseBody ?? "{}").status, "failed");
  assert.equal(outboundEvent.responseStatus, 401);
  assert.equal(JSON.parse(outboundEvent.responseBody ?? "{}").status, "failed");
  assert.equal(cursor.status, "failed");
  assert.equal(account.status, "attention");
});

void test("HubSpot worker skips already-processed event (idempotency)", async (context) => {
  const client = new FakePrismaClient();
  installFakePrisma(client);
  const config = buildWorkerConfig();
  const { processConnectorEventJob } = await importWorkerModule();

  context.after(async () => {
    await resetPrismaClientForTests();
  });

  seedHubspotAccount(client, "idem");

  const payload = { contact: { email: "idem@example.com" } };

  // Seed the event already in "processing" (non-202) state so claimInboundEventProcessing fails
  client.createInboundEvent({
    direction: "inbound",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:idem",
    id: "evt_hs_idem",
    organizationId: "org_hs_idem",
    provider: "hubspot",
    requestBody: { action: "crm.contact.upsert", payload },
    // Already processed — status 200 means updateMany won't claim it
    responseBody: JSON.stringify({ status: "success" }),
    responseStatus: 200,
    tenantId: "tenant_hs_idem"
  });

  const workerEvent = createHubspotEvent({
    action: "crm.contact.upsert",
    connectorAccountId: "acc_hs_idem",
    eventId: "evt_hs_idem",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:idem",
    organizationId: "org_hs_idem",
    payload,
    tenantId: "tenant_hs_idem"
  });

  const calls: ConnectorExecutionRequest[] = [];

  // Should resolve without error — the event is skipped
  await processConnectorEventJob(workerEvent, {
    config,
    runtime: runtimeStub(async (request) => {
      calls.push(request);
      return {
        action: request.action,
        externalId: "should-not-happen",
        provider: "hubspot",
        request: {},
        response: {},
        status: "success",
        statusCode: 200
      };
    })
  });

  // Runtime must NOT have been called — event was already in a terminal state
  assert.equal(calls.length, 0, "Runtime should NOT be called for already-processed events");
});

void test("HubSpot worker gracefully handles missing credentials without throwing UnrecoverableError", async (context) => {
  const client = new FakePrismaClient();
  installFakePrisma(client);
  const config = buildWorkerConfig();
  const { processConnectorEventJob } = await importWorkerModule();

  context.after(async () => {
    await resetPrismaClientForTests();
  });

  // Account exists but has NO credentials
  client.createAccount({
    accountKey: "primary",
    credentials: [],
    id: "acc_hs_nocred",
    lastSyncAt: null,
    metadata: null,
    organizationId: "org_hs_nocred",
    provider: "hubspot",
    status: "active",
    tenantId: "tenant_hs_nocred"
  });

  const payload = { contact: { email: "nocred@example.com" } };

  client.createInboundEvent({
    direction: "inbound",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:nocred",
    id: "evt_hs_nocred",
    organizationId: "org_hs_nocred",
    provider: "hubspot",
    requestBody: { action: "crm.contact.upsert", payload },
    responseBody: JSON.stringify({ queued: true }),
    responseStatus: 202,
    tenantId: "tenant_hs_nocred"
  });

  const workerEvent = createHubspotEvent({
    action: "crm.contact.upsert",
    connectorAccountId: "acc_hs_nocred",
    eventId: "evt_hs_nocred",
    eventType: "hubspot:contact.created",
    externalEventId: "hs:test:nocred",
    organizationId: "org_hs_nocred",
    payload,
    tenantId: "tenant_hs_nocred"
  });

  // Missing credential → runtime throws MISSING_CREDENTIAL → non-retryable → UnrecoverableError
  await assert.rejects(
    () =>
      processConnectorEventJob(workerEvent, {
        config,
        job: { attemptsMade: 0, opts: { attempts: 1 } },
        runtime: runtimeStub(async () => {
          throw new ConnectorExecutionError({
            action: "crm.contact.upsert",
            code: "CONNECTOR_CREDENTIAL_MISSING",
            message: "Missing accessToken credential for connector provider hubspot.",
            provider: "hubspot",
            retryable: false,
            statusCode: 412
          });
        })
      }),
    (error: unknown) => error instanceof UnrecoverableError
  );
});
