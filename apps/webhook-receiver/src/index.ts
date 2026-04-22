import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { getWebhookReceiverConfig } from "@birthub/config";
import { verifyHubspotSignatureV3 } from "@birthub/integrations/hubspot-webhooks";
import { Redis } from "ioredis";

interface WebhookReceiverConfig {
  apiGatewayUrl: string;
  birthhubSigningSecret: string;
  birthhubSigningSecretCandidates?: readonly string[] | undefined;
  hubspotClientSecret?: string | undefined;
  hubspotPublicBaseUrl?: string | undefined;
  idempotencyStore?: WebhookIdempotencyStore | undefined;
  internalServiceToken?: string | undefined;
  nodeEnv: string;
  port: number;
  primaryApiUrl: string;
  redisUrl?: string | undefined;
  strictRuntime: boolean;
  stripeWebhookSecret?: string | undefined;
  stripeWebhookSecretCandidates?: readonly string[] | undefined;
  svixWebhookSecret?: string | undefined;
  webhookIdempotencyTtlSeconds?: number | undefined;
}

type ForwardPayload = {
  accountKey?: string;
  connectorAccountId?: string;
  contact?: {
    companyName?: string;
    customProperties?: Record<string, unknown>;
    email: string;
    firstName?: string;
    lastName?: string;
    leadStatus?: string;
    lifecycleStage?: string;
    phone?: string;
  };
  eventType: string;
  externalEventId?: string;
  idempotencyKey?: string;
  organizationId?: string;
  payload?: Record<string, unknown>;
  rawBody?: string;
  tenantId?: string;
  webhookSignature?: string;
};

type WebhookIdempotencyClaim = {
  key: string;
  token: string;
};

interface WebhookIdempotencyStore {
  claim(key: string): Promise<WebhookIdempotencyClaim | null>;
  close?(): Promise<void>;
  complete(claim: WebhookIdempotencyClaim): Promise<void>;
  release(claim: WebhookIdempotencyClaim): Promise<void>;
}

const DEFAULT_IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const REDIS_CONNECT_TIMEOUT_MS = 5_000;
const REDIS_TOKEN_COMPLETE_SCRIPT = `
local value = redis.call("GET", KEYS[1])
if not value then
  return 0
end
local prefix = ARGV[1] .. "|"
if string.sub(value, 1, string.len(prefix)) ~= prefix then
  return 0
end
redis.call("SET", KEYS[1], ARGV[2], "EX", tonumber(ARGV[3]), "XX")
return 1
`;
const REDIS_TOKEN_DELETE_SCRIPT = `
local value = redis.call("GET", KEYS[1])
if not value then
  return 0
end
local prefix = ARGV[1] .. "|"
if string.sub(value, 1, string.len(prefix)) ~= prefix then
  return 0
end
return redis.call("DEL", KEYS[1])
`;

class WebhookIdempotencyUnavailableError extends Error {
  readonly originalError: unknown;

  constructor(error: unknown) {
    super("Webhook idempotency store is unavailable.");
    this.name = "WebhookIdempotencyUnavailableError";
    this.originalError = error;
  }
}

function readConfig(env: NodeJS.ProcessEnv = process.env): WebhookReceiverConfig {
  return getWebhookReceiverConfig(env);
}

function jsonResponse(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function readHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function resolveIdempotencyTtlSeconds(config: WebhookReceiverConfig): number {
  return config.webhookIdempotencyTtlSeconds ?? DEFAULT_IDEMPOTENCY_TTL_SECONDS;
}

function formatRedisIdempotencyValue(
  claim: WebhookIdempotencyClaim,
  status: "processed" | "processing"
): string {
  return `${claim.token}|${status}|${Date.now()}`;
}

class RedisWebhookIdempotencyStore implements WebhookIdempotencyStore {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSeconds: number
  ) {}

  async claim(key: string): Promise<WebhookIdempotencyClaim | null> {
    const claim = {
      key,
      token: randomUUID()
    };
    const result = await this.redis.set(
      key,
      formatRedisIdempotencyValue(claim, "processing"),
      "EX",
      this.ttlSeconds,
      "NX"
    );

    return result === "OK" ? claim : null;
  }

  async complete(claim: WebhookIdempotencyClaim): Promise<void> {
    await this.redis.eval(
      REDIS_TOKEN_COMPLETE_SCRIPT,
      1,
      claim.key,
      claim.token,
      formatRedisIdempotencyValue(claim, "processed"),
      String(this.ttlSeconds)
    );
  }

  async release(claim: WebhookIdempotencyClaim): Promise<void> {
    await this.redis.eval(REDIS_TOKEN_DELETE_SCRIPT, 1, claim.key, claim.token);
  }

  async close(): Promise<void> {
    if (this.redis.status !== "end") {
      await this.redis.quit();
    }
  }
}

