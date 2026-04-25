import assert from "node:assert/strict";
import test from "node:test";

import { ProblemDetailsError } from "../src/lib/problem-details.js";
import { buildOmieSyncJob } from "../src/modules/connectors/omie-sync.js";

void test("buildOmieSyncJob creates a stable worker payload for customer and sales order sync", () => {
  const job = buildOmieSyncJob({
    accountKey: "primary",
    connectorAccountId: "conn_omie_1",
    cursor: {
      customer: {
        externalCode: "customer-001",
        legalName: "Acme LTDA"
      },
      salesOrder: {
        integrationCode: "order-001",
        items: [
          {
            productCode: 456,
            quantity: 1,
            taxScenarioItemCode: 789,
            unitPrice: 19.9
          }
        ],
        taxScenarioCode: 321
      }
    },
    now: new Date("2026-04-20T12:00:00.000Z"),
    organizationId: "org_1",
    tenantId: "tenant_1"
  });

  assert.equal(job.provider, "omie");
  assert.equal(job.action, "erp.customer.upsert");
  assert.equal(job.eventType, "omie:customer.order.sync");
  assert.equal(job.externalEventId, "omie:erp.customer.upsert:customer-001:order-001");
  assert.equal(job.source, "sync");
  assert.equal(job.receivedAt, "2026-04-20T12:00:00.000Z");
});

void test("buildOmieSyncJob rejects empty Omie sync payloads", () => {
  assert.throws(
    () =>
      buildOmieSyncJob({
        cursor: {},
        organizationId: "org_1",
        tenantId: "tenant_1"
      }),
    (error: unknown) =>
      error instanceof ProblemDetailsError &&
      error.status === 400 &&
      error.title === "Invalid Connector Sync"
  );
});
