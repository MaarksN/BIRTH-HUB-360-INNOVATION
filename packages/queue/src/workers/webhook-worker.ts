import { BaseWorker } from "./base-worker.js";

export interface WebhookJobPayload { destination: string; eventId: string; failDelivery?: boolean }

export class WebhookWorker extends BaseWorker<WebhookJobPayload> {
  protected process(payload: WebhookJobPayload): Promise<void> {
    if (payload.failDelivery) throw new Error("WEBHOOK_DELIVERY_FAILED");
    return Promise.resolve();
  }
}
