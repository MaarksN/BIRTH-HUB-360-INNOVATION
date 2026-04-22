import {
  createDefaultConnectorRuntime,
  decryptConnectorToken
} from "@birthub/connectors-core";
import { getWorkerConfig } from "@birthub/config";
import { Prisma, prisma } from "@birthub/database";
import {
  findConnectorCredentialByType,
  type HubspotContactUpsertInput
} from "@birthub/integrations";
import type { ConnectorActionRequest } from "@birthub/workflows-core";

import {
  createConversationMessage,
  ensureConversationThread
} from "../agents/conversations.js";
import { syncOrganizationToHubspot } from "./hubspot.js";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function decryptCredentialValue(encryptedValue: string): string {
  const config = getWorkerConfig();

  return decryptConnectorToken(encryptedValue, {
    allowLegacyPlaintext: config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
    secret: config.AUTH_MFA_ENCRYPTION_KEY
  });
}

async function resolveOrganization(input: { tenantId: string }) {
  const organization = await prisma.organization.findFirst({
    where: {
      tenantId: input.tenantId
    }
  });

  if (!organization) {
    throw new Error(`CONNECTOR_ORGANIZATION_NOT_FOUND:${input.tenantId}`);
  }

  return organization;
}

async function resolveConnectorAccount(input: {
  connectorAccountId?: string;
  organizationId: string;
  provider: string;
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
      organizationId: input.organizationId,
      provider: input.provider,
      status: {
        in: ["active", "pending", "pending_token_exchange"]
      },
      tenantId: input.tenantId
    }
  });
}

function resolveHubspotAccessToken(
  account: Awaited<ReturnType<typeof resolveConnectorAccount>>
): string | undefined {
  const credential = account
    ? findConnectorCredentialByType(account.credentials, [
        "accessToken",
        "apiKey",
        "privateAppToken"
      ])
    : undefined;

  return credential ? decryptCredentialValue(credential.encryptedValue) : undefined;
}

async function touchConnectorState(input: {
  connectorAccountId?: string | null;
  metadata?: Record<string, unknown>;
  organizationId: string;
  scope: string;
  status: string;
  tenantId: string;
}) {
  if (!input.connectorAccountId) {
    return;
  }

  await prisma.connectorAccount.update({
    data: {
      lastSyncAt: new Date(),
      ...(input.status === "failed" ? { status: "attention" } : {})
    },
    where: {
      id: input.connectorAccountId,
      tenantId: input.tenantId
    }
  });

  await prisma.connectorSyncCursor.upsert({
    create: {
      connectorAccountId: input.connectorAccountId,
      cursor: toJsonValue({}),
      ...(input.metadata ? { metadata: toJsonValue(input.metadata) } : {}),
      lastSyncAt: new Date(),
      organizationId: input.organizationId,
      scope: input.scope,
      status: input.status,
      tenantId: input.tenantId
    },
    update: {
      ...(input.metadata ? { metadata: toJsonValue(input.metadata) } : {}),
      lastSyncAt: new Date(),
      status: input.status
    },
    where: {
      connectorAccountId_scope: {
        connectorAccountId: input.connectorAccountId,
        scope: input.scope
      },
      tenantId: input.tenantId
    }
  });
}

