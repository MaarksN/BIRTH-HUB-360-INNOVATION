import { createHash } from "node:crypto";

import type { ConnectorEventJobPayload } from "@birthub/connectors-core";

import { ProblemDetailsError } from "../../lib/problem-details.js";

type OmieSyncAction = Extract<
  ConnectorEventJobPayload["action"],
  "erp.customer.upsert" | "erp.sales-order.create"
>;

export type OmieSyncJob = Omit<
  ConnectorEventJobPayload<OmieSyncAction>,
  "eventId" | "kind"
>;

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function hasCustomerFields(value: Record<string, unknown>): boolean {
  return (
    !!readString(value.externalCode) ||
    !!readString(value.integrationCode) ||
    !!readString(value.codigo_cliente_integracao) ||
    !!readString(value.legalName) ||
    !!readString(value.razao_social) ||
    !!readString(value.taxId) ||
    !!readString(value.cnpj_cpf)
  );
}

function hasSalesOrderFields(value: Record<string, unknown>): boolean {
  return (
    Array.isArray(value.items) ||
    Array.isArray(value.itens) ||
    !!readString(value.integrationCode) ||
    !!readString(value.codigo_pedido_integracao)
  );
}

function buildExternalEventId(input: {
  action: OmieSyncAction;
  customer: Record<string, unknown> | null;
  payload: Record<string, unknown>;
  salesOrder: Record<string, unknown> | null;
}): string {
  const explicit = readString(input.payload.idempotencyKey);
  if (explicit) {
    return explicit;
  }

  const customerKey =
    readString(input.customer?.externalCode) ??
    readString(input.customer?.integrationCode) ??
    readString(input.customer?.codigo_cliente_integracao) ??
    readString(input.customer?.taxId) ??
    readString(input.customer?.cnpj_cpf);
  const salesOrderKey =
    readString(input.salesOrder?.integrationCode) ??
    readString(input.salesOrder?.codigo_pedido_integracao);

  if (customerKey && salesOrderKey) {
    return `omie:${input.action}:${customerKey}:${salesOrderKey}`;
  }

  if (salesOrderKey) {
    return `omie:${input.action}:${salesOrderKey}`;
  }

  if (customerKey) {
    return `omie:${input.action}:${customerKey}`;
  }

  const fingerprint = createHash("sha256")
    .update(JSON.stringify(input.payload))
    .digest("hex")
    .slice(0, 24);

  return `omie:${input.action}:${fingerprint}`;
}

export function buildOmieSyncJob(input: {
  accountKey?: string | undefined;
  connectorAccountId?: string | undefined;
  cursor?: Record<string, unknown> | undefined;
  organizationId: string;
  scope?: string | undefined;
  tenantId: string;
  now?: Date | undefined;
}): OmieSyncJob {
  const payload = readObject(input.cursor);
  if (!payload) {
    throw new ProblemDetailsError({
      detail: "Omie sync requires a cursor payload with customer and/or salesOrder data.",
      status: 400,
      title: "Invalid Connector Sync"
    });
  }

  const customer =
    readObject(payload.customer) ??
    (hasCustomerFields(payload) ? payload : null);
  const salesOrder =
    readObject(payload.salesOrder) ??
    readObject(payload.order) ??
    readObject(payload.pedido) ??
    (hasSalesOrderFields(payload) ? payload : null);

  if (!customer && !salesOrder) {
    throw new ProblemDetailsError({
      detail: "Omie sync requires customer data or a salesOrder payload.",
      status: 400,
      title: "Invalid Connector Sync"
    });
  }

  const action: OmieSyncAction = customer ? "erp.customer.upsert" : "erp.sales-order.create";
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const payloadBody = {
    ...(customer ? { customer } : {}),
    ...(salesOrder ? { salesOrder } : {})
  };
  const objectId =
    readString(customer?.externalCode) ??
    readString(customer?.integrationCode) ??
    readString(customer?.codigo_cliente_integracao) ??
    readString(salesOrder?.integrationCode) ??
    readString(salesOrder?.codigo_pedido_integracao);

  return {
    ...(input.accountKey ? { accountKey: input.accountKey } : {}),
    action,
    ...(input.connectorAccountId ? { connectorAccountId: input.connectorAccountId } : {}),
    eventType: input.scope ?? (salesOrder ? "omie:customer.order.sync" : "omie:customer.sync"),
    externalEventId: buildExternalEventId({
      action,
      customer,
      payload,
      salesOrder
    }),
    ...(objectId ? { objectId } : {}),
    occurredAt: timestamp,
    organizationId: input.organizationId,
    payload: payloadBody,
    provider: "omie",
    receivedAt: timestamp,
    source: "sync",
    tenantId: input.tenantId
  };
}
