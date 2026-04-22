import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type { ApiConfig } from "@birthub/config";
import { prisma, Role, WebhookEndpointStatus, WorkflowTriggerType } from "@birthub/database";
import { Router } from "express";
import { z } from "zod";

import { Auditable } from "../../audit/auditable.js";
import {
  RequireRole,
  requireAuthenticatedSession
} from "../../common/guards/index.js";
import { validateExternalUrl } from "../../lib/external-url.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { dedupeTriggerPayload } from "../workflows/runnerQueue.js";
import { workflowQueueAdapter } from "../workflows/service.js";
import {
  createTenantWebhookEndpoint,
  listTenantWebhookDeliveries,
  listTenantWebhookEndpoints,
  retryWebhookDelivery,
  updateTenantWebhookEndpoint
} from "./settings.service.js";

const webhookEndpointSchema = z
  .object({
    topics: z.array(z.string().trim().min(1)).min(1).max(25),
    url: z.string().url()
  })
  .strict();

const webhookEndpointUpdateSchema = z
  .object({
    status: z.nativeEnum(WebhookEndpointStatus).optional(),
    topics: z.array(z.string().trim().min(1)).min(1).max(25).optional(),
    url: z.string().url().optional()
  })
  .strict();

const deliveryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

type WebhookSettingsAuditResult = {
  deliveryId?: string;
  endpointId?: string;
  queued?: boolean;
  status?: string;
  topic?: string;
};

