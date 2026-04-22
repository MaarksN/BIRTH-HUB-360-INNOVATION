import { BaseWorker } from "./base-worker.js";
export interface CampaignJobPayload {
    campaignId: string;
    channel: "email" | "whatsapp";
    retryableError?: boolean;
}
export declare class CampaignWorker extends BaseWorker<CampaignJobPayload> {
    protected process(payload: CampaignJobPayload): Promise<void>;
}
