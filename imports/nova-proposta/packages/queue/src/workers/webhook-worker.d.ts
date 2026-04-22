import { BaseWorker } from "./base-worker.js";
export interface WebhookJobPayload {
    destination: string;
    eventId: string;
    failDelivery?: boolean;
}
export declare class WebhookWorker extends BaseWorker<WebhookJobPayload> {
    protected process(payload: WebhookJobPayload): Promise<void>;
}
