import {
  BlingClient,
  ContaAzulClient,
  SankhyaClient,
  TinyERPClient,
} from "../clients/erp.js";
import { ConnectorExecutionError } from "../shared/errors.js";
import { ensureNotDuplicate } from "../shared/idempotency.js";
import { runWithLogging } from "../shared/run.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
} from "../shared/types.js";

export async function executeErp(
  ctx: ConnectorExecutionContext,
): Promise<ConnectorResult> {
  await ensureNotDuplicate(ctx);

  return runWithLogging(ctx, async () => {
    switch (ctx.provider) {
      case "conta-azul":
        return executeContaAzul(ctx);
      case "sankhya":
        return executeSankhya(ctx);
      case "bling":
        return executeBling(ctx);
      case "tiny":
        return executeTiny(ctx);
      default:
        throw new ConnectorExecutionError(
          "UNSUPPORTED_ERP_PROVIDER",
          `Unsupported ERP provider: ${ctx.provider}`,
          false,
        );
    }
  });
}

async function executeContaAzul(
  ctx: ConnectorExecutionContext,
): Promise<Record<string, unknown>> {
  const client = createContaAzulClient(ctx.credentials.secrets);
  const payload = ctx.payload;

  switch (ctx.action) {
    case "customer.upsert":
      return {
        created: true,
        result: await client.createCustomer({
          person_type: String(payload.person_type ?? "J") as "F" | "J",
          company_name:
            typeof payload.company_name === "string"
              ? payload.company_name
              : undefined,
          name: String(payload.name),
          email: String(payload.email),
          document:
            typeof payload.document === "string" ? payload.document : undefined,
          phone_number:
            typeof payload.phone_number === "string"
              ? payload.phone_number
              : undefined,
        }),
      };
    case "order.create":
      return {
        created: true,
        result: await client.createSale({
          customer_id: String(payload.customer_id),
          items: Array.isArray(payload.items)
            ? (payload.items as Array<{
                product_or_service_id: string;
                quantity: number;
                value: number;
              }>)
            : [],
          issue_date: String(payload.issue_date),
          notes:
            typeof payload.notes === "string" ? payload.notes : undefined,
        }),
      };
    case "receivable.create":
      return {
        created: true,
        result: await client.createReceivable({
          customer_id: String(payload.customer_id),
          description: String(payload.description),
          amount: Number(payload.amount),
          due_date: String(payload.due_date),
        }),
      };
    default:
      throw new ConnectorExecutionError(
        "UNSUPPORTED_ERP_ACTION",
        `Unsupported action for Conta Azul: ${ctx.action}`,
        false,
      );
  }
}

async function executeSankhya(
  ctx: ConnectorExecutionContext,
): Promise<Record<string, unknown>> {
  const client = createSankhyaClient(ctx.credentials.secrets);

  return {
    saved: true,
    result: await client.saveRecord(
      String(ctx.payload.entityName ?? "Financeiro"),
      record(ctx.payload.fields),
      recordOrUndefined(ctx.payload.pk),
    ),
  };
}

async function executeBling(
  ctx: ConnectorExecutionContext,
): Promise<Record<string, unknown>> {
  const client = createBlingClient(ctx.credentials.secrets);

  switch (ctx.action) {
    case "customer.upsert":
      return {
        created: true,
        result: await client.createContact(record(ctx.payload.contact) as {
          nome: string;
          email?: string;
          cnpj?: string;
          ie?: string;
          tipoPessoa?: "F" | "J";
        }),
      };
    case "order.create":
      return {
        created: true,
        result: await client.createOrder(record(ctx.payload.order) as {
          clienteId: number;
          items: Array<{
            produtoId: number;
            quantidade: number;
            preco: number;
          }>;
          transportadoraId?: number;
          observacoes?: string;
        }),
      };
    default:
      throw new ConnectorExecutionError(
        "UNSUPPORTED_ERP_ACTION",
        `Unsupported action for Bling: ${ctx.action}`,
        false,
      );
  }
}

async function executeTiny(
  ctx: ConnectorExecutionContext,
): Promise<Record<string, unknown>> {
  const client = createTinyErpClient(ctx.credentials.secrets);

  switch (ctx.action) {
    case "customer.upsert":
      return {
        created: true,
        result: await client.createContact(record(ctx.payload.contact) as {
          nome: string;
          cpfCnpj?: string;
          email?: string;
          fone?: string;
        }),
      };
    case "order.create":
      return {
        note: "Tiny client snippet available does not expose create order directly; using emitNFe as the initial bridge.",
        result: await client.emitNFe(record(ctx.payload.nfe)),
      };
    default:
      throw new ConnectorExecutionError(
        "UNSUPPORTED_ERP_ACTION",
        `Unsupported action for Tiny: ${ctx.action}`,
        false,
      );
  }
}

function createContaAzulClient(
  secrets: Record<string, string | undefined>,
): ContaAzulClient {
  const accessToken = requiredSecret(secrets, "accessToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new ContaAzulClient(accessToken, baseUrl)
    : new ContaAzulClient(accessToken);
}

function createSankhyaClient(
  secrets: Record<string, string | undefined>,
): SankhyaClient {
  const username = requiredSecret(secrets, "username");
  const password = requiredSecret(secrets, "password");
  const appKey = requiredSecret(secrets, "appKey");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new SankhyaClient(username, password, appKey, baseUrl)
    : new SankhyaClient(username, password, appKey);
}

function createBlingClient(
  secrets: Record<string, string | undefined>,
): BlingClient {
  const accessToken = requiredSecret(secrets, "accessToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new BlingClient(accessToken, baseUrl)
    : new BlingClient(accessToken);
}

function createTinyErpClient(
  secrets: Record<string, string | undefined>,
): TinyERPClient {
  const apiToken = requiredSecret(secrets, "apiToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new TinyERPClient(apiToken, baseUrl)
    : new TinyERPClient(apiToken);
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

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConnectorExecutionError(
      "INVALID_PAYLOAD",
      "Expected object payload",
      false,
    );
  }

  return value as Record<string, unknown>;
}

function recordOrUndefined(
  value: unknown,
): Record<string, unknown> | undefined {
  return value == null ? undefined : record(value);
}
