import { getWorkerConfig } from "@birthub/config";
import { prisma, SubscriptionStatus } from "@birthub/database";
import { createLogger } from "@birthub/logger";

import { fetchWithTimeout } from "@birthub/utils/fetch";

const logger = createLogger("worker-hubspot");
const HUBSPOT_REQUEST_TIMEOUT_MS = 10_000;

class HubspotRateLimitError extends Error {
  constructor(message = "HubSpot API rate limit reached.") {
    super(message);
    this.name = "HubspotRateLimitError";
  }
}

class MissingHubspotCredentialsError extends Error {
  constructor(message = "HUBSPOT_ACCESS_TOKEN is not configured.") {
    super(message);
    this.name = "MissingHubspotCredentialsError";
  }
}

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

class HubspotSyncAdapter {
  constructor(
    private readonly token: string | undefined,
    private readonly baseUrl: string
  ) {}

  private async request(input: {
    method: "PATCH" | "POST";
    path: string;
    payload: Record<string, unknown>;
  }): Promise<HubspotResponse> {
    if (!this.token) {
      throw new MissingHubspotCredentialsError();
    }

    const response = await fetchWithTimeout(`${this.baseUrl}${input.path}`, {
      body: JSON.stringify(input.payload),
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json"
      },
      method: input.method,
      timeoutMessage: `HubSpot sync exceeded the ${HUBSPOT_REQUEST_TIMEOUT_MS}ms timeout budget.`,
      timeoutMs: HUBSPOT_REQUEST_TIMEOUT_MS
    });

    const body = await response.text();

    if (response.status === 429) {
      throw new HubspotRateLimitError();
    }

    if (!response.ok) {
      throw new Error(`HubSpot sync failed with status ${response.status}: ${body}`);
    }

    let companyId: string | null = null;
    try {
      const parsed = JSON.parse(body) as { id?: unknown };
      companyId = typeof parsed.id === "string" ? parsed.id : null;
    } catch {
      // Keep fallback when HubSpot omits an `id` in the response body.
    }

    return {
      body,
      companyId,
      status: response.status
    };
  }

  async upsertCompany(payload: HubspotCompanyPayload & { hubspotCompanyId?: string | null }) {
    const properties = {
      bh_arr_cents: String(payload.arrCents),
      bh_health_score: String(payload.healthScore),
      bh_plan_code: payload.planCode,
      bh_subscription_status: payload.status,
      bh_tenant_id: payload.tenantId,
      domain: payload.domain ?? undefined,
      name: payload.name
    };

    if (payload.hubspotCompanyId) {
      return this.request({
        method: "PATCH",
        path: `/crm/v3/objects/companies/${payload.hubspotCompanyId}`,
        payload: {
          properties
        }
      });
    }

    return this.request({
      method: "POST",
      path: "/crm/v3/objects/companies",
      payload: {
        properties
      }
    });
  }
}

async function persistCrmSyncEvent(
  snapshot: Awaited<ReturnType<typeof loadOrganizationSnapshot>>,
  response: HubspotResponse
) {
  await prisma.crmSyncEvent.create({
    data: {
      eventType: "company.upsert",
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

async function loadOrganizationSnapshot(organizationId: string) {
  const organization = await prisma.organization.findUnique({
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
      id: organizationId
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

export async function syncOrganizationToHubspot(input: {
  organizationId: string;
  tenantId: string;
}) {
  const config = getWorkerConfig();
  const snapshot = await loadOrganizationSnapshot(input.organizationId);
  const adapter = new HubspotSyncAdapter(
    config.HUBSPOT_ACCESS_TOKEN || undefined,
    config.HUBSPOT_BASE_URL
  );
  try {
    const response = await adapter.upsertCompany(snapshot);

    await persistCrmSyncEvent(snapshot, response);

    if (response.companyId && response.companyId !== snapshot.hubspotCompanyId) {
      await prisma.organization.update({
        data: {
          hubspotCompanyId: response.companyId
        },
        where: {
          id: snapshot.organizationId
        }
      });
    }

    logger.info(
      {
        organizationId: snapshot.organizationId,
        responseStatus: response.status,
        tenantId: snapshot.tenantId
      },
      "HubSpot organization sync completed"
    );

    return response;
  } catch (error) {
    if (error instanceof MissingHubspotCredentialsError) {
      const response: HubspotResponse = {
        body: JSON.stringify({
          disabled: true,
          reason: error.message
        }),
        companyId: snapshot.hubspotCompanyId,
        disabled: true,
        reason: error.message,
        status: 412
      };

      await persistCrmSyncEvent(snapshot, response);

      logger.warn(
        {
          organizationId: snapshot.organizationId,
          reason: error.message,
          tenantId: snapshot.tenantId
        },
        "HubSpot organization sync skipped because credentials are not configured"
      );

      return response;
    }

    throw error;
  }
}