function createRedisClient(redisUrl: string): Redis {
  const redis = new Redis(redisUrl, {
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });

  redis.on("error", (error: unknown) => {
    console.error("Webhook idempotency Redis error", error);
  });

  return redis;
}

function resolveWebhookIdempotencyStore(config: WebhookReceiverConfig): {
  closeOnServerClose: boolean;
  persistent: boolean;
  store: WebhookIdempotencyStore;
} {
  if (config.idempotencyStore) {
    return {
      closeOnServerClose: false,
      persistent: true,
      store: config.idempotencyStore
    };
  }

  if (config.redisUrl) {
    return {
      closeOnServerClose: true,
      persistent: true,
      store: new RedisWebhookIdempotencyStore(
        createRedisClient(config.redisUrl),
        resolveIdempotencyTtlSeconds(config)
      )
    };
  }

  if (!config.strictRuntime) {
    return {
      closeOnServerClose: false,
      persistent: false,
      store: {
        async claim(key: string): Promise<WebhookIdempotencyClaim> {
          return {
            key,
            token: "permissive-fallback"
          };
        },
        async complete(): Promise<void> {},
        async release(): Promise<void> {}
      }
    };
  }

  return {
    closeOnServerClose: false,
    persistent: false,
    store: {
      async claim(): Promise<WebhookIdempotencyClaim | null> {
        throw new Error("Persistent webhook idempotency store is not configured.");
      },
      async complete(): Promise<void> {},
      async release(): Promise<void> {}
    }
  };
}

async function claimWebhookEvent(
  idempotencyStore: WebhookIdempotencyStore,
  idempotencyKey: string | undefined
): Promise<WebhookIdempotencyClaim | null | undefined> {
  if (!idempotencyKey) {
    return undefined;
  }

  try {
    return await idempotencyStore.claim(idempotencyKey);
  } catch (error) {
    throw new WebhookIdempotencyUnavailableError(error);
  }
}

async function completeWebhookEvent(
  idempotencyStore: WebhookIdempotencyStore,
  claim: WebhookIdempotencyClaim | undefined
): Promise<void> {
  if (claim) {
    try {
      await idempotencyStore.complete(claim);
    } catch (error) {
      throw new WebhookIdempotencyUnavailableError(error);
    }
  }
}

async function releaseWebhookEvent(
  idempotencyStore: WebhookIdempotencyStore,
  claim: WebhookIdempotencyClaim | undefined
): Promise<void> {
  if (claim) {
    try {
      await idempotencyStore.release(claim);
    } catch (error) {
      throw new WebhookIdempotencyUnavailableError(error);
    }
  }
}

function compareSignatures(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function resolveStripeSecretCandidates(config: WebhookReceiverConfig): string[] {
  if (config.stripeWebhookSecretCandidates && config.stripeWebhookSecretCandidates.length > 0) {
    return [...config.stripeWebhookSecretCandidates];
  }

  return config.stripeWebhookSecret ? [config.stripeWebhookSecret] : [];
}

function parseStripeSignatureHeader(signature: string): { timestamp?: string; values: string[] } {
  const parts = signature.split(",").map((part) => part.trim());
  const timestamp = parts
    .map((part) => part.split("="))
    .find(([key]) => key === "t")?.[1];
  const values = parts
    .map((part) => part.split("="))
    .filter(([key, value]) => key === "v1" && typeof value === "string" && value.length > 0)
    .map(([, value]) => value);

  return {
    timestamp,
    values
  };
}

export function verifyStripeSignature(input: {
  body: string;
  secret: string;
  signature?: string | undefined;
  toleranceSeconds?: number | undefined;
}): boolean {
  if (!input.signature) {
    return false;
  }

  const { timestamp, values } = parseStripeSignatureHeader(input.signature);
  if (!timestamp || values.length === 0) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1_000 - timestampSeconds) > (input.toleranceSeconds ?? 300)
  ) {
    return false;
  }

  const expected = createHmac("sha256", input.secret)
    .update(`${timestamp}.${input.body}`)
    .digest("hex");

  return values.some((value) => compareSignatures(value, expected));
}

