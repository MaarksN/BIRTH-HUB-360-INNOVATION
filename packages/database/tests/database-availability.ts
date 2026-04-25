// @ts-expect-error TODO: remover suppressão ampla
// 
import type { TestContext } from "node:test";

type ConnectivityProbeClient = {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

type DatabaseRequirementOptions = {
  label?: string;
  required?: boolean;
};

function envBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function failOrSkip(context: TestContext, message: string, required: boolean): false {
  if (required) {
    throw new Error(message);
  }

  context.skip(message);
  return false;
}

function isDatabaseUnavailableError(error: unknown): boolean {
  const errorWithCode =
    typeof error === "object" && error !== null ? (error as { code?: unknown; message?: unknown }) : null;

  const rawCode = errorWithCode?.code;
  if (
    typeof rawCode === "string" &&
    ["3D000", "ECONNREFUSED", "P1000", "P1001"].includes(rawCode.toUpperCase())
  ) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("econnrefused") ||
    message.includes("3d000") ||
    message.includes("p1000") ||
    message.includes("p1001") ||
    message.includes("authentication failed against database server") ||
    message.includes("provided database credentials") ||
    (message.includes("database") && message.includes("does not exist")) ||
    message.includes("can't reach database server") ||
    message.includes("can't connect") ||
    message.includes("connection refused")
  );
}

export async function ensureDatabaseAvailableOrSkip(
  context: TestContext,
  client: ConnectivityProbeClient,
  options: DatabaseRequirementOptions = {}
): Promise<boolean> {
  const label = options.label ?? "teste de integração";
  const required = options.required ?? shouldRequireDeterministicIsolationValidation();

  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return failOrSkip(
        context,
        `DATABASE_URL configurado, mas o banco não está acessível para ${label}.`,
        required
      );
    }

    throw error;
  }
}

export function requireDatabaseUrlOrSkip(
  context: TestContext,
  databaseUrl: string,
  options: DatabaseRequirementOptions = {}
): boolean {
  const label = options.label ?? "teste de integração";
  const required = options.required ?? shouldRequireDeterministicIsolationValidation();

  if (databaseUrl.trim()) {
    return true;
  }

  return failOrSkip(
    context,
    `DATABASE_URL é obrigatória para ${label}.`,
    required
  );
}

export function shouldRequireDeterministicIsolationValidation(): boolean {
  return envBoolean(process.env.BIRTHUB_REQUIRE_RLS_TESTS);
}