async function executeCrmUpsert(input: {
  action: Extract<ConnectorActionRequest, { kind: "CRM_UPSERT" }>;
  executionId: string;
  organizationId: string;
  tenantId: string;
  workflowId: string;
}) {
  const provider = input.action.provider ?? "hubspot";
  const connectorAccount = await resolveConnectorAccount({
    ...(input.action.connectorAccountId
      ? { connectorAccountId: input.action.connectorAccountId }
      : {}),
    organizationId: input.organizationId,
    provider,
    tenantId: input.tenantId
  });

  if (provider === "hubspot" && input.action.objectType === "company") {
    const response = await syncOrganizationToHubspot({
      organizationId: input.organizationId,
      tenantId: input.tenantId
    });

    await touchConnectorState({
      connectorAccountId: connectorAccount?.id ?? null,
      metadata: {
        executionId: input.executionId,
        objectType: input.action.objectType,
        provider,
        responseStatus: response.status,
        workflowId: input.workflowId
      },
      organizationId: input.organizationId,
      scope: input.action.scope ?? "crm:companies",
      status: response.disabled ? "failed" : "success",
      tenantId: input.tenantId
    });

    return {
      ...(response.disabled ? { blockedReason: response.reason ?? "hubspot_credentials_missing" } : {}),
      objectType: input.action.objectType,
      provider,
      responseStatus: response.status,
      synced: !response.disabled
    };
  }

  if (provider === "hubspot" && input.action.objectType === "contact") {
    const runtime = createDefaultConnectorRuntime();
    const accessToken = resolveHubspotAccessToken(connectorAccount);
    const result = await runtime.execute({
      action: "crm.contact.upsert",
      credentials: {
        ...(accessToken ? { accessToken } : {})
      },
      metadata: {
        executionId: input.executionId,
        workflowId: input.workflowId
      },
      payload: input.action.payload as unknown as HubspotContactUpsertInput,
      provider: "hubspot"
    });

    await prisma.crmSyncEvent.create({
      data: {
        direction: "workflow",
        eventType: "hubspot.contact.upsert",
        organizationId: input.organizationId,
        provider,
        requestBody: toJsonValue({
          executionId: input.executionId,
          payload: input.action.payload,
          request: result.request ?? null,
          workflowId: input.workflowId
        }),
        responseBody: JSON.stringify({
          externalId: result.externalId ?? null,
          response: result.response ?? null,
          status: result.status
        }),
        responseStatus: result.statusCode ?? 200,
        tenantId: input.tenantId
      }
    });

    await touchConnectorState({
      connectorAccountId: connectorAccount?.id ?? null,
      metadata: {
        executionId: input.executionId,
        externalId: result.externalId ?? null,
        objectType: input.action.objectType,
        provider,
        workflowId: input.workflowId
      },
      organizationId: input.organizationId,
      scope: input.action.scope ?? "crm:contacts",
      status: "success",
      tenantId: input.tenantId
    });

    return {
      externalId: result.externalId,
      objectType: input.action.objectType,
      provider,
      responseStatus: result.statusCode ?? 200,
      synced: true
    };
  }

  await prisma.crmSyncEvent.create({
    data: {
      direction: "workflow",
      eventType: `${provider}.${input.action.objectType}.${input.action.operation ?? "upsert"}`,
      organizationId: input.organizationId,
      provider,
      requestBody: toJsonValue({
        executionId: input.executionId,
        payload: input.action.payload,
        workflowId: input.workflowId
      }),
      responseBody: JSON.stringify({
        queued: true
      }),
      responseStatus: 202,
      tenantId: input.tenantId
    }
  });

  await touchConnectorState({
    connectorAccountId: connectorAccount?.id ?? null,
    metadata: {
      executionId: input.executionId,
      objectType: input.action.objectType,
      provider,
      workflowId: input.workflowId
    },
    organizationId: input.organizationId,
    scope: input.action.scope ?? `crm:${input.action.objectType}`,
    status: "queued",
    tenantId: input.tenantId
  });

  return {
    objectType: input.action.objectType,
    provider,
    queued: true
  };
}

async function executeWhatsappSend(input: {
  action: Extract<ConnectorActionRequest, { kind: "WHATSAPP_SEND" }>;
  executionId: string;
  organizationId: string;
  tenantId: string;
  workflowId: string;
}) {
  const provider = "twilio-whatsapp";
  const connectorAccount = await resolveConnectorAccount({
    ...(input.action.connectorAccountId
      ? { connectorAccountId: input.action.connectorAccountId }
      : {}),
    organizationId: input.organizationId,
    provider,
    tenantId: input.tenantId
  });
  const thread = await ensureConversationThread({
    channel: "whatsapp",
    ...(connectorAccount?.id ? { connectorAccountId: connectorAccount.id } : {}),
    correlationId: input.executionId,
    ...(input.action.threadId ? { externalThreadId: input.action.threadId } : {}),
    metadata: {
      provider,
      to: input.action.to,
      workflowId: input.workflowId
    },
    organizationId: input.organizationId,
    tenantId: input.tenantId,
    ...(input.action.threadId ? { threadId: input.action.threadId } : {})
  });
  const message = await createConversationMessage({
    content: {
      message: input.action.message,
      template: input.action.template ?? null,
      to: input.action.to,
      type: "whatsapp_outbound"
    },
    direction: "outbound",
    metadata: {
      executionId: input.executionId,
      workflowId: input.workflowId
    },
    organizationId: input.organizationId,
    role: "assistant",
    tenantId: input.tenantId,
    threadId: thread.id
  });

  await touchConnectorState({
    connectorAccountId: connectorAccount?.id ?? null,
    metadata: {
      executionId: input.executionId,
      messageId: message.id,
      threadId: thread.id,
      workflowId: input.workflowId
    },
    organizationId: input.organizationId,
    scope: "whatsapp:messages",
    status: "queued",
    tenantId: input.tenantId
  });

  return {
    messageId: message.id,
    provider,
    queued: true,
    threadId: thread.id
  };
}

