import {
  getDatabaseConfig,
  getEnvironmentSource,
  isProductionEnvironment,
  readTrimmedEnvironmentValue,
  resolveNodeEnvironment,
  type RuntimeEnvironment,
} from "@birthub/config";
import { createLogger } from "@birthub/logger";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientModule, {
  type Prisma as PrismaNamespace,
  type PrismaClient as PrismaClientType,
} from "@prisma/client";

import { PrismaQueryTimeoutError } from "./errors/prisma-query-timeout.error.js";
import { createPrismaProxy } from "./prisma-proxy.js";
import { getTenantContext, requireTenantId } from "./tenant-context.js";
import { scopePrismaArgs } from "./tenant-scope.js";

const prismaRuntime = prismaClientModule as typeof import("@prisma/client");

export const Prisma = prismaRuntime.Prisma;
export const PrismaClient = prismaRuntime.PrismaClient;
export type PrismaClient = PrismaClientType;

export namespace Prisma {
  export type AuditLogCreateArgs = PrismaNamespace.AuditLogCreateArgs;
  export type AuditLogCreateManyInput = PrismaNamespace.AuditLogCreateManyInput;
  export type AuditLogDefaultArgs = PrismaNamespace.AuditLogDefaultArgs;
  export type AuditLogGetPayload<
    S extends boolean | null | undefined | AuditLogDefaultArgs
  > = PrismaNamespace.AuditLogGetPayload<S>;
  export type BatchPayload = PrismaNamespace.BatchPayload;
  export type BillingCreditUncheckedCreateInput =
    PrismaNamespace.BillingCreditUncheckedCreateInput;
  export type InputJsonObject = PrismaNamespace.InputJsonObject;
  export type InputJsonValue = PrismaNamespace.InputJsonValue;
  export type InvoiceUncheckedCreateInput = PrismaNamespace.InvoiceUncheckedCreateInput;
  export type InvoiceUncheckedUpdateInput = PrismaNamespace.InvoiceUncheckedUpdateInput;
  export type JsonValue = PrismaNamespace.JsonValue;
  export type LogLevel = PrismaNamespace.LogLevel;
  export type MembershipDefaultArgs = PrismaNamespace.MembershipDefaultArgs;
  export type MembershipFindManyArgs = PrismaNamespace.MembershipFindManyArgs;
  export type MembershipGetPayload<
    S extends boolean | null | undefined | MembershipDefaultArgs
  > = PrismaNamespace.MembershipGetPayload<S>;
  export type NotificationCreateArgs = PrismaNamespace.NotificationCreateArgs;
  export type NotificationCreateManyArgs = PrismaNamespace.NotificationCreateManyArgs;
  export type NotificationCreateManyInput = PrismaNamespace.NotificationCreateManyInput;
  export type NotificationDefaultArgs = PrismaNamespace.NotificationDefaultArgs;
  export type NotificationGetPayload<
    S extends boolean | null | undefined | NotificationDefaultArgs
  > = PrismaNamespace.NotificationGetPayload<S>;
  export type NotificationUncheckedCreateInput =
    PrismaNamespace.NotificationUncheckedCreateInput;
  export type NullableJsonNullValueInput = PrismaNamespace.NullableJsonNullValueInput;
  export type OrganizationWhereInput = PrismaNamespace.OrganizationWhereInput;
  export type PlanUncheckedCreateInput = PrismaNamespace.PlanUncheckedCreateInput;
  export type PrismaPromise<T> = PrismaNamespace.PrismaPromise<T>;
  export type Sql = PrismaNamespace.Sql;
  export type SubscriptionUncheckedCreateInput =
    PrismaNamespace.SubscriptionUncheckedCreateInput;
  export type SubscriptionUncheckedUpdateInput =
    PrismaNamespace.SubscriptionUncheckedUpdateInput;
  export type TransactionClient = PrismaNamespace.TransactionClient;
  export type UserPreferenceDefaultArgs = PrismaNamespace.UserPreferenceDefaultArgs;
  export type UserPreferenceGetPayload<
    S extends boolean | null | undefined | UserPreferenceDefaultArgs
  > = PrismaNamespace.UserPreferenceGetPayload<S>;
  export type UserPreferenceUncheckedCreateInput =
    PrismaNamespace.UserPreferenceUncheckedCreateInput;
  export type UserPreferenceUncheckedUpdateInput =
    PrismaNamespace.UserPreferenceUncheckedUpdateInput;
  export type UserPreferenceUpsertArgs = PrismaNamespace.UserPreferenceUpsertArgs;
  export type UserWhereInput = PrismaNamespace.UserWhereInput;
  export type WorkflowUpdateInput = PrismaNamespace.WorkflowUpdateInput;
}

