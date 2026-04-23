import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type { ApiConfig } from "@birthub/config";
import {
  createDefaultConnectorRuntime,
  decryptConnectorToken,
  ensureConnectorExecutionError,
  serializeConnectorError,
  type NormalizedEvent
} from "@birthub/connectors-core";
import {
  findConnectorCredentialByType,
  getConnectorProviderDefinition,
  listConnectorProviderDefinitions,
  normalizeConnectorCredentialType,
  type ConnectorProviderDefinition
} from "@birthub/integrations";
import { Prisma, prisma } from "@birthub/database";
import { HubspotCrmAdapter } from "@birthub/integrations";
import { OmieErpAdapter } from "@birthub/integrations";
import { SlackMessageAdapter } from "@birthub/integrations";
import { StripePaymentAdapter } from "@birthub/integrations";
import { ZenviaMessageAdapter } from "@birthub/integrations";
import { createLogger } from "@birthub/logger";

import { enqueueConnectorEvent, enqueueCrmSync } from "../engagement/queues.js";
import { ProblemDetailsError } from "../../lib/problem-details.js";
import {
  normalizeHubspotConnectorEvent,
  normalizeSlackConnectorEvent,
  normalizeStripeConnectorEvent,
  normalizeZenviaConnectorEvent
} from "./normalized-events.js";
import { buildOmieSyncJob } from "./omie-sync.js";
import type {
  ConnectorWebhookIngestPayload,
  ZenviaStatusWebhookPayload
} from "./schemas.js";
import {
  buildStripeConnectorWebhookPayload,
  constructStripeConnectorEvent
} from "./stripe-webhook.js";
import { createConnectSession, finalizeConnectSession } from "./service.oauth.js";
import {
  normalizeCredentials,
  parseConnectorOauthState,
  providerSupportsAuthType,
  resolveConnectorAccount,
  resolveDefaultConnectorAuthType,
  sanitizeConnectorAccount,
  toJsonValue,
  upsertCredentials,
  type ConnectorAuthType,
  type ConnectorCredentialsRecord,
  type ConnectorOauthState,
  type ConnectorProvider
} from "./service.shared.js";

export type { ConnectorOauthState, ConnectorProvider };
export { parseConnectorOauthState };

const CONNECTOR_ACCOUNT_LIST_LIMIT = 250;
const logger = createLogger("connectors-service");
type HealthEnabledConnectorProvider = "hubspot" | "omie" | "slack" | "stripe" | "zenvia";
type WebhookEnabledConnectorProvider = "hubspot" | "slack" | "stripe" | "zenvia";

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeSignature(signature: string | undefined): string | null {
  if (!signature) {
    return null;
  }

  return signature.startsWith("sha256=") ? signature.slice("sha256=".length) : signature;
}

function hasMatchingHmacSignature(input: {
  payload: ConnectorWebhookIngestPayload;
  secretCandidates: readonly string[];
  signature: string;
}): boolean {
  return input.secretCandidates.some((secret) => {
    const expected = createHmac("sha256", secret)
      .update(JSON.stringify(input.payload))
      .digest("hex");

    return safeCompare(expected, input.signature);
  });
}

function verifyWebhookReceiverSignature(input: {
  config: ApiConfig;
  payload: ConnectorWebhookIngestPayload;
  signature?: string | undefined;
}): void {
  const signature = normalizeSignature(input.signature);

  if (
    !signature ||
    !hasMatchingHmacSignature({
      payload: input.payload,
      secretCandidates: input.config.jobHmacSecretCandidates,
      signature
    })
  ) {
    throw new ProblemDetailsError({
      detail: "Connector webhook receiver signature is invalid.",
      status: 401,
      title: "Unauthorized"
    });
  }
}

async function resolveWebhookOrganization(input: {
  organizationId?: string | undefined;
  tenantId?: string | undefined;
}) {
  if (!input.organizationId && !input.tenantId) {
    throw new ProblemDetailsError({
      detail: "Connector webhook payload must include organizationId or tenantId.",
      status: 400,
      title: "Invalid Connector Webhook"
    });
  }

  const organization = await prisma.organization.findFirst({
    where: {
      ...(input.organizationId ? { id: input.organizationId } : {}),
      ...(input.tenantId ? { tenantId: input.tenantId } : {})
    }
  });

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for connector webhook.",
      status: 404,
      title: "Not Found"
    });
  }

  return organization;
}

