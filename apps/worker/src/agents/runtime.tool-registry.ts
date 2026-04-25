import type { AgentManifest } from "@birthub/agents-core";
import { PolicyEngine } from "@birthub/agents-core/policy";
import { BaseTool, DbReadTool, HttpTool, SendEmailTool } from "@birthub/agents-core/tools";
import { prisma } from "@birthub/database";
import { z } from "zod";

import { runtimeMemory } from "./runtime.memory.js";
import { toJsonValue } from "./runtime.shared.js";
import { createOutputArtifact } from "./runtime.telemetry.js";

class ZodRuntimeTool<TInput, TOutput> extends BaseTool<TInput, TOutput> {
  constructor(input: {
    description: string;
    executor: (input: TInput, context: { agentId: string; tenantId: string; traceId: string }) => Promise<TOutput>;
    inputSchema: z.ZodType<TInput>;
    name: string;
    outputSchema: z.ZodType<TOutput>;
    policyEngine: PolicyEngine;
  }) {
    super(
      {
        description: input.description,
        inputSchema: input.inputSchema,
        name: input.name,
        outputSchema: input.outputSchema
      },
      { policyEngine: input.policyEngine }
    );
    this.executor = input.executor;
  }

  private readonly executor: (input: TInput, context: { agentId: string; tenantId: string; traceId: string }) => Promise<TOutput>;

  protected execute(input: TInput, context: { agentId: string; tenantId: string; traceId?: string }): Promise<TOutput> {
    return this.executor(input, {
      agentId: context.agentId,
      tenantId: context.tenantId,
      traceId: context.traceId ?? "runtime-trace"
    });
  }
}

const dbWriteInputSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  operation: z.enum(["DELETE", "INSERT", "UPDATE", "UPSERT"]),
  table: z.string().min(1),
  where: z.record(z.string(), z.unknown()).default({})
});

const dbWriteOutputSchema = z.object({
  affectedRows: z.number().int().nonnegative(),
  entityId: z.string().nullable().optional()
});

type DbWriteOperation = z.infer<typeof dbWriteInputSchema>;

const dbWriteAllowlist: Record<string, { operations: DbWriteOperation["operation"][] }> = {
  agentexecution: { operations: ["UPDATE"] },
  agenthandoff: { operations: ["INSERT", "UPDATE"] },
  outputartifact: { operations: ["INSERT", "UPDATE"] }
};

function normalizeTableName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}


