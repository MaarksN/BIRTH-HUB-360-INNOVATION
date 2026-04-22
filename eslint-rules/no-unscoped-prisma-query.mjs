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

const whereScopedOperations = new Set([
  "aggregate",
  "count",
  "delete",
  "deleteMany",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "groupBy",
  "update",
  "updateMany"
]);

const dataScopedOperations = new Set(["create", "createMany"]);
const upsertOperations = new Set(["upsert"]);
const scopedOperations = new Set([
  ...whereScopedOperations,
  ...dataScopedOperations,
  ...upsertOperations
]);

function getStaticPropertyName(node) {
  if (!node) {
    return null;
  }

  if (!node.computed && node.property?.type === "Identifier") {
    return node.property.name;
  }

  if (node.computed && node.property?.type === "Literal") {
    return String(node.property.value);
  }

  return null;
}

function hasTenantConstraint(node) {
  if (!node || node.type !== "ObjectExpression") {
    return false;
  }

  return node.properties.some((property) => {
    if (property.type !== "Property") {
      return false;
    }

    const propertyName = getStaticPropertyName({
      computed: property.computed,
      property: property.key
    });

    if (propertyName === "tenantId") {
      return true;
    }

    return (
      typeof propertyName === "string" &&
      propertyName.includes("tenantId") &&
      property.value?.type === "ObjectExpression" &&
      hasTenantConstraint(property.value)
    );
  });
}

function getObjectProperty(node, propertyName) {
  if (!node || node.type !== "ObjectExpression") {
    return null;
  }

  return node.properties.find((property) => {
    if (property.type !== "Property") {
      return false;
    }

    if (property.key.type === "Identifier") {
      return property.key.name === propertyName;
    }

    if (property.key.type === "Literal") {
      return property.key.value === propertyName;
    }

    return false;
  }) ?? null;
}

function objectPropertyHasTenantConstraint(argumentNode, propertyName) {
  const property = getObjectProperty(argumentNode, propertyName);
  if (!property) {
    return false;
  }

  if (property.value?.type === "ObjectExpression") {
    return hasTenantConstraint(property.value);
  }

  if (property.value?.type === "ArrayExpression") {
    return property.value.elements.every((element) =>
      element?.type === "ObjectExpression" ? hasTenantConstraint(element) : true
    );
  }

  return true;
}

function hasRequiredTenantScope(argumentNode, operation) {
  if (!argumentNode || argumentNode.type !== "ObjectExpression") {
    return true;
  }

  if (whereScopedOperations.has(operation)) {
    return objectPropertyHasTenantConstraint(argumentNode, "where");
  }

  if (dataScopedOperations.has(operation)) {
    return objectPropertyHasTenantConstraint(argumentNode, "data");
  }

  if (upsertOperations.has(operation)) {
    return (
      objectPropertyHasTenantConstraint(argumentNode, "where") &&
      objectPropertyHasTenantConstraint(argumentNode, "create")
    );
  }

  return true;
}

function isPrismaDelegateCall(callee) {
  if (!callee || callee.type !== "MemberExpression") {
    return false;
  }

  const operation = getStaticPropertyName(callee);
  if (!scopedOperations.has(operation)) {
    return false;
  }

  const delegate = callee.object;
  const model = getStaticPropertyName(delegate);
  return (
    delegate?.type === "MemberExpression" &&
    tenantScopedModels.has(model) &&
    delegate.object?.type === "Identifier" &&
    ["prisma", "tx", "db", "client"].includes(delegate.object.name)
  );
}

export default {
  meta: {
    docs: {
      description: "Require tenantId in Prisma query where clauses."
    },
    messages: {
      missingTenantId:
        "Prisma {{operation}} queries for tenant-scoped models must include tenantId in where/data/create or use withTenantScope."
    },
    schema: [],
    type: "problem"
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isPrismaDelegateCall(node.callee)) {
          return;
        }

        const operation = getStaticPropertyName(node.callee);
        const argument = node.arguments[0];
        if (hasRequiredTenantScope(argument, operation)) {
          return;
        }

        context.report({
          data: {
            operation
          },
          messageId: "missingTenantId",
          node
        });
      }
    };
  }
};
