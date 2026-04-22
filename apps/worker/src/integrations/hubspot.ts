import { getWorkerConfig } from "@birthub/config";
import {
  createDefaultConnectorRuntime,
  decryptConnectorToken,
  ensureConnectorExecutionError
} from "@birthub/connectors-core";
import { prisma, SubscriptionStatus } from "@birthub/database";
import { findConnectorCredentialByType } from "@birthub/integrations";
import { createLogger } from "@birthub/logger";
import { UnrecoverableError } from "bullmq";

const logger = createLogger("worker-hubspot");

interface HubspotCompanyPayload {
  arrCents: number;
  domain: string | null;
  healthScore: number;
  name: string;
  organizationId: string;
  planCode: string;
  status: string;
  tenantId: string;
}

type HubspotResponse = {
  body: string;
  companyId: string | null;
  disabled?: boolean;
  reason?: string;
  status: number;
};

async function persistCrmSyncEvent(
  snapshot: Awaited<ReturnType<typeof loadOrganizationSnapshot>>,
  response: HubspotResponse,
  externalEventId?: string | undefined
) {
  await prisma.crmSyncEvent.create({
    data: {
      eventType: "company.upsert",
      externalEventId,
      organizationId: snapshot.organizationId,
      requestBody: {
        arrCents: snapshot.arrCents,
        domain: snapshot.domain,
        healthScore: snapshot.healthScore,
        name: snapshot.name,
        planCode: snapshot.planCode,
        status: snapshot.status,
        tenantId: snapshot.tenantId
      },
      responseBody: response.body,
      responseStatus: response.status,
      tenantId: snapshot.tenantId
    }
  });
}

async function loadOrganizationSnapshot(input: { organizationId: string; tenantId: string }) {
  const organization = await prisma.organization.findFirst({
    include: {
      memberships: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: "asc"
        },
        take: 1
      },
      subscriptions: {
        include: {
          plan: true
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 1
      }
    },
    where: {
      id: input.organizationId,
      tenantId: input.tenantId
    }
  });

  if (!organization) {
    throw new Error("CRM_SYNC_ORGANIZATION_NOT_FOUND");
  }

  const subscription = organization.subscriptions[0] ?? null;
  const owner = organization.memberships[0]?.user ?? null;
  const ownerDomain =
    typeof owner?.email === "string" && owner.email.includes("@")
      ? owner.email.split("@").at(1) ?? null
      : null;

  return {
    arrCents: (subscription?.plan.monthlyPriceCents ?? 0) * 12,
    domain: organization.primaryDomain ?? ownerDomain,
    healthScore: organization.healthScore,
    hubspotCompanyId: organization.hubspotCompanyId,
    name: organization.name,
    organizationId: organization.id,
    planCode: subscription?.plan.code ?? "starter",
    status: subscription?.status ?? SubscriptionStatus.trial,
    tenantId: organization.tenantId
  };
}

async function resolveHubspotAccessToken(input: {
  organizationId: string;
  tenantId: string;
}) {
  const config = getWorkerConfig();
  const account = await prisma.connectorAccount.findFirst({
    include: {
      credentials: true
    },
    orderBy: {
      createdAt: "asc"
    },
    where: {
      organizationId: input.organizationId,
      provider: "hubspot",
      status: {
        in: ["active", "attention", "pending", "pending_token_exchange", "syncing"]
      },
      tenantId: input.tenantId
    }
  });
  const credential = account
    ? findConnectorCredentialByType(account.credentials, [
        "accessToken",
        "apiKey",
        "privateAppToken"
      ])
    : undefined;

  if (!credential) {
    return undefined;
  }

  return decryptConnectorToken(credential.encryptedValue, {
    allowLegacyPlaintext: config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
    secret: config.AUTH_MFA_ENCRYPTION_KEY
  });
}

async function isEventAlreadyProcessed(input: {
  externalEventId: string | undefined;
  tenantId: string;
}): Promise<boolean> {
  if (!input.externalEventId) {
    return false;
  }

  const existingEvent = await prisma.crmSyncEvent.findFirst({
    where: {
      externalEventId: input.externalEventId,
      responseStatus: {
        gte: 200,
        lt: 300
      },
      tenantId: input.tenantId
    }
  });

  return !!existingEvent;
}

