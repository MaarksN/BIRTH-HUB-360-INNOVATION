import { BaseWorker } from "./base-worker.js";

export interface ReportJobPayload { reportId: string; type: "board" | "financial"; failed?: boolean }

export class ReportWorker extends BaseWorker<ReportJobPayload> {
  protected process(payload: ReportJobPayload): Promise<void> {
    if (payload.failed) throw new Error("REPORT_FAILED");
    return Promise.resolve();
  }
}
