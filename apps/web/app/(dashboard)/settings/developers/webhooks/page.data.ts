import { fetchWithSession } from "../../../../../lib/auth-client";

export type WebhookEndpoint = {
  _count?: {
    deliveries: number;
  };
  createdAt: string;
  id: string;
  secret: string;
  status: "ACTIVE" | "DISABLED";
  topics: string[];
  url: string;
};

export type WebhookDelivery = {
  attempt: number;
  createdAt: string;
  endpointId: string;
  id: string;
  responseStatus: number | null;
  topic: string;
};

export const defaultTopics = "agent.finished,agent.failed";
export const suggestedTopics = [
  "agent.finished",
  "agent.failed",
  "workflow.finished",
  "tenant.churn_risk"
];

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function parseTopics(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveSelectedEndpointId(
  currentId: string | null,
  endpoints: WebhookEndpoint[]
): string | null {
  return currentId && endpoints.some((item) => item.id === currentId)
    ? currentId
    : (endpoints[0]?.id ?? null);
}

export function prependEndpoint(
  endpoints: WebhookEndpoint[],
  endpoint: WebhookEndpoint
): WebhookEndpoint[] {
  return [endpoint, ...endpoints.filter((item) => item.id !== endpoint.id)];
}

export function replaceEndpoint(
  endpoints: WebhookEndpoint[],
  endpoint: WebhookEndpoint
): WebhookEndpoint[] {
  return endpoints.map((item) => (item.id === endpoint.id ? endpoint : item));
}

async function requestJson<TResponse>(
  input: string,
  init: RequestInit,
  failureLabel: string
): Promise<TResponse> {
  const response = await fetchWithSession(input, init);

  if (!response.ok) {
    throw new Error(`${failureLabel} (${response.status}).`);
  }

  return (await response.json()) as TResponse;
}

async function requestWithoutBody(
  input: string,
  init: RequestInit,
  failureLabel: string
): Promise<void> {
  const response = await fetchWithSession(input, init);

  if (!response.ok) {
    throw new Error(`${failureLabel} (${response.status}).`);
  }
}

export async function fetchWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  const payload = await requestJson<{ items: WebhookEndpoint[] }>(
    "/api/v1/settings/webhooks",
    { cache: "no-store" },
    "Falha ao carregar endpoints"
  );

  return payload.items ?? [];
}

export async function fetchWebhookDeliveries(endpointId: string): Promise<WebhookDelivery[]> {
  const payload = await requestJson<{ items: WebhookDelivery[] }>(
    `/api/v1/settings/webhooks/${encodeURIComponent(endpointId)}/deliveries?limit=25`,
    { cache: "no-store" },
    "Falha ao carregar entregas"
  );

  return payload.items ?? [];
}

export async function createWebhookEndpoint(
  url: string,
  topics: string[]
): Promise<WebhookEndpoint> {
  const payload = await requestJson<{ endpoint: WebhookEndpoint }>(
    "/api/v1/settings/webhooks",
    {
      body: JSON.stringify({ topics, url }),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    },
    "Falha ao criar endpoint"
  );

  return payload.endpoint;
}

export async function updateWebhookEndpointStatus(
  endpointId: string,
  status: WebhookEndpoint["status"]
): Promise<WebhookEndpoint> {
  const payload = await requestJson<{ endpoint: WebhookEndpoint }>(
    `/api/v1/settings/webhooks/${encodeURIComponent(endpointId)}`,
    {
      body: JSON.stringify({ status }),
      headers: {
        "content-type": "application/json"
      },
      method: "PATCH"
    },
    "Falha ao atualizar endpoint"
  );

  return payload.endpoint;
}

export async function retryWebhookDelivery(deliveryId: string): Promise<void> {
  await requestWithoutBody(
    `/api/v1/settings/webhooks/deliveries/${encodeURIComponent(deliveryId)}/retry`,
    { method: "POST" },
    "Falha ao reenviar delivery"
  );
}