const DEFAULT_QUERY_TIMEOUT_MS = 5_000;
const DEFAULT_DATABASE_CONNECTION_LIMIT = 10;
const DEFAULT_DEVELOPMENT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/birthub?schema=public";
const DEFAULT_SLOW_QUERY_MS = 750;

const globalForPrisma = globalThis as typeof globalThis & {
  birthubPrisma?: PrismaClient;
};
let _client: PrismaClient | undefined;

type DatabaseBootstrapLogger = {
  warn: (payload: Record<string, unknown>, message: string) => void;
};

export interface CreatePrismaClientOptions {
  databaseUrl?: string;
  env?: RuntimeEnvironment;
  logger?: DatabaseBootstrapLogger;
}

interface ResolvedPrismaClientOptions {
  connectionLimit: number;
  databaseUrl: string;
  logger: DatabaseBootstrapLogger;
  nodeEnv: ReturnType<typeof resolveNodeEnvironment>;
  queryTimeoutMs: number;
  slowQueryThresholdMs: number;
}

type MetricLabels = Record<string, string | number | boolean | null | undefined>;

type GlobalMetricsApi = {
  incrementCounter: (name: string, labels?: MetricLabels, amount?: number, help?: string) => void;
  observeHistogram: (
    name: string,
    value: number,
    labels?: MetricLabels,
    options?: {
      buckets?: number[];
      help?: string;
    }
  ) => void;
  setGauge: (name: string, value: number, labels?: MetricLabels, help?: string) => void;
};

const globalMetrics = globalThis as typeof globalThis & {
  __birthubMetricsApi?: GlobalMetricsApi;
};

function getMetricsApi(): GlobalMetricsApi | null {
  return globalMetrics.__birthubMetricsApi ?? null;
}

function parsePositiveNumber(rawValue: string | undefined): number | undefined {
  const value = Number(rawValue ?? "");
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function resolveQueryTimeoutMs(env: RuntimeEnvironment = getEnvironmentSource()): number {
  return getDatabaseConfig(env).PRISMA_QUERY_TIMEOUT_MS ?? DEFAULT_QUERY_TIMEOUT_MS;
}

function raceWithConfiguredTimeout<T>(
  promise: Promise<T>,
  operation: string,
  timeoutMs: number,
  model?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new PrismaQueryTimeoutError(operation, timeoutMs, model));
      }, timeoutMs);

      void promise.then(
        () => {
          clearTimeout(timer);
        },
        () => {
          clearTimeout(timer);
        }
      );
    }),
  ]);
}

export function raceWithTimeout<T>(
  promise: Promise<T>,
  operation: string,
  model?: string,
  env: RuntimeEnvironment = getEnvironmentSource()
): Promise<T> {
  return raceWithConfiguredTimeout(promise, operation, resolveQueryTimeoutMs(env), model);
}

export function resolveConnectionLimit(
  databaseUrl: string,
  env: RuntimeEnvironment = getEnvironmentSource()
): number {
  const explicit = parsePositiveNumber(
    readTrimmedEnvironmentValue("DATABASE_CONNECTION_LIMIT", env)
  );
  if (explicit) {
    return explicit;
  }

  try {
    const parsed = new URL(databaseUrl);
    const connectionLimit = parsePositiveNumber(
      parsed.searchParams.get("connection_limit") ?? undefined
    );
    if (connectionLimit) {
      return connectionLimit;
    }
  } catch {
    // Ignore malformed URLs and fall back to the default.
  }

  return DEFAULT_DATABASE_CONNECTION_LIMIT;
}

function resolveSlowQueryThresholdMs(env: RuntimeEnvironment = getEnvironmentSource()): number {
  return getDatabaseConfig(env).DB_SLOW_QUERY_MS ?? DEFAULT_SLOW_QUERY_MS;
}

let activeQueries = 0;

function updateDatabaseGauges(connectionLimit: number): void {
  const metrics = getMetricsApi();
  if (!metrics) {
    return;
  }

  metrics.setGauge(
    "birthub_db_active_queries",
    activeQueries,
    {},
    "Current number of active Prisma queries."
  );
  metrics.setGauge(
    "birthub_db_connection_pool_usage_ratio",
    connectionLimit > 0 ? activeQueries / connectionLimit : 0,
    {},
    "Approximate database connection pool usage ratio."
  );
}

