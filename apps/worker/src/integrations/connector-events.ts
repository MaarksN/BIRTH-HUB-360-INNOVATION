import {
  ensureConnectorExecutionError,
  createDefaultConnectorRuntime,
  decryptConnectorToken,
  serializeConnectorError,
  type ConnectorEventJobPayload,
  type ConnectorRuntime
} from "@birthub/connectors-core";
import { getWorkerConfig, type WorkerConfig } from "@birthub/config";
import { Prisma, prisma } from "@birthub/database";
import { HubspotCrmAdapter } from "@birthub/integrations/hubspot-crm-adapter";
import { findConnectorCredentialByType } from "@birthub/integrations";
import { createLogger } from "@birthub/logger";
import type { Job } from "bullmq";
import { UnrecoverableError } from "bullmq";

import {
  createConversationMessage,
  ensureConversationThread
} from "../agents/conversations.js";
import {
  buildConnectorLogFields,
  resolveConnectorAttemptState
} from "./connector-events.shared.js";
import {
  extractOmieCustomerPayload,
  extractOmieSalesOrderPayload
} from "./omie-events.js";
import {
  extractSlackMessagePayload,
  type SlackMessagePayload
} from "./slack-events.js";
import {
  extractStripePaymentPayload,
  type StripePaymentPayload
} from "./stripe-events.js";
import {
  extractZenviaMessagePayload,
  type ZenviaMessagePayload
} from "./zenvia-events.js";

const logger = createLogger("worker-connector-events");

export type { ConnectorEventJobPayload } from "@birthub/connectors-core";

interface HubspotLeadContact {
  companyName?: string | undefined;
  customProperties?: Record<string, unknown> | undefined;
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  leadStatus?: string | undefined;
  lifecycleStage?: string | undefined;
  phone?: string | undefined;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
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

function readNestedString(input: Record<string, unknown>, key: string): string | undefined {
  const direct = readString(input[key]);
  if (direct) {
    return direct;
  }

  const properties = readObject(input.properties);
  return properties ? readString(properties[key]) : undefined;
}

function readNestedIdentifier(input: Record<string, unknown>, key: string): string | undefined {
  const direct = readIdentifier(input[key]);
  if (direct) {
    return direct;
  }

  const properties = readObject(input.properties);
  return properties ? readIdentifier(properties[key]) : undefined;
}

function firstObject(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return readObject(value[0]);
  }

  return readObject(value);
}

function buildDisplayName(contact: HubspotLeadContact): string {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
  return fullName || contact.email;
}

export function extractHubspotLeadContact(payload: Record<string, unknown>): HubspotLeadContact {
  const contactPayload =
    readObject(payload.contact) ?? readObject(payload.lead) ?? readObject(payload.properties) ?? payload;
  const email = readNestedString(contactPayload, "email");

  if (!email) {
    throw new Error("HUBSPOT_CONNECTOR_EVENT_EMAIL_REQUIRED");
  }

  const customProperties = readObject(contactPayload.customProperties);

  return {
    ...(readNestedString(contactPayload, "companyName") ??
    readNestedString(contactPayload, "company")
      ? {
          companyName:
            readNestedString(contactPayload, "companyName") ??
            readNestedString(contactPayload, "company")
        }
      : {}),
    ...(customProperties ? { customProperties } : {}),
    email: email.toLowerCase(),
    ...(readNestedString(contactPayload, "firstName") ??
    readNestedString(contactPayload, "firstname")
      ? {
          firstName:
            readNestedString(contactPayload, "firstName") ??
            readNestedString(contactPayload, "firstname")
        }
      : {}),
    ...(readNestedString(contactPayload, "lastName") ??
    readNestedString(contactPayload, "lastname")
      ? {
          lastName:
            readNestedString(contactPayload, "lastName") ??
            readNestedString(contactPayload, "lastname")
        }
      : {}),
    ...(readNestedString(contactPayload, "leadStatus") ??
    readNestedString(contactPayload, "hs_lead_status")
      ? {
          leadStatus:
            readNestedString(contactPayload, "leadStatus") ??
            readNestedString(contactPayload, "hs_lead_status")
        }
      : {}),
    ...(readNestedString(contactPayload, "lifecycleStage") ??
    readNestedString(contactPayload, "lifecyclestage")
      ? {
          lifecycleStage:
            readNestedString(contactPayload, "lifecycleStage") ??
            readNestedString(contactPayload, "lifecyclestage")
        }
      : {}),
    ...(readNestedString(contactPayload, "phone")
      ? { phone: readNestedString(contactPayload, "phone") }
      : {})
  };
}

function extractHubspotObjectId(payload: Record<string, unknown>): string | undefined {
  const hubspotPayload = firstObject(payload.hubspot);
  const rootObjectId =
    readNestedIdentifier(payload, "objectId") ??
    readNestedIdentifier(payload, "hubspotObjectId") ??
    readNestedIdentifier(payload, "contactId") ??
    readNestedIdentifier(payload, "hs_object_id");
  const hubspotObjectId = hubspotPayload
    ? readNestedIdentifier(hubspotPayload, "objectId") ??
      readNestedIdentifier(hubspotPayload, "hubspotObjectId") ??
      readNestedIdentifier(hubspotPayload, "contactId") ??
      readNestedIdentifier(hubspotPayload, "hs_object_id")
    : undefined;

  return rootObjectId ?? hubspotObjectId;
}

