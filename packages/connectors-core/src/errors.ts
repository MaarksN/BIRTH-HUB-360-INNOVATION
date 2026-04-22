import {
  HubspotApiError,
  HubspotRateLimitError,
  HubspotTimeoutError
} from "@birthub/integrations/hubspot-crm-adapter";
import {
  OmieApiError,
  OmieRateLimitError,
  OmieTimeoutError
} from "@birthub/integrations/omie-erp-adapter";
import {
  SlackApiError,
  SlackRateLimitError,
  SlackTimeoutError
} from "@birthub/integrations/slack-message-adapter";
import {
  StripeApiError,
  StripeRateLimitError,
  StripeTimeoutError
} from "@birthub/integrations/stripe-payment-adapter";
import {
  ZenviaApiError,
  ZenviaRateLimitError,
  ZenviaTimeoutError
} from "@birthub/integrations/zenvia-message-adapter";

import type { ConnectorProvider } from "./types.js";

export interface SerializedConnectorError {
  action?: string | undefined;
  code: string;
  details?: Record<string, unknown> | undefined;
  message: string;
  provider: ConnectorProvider;
  retryable: boolean;
  statusCode?: number | undefined;
}

export class ConnectorExecutionError extends Error {
  readonly action?: string | undefined;
  readonly code: string;
  readonly details?: Record<string, unknown> | undefined;
  readonly provider: ConnectorProvider;
  readonly retryable: boolean;
  readonly statusCode?: number | undefined;

  constructor(input: SerializedConnectorError) {
    super(input.message);
    this.name = "ConnectorExecutionError";
    this.action = input.action;
    this.code = input.code;
    this.details = input.details;
    this.provider = input.provider;
    this.retryable = input.retryable;
    this.statusCode = input.statusCode;
  }
}

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
}

