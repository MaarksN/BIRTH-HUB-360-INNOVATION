import { getApiConfig } from "@birthub/config";
import { prisma, Prisma } from "@birthub/database";
import { createLogger } from "@birthub/logger";

import { createStripeClient } from "./stripe.client.js";

const logger = createLogger("billing-sync-plans");
const DEFAULT_PLAN_LIMITS = {
  agents: 5,
  features: {
    agents: true,
    workflows: true
  },
  workflows: 30
} satisfies Prisma.InputJsonObject;

type PlanRecord = {
  code: string;
  planData: Omit<Prisma.PlanUncheckedCreateInput, "code">;
};

type StripeRecurringPriceSource = {
  currency: string;
  id: string;
  productId: string;
  recurringInterval: string | null;
  unitAmount: number | null;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function parseLimitsMetadata(raw: string | undefined): Prisma.InputJsonValue {
  if (!raw) {
    return DEFAULT_PLAN_LIMITS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed && !Array.isArray(parsed)) {
      return parsed as Prisma.InputJsonValue;
    }
  } catch {
    // Ignore malformed metadata and fallback to defaults.
  }

  return DEFAULT_PLAN_LIMITS;
}

function readStringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readMetadataString(source: unknown, key: string): string | undefined {
  const sourceRecord = asRecord(source);

  if (!sourceRecord) {
    return undefined;
  }

  const value = sourceRecord[key];
  return typeof value === "string" ? value : undefined;
}

function resolvePriceProductId(price: unknown): string | null {
  const priceRecord = asRecord(price);

  if (!priceRecord) {
    return null;
  }

  const product = priceRecord.product;

  if (typeof product === "string") {
    return product;
  }

  const productRecord = asRecord(product);

  if (productRecord) {
    return readStringValue(productRecord.id);
  }

  return null;
}

function normalizeRecurringPrice(price: unknown): StripeRecurringPriceSource | null {
  const priceRecord = asRecord(price);

  if (!priceRecord) {
    return null;
  }

  const id = readStringValue(priceRecord.id);
  const currency = readStringValue(priceRecord.currency);
  const productId = resolvePriceProductId(price);
  const recurring = asRecord(priceRecord.recurring);

  if (!id || !currency || !productId) {
    return null;
  }

  return {
    currency,
    id,
    productId,
    recurringInterval: recurring ? readStringValue(recurring.interval) : null,
    unitAmount: typeof priceRecord.unit_amount === "number" ? priceRecord.unit_amount : null
  };
}

function buildRecurringPriceByProduct(
  prices: readonly unknown[]
): Map<string, StripeRecurringPriceSource> {
  const recurringPriceByProduct = new Map<string, StripeRecurringPriceSource>();

  for (const price of prices) {
    const normalizedPrice = normalizeRecurringPrice(price);

    if (!normalizedPrice || recurringPriceByProduct.has(normalizedPrice.productId)) {
      continue;
    }

    recurringPriceByProduct.set(normalizedPrice.productId, normalizedPrice);
  }

  return recurringPriceByProduct;
}

function buildPlanCode(product: unknown): string {
  const productRecord = asRecord(product);
  const metadataCode = readMetadataString(productRecord?.metadata, "code")?.trim().toLowerCase();
  const productName = readStringValue(productRecord?.name) ?? "plan";

  if (metadataCode && metadataCode.length > 0) {
    return metadataCode;
  }

  return slugify(productName);
}

function buildPlanRecord(product: unknown, recurringPrice: StripeRecurringPriceSource): PlanRecord {
  const productRecord = asRecord(product);
  const yearlyPriceCents = recurringPrice.recurringInterval === "year" ? recurringPrice.unitAmount ?? 0 : null;

  return {
    code: buildPlanCode(product),
    planData: {
      active: true,
      currency: recurringPrice.currency,
      description: readStringValue(productRecord?.description) ?? null,
      limits: parseLimitsMetadata(readMetadataString(productRecord?.metadata, "limits_json")),
      monthlyPriceCents: recurringPrice.unitAmount ?? 0,
      name: readStringValue(productRecord?.name) ?? "Plan",
      stripePriceId: recurringPrice.id,
      stripeProductId: readStringValue(productRecord?.id) ?? "",
      yearlyPriceCents
    }
  };
}

async function main(): Promise<void> {
  const config = getApiConfig();
  const stripe = createStripeClient(config);
  const products = await stripe.products.list({
    active: true,
    limit: 100
  });
  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
    type: "recurring"
  });
  const recurringPriceByProduct = buildRecurringPriceByProduct(prices.data);
  const planRecords: PlanRecord[] = products.data.flatMap((product) => {
    const productRecord = asRecord(product);
    const productId = readStringValue(productRecord?.id);

    if (!productId) {
      return [];
    }

    const recurringPrice = recurringPriceByProduct.get(productId);

    if (!recurringPrice) {
      return [];
    }

    return [buildPlanRecord(product, recurringPrice)];
  });

  await Promise.all(
    planRecords.map(({ code, planData }) =>
      prisma.plan.upsert({
        create: {
          code,
          ...planData
        },
        update: planData,
        where: {
          code
        }
      })
    )
  );

  const synchronized = planRecords.length;

  logger.info({ synchronized }, "Stripe products/prices synced into local plans table");
}

void main()
  .catch((error) => {
    logger.error({ error }, "Failed to sync Stripe plans");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