function hubspotPropertiesToContact(properties: Record<string, unknown>): HubspotLeadContact {
  const email = readNestedString(properties, "email");
  if (!email) {
    throw new Error("HUBSPOT_CONTACT_EMAIL_REQUIRED");
  }

  return {
    ...(readNestedString(properties, "company")
      ? { companyName: readNestedString(properties, "company") }
      : {}),
    email: email.toLowerCase(),
    ...(readNestedString(properties, "firstname")
      ? { firstName: readNestedString(properties, "firstname") }
      : {}),
    ...(readNestedString(properties, "lastname")
      ? { lastName: readNestedString(properties, "lastname") }
      : {}),
    ...(readNestedString(properties, "hs_lead_status")
      ? { leadStatus: readNestedString(properties, "hs_lead_status") }
      : {}),
    ...(readNestedString(properties, "lifecyclestage")
      ? { lifecycleStage: readNestedString(properties, "lifecyclestage") }
      : {}),
    ...(readNestedString(properties, "phone") ? { phone: readNestedString(properties, "phone") } : {})
  };
}

async function resolveConnectorAccount(input: {
  accountKey?: string | undefined;
  connectorAccountId?: string | undefined;
  organizationId: string;
  provider: "hubspot" | "omie" | "slack" | "stripe" | "zenvia";
  tenantId: string;
}) {
  if (input.connectorAccountId) {
    return prisma.connectorAccount.findFirst({
      include: {
        credentials: true
      },
      where: {
        id: input.connectorAccountId,
        organizationId: input.organizationId,
        tenantId: input.tenantId
      }
    });
  }

  return prisma.connectorAccount.findFirst({
    include: {
      credentials: true
    },
    orderBy: {
      createdAt: "asc"
    },
    where: {
      accountKey: input.accountKey ?? "primary",
      organizationId: input.organizationId,
      provider: input.provider,
      status: {
        in: ["active", "attention", "pending", "pending_token_exchange", "syncing"]
      },
      tenantId: input.tenantId
    }
  });
}

function decryptCredentialValue(input: {
  config: WorkerConfig;
  encryptedValue: string;
}): string {
  return decryptConnectorToken(input.encryptedValue, {
    allowLegacyPlaintext: input.config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
    secret: input.config.AUTH_MFA_ENCRYPTION_KEY
  });
}

async function resolveHubspotCredentials(input: {
  accountKey?: string | undefined;
  config: WorkerConfig;
  connectorAccountId?: string | undefined;
  organizationId: string;
  tenantId: string;
}): Promise<{
  accessToken?: string | undefined;
  connectorAccountId?: string | undefined;
}> {
  const account = await resolveConnectorAccount({
    ...input,
    provider: "hubspot"
  });
  const credential = account
    ? findConnectorCredentialByType(account.credentials, [
        "accessToken",
        "apiKey",
        "privateAppToken"
      ])
    : undefined;

  if (credential) {
    return {
      accessToken: decryptCredentialValue({
        config: input.config,
        encryptedValue: credential.encryptedValue
      }),
      connectorAccountId: account?.id
    };
  }

  return {
    ...(account?.id ? { connectorAccountId: account.id } : {})
  };
}

async function resolveSlackCredentials(input: {
  accountKey?: string | undefined;
  config: WorkerConfig;
  connectorAccountId?: string | undefined;
  organizationId: string;
  tenantId: string;
}): Promise<{
  botToken?: string | undefined;
  connectorAccountId?: string | undefined;
}> {
  const account = await resolveConnectorAccount({
    ...input,
    provider: "slack"
  });
  const credential = account
    ? findConnectorCredentialByType(account.credentials, [
        "botToken",
        "accessToken",
        "apiKey"
      ])
    : undefined;

  if (credential) {
    return {
      botToken: decryptCredentialValue({
        config: input.config,
        encryptedValue: credential.encryptedValue
      }),
      connectorAccountId: account?.id
    };
  }

  return {
    ...(account?.id ? { connectorAccountId: account.id } : {})
  };
}

async function resolveOmieCredentials(input: {
  accountKey?: string | undefined;
  config: WorkerConfig;
  connectorAccountId?: string | undefined;
  organizationId: string;
  tenantId: string;
}): Promise<{
  appKey?: string | undefined;
  appSecret?: string | undefined;
  connectorAccountId?: string | undefined;
}> {
  const account = await resolveConnectorAccount({
    ...input,
    provider: "omie"
  });
  const appKeyCredential = account
    ? findConnectorCredentialByType(account.credentials, ["appKey"])
    : undefined;
  const appSecretCredential = account
    ? findConnectorCredentialByType(account.credentials, ["appSecret"])
    : undefined;

  return {
    ...(appKeyCredential
      ? {
          appKey: decryptCredentialValue({
            config: input.config,
            encryptedValue: appKeyCredential.encryptedValue
          })
        }
      : {}),
    ...(appSecretCredential
      ? {
          appSecret: decryptCredentialValue({
            config: input.config,
            encryptedValue: appSecretCredential.encryptedValue
          })
        }
      : {}),
    ...(account?.id ? { connectorAccountId: account.id } : {})
  };
}

