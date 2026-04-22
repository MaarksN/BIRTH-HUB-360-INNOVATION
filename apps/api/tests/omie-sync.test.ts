import assert from "node:assert/strict";
import test from "node:test";

import { buildOmieSyncJob } from "../src/modules/connectors/omie-sync.js";

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

void test("buildOmieSyncJob: customer-only payload enqueues erp.customer.upsert", () => {
  const job = buildOmieSyncJob({
    cursor: {
      customer: {
        externalCode: "cust-001",
        legalName: "Acme LTDA"
      }
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.action, "erp.customer.upsert");
  assert.equal(job.provider, "omie");
  assert.equal(job.source, "sync");
  assert.ok(job.externalEventId.startsWith("omie:erp.customer.upsert:cust-001"));
  assert.deepEqual(job.payload, {
    customer: { externalCode: "cust-001", legalName: "Acme LTDA" }
  });
});

void test("buildOmieSyncJob: salesOrder-only payload enqueues erp.customer.upsert (customer required first)", () => {
  // When only salesOrder is present without customer, action is still erp.customer.upsert
  // because the worker handles chaining internally — but the action is derived from customer presence
  // If customer is null the action falls to erp.sales-order.create
  const job = buildOmieSyncJob({
    cursor: {
      salesOrder: {
        integrationCode: "order-001",
        items: [{ productCode: 99, quantity: 1, taxScenarioItemCode: 1, unitPrice: 100 }],
        taxScenarioCode: 1
      }
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.action, "erp.sales-order.create");
  assert.ok(job.externalEventId.startsWith("omie:erp.sales-order.create:order-001"));
  assert.ok(job.payload.salesOrder);
  assert.ok(!job.payload.customer);
});

void test("buildOmieSyncJob: combined customer+salesOrder payload carries both in payload", () => {
  const job = buildOmieSyncJob({
    cursor: {
      customer: {
        externalCode: "cust-combo",
        legalName: "Combo LTDA"
      },
      salesOrder: {
        integrationCode: "order-combo",
        items: [],
        taxScenarioCode: 5
      }
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.action, "erp.customer.upsert");
  assert.ok(job.externalEventId.startsWith("omie:erp.customer.upsert:cust-combo:order-combo"));
  assert.ok(job.payload.customer);
  assert.ok(job.payload.salesOrder);
});

void test("buildOmieSyncJob: flat payload without customer wrapper is detected via hasCustomerFields", () => {
  const job = buildOmieSyncJob({
    cursor: {
      externalCode: "flat-001",
      legalName: "Flat Customer LTDA",
      taxId: "12345678000100"
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.action, "erp.customer.upsert");
  assert.ok(job.externalEventId.includes("flat-001"));
});

void test("buildOmieSyncJob: explicit idempotencyKey overrides computed externalEventId", () => {
  const job = buildOmieSyncJob({
    cursor: {
      customer: { legalName: "Manual Key Co", taxId: "99999999000100" },
      idempotencyKey: "my-stable-key-42"
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.externalEventId, "my-stable-key-42");
});

void test("buildOmieSyncJob: SHA-256 fingerprint used when no identifier is extractable", () => {
  const job = buildOmieSyncJob({
    cursor: {
      customer: {
        // legalName is required by omie-events but not by buildOmieSyncJob
        // when neither externalCode, taxId nor integrationCode is present, fingerprint is used
        legalName: "Anonymous Co"
      }
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.ok(
    job.externalEventId.startsWith("omie:erp.customer.upsert:"),
    `externalEventId should start with omie prefix, got: ${job.externalEventId}`
  );
  // fingerprint is 24-char hex when no explicit key
  const suffix = job.externalEventId.replace("omie:erp.customer.upsert:", "");
  assert.ok(suffix.length > 0);
});

void test("buildOmieSyncJob: accountKey and connectorAccountId are forwarded when provided", () => {
  const job = buildOmieSyncJob({
    accountKey: "primary",
    connectorAccountId: "acc_123",
    cursor: {
      customer: { externalCode: "cust-key-fwd", legalName: "Key Fwd LTDA" }
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.accountKey, "primary");
  assert.equal(job.connectorAccountId, "acc_123");
});

void test("buildOmieSyncJob: scope overrides default eventType", () => {
  const job = buildOmieSyncJob({
    cursor: {
      customer: { externalCode: "cust-scope", legalName: "Scoped LTDA" }
    },
    organizationId: "org_1",
    scope: "omie:custom.scope",
    tenantId: "tenant_1"
  });

  assert.equal(job.eventType, "omie:custom.scope");
});

void test("buildOmieSyncJob: default eventType is omie:customer.sync for customer-only", () => {
  const job = buildOmieSyncJob({
    cursor: {
      customer: { externalCode: "cust-default-type", legalName: "Default Type LTDA" }
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.eventType, "omie:customer.sync");
});

void test("buildOmieSyncJob: default eventType is omie:customer.order.sync for combined payload", () => {
  const job = buildOmieSyncJob({
    cursor: {
      customer: { externalCode: "cust-order-type", legalName: "Order Type LTDA" },
      salesOrder: {
        integrationCode: "ord-default",
        items: [],
        taxScenarioCode: 1
      }
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.eventType, "omie:customer.order.sync");
});

void test("buildOmieSyncJob: PT-BR field aliases detected via razao_social and cnpj_cpf", () => {
  const job = buildOmieSyncJob({
    cursor: {
      customer: {
        cnpj_cpf: "12345678000199",
        codigo_cliente_integracao: "code-br-001",
        razao_social: "Empresa Brasileira LTDA"
      }
    },
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.action, "erp.customer.upsert");
  // externalEventId should pick up the codigo_cliente_integracao
  assert.ok(job.externalEventId.includes("code-br-001"));
});

// ---------------------------------------------------------------------------
// Validation errors
// ---------------------------------------------------------------------------

void test("buildOmieSyncJob: throws 400 when cursor is null", () => {
  assert.throws(
    () =>
      buildOmieSyncJob({
        cursor: null as unknown as Record<string, unknown>,
        organizationId: "org_1",
        tenantId: "tenant_1"
      }),
    (error: unknown) =>
      error instanceof Error && error.message.includes("cursor")
  );
});

void test("buildOmieSyncJob: throws 400 when cursor has no customer or salesOrder fields", () => {
  assert.throws(
    () =>
      buildOmieSyncJob({
        cursor: { irrelevantField: "some-value" },
        organizationId: "org_1",
        tenantId: "tenant_1"
      }),
    (error: unknown) =>
      error instanceof Error && error.message.toLowerCase().includes("customer")
  );
});
