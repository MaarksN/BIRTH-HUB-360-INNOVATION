import type { ApiConfig } from "@birthub/config";
import Stripe from "stripe";

type StripeClientOptions = NonNullable<ConstructorParameters<typeof Stripe>[1]>;

export const STRIPE_API_VERSION = "2026-03-25.dahlia";

let cachedStripeClient: Stripe | null = null;
let cachedSecretKey: string | null = null;

export function createStripeClient(config: ApiConfig): Stripe {
  if (cachedStripeClient && cachedSecretKey === config.STRIPE_SECRET_KEY) {
    return cachedStripeClient;
  }

  const clientOptions = {
    apiVersion: STRIPE_API_VERSION,
    appInfo: {
      name: "BirthHub360 API",
      version: "cycle-7"
    }
  } satisfies StripeClientOptions;

  cachedStripeClient = new Stripe(config.STRIPE_SECRET_KEY, clientOptions);
  cachedSecretKey = config.STRIPE_SECRET_KEY;

  return cachedStripeClient;
}