async function resolveStripeCredentials(input: {
  accountKey?: string | undefined;
  config: WorkerConfig;
  connectorAccountId?: string | undefined;
  organizationId: string;
  tenantId: string;
}): Promise<{
  apiKey?: string | undefined;
  connectorAccountId?: string | undefined;
}> {
  const account = await resolveConnectorAccount({
    ...input,
    provider: "stripe"
  });
  const credential = account
    ? findConnectorCredentialByType(account.credentials, ["apiKey"])
    : undefined;

  if (credential) {
    return {
      apiKey: decryptCredentialValue({
        config: input.config,
        encryptedValue: credential.encryptedValue
      }),
      connectorAccountId: account?.id
    };
  }

  return {
    ...(account?.id ? { connectorAccountId: account.id } : {})
  };
}

async function resolveZenviaCredentials(input: {
  accountKey?: string | undefined;
  config: WorkerConfig;
  connectorAccountId?: string | undefined;
  organizationId: string;
  tenantId: string;
}): Promise<{
  apiKey?: string | undefined;
  connectorAccountId?: string | undefined;
}> {
  const account = await resolveConnectorAccount({
    ...input,
    provider: "zenvia"
  });
  const credential = account
    ? findConnectorCredentialByType(account.credentials, ["apiKey", "accessToken"])
    : undefined;

  if (credential) {
    return {
      apiKey: decryptCredentialValue({
        config: input.config,
        encryptedValue: credential.encryptedValue
      }),
      connectorAccountId: account?.id
    };
  }

  return {
    ...(account?.id ? { connectorAccountId: account.id } : {})
  };
}

function buildZenviaCorrelationId(message: ZenviaMessagePayload): string {
  return `zenvia:${message.channel}:${message.from}:${message.to}`;
}

async function persistZenviaConversation(input: {
  connectorAccountId?: string | undefined;
  event: ConnectorEventJobPayload;
  externalMessageId?: string | null | undefined;
  message: ZenviaMessagePayload;
  response: unknown;
}): Promise<{
  conversationMessageId: string;
  threadId: string;
}> {
  const thread = await ensureConversationThread({
    channel: "zenvia",
    ...(input.connectorAccountId ? { connectorAccountId: input.connectorAccountId } : {}),
    correlationId: buildZenviaCorrelationId(input.message),
    leadReference: input.message.to,
    metadata: {
      channel: input.message.channel,
      from: input.message.from,
      provider: "zenvia",
      to: input.message.to
    },
    organizationId: input.event.organizationId,
    subject: `${input.message.channel}:${input.message.to}`,
    tenantId: input.event.tenantId
  });
  const conversationMessage = await createConversationMessage({
    content: {
      channel: input.message.channel,
      from: input.message.from,
      text: input.message.text,
      to: input.message.to,
      type: "zenvia_outbound"
    },
    direction: "outbound",
    ...(input.externalMessageId ? { externalMessageId: input.externalMessageId } : {}),
    metadata: {
      deliveryStatus: "queued",
      eventId: input.event.eventId,
      externalEventId: input.event.externalEventId,
      provider: "zenvia",
      providerMessageId: input.externalMessageId ?? null,
      providerResponse: input.response ?? null
    },
    organizationId: input.event.organizationId,
    role: "assistant",
    tenantId: input.event.tenantId,
    threadId: thread.id
  });

  return {
    conversationMessageId: conversationMessage.id,
    threadId: thread.id
  };
}

async function resolveHubspotLeadContact(input: {
  config: WorkerConfig;
  credentials: {
    accessToken?: string | undefined;
  };
  event: ConnectorEventJobPayload;
}): Promise<HubspotLeadContact> {
  try {
    return extractHubspotLeadContact(input.event.payload);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "HUBSPOT_CONNECTOR_EVENT_EMAIL_REQUIRED") {
      throw error;
    }
  }

  const objectId = extractHubspotObjectId(input.event.payload);
  if (!objectId) {
    throw new Error("HUBSPOT_CONNECTOR_EVENT_EMAIL_OR_OBJECT_ID_REQUIRED");
  }
  if (!input.credentials.accessToken) {
    throw new Error("HUBSPOT_CONTACT_LOOKUP_CREDENTIAL_REQUIRED");
  }

  const adapter = new HubspotCrmAdapter({
    accessToken: input.credentials.accessToken,
    baseUrl: input.config.HUBSPOT_BASE_URL
  });
  const record = await adapter.getContactById(objectId);

  return hubspotPropertiesToContact(record.properties);
}

async function persistLocalLead(input: {
  contact: HubspotLeadContact;
  event: ConnectorEventJobPayload;
}) {
  const name = buildDisplayName(input.contact);

  return prisma.customer.upsert({
    create: {
      email: input.contact.email,
      metadata: toJsonValue({
        companyName: input.contact.companyName ?? null,
        eventId: input.event.eventId,
        externalEventId: input.event.externalEventId,
        provider: input.event.provider,
        source: "connector-webhook"
      }),
      name,
      organizationId: input.event.organizationId,
      status: "lead",
      tenantId: input.event.tenantId
    },
    update: {
      metadata: toJsonValue({
        companyName: input.contact.companyName ?? null,
        eventId: input.event.eventId,
        externalEventId: input.event.externalEventId,
        provider: input.event.provider,
        source: "connector-webhook"
      }),
      name,
      status: "lead"
    },
    where: {
      tenantId_email: {
        email: input.contact.email,
        tenantId: input.event.tenantId
      }
    }
  });
}

function mergeConnectorMetadata(
  currentValue: Prisma.JsonValue | null | undefined,
  patch: Record<string, unknown>
): Prisma.InputJsonValue {
  return {
    ...(readObject(currentValue) ?? {}),
    ...patch
  } as Prisma.InputJsonValue;
}