function decodeSvixSecret(secret: string): Buffer | string {
  return secret.startsWith("whsec_") ? Buffer.from(secret.slice("whsec_".length), "base64") : secret;
}

function parseSvixSignatures(signature: string): string[] {
  return signature
    .split(" ")
    .flatMap((part) => {
      const [version, value] = part.split(",");
      return version === "v1" && value ? [value] : [];
    });
}

export function verifySvixSignature(input: {
  body: string;
  id?: string | undefined;
  secret: string;
  signature?: string | undefined;
  timestamp?: string | undefined;
  toleranceSeconds?: number | undefined;
}): boolean {
  if (!input.id || !input.timestamp || !input.signature) {
    return false;
  }

  const timestampSeconds = Number(input.timestamp);
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1_000 - timestampSeconds) > (input.toleranceSeconds ?? 300)
  ) {
    return false;
  }

  const signedContent = `${input.id}.${input.timestamp}.${input.body}`;
  const expected = createHmac("sha256", decodeSvixSecret(input.secret))
    .update(signedContent)
    .digest("base64");

  return parseSvixSignatures(input.signature).some((value) => compareSignatures(value, expected));
}

function resolveRequestUrl(request: IncomingMessage, config: WebhookReceiverConfig): string {
  if (config.hubspotPublicBaseUrl) {
    return new URL(request.url ?? "/", config.hubspotPublicBaseUrl).toString();
  }

  const host = readHeader(request, "x-forwarded-host") ?? readHeader(request, "host") ?? "localhost";
  const proto = readHeader(request, "x-forwarded-proto") ?? "http";
  return `${proto}://${host}${request.url ?? "/"}`;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstObject(input: unknown): Record<string, unknown> | null {
  if (Array.isArray(input)) {
    return readObject(input[0]);
  }

  return readObject(input);
}

function inferHubspotEventType(payload: unknown): string {
  const first = firstObject(payload);
  return (
    readString(first?.subscriptionType) ??
    readString(first?.eventType) ??
    readString(first?.type) ??
    "lead.created"
  );
}

function inferHubspotExternalEventId(payload: unknown): string | undefined {
  const first = firstObject(payload);

  return (
    readString(first?.eventId) ??
    readString(first?.id) ??
    readString(first?.objectId) ??
    readString(first?.occurredAt)
  );
}

function extractContact(payload: unknown): ForwardPayload["contact"] | undefined {
  const root = firstObject(payload);
  const contact = readObject(root?.contact) ?? readObject(root?.lead) ?? readObject(root?.properties) ?? root;
  const email = readString(contact?.email);

  if (!contact || !email) {
    return undefined;
  }

  const customProperties = readObject(contact.customProperties);

  return {
    ...(readString(contact.companyName) ?? readString(contact.company)
      ? { companyName: readString(contact.companyName) ?? readString(contact.company) }
      : {}),
    ...(customProperties ? { customProperties } : {}),
    email,
    ...(readString(contact.firstName) ?? readString(contact.firstname)
      ? { firstName: readString(contact.firstName) ?? readString(contact.firstname) }
      : {}),
    ...(readString(contact.lastName) ?? readString(contact.lastname)
      ? { lastName: readString(contact.lastName) ?? readString(contact.lastname) }
      : {}),
    ...(readString(contact.leadStatus) ?? readString(contact.hs_lead_status)
      ? { leadStatus: readString(contact.leadStatus) ?? readString(contact.hs_lead_status) }
      : {}),
    ...(readString(contact.lifecycleStage) ?? readString(contact.lifecyclestage)
      ? { lifecycleStage: readString(contact.lifecycleStage) ?? readString(contact.lifecyclestage) }
      : {}),
    ...(readString(contact.phone) ? { phone: readString(contact.phone) } : {})
  };
}

export function signBirthHubWebhookPayload(payload: unknown, secret: string): string {
  return createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

export function buildHubspotForwardPayload(input: {
  rawPayload: unknown;
  url: URL;
}): ForwardPayload {
  const tenantId =
    input.url.searchParams.get("tenantId") ?? input.url.searchParams.get("tenant_id") ?? undefined;
  const organizationId =
    input.url.searchParams.get("organizationId") ??
    input.url.searchParams.get("organization_id") ??
    undefined;
  const accountKey =
    input.url.searchParams.get("accountKey") ?? input.url.searchParams.get("account_key") ?? undefined;
  const connectorAccountId =
    input.url.searchParams.get("connectorAccountId") ??
    input.url.searchParams.get("connector_account_id") ??
    undefined;
  const rawObject = readObject(input.rawPayload);
  const contact = extractContact(input.rawPayload);
  const externalEventId = inferHubspotExternalEventId(input.rawPayload);

  return {
    ...(accountKey ? { accountKey } : {}),
    ...(connectorAccountId ? { connectorAccountId } : {}),
    ...(contact ? { contact } : {}),
    eventType: readString(rawObject?.eventType) ?? inferHubspotEventType(input.rawPayload),
    ...(externalEventId ? { externalEventId, idempotencyKey: externalEventId } : {}),
    ...(organizationId ? { organizationId } : {}),
    payload: {
      hubspot: input.rawPayload
    },
    ...(tenantId ? { tenantId } : {})
  };
}

export function buildStripeForwardPayload(input: {
  rawBody: string;
  rawPayload: unknown;
  signature?: string | undefined;
  url: URL;
}): ForwardPayload {
  const tenantId =
    input.url.searchParams.get("tenantId") ?? input.url.searchParams.get("tenant_id") ?? undefined;
  const organizationId =
    input.url.searchParams.get("organizationId") ??
    input.url.searchParams.get("organization_id") ??
    undefined;
  const accountKey =
    input.url.searchParams.get("accountKey") ?? input.url.searchParams.get("account_key") ?? undefined;
  const connectorAccountId =
    input.url.searchParams.get("connectorAccountId") ??
    input.url.searchParams.get("connector_account_id") ??
    undefined;
  const rawObject = readObject(input.rawPayload);

  return {
    ...(accountKey ? { accountKey } : {}),
    ...(connectorAccountId ? { connectorAccountId } : {}),
    eventType: readString(rawObject?.type) ?? "stripe.webhook.received",
    ...(readString(rawObject?.id)
      ? {
          externalEventId: readString(rawObject?.id),
          idempotencyKey: readString(rawObject?.id)
        }
      : {}),
    ...(organizationId ? { organizationId } : {}),
    payload: {
      stripe: input.rawPayload
    },
    rawBody: input.rawBody,
    ...(tenantId ? { tenantId } : {}),
    ...(input.signature ? { webhookSignature: input.signature } : {})
  };
}

async function forwardToApi(input: {
  config: WebhookReceiverConfig;
  provider: "hubspot" | "stripe";
  payload: ForwardPayload;
}): Promise<Response> {
  const signature = signBirthHubWebhookPayload(input.payload, input.config.birthhubSigningSecret);

  return fetch(`${input.config.apiGatewayUrl}/api/v1/connectors/webhooks/${input.provider}`, {
    body: JSON.stringify(input.payload),
    headers: {
      "content-type": "application/json",
      "x-birthhub-signature": signature
    },
    method: "POST"
  });
}

async function patchInternal(input: {
  config: WebhookReceiverConfig;
  path: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  if (input.config.internalServiceToken) {
    headers["x-service-token"] = input.config.internalServiceToken;
  }

  const response = await fetch(`${input.config.apiGatewayUrl}${input.path}`, {
    body: JSON.stringify(input.payload),
    headers,
    method: "PATCH"
  });

  if (!response.ok) {
    throw new Error(`Internal webhook patch failed with status ${response.status}.`);
  }
}

async function handlePaymentSuccess(
  data: Record<string, unknown>,
  config: WebhookReceiverConfig
): Promise<void> {
  const object = readObject(data.object);
  const metadata = readObject(object?.metadata);
  const organizationId = readString(metadata?.organizationId) ?? readString(data.organizationId);

  if (!organizationId) {
    return;
  }

  await patchInternal({
    config,
    path: `/api/v1/internal/organizations/${encodeURIComponent(organizationId)}/plan`,
    payload: {
      plan: "PRO"
    }
  });
}

async function handleSubscriptionChange(
  data: Record<string, unknown>,
  config: WebhookReceiverConfig
): Promise<void> {
  const object = readObject(data.object);
  const metadata = readObject(object?.metadata);
  const organizationId = readString(metadata?.organizationId) ?? readString(data.organizationId);
  const plan = readString(metadata?.plan) ?? readString(data.plan);

  if (!organizationId || !plan) {
    return;
  }

  await patchInternal({
    config,
    path: `/api/v1/internal/organizations/${encodeURIComponent(organizationId)}/plan`,
    payload: {
      plan
    }
  });
}

async function handleEmailOpen(
  data: Record<string, unknown>,
  config: WebhookReceiverConfig
): Promise<void> {
  const activityId = readString(data.activityId);

  if (!activityId) {
    return;
  }

  await patchInternal({
    config,
    path: `/api/v1/internal/activities/${encodeURIComponent(activityId)}`,
    payload: {
      status: "OPENED"
    }
  });
}

async function handleHubspotWebhook(
  request: IncomingMessage,
  response: ServerResponse,
  config: WebhookReceiverConfig,
  idempotencyStore: WebhookIdempotencyStore
): Promise<void> {
  const body = await readBody(request);

  if (!config.hubspotClientSecret && config.nodeEnv === "production") {
    jsonResponse(response, 500, {
      error: "HUBSPOT_CLIENT_SECRET is required to verify HubSpot webhooks."
    });
    return;
  }

  if (config.hubspotClientSecret) {
    const verified = verifyHubspotSignatureV3({
      body,
      clientSecret: config.hubspotClientSecret,
      method: request.method ?? "POST",
      signature: readHeader(request, "x-hubspot-signature-v3"),
      timestamp: readHeader(request, "x-hubspot-request-timestamp"),
      url: resolveRequestUrl(request, config)
    });

    if (!verified) {
      jsonResponse(response, 401, {
        error: "Invalid HubSpot signature."
      });
      return;
    }
  }

  const rawPayload = JSON.parse(body) as unknown;
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const payload = buildHubspotForwardPayload({
    rawPayload,
    url: requestUrl
  });
  const idempotencyKey = payload.idempotencyKey
    ? `hubspot:${payload.tenantId ?? "unknown"}:${payload.idempotencyKey}`
    : undefined;

  const claim = await claimWebhookEvent(idempotencyStore, idempotencyKey);
  if (claim === null) {
    jsonResponse(response, 202, {
      accepted: true,
      duplicate: true
    });
    return;
  }

  let apiResponse: Response;
  try {
    apiResponse = await forwardToApi({
      config,
      provider: "hubspot",
      payload
    });
  } catch (error) {
    await releaseWebhookEvent(idempotencyStore, claim);
    throw error;
  }

  if (!apiResponse.ok) {
    await releaseWebhookEvent(idempotencyStore, claim);
    jsonResponse(response, 502, {
      accepted: false,
      status: apiResponse.status
    });
    return;
  }

  await completeWebhookEvent(idempotencyStore, claim);
  jsonResponse(response, 202, {
    accepted: true
  });
}

async function handleStripeWebhook(
  request: IncomingMessage,
  response: ServerResponse,
  config: WebhookReceiverConfig,
  idempotencyStore: WebhookIdempotencyStore
): Promise<void> {
  const body = await readBody(request);
  const signature = readHeader(request, "stripe-signature");

  if (!signature) {
    jsonResponse(response, 400, {
      error: "Missing Stripe signature."
    });
    return;
  }

  const stripeSecretCandidates = resolveStripeSecretCandidates(config);
  if (stripeSecretCandidates.length > 0) {
    const verified = stripeSecretCandidates.some((secret) =>
      verifyStripeSignature({
        body,
        secret,
        signature
      })
    );

    if (!verified) {
      jsonResponse(response, 401, {
        error: "Invalid Stripe signature."
      });
      return;
    }
  } else if (config.strictRuntime) {
    jsonResponse(response, 500, {
      error: "STRIPE_WEBHOOK_SECRET is required to verify Stripe webhooks."
    });
    return;
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(body) as unknown;
  } catch {
    jsonResponse(response, 400, {
      error: "Invalid Stripe payload."
    });
    return;
  }

  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const payload = buildStripeForwardPayload({
    rawBody: body,
    rawPayload,
    signature,
    url: requestUrl
  });
  const idempotencyKey = payload.idempotencyKey
    ? `stripe:${payload.tenantId ?? "unknown"}:${payload.idempotencyKey}`
    : undefined;

  const claim = await claimWebhookEvent(idempotencyStore, idempotencyKey);
  if (claim === null) {
    jsonResponse(response, 202, {
      accepted: true,
      duplicate: true
    });
    return;
  }

  let apiResponse: Response;
  try {
    apiResponse = await forwardToApi({
      config,
      payload,
      provider: "stripe"
    });
  } catch (error) {
    await releaseWebhookEvent(idempotencyStore, claim);
    throw error;
  }

  if (!apiResponse.ok) {
    await releaseWebhookEvent(idempotencyStore, claim);
    const bodyText = await apiResponse.text();
    response.writeHead(apiResponse.status, {
      "cache-control": "no-store",
      "content-type": "application/json"
    });
    response.end(
      bodyText ||
        JSON.stringify({
          accepted: false,
          status: apiResponse.status
        })
    );
    return;
  }

  await completeWebhookEvent(idempotencyStore, claim);
  jsonResponse(response, 202, {
    accepted: true
  });
}

async function handleSvixWebhook(
  provider: string,
  request: IncomingMessage,
  response: ServerResponse,
  config: WebhookReceiverConfig,
  idempotencyStore: WebhookIdempotencyStore
): Promise<void> {
  const body = await readBody(request);
  const svixId = readHeader(request, "svix-id");
  const svixTimestamp = readHeader(request, "svix-timestamp");
  const svixSignature = readHeader(request, "svix-signature");

  if (!config.svixWebhookSecret) {
    jsonResponse(response, 500, {
      error: "SVIX_WEBHOOK_SECRET is required to verify Svix webhooks."
    });
    return;
  }

  const verified = verifySvixSignature({
    body,
    id: svixId,
    secret: config.svixWebhookSecret,
    signature: svixSignature,
    timestamp: svixTimestamp
  });

  if (!verified) {
    jsonResponse(response, 401, {
      error: "Invalid Svix signature."
    });
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    jsonResponse(response, 400, {
      error: "Invalid Svix payload."
    });
    return;
  }

  const event = readObject(payload) ?? {};
  const eventType = readString(event.type) ?? "unknown";
  const data = readObject(event.data) ?? {};
  const idempotencyKey = svixId ? `svix:${provider}:${svixId}` : undefined;

  const claim = await claimWebhookEvent(idempotencyStore, idempotencyKey);
  if (claim === null) {
    jsonResponse(response, 202, {
      accepted: true,
      duplicate: true,
      processed: false
    });
    return;
  }

  try {
    if (provider === "stripe") {
      if (eventType === "payment_intent.succeeded") {
        await handlePaymentSuccess(data, config);
      } else if (eventType === "customer.subscription.updated") {
        await handleSubscriptionChange(data, config);
      }
    } else if (provider === "resend" && eventType === "email.opened") {
      await handleEmailOpen(data, config);
    }

    await completeWebhookEvent(idempotencyStore, claim);
    jsonResponse(response, 202, {
      accepted: true,
      processed: true
    });
  } catch (error) {
    await releaseWebhookEvent(idempotencyStore, claim);
    throw error;
  }
}

async function checkDependency(url: string): Promise<{ message?: string; status: "down" | "up" }> {
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5_000)
    });

    if (!response.ok) {
      return {
        message: `status ${response.status}`,
        status: "down"
      };
    }

    return {
      status: "up"
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "dependency check failed",
      status: "down"
    };
  }
}

