
// 
import { interpolateValue } from "../interpolation/interpolate.js";
import type { WorkflowRuntimeContext } from "../types.js";

export interface NotificationConfig {
  batchKey?: string | undefined;
  batchWindowMs?: number | undefined;
  channel: "email" | "inapp";
  message: string;
  to: string;
}

export interface NotificationDispatcher {
  send: (message: NotificationConfig) => Promise<void>;
}

const notificationBatchStore = new Map<
  string,
  {
    count: number;
    payload: NotificationConfig;
    timer: ReturnType<typeof setTimeout>;
  }
>();

export async function executeNotificationNode(
  config: NotificationConfig,
  context: WorkflowRuntimeContext,
  dispatcher?: NotificationDispatcher
): Promise<{
  batched?: boolean;
  batchKey?: string;
  delivered: boolean;
  payload: NotificationConfig;
}> {
  const payload = interpolateValue(config, context);

  if (payload.batchKey && dispatcher) {
    const batchKey = payload.batchKey;
    const existing = notificationBatchStore.get(batchKey);

    if (existing) {
      existing.count += 1;
      existing.payload = {
        ...payload,
        message: `${existing.count} notificacoes agregadas`
      };

      return {
        batchKey,
        batched: true,
        delivered: false,
        payload: existing.payload
      };
    }

    const timer = setTimeout(() => {
      const entry = notificationBatchStore.get(batchKey);
      if (!entry) {
        return;
      }

      notificationBatchStore.delete(batchKey);
      void dispatcher.send(entry.payload);
    }, payload.batchWindowMs ?? 5000);

    notificationBatchStore.set(batchKey, {
      count: 1,
      payload,
      timer
    });

    return {
      batchKey,
      batched: true,
      delivered: false,
      payload
    };
  }

  if (dispatcher) {
    await dispatcher.send(payload);
  }

  return {
    delivered: true,
    payload
  };
}
