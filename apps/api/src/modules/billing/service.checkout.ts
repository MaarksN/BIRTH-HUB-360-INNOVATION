import type { ApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import {
  SubscriptionStatus,
  prisma
} from "@birthub/database";
import Stripe from "stripe";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { createStripeClient } from "./stripe.client.js";
import {
  resolveCheckoutPreferences,
  resolveCustomerForCheckout
} from "./service.checkout.customer.js";
import { findOrganizationByReference } from "./service.shared.js";

const logger = createLogger("billing-service");

export { provisionStripeCustomerForOrganization } from "./service.checkout.customer.js";

export async function createCheckoutSessionForOrganization(input: {
  config: ApiConfig;
  countryCode?: string | null;
  locale?: string | null;
  organizationReference: string;
  planId: string;
  stripeClient?: Stripe;
}) {
  const organization = await findOrganizationByReference(input.organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for checkout.",
      status: 404,
      title: "Not Found"
    });
  }

  const plan = await prisma.plan.findUnique({
    where: {
      id: input.planId
    }
  });

  if (!plan || !plan.active) {
    throw new ProblemDetailsError({
      detail: "Requested plan is not available.",
      status: 404,
      title: "Not Found"
    });
  }

  if (!plan.stripePriceId) {
    throw new ProblemDetailsError({
      detail: "Requested plan is missing Stripe price mapping.",
      status: 409,
      title: "Conflict"
    });
  }

  const stripe = input.stripeClient ?? createStripeClient(input.config);
  const customerId = await resolveCustomerForCheckout({
    config: input.config,
    organizationReference: input.organizationReference
  });
  const { countryCode, locale } = resolveCheckoutPreferences({
    countryCode: input.countryCode,
    locale: input.locale,
    settings: organization.settings
  });

  if (countryCode && /^[A-Z]{2}$/.test(countryCode)) {
    await stripe.customers.update(customerId, {
      address: {
        country: countryCode
      }
    });
  }

  const session = await stripe.checkout.sessions.create({
    automatic_tax: {
      enabled: true
    },
    billing_address_collection: "auto",
    cancel_url: input.config.STRIPE_CANCEL_URL,
    customer: customerId,
    customer_update: {
      address: "auto",
      name: "auto"
    },
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1
      }
    ],
    ...(locale ? { locale } : {}),
    metadata: {
      countryCode: countryCode ?? "",
      organizationId: organization.id,
      planId: plan.id
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        organizationId: organization.id,
        planId: plan.id,
        tenantId: organization.tenantId
      },
      proration_behavior: "create_prorations"
    },
    success_url: `${input.config.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`
  });

  if (!session.url) {
    throw new ProblemDetailsError({
      detail: "Stripe did not return a checkout URL.",
      status: 502,
      title: "Bad Gateway"
    });
  }

  logger.info(
    {
      checkoutSessionId: session.id,
      countryCode,
      event: "billing.checkout.session.created",
      locale: locale ?? null,
      organizationId: organization.id,
      planId: plan.id,
      stripeCustomerId: customerId,
      tenantId: organization.tenantId
    },
    "Created Stripe checkout session"
  );

  return {
    id: session.id,
    url: session.url
  };
}

export async function createCustomerPortalSessionForOrganization(input: {
  config: ApiConfig;
  organizationReference: string;
  stripeClient?: Stripe;
}): Promise<{ url: string }> {
  const organization = await findOrganizationByReference(input.organizationReference);

  if (!organization?.stripeCustomerId) {
    throw new ProblemDetailsError({
      detail: "Stripe customer is not configured for this organization.",
      status: 409,
      title: "Conflict"
    });
  }

  const stripe = input.stripeClient ?? createStripeClient(input.config);
  const portal = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: input.config.STRIPE_PORTAL_RETURN_URL
  });

  logger.info(
    {
      event: "billing.portal.session.created",
      organizationId: organization.id,
      stripeCustomerId: organization.stripeCustomerId,
      tenantId: organization.tenantId
    },
    "Created Stripe customer portal session"
  );

  return {
    url: portal.url
  };
}

export async function listActivePlans() {
  return prisma.plan.findMany({
    orderBy: {
      monthlyPriceCents: "asc"
    },
    where: {
      active: true
    }
  });
}

export async function listInvoicesForOrganization(input: {
  cursor?: string;
  organizationReference: string;
  take: number;
}) {
  const organization = await findOrganizationByReference(input.organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found while listing invoices.",
      status: 404,
      title: "Not Found"
    });
  }

  const rows = await prisma.invoice.findMany({
    ...(input.cursor
      ? {
          cursor: {
            id: input.cursor
          },
          skip: 1
        }
      : {}),
    orderBy: {
      createdAt: "desc"
    },
    take: input.take + 1,
    where: {
      organizationId: organization.id
    }
  });

  return {
    items: rows.slice(0, input.take),
    nextCursor: rows.length > input.take ? rows[input.take - 1]?.id ?? null : null
  };
}

export async function listUsageForOrganization(organizationReference: string) {
  const organization = await findOrganizationByReference(organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found while listing usage.",
      status: 404,
      title: "Not Found"
    });
  }

  const usageRows = await prisma.usageRecord.findMany({
    orderBy: {
      occurredAt: "desc"
    },
    take: 300,
    where: {
      organizationId: organization.id
    }
  });
  const byMetric = new Map<string, number>();

  for (const row of usageRows) {
    byMetric.set(row.metric, (byMetric.get(row.metric) ?? 0) + row.quantity);
  }

  return {
    byMetric: Array.from(byMetric.entries()).map(([metric, quantity]) => ({
      metric,
      quantity
    })),
    items: usageRows
  };
}

export async function cancelBillingForOrganization(input: {
  config: ApiConfig;
  organizationReference: string;
}): Promise<{ canceled: boolean; stripeSubscriptionId: string | null }> {
  const organization = await prisma.organization.findFirst({
    include: {
      subscriptions: {
        orderBy: {
          updatedAt: "desc"
        },
        take: 1
      }
    },
    where: {
      OR: [{ id: input.organizationReference }, { tenantId: input.organizationReference }]
    }
  });

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for billing cancellation.",
      status: 404,
      title: "Not Found"
    });
  }

  const subscription = organization.subscriptions[0] ?? null;

  if (!subscription?.stripeSubscriptionId) {
    return {
      canceled: false,
      stripeSubscriptionId: null
    };
  }

  const stripe = createStripeClient(input.config);
  await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

  await prisma.subscription.update({
    data: {
      canceledAt: new Date(),
      status: SubscriptionStatus.canceled
    },
    where: {
      id: subscription.id
    }
  });

  logger.info(
    {
      event: "billing.subscription.canceled",
      organizationId: organization.id,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      subscriptionId: subscription.id,
      tenantId: organization.tenantId
    },
    "Canceled organization subscription"
  );

  return {
    canceled: true,
    stripeSubscriptionId: subscription.stripeSubscriptionId
  };
}

