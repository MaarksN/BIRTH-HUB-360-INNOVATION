import { prisma } from "@birthub/database";
import { createLogger } from "@birthub/logger";
import { SYSTEM_QUEUE_NAMES, type QueueRuntime } from "@birthub/queue";

import { flushBufferedAuditEvents } from "./auditFlush.js";
import { exportDailyBillingInvoices } from "./billingExport.js";
import { computeAndPersistHealthScores } from "./healthScore.js";
import { inviteCleanupJob } from "./inviteCleanup.js";
import { quotaResetJob } from "./quotaReset.js";
import { sunsetPolicyJob } from "./sunsetPolicy.js";
import { cleanupSuspendedUsers } from "./userCleanup.js";

const logger = createLogger("worker-cycle2-jobs");

export interface Cycle2JobsRuntime {
  stop: () => Promise<void>;
}

async function pruneWebhookDeliveryLogs() {
  return prisma.webhookDelivery.deleteMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });
}

export async function startCycle2Jobs(runtime: QueueRuntime): Promise<Cycle2JobsRuntime> {
  runtime.createWorker(SYSTEM_QUEUE_NAMES.inviteCleanup, async () => {
    const result = await inviteCleanupJob();
    logger.info({ deleted: result.count }, "Invite cleanup job finished");
  });
  runtime.createWorker(SYSTEM_QUEUE_NAMES.auditFlush, async () => {
    const flushed = await flushBufferedAuditEvents();
    if (flushed > 0) {
      logger.info({ flushed }, "Audit flush job persisted buffered events");
    }
  });
  runtime.createWorker(SYSTEM_QUEUE_NAMES.quotaReset, async () => {
    const now = new Date();
    const result = await quotaResetJob(now);
    logger.info(result, "Quota reset job ensured the new period exists");
  });
  runtime.createWorker(SYSTEM_QUEUE_NAMES.billingExport, async () => {
    const now = new Date();
    const result = await exportDailyBillingInvoices(now);
    logger.info(
      {
        day: result.window.day,
        exports: result.exports.length
      },
      "Nightly billing invoice export finished"
    );
  });
  runtime.createWorker(SYSTEM_QUEUE_NAMES.healthScore, async () => {
    const result = await computeAndPersistHealthScores();
    logger.info({ organizations: result.length }, "Health score job finished");
  });
  runtime.createWorker(SYSTEM_QUEUE_NAMES.webhookLogPrune, async () => {
    const result = await pruneWebhookDeliveryLogs();
    if (result.count > 0) {
      logger.info({ deleted: result.count }, "Old webhook delivery logs pruned");
    }
  });
  runtime.createWorker(SYSTEM_QUEUE_NAMES.sunsetPolicy, async () => {
    const result = await sunsetPolicyJob();
    if (result.notified > 0) {
      logger.info({ notified: result.notified }, "Sunset policy job executed");
    }
  });
  runtime.createWorker(SYSTEM_QUEUE_NAMES.suspendedUserCleanup, async () => {
    const result = await cleanupSuspendedUsers();
    logger.info(result, "Suspended users cleanup executed");
  });

  await Promise.all([
    runtime.upsertRepeatableJob({
      data: { scheduled: true },
      jobId: `${SYSTEM_QUEUE_NAMES.inviteCleanup}:repeat`,
      jobName: "invite-cleanup",
      queue: SYSTEM_QUEUE_NAMES.inviteCleanup,
      repeat: { pattern: "0 * * * *" }
    }),
    runtime.upsertRepeatableJob({
      data: { scheduled: true },
      jobId: `${SYSTEM_QUEUE_NAMES.auditFlush}:repeat`,
      jobName: "audit-flush",
      queue: SYSTEM_QUEUE_NAMES.auditFlush,
      repeat: { pattern: "*/5 * * * * *" }
    }),
    runtime.upsertRepeatableJob({
      data: { scheduled: true },
      jobId: `${SYSTEM_QUEUE_NAMES.quotaReset}:repeat`,
      jobName: "quota-reset",
      queue: SYSTEM_QUEUE_NAMES.quotaReset,
      repeat: { pattern: "0 0 * * *" }
    }),
    runtime.upsertRepeatableJob({
      data: { scheduled: true },
      jobId: `${SYSTEM_QUEUE_NAMES.billingExport}:repeat`,
      jobName: "billing-export",
      queue: SYSTEM_QUEUE_NAMES.billingExport,
      repeat: { pattern: "0 2 * * *" }
    }),
    runtime.upsertRepeatableJob({
      data: { scheduled: true },
      jobId: `${SYSTEM_QUEUE_NAMES.healthScore}:repeat`,
      jobName: "health-score",
      queue: SYSTEM_QUEUE_NAMES.healthScore,
      repeat: { pattern: "0 3 * * *" }
    }),
    runtime.upsertRepeatableJob({
      data: { scheduled: true },
      jobId: `${SYSTEM_QUEUE_NAMES.webhookLogPrune}:repeat`,
      jobName: "webhook-log-prune",
      queue: SYSTEM_QUEUE_NAMES.webhookLogPrune,
      repeat: { pattern: "0 3 * * *" }
    }),
    runtime.upsertRepeatableJob({
      data: { scheduled: true },
      jobId: `${SYSTEM_QUEUE_NAMES.sunsetPolicy}:repeat`,
      jobName: "sunset-policy",
      queue: SYSTEM_QUEUE_NAMES.sunsetPolicy,
      repeat: { pattern: "0 3 * * *" }
    }),
    runtime.upsertRepeatableJob({
      data: { scheduled: true },
      jobId: `${SYSTEM_QUEUE_NAMES.suspendedUserCleanup}:repeat`,
      jobName: "suspended-user-cleanup",
      queue: SYSTEM_QUEUE_NAMES.suspendedUserCleanup,
      repeat: { pattern: "0 1 * * *" }
    })
  ]);

  await Promise.all([
    runtime.enqueue({
      data: { reason: "startup" },
      jobName: "health-score-startup",
      queue: SYSTEM_QUEUE_NAMES.healthScore
    }),
    runtime.enqueue({
      data: { reason: "startup" },
      jobName: "suspended-user-cleanup-startup",
      queue: SYSTEM_QUEUE_NAMES.suspendedUserCleanup
    })
  ]);

  return {
    stop: () => Promise.resolve()
  };
}

