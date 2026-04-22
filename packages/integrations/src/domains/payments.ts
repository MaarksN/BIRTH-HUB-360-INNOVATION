import {
  AsaasClient,
  IuguClient,
  MercadoPagoClient,
  PagSeguroClient,
  VindiClient,
} from "../clients/payments-extended.js";
import { ConnectorExecutionError } from "../shared/errors.js";
import { ensureNotDuplicate } from "../shared/idempotency.js";
import { runWithLogging } from "../shared/run.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
} from "../shared/types.js";

type PaymentCustomer = {
  name: string;
  email: string;
  document: string;
  phone?: string;
};

type PaymentsClient = {
  generatePix(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
  ): Promise<unknown>;
  generateBoleto(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
    dueDate: Date,
  ): Promise<unknown>;
  confirmPayment(paymentId: string, tenantId: string): Promise<unknown>;
};

export async function executePayments(
  ctx: ConnectorExecutionContext,
): Promise<ConnectorResult> {
  await ensureNotDuplicate(ctx);

  return runWithLogging(ctx, async () => {
    const client = buildClient(ctx);
    const payload = ctx.payload;

    switch (ctx.action) {
      case "pix.create":
        return {
          created: true,
          type: "pix",
          result: await client.generatePix(
            Number(payload.amount),
            String(payload.description),
            ctx.tenantId,
            ensureCustomer(payload.customer),
          ),
        };
      case "boleto.create":
        return {
          created: true,
          type: "boleto",
          result: await client.generateBoleto(
            Number(payload.amount),
            String(payload.description),
            ctx.tenantId,
            ensureCustomer(payload.customer),
            new Date(String(payload.dueDate)),
          ),
        };
      case "payment.confirm":
        return {
          confirmed: true,
          result: await client.confirmPayment(
            String(payload.paymentId),
            ctx.tenantId,
          ),
        };
      default:
        throw new ConnectorExecutionError(
          "UNSUPPORTED_PAYMENT_ACTION",
          `Unsupported payment action: ${ctx.action}`,
          false,
        );
    }
  });
}

function buildClient(ctx: ConnectorExecutionContext): PaymentsClient {
  const secrets = ctx.credentials.secrets;
  const baseUrl = secrets.baseUrl;

  switch (ctx.provider) {
    case "asaas":
      return typeof baseUrl === "string"
        ? new AsaasClient(requiredSecret(secrets, "apiKey"), baseUrl)
        : new AsaasClient(requiredSecret(secrets, "apiKey"));
    case "vindi":
      return typeof baseUrl === "string"
        ? new VindiClient(requiredSecret(secrets, "apiKey"), baseUrl)
        : new VindiClient(requiredSecret(secrets, "apiKey"));
    case "iugu":
      return typeof baseUrl === "string"
        ? new IuguClient(requiredSecret(secrets, "apiKey"), baseUrl)
        : new IuguClient(requiredSecret(secrets, "apiKey"));
    case "mercado-pago":
      return typeof baseUrl === "string"
        ? new MercadoPagoClient(requiredSecret(secrets, "accessToken"), baseUrl)
        : new MercadoPagoClient(requiredSecret(secrets, "accessToken"));
    case "pagseguro":
      return typeof baseUrl === "string"
        ? new PagSeguroClient(requiredSecret(secrets, "token"), baseUrl)
        : new PagSeguroClient(requiredSecret(secrets, "token"));
    default:
      throw new ConnectorExecutionError(
        "UNSUPPORTED_PAYMENT_PROVIDER",
        `Unsupported payment provider: ${ctx.provider}`,
        false,
      );
  }
}

function ensureCustomer(value: unknown): PaymentCustomer {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConnectorExecutionError(
      "INVALID_CUSTOMER",
      "Missing or invalid customer payload",
      false,
    );
  }

  const customer = value as Record<string, unknown>;

  if (!customer.name || !customer.email || !customer.document) {
    throw new ConnectorExecutionError(
      "INVALID_CUSTOMER",
      "Customer requires name, email and document",
      false,
    );
  }

  return {
    name: String(customer.name),
    email: String(customer.email),
    document: String(customer.document),
    phone: typeof customer.phone === "string" ? customer.phone : undefined,
  };
}

function requiredSecret(
  secrets: Record<string, string | undefined>,
  key: string,
): string {
  const value = secrets[key];

  if (!value) {
    throw new ConnectorExecutionError(
      "MISSING_CREDENTIAL",
      `Missing credential: ${key}`,
      false,
    );
  }

  return value;
}
