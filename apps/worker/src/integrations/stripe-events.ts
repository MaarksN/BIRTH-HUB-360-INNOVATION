import type { StripePaymentReadInput } from "@birthub/integrations/stripe-payment-adapter";

export interface StripePaymentPayload extends StripePaymentReadInput {}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readNestedString(input: Record<string, unknown>, key: string): string | undefined {
  const direct = readString(input[key]);
  if (direct) {
    return direct;
  }

  const properties = readObject(input.properties);
  return properties ? readString(properties[key]) : undefined;
}

function resolveObjectType(payload: Record<string, unknown>): StripePaymentPayload["objectType"] {
  const stripePayload = readObject(payload.stripe);
  const stripeData = readObject(stripePayload?.data);
  const stripeObject = readObject(stripeData?.object);
  const directObjectType =
    readNestedString(payload, "objectType") ??
    readNestedString(payload, "paymentObjectType") ??
    readString(stripeObject?.object);

  if (directObjectType === "charge" || directObjectType === "payment_intent") {
    return directObjectType;
  }

  const eventType =
    readNestedString(payload, "eventType") ?? readString(stripePayload?.type);

  if (eventType?.startsWith("charge.")) {
    return "charge";
  }

  if (eventType?.startsWith("payment_intent.")) {
    return "payment_intent";
  }

  throw new Error("STRIPE_PAYMENT_OBJECT_TYPE_UNSUPPORTED");
}

export function extractStripePaymentPayload(payload: Record<string, unknown>): StripePaymentPayload {
  const paymentPayload = readObject(payload.payment) ?? payload;
  const stripePayload = readObject(paymentPayload.stripe);
  const stripeData = readObject(stripePayload?.data);
  const stripeObject = readObject(stripeData?.object);

  if (!paymentPayload) {
    throw new Error("STRIPE_PAYMENT_OBJECT_REQUIRED");
  }

  const objectId =
    readNestedString(paymentPayload, "objectId") ??
    readNestedString(paymentPayload, "paymentId") ??
    readString(stripeObject?.id);

  if (!objectId) {
    throw new Error("STRIPE_PAYMENT_ID_REQUIRED");
  }

  return {
    objectId,
    objectType: resolveObjectType(paymentPayload)
  };
}