export function resolveRuntimeDatabaseUrl(
  rawUrl: string | undefined,
  env: RuntimeEnvironment = getEnvironmentSource()
): string {
  const trimmedDatabaseUrl = rawUrl?.trim();
  if (trimmedDatabaseUrl) {
    return trimmedDatabaseUrl;
  }

  const nodeEnv = resolveNodeEnvironment(env);
  if (nodeEnv === "development" || nodeEnv === "test") {
    return DEFAULT_DEVELOPMENT_DATABASE_URL;
  }

  throw new Error(
    "DATABASE_URL environment variable must be set for Prisma in non-development environments."
  );
}

function createPrismaAdapter(databaseUrl: string, connectionLimit: number): PrismaPg {
  const parsed = new URL(databaseUrl);
  const schema = parsed.searchParams.get("schema") ?? undefined;

  parsed.searchParams.delete("connection_limit");
  parsed.searchParams.delete("pgbouncer");
  parsed.searchParams.delete("schema");

  return new PrismaPg(
    {
      connectionString: parsed.toString(),
      max: connectionLimit,
    },
    schema ? { schema } : undefined
  );
}

function shouldFallbackToDatasourceClient(
  error: unknown,
  nodeEnv: ReturnType<typeof resolveNodeEnvironment>
): boolean {
  if (nodeEnv !== "development" && nodeEnv !== "test") {
    return false;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("adapter option") && error.message.includes("run with `--no-engine`")
  );
}

function createBasePrismaClient(
  normalizedDatabaseUrl: string,
  connectionLimit: number,
  nodeEnv: ReturnType<typeof resolveNodeEnvironment>,
  logger: DatabaseBootstrapLogger
): PrismaClient {
  const log: Prisma.LogLevel[] = nodeEnv === "development" ? ["warn", "error"] : ["error"];

  try {
    return new PrismaClient({
      adapter: createPrismaAdapter(normalizedDatabaseUrl, connectionLimit),
      log,
    });
  } catch (error) {
    if (!shouldFallbackToDatasourceClient(error, nodeEnv)) {
      throw error;
    }

    logger.warn(
      {
        connectionLimit,
        databaseUrl: normalizedDatabaseUrl,
        event: "database.prisma.adapter_fallback",
        nodeEnv,
      },
      "Prisma adapter unavailable in local runtime; falling back to datasourceUrl client."
    );

    return new PrismaClient({
      datasourceUrl: normalizedDatabaseUrl,
      log,
    });
  }
}

function resolvePrismaClientOptions(
  options: CreatePrismaClientOptions = {}
): ResolvedPrismaClientOptions {
  const env = getEnvironmentSource(options.env);
  const config = getDatabaseConfig(env);
  const runtimeDatabaseUrl = resolveRuntimeDatabaseUrl(
    options.databaseUrl ?? config.DATABASE_URL,
    env
  );
  const normalizedDatabaseUrl = normalizeDatabaseUrl(runtimeDatabaseUrl, env) ?? runtimeDatabaseUrl;

  return {
    connectionLimit:
      config.DATABASE_CONNECTION_LIMIT ?? resolveConnectionLimit(normalizedDatabaseUrl, env),
    databaseUrl: normalizedDatabaseUrl,
    logger: options.logger ?? createLogger("database-runtime"),
    nodeEnv: resolveNodeEnvironment(env),
    queryTimeoutMs: config.PRISMA_QUERY_TIMEOUT_MS ?? resolveQueryTimeoutMs(env),
    slowQueryThresholdMs: config.DB_SLOW_QUERY_MS ?? resolveSlowQueryThresholdMs(env),
  };
}