async function claimInboundEventProcessing(
  event: ConnectorEventJobPayload,
  currentAttempt: number
): Promise<boolean> {
  const result = await prisma.crmSyncEvent.updateMany({
    data: {
      responseBody: JSON.stringify({
        action: event.action,
        attempt: currentAttempt,
        externalEventId: event.externalEventId,
        status: "processing"
      }),
      responseStatus: 102
    },
    where: {
      id: event.eventId,
      responseStatus: 202
    }
  });

  return result.count > 0;
}

async function updateInboundEventStatus(input: {
  currentAttempt: number;
  durationMs?: number | undefined;
  error?: ReturnType<typeof serializeConnectorError> | undefined;
  event: ConnectorEventJobPayload;
  externalId?: string | null | undefined;
  nextRetryAt?: Date | null | undefined;
  responseStatus: number;
  status: "failed" | "processing" | "retrying" | "success";
}) {
  await prisma.crmSyncEvent.update({
    data: {
      responseBody: JSON.stringify({
        action: input.event.action,
        attempt: input.currentAttempt,
        ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
        ...(input.error ? { error: input.error } : {}),
        eventType: input.event.eventType,
        ...(input.externalId ? { externalId: input.externalId } : {}),
        externalEventId: input.event.externalEventId,
        ...(input.nextRetryAt ? { nextRetryAt: input.nextRetryAt.toISOString() } : {}),
        status: input.status
      }),
      responseStatus: input.responseStatus
    },
    where: {
      id: input.event.eventId
    }
  });
}

async function touchConnectorCursor(input: {
  connectorAccountId?: string | undefined;
  currentAttempt: number;
  durationMs?: number | undefined;
  error?: ReturnType<typeof serializeConnectorError> | undefined;
  event: ConnectorEventJobPayload;
  externalId?: string | null | undefined;
  nextRetryAt?: Date | null | undefined;
  scope: string;
  status: "failed" | "retrying" | "success";
}) {
  if (!input.connectorAccountId) {
    return;
  }

  const now = new Date();
  const accountStatus =
    input.status === "success" ? "active" : input.status === "retrying" ? "syncing" : "attention";
  const currentAccount = await prisma.connectorAccount.findUnique({
    select: {
      metadata: true
    },
    where: {
      id: input.connectorAccountId
    }
  });

  await prisma.connectorAccount.update({
    data: {
      lastSyncAt: now,
      metadata: mergeConnectorMetadata(currentAccount?.metadata, {
        lastExecution: {
          action: input.event.action,
          attempt: input.currentAttempt,
          ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
          ...(input.error ? { error: input.error } : { error: null }),
          eventId: input.event.eventId,
          eventType: input.event.eventType,
          ...(input.externalId ? { externalId: input.externalId } : {}),
          externalEventId: input.event.externalEventId,
          occurredAt: input.event.occurredAt,
          ranAt: now.toISOString(),
          status: input.status
        }
      }),
      status: accountStatus
    },
    where: {
      id: input.connectorAccountId
    }
  });

  await prisma.connectorSyncCursor.upsert({
    create: {
      connectorAccountId: input.connectorAccountId,
      cursor: toJsonValue({}),
      errorMessage: input.error?.message ?? null,
      lastSyncAt: now,
      metadata: toJsonValue({
        action: input.event.action,
        attempt: input.currentAttempt,
        ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
        ...(input.error ? { errorCode: input.error.code } : { errorCode: null }),
        eventType: input.event.eventType,
        externalId: input.externalId ?? null,
        externalEventId: input.event.externalEventId,
        eventId: input.event.eventId
      }),
      nextSyncAt: input.nextRetryAt ?? null,
      organizationId: input.event.organizationId,
      scope: input.scope,
      status: input.status,
      tenantId: input.event.tenantId
    },
    update: {
      errorMessage: input.error?.message ?? null,
      lastSyncAt: now,
      metadata: toJsonValue({
        action: input.event.action,
        attempt: input.currentAttempt,
        ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
        ...(input.error ? { errorCode: input.error.code } : { errorCode: null }),
        eventType: input.event.eventType,
        externalId: input.externalId ?? null,
        externalEventId: input.event.externalEventId,
        eventId: input.event.eventId
      }),
      nextSyncAt: input.nextRetryAt ?? null,
      status: input.status
    },
    where: {
      connectorAccountId_scope: {
        connectorAccountId: input.connectorAccountId,
        scope: input.scope
      }
    }
  });
}

async function persistConnectorLog(input: {
  currentAttempt: number;
  event: ConnectorEventJobPayload;
  requestBody: Record<string, unknown>;
  responseBody: unknown;
  responseStatus?: number | undefined;
}) {
  await prisma.crmSyncEvent.create({
    data: {
      direction: "outbound",
      eventType: input.event.action,
      externalEventId: input.event.externalEventId,
      organizationId: input.event.organizationId,
      provider: input.event.provider,
      requestBody: toJsonValue({
        action: input.event.action,
        attempt: input.currentAttempt,
        eventId: input.event.eventId,
        eventType: input.event.eventType,
        externalEventId: input.event.externalEventId,
        ...input.requestBody
      }),
      responseBody: JSON.stringify(input.responseBody),
      responseStatus: input.responseStatus,
      tenantId: input.event.tenantId
    }
  });
}

