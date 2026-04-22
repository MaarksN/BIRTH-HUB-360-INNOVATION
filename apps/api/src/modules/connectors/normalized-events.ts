import { createHash } from "node:crypto";

import type { NormalizedEvent } from "@birthub/connectors-core";

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstObject(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return readObject(value[0]);
  }

  return readObject(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readIdentifier(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return readString(value);
}

function readDate(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  const candidate = readString(value);
  if (!candidate) {
    return undefined;
  }

  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function inferHubspotObjectId(payload: Record<string, unknown>): string | undefined {
  const hubspotPayload = firstObject(payload.hubspot);

  return (
    readIdentifier(payload.objectId) ??
    readIdentifier(payload.contactId) ??
    readIdentifier(payload.hs_object_id) ??
    readIdentifier(hubspotPayload?.objectId) ??
    readIdentifier(hubspotPayload?.contactId) ??
    readIdentifier(hubspotPayload?.hs_object_id)
  );
}

function inferHubspotOccurredAt(payload: Record<string, unknown>, receivedAt: string): string {
  const hubspotPayload = firstObject(payload.hubspot);

  return (
    readDate(payload.occurredAt) ??
    readDate(payload.occurredAtMs) ??
    readDate(payload.eventTimestamp) ??
    readDate(payload.timestamp) ??
    readDate(hubspotPayload?.occurredAt) ??
    readDate(hubspotPayload?.occurredAtMs) ??
    readDate(hubspotPayload?.eventTimestamp) ??
    readDate(hubspotPayload?.timestamp) ??
    receivedAt
  );
}

function inferSlackObjectId(payload: Record<string, unknown>): string | undefined {
  return (
    readIdentifier(payload.channel) ??
    readIdentifier(payload.channelId) ??
    readIdentifier(payload.userId) ??
    readIdentifier(payload.user_id)
  );
}

function inferSlackOccurredAt(payload: Record<string, unknown>, receivedAt: string): string {
  return (
    readDate(payload.occurredAt) ??
    readDate(payload.occurredAtMs) ??
    readDate(payload.timestamp) ??
    readDate(payload.ts) ??
    receivedAt
  );
}

function inferZenviaObjectId(payload: Record<string, unknown>): string | undefined {
  const messagePayload = readObject(payload.message);

  return (
    readIdentifier(messagePayload?.to) ??
    readIdentifier(payload.to) ??
    readIdentifier(messagePayload?.id) ??
    readIdentifier(payload.id)
  );
}

function inferZenviaOccurredAt(payload: Record<string, unknown>, receivedAt: string): string {
  const messagePayload = readObject(payload.message);

  return (
    readDate(payload.occurredAt) ??
    readDate(payload.timestamp) ??
    readDate(payload.createdAt) ??
    readDate(messagePayload?.createdAt) ??
    readDate(messagePayload?.timestamp) ??
    receivedAt
  );
}

function inferStripeObjectId(payload: Record<string, unknown>): string | undefined {
  const stripePayload = readObject(payload.stripe);
  const stripeData = readObject(stripePayload?.data);
  const stripeObject = readObject(stripeData?.object);

  return (
    readIdentifier(payload.objectId) ??
    readIdentifier(payload.paymentId) ??
    readIdentifier(stripeObject?.id) ??
    readIdentifier(stripeObject?.payment_intent)
  );
}

function inferStripeOccurredAt(payload: Record<string, unknown>, receivedAt: string): string {
  const stripePayload = readObject(payload.stripe);

  return readDate(payload.occurredAt) ?? readDate(stripePayload?.created) ?? receivedAt;
}

export function buildHubspotExternalEventId(input: {
  eventType: string;
  externalEventId?: string | undefined;
  idempotencyKey?: string | undefined;
  payload: Record<string, unknown>;
}): string {
  const explicit = readString(input.externalEventId) ?? readString(input.idempotencyKey);
  if (explicit) {
    return explicit;
  }

  const hubspotPayload = firstObject(input.payload.hubspot) ?? input.payload;
  const objectId =
    readIdentifier(hubspotPayload.eventId) ??
    readIdentifier(hubspotPayload.messageId) ??
    readIdentifier(hubspotPayload.objectId) ??
    readIdentifier(hubspotPayload.contactId) ??
    readIdentifier(hubspotPayload.hs_object_id);
  const occurredAt =
    readDate(hubspotPayload.occurredAt) ??
    readDate(hubspotPayload.occurredAtMs) ??
    readDate(hubspotPayload.eventTimestamp) ??
    readDate(hubspotPayload.timestamp);

  if (objectId) {
    return `hubspot:${input.eventType}:${objectId}:${occurredAt ?? "na"}`;
  }

  const fingerprint = createHash("sha256")
    .update(JSON.stringify(hubspotPayload))
    .digest("hex");

  return `hubspot:${input.eventType}:${fingerprint}`;
}

export function normalizeHubspotConnectorEvent(input: {
  eventType: string;
  externalEventId?: string | undefined;
  idempotencyKey?: string | undefined;
  payload: Record<string, unknown>;
  receivedAt: string;
}): NormalizedEvent {
  return {
    action: "crm.contact.upsert",
    eventType: input.eventType,
    externalEventId: buildHubspotExternalEventId({
      eventType: input.eventType,
      ...(input.externalEventId ? { externalEventId: input.externalEventId } : {}),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      payload: input.payload
    }),
    ...(inferHubspotObjectId(input.payload) ? { objectId: inferHubspotObjectId(input.payload) } : {}),
    occurredAt: inferHubspotOccurredAt(input.payload, input.receivedAt),
    payload: input.payload,
    provider: "hubspot",
    receivedAt: input.receivedAt,
    source: "webhook"
  };
}

export function buildSlackExternalEventId(input: {
  eventType: string;
  externalEventId?: string | undefined;
  idempotencyKey?: string | undefined;
  payload: Record<string, unknown>;
}): string {
  const explicit = readString(input.externalEventId) ?? readString(input.idempotencyKey);
  if (explicit) {
    return explicit;
  }

  const destination =
    readString(input.payload.channel) ??
    readString(input.payload.channelId) ??
    readString(input.payload.userId) ??
    readString(input.payload.user_id) ??
    "unknown";
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(input.payload))
    .digest("hex")
    .slice(0, 16);

  return `slack:${input.eventType}:${destination}:${fingerprint}`;
}

export function normalizeSlackConnectorEvent(input: {
  eventType: string;
  externalEventId?: string | undefined;
  idempotencyKey?: string | undefined;
  payload: Record<string, unknown>;
  receivedAt: string;
}): NormalizedEvent {
  return {
    action: "message.send",
    eventType: input.eventType,
    externalEventId: buildSlackExternalEventId({
      eventType: input.eventType,
      ...(input.externalEventId ? { externalEventId: input.externalEventId } : {}),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      payload: input.payload
    }),
    ...(inferSlackObjectId(input.payload) ? { objectId: inferSlackObjectId(input.payload) } : {}),
    occurredAt: inferSlackOccurredAt(input.payload, input.receivedAt),
    payload: input.payload,
    provider: "slack",
    receivedAt: input.receivedAt,
    source: "webhook"
  };
}

export function buildZenviaExternalEventId(input: {
  eventType: string;
  externalEventId?: string | undefined;
  idempotencyKey?: string | undefined;
  payload: Record<string, unknown>;
}): string {
  const explicit =
    readString(input.externalEventId) ??
    readString(input.idempotencyKey) ??
    readString(readObject(input.payload.message)?.externalId) ??
    readString(input.payload.externalId);
  if (explicit) {
    return explicit;
  }

  const messagePayload = readObject(input.payload.message);
  const destination =
    readString(messagePayload?.to) ??
    readString(input.payload.to) ??
    "unknown";
  const channel =
    readString(messagePayload?.channel) ??
    readString(input.payload.channel) ??
    "unknown";
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(input.payload))
    .digest("hex")
    .slice(0, 16);

  return `zenvia:${input.eventType}:${channel}:${destination}:${fingerprint}`;
}

