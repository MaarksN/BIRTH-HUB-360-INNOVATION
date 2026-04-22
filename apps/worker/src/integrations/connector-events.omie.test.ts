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
  private readonly syncEvents = new Map<string, StoredSyncEvent>();
  private syncEventCounter = 0;

  readonly connectorAccount = {
    findFirst: async (input: {
      where: {
        accountKey?: string;
        id?: string;
        organizationId?: string;
        provider?: string;
        status?: {
          in?: string[];
        };
        tenantId?: string;
      };
    }) => {
      for (const account of this.accounts.values()) {
        if (input.where.id && account.id !== input.where.id) {
          continue;
        }

        if (input.where.accountKey && account.accountKey !== input.where.accountKey) {
          continue;
        }

        if (input.where.organizationId && account.organizationId !== input.where.organizationId) {
          continue;
        }

        if (input.where.provider && account.provider !== input.where.provider) {
          continue;
        }

        if (input.where.tenantId && account.tenantId !== input.where.tenantId) {
          continue;
        }

        if (input.where.status?.in && !input.where.status.in.includes(account.status)) {
          continue;
        }

        return {
          ...account,
          credentials: [...account.credentials]
        };
      }

      return null;
    },
    findUnique: async (input: {
      where: {
        id: string;
      };
    }) => {
      const account = this.accounts.get(input.where.id);

      return account
        ? {
            metadata: account.metadata
          }
        : null;
    },
    update: async (input: {
      data: {
        lastSyncAt?: Date;
        metadata?: Record<string, unknown>;
        status?: string;
      };
      where: {
        id: string;
      };
    }) => {
      const account = this.accounts.get(input.where.id);
      if (!account) {
        throw new Error(`Account ${input.where.id} not found.`);
      }

      if (input.data.lastSyncAt !== undefined) {
        account.lastSyncAt = input.data.lastSyncAt;
      }

      if (input.data.metadata !== undefined) {
        account.metadata = input.data.metadata;
      }

      if (input.data.status !== undefined) {
        account.status = input.data.status;
      }

      return {
        ...account,
        credentials: [...account.credentials]
      };
    }
  };

  readonly connectorSyncCursor = {
    upsert: async (input: {
      create: StoredCursor;
      update: Partial<StoredCursor>;
      where: {
        connectorAccountId_scope: {
          connectorAccountId: string;
          scope: string;
        };
      };
    }) => {
      const key = `${input.where.connectorAccountId_scope.connectorAccountId}:${input.where.connectorAccountId_scope.scope}`;
      const current = this.cursors.get(key);

      if (!current) {
        this.cursors.set(key, {
          ...input.create
        });
      } else {
        this.cursors.set(key, {
          ...current,
          ...input.update
        });
      }

      return this.cursors.get(key) ?? null;
    }
  };

  readonly crmSyncEvent = {
    create: async (input: {
      data: Omit<StoredSyncEvent, "createdAt" | "id">;
    }) => {
      const id = `evt_${++this.syncEventCounter}`;
      const created: StoredSyncEvent = {
        ...input.data,
        createdAt: new Date(),
        id
      };
      this.syncEvents.set(id, created);
      return created;
    },
    update: async (input: {
      data: Partial<StoredSyncEvent>;
      where: {
        id: string;
      };
    }) => {
      const current = this.syncEvents.get(input.where.id);
      if (!current) {
        throw new Error(`Sync event ${input.where.id} not found.`);
      }

      const updated = {
        ...current,
        ...input.data
      };
      this.syncEvents.set(input.where.id, updated);
      return updated;
    },
    updateMany: async (input: {
      data: Partial<StoredSyncEvent>;
      where: {
        id: string;
        responseStatus: number;
      };
    }) => {
      const current = this.syncEvents.get(input.where.id);
      if (!current || current.responseStatus !== input.where.responseStatus) {
        return {
          count: 0
        };
      }

      this.syncEvents.set(input.where.id, {
        ...current,
        ...input.data
      });

      return {
        count: 1
      };
    }
  };

  async $disconnect(): Promise<void> {
    return Promise.resolve();
  }

  createAccount(input: StoredAccount): void {
    this.accounts.set(input.id, {
      ...input,
      credentials: [...input.credentials]
    });
  }

  createInboundEvent(input: Omit<StoredSyncEvent, "createdAt">): void {
    this.syncEvents.set(input.id, {
      ...input,
      createdAt: new Date()
    });
  }

  getAccount(id: string): StoredAccount {
    const account = this.accounts.get(id);
    if (!account) {
      throw new Error(`Account ${id} not found.`);
    }

    return account;
  }

  getCursor(connectorAccountId: string): StoredCursor {
    const cursor = [...this.cursors.values()].find(
      (candidate) => candidate.connectorAccountId === connectorAccountId
    );
    if (!cursor) {
      throw new Error(`Cursor for account ${connectorAccountId} not found.`);
    }

    return cursor;
  }

  getInboundEvent(id: string): StoredSyncEvent {
    const event = this.syncEvents.get(id);
    if (!event) {
      throw new Error(`Event ${id} not found.`);
    }

    return event;
  }

  getLatestOutboundEvent(externalEventId: string): StoredSyncEvent {
    const event = [...this.syncEvents.values()]
      .filter(
        (candidate) =>
          candidate.direction === "outbound" && candidate.externalEventId === externalEventId
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

    if (!event) {
      throw new Error(`Outbound event ${externalEventId} not found.`);
    }

    return event;
  }
}

