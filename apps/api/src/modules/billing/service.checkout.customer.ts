import type { ApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import {
  Role,
  prisma,
  type Prisma
} from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { createStripeClient } from "./stripe.client.js";
import {
  findOrganizationByReference,
  type DatabaseClient
} from "./service.shared.js";

const logger = createLogger("billing-service");

type CheckoutLocale = "en" | "es" | "fr" | "it" | "pt-BR";

function normalizeStripeLocale(
  locale: string | null | undefined
): CheckoutLocale | undefined {
  if (!locale) {
    return undefined;
  }

  const normalized = locale.toLowerCase();
  const byPrefix: Readonly<Record<string, CheckoutLocale>> = {
    en: "en",
    "en-us": "en",
    es: "es",
    fr: "fr",
    it: "it",
    pt: "pt-BR",
    "pt-br": "pt-BR"
  };

  const directMatch = byPrefix[normalized];
  if (directMatch) {
    return directMatch;
  }

  const primaryTag = normalized.split("-")[0] ?? "";
  return byPrefix[primaryTag];
}

function readOrganizationSetting(
  settings: Prisma.JsonValue | null | undefined,
  key: string
): string | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return null;
  }

  const value = (settings as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function resolveCheckoutPreferences(input: {
  countryCode?: string | null | undefined;
  locale?: string | null | undefined;
  settings: Prisma.JsonValue | null | undefined;
}): {
  countryCode: string | null;
  locale: CheckoutLocale | undefined;
} {
  const locale =
    normalizeStripeLocale(input.locale) ??
    normalizeStripeLocale(readOrganizationSetting(input.settings, "locale"));
  const countryCode =
    input.countryCode?.trim().toUpperCase() ??
    readOrganizationSetting(input.settings, "countryCode")?.toUpperCase() ??
    null;

  return {
    countryCode,
    locale
  };
}

export async function provisionStripeCustomerForOrganization(input: {
  client?: DatabaseClient;
  config: ApiConfig;
  email: string;
  name: string;
  organizationReference: string;
}): Promise<string> {
  const client = input.client ?? prisma;
  const organization = await findOrganizationByReference(input.organizationReference, client);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found when provisioning Stripe customer.",
      status: 404,
      title: "Not Found"
    });
  }

  if (organization.stripeCustomerId) {
    return organization.stripeCustomerId;
  }

  const stripe = createStripeClient(input.config);
  const customer = await stripe.customers.create({
    email: input.email,
    metadata: {
      organizationId: organization.id,
      tenantId: organization.tenantId
    },
    name: input.name
  });

  await client.organization.update({
    data: {
      stripeCustomerId: customer.id
    },
    where: {
      id: organization.id
    }
  });

  await client.subscription.updateMany({
    data: {
      stripeCustomerId: customer.id
    },
    where: {
      organizationId: organization.id
    }
  });

  logger.info(
    {
      event: "billing.customer.provisioned",
      organizationId: organization.id,
      stripeCustomerId: customer.id,
      tenantId: organization.tenantId
    },
    "Provisioned Stripe customer for organization"
  );

  return customer.id;
}

export async function resolveCustomerForCheckout(input: {
  config: ApiConfig;
  organizationReference: string;
}): Promise<string> {
  const organization = await prisma.organization.findFirst({
    include: {
      memberships: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: "asc"
        },
        take: 1,
        where: {
          role: Role.OWNER
        }
      }
    },
    where: {
      OR: [{ id: input.organizationReference }, { tenantId: input.organizationReference }]
    }
  });

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for checkout.",
      status: 404,
      title: "Not Found"
    });
  }

  if (organization.stripeCustomerId) {
    return organization.stripeCustomerId;
  }

  const owner = organization.memberships[0]?.user;
  const email = owner?.email ?? `billing+${organization.tenantId}@birthub.local`;
  const name = owner?.name ?? organization.name;

  return provisionStripeCustomerForOrganization({
    config: input.config,
    email,
    name,
    organizationReference: organization.id
  });
}
