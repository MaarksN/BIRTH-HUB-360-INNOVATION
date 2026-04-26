import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type BackupFileSnapshot = {
  ageMinutes: number;
  modifiedAt: string;
  name: string;
};

export type BackupHealthReport = {
  backup: {
    directory: string;
    exists: boolean;
    latest: BackupFileSnapshot | null;
  };
  checkedAt: string;
  directories: {
    backupsDir: string;
    walDir: string | null;
  };
  issues: string[];
  ok: boolean;
  status: "fail" | "pass";
  thresholds: {
    maxBackupAgeMinutes: number;
    maxWalLagMinutes: number;
  };
  wal: {
    directory: string | null;
    exists: boolean;
    latest: BackupFileSnapshot | null;
  };
};

type BuildBackupHealthOptions = {
  backupsDir?: string;
  maxBackupAgeMinutes?: number;
  maxWalLagMinutes?: number;
  now?: Date;
  rootDirectory?: string;
  walDir?: string;
};

const IGNORED_BACKUP_METADATA_FILES = new Set([
  "backup-health.json",
  "backup-health.txt",
  "drill-rto-rpo.json",
  "drill-rto-rpo.txt"
]);

function resolveInputPath(rootDirectory: string, value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  return resolve(rootDirectory, value);
}

function toSnapshot(filePath: string, now: Date): BackupFileSnapshot {
  const fileStat = statSync(filePath);
  return {
    ageMinutes: Math.round((now.getTime() - fileStat.mtime.getTime()) / 60000),
    modifiedAt: fileStat.mtime.toISOString(),
    name: basename(filePath)
  };
}

function newestFileSnapshot(directory: string, now: Date): BackupFileSnapshot | null {
  if (!existsSync(directory)) {
    return null;
  }

  const entries = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !IGNORED_BACKUP_METADATA_FILES.has(entry.name))
    .map((entry) => toSnapshot(resolve(directory, entry.name), now))
    .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt));

  return entries[0] ?? null;
}

export function buildBackupHealthReport(
  options: BuildBackupHealthOptions = {}
): BackupHealthReport {
  const rootDirectory = options.rootDirectory ?? process.cwd();
  const now = options.now ?? new Date();
  const backupsDir = resolveInputPath(rootDirectory, options.backupsDir ?? "artifacts/backups")!;
  const walDir = resolveInputPath(rootDirectory, options.walDir);
  const maxBackupAgeMinutes = Number(options.maxBackupAgeMinutes ?? 1440);
  const maxWalLagMinutes = Number(options.maxWalLagMinutes ?? 5);
  const issues: string[] = [];
  const backupExists = existsSync(backupsDir);
  const walExists = walDir ? existsSync(walDir) : false;
  const backupLatest = newestFileSnapshot(backupsDir, now);
  const walLatest = walDir ? newestFileSnapshot(walDir, now) : null;

  if (!backupExists) {
    issues.push(`Backup directory is missing: ${backupsDir}.`);
  } else if (!backupLatest) {
    issues.push(`No backup files found in ${backupsDir}.`);
  } else if (backupLatest.ageMinutes > maxBackupAgeMinutes) {
    issues.push(`Latest backup is ${backupLatest.ageMinutes} minutes old.`);
  }

  if (walDir) {
    if (!walExists) {
      issues.push(`WAL directory is missing: ${walDir}.`);
    } else if (!walLatest) {
      issues.push(`No WAL archive files found in ${walDir}.`);
    } else if (walLatest.ageMinutes > maxWalLagMinutes) {
      issues.push(`Latest WAL archive is ${walLatest.ageMinutes} minutes old.`);
    }
  }

  return {
    backup: {
      directory: backupsDir,
      exists: backupExists,
      latest: backupLatest
    },
    checkedAt: now.toISOString(),
    directories: {
      backupsDir,
      walDir
    },
    issues,
    ok: issues.length === 0,
    status: issues.length === 0 ? "pass" : "fail",
    thresholds: {
      maxBackupAgeMinutes,
      maxWalLagMinutes
    },
    wal: {
      directory: walDir,
      exists: walDir ? walExists : false,
      latest: walLatest
    }
  };
}

export function renderBackupHealthText(report: BackupHealthReport): string {
  const lines = [
    `Checked at: ${report.checkedAt}`,
    `Status: ${report.status.toUpperCase()}`,
    `Backups dir: ${report.directories.backupsDir}`,
    `Latest backup: ${
      report.backup.latest
        ? `${report.backup.latest.name} (${report.backup.latest.ageMinutes} min old)`
        : "missing"
    }`
  ];

  if (report.directories.walDir) {
    lines.push(
      `WAL dir: ${report.directories.walDir}`,
      `Latest WAL: ${
        report.wal.latest ? `${report.wal.latest.name} (${report.wal.latest.ageMinutes} min old)` : "missing"
      }`
    );
  }

  if (report.issues.length > 0) {
    lines.push("Issues:");
    lines.push(...report.issues.map((issue) => `- ${issue}`));
  }

  return `${lines.join("\n")}\n`;
}

export function writeBackupHealthReport(
  report: BackupHealthReport,
  outputPath: string = resolve(process.cwd(), "artifacts", "backups", "backup-health.json")
): { jsonPath: string; textPath: string } {
  const textPath = outputPath.replace(/\.json$/i, ".txt");

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(textPath, renderBackupHealthText(report), "utf8");

  return {
    jsonPath: outputPath,
    textPath
  };
}

function parseFlag(name: string): string | undefined {
  const flag = process.argv.find((item) => item.startsWith(`${name}=`));
  return flag ? flag.slice(name.length + 1) : undefined;
}

function isExecutedAsScript(): boolean {
  const entryPoint = process.argv[1];
  return Boolean(entryPoint) && resolve(entryPoint) === fileURLToPath(import.meta.url);
}

if (isExecutedAsScript()) {
  const report = buildBackupHealthReport({
    backupsDir: parseFlag("--backups-dir"),
    maxBackupAgeMinutes: Number(parseFlag("--max-backup-age-minutes") ?? "1440"),
    maxWalLagMinutes: Number(parseFlag("--max-wal-lag-minutes") ?? "5"),
    walDir: parseFlag("--wal-dir")
  });
  const outputPath =
    parseFlag("--output") ?? resolve(process.cwd(), "artifacts", "backups", "backup-health.json");
  const paths = writeBackupHealthReport(report, outputPath);

  console.log(JSON.stringify(report, null, 2));
  console.log(`Backup health artifact generated at ${paths.jsonPath}`);
  console.log(`Backup health text summary generated at ${paths.textPath}`);

  if (!report.ok) {
    process.exitCode = 1;
  }
}