export function ensureConnectorExecutionError(
  error: unknown,
  fallback: {
    action?: string | undefined;
    provider: ConnectorProvider;
  }
): ConnectorExecutionError {
  if (error instanceof ConnectorExecutionError) {
    return error;
  }

  if (error instanceof HubspotRateLimitError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: error.responseBody ? { responseBody: error.responseBody } : undefined,
      message: error.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: error.statusCode
    });
  }

  if (error instanceof HubspotTimeoutError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: error.responseBody ? { responseBody: error.responseBody } : undefined,
      message: error.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: error.statusCode
    });
  }

  if (error instanceof HubspotApiError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: error.responseBody ? { responseBody: error.responseBody } : undefined,
      message: error.message,
      provider: fallback.provider,
      retryable: error.retryable,
      statusCode: error.statusCode
    });
  }

  if (error instanceof OmieRateLimitError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: error.responseBody ? { responseBody: error.responseBody } : undefined,
      message: error.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: error.statusCode
    });
  }

  if (error instanceof OmieTimeoutError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: error.responseBody ? { responseBody: error.responseBody } : undefined,
      message: error.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: error.statusCode
    });
  }

  if (error instanceof OmieApiError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: error.responseBody ? { responseBody: error.responseBody } : undefined,
      message: error.message,
      provider: fallback.provider,
      retryable: error.retryable,
      statusCode:
        error.code === "OMIE_AUTH_FAILED" ? 401 : error.code === "OMIE_TIMEOUT" ? 504 : error.statusCode
    });
  }

  if (error instanceof SlackRateLimitError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: error.responseBody ? { responseBody: error.responseBody } : undefined,
      message: error.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: error.statusCode
    });
  }

  if (error instanceof SlackTimeoutError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: error.responseBody ? { responseBody: error.responseBody } : undefined,
      message: error.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: error.statusCode
    });
  }

  if (error instanceof SlackApiError) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: error.code,
      details: {
        ...(error.responseBody ? { responseBody: error.responseBody } : {}),
        ...(error.slackError ? { slackError: error.slackError } : {})
      },
      message: error.message,
      provider: fallback.provider,
      retryable: error.retryable,
      statusCode: error.statusCode
    });
  }

  if (error instanceof StripeRateLimitError || (error instanceof Error && error.name === "StripeRateLimitError")) {
    const e = error as StripeRateLimitError;
    return new ConnectorExecutionError({
      action: fallback.action,
      code: e.code ?? "STRIPE_RATE_LIMIT",
      details: e.responseBody ? { responseBody: e.responseBody } : undefined,
      message: e.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: e.statusCode
    });
  }

  if (error instanceof StripeTimeoutError || (error instanceof Error && error.name === "StripeTimeoutError")) {
    const e = error as StripeTimeoutError;
    return new ConnectorExecutionError({
      action: fallback.action,
      code: e.code ?? "STRIPE_TIMEOUT",
      details: e.responseBody ? { responseBody: e.responseBody } : undefined,
      message: e.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: e.statusCode
    });
  }

  if (error instanceof StripeApiError || (error instanceof Error && error.name === "StripeApiError")) {
    const e = error as StripeApiError;
    return new ConnectorExecutionError({
      action: fallback.action,
      code: e.code ?? "STRIPE_REQUEST_FAILED",
      details: e.responseBody ? { responseBody: e.responseBody } : undefined,
      message: e.message,
      provider: fallback.provider,
      retryable: e.retryable ?? false,
      statusCode: e.statusCode
    });
  }

  if (error instanceof ZenviaRateLimitError || (error instanceof Error && error.name === "ZenviaRateLimitError")) {
    const e = error as ZenviaRateLimitError;
    return new ConnectorExecutionError({
      action: fallback.action,
      code: e.code ?? "ZENVIA_RATE_LIMIT",
      details: e.responseBody ? { responseBody: e.responseBody } : undefined,
      message: e.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: e.statusCode
    });
  }

  if (error instanceof ZenviaTimeoutError || (error instanceof Error && error.name === "ZenviaTimeoutError")) {
    const e = error as ZenviaTimeoutError;
    return new ConnectorExecutionError({
      action: fallback.action,
      code: e.code ?? "ZENVIA_TIMEOUT",
      details: e.responseBody ? { responseBody: e.responseBody } : undefined,
      message: e.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: e.statusCode
    });
  }

  if (error instanceof ZenviaApiError || (error instanceof Error && error.name === "ZenviaApiError")) {
    const e = error as ZenviaApiError;
    return new ConnectorExecutionError({
      action: fallback.action,
      code: e.code ?? "ZENVIA_REQUEST_FAILED",
      details: e.responseBody ? { responseBody: e.responseBody } : undefined,
      message: e.message,
      provider: fallback.provider,
      retryable: e.retryable ?? false,
      statusCode: e.statusCode
    });
  }


  if (error instanceof Error && error.name === "MissingConnectorCredentialError") {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: "CONNECTOR_CREDENTIAL_MISSING",
      message: error.message,
      provider: fallback.provider,
      retryable: false,
      statusCode: 412
    });
  }

  if (error instanceof Error && error.name === "MissingConnectorHandlerError") {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: "CONNECTOR_HANDLER_MISSING",
      message: error.message,
      provider: fallback.provider,
      retryable: false,
      statusCode: 500
    });
  }

  if (error instanceof Error && error.name === "ConnectorSecretDecryptionError") {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: "CONNECTOR_CREDENTIAL_DECRYPTION_FAILED",
      message: error.message,
      provider: fallback.provider,
      retryable: false,
      statusCode: 500
    });
  }

  if (
    error instanceof Error &&
    error.message === "HUBSPOT_CONTACT_LOOKUP_CREDENTIAL_REQUIRED"
  ) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: "CONNECTOR_CREDENTIAL_MISSING",
      message: "HubSpot connector credential is required to resolve the contact payload.",
      provider: fallback.provider,
      retryable: false,
      statusCode: 412
    });
  }

  if (
    error instanceof Error &&
    [
      "OMIE_CONNECTOR_EVENT_CUSTOMER_REQUIRED",
      "OMIE_CONNECTOR_EVENT_CUSTOMER_IDENTIFIER_REQUIRED",
      "OMIE_CONNECTOR_EVENT_CUSTOMER_NAME_REQUIRED",
      "OMIE_CONNECTOR_EVENT_SALES_ORDER_CUSTOMER_REQUIRED",
      "OMIE_CONNECTOR_EVENT_SALES_ORDER_ITEMS_REQUIRED",
      "OMIE_CONNECTOR_EVENT_SALES_ORDER_TAX_SCENARIO_REQUIRED",
      "OMIE_CUSTOMER_EXTERNAL_CODE_OR_TAX_ID_REQUIRED",
      "OMIE_CUSTOMER_NAME_REQUIRED",
      "OMIE_SALES_ORDER_CUSTOMER_REQUIRED",
      "OMIE_SALES_ORDER_FORECAST_DATE_INVALID",
      "OMIE_SALES_ORDER_INTEGRATION_CODE_REQUIRED",
      "OMIE_SALES_ORDER_ITEMS_REQUIRED",
      "OMIE_SALES_ORDER_TAX_SCENARIO_REQUIRED",
      "STRIPE_PAYMENT_ID_REQUIRED",
      "STRIPE_PAYMENT_OBJECT_REQUIRED",
      "STRIPE_PAYMENT_OBJECT_TYPE_UNSUPPORTED",
      "SLACK_MESSAGE_DESTINATION_REQUIRED",
      "SLACK_MESSAGE_TEXT_REQUIRED",
      "ZENVIA_MESSAGE_CHANNEL_REQUIRED",
      "ZENVIA_MESSAGE_FROM_REQUIRED",
      "ZENVIA_MESSAGE_TEXT_REQUIRED",
      "ZENVIA_MESSAGE_TO_REQUIRED"
    ].includes(error.message)
  ) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: "CONNECTOR_EVENT_INVALID",
      message:
        fallback.provider === "omie"
          ? "Omie connector event payload is missing the fields required to synchronize the ERP record."
          : fallback.provider === "stripe"
          ? "Stripe connector event payload is missing the identifiers required for processing."
          : fallback.provider === "zenvia"
            ? "Zenvia connector event payload is missing the fields required to deliver the message."
            : "Slack connector event payload is missing the fields required to deliver the message.",
      provider: fallback.provider,
      retryable: false,
      statusCode: 400
    });
  }

  if (
    error instanceof Error &&
    (error.message.startsWith("OMIE_SALES_ORDER_ITEM_PRODUCT_REQUIRED:") ||
      error.message.startsWith("OMIE_SALES_ORDER_ITEM_TAX_SCENARIO_REQUIRED:"))
  ) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: "CONNECTOR_EVENT_INVALID",
      message: "Omie connector event payload contains an invalid sales order item.",
      provider: fallback.provider,
      retryable: false,
      statusCode: 400
    });
  }

  if (
    error instanceof Error &&
    [
      "HUBSPOT_CONNECTOR_EVENT_EMAIL_OR_OBJECT_ID_REQUIRED",
      "HUBSPOT_CONNECTOR_EVENT_EMAIL_REQUIRED",
      "HUBSPOT_CONTACT_EMAIL_REQUIRED",
      "HUBSPOT_CONTACT_ID_REQUIRED"
    ].includes(error.message)
  ) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: "CONNECTOR_EVENT_INVALID",
      message: "HubSpot connector event payload is missing the identifiers required for processing.",
      provider: fallback.provider,
      retryable: false,
      statusCode: 400
    });
  }

  if (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.message.toLowerCase().includes("fetch failed") ||
      error.message.toLowerCase().includes("network"))
  ) {
    return new ConnectorExecutionError({
      action: fallback.action,
      code: "CONNECTOR_NETWORK_ERROR",
      message: error.message,
      provider: fallback.provider,
      retryable: true,
      statusCode: 503
    });
  }

  return new ConnectorExecutionError({
    action: fallback.action,
    code: "CONNECTOR_INTERNAL_ERROR",
    message: readErrorMessage(error, "Connector execution failed."),
    provider: fallback.provider,
    retryable: false,
    statusCode: 500
  });
}

export function serializeConnectorError(error: unknown): SerializedConnectorError {
  if (error instanceof ConnectorExecutionError) {
    return {
      ...(error.action ? { action: error.action } : {}),
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
      message: error.message,
      provider: error.provider,
      retryable: error.retryable,
      ...(error.statusCode !== undefined ? { statusCode: error.statusCode } : {})
    };
  }

  throw new Error("serializeConnectorError expects a ConnectorExecutionError instance.");
}
