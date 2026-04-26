// 
import type { PrismaClient } from "@prisma/client";

import { F8_CONFIG } from "../f8.config.js";
import { createPrismaClient } from "../src/client.js";
import { schemaPath } from "./lib/paths.js";
import { createScriptRuntime } from "./lib/runtime.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-migrate-deploy-safe");
const runtime = createScriptRuntime({
  logger,
  name: "db-migrate-deploy-safe"
});

async function acquireLock(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${F8_CONFIG.advisoryLockId}) AS locked
  `;

  if (!rows[0]?.locked) {
    throw new Error("Another migration process is already holding the F8 advisory lock.");
  }
}

async function releaseLock(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`SELECT pg_advisory_unlock(${F8_CONFIG.advisoryLockId})`;
}

void runtime.run(async () => {
  runtime.requireEnv("DATABASE_URL");
  const prisma = createPrismaClient();

  try {
    await runtime.runNodeScriptStep(
      "check migration governance",
      "check-migration-governance.ts",
      { type: "check" }
    );
    await runtime.recordStep("acquire advisory lock", () => acquireLock(prisma), {
      type: "infra"
    });

    await runtime.runPrismaStep("prisma migrate deploy", [
      "migrate",
      "deploy",
      "--schema",
      schemaPath
    ], { type: "migrate" });
    await runtime.runNodeScriptStep(
      "post migration checklist",
      "post-migration-checklist.ts",
      { type: "check" }
    );
  } finally {
    try {
      await releaseLock(prisma);
    } catch {
      // Keep the original failure as the main signal.
    }

    await prisma.$disconnect();
  }
});