async function executeCalendarEvent(input: {
  action: Extract<ConnectorActionRequest, { kind: "GOOGLE_EVENT" | "MS_EVENT" }>;
  executionId: string;
  organizationId: string;
  tenantId: string;
  workflowId: string;
}) {
  const provider =
    input.action.kind === "GOOGLE_EVENT" ? "google-workspace" : "microsoft-graph";
  const connectorAccount = await resolveConnectorAccount({
    ...(input.action.connectorAccountId
      ? { connectorAccountId: input.action.connectorAccountId }
      : {}),
    organizationId: input.organizationId,
    provider,
    tenantId: input.tenantId
  });

  await touchConnectorState({
    connectorAccountId: connectorAccount?.id ?? null,
    metadata: {
      attendees: input.action.attendees ?? [],
      calendarId: input.action.calendarId ?? "primary",
      end: input.action.end,
      executionId: input.executionId,
      start: input.action.start,
      title: input.action.title,
      workflowId: input.workflowId
    },
    organizationId: input.organizationId,
    scope: "calendar:events",
    status: "queued",
    tenantId: input.tenantId
  });

  return {
    calendarId: input.action.calendarId ?? "primary",
    provider,
    queued: true,
    title: input.action.title
  };
}

async function executeGenericConnectorAction(input: {
  action: Extract<ConnectorActionRequest, { kind: "CONNECTOR_ACTION" }>;
  executionId: string;
  tenantId: string;
  workflowId: string;
}) {
  const [provider, ...actionParts] = input.action.action.split(".");
  const runtime = createDefaultConnectorRuntime();
  const result = await runtime.execute({
    action: actionParts.join(".") as Parameters<typeof runtime.execute>[0]["action"],
    credentials: {},
    metadata: {
      executionId: input.executionId,
      workflowId: input.workflowId
    },
    payload: input.action.payload as unknown as Parameters<typeof runtime.execute>[0]["payload"],
    provider: provider as Parameters<typeof runtime.execute>[0]["provider"]
  });

  return {
    action: input.action.action,
    externalId: result.externalId ?? null,
    statusCode: result.statusCode ?? 200
  };
}

export async function executeWorkflowConnectorAction(input: {
  action: ConnectorActionRequest;
  executionId: string;
  tenantId: string;
  workflowId: string;
}) {
  const organization = await resolveOrganization({
    tenantId: input.tenantId
  });

  switch (input.action.kind) {
    case "CONNECTOR_ACTION":
      return executeGenericConnectorAction({
        action: input.action,
        executionId: input.executionId,
        tenantId: input.tenantId,
        workflowId: input.workflowId
      });
    case "CRM_UPSERT":
      return executeCrmUpsert({
        action: input.action,
        executionId: input.executionId,
        organizationId: organization.id,
        tenantId: input.tenantId,
        workflowId: input.workflowId
      });
    case "WHATSAPP_SEND":
      return executeWhatsappSend({
        action: input.action,
        executionId: input.executionId,
        organizationId: organization.id,
        tenantId: input.tenantId,
        workflowId: input.workflowId
      });
    case "GOOGLE_EVENT":
    case "MS_EVENT":
      return executeCalendarEvent({
        action: input.action,
        executionId: input.executionId,
        organizationId: organization.id,
        tenantId: input.tenantId,
        workflowId: input.workflowId
      });
    default:
      throw new Error(`Unsupported workflow connector action: ${(input.action as { kind: string }).kind}`);
  }
}
