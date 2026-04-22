import type { SerializedConnectorError } from "@birthub/connectors-core";
import type { Job } from "bullmq";

import type { ConnectorEventJobPayload } from "@birthub/connectors-core";

export interface ConnectorAttemptState {
  currentAttempt: number;
  hasRemainingAttempts: boolean;
  maxAttempts: number;
  nextRetryAt: Date | null;
  nextRetryDelayMs: number | null;
}

function resolveBackoffDelay(job: Pick<Job<unknown, unknown, string>, "attemptsMade" | "opts">): number | null {
  if (typeof job.opts.backoff === "number") {
    return job.opts.backoff * 2 ** Math.max(0, job.attemptsMade);
  }

  if (job.opts.backoff && typeof job.opts.backoff === "object") {
    const delay = typeof job.opts.backoff.delay === "number" ? job.opts.backoff.delay : null;
    if (delay === null) {
      return null;
    }

    if (job.opts.backoff.type === "fixed") {
      return delay;
    }

    return delay * 2 ** Math.max(0, job.attemptsMade);
  }

  return null;
}

export function resolveConnectorAttemptState(
  job?: Pick<Job<unknown, unknown, string>, "attemptsMade" | "opts"> | undefined,
  now = new Date()
): ConnectorAttemptState {
  const maxAttempts =
    job && typeof job.opts.attempts === "number" && job.opts.attempts > 0 ? job.opts.attempts : 1;
  const currentAttempt = (job?.attemptsMade ?? 0) + 1;
  const nextRetryDelayMs =
    job && currentAttempt < maxAttempts ? resolveBackoffDelay(job) : null;

  return {
    currentAttempt,
    hasRemainingAttempts: currentAttempt < maxAttempts,
    maxAttempts,
    nextRetryAt: nextRetryDelayMs !== null ? new Date(now.getTime() + nextRetryDelayMs) : null,
    nextRetryDelayMs
  };
}

export function buildConnectorLogFields(input: {
  action: string;
  durationMs: number;
  error?: SerializedConnectorError | null | undefined;
  event: Pick<ConnectorEventJobPayload, "eventId" | "provider" | "tenantId">;
  status: "duplicate" | "failed" | "processing" | "retrying" | "skipped" | "success";
}) {
  return {
    action: input.action,
    duration: input.durationMs,
    ...(input.error ? { error: input.error.message } : {}),
    eventId: input.event.eventId,
    provider: input.event.provider,
    status: input.status,
    tenantId: input.event.tenantId
  };
}
