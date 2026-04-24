import type {
  HubspotAdapterFetch,
  HubspotCompanyUpsertInput,
  HubspotContactUpsertInput
} from "@birthub/integrations/hubspot-crm-adapter";
import type {
  OmieAdapterFetch,
  OmieCustomerUpsertInput,
  OmieSalesOrderCreateInput
} from "@birthub/integrations/omie-erp-adapter";
import type {
  SlackAdapterFetch,
  SlackMessageSendInput
} from "@birthub/integrations/slack-message-adapter";
import type {
  StripePaymentAdapterFetch,
  StripePaymentReadInput
} from "@birthub/integrations/stripe-payment-adapter";
import type {
  ZenviaAdapterFetch,
  ZenviaMessageSendInput
} from "@birthub/integrations/zenvia-message-adapter";

export const connectorRuntimeProviders = [
  "hubspot",
  "omie",
  "slack",
  "stripe",
  "zenvia"
] as const;

export type ConnectorProvider = (typeof connectorRuntimeProviders)[number];

export type ConnectorActionName =
  | "crm.company.upsert"
  | "crm.contact.upsert"
  | "erp.customer.upsert"
  | "erp.sales-order.create"
  | "health.check"
  | "message.send"
  | "payment.read";

const connectorRuntimeProviderSet = new Set<string>(connectorRuntimeProviders);

export function isConnectorRuntimeProvider(provider: string): provider is ConnectorProvider {
  return connectorRuntimeProviderSet.has(provider);
}

export interface NormalizedEvent<Action extends string = ConnectorActionName> {
  action: Action;
  eventType: string;
  externalEventId: string;
  objectId?: string | undefined;
  occurredAt: string;
  payload: Record<string, unknown>;
  provider: ConnectorProvider;
  receivedAt: string;
  source: "webhook" | "sync";
}

export interface ConnectorEventJobPayload<
  Action extends string = ConnectorActionName
> extends NormalizedEvent<Action> {
  accountKey?: string | undefined;
  connectorAccountId?: string | undefined;
  eventId: string;
  kind: "connector-event";
  organizationId: string;
  tenantId: string;
}

export interface ConnectorCredentials {
  accessToken?: string | undefined;
  apiKey?: string | undefined;
  appKey?: string | undefined;
  appSecret?: string | undefined;
  baseUrl?: string | undefined;
  botToken?: string | undefined;
}

export type MessageSendPayload = SlackMessageSendInput | ZenviaMessageSendInput;

export type ConnectorActionPayload = {
  "crm.company.upsert": HubspotCompanyUpsertInput;
  "crm.contact.upsert": HubspotContactUpsertInput;
  "erp.customer.upsert": OmieCustomerUpsertInput;
  "erp.sales-order.create": OmieSalesOrderCreateInput;
  "health.check": Record<string, unknown>;
  "message.send": MessageSendPayload;
  "payment.read": StripePaymentReadInput;
};

export interface ConnectorExecutionRequest<Action extends ConnectorActionName = ConnectorActionName> {
  action: Action;
  credentials: ConnectorCredentials;
  idempotencyKey?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  payload: ConnectorActionPayload[Action];
  provider: ConnectorProvider;
  sandboxMode?: boolean | undefined;
}

export interface ConnectorExecutionResult {
  action: ConnectorActionName;
  externalId?: string | null | undefined;
  provider: ConnectorProvider;
  request?: Record<string, unknown> | undefined;
  response?: unknown;
  status: "failed" | "skipped" | "success";
  statusCode?: number | undefined;
}

export interface ConnectorActionHandler<Action extends ConnectorActionName = ConnectorActionName> {
  action: Action;
  execute(request: ConnectorExecutionRequest<Action>): Promise<ConnectorExecutionResult>;
  provider: ConnectorProvider;
}

export interface ConnectorRuntimeDependencies {
  fetchImpl?:
    | HubspotAdapterFetch
    | OmieAdapterFetch
    | SlackAdapterFetch
    | StripePaymentAdapterFetch
    | ZenviaAdapterFetch
    | typeof fetch
    | undefined;
}
