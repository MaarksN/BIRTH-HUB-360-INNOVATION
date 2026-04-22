import { CrossTenantAccessError } from "./errors/cross-tenant-access.error.js";
import { TenantRequiredError } from "./errors/tenant-required.error.js";

type AnyRecord = Record<string, unknown>;

const tenantScopedModels = new Set([
  "agent",
  "agentBudget",
  "agentBudgetEvent",
  "agentExecution",
  "agentFeedback",
  "agentHandoff",
  "apiKey",
  "auditLog",
  "billingCredit",
  "billingEvent",
  "connectorAccount",
  "connectorCredential",
  "connectorSyncCursor",
  "conversationMessage",
  "conversationThread",
  "crmSyncEvent",
  "customer",
  "datasetExport",
  "invite",
  "invoice",
  "jobSigningSecret",
  "loginAlert",
  "membership",
  "mfaChallenge",
  "mfaRecoveryCode",
  "notification",
  "organization",
  "outputArtifact",
  "paymentMethod",
  "quotaUsage",
  "session",
  "stepResult",
  "subscription",
  "tenantActivityWindow",
  "usageRecord",
  "userPreference",
  "webhookDelivery",
  "webhookEndpoint",
  "workflow",
  "workflowExecution",
  "workflowRevision",
  "workflowStep",
  "workflowTransition"
]);

const readOperations = new Set([
  "aggregate",
  "count",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "groupBy"
]);

const writeWhereOperations = new Set([
  "delete",
  "deleteMany",
  "update",
  "updateMany"
]);

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertTenantMatch(input: {
  model?: string;
  operation: string;
  requestedTenantId: unknown;
  tenantId: string;
}): void {
  if (
    typeof input.requestedTenantId === "string" &&
    input.requestedTenantId.trim() &&
    input.requestedTenantId !== input.tenantId
  ) {
    throw new CrossTenantAccessError({
      contextTenantId: input.tenantId,
      ...(input.model ? { model: input.model } : {}),
      operation: input.operation,
      requestedTenantId: input.requestedTenantId
    });
  }
}

function withTenantWhere(input: {
  model?: string;
  operation: string;
  tenantId: string;
  where?: unknown;
}): AnyRecord {
  const where = isRecord(input.where) ? input.where : {};
  assertTenantMatch({
    model: input.model,
    operation: input.operation,
    requestedTenantId: where.tenantId,
    tenantId: input.tenantId
  });

  return {
    ...where,
    tenantId: input.tenantId
  };
}

function withTenantData(input: {
  data: unknown;
  model?: string;
  operation: string;
  tenantId: string;
}): unknown {
  if (Array.isArray(input.data)) {
    return input.data.map((item) =>
      withTenantData({
        data: item,
        model: input.model,
        operation: input.operation,
        tenantId: input.tenantId
      })
    );
  }

  if (!isRecord(input.data)) {
    return input.data;
  }

  assertTenantMatch({
    model: input.model,
    operation: input.operation,
    requestedTenantId: input.data.tenantId,
    tenantId: input.tenantId
  });

  return {
    ...input.data,
    tenantId: input.tenantId
  };
}

function withTenantMutationData(input: {
  data: unknown;
  model?: string;
  operation: string;
  tenantId: string;
}): unknown {
  if (!isRecord(input.data)) {
    return input.data;
  }

  assertTenantMatch({
    model: input.model,
    operation: input.operation,
    requestedTenantId: input.data.tenantId,
    tenantId: input.tenantId
  });

  const { tenantId: _tenantId, ...data } = input.data;
  return data;
}

export function isTenantScopedModel(model: string | undefined): boolean {
  return typeof model === "string" && tenantScopedModels.has(model);
}

export function scopePrismaArgs(input: {
  args: unknown;
  model?: string;
  operation: string;
  tenantId?: string | null;
}): unknown {
  if (!isTenantScopedModel(input.model)) {
    return input.args;
  }

  const tenantId = input.tenantId?.trim();
  if (!tenantId) {
    return input.args;
  }

  const args = isRecord(input.args) ? input.args : {};

  if (readOperations.has(input.operation) || writeWhereOperations.has(input.operation)) {
    return {
      ...args,
      ...(writeWhereOperations.has(input.operation) && "data" in args
        ? {
            data: withTenantMutationData({
              data: args.data,
              model: input.model,
              operation: input.operation,
              tenantId
            })
          }
        : {}),
      where: withTenantWhere({
        model: input.model,
        operation: input.operation,
        tenantId,
        where: args.where
      })
    };
  }

  if (input.operation === "create") {
    return {
      ...args,
      data: withTenantData({
        data: args.data,
        model: input.model,
        operation: input.operation,
        tenantId
      })
    };
  }

  if (input.operation === "createMany") {
    return {
      ...args,
      data: withTenantData({
        data: args.data,
        model: input.model,
        operation: input.operation,
        tenantId
      })
    };
  }

  if (input.operation === "upsert") {
    return {
      ...args,
      create: withTenantData({
        data: args.create,
        model: input.model,
        operation: input.operation,
        tenantId
      }),
      update: withTenantMutationData({
        data: args.update,
        model: input.model,
        operation: input.operation,
        tenantId
      }),
      where: withTenantWhere({
        model: input.model,
        operation: input.operation,
        tenantId,
        where: args.where
      })
    };
  }

  return input.args;
}

function createScopedModelDelegate(input: {
  delegate: AnyRecord;
  model: string;
  tenantId: string;
}): AnyRecord {
  return new Proxy(input.delegate, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof property !== "string" || typeof value !== "function") {
        return value;
      }

      return (args?: unknown, ...rest: unknown[]) =>
        value.call(
          target,
          scopePrismaArgs({
            args,
            model: input.model,
            operation: property,
            tenantId: input.tenantId
          }),
          ...rest
        );
    }
  });
}

export function withTenantScope<TClient extends object>(
  client: TClient,
  tenantId: string
): TClient {
  const normalizedTenantId = tenantId.trim();
  if (!normalizedTenantId) {
    throw new TenantRequiredError("withTenantScope");
  }

  return new Proxy(client, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (
        typeof property === "string" &&
        isTenantScopedModel(property) &&
        isRecord(value)
      ) {
        return createScopedModelDelegate({
          delegate: value,
          model: property,
          tenantId: normalizedTenantId
        });
      }

      return typeof value === "function" ? value.bind(target) : value;
    }
  }) as TClient;
}