function stringifyConnectorResponse(response: unknown): string {
  return typeof response === "string" ? response : JSON.stringify(response ?? null);
}

export async function syncOrganizationToHubspot(input: {
  eventId?: string | undefined;
  externalEventId?: string | undefined;
  organizationId: string;
  tenantId: string;
}): Promise<HubspotResponse> {
  const startedAt = Date.now();

  if (
    await isEventAlreadyProcessed({
      externalEventId: input.externalEventId,
      tenantId: input.tenantId
    })
  ) {
    logger.info(
      {
        action: "crm.company.upsert",
        duration: Date.now() - startedAt,
        eventId: input.eventId,
        organizationId: input.organizationId,
        provider: "hubspot",
        status: "duplicate",
        tenantId: input.tenantId
      },
      "HubSpot organization sync skipped because it was already processed"
    );

    return {
      body: JSON.stringify({
        disabled: false,
        reason: "already_processed"
      }),
      companyId: null,
      status: 200
    };
  }

  const config = getWorkerConfig();
  const snapshot = await loadOrganizationSnapshot(input);
  const accessToken = await resolveHubspotAccessToken(input);

  if (!accessToken) {
    const response: HubspotResponse = {
      body: JSON.stringify({
        disabled: true,
        reason: "HubSpot connector credential is not configured for this tenant."
      }),
      companyId: snapshot.hubspotCompanyId,
      disabled: true,
      reason: "HubSpot connector credential is not configured for this tenant.",
      status: 412
    };

    await persistCrmSyncEvent(snapshot, response, input.externalEventId);

    logger.warn(
      {
        action: "crm.company.upsert",
        duration: Date.now() - startedAt,
        eventId: input.eventId,
        organizationId: snapshot.organizationId,
        provider: "hubspot",
        status: "skipped",
        tenantId: snapshot.tenantId
      },
      "HubSpot organization sync skipped because credentials are not configured"
    );

    return response;
  }

  try {
    const runtime = createDefaultConnectorRuntime();
    const result = await runtime.execute({
      action: "crm.company.upsert",
      credentials: {
        accessToken,
        baseUrl: config.HUBSPOT_BASE_URL
      },
      ...(input.externalEventId ? { idempotencyKey: input.externalEventId } : {}),
      metadata: {
        ...(input.eventId ? { eventId: input.eventId } : {}),
        organizationId: snapshot.organizationId,
        tenantId: snapshot.tenantId
      },
      payload: snapshot,
      provider: "hubspot"
    });
    const response: HubspotResponse = {
      body: stringifyConnectorResponse(result.response),
      companyId: result.externalId ?? null,
      status: result.statusCode ?? 200
    };

    await persistCrmSyncEvent(snapshot, response, input.externalEventId);

    if (response.companyId && response.companyId !== snapshot.hubspotCompanyId) {
      await prisma.organization.update({
        data: {
          hubspotCompanyId: response.companyId
        },
        where: {
          id: snapshot.organizationId,
          tenantId: snapshot.tenantId
        }
      });
    }

    logger.info(
      {
        action: "crm.company.upsert",
        duration: Date.now() - startedAt,
        eventId: input.eventId,
        organizationId: snapshot.organizationId,
        provider: "hubspot",
        responseStatus: response.status,
        status: "success",
        tenantId: snapshot.tenantId
      },
      "HubSpot organization sync completed"
    );

    return response;
  } catch (error) {
    const connectorError = ensureConnectorExecutionError(error, {
      action: "crm.company.upsert",
      provider: "hubspot"
    });

    logger.error(
      {
        action: "crm.company.upsert",
        duration: Date.now() - startedAt,
        error: connectorError.message,
        eventId: input.eventId,
        organizationId: snapshot.organizationId,
        provider: "hubspot",
        status: connectorError.retryable ? "retrying" : "failed",
        tenantId: snapshot.tenantId
      },
      "HubSpot organization sync failed"
    );

    if (connectorError.retryable) {
      throw connectorError;
    }

    throw new UnrecoverableError(connectorError.message);
  }
}
