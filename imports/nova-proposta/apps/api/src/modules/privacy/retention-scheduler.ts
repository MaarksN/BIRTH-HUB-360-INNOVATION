import type { ApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";

import { runRetentionSweep } from "./retention.service.js";

const logger = createLogger("privacy-retention");
type RetentionSweepMode = Parameters<typeof runRetentionSweep>[0]["mode"];

const AUTOMATED_RETENTION_SWEEP_MODE: RetentionSweepMode = "EXECUTE";

let retentionTimer: NodeJS.Timeout | null = null;

export function startPrivacyRetentionScheduler(
  config: ApiConfig,
  intervalMs = 60 * 60 * 1000
): void {
  if (retentionTimer) {
    return;
  }

  retentionTimer = setInterval(() => {
    void runRetentionSweep({
      config,
      mode: AUTOMATED_RETENTION_SWEEP_MODE
    })
      .then((result) => {
        logger.info({ policiesExecuted: result.length }, "Privacy retention sweep executed");
      })
      .catch((error) => {
        logger.error({ error }, "Privacy retention sweep failed");
      });
  }, intervalMs);

  retentionTimer.unref();
}