export async function processConnectorEventJob(
  event: ConnectorEventJobPayload,
  options: {
    config?: WorkerConfig | undefined;
    job?: Pick<Job<ConnectorEventJobPayload, unknown, string>, "attemptsMade" | "opts"> | undefined;
    runtime?: ConnectorRuntime | undefined;
  } = {}
): Promise<void> {
  const config = options.config ?? getWorkerConfig();
  const runtime = options.runtime ?? createDefaultConnectorRuntime();
  const attempt = resolveConnectorAttemptState(options.job);
  const startedAt = Date.now();
  const claimed = await claimInboundEventProcessing(event, attempt.currentAttempt);

  if (!claimed) {
    logger.info(
      buildConnectorLogFields({
        action: event.action,
        durationMs: Date.now() - startedAt,
        event,
        status: "skipped"
      }),
      "Connector event skipped because it was already processed or is in progress"
    );
    return;
  }

  if (event.provider === "hubspot") {
    let credentials:
      | Awaited<ReturnType<typeof resolveHubspotCredentials>>
      | undefined;
    let contact: HubspotLeadContact | undefined;
    let customer:
      | Awaited<ReturnType<typeof persistLocalLead>>
      | undefined;

    try {
      credentials = await resolveHubspotCredentials({
        ...(event.accountKey ? { accountKey: event.accountKey } : {}),
        config,
        ...(event.connectorAccountId ? { connectorAccountId: event.connectorAccountId } : {}),
        organizationId: event.organizationId,
        tenantId: event.tenantId
      });
      contact = await resolveHubspotLeadContact({
        config,
        credentials,
        event
      });
      customer = await persistLocalLead({
        contact,
        event
      });

      const result = await runtime.execute({
        action: "crm.contact.upsert",
        credentials: {
          ...(credentials.accessToken ? { accessToken: credentials.accessToken } : {}),
          baseUrl: config.HUBSPOT_BASE_URL
        },
        idempotencyKey: event.externalEventId,
        metadata: {
          customerId: customer.id,
          eventId: event.eventId,
          externalEventId: event.externalEventId
        },
        payload: contact,
        provider: "hubspot"
      });
      const durationMs = Date.now() - startedAt;

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          contact,
          customerId: customer.id,
          eventId: event.eventId,
          request: result.request ?? null
        },
        responseBody: {
          durationMs,
          externalId: result.externalId,
          response: result.response ?? null,
          status: result.status
        },
        responseStatus: result.statusCode
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId: result.externalId,
        responseStatus: result.statusCode ?? 200,
        status: "success"
      });
      await touchConnectorCursor({
        connectorAccountId: credentials.connectorAccountId,
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId: result.externalId,
        scope: "crm:contacts",
        status: "success"
      });

      logger.info(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          event,
          status: "success"
        }),
        "HubSpot connector event processed"
      );
      return;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const connectorError = ensureConnectorExecutionError(error, {
        action: event.action,
        provider: event.provider
      });
      const serializedError = serializeConnectorError(connectorError);
      const shouldRetry = connectorError.retryable && attempt.hasRemainingAttempts;

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          ...(contact ? { contact } : {}),
          ...(customer ? { customerId: customer.id } : {}),
          eventId: event.eventId
        },
        responseBody: {
          durationMs,
          error: serializedError,
          nextRetryAt: shouldRetry ? attempt.nextRetryAt?.toISOString() ?? null : null,
          status: shouldRetry ? "retrying" : "failed"
        },
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        error: serializedError,
        event,
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500,
        status: shouldRetry ? "retrying" : "failed"
      });
      await touchConnectorCursor({
        ...(credentials?.connectorAccountId
          ? { connectorAccountId: credentials.connectorAccountId }
          : {}),
        currentAttempt: attempt.currentAttempt,
        durationMs,
        error: serializedError,
        event,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        scope: "crm:contacts",
        status: shouldRetry ? "retrying" : "failed"
      });

      if (shouldRetry) {
        logger.warn(
          buildConnectorLogFields({
            action: event.action,
            durationMs,
            error: serializedError,
            event,
            status: "retrying"
          }),
          "HubSpot connector event will be retried"
        );
        throw connectorError;
      }

      logger.error(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          error: serializedError,
          event,
          status: "failed"
        }),
        "HubSpot connector event failed permanently"
      );

      throw new UnrecoverableError(connectorError.message);
    }
  }

  if (event.provider === "omie") {
    let credentials:
      | Awaited<ReturnType<typeof resolveOmieCredentials>>
      | undefined;
    let customerPayload:
      | ReturnType<typeof extractOmieCustomerPayload>
      | undefined;
    let salesOrderPayload:
      | ReturnType<typeof extractOmieSalesOrderPayload>
      | undefined;
    let customerResult:
      | Awaited<ReturnType<ConnectorRuntime["execute"]>>
      | undefined;
    let salesOrderResult:
      | Awaited<ReturnType<ConnectorRuntime["execute"]>>
      | undefined;

    try {
      credentials = await resolveOmieCredentials({
        ...(event.accountKey ? { accountKey: event.accountKey } : {}),
        config,
        ...(event.connectorAccountId ? { connectorAccountId: event.connectorAccountId } : {}),
        organizationId: event.organizationId,
        tenantId: event.tenantId
      });

      if (event.action === "erp.customer.upsert") {
        customerPayload = extractOmieCustomerPayload(event.payload, {
          required: true
        });
      } else {
        customerPayload = extractOmieCustomerPayload(event.payload);
      }

      if (customerPayload) {
        customerResult = await runtime.execute({
          action: "erp.customer.upsert",
          credentials: {
            ...(credentials.appKey ? { appKey: credentials.appKey } : {}),
            ...(credentials.appSecret ? { appSecret: credentials.appSecret } : {}),
            baseUrl: config.OMIE_BASE_URL
          },
          idempotencyKey: event.externalEventId,
          metadata: {
            eventId: event.eventId,
            externalEventId: event.externalEventId
          },
          payload: customerPayload,
          provider: "omie"
        });
      }

      salesOrderPayload = extractOmieSalesOrderPayload(event.payload, {
        fallbackCustomerCode: customerResult?.externalId ?? undefined,
        fallbackCustomerIntegrationCode: customerPayload?.externalCode,
        required: event.action === "erp.sales-order.create"
      });

      if (salesOrderPayload) {
        salesOrderResult = await runtime.execute({
          action: "erp.sales-order.create",
          credentials: {
            ...(credentials.appKey ? { appKey: credentials.appKey } : {}),
            ...(credentials.appSecret ? { appSecret: credentials.appSecret } : {}),
            baseUrl: config.OMIE_BASE_URL
          },
          idempotencyKey: event.externalEventId,
          metadata: {
            eventId: event.eventId,
            externalEventId: event.externalEventId,
            ...(customerResult?.externalId ? { customerExternalId: customerResult.externalId } : {})
          },
          payload: salesOrderPayload,
          provider: "omie"
        });
      }

      const durationMs = Date.now() - startedAt;
      const externalId = salesOrderResult?.externalId ?? customerResult?.externalId;
      const scope =
        salesOrderPayload && customerPayload
          ? "erp:customer-orders"
          : salesOrderPayload
            ? "erp:sales-orders"
            : "erp:customers";

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          ...(customerPayload ? { customer: customerPayload } : {}),
          eventId: event.eventId,
          ...(customerResult?.request ? { customerRequest: customerResult.request } : {}),
          ...(salesOrderPayload ? { salesOrder: salesOrderPayload } : {}),
          ...(salesOrderResult?.request ? { salesOrderRequest: salesOrderResult.request } : {})
        },
        responseBody: {
          durationMs,
          externalId: externalId ?? null,
          status: "success",
          steps: {
            ...(customerResult
              ? {
                  customer: {
                    externalId: customerResult.externalId ?? null,
                    response: customerResult.response ?? null,
                    status: customerResult.status
                  }
                }
              : {}),
            ...(salesOrderResult
              ? {
                  salesOrder: {
                    externalId: salesOrderResult.externalId ?? null,
                    response: salesOrderResult.response ?? null,
                    status: salesOrderResult.status
                  }
                }
              : {})
          }
        },
        responseStatus: salesOrderResult?.statusCode ?? customerResult?.statusCode ?? 200
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId,
        responseStatus: salesOrderResult?.statusCode ?? customerResult?.statusCode ?? 200,
        status: "success"
      });
      await touchConnectorCursor({
        connectorAccountId: credentials.connectorAccountId,
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId,
        scope,
        status: "success"
      });

      logger.info(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          event,
          status: "success"
        }),
        "Omie connector event processed"
      );
      return;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const connectorError = ensureConnectorExecutionError(error, {
        action: event.action,
        provider: event.provider
      });
      const serializedError = serializeConnectorError(connectorError);
      const shouldRetry = connectorError.retryable && attempt.hasRemainingAttempts;
      const scope =
        salesOrderPayload && customerPayload
          ? "erp:customer-orders"
          : event.action === "erp.sales-order.create" || salesOrderPayload
            ? "erp:sales-orders"
            : "erp:customers";

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          ...(customerPayload ? { customer: customerPayload } : {}),
          eventId: event.eventId,
          ...(salesOrderPayload ? { salesOrder: salesOrderPayload } : {})
        },
        responseBody: {
          durationMs,
          error: serializedError,
          nextRetryAt: shouldRetry ? attempt.nextRetryAt?.toISOString() ?? null : null,
          status: shouldRetry ? "retrying" : "failed",
          steps: {
            ...(customerResult
              ? {
                  customer: {
                    externalId: customerResult.externalId ?? null,
                    response: customerResult.response ?? null,
                    status: customerResult.status
                  }
                }
              : {}),
            ...(salesOrderResult
              ? {
                  salesOrder: {
                    externalId: salesOrderResult.externalId ?? null,
                    response: salesOrderResult.response ?? null,
                    status: salesOrderResult.status
                  }
                }
              : {})
          }
        },
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        error: serializedError,
        event,
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500,
        status: shouldRetry ? "retrying" : "failed"
      });
      await touchConnectorCursor({
        ...(credentials?.connectorAccountId
          ? { connectorAccountId: credentials.connectorAccountId }
          : {}),
        currentAttempt: attempt.currentAttempt,
        durationMs,
        error: serializedError,
        event,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        scope,
        status: shouldRetry ? "retrying" : "failed"
      });

      if (shouldRetry) {
        logger.warn(
          buildConnectorLogFields({
            action: event.action,
            durationMs,
            error: serializedError,
            event,
            status: "retrying"
          }),
          "Omie connector event will be retried"
        );
        throw connectorError;
      }

      logger.error(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          error: serializedError,
          event,
          status: "failed"
        }),
        "Omie connector event failed permanently"
      );

      throw new UnrecoverableError(connectorError.message);
    }
  }

  if (event.provider === "slack") {
    let credentials:
      | Awaited<ReturnType<typeof resolveSlackCredentials>>
      | undefined;
    let message: SlackMessagePayload | undefined;

    try {
      credentials = await resolveSlackCredentials({
        ...(event.accountKey ? { accountKey: event.accountKey } : {}),
        config,
        ...(event.connectorAccountId ? { connectorAccountId: event.connectorAccountId } : {}),
        organizationId: event.organizationId,
        tenantId: event.tenantId
      });
      message = extractSlackMessagePayload(event.payload);

      const result = await runtime.execute({
        action: "message.send",
        credentials: {
          ...(credentials.botToken ? { botToken: credentials.botToken } : {})
        },
        idempotencyKey: event.externalEventId,
        metadata: {
          eventId: event.eventId,
          externalEventId: event.externalEventId
        },
        payload: message,
        provider: "slack"
      });
      const durationMs = Date.now() - startedAt;

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          eventId: event.eventId,
          message,
          request: result.request ?? null
        },
        responseBody: {
          durationMs,
          externalId: result.externalId,
          response: result.response ?? null,
          status: result.status
        },
        responseStatus: result.statusCode
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId: result.externalId,
        responseStatus: result.statusCode ?? 200,
        status: "success"
      });
      await touchConnectorCursor({
        connectorAccountId: credentials.connectorAccountId,
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId: result.externalId,
        scope: "messaging:messages",
        status: "success"
      });

      logger.info(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          event,
          status: "success"
        }),
        "Slack connector event processed"
      );
      return;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const connectorError = ensureConnectorExecutionError(error, {
        action: event.action,
        provider: event.provider
      });
      const serializedError = serializeConnectorError(connectorError);
      const shouldRetry = connectorError.retryable && attempt.hasRemainingAttempts;

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          eventId: event.eventId,
          ...(message ? { message } : {})
        },
        responseBody: {
          durationMs,
          error: serializedError,
          nextRetryAt: shouldRetry ? attempt.nextRetryAt?.toISOString() ?? null : null,
          status: shouldRetry ? "retrying" : "failed"
        },
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        error: serializedError,
        event,
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500,
        status: shouldRetry ? "retrying" : "failed"
      });
      await touchConnectorCursor({
        ...(credentials?.connectorAccountId
          ? { connectorAccountId: credentials.connectorAccountId }
          : {}),
        currentAttempt: attempt.currentAttempt,
        durationMs,
        error: serializedError,
        event,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        scope: "messaging:messages",
        status: shouldRetry ? "retrying" : "failed"
      });

      if (shouldRetry) {
        logger.warn(
          buildConnectorLogFields({
            action: event.action,
            durationMs,
            error: serializedError,
            event,
            status: "retrying"
          }),
          "Slack connector event will be retried"
        );
        throw connectorError;
      }

      logger.error(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          error: serializedError,
          event,
          status: "failed"
        }),
        "Slack connector event failed permanently"
      );

      throw new UnrecoverableError(connectorError.message);
    }
  }

  if (event.provider === "zenvia") {
    let credentials:
      | Awaited<ReturnType<typeof resolveZenviaCredentials>>
      | undefined;
    let message: ZenviaMessagePayload | undefined;
    let conversation:
      | Awaited<ReturnType<typeof persistZenviaConversation>>
      | undefined;

    try {
      credentials = await resolveZenviaCredentials({
        ...(event.accountKey ? { accountKey: event.accountKey } : {}),
        config,
        ...(event.connectorAccountId ? { connectorAccountId: event.connectorAccountId } : {}),
        organizationId: event.organizationId,
        tenantId: event.tenantId
      });
      message = extractZenviaMessagePayload(event.payload);

      const result = await runtime.execute({
        action: "message.send",
        credentials: {
          ...(credentials.apiKey ? { apiKey: credentials.apiKey } : {})
        },
        idempotencyKey: event.externalEventId,
        metadata: {
          eventId: event.eventId,
          externalEventId: event.externalEventId
        },
        payload: {
          ...message,
          externalId: event.externalEventId
        },
        provider: "zenvia"
      });
      conversation = await persistZenviaConversation({
        ...(credentials.connectorAccountId
          ? { connectorAccountId: credentials.connectorAccountId }
          : {}),
        event,
        externalMessageId: result.externalId,
        message,
        response: result.response ?? null
      });
      const durationMs = Date.now() - startedAt;

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          conversationMessageId: conversation.conversationMessageId,
          eventId: event.eventId,
          message: {
            ...message,
            externalId: event.externalEventId
          },
          request: result.request ?? null,
          threadId: conversation.threadId
        },
        responseBody: {
          durationMs,
          externalId: result.externalId,
          response: result.response ?? null,
          status: result.status
        },
        responseStatus: result.statusCode
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId: result.externalId,
        responseStatus: result.statusCode ?? 200,
        status: "success"
      });
      await touchConnectorCursor({
        connectorAccountId: credentials.connectorAccountId,
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId: result.externalId,
        scope: "messaging:messages",
        status: "success"
      });

      logger.info(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          event,
          status: "success"
        }),
        "Zenvia connector event processed"
      );
      return;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const connectorError = ensureConnectorExecutionError(error, {
        action: event.action,
        provider: event.provider
      });
      const serializedError = serializeConnectorError(connectorError);
      const shouldRetry = connectorError.retryable && attempt.hasRemainingAttempts;

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          ...(conversation ? { conversationMessageId: conversation.conversationMessageId } : {}),
          eventId: event.eventId,
          ...(message
            ? {
                message: {
                  ...message,
                  externalId: event.externalEventId
                }
              }
            : {}),
          ...(conversation ? { threadId: conversation.threadId } : {})
        },
        responseBody: {
          durationMs,
          error: serializedError,
          nextRetryAt: shouldRetry ? attempt.nextRetryAt?.toISOString() ?? null : null,
          status: shouldRetry ? "retrying" : "failed"
        },
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        error: serializedError,
        event,
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500,
        status: shouldRetry ? "retrying" : "failed"
      });
      await touchConnectorCursor({
        ...(credentials?.connectorAccountId
          ? { connectorAccountId: credentials.connectorAccountId }
          : {}),
        currentAttempt: attempt.currentAttempt,
        durationMs,
        error: serializedError,
        event,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        scope: "messaging:messages",
        status: shouldRetry ? "retrying" : "failed"
      });

      if (shouldRetry) {
        logger.warn(
          buildConnectorLogFields({
            action: event.action,
            durationMs,
            error: serializedError,
            event,
            status: "retrying"
          }),
          "Zenvia connector event will be retried"
        );
        throw connectorError;
      }

      logger.error(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          error: serializedError,
          event,
          status: "failed"
        }),
        "Zenvia connector event failed permanently"
      );

      throw new UnrecoverableError(connectorError.message);
    }
  }

  if (event.provider === "stripe") {
    let credentials:
      | Awaited<ReturnType<typeof resolveStripeCredentials>>
      | undefined;
    let payment: StripePaymentPayload | undefined;

    try {
      credentials = await resolveStripeCredentials({
        ...(event.accountKey ? { accountKey: event.accountKey } : {}),
        config,
        ...(event.connectorAccountId ? { connectorAccountId: event.connectorAccountId } : {}),
        organizationId: event.organizationId,
        tenantId: event.tenantId
      });
      payment = extractStripePaymentPayload(event.payload);

      const result = await runtime.execute({
        action: "payment.read",
        credentials: {
          ...(credentials.apiKey ? { apiKey: credentials.apiKey } : {})
        },
        idempotencyKey: event.externalEventId,
        metadata: {
          eventId: event.eventId,
          externalEventId: event.externalEventId
        },
        payload: payment,
        provider: "stripe"
      });
      const durationMs = Date.now() - startedAt;

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          eventId: event.eventId,
          payment,
          request: result.request ?? null
        },
        responseBody: {
          durationMs,
          externalId: result.externalId,
          response: result.response ?? null,
          status: result.status
        },
        responseStatus: result.statusCode
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId: result.externalId,
        responseStatus: result.statusCode ?? 200,
        status: "success"
      });
      await touchConnectorCursor({
        connectorAccountId: credentials.connectorAccountId,
        currentAttempt: attempt.currentAttempt,
        durationMs,
        event,
        externalId: result.externalId,
        scope: "payments:events",
        status: "success"
      });

      logger.info(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          event,
          status: "success"
        }),
        "Stripe connector event processed"
      );
      return;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const connectorError = ensureConnectorExecutionError(error, {
        action: event.action,
        provider: event.provider
      });
      const serializedError = serializeConnectorError(connectorError);
      const shouldRetry = connectorError.retryable && attempt.hasRemainingAttempts;

      await persistConnectorLog({
        currentAttempt: attempt.currentAttempt,
        event,
        requestBody: {
          eventId: event.eventId,
          ...(payment ? { payment } : {})
        },
        responseBody: {
          durationMs,
          error: serializedError,
          nextRetryAt: shouldRetry ? attempt.nextRetryAt?.toISOString() ?? null : null,
          status: shouldRetry ? "retrying" : "failed"
        },
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500
      });
      await updateInboundEventStatus({
        currentAttempt: attempt.currentAttempt,
        durationMs,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        error: serializedError,
        event,
        responseStatus: shouldRetry ? 202 : connectorError.statusCode ?? 500,
        status: shouldRetry ? "retrying" : "failed"
      });
      await touchConnectorCursor({
        ...(credentials?.connectorAccountId
          ? { connectorAccountId: credentials.connectorAccountId }
          : {}),
        currentAttempt: attempt.currentAttempt,
        durationMs,
        error: serializedError,
        event,
        ...(shouldRetry ? { nextRetryAt: attempt.nextRetryAt } : {}),
        scope: "payments:events",
        status: shouldRetry ? "retrying" : "failed"
      });

      if (shouldRetry) {
        logger.warn(
          buildConnectorLogFields({
            action: event.action,
            durationMs,
            error: serializedError,
            event,
            status: "retrying"
          }),
          "Stripe connector event will be retried"
        );
        throw connectorError;
      }

      logger.error(
        buildConnectorLogFields({
          action: event.action,
          durationMs,
          error: serializedError,
          event,
          status: "failed"
        }),
        "Stripe connector event failed permanently"
      );

      throw new UnrecoverableError(connectorError.message);
    }
  }

  throw new Error(`UNSUPPORTED_CONNECTOR_EVENT_PROVIDER:${event.provider}`);
}