async function handleHealth(response: ServerResponse, config: WebhookReceiverConfig): Promise<void> {
  if (!config.strictRuntime) {
    jsonResponse(response, 200, {
      status: "ok"
    });
    return;
  }

  const [primaryApi, compatApi] = await Promise.all([
    checkDependency(config.primaryApiUrl),
    checkDependency(config.apiGatewayUrl)
  ]);
  const services = {
    compatApi,
    internalServiceToken: {
      ...(config.internalServiceToken
        ? {}
        : { message: "INTERNAL_SERVICE_TOKEN is required in strict runtime" }),
      status: config.internalServiceToken ? "up" : "down"
    },
    primaryApi,
    svixSecret: {
      ...(config.svixWebhookSecret ? {} : { message: "SVIX_WEBHOOK_SECRET is required in strict runtime" }),
      status: config.svixWebhookSecret ? "up" : "down"
    }
  };
  const status = Object.values(services).every((service) => service.status === "up") ? "ok" : "degraded";

  jsonResponse(response, 200, {
    services,
    status
  });
}

function handleWebhookReceiverError(
  response: ServerResponse,
  error: unknown,
  fallbackMessage: string
): void {
  if (error instanceof WebhookIdempotencyUnavailableError) {
    jsonResponse(response, 503, {
      error: "Webhook idempotency store is unavailable."
    });
    return;
  }

  jsonResponse(response, 500, {
    error: error instanceof Error ? error.message : fallbackMessage
  });
}