export function createPrismaClient(options: CreatePrismaClientOptions = {}): PrismaClient {
  const resolvedOptions = resolvePrismaClientOptions(options);
  const baseClient = createBasePrismaClient(
    resolvedOptions.databaseUrl,
    resolvedOptions.connectionLimit,
    resolvedOptions.nodeEnv,
    resolvedOptions.logger
  );

  return baseClient.$extends({
    name: "birthub-query-observability",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const metrics = getMetricsApi();
          const queryModel = model ?? "raw";
          const startedAt = Date.now();
          const scopedArgs = scopePrismaArgs({
            args,
            model,
            operation,
            tenantId: getTenantContext()?.tenantId,
          });

          activeQueries += 1;
          updateDatabaseGauges(resolvedOptions.connectionLimit);

          try {
            const result = await raceWithConfiguredTimeout(
              query(scopedArgs as typeof args),
              operation,
              resolvedOptions.queryTimeoutMs,
              model
            );
            const durationMs = Date.now() - startedAt;

            if (metrics) {
              metrics.incrementCounter(
                "birthub_db_queries_total",
                {
                  model: queryModel,
                  operation,
                  outcome: "success",
                },
                1,
                "Total database queries grouped by model, operation and outcome."
              );
              metrics.observeHistogram(
                "birthub_db_query_duration_ms",
                durationMs,
                {
                  model: queryModel,
                  operation,
                },
                {
                  help: "Database query latency in milliseconds.",
                }
              );
              if (durationMs >= resolvedOptions.slowQueryThresholdMs) {
                metrics.incrementCounter(
                  "birthub_db_slow_queries_total",
                  {
                    model: queryModel,
                    operation,
                  },
                  1,
                  "Total slow database queries grouped by model and operation."
                );
              }
            }

            return result;
          } catch (error) {
            const durationMs = Date.now() - startedAt;

            if (metrics) {
              metrics.incrementCounter(
                "birthub_db_queries_total",
                {
                  model: queryModel,
                  operation,
                  outcome: "error",
                },
                1,
                "Total database queries grouped by model, operation and outcome."
              );
              metrics.observeHistogram(
                "birthub_db_query_duration_ms",
                durationMs,
                {
                  model: queryModel,
                  operation,
                },
                {
                  help: "Database query latency in milliseconds.",
                }
              );
            }

            throw error;
          } finally {
            activeQueries = Math.max(0, activeQueries - 1);
            updateDatabaseGauges(resolvedOptions.connectionLimit);
          }
        },
      },
    },
  }) as PrismaClient;
}

export function normalizeDatabaseUrl(
  rawUrl: string | undefined,
  env: RuntimeEnvironment = getEnvironmentSource()
): string | undefined {
  if (!rawUrl?.trim()) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);

    if (!parsed.protocol.startsWith("postgres")) {
      return rawUrl;
    }

    if (!parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set(
        "connection_limit",
        String(resolveConnectionLimit(parsed.toString(), env))
      );
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function readStoredPrismaClient(): PrismaClient | undefined {
  return _client ?? globalForPrisma.birthubPrisma;
}

function storePrismaClient(client: PrismaClient): PrismaClient {
  _client = client;

  if (!isProductionEnvironment()) {
    globalForPrisma.birthubPrisma = client;
  }

  return client;
}

export function getPrismaClient(): PrismaClient {
  const existingClient = readStoredPrismaClient();
  if (existingClient) {
    return existingClient;
  }
  return storePrismaClient(createPrismaClient());
}

export async function resetPrismaClientForTests(): Promise<void> {
  const client = readStoredPrismaClient();
  _client = undefined;
  delete globalForPrisma.birthubPrisma;
  if (client) {
    await client.$disconnect();
  }
}
export const prisma = createPrismaProxy(getPrismaClient);

// @see ADR-008
export async function withTenantDatabaseContext<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = getPrismaClient()
): Promise<T> {
  const tenantId = requireTenantId("database transaction");

  return client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return callback(tx);
  });
}

export async function pingDatabase(
  client: Pick<PrismaClient, "$queryRaw"> = getPrismaClient()
): Promise<{ status: "up" | "down"; message?: string }> {
  try {
    await raceWithTimeout(client.$queryRaw`SELECT 1`, "$queryRaw");
    return { status: "up" };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unknown database error",
      status: "down",
    };
  }
}

export async function pingDatabaseDeep(
  client: Pick<PrismaClient, "$queryRaw"> = getPrismaClient()
): Promise<{ status: "up" | "down"; message?: string }> {
  const startedAt = Date.now();

  try {
    await raceWithTimeout(
      client.$queryRaw`
        SELECT
          current_database() AS database_name,
          current_schema() AS schema_name,
          now() AS checked_at
      `,
      "$queryRaw"
    );

    return {
      message: `query-ok:${Date.now() - startedAt}ms`,
      status: "up",
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unknown deep database error",
      status: "down",
    };
  }
}