function buildWorkerConfig() {
  return getWorkerConfig({
    ...process.env,
    ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS: "true",
    AUTH_MFA_ENCRYPTION_KEY: "omie-worker-test-key",
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/birthub?schema=public",
    JOB_HMAC_GLOBAL_SECRET: "omie-worker-test-hmac",
    NODE_ENV: "test",
    REDIS_URL: "redis://localhost:6379"
  });
}

function createOmieEvent(input: {
  action: Extract<ConnectorEventJobPayload["action"], "erp.customer.upsert" | "erp.sales-order.create">;
  connectorAccountId: string;
  eventId: string;
  eventType: string;
  externalEventId: string;
  organizationId: string;
  payload: Record<string, unknown>;
  tenantId: string;
}): ConnectorEventJobPayload {
  const now = "2026-04-20T15:00:00.000Z";

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
    provider: "omie",
    receivedAt: now,
    source: "sync",
    tenantId: input.tenantId
  };
}

function installFakePrisma(client: FakePrismaClient): void {
  (
    globalThis as typeof globalThis & {
      birthubPrisma?: unknown;
    }
  ).birthubPrisma = client;
}

function runtimeStub(
  handler: (request: ConnectorExecutionRequest) => Promise<ConnectorExecutionResult>
): ConnectorRuntime {
  return {
    execute: handler
  } as ConnectorRuntime;
}

async function importWorkerModule() {
  return import("./connector-events.js");
}

function seedOmieAccount(client: FakePrismaClient, suffix: string) {
  client.createAccount({
    accountKey: "primary",
    credentials: [
      {
        credentialType: "appKey",
        encryptedValue: `app-key-${suffix}`
      },
      {
        credentialType: "appSecret",
        encryptedValue: `app-secret-${suffix}`
      }
    ],
    id: `acc_${suffix}`,
    lastSyncAt: null,
    metadata: null,
    organizationId: `org_${suffix}`,
    provider: "omie",
    status: "active",
    tenantId: `tenant_${suffix}`
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
    organizationId: `org_${input.suffix}`,
    provider: "omie",
    requestBody: {
      action: input.action,
      payload: input.payload
    },
    responseBody: JSON.stringify({
      queued: true,
      status: "queued"
    }),
    responseStatus: 202,
    tenantId: `tenant_${input.suffix}`
  });
}