function createWebhookSettingsAudit(input: {
  action: string;
  entityType?: string;
}) {
  return Auditable<WebhookSettingsAuditResult>({
    action: input.action,
    entityType: input.entityType ?? "webhook_endpoint",
    requireActor: true,
    resolveEntityId: (request, _response, result) =>
      result?.endpointId ?? result?.deliveryId ?? String(request.params.id ?? "unknown")
  });
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function hasMatchingWebhookSignature(input: {
  payload: Record<string, unknown>;
  secretCandidates: readonly string[];
  signature: string;
}): boolean {
  return input.secretCandidates.some((secret) => {
    const expected = createHmac("sha256", secret)
      .update(JSON.stringify(input.payload))
      .digest("hex");

    return safeCompare(input.signature, expected);
  });
}

function assertSafeWebhookTarget(rawUrl: string): string {
  const validation = validateExternalUrl(rawUrl, {
    // Outbound webhook targets must never reach local or loopback hosts.
    allowLocalDevelopmentUrls: false,
    requireHttps: true
  });

  if (!validation.ok || !validation.url) {
    throw new ProblemDetailsError({
      detail: validation.reason ?? "Webhook target URL is not allowed.",
      status: 400,
      title: "Invalid Webhook Endpoint"
    });
  }

  return validation.url.toString();
}

function buildWebhookIdempotencyKey(workflowId: string, payload: Record<string, unknown>): string {
  return `webhook:${workflowId}:${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`;
}

export function createWebhooksRouter(config: ApiConfig): Router {
  const router = Router();

  router.post(
    "/webhooks/trigger/:id",
    asyncHandler(async (request, response) => {
      const workflowId = String(request.params.id ?? "");
      const workflow = await prisma.workflow.findUnique({
        where: {
          id: workflowId
        }
      });

      if (!workflow || workflow.triggerType !== WorkflowTriggerType.WEBHOOK) {
        throw new ProblemDetailsError({
          detail: "Webhook trigger not found.",
          status: 404,
          title: "Not Found"
        });
      }

      const payload = request.body as Record<string, unknown>;
      const signature = request.header("x-birthhub-signature");
      const secretCandidates = workflow.webhookSecret
        ? [workflow.webhookSecret]
        : config.jobHmacSecretCandidates;

      if (
        !signature ||
        !hasMatchingWebhookSignature({
          payload,
          secretCandidates,
          signature
        })
      ) {
        throw new ProblemDetailsError({
          detail: "Invalid webhook signature.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const dedupeAccepted = await dedupeTriggerPayload(config, workflow.tenantId, payload);
      if (!dedupeAccepted) {
        response.status(200).json({
          deduplicated: true
        });
        return;
      }

      await workflowQueueAdapter.enqueueWorkflowTrigger(config, {
        eventSource: "webhook",
        idempotencyKey: buildWebhookIdempotencyKey(workflow.id, payload),
        organizationId: workflow.organizationId,
        tenantId: workflow.tenantId,
        triggerPayload: payload,
        triggerType: WorkflowTriggerType.WEBHOOK,
        workflowId: workflow.id
      });

      response.status(202).json({
        accepted: true,
        deduplicated: false,
        workflowId: workflow.id
      });
    })
  );

  router.get(
    "/api/v1/settings/webhooks",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const tenantReference = request.context.tenantId;

      if (!tenantReference) {
        throw new ProblemDetailsError({
          detail: "Active tenant context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const items = await listTenantWebhookEndpoints(tenantReference);
      response.status(200).json({
        items,
        requestId: request.context.requestId
      });
    })
  );

  router.post(
    "/api/v1/settings/webhooks",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createWebhookSettingsAudit({
        action: "webhook_endpoint.created"
      })(async (request, response) => {
        const tenantReference = request.context.tenantId;

        if (!tenantReference) {
          throw new ProblemDetailsError({
            detail: "Active tenant context is required.",
            status: 401,
            title: "Unauthorized"
          });
        }

        const payload = webhookEndpointSchema.parse(request.body);
        const endpoint = await createTenantWebhookEndpoint({
          createdByUserId: request.context.userId,
          tenantReference,
          topics: payload.topics,
          url: assertSafeWebhookTarget(payload.url)
        });

        response.status(201).json({
          endpoint,
          requestId: request.context.requestId
        });

        return {
          endpointId: endpoint.id,
          status: String(endpoint.status)
        };
      })
    )
  );

  router.patch(
    "/api/v1/settings/webhooks/:id",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createWebhookSettingsAudit({
        action: "webhook_endpoint.updated"
      })(async (request, response) => {
        const tenantReference = request.context.tenantId;

        if (!tenantReference) {
          throw new ProblemDetailsError({
            detail: "Active tenant context is required.",
            status: 401,
            title: "Unauthorized"
          });
        }

        const payload = webhookEndpointUpdateSchema.parse(request.body);
        const endpoint = await updateTenantWebhookEndpoint({
          endpointId: String(request.params.id ?? ""),
          tenantReference,
          ...(payload.status !== undefined ? { status: payload.status } : {}),
          ...(payload.topics !== undefined ? { topics: payload.topics } : {}),
          ...(payload.url !== undefined
            ? { url: assertSafeWebhookTarget(payload.url) }
            : {})
        });

        response.status(200).json({
          endpoint,
          requestId: request.context.requestId
        });

        return {
          endpointId: endpoint.id,
          status: String(endpoint.status)
        };
      })
    )
  );

  router.get(
    "/api/v1/settings/webhooks/:id/deliveries",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(async (request, response) => {
      const tenantReference = request.context.tenantId;

      if (!tenantReference) {
        throw new ProblemDetailsError({
          detail: "Active tenant context is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const query = deliveryQuerySchema.parse(request.query);
      const items = await listTenantWebhookDeliveries({
        endpointId: String(request.params.id ?? ""),
        limit: query.limit,
        tenantReference
      });

      response.status(200).json({
        items,
        requestId: request.context.requestId
      });
    })
  );

  router.post(
    "/api/v1/settings/webhooks/deliveries/:id/retry",
    requireAuthenticatedSession,
    RequireRole(Role.ADMIN),
    asyncHandler(
      createWebhookSettingsAudit({
        action: "webhook_delivery.retry_requested",
        entityType: "webhook_delivery"
      })(async (request, response) => {
        const tenantReference = request.context.tenantId;

        if (!tenantReference) {
          throw new ProblemDetailsError({
            detail: "Active tenant context is required.",
            status: 401,
            title: "Unauthorized"
          });
        }

        const deliveryId = String(request.params.id ?? "");
        const result = await retryWebhookDelivery({
          config,
          deliveryId,
          tenantReference
        });

        response.status(202).json({
          requestId: request.context.requestId,
          ...result
        });

        return {
          deliveryId,
          endpointId: result.endpointId,
          queued: result.queued,
          topic: result.topic
        };
      })
    )
  );

  return router;
}
