import type Stripe from "stripe";
type StripeOverride = Partial<{
    checkoutUrl: string;
    customerId: string;
    portalUrl: string;
}>;
export declare function createStripeMock(overrides?: StripeOverride): Stripe;
export {};
