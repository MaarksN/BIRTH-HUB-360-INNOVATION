import { performance } from "node:perf_hooks";

import {
  ConnectorExecutionError,
  normalizeUnknownError,
} from "./errors.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
  ExecutionStatus,
} from "./types.js";

export async function runWithLogging(
  ctx: ConnectorExecutionContext,
  runner: () => Promise<Record<string, unknown>>,
): Promise<ConnectorResult> {
  const start = performance.now();

  try {
    const result = await runner();
    const durationMs = Math.round(performance.now() - start);

    await ctx.executionLogger?.log({
      tenantId: ctx.tenantId,
      provider: ctx.provider,
      action: ctx.action,
      eventId: ctx.eventId,
      externalEventId: ctx.externalEventId,
      status: "success",
      durationMs,
      result,
    });

    return {
      ok: true,
      status: "success",
      provider: ctx.provider,
      action: ctx.action,
      eventId: ctx.eventId,
      externalEventId: ctx.externalEventId,
      result,
    };
  } catch (error) {
    const normalized =
      error instanceof ConnectorExecutionError
        ? error
        : normalizeUnknownError(error, "CONNECTOR_EXECUTION_FAILED");

    const status: ExecutionStatus =
      normalized.code === "DUPLICATE_EVENT"
        ? "duplicate"
        : normalized.retryable
          ? "retryable_error"
          : "fatal_error";

    const durationMs = Math.round(performance.now() - start);

    await ctx.executionLogger?.log({
      tenantId: ctx.tenantId,
      provider: ctx.provider,
      action: ctx.action,
      eventId: ctx.eventId,
      externalEventId: ctx.externalEventId,
      status,
      durationMs,
      error: {
        code: normalized.code,
        message: normalized.message,
        retryable: normalized.retryable,
      },
    });

    if (status === "duplicate") {
      return {
        ok: true,
        status,
        provider: ctx.provider,
        action: ctx.action,
        eventId: ctx.eventId,
        externalEventId: ctx.externalEventId,
        result: { duplicate: true },
      };
    }

    throw normalized;
  }
}