void test("Omie worker simulates customer creation and persists success state", async (context) => {
  const client = new FakePrismaClient();
  installFakePrisma(client);
  const config = buildWorkerConfig();
  const { processConnectorEventJob } = await importWorkerModule();

  context.after(async () => {
    await resetPrismaClientForTests();
  });

  seedOmieAccount(client, "success");
  const payload = {
    customer: {
      legalName: "Acme LTDA",
      taxId: "12345678000199"
    },
    salesOrder: {
      integrationCode: "order-success-001",
      items: [
        {
          productCode: 456,
          unitPrice: 19.9
        }
      ],
      taxScenarioCode: 789
    }
  };
  seedInboundEvent({
    action: "erp.customer.upsert",
    client,
    eventId: "evt_success_inbound",
    eventType: "omie:customer.order.sync",
    externalEventId: "omie:test:success",
    payload,
    suffix: "success"
  });
  const workerEvent = createOmieEvent({
    action: "erp.customer.upsert",
    connectorAccountId: "acc_success",
    eventId: "evt_success_inbound",
    eventType: "omie:customer.order.sync",
    externalEventId: "omie:test:success",
    organizationId: "org_success",
    payload,
    tenantId: "tenant_success"
  });
  const calls: ConnectorExecutionRequest[] = [];

  await processConnectorEventJob(workerEvent, {
    config,
    runtime: runtimeStub(async (request) => {
      calls.push(request);

      if (request.action === "erp.customer.upsert") {
        return {
          action: request.action,
          externalId: "987",
          provider: "omie",
          request: {
            call: "UpsertClienteCpfCnpj"
          },
          response: {
            codigo_cliente_omie: 987
          },
          status: "success",
          statusCode: 200
        };
      }

      return {
        action: request.action,
        externalId: "654",
        provider: "omie",
        request: {
          call: "AdicionarPedido"
        },
        response: {
          codigo_pedido: 654
        },
        status: "success",
        statusCode: 200
      };
    })
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.action, "erp.customer.upsert");
  assert.equal(calls[1]?.action, "erp.sales-order.create");
  assert.equal(
    (calls[1]?.payload as { customerCode?: number }).customerCode,
    987
  );
  assert.equal(
    (calls[1]?.payload as { items: Array<{ integrationCode: string }> }).items[0]?.integrationCode,
    "order-success-001:1"
  );

  const inboundEvent = client.getInboundEvent("evt_success_inbound");
  const outboundEvent = client.getLatestOutboundEvent("omie:test:success");
  const cursor = client.getCursor("acc_success");
  const account = client.getAccount("acc_success");

  assert.equal(inboundEvent.responseStatus, 200);
  assert.equal(JSON.parse(inboundEvent.responseBody ?? "{}").status, "success");
  assert.equal(JSON.parse(inboundEvent.responseBody ?? "{}").externalId, "654");
  assert.equal(outboundEvent.responseStatus, 200);
  assert.equal(JSON.parse(outboundEvent.responseBody ?? "{}").status, "success");
  assert.equal(cursor.status, "success");
  assert.equal(account.status, "active");
});

void test("Omie worker simulates API timeout and marks the event for retry", async (context) => {
  const client = new FakePrismaClient();
  installFakePrisma(client);
  const config = buildWorkerConfig();
  const { processConnectorEventJob } = await importWorkerModule();

  context.after(async () => {
    await resetPrismaClientForTests();
  });

  seedOmieAccount(client, "retry");
  const payload = {
    customer: {
      externalCode: "customer-retry-001",
      legalName: "Retry Customer"
    }
  };
  seedInboundEvent({
    action: "erp.customer.upsert",
    client,
    eventId: "evt_retry_inbound",
    eventType: "omie:customer.sync",
    externalEventId: "omie:test:retry",
    payload,
    suffix: "retry"
  });
  const workerEvent = createOmieEvent({
    action: "erp.customer.upsert",
    connectorAccountId: "acc_retry",
    eventId: "evt_retry_inbound",
    eventType: "omie:customer.sync",
    externalEventId: "omie:test:retry",
    organizationId: "org_retry",
    payload,
    tenantId: "tenant_retry"
  });

  await assert.rejects(
    () =>
      processConnectorEventJob(workerEvent, {
        config,
        job: {
          attemptsMade: 0,
          opts: {
            attempts: 2,
            backoff: {
              delay: 1_000,
              type: "fixed"
            }
          }
        },
        runtime: runtimeStub(async () => {
          throw new ConnectorExecutionError({
            action: "erp.customer.upsert",
            code: "OMIE_TIMEOUT",
            message: "Omie API request timed out.",
            provider: "omie",
            retryable: true,
            statusCode: 504
          });
        })
      }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "OMIE_TIMEOUT" &&
      error.retryable
  );

  const inboundEvent = client.getInboundEvent("evt_retry_inbound");
  const outboundEvent = client.getLatestOutboundEvent("omie:test:retry");
  const cursor = client.getCursor("acc_retry");
  const account = client.getAccount("acc_retry");
  const inboundBody = JSON.parse(inboundEvent.responseBody ?? "{}");
  const outboundBody = JSON.parse(outboundEvent.responseBody ?? "{}");

  assert.equal(inboundEvent.responseStatus, 202);
  assert.equal(inboundBody.status, "retrying");
  assert.ok(typeof inboundBody.nextRetryAt === "string");
  assert.equal(outboundEvent.responseStatus, 202);
  assert.equal(outboundBody.status, "retrying");
  assert.equal(cursor.status, "retrying");
  assert.equal(account.status, "syncing");
});

void test("Omie worker simulates fatal API error and stops retrying", async (context) => {
  const client = new FakePrismaClient();
  installFakePrisma(client);
  const config = buildWorkerConfig();
  const { processConnectorEventJob } = await importWorkerModule();

  context.after(async () => {
    await resetPrismaClientForTests();
  });

  seedOmieAccount(client, "fatal");
  const payload = {
    customer: {
      externalCode: "customer-fatal-001",
      legalName: "Fatal Customer"
    }
  };
  seedInboundEvent({
    action: "erp.customer.upsert",
    client,
    eventId: "evt_fatal_inbound",
    eventType: "omie:customer.sync",
    externalEventId: "omie:test:fatal",
    payload,
    suffix: "fatal"
  });
  const workerEvent = createOmieEvent({
    action: "erp.customer.upsert",
    connectorAccountId: "acc_fatal",
    eventId: "evt_fatal_inbound",
    eventType: "omie:customer.sync",
    externalEventId: "omie:test:fatal",
    organizationId: "org_fatal",
    payload,
    tenantId: "tenant_fatal"
  });

  await assert.rejects(
    () =>
      processConnectorEventJob(workerEvent, {
        config,
        job: {
          attemptsMade: 0,
          opts: {
            attempts: 3
          }
        },
        runtime: runtimeStub(async () => {
          throw new ConnectorExecutionError({
            action: "erp.customer.upsert",
            code: "OMIE_AUTH_FAILED",
            message: "Omie authentication failed.",
            provider: "omie",
            retryable: false,
            statusCode: 401
          });
        })
      }),
    (error: unknown) => error instanceof UnrecoverableError
  );

  const inboundEvent = client.getInboundEvent("evt_fatal_inbound");
  const outboundEvent = client.getLatestOutboundEvent("omie:test:fatal");
  const cursor = client.getCursor("acc_fatal");
  const account = client.getAccount("acc_fatal");

  assert.equal(inboundEvent.responseStatus, 401);
  assert.equal(JSON.parse(inboundEvent.responseBody ?? "{}").status, "failed");
  assert.equal(outboundEvent.responseStatus, 401);
  assert.equal(JSON.parse(outboundEvent.responseBody ?? "{}").status, "failed");
  assert.equal(cursor.status, "failed");
  assert.equal(account.status, "attention");
});