function readObject(value: Prisma.JsonValue | unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readDate(value: unknown): string | undefined {
  const candidate = readString(value);
  if (!candidate) {
    return undefined;
  }

  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
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

function buildConnectorLogContext(input: {
  action: string;
  duration?: number | undefined;
  error?: string | undefined;
  eventId?: string | undefined;
  provider: ConnectorProvider;
  status: string;
  tenantId: string;
}) {
  return {
    action: input.action,
    ...(typeof input.duration === "number" ? { duration: input.duration } : {}),
    ...(input.error ? { error: input.error } : {}),
    ...(input.eventId ? { eventId: input.eventId } : {}),
    provider: input.provider,
    status: input.status,
    tenantId: input.tenantId
  };
}

function isDuplicateExternalEventError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function resolveExistingInboundEvent(input: {
  externalEventId: string;
  provider: ConnectorProvider;
  tenantId: string;
}) {
  return prisma.crmSyncEvent.findFirst({
    where: {
      direction: "inbound",
      externalEventId: input.externalEventId,
      provider: input.provider,
      tenantId: input.tenantId
    }
  });
}

async function resolveWebhookConnectorAccount(input: {
  accountKey?: string | undefined;
  connectorAccountId?: string | undefined;
  organizationId: string;
  provider: ConnectorProvider;
  tenantId: string;
}) {
  if (input.connectorAccountId) {
    return prisma.connectorAccount.findFirst({
      include: {
        credentials: {
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      where: {
        id: input.connectorAccountId,
        organizationId: input.organizationId,
        provider: input.provider,
        tenantId: input.tenantId
      }
    });
  }

  return prisma.connectorAccount.findFirst({
    include: {
      credentials: {
        orderBy: {
          createdAt: "asc"
        }
      }
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

function resolveStripeWebhookSecret(input: {
  account: Awaited<ReturnType<typeof resolveWebhookConnectorAccount>>;
  config: ApiConfig;
}): string {
  const credential = input.account
    ? findConnectorCredentialByType(input.account.credentials, ["webhookSecret"])
    : undefined;

  if (!credential) {
    throw new ProblemDetailsError({
      detail: "Stripe connector webhook secret is not configured for this tenant.",
      status: 412,
      title: "Precondition Failed"
    });
  }

  return decryptConnectorToken(credential.encryptedValue, {
    allowLegacyPlaintext: input.config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
    secret: input.config.AUTH_MFA_ENCRYPTION_KEY
  });
}

function resolveZenviaWebhookSecret(input: {
  account: {
    credentials: Array<{
      credentialType: string;
      encryptedValue: string;
    }>;
  } | null;
  config: ApiConfig;
}): string {
  const credential = input.account
    ? findConnectorCredentialByType(input.account.credentials, ["webhookSecret"])
    : undefined;

  if (!credential) {
    throw new ProblemDetailsError({
      detail: "Zenvia webhook secret is not configured for this tenant.",
      status: 412,
      title: "Precondition Failed"
    });
  }

  return decryptConnectorToken(credential.encryptedValue, {
    allowLegacyPlaintext: input.config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
    secret: input.config.AUTH_MFA_ENCRYPTION_KEY
  });
}

async function updateConnectorHealthState(input: {
  accountId: string;
  checkedAt: Date;
  error?: unknown;
  status: "active" | "attention";
  summary: "healthy" | "unhealthy";
}) {
  const currentAccount = await prisma.connectorAccount.findUnique({
    select: {
      metadata: true
    },
    where: {
      id: input.accountId
    }
  });

  await prisma.connectorAccount.update({
    data: {
      metadata: mergeConnectorMetadata(currentAccount?.metadata, {
        connectorHealth: {
          checkedAt: input.checkedAt.toISOString(),
          ...(input.error ? { error: input.error } : { error: null }),
          status: input.summary
        }
      }),
      status: input.status
    },
    where: {
      id: input.accountId
    }
  });
}

function normalizeZenviaDeliveryStatus(code: string): "delivered" | "failed" | "processing" {
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode === "DELIVERED" || normalizedCode === "READ") {
    return "delivered";
  }

  if (normalizedCode === "REJECTED" || normalizedCode === "NOT_DELIVERED" || normalizedCode === "DELETED") {
    return "failed";
  }

  return "processing";
}

function buildZenviaStatusExternalEventId(payload: ZenviaStatusWebhookPayload): string {
  const explicit = readString(payload.id);
  if (explicit) {
    return explicit;
  }

  const messageId = readString(payload.message.id) ?? readString(payload.message.externalId) ?? "unknown";
  const occurredAt =
    readDate(payload.timestamp) ?? readDate(payload.createdAt) ?? "na";
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 12);

  return `zenvia:status:${messageId}:${payload.messageStatus.code}:${occurredAt}:${fingerprint}`;
}

function resolveZenviaStatusOccurredAt(payload: ZenviaStatusWebhookPayload): string {
  return readDate(payload.timestamp) ?? readDate(payload.createdAt) ?? new Date().toISOString();
}

async function updateConnectorExecutionState(input: {
  accountId: string;
  error?: Record<string, unknown> | null | undefined;
  eventId: string;
  eventType: string;
  executionStatus: "delivered" | "failed" | "processing";
  externalEventId: string;
  externalId?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
  occurredAt: string;
  scope: string;
}) {
  const now = new Date();
  const accountStatus =
    input.executionStatus === "failed"
      ? "attention"
      : input.executionStatus === "processing"
        ? "syncing"
        : "active";
  const currentAccount = await prisma.connectorAccount.findUnique({
    select: {
      metadata: true,
      organizationId: true,
      tenantId: true
    },
    where: {
      id: input.accountId
    }
  });

  if (!currentAccount) {
    throw new ProblemDetailsError({
      detail: "Connector account not found while updating execution state.",
      status: 404,
      title: "Not Found"
    });
  }

  await prisma.connectorAccount.update({
    data: {
      lastSyncAt: now,
      metadata: mergeConnectorMetadata(currentAccount.metadata, {
        lastExecution: {
          action: "message.status",
          ...(input.error ? { error: input.error } : { error: null }),
          eventId: input.eventId,
          eventType: input.eventType,
          ...(input.externalId ? { externalId: input.externalId } : {}),
          externalEventId: input.externalEventId,
          ...(input.metadata ? { metadata: input.metadata } : {}),
          occurredAt: input.occurredAt,
          ranAt: now.toISOString(),
          status: input.executionStatus
        }
      }),
      status: accountStatus
    },
    where: {
      id: input.accountId
    }
  });

  await prisma.connectorSyncCursor.upsert({
    create: {
      connectorAccountId: input.accountId,
      cursor: toJsonValue({}),
      errorMessage:
        input.error && typeof input.error.message === "string" ? input.error.message : null,
      lastSyncAt: now,
      metadata: toJsonValue({
        action: "message.status",
        ...(input.error && typeof input.error.code === "string" ? { errorCode: input.error.code } : {}),
        eventId: input.eventId,
        eventType: input.eventType,
        externalId: input.externalId ?? null,
        externalEventId: input.externalEventId,
        ...(input.metadata ? { metadata: input.metadata } : {})
      }),
      nextSyncAt: null,
      organizationId: currentAccount.organizationId,
      scope: input.scope,
      status: input.executionStatus,
      tenantId: currentAccount.tenantId
    },
    update: {
      errorMessage:
        input.error && typeof input.error.message === "string" ? input.error.message : null,
      lastSyncAt: now,
      metadata: toJsonValue({
        action: "message.status",
        ...(input.error && typeof input.error.code === "string" ? { errorCode: input.error.code } : {}),
        eventId: input.eventId,
        eventType: input.eventType,
        externalId: input.externalId ?? null,
        externalEventId: input.externalEventId,
        ...(input.metadata ? { metadata: input.metadata } : {})
      }),
      nextSyncAt: null,
      status: input.executionStatus
    },
    where: {
      connectorAccountId_scope: {
        connectorAccountId: input.accountId,
        scope: input.scope
      }
    }
  });
}

async function resolveZenviaConversationTarget(input: {
  externalEventId?: string | undefined;
  externalMessageId?: string | undefined;
  organizationId: string;
  tenantId: string;
}) {
  if (input.externalMessageId) {
    const message = await prisma.conversationMessage.findFirst({
      include: {
        thread: {
          select: {
            id: true,
            metadata: true
          }
        }
      },
      where: {
        externalMessageId: input.externalMessageId,
        organizationId: input.organizationId,
        tenantId: input.tenantId
      }
    });

    if (message) {
      return {
        message,
        threadId: message.thread.id,
        threadMetadata: message.thread.metadata
      };
    }
  }

  if (!input.externalEventId) {
    return null;
  }

  const outboundEvent = await prisma.crmSyncEvent.findFirst({
    orderBy: {
      createdAt: "desc"
    },
    where: {
      direction: "outbound",
      externalEventId: input.externalEventId,
      organizationId: input.organizationId,
      provider: "zenvia",
      tenantId: input.tenantId
    }
  });
  const outboundRequest = readObject(outboundEvent?.requestBody);
  const conversationMessageId = readString(outboundRequest?.conversationMessageId);
  const threadId = readString(outboundRequest?.threadId);

  if (!conversationMessageId) {
    return threadId ? { message: null, threadId, threadMetadata: null } : null;
  }

  const message = await prisma.conversationMessage.findFirst({
    where: {
      id: conversationMessageId,
      organizationId: input.organizationId,
      tenantId: input.tenantId
    }
  });

  return {
    message,
    threadId: threadId ?? message?.threadId ?? null,
    threadMetadata: null
  };
}

async function updateZenviaConversationStatus(input: {
  deliveryStatus: "delivered" | "failed" | "processing";
  eventId: string;
  externalEventId: string;
  organizationId: string;
  payload: ZenviaStatusWebhookPayload;
  tenantId: string;
}) {
  const target = await resolveZenviaConversationTarget({
    ...(readString(input.payload.message.externalId)
      ? { externalEventId: readString(input.payload.message.externalId) }
      : {}),
    ...(readString(input.payload.message.id)
      ? { externalMessageId: readString(input.payload.message.id) }
      : {}),
    organizationId: input.organizationId,
    tenantId: input.tenantId
  });

  if (target?.message) {
    await prisma.conversationMessage.update({
      data: {
        ...(readString(input.payload.message.id)
          ? { externalMessageId: readString(input.payload.message.id) }
          : {}),
        metadata: mergeConnectorMetadata(target.message.metadata, {
          deliveryStatus: input.deliveryStatus,
          providerEventId: input.eventId,
          providerExternalEventId: input.externalEventId,
          providerStatus: input.payload.messageStatus.code,
          ...(input.payload.messageStatus.description
            ? { providerStatusDescription: input.payload.messageStatus.description }
            : {})
        })
      },
      where: {
        id: target.message.id
      }
    });
  }

  if (target?.threadId) {
    await prisma.conversationThread.update({
      data: {
        metadata: mergeConnectorMetadata(target.threadMetadata, {
          lastMessageStatus: input.deliveryStatus,
          lastMessageStatusAt: resolveZenviaStatusOccurredAt(input.payload),
          lastProviderEventId: input.eventId,
          lastProviderStatus: input.payload.messageStatus.code
        })
      },
      where: {
        id: target.threadId
      }
    });
  }

  return {
    conversationMessageId: target?.message?.id ?? null,
    threadId: target?.threadId ?? null
  };
}

function resolveHealthCredentialTypes(
  provider: Exclude<HealthEnabledConnectorProvider, "omie">
): string[] {
  switch (provider) {
    case "slack":
      return ["botToken", "accessToken", "apiKey"];
    case "stripe":
      return ["apiKey"];
    case "zenvia":
      return ["apiKey", "accessToken"];
    case "hubspot":
    default:
      return ["accessToken", "apiKey", "privateAppToken"];
  }
}

function buildMissingCredentialMessage(provider: ConnectorProvider): string {
  switch (provider) {
    case "omie":
      return "Omie connector credentials are not configured.";
    case "slack":
      return "Slack connector credential is not configured.";
    case "stripe":
      return "Stripe connector credential is not configured.";
    case "zenvia":
      return "Zenvia connector credential is not configured.";
    case "hubspot":
    default:
      return "HubSpot connector credential is not configured.";
  }
}

function hasCredentialValue(
  credentials: ConnectorCredentialsRecord,
  credentialTypes: readonly string[]
): boolean {
  return credentialTypes.some((credentialType) => {
    const normalizedType = normalizeConnectorCredentialType(credentialType);
    return typeof credentials[normalizedType]?.value === "string";
  });
}

function hasStoredCredentialValue(
  credentials: readonly { credentialType: string }[],
  credentialTypes: readonly string[]
): boolean {
  return Boolean(findConnectorCredentialByType(credentials, credentialTypes));
}

function hasConnectorActivationCredentials(input: {
  authType: ConnectorAuthType;
  credentials: ConnectorCredentialsRecord;
  existingCredentials: readonly { credentialType: string }[];
  provider: ConnectorProvider;
}): boolean {
  const hasCredential = (credentialTypes: readonly string[]) =>
    hasCredentialValue(input.credentials, credentialTypes) ||
    hasStoredCredentialValue(input.existingCredentials, credentialTypes);

  if (input.authType === "oauth") {
    return hasCredential(["accessToken"]);
  }

  if (input.provider === "omie") {
    return hasCredential(["appKey"]) && hasCredential(["appSecret"]);
  }

  if (input.authType === "webhook_secret") {
    return hasCredential(["webhookSecret"]);
  }

  switch (input.provider) {
    case "hubspot":
      return hasCredential(["accessToken", "apiKey", "privateAppToken"]);
    case "slack":
      return hasCredential(["botToken", "accessToken", "apiKey"]);
    case "stripe":
      return hasCredential(["apiKey"]);
    case "zenvia":
      return hasCredential(["apiKey", "accessToken"]);
    default:
      return hasCredential(["apiKey", "accessToken"]);
  }
}

function resolveDefaultEventType(input: {
  eventType: string;
  provider: WebhookEnabledConnectorProvider;
}): string {
  if (
    (input.provider === "slack" || input.provider === "zenvia") &&
    input.eventType === "lead.created"
  ) {
    return "message.send";
  }

  return input.eventType;
}

function requireHealthEnabledConnectorProvider(
  provider: ConnectorProvider
): HealthEnabledConnectorProvider {
  if (
    provider !== "hubspot" &&
    provider !== "omie" &&
    provider !== "slack" &&
    provider !== "stripe" &&
    provider !== "zenvia"
  ) {
    throw new ProblemDetailsError({
      detail: `Connector provider '${provider}' is not enabled in this phase.`,
      status: 409,
      title: "Connector Provider Not Enabled"
    });
  }

  return provider;
}

function requireWebhookEnabledConnectorProvider(
  provider: ConnectorProvider
): WebhookEnabledConnectorProvider {
  if (
    provider !== "hubspot" &&
    provider !== "slack" &&
    provider !== "stripe" &&
    provider !== "zenvia"
  ) {
    throw new ProblemDetailsError({
      detail: `Connector provider '${provider}' is not enabled for webhook ingestion in this phase.`,
      status: 409,
      title: "Connector Provider Not Enabled"
    });
  }

  return provider;
}

export const connectorsService = {
  async listConnectors(input: { organizationId: string; tenantId: string }) {
    const accounts = await prisma.connectorAccount.findMany({
      take: CONNECTOR_ACCOUNT_LIST_LIMIT,
      include: {
        _count: {
          select: {
            threads: true
          }
        },
        credentials: {
          orderBy: {
            createdAt: "asc"
          }
        },
        syncCursors: {
          orderBy: {
            updatedAt: "desc"
          }
        },
        threads: {
          orderBy: {
            updatedAt: "desc"
          },
          take: 10
        }
      },
      orderBy: [{ provider: "asc" }, { accountKey: "asc" }],
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId
      }
    });

    return accounts.map((account) => sanitizeConnectorAccount(account));
  },

  listProviderCatalog(): ConnectorProviderDefinition[] {
    return listConnectorProviderDefinitions().sort((left, right) =>
      left.displayName.localeCompare(right.displayName)
    );
  },

  async upsertConnector(input: {
    accountKey?: string | undefined;
    authType?: ConnectorAuthType | undefined;
    credentials?: ConnectorCredentialsRecord | undefined;
    displayName?: string | undefined;
    externalAccountId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    organizationId: string;
    provider: ConnectorProvider;
    scopes?: string[] | undefined;
    status?: string | undefined;
    tenantId: string;
  }) {
    const providerDefinition = getConnectorProviderDefinition(input.provider);
    const authType = input.authType ?? resolveDefaultConnectorAuthType(input.provider);
    if (!providerSupportsAuthType(input.provider, authType)) {
      throw new ProblemDetailsError({
        detail: `Connector provider '${input.provider}' does not support auth type '${authType}'.`,
        status: 409,
        title: "Connector Auth Type Not Supported"
      });
    }

    const accountKey = input.accountKey ?? "primary";
    const credentials = normalizeCredentials(input.credentials);
    const existingAccount = await prisma.connectorAccount.findFirst({
      include: {
        credentials: true
      },
      where: {
        accountKey,
        organizationId: input.organizationId,
        provider: input.provider,
        tenantId: input.tenantId
      }
    });
    const hasActivationCredentials = hasConnectorActivationCredentials({
      authType,
      credentials,
      existingCredentials: existingAccount?.credentials ?? [],
      provider: input.provider
    });

    if (input.status === "active" && !hasActivationCredentials) {
      throw new ProblemDetailsError({
        detail: `Connector provider '${input.provider}' cannot be marked active without a valid credential.`,
        status: 400,
        title: "Connector Credential Required"
      });
    }

    const createData = {
        accountKey: input.accountKey ?? "primary",
        authType,
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.externalAccountId ? { externalAccountId: input.externalAccountId } : {}),
        ...(input.metadata ? { metadata: toJsonValue(input.metadata) } : {}),
        organizationId: input.organizationId,
        provider: input.provider,
        ...(input.scopes
          ? { scopes: toJsonValue(input.scopes) }
          : providerDefinition.defaultScopes
            ? { scopes: toJsonValue([...providerDefinition.defaultScopes]) }
            : {}),
        status: input.status ?? (hasActivationCredentials ? "active" : "pending"),
        tenantId: input.tenantId
      };
    const updateData = {
        authType,
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.externalAccountId ? { externalAccountId: input.externalAccountId } : {}),
        ...(input.metadata ? { metadata: toJsonValue(input.metadata) } : {}),
        ...(input.scopes
          ? { scopes: toJsonValue(input.scopes) }
          : providerDefinition.defaultScopes
            ? { scopes: toJsonValue([...providerDefinition.defaultScopes]) }
            : {}),
        ...(input.status
          ? { status: input.status }
          : hasActivationCredentials
            ? { status: "active" }
            : existingAccount?.status === "active"
              ? { status: "pending" }
              : {})
      };

    const account = existingAccount
      ? await prisma.connectorAccount.update({
          data: updateData,
          where: {
            id: existingAccount.id
          }
        })
      : await prisma.connectorAccount.create({
          data: createData
        });

    if (Object.keys(credentials).length > 0) {
      await upsertCredentials({
        connectorAccountId: account.id,
        credentials,
        organizationId: input.organizationId,
        tenantId: input.tenantId
      });
    }

    return sanitizeConnectorAccount(
      await resolveConnectorAccount({
        accountKey: input.accountKey,
        organizationId: input.organizationId,
        provider: input.provider,
        tenantId: input.tenantId
      })
    );
  },

  createConnectSession,
  finalizeConnectSession,

  async checkHealth(input: {
    accountKey?: string | undefined;
    config: ApiConfig;
    organizationId: string;
    provider: ConnectorProvider;
    tenantId: string;
  }) {
    const enabledProvider = requireHealthEnabledConnectorProvider(input.provider);

    const account = await resolveConnectorAccount({
      accountKey: input.accountKey,
      organizationId: input.organizationId,
      provider: enabledProvider,
      tenantId: input.tenantId
    });
    if (!account) {
      throw new ProblemDetailsError({
        detail: "Connector account not found for health check.",
        status: 404,
        title: "Not Found"
      });
    }

    const checkedAt = new Date();
    const missingCredentialMessage = buildMissingCredentialMessage(enabledProvider);

    if (enabledProvider === "omie") {
      const appKeyCredential = findConnectorCredentialByType(account.credentials, ["appKey"]);
      const appSecretCredential = findConnectorCredentialByType(account.credentials, ["appSecret"]);

      if (!appKeyCredential || !appSecretCredential) {
        await updateConnectorHealthState({
          accountId: account.id,
          checkedAt,
          error: {
            code: "CONNECTOR_CREDENTIAL_MISSING",
            message: missingCredentialMessage
          },
          status: "attention",
          summary: "unhealthy"
        });

        logger.warn(
          buildConnectorLogContext({
            action: "connector.health.check",
            error: missingCredentialMessage,
            eventId: account.id,
            provider: enabledProvider,
            status: "failed",
            tenantId: input.tenantId
          }),
          "Connector health check failed"
        );

        return {
          accountId: account.id,
          checkedAt: checkedAt.toISOString(),
          error: {
            code: "CONNECTOR_CREDENTIAL_MISSING",
            message: missingCredentialMessage
          },
          provider: enabledProvider,
          status: "unhealthy"
        };
      }

      try {
        const appKey = decryptConnectorToken(appKeyCredential.encryptedValue, {
          allowLegacyPlaintext: input.config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
          secret: input.config.AUTH_MFA_ENCRYPTION_KEY
        });
        const appSecret = decryptConnectorToken(appSecretCredential.encryptedValue, {
          allowLegacyPlaintext: input.config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
          secret: input.config.AUTH_MFA_ENCRYPTION_KEY
        });
        const runtime = createDefaultConnectorRuntime();
        await runtime.execute({
          action: "health.check",
          credentials: {
            appKey,
            appSecret,
            baseUrl: input.config.OMIE_BASE_URL
          },
          payload: {},
          provider: enabledProvider
        });

        await updateConnectorHealthState({
          accountId: account.id,
          checkedAt,
          status: "active",
          summary: "healthy"
        });

        logger.info(
          buildConnectorLogContext({
            action: "connector.health.check",
            eventId: account.id,
            provider: enabledProvider,
            status: "success",
            tenantId: input.tenantId
          }),
          "Connector health check completed"
        );

        return {
          accountId: account.id,
          checkedAt: checkedAt.toISOString(),
          error: null,
          provider: enabledProvider,
          status: "healthy"
        };
      } catch (error) {
        const connectorError = ensureConnectorExecutionError(error, {
          action: "connector.health.check",
          provider: enabledProvider
        });
        const serializedError = serializeConnectorError(connectorError);

        await updateConnectorHealthState({
          accountId: account.id,
          checkedAt,
          error: serializedError,
          status: "attention",
          summary: "unhealthy"
        });

        logger.warn(
          buildConnectorLogContext({
            action: "connector.health.check",
            error: connectorError.message,
            eventId: account.id,
            provider: enabledProvider,
            status: "failed",
            tenantId: input.tenantId
          }),
          "Connector health check failed"
        );

        return {
          accountId: account.id,
          checkedAt: checkedAt.toISOString(),
          error: serializedError,
          provider: enabledProvider,
          status: "unhealthy"
        };
      }
    }

    const credential = findConnectorCredentialByType(
      account.credentials,
      resolveHealthCredentialTypes(enabledProvider)
    );

    if (!credential) {
      await updateConnectorHealthState({
        accountId: account.id,
        checkedAt,
        error: {
          code: "CONNECTOR_CREDENTIAL_MISSING",
          message: missingCredentialMessage
        },
        status: "attention",
        summary: "unhealthy"
      });

      logger.warn(
        buildConnectorLogContext({
          action: "connector.health.check",
          error: missingCredentialMessage,
          eventId: account.id,
          provider: enabledProvider,
          status: "failed",
          tenantId: input.tenantId
        }),
        "Connector health check failed"
      );

      return {
        accountId: account.id,
        checkedAt: checkedAt.toISOString(),
        error: {
          code: "CONNECTOR_CREDENTIAL_MISSING",
          message: missingCredentialMessage
        },
        provider: enabledProvider,
        status: "unhealthy"
      };
    }

    try {
      const accessToken = decryptConnectorToken(credential.encryptedValue, {
        allowLegacyPlaintext: input.config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
        secret: input.config.AUTH_MFA_ENCRYPTION_KEY
      });

      const runtime = createDefaultConnectorRuntime();
      await runtime.execute({
        action: "health.check",
        credentials: {
          accessToken,
          apiKey: accessToken,
          botToken: accessToken
        },
        metadata: {
          credentialType: credential.credentialType
        },
        payload: {},
        provider: enabledProvider
      });

      await updateConnectorHealthState({
        accountId: account.id,
        checkedAt,
        status: "active",
        summary: "healthy"
      });

      logger.info(
        buildConnectorLogContext({
          action: "connector.health.check",
          eventId: account.id,
          provider: enabledProvider,
          status: "success",
          tenantId: input.tenantId
        }),
        "Connector health check completed"
      );

      return {
        accountId: account.id,
        checkedAt: checkedAt.toISOString(),
        error: null,
        provider: enabledProvider,
        status: "healthy"
      };
    } catch (error) {
      const connectorError = ensureConnectorExecutionError(error, {
        action: "connector.health.check",
        provider: enabledProvider
      });
      const serializedError = serializeConnectorError(connectorError);

      await updateConnectorHealthState({
        accountId: account.id,
        checkedAt,
        error: serializedError,
        status: "attention",
        summary: "unhealthy"
      });

      logger.warn(
        buildConnectorLogContext({
          action: "connector.health.check",
          error: connectorError.message,
          eventId: account.id,
          provider: enabledProvider,
          status: "failed",
          tenantId: input.tenantId
        }),
        "Connector health check failed"
      );

      return {
        accountId: account.id,
        checkedAt: checkedAt.toISOString(),
        error: serializedError,
        provider: enabledProvider,
        status: "unhealthy"
      };
    }
  },

  async triggerSync(input: {
    accountKey?: string | undefined;
    config: ApiConfig;
    cursor?: Record<string, unknown> | undefined;
    organizationId: string;
    provider: ConnectorProvider;
    scope?: string | undefined;
    tenantId: string;
  }) {
    const providerDefinition = getConnectorProviderDefinition(input.provider);
    const account = await resolveConnectorAccount({
      accountKey: input.accountKey,
      organizationId: input.organizationId,
      provider: input.provider,
      tenantId: input.tenantId
    });
    const scope = input.scope ?? `${input.provider}:default`;

    if (account) {
      await prisma.connectorSyncCursor.upsert({
        create: {
          ...(input.cursor ? { cursor: toJsonValue(input.cursor) } : { cursor: toJsonValue({}) }),
          connectorAccountId: account.id,
          lastSyncAt: new Date(),
          organizationId: input.organizationId,
          scope,
          status: "queued",
          tenantId: input.tenantId
        },
        update: {
          ...(input.cursor ? { cursor: toJsonValue(input.cursor) } : {}),
          lastSyncAt: new Date(),
          status: "queued"
        },
        where: {
          connectorAccountId_scope: {
            connectorAccountId: account.id,
            scope
          }
        }
      });

      await prisma.connectorAccount.update({
        data: {
          lastSyncAt: new Date(),
          status: account.status === "pending" ? "syncing" : account.status
        },
        where: {
          id: account.id
        }
      });
    }

    let queued = false;
    if (input.provider === "hubspot") {
      await enqueueCrmSync(input.config, {
        kind: "company-upsert",
        organizationId: input.organizationId,
        tenantId: input.tenantId
      });
      queued = true;
    } else if (input.provider === "omie") {
      const syncEvent = buildOmieSyncJob({
        ...(input.accountKey ? { accountKey: input.accountKey } : {}),
        ...(account?.id ? { connectorAccountId: account.id } : {}),
        cursor: input.cursor,
        organizationId: input.organizationId,
        ...(input.scope ? { scope: input.scope } : {}),
        tenantId: input.tenantId
      });
      const inboundEvent = await prisma.crmSyncEvent.create({
        data: {
          direction: "workflow",
          eventType: syncEvent.eventType,
          externalEventId: syncEvent.externalEventId,
          organizationId: input.organizationId,
          provider: input.provider,
          requestBody: toJsonValue({
            accountKey: syncEvent.accountKey,
            action: syncEvent.action,
            connectorAccountId: syncEvent.connectorAccountId,
            externalEventId: syncEvent.externalEventId,
            payload: syncEvent.payload,
            scope
          }),
          responseBody: JSON.stringify({
            action: syncEvent.action,
            externalEventId: syncEvent.externalEventId,
            queued: true,
            status: "queued"
          }),
          responseStatus: 202,
          tenantId: input.tenantId
        }
      });

      await enqueueConnectorEvent(input.config, {
        ...syncEvent,
        eventId: inboundEvent.id,
        kind: "connector-event"
      });
      queued = true;
    }

    return {
      implementationStage: providerDefinition.implementationStage,
      provider: input.provider,
      queued,
      scope
    };
  },

  async ingestZenviaStatusWebhook(input: {
    config: ApiConfig;
    connectorAccountId: string;
    payload: ZenviaStatusWebhookPayload;
    webhookSecret?: string | undefined;
  }) {
    if (input.payload.type !== "MESSAGE_STATUS") {
      throw new ProblemDetailsError({
        detail: `Unsupported Zenvia webhook event type '${input.payload.type}'.`,
        status: 409,
        title: "Connector Webhook Not Supported"
      });
    }

    const account = await prisma.connectorAccount.findFirst({
      include: {
        credentials: {
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      where: {
        id: input.connectorAccountId,
        provider: "zenvia"
      }
    });

    if (!account) {
      throw new ProblemDetailsError({
        detail: "Zenvia connector account not found for webhook processing.",
        status: 404,
        title: "Not Found"
      });
    }

    const providedSecret = readString(input.webhookSecret);
    const expectedSecret = resolveZenviaWebhookSecret({
      account,
      config: input.config
    });

    if (!providedSecret || !safeCompare(expectedSecret, providedSecret)) {
      throw new ProblemDetailsError({
        detail: "Zenvia webhook secret is invalid.",
        status: 401,
        title: "Unauthorized"
      });
    }

    const providerMessageId = readString(input.payload.message.id);
    const providerExternalId = readString(input.payload.message.externalId);

    if (!providerMessageId && !providerExternalId) {
      throw new ProblemDetailsError({
        detail: "Zenvia status webhook must include message.id or message.externalId.",
        status: 400,
        title: "Invalid Connector Webhook"
      });
    }

    const externalEventId = buildZenviaStatusExternalEventId(input.payload);
    const occurredAt = resolveZenviaStatusOccurredAt(input.payload);
    let inboundEvent;

    try {
      inboundEvent = await prisma.crmSyncEvent.create({
        data: {
          direction: "inbound",
          eventType: input.payload.type,
          externalEventId,
          organizationId: account.organizationId,
          provider: "zenvia",
          requestBody: toJsonValue({
            connectorAccountId: account.id,
            externalEventId,
            payload: input.payload
          }),
          responseBody: JSON.stringify({
            externalEventId,
            status: "processing"
          }),
          responseStatus: 102,
          tenantId: account.tenantId
        }
      });
    } catch (error) {
      if (!isDuplicateExternalEventError(error)) {
        throw error;
      }

      const existingEvent = await resolveExistingInboundEvent({
        externalEventId,
        provider: "zenvia",
        tenantId: account.tenantId
      });

      logger.info(
        buildConnectorLogContext({
          action: "message.status",
          eventId: existingEvent?.id,
          provider: "zenvia",
          status: "duplicate",
          tenantId: account.tenantId
        }),
        "Zenvia status webhook ignored because it is a duplicate event"
      );

      return {
        duplicate: true,
        eventId: existingEvent?.id ?? null,
        externalEventId,
        provider: "zenvia",
        queued: false
      };
    }

    const deliveryStatus = normalizeZenviaDeliveryStatus(input.payload.messageStatus.code);
    const executionError =
      deliveryStatus === "failed"
        ? {
            code: input.payload.messageStatus.code,
            message:
              input.payload.messageStatus.description ??
              `Zenvia reported message status ${input.payload.messageStatus.code}.`
          }
        : null;
    const conversation = await updateZenviaConversationStatus({
      deliveryStatus,
      eventId: input.payload.id ?? inboundEvent.id,
      externalEventId,
      organizationId: account.organizationId,
      payload: input.payload,
      tenantId: account.tenantId
    });
    const executionMetadata = {
      ...(conversation.conversationMessageId
        ? { conversationMessageId: conversation.conversationMessageId }
        : {}),
      ...(conversation.threadId ? { threadId: conversation.threadId } : {}),
      providerStatus: input.payload.messageStatus.code,
      ...(input.payload.messageStatus.description
        ? { providerStatusDescription: input.payload.messageStatus.description }
        : {})
    };

    await updateConnectorExecutionState({
      accountId: account.id,
      ...(executionError ? { error: executionError } : {}),
      eventId: inboundEvent.id,
      eventType: input.payload.type,
      executionStatus: deliveryStatus,
      externalEventId,
      externalId: providerMessageId ?? providerExternalId,
      metadata: executionMetadata,
      occurredAt,
      scope: "messaging:status"
    });

    await prisma.crmSyncEvent.update({
      data: {
        responseBody: JSON.stringify({
          conversationMessageId: conversation.conversationMessageId,
          externalEventId,
          externalId: providerMessageId ?? providerExternalId ?? null,
          providerStatus: input.payload.messageStatus.code,
          status: deliveryStatus,
          threadId: conversation.threadId
        }),
        responseStatus: 200
      },
      where: {
        id: inboundEvent.id
      }
    });

    const logContext = buildConnectorLogContext({
      action: "message.status",
      eventId: inboundEvent.id,
      provider: "zenvia",
      status: deliveryStatus,
      tenantId: account.tenantId
    });

    if (deliveryStatus === "failed") {
      logger.warn(logContext, "Zenvia status webhook processed with delivery failure");
    } else {
      logger.info(logContext, "Zenvia status webhook processed");
    }

    return {
      conversationMessageId: conversation.conversationMessageId,
      duplicate: false,
      eventId: inboundEvent.id,
      externalEventId,
      provider: "zenvia",
      queued: false,
      status: deliveryStatus,
      threadId: conversation.threadId
    };
  },

  async ingestWebhook(input: {
    config: ApiConfig;
    payload: ConnectorWebhookIngestPayload;
    provider: ConnectorProvider;
    signature?: string | undefined;
    trustedContext?: {
      organizationId?: string | null | undefined;
      tenantId?: string | null | undefined;
    } | undefined;
  }) {
    const enabledProvider = requireWebhookEnabledConnectorProvider(input.provider);

    const trustedOrganizationId = input.trustedContext?.organizationId ?? undefined;
    const trustedTenantId = input.trustedContext?.tenantId ?? undefined;

    if (!trustedOrganizationId && !trustedTenantId) {
      verifyWebhookReceiverSignature({
        config: input.config,
        payload: input.payload,
        signature: input.signature
      });
    }

    const receivedAt = new Date().toISOString();
    const organization = await resolveWebhookOrganization({
      organizationId: trustedOrganizationId ?? input.payload.organizationId,
      tenantId: trustedTenantId ?? input.payload.tenantId
    });
    let eventType = resolveDefaultEventType({
      eventType: input.payload.eventType,
      provider: enabledProvider
    });
    let normalizedEvent: NormalizedEvent;

    if (enabledProvider === "stripe") {
      const account = await resolveWebhookConnectorAccount({
        ...(input.payload.accountKey ? { accountKey: input.payload.accountKey } : {}),
        ...(input.payload.connectorAccountId
          ? { connectorAccountId: input.payload.connectorAccountId }
          : {}),
        organizationId: organization.id,
        provider: enabledProvider,
        tenantId: organization.tenantId
      });

      if (!account) {
        throw new ProblemDetailsError({
          detail: "Stripe connector account not found for webhook processing.",
          status: 404,
          title: "Not Found"
        });
      }

      const stripeEvent = constructStripeConnectorEvent({
        config: input.config,
        rawBody: input.payload.rawBody,
        signature: input.payload.webhookSignature,
        webhookSecret: resolveStripeWebhookSecret({
          account,
          config: input.config
        })
      });

      eventType = stripeEvent.type;
      normalizedEvent = normalizeStripeConnectorEvent({
        eventType,
        externalEventId: stripeEvent.id,
        ...(input.payload.idempotencyKey ? { idempotencyKey: input.payload.idempotencyKey } : {}),
        payload: buildStripeConnectorWebhookPayload(stripeEvent),
        receivedAt
      });
    } else {
      const eventPayload = {
        ...(input.payload.payload ?? {}),
        ...(input.payload.contact ? { contact: input.payload.contact } : {})
      };
      normalizedEvent =
        enabledProvider === "hubspot"
          ? normalizeHubspotConnectorEvent({
              ...(input.payload.externalEventId ? { externalEventId: input.payload.externalEventId } : {}),
              eventType,
              ...(input.payload.idempotencyKey ? { idempotencyKey: input.payload.idempotencyKey } : {}),
              payload: eventPayload,
              receivedAt
            })
          : enabledProvider === "slack"
            ? normalizeSlackConnectorEvent({
                ...(input.payload.externalEventId
                  ? { externalEventId: input.payload.externalEventId }
                  : {}),
                eventType,
                ...(input.payload.idempotencyKey
                  ? { idempotencyKey: input.payload.idempotencyKey }
                  : {}),
                payload: eventPayload,
                receivedAt
              })
            : normalizeZenviaConnectorEvent({
                ...(input.payload.externalEventId
                  ? { externalEventId: input.payload.externalEventId }
                  : {}),
                eventType,
                ...(input.payload.idempotencyKey
                  ? { idempotencyKey: input.payload.idempotencyKey }
                  : {}),
                payload: eventPayload,
                receivedAt
              });
    }

    if (normalizedEvent.externalEventId) {
      const existingEvent = await resolveExistingInboundEvent({
        externalEventId: normalizedEvent.externalEventId,
        provider: enabledProvider,
        tenantId: organization.tenantId
      });

      if (existingEvent) {
        logger.info(
          buildConnectorLogContext({
            action: normalizedEvent.action,
            eventId: existingEvent.id,
            provider: input.provider,
            status: "duplicate",
            tenantId: organization.tenantId
          }),
          "Connector webhook ignored because it is a duplicate event"
        );

        return {
          duplicate: true,
          eventId: existingEvent.id,
          eventType: normalizedEvent.eventType,
          externalEventId: normalizedEvent.externalEventId,
          provider: enabledProvider,
          queued: false
        };
      }
    }

    let inboundEvent;
    try {
      inboundEvent = await prisma.crmSyncEvent.create({
        data: {
          direction: "inbound",
          eventType: normalizedEvent.eventType,
          externalEventId: normalizedEvent.externalEventId,
          organizationId: organization.id,
          provider: enabledProvider,
          requestBody: toJsonValue({
            accountKey: input.payload.accountKey,
            action: normalizedEvent.action,
            connectorAccountId: input.payload.connectorAccountId,
            contact: input.payload.contact,
            externalEventId: normalizedEvent.externalEventId,
            idempotencyKey: input.payload.idempotencyKey,
            normalizedEvent,
            payload: input.payload.payload,
            ...(input.payload.rawBody ? { rawBody: input.payload.rawBody } : {}),
            ...(input.payload.webhookSignature
              ? { webhookSignature: input.payload.webhookSignature }
              : {})
          }),
          responseBody: JSON.stringify({
            action: normalizedEvent.action,
            externalEventId: normalizedEvent.externalEventId,
            queued: true,
            status: "queued"
          }),
          responseStatus: 202,
          tenantId: organization.tenantId
        }
      });
    } catch (error) {
      if (!isDuplicateExternalEventError(error)) {
        throw error;
      }

      const existingEvent = await resolveExistingInboundEvent({
        externalEventId: normalizedEvent.externalEventId,
        provider: enabledProvider,
        tenantId: organization.tenantId
      });

      logger.info(
        buildConnectorLogContext({
          action: normalizedEvent.action,
          eventId: existingEvent?.id,
          provider: input.provider,
          status: "duplicate",
          tenantId: organization.tenantId
        }),
        "Connector webhook ignored because it is a duplicate event"
      );

      return {
        duplicate: true,
        eventId: existingEvent?.id ?? null,
        eventType: normalizedEvent.eventType,
        externalEventId: normalizedEvent.externalEventId,
        provider: enabledProvider,
        queued: false
      };
    }

    await enqueueConnectorEvent(input.config, {
      ...(input.payload.accountKey ? { accountKey: input.payload.accountKey } : {}),
      ...(input.payload.connectorAccountId
        ? { connectorAccountId: input.payload.connectorAccountId }
        : {}),
      action: normalizedEvent.action,
      eventId: inboundEvent.id,
      eventType: normalizedEvent.eventType,
      externalEventId: normalizedEvent.externalEventId,
      kind: "connector-event",
      ...(normalizedEvent.objectId ? { objectId: normalizedEvent.objectId } : {}),
      occurredAt: normalizedEvent.occurredAt,
      organizationId: organization.id,
      payload: normalizedEvent.payload,
      provider: enabledProvider,
      receivedAt: normalizedEvent.receivedAt,
      source: normalizedEvent.source,
      tenantId: organization.tenantId
    });

    logger.info(
      buildConnectorLogContext({
        action: normalizedEvent.action,
        eventId: inboundEvent.id,
        provider: enabledProvider,
        status: "queued",
        tenantId: organization.tenantId
      }),
      "Connector webhook accepted"
    );

    return {
      duplicate: false,
      eventId: inboundEvent.id,
      eventType: normalizedEvent.eventType,
      externalEventId: normalizedEvent.externalEventId,
      provider: enabledProvider,
      queued: true
    };
  }
};
