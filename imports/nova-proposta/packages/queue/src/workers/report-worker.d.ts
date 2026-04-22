import { BaseWorker } from "./base-worker.js";
export interface ReportJobPayload {
    reportId: string;
    type: "board" | "financial";
    failed?: boolean;
}
export declare class ReportWorker extends BaseWorker<ReportJobPayload> {
    protected process(payload: ReportJobPayload): Promise<void>;
}