export function normalizeZenviaConnectorEvent(input: {
  eventType: string;
  externalEventId?: string | undefined;
  idempotencyKey?: string | undefined;
  payload: Record<string, unknown>;
  receivedAt: string;
}): NormalizedEvent {
  return {
    action: "message.send",
    eventType: input.eventType,
    externalEventId: buildZenviaExternalEventId({
      eventType: input.eventType,
      ...(input.externalEventId ? { externalEventId: input.externalEventId } : {}),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      payload: input.payload
    }),
    ...(inferZenviaObjectId(input.payload) ? { objectId: inferZenviaObjectId(input.payload) } : {}),
    occurredAt: inferZenviaOccurredAt(input.payload, input.receivedAt),
    payload: input.payload,
    provider: "zenvia",
    receivedAt: input.receivedAt,
    source: "webhook"
  };
}

export function buildStripeExternalEventId(input: {
  eventType: string;
  externalEventId?: string | undefined;
  idempotencyKey?: string | undefined;
  payload: Record<string, unknown>;
}): string {
  const explicit = readString(input.externalEventId) ?? readString(input.idempotencyKey);
  if (explicit) {
    return explicit;
  }

  const stripePayload = readObject(input.payload.stripe);
  const stripeEventId = readIdentifier(stripePayload?.id);
  if (stripeEventId) {
    return stripeEventId;
  }

  const objectId = inferStripeObjectId(input.payload);
  const occurredAt = inferStripeOccurredAt(input.payload, new Date(0).toISOString());

  if (objectId) {
    return `stripe:${input.eventType}:${objectId}:${occurredAt}`;
  }

  const fingerprint = createHash("sha256")
    .update(JSON.stringify(input.payload))
    .digest("hex");

  return `stripe:${input.eventType}:${fingerprint}`;
}

export function normalizeStripeConnectorEvent(input: {
  eventType: string;
  externalEventId?: string | undefined;
  idempotencyKey?: string | undefined;
  payload: Record<string, unknown>;
  receivedAt: string;
}): NormalizedEvent {
  return {
    action: "payment.read",
    eventType: input.eventType,
    externalEventId: buildStripeExternalEventId({
      eventType: input.eventType,
      ...(input.externalEventId ? { externalEventId: input.externalEventId } : {}),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      payload: input.payload
    }),
    ...(inferStripeObjectId(input.payload) ? { objectId: inferStripeObjectId(input.payload) } : {}),
    occurredAt: inferStripeOccurredAt(input.payload, input.receivedAt),
    payload: input.payload,
    provider: "stripe",
    receivedAt: input.receivedAt,
    source: "webhook"
  };
}