export function createRuntimeToolRegistry(input: {
  defaultToolCostBrl: number;
  manifest: AgentManifest;
  options?: {
    sendEmailApiKey?: string;
    sendEmailFromEmail?: string;
  };
  policyEngine: PolicyEngine;
}): Record<string, BaseTool<unknown, unknown>> {
  const policyEngine = input.policyEngine;
  const registry: Record<string, BaseTool<unknown, unknown>> = {
    "db-read": new DbReadTool({
      executor: async ({ params, query, tenantId }) => {
        const results = await prisma.$queryRawUnsafe(query, ...params);

        return (Array.isArray(results) ? results : Array.from(results as Iterable<unknown>)) as Record<string, unknown>[];
      },
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "db-write": new ZodRuntimeTool<z.infer<typeof dbWriteInputSchema>, z.infer<typeof dbWriteOutputSchema>>({
      description: "Safe allowlisted database write tool.",
      executor: async (payload, context) => {
        const policy = policyEngine.evaluate(context.agentId, "db-write.commit", {
          tenantId: context.tenantId
        });
        if (!policy.granted) {
          throw new Error("db-write.commit policy denied");
        }

        const tableKey = normalizeTableName(payload.table);
        const allowed = dbWriteAllowlist[tableKey];
        if (!allowed || !allowed.operations.includes(payload.operation)) {
          throw new Error(`db-write operation '${payload.operation}' is not allowlisted for ${payload.table}`);
        }

        const dataWithTenant = {
          ...payload.data,
          tenantId: context.tenantId
        };

        let affectedRows = 0;
        let entityId: string | null = null;

        if (tableKey === "agentexecution") {
          const executionId = typeof payload.where.id === "string" ? payload.where.id : null;
          if (!executionId) {
            throw new Error("agentExecution updates require where.id");
          }

          const updated = await prisma.agentExecution.updateMany({
            data: dataWithTenant as never,
            where: {
              id: executionId,
              tenantId: context.tenantId
            }
          });
          affectedRows = updated.count;
          entityId = executionId;
        } else if (tableKey === "agenthandoff" && payload.operation === "INSERT") {
          const created = await prisma.agentHandoff.create({
            data: dataWithTenant as never
          });
          affectedRows = 1;
          entityId = created.id;
        } else if (tableKey === "agenthandoff" && payload.operation === "UPDATE") {
          const handoffId = typeof payload.where.id === "string" ? payload.where.id : null;
          if (!handoffId) {
            throw new Error("agentHandoff updates require where.id");
          }
          const updated = await prisma.agentHandoff.updateMany({
            data: dataWithTenant as never,
            where: {
              id: handoffId,
              tenantId: context.tenantId
            }
          });
          affectedRows = updated.count;
          entityId = handoffId;
        } else {
          throw new Error(`Unsupported db-write allowlisted route for ${payload.table}`);
        }

        await prisma.auditLog.create({
          data: {
            action: "AGENT_DB_WRITE",
            actorId: null,
            diff: toJsonValue({
              affectedRows,
              entityId,
              operation: payload.operation,
              table: payload.table,
              traceId: context.traceId
            }),
            entityId: entityId ?? context.traceId,
            entityType: payload.table,
            tenantId: context.tenantId
          }
        });

        return {
          affectedRows,
          ...(entityId ? { entityId } : {})
        };
      },
      inputSchema: dbWriteInputSchema,
      name: "db-write",
      outputSchema: dbWriteOutputSchema,
      policyEngine
    }) as BaseTool<unknown, unknown>,
    http: new HttpTool({ policyEngine }) as BaseTool<unknown, unknown>,
    "send-email": new SendEmailTool({
      policyEngine,
      ...(input.options?.sendEmailApiKey !== undefined ? { apiKey: input.options.sendEmailApiKey } : {}),
      ...(input.options?.sendEmailFromEmail !== undefined ? { fromEmail: input.options.sendEmailFromEmail } : {})
    }) as BaseTool<unknown, unknown>,
    handoff: new ZodRuntimeTool({
      description: "Queue a specialist handoff.",
      executor: async (payload) => payload,
      inputSchema: z.object({
        context: z.record(z.string(), z.unknown()).default({}),
        priority: z.enum(["high", "normal", "low"]).default("normal"),
        targetAgentId: z.string().min(1)
      }),
      name: "handoff",
      outputSchema: z.object({
        context: z.record(z.string(), z.unknown()),
        priority: z.enum(["high", "normal", "low"]),
        targetAgentId: z.string()
      }),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "memory-read": new ZodRuntimeTool({
      description: "Read memory values for tenant scoped runtime.",
      executor: async (payload, context) => ({ value: await runtimeMemory.get(context.tenantId, context.agentId, payload.key) }),
      inputSchema: z.object({ key: z.string().min(1) }),
      name: "memory-read",
      outputSchema: z.object({ value: z.unknown().nullable() }),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "memory-write": new ZodRuntimeTool({
      description: "Persist memory values for tenant scoped runtime.",
      executor: async (payload, context) => {
        await runtimeMemory.store(context.tenantId, context.agentId, payload.key, payload.value, payload.ttlSeconds);
        return { ok: true };
      },
      inputSchema: z.object({ key: z.string().min(1), ttlSeconds: z.number().int().positive().default(3600), value: z.unknown() }),
      name: "memory-write",
      outputSchema: z.object({ ok: z.boolean() }),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "artifact-create": new ZodRuntimeTool({
      description: "Create governed output artifact.",
      executor: async (payload, context) => ({
        artifactId: await createOutputArtifact({
          content: payload.content,
          executionId: payload.executionId,
          manifest: input.manifest,
          organizationId: payload.organizationId,
          requireApproval: payload.requireApproval,
          tenantId: context.tenantId,
          type: payload.type,
          userId: null
        })
      }),
      inputSchema: z.object({
        content: z.string().min(1),
        executionId: z.string().min(1),
        organizationId: z.string().min(1),
        requireApproval: z.boolean().default(false),
        type: z.enum(["executive-report", "technical-log"]).default("technical-log")
      }),
      name: "artifact-create",
      outputSchema: z.object({ artifactId: z.string().min(1) }),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "approval-request": new ZodRuntimeTool({
      description: "Request human approval.",
      executor: async (payload) => ({ status: "WAITING_APPROVAL", ticket: payload.ticket }),
      inputSchema: z.object({ reason: z.string().min(1), ticket: z.string().min(1) }),
      name: "approval-request",
      outputSchema: z.object({ status: z.literal("WAITING_APPROVAL"), ticket: z.string().min(1) }),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "workflow-enqueue": new ZodRuntimeTool({
      description: "Enqueue workflow event.",
      executor: async (payload) => ({ queued: true, workflowId: payload.workflowId }),
      inputSchema: z.object({ workflowId: z.string().min(1), payload: z.record(z.string(), z.unknown()) }),
      name: "workflow-enqueue",
      outputSchema: z.object({ queued: z.boolean(), workflowId: z.string().min(1) }),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "connector-action": new ZodRuntimeTool({
      description: "Execute connector action descriptor.",
      executor: async (payload) => ({ action: payload.action, status: "accepted" }),
      inputSchema: z.object({ action: z.string().min(1), params: z.record(z.string(), z.unknown()).default({}) }),
      name: "connector-action",
      outputSchema: z.object({ action: z.string().min(1), status: z.literal("accepted") }),
      policyEngine
    }) as BaseTool<unknown, unknown>
  };

  return registry;
}
