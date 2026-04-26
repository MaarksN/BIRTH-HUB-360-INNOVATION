// 
import { Prisma } from "@prisma/client";
import { F8_CONFIG } from "../f8.config.js";
import { createPrismaClient } from "../src/client.js";
import { writeJsonReport, writeTextReport } from "./lib/report.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-analyze-performance");

type SlowQueryRow = {
  calls: bigint | number;
  mean_exec_time: number;
  query: string;
  total_exec_time: number;
};

type UnusedIndexRow = {
  index_name: string;
  table_name: string;
};

type TableOptionRow = {
  relname: string;
  reloptions: string[] | null;
};

// tenant-scope-exempt: pg_stat_* and pg_class audits read PostgreSQL catalog metadata, not tenant rows.
function looksDisposableDatabase(url: string): boolean {
  return /(localhost|127\.0\.0\.1|shadow|test|validation)/i.test(url);
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    const report = {
      checkedAt: new Date().toISOString(),
      ok: true,
      reason: "DATABASE_URL is not configured.",
      skipped: true
    };

    const jsonPath = await writeJsonReport("f8/performance-report.json", report);
    const txtPath = await writeTextReport(
      "f8/performance-report.txt",
      "Performance audit skipped because DATABASE_URL is not configured."
    );

    logger.info(`Performance audit skipped.\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);
    return;
  }

  const prisma = createPrismaClient();
  const disposableDatabase = looksDisposableDatabase(databaseUrl);

  try {
    let topSlowQueries: SlowQueryRow[] = [];
    let unusedIndexes: UnusedIndexRow[] = [];
    let tableOptions: TableOptionRow[] = [];
    const issues: string[] = [];
    const observations: string[] = [];

    try {
      topSlowQueries = await prisma.$queryRaw<SlowQueryRow[]>`
        SELECT query, calls, total_exec_time, mean_exec_time
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `;
    } catch (error) {
      const message = `pg_stat_statements unavailable: ${error instanceof Error ? error.message : String(error)}`;
      issues.push(message);
    }

    unusedIndexes = await prisma.$queryRaw<UnusedIndexRow[]>`
      SELECT indexrelname AS index_name, relname AS table_name
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
      ORDER BY relname ASC, indexrelname ASC
    `;

    if (F8_CONFIG.highWriteTables.length > 0) {
      tableOptions = await prisma.$queryRaw<TableOptionRow[]>(
        Prisma.sql`
          SELECT relname, reloptions
          FROM pg_class
          WHERE relname IN (${Prisma.join(F8_CONFIG.highWriteTables.map((table) => Prisma.sql`${table}`))})
          ORDER BY relname ASC
        `
      );
    }

    for (const table of F8_CONFIG.highWriteTables) {
      const config = tableOptions.find((row) => row.relname === table);
      const optionString = (config?.reloptions ?? []).join(",");
      if (!optionString.includes("autovacuum_vacuum_scale_factor") || !optionString.includes("autovacuum_analyze_scale_factor")) {
        issues.push(`${table}: missing aggressive autovacuum table-level settings.`);
      }
    }

    if (unusedIndexes.length > 0) {
      const message = `Unused indexes detected: ${unusedIndexes.length}.`;
      (disposableDatabase ? observations : issues).push(message);
    }

    const report = {
      checkedAt: new Date().toISOString(),
      disposableDatabase,
      issues,
      observations,
      ok: issues.length === 0,
      topSlowQueries,
      unusedIndexes,
      highWriteTableOptions: tableOptions
    };

    const text = [
      `Performance audit: ${report.ok ? "PASS" : "FAIL"}`,
      `Top slow queries collected: ${topSlowQueries.length}`,
      `Unused indexes: ${unusedIndexes.length}`,
      ...tableOptions.map((row) => `${row.relname}: ${(row.reloptions ?? []).join(",") || "default"}`),
      ...(observations.length === 0 ? [] : ["", "Observations:", ...observations]),
      ...(issues.length === 0 ? [] : ["", "Issues:", ...issues])
    ].join("\n");

    const jsonPath = await writeJsonReport("f8/performance-report.json", report);
    const txtPath = await writeTextReport("f8/performance-report.txt", text);

    logger.info(`${text}\n\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);

    if (!report.ok) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
