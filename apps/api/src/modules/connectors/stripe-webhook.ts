import type { ApiConfig } from "@birthub/config";
import Stripe from "stripe";

import { ProblemDetailsError } from "../../lib/problem-details.js";

export const supportedStripeConnectorEventTypes = [
  "charge.failed",
  "charge.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.succeeded"
] as const;

const supportedStripeConnectorEventTypeSet = new Set<string>(supportedStripeConnectorEventTypes);

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function resolveStripeObjectType(event: Stripe.Event): "charge" | "payment_intent" {
  const object = readObject(event.data.object);
  const objectType = readString(object?.object);

  if (objectType === "charge" || objectType === "payment_intent") {
    return objectType;
  }

  if (event.type.startsWith("charge.")) {
    return "charge";
  }

  if (event.type.startsWith("payment_intent.")) {
    return "payment_intent";
  }

  throw new ProblemDetailsError({
    detail: "Stripe connector event does not contain a supported payment object.",
    status: 400,
    title: "Invalid Connector Webhook"
  });
}

function resolveStripeObjectId(event: Stripe.Event): string {
  const object = readObject(event.data.object);
  const objectId = readString(object?.id);

  if (objectId) {
    return objectId;
  }

  throw new ProblemDetailsError({
    detail: "Stripe connector event is missing the payment object identifier.",
    status: 400,
    title: "Invalid Connector Webhook"
  });
}

export function constructStripeConnectorEvent(input: {
  config: ApiConfig;
  rawBody?: string | undefined;
  signature?: string | undefined;
  webhookSecret: string;
}): Stripe.Event {
  if (!input.signature) {
    throw new ProblemDetailsError({
      detail: "Stripe webhook signature header is required.",
      status: 400,
      title: "Bad Request"
    });
  }

  if (!input.rawBody) {
    throw new ProblemDetailsError({
      detail: "Stripe webhook raw body is required.",
      status: 400,
      title: "Bad Request"
    });
  }

  try {
    const stripe = new Stripe("placeholder");
    return stripe.webhooks.constructEvent(
      input.rawBody,
      input.signature,
      input.webhookSecret,
      input.config.STRIPE_WEBHOOK_TOLERANCE_SECONDS
    );
  } catch (error) {
    throw new ProblemDetailsError({
      detail: "Invalid Stripe webhook signature.",
      errors: error instanceof Error ? error.message : "stripe_signature_validation_failed",
      status: 401,
      title: "Unauthorized"
    });
  }
}

export function buildStripeConnectorWebhookPayload(event: Stripe.Event): Record<string, unknown> {
  if (!supportedStripeConnectorEventTypeSet.has(event.type)) {
    throw new ProblemDetailsError({
      detail: `Stripe connector event '${event.type}' is not supported in this phase.`,
      status: 400,
      title: "Invalid Connector Webhook"
    });
  }

  const objectType = resolveStripeObjectType(event);
  const objectId = resolveStripeObjectId(event);

  return {
    objectId,
    objectType,
    stripe: {
      api_version: event.api_version ?? null,
      created: event.created,
      data: {
        object: event.data.object
      },
      id: event.id,
      livemode: event.livemode,
      type: event.type
    }
  };
}