export function createWebhookReceiverServer(config = readConfig()) {
  const { closeOnServerClose, persistent, store: idempotencyStore } = resolveWebhookIdempotencyStore(config);

  if (config.strictRuntime && !persistent) {
    throw new Error("REDIS_URL (or an explicit persistent idempotencyStore) is required in strict runtime.");
  }
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      void handleHealth(response, config).catch((error) => {
        handleWebhookReceiverError(response, error, "Webhook receiver health check failed.");
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/webhooks/hubspot") {
      void handleHubspotWebhook(request, response, config, idempotencyStore).catch((error) => {
        handleWebhookReceiverError(response, error, "Webhook receiver failed.");
      });
      return;
    }

    if (
      request.method === "POST" &&
      requestUrl.pathname === "/webhooks/stripe" &&
      readHeader(request, "svix-id")
    ) {
      void handleSvixWebhook("stripe", request, response, config, idempotencyStore).catch((error) => {
        handleWebhookReceiverError(response, error, "Webhook receiver failed.");
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/webhooks/stripe") {
      void handleStripeWebhook(request, response, config, idempotencyStore).catch((error) => {
        handleWebhookReceiverError(response, error, "Webhook receiver failed.");
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/webhooks/resend") {
      void handleSvixWebhook("resend", request, response, config, idempotencyStore).catch((error) => {
        handleWebhookReceiverError(response, error, "Webhook receiver failed.");
      });
      return;
    }

    jsonResponse(response, 404, {
      error: "Not found"
    });
  });

  if (closeOnServerClose && idempotencyStore.close) {
    server.on("close", () => {
      void idempotencyStore.close?.().catch((error: unknown) => {
        console.error("Failed to close webhook idempotency store", error);
      });
    });
  }

  return server;
}

if (process.env.WEBHOOK_RECEIVER_AUTOSTART !== "false") {
  const config = readConfig();
  const server = createWebhookReceiverServer(config);
  server.listen(config.port, () => {
    console.info(`birthub-webhook-receiver listening on ${config.port}`);
  });
}
