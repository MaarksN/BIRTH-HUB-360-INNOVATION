import { EventEmitter } from "node:events";

import { createLogger } from "@birthub/logger";

const logger = createLogger("worker-internal-event-bus");
const bus = new EventEmitter();
bus.setMaxListeners(100);

export interface InternalEventPayload {
  event: string;
  organizationId?: string | null;
  payload: Record<string, unknown>;
  source?: string;
  tenantId: string;
  userId?: string | null;
}

export type InternalEventHandler = (payload: InternalEventPayload) => void | Promise<void>;

function logInternalEvent(payload: InternalEventPayload): void {
  logger.warn(payload, "Internal operational event emitted");
}

bus.on("customer.renewal_at_risk", (payload: InternalEventPayload) => {
  logInternalEvent(payload);
});

bus.on("sales.new_lead", (payload: InternalEventPayload) => {
  logInternalEvent(payload);
});

bus.on("support.critical_ticket", (payload: InternalEventPayload) => {
  logInternalEvent(payload);
});

bus.on("operations.incident_opened", (payload: InternalEventPayload) => {
  logInternalEvent(payload);
});

export function emitInternalEvent(input: InternalEventPayload): void {
  bus.emit(input.event, input);
}

export function onInternalEvent(event: string, handler: InternalEventHandler): () => void {
  bus.on(event, handler);

  return () => {
    bus.off(event, handler);
  };
}

