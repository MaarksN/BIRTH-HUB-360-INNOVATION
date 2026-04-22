import { ConnectorExecutionError } from "./errors.js";
import type { ConnectorExecutionContext } from "./types.js";

export const DEFAULT_IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

export function buildIdempotencyKey(ctx: ConnectorExecutionContext): string {
  return [
    ctx.tenantId,
    ctx.provider,
    ctx.action,
    ctx.externalEventId ?? ctx.eventId,
  ].join(":");
}

export async function ensureNotDuplicate(
  ctx: ConnectorExecutionContext,
): Promise<void> {
  if (!ctx.externalEventId || !ctx.idempotencyStore) {
    return;
  }

  const key = buildIdempotencyKey(ctx);
  const value = {
    eventId: ctx.eventId,
    externalEventId: ctx.externalEventId,
  };

  const claimed = ctx.idempotencyStore.claim
    ? await ctx.idempotencyStore.claim(key, value, {
        ttlSeconds: DEFAULT_IDEMPOTENCY_TTL_SECONDS,
      })
    : !(await ctx.idempotencyStore.has(key));

  if (!claimed) {
    throw new ConnectorExecutionError(
      "DUPLICATE_EVENT",
      `Event ${ctx.externalEventId} already processed`,
      false,
      { key },
    );
  }

  if (!ctx.idempotencyStore.claim) {
    await ctx.idempotencyStore.put(key, value, {
      ttlSeconds: DEFAULT_IDEMPOTENCY_TTL_SECONDS,
    });
  }
}
