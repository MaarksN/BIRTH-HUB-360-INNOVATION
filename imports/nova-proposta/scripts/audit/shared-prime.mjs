// @ts-nocheck
// 
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(scriptDir, "..", "..");
export const auditRoot = path.join(repoRoot, "audit");
export const reportTimeZone = "America/Sao_Paulo";

export function posixPath(value) {
  return value.replaceAll("\\", "/");
}

export function fromRepo(relativePath) {
  return path.join(repoRoot, relativePath);
}

export function relativePath(targetPath) {
  return posixPath(path.relative(repoRoot, targetPath));
}

export function reportDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: reportTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter
    .formatToParts(date)
    .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const dateOnly = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    dateOnly,
    slug: `auditor-prime-${dateOnly}`
  };
}

export function supportRoot(dateOnly = reportDateParts().dateOnly) {
  return path.join(auditRoot, ".auditor-prime", dateOnly);
}

export function latestArtifactPath(extension) {
  return path.join(auditRoot, `auditor-prime-latest.${extension}`);
}

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function writeJson(targetPath, value) {
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(targetPath, value) {
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, `${value}`, "utf8");
}

export async function copyFile(sourcePath, targetPath) {
  await ensureDir(path.dirname(targetPath));
  await fs.copyFile(sourcePath, targetPath);
}

export function runGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();
}

function shouldSkipWorkspaceDirectory(relativeDir) {
  const normalized = posixPath(relativeDir);
  const segments = normalized.split("/").filter(Boolean);

  if (segments.some((segment) => [".git", ".next", ".turbo", ".vercel", "node_modules"].includes(segment))) {
    return true;
  }

  return [".tools/embedded-postgres-runtime", "audit/.auditor-prime"].some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function isRelevantWorkspaceFile(relativeFilePath) {
  const normalized = posixPath(relativeFilePath);
  return (
    /^(apps\/|packages\/|scripts\/|docs\/|infra\/|ops\/|artifacts\/|audit\/|\.github\/)/.test(
      normalized
    ) ||
    [
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "tsconfig.json",
      "tsconfig.base.json",
      "turbo.json",
      "eslint.config.mjs"
    ].includes(normalized)
  );
}

function listWorkspaceFilesFallback() {
  const collected = [];
  const pendingDirectories = [repoRoot];

  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop();
    const relativeDirectory = posixPath(path.relative(repoRoot, currentDirectory));

    if (relativeDirectory && shouldSkipWorkspaceDirectory(relativeDirectory)) {
      continue;
    }

    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const absolutePath = path.join(currentDirectory, entry.name);
      const relativeEntryPath = posixPath(path.relative(repoRoot, absolutePath));

      if (entry.isDirectory()) {
        if (!shouldSkipWorkspaceDirectory(relativeEntryPath)) {
          pendingDirectories.push(absolutePath);
        }
        continue;
      }

      if (entry.isFile() && isRelevantWorkspaceFile(relativeEntryPath)) {
        collected.push(relativeEntryPath);
      }
    }
  }

  return collected.sort((left, right) => left.localeCompare(right));
}

function assertSafeRunCommand(command) {
  const normalized = String(command);
  const baseName = path.basename(normalized).toLowerCase();
  const allowedCommands = new Set(["git", "node", "semgrep", "python", "python.exe"]);
  const allowedBaseNames = new Set(["node.exe", "semgrep.exe", "python.exe", "cmd.exe"]);

  if (allowedCommands.has(normalized.toLowerCase()) || allowedBaseNames.has(baseName)) {
    return;
  }

  throw new Error(`safeRun refused command outside the allowlist: ${normalized}`);
}

export function listTrackedFiles() {
  try {
    const output = runGit(["ls-files"]);
    return output
      .split(/\r?\n/)
      .map((line) => posixPath(line.trim()))
      .filter(Boolean)
      .filter((entry) => existsSync(fromRepo(entry)));
  } catch {
    return listWorkspaceFilesFallback();
  }
}

export function listUntrackedFiles() {
  try {
    const output = runGit(["ls-files", "--others", "--exclude-standard"]);
    return output
      .split(/\r?\n/)
      .map((line) => posixPath(line.trim()))
      .filter(Boolean)
      .filter((entry) => existsSync(fromRepo(entry)))
      .filter(
        (entry) =>
          /^(apps\/|packages\/|scripts\/|docs\/|infra\/|ops\/|\.github\/workflows\/)/.test(entry)
      );
  } catch {
    return listWorkspaceFilesFallback().filter((entry) =>
      /^(apps\/|packages\/|scripts\/|docs\/|infra\/|ops\/|\.github\/workflows\/)/.test(entry)
    );
  }
}

export function safeRun(command, args, options = {}) {
  assertSafeRunCommand(command);
  const resolvedCommand =
    String(command).toLowerCase() === "node" ? process.execPath : command;
  const requiresWindowsCmdWrapper =
    process.platform === "win32" && /\.(cmd|bat)$/iu.test(resolvedCommand);
  const spawnCommand = requiresWindowsCmdWrapper
    ? process.env.ComSpec ?? "cmd.exe"
    : resolvedCommand;
  const spawnArgs = requiresWindowsCmdWrapper
    ? [
        "/d",
        "/s",
        "/c",
        [resolvedCommand, ...args]
          .map((value) => (/\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value))
          .join(" ")
      ]
    : args;

  // nosemgrep: javascript.lang.security.detect-child-process.detect-child-process -- safeRun is restricted to an internal allowlist of tooling binaries.
  const result = spawnSync(spawnCommand, spawnArgs, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(options.env ?? {})
    },
    shell: false,
    timeout: options.timeoutMs ?? 180000,
    windowsVerbatimArguments: requiresWindowsCmdWrapper
  });

  return {
    command: [command, ...args].join(" "),
    exitCode: result.status ?? (result.error ? 1 : 0),
    stdout: `${result.stdout ?? ""}`.trim(),
    stderr: `${result.stderr ?? ""}${result.error ? `\n${String(result.error.message ?? result.error)}` : ""}`.trim()
  };
}

export async function readText(relativeOrAbsolutePath) {
  const absolutePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : fromRepo(relativeOrAbsolutePath);
  return fs.readFile(absolutePath, "utf8");
}

export async function readLines(relativePath) {
  const content = await readText(relativePath);
  return content.split(/\r?\n/);
}

export async function countLines(relativePath) {
  const lines = await readLines(relativePath);
  return lines.length;
}

export async function sha256(relativeOrAbsolutePath) {
  const absolutePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : fromRepo(relativeOrAbsolutePath);
  const buffer = await fs.readFile(absolutePath);
  return createHash("sha256").update(buffer).digest("hex");
}

export function extensionLanguage(filePath) {
  const ext = path.posix.extname(filePath).toLowerCase();
  if ([".ts", ".tsx"].includes(ext)) return "TypeScript";
  if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext)) return "JavaScript";
  if (ext === ".py") return "Python";
  if (ext === ".sql") return "SQL";
  if (ext === ".json") return "JSON";
  if ([".yml", ".yaml"].includes(ext)) return "YAML";
  if (ext === ".md") return "Markdown";
  if (ext === ".tf") return "Terraform";
  if (ext === ".html") return "HTML";
  if (ext === ".ps1" || ext === ".sh") return "Shell";
  return ext ? ext.slice(1).toUpperCase() : "Unknown";
}

export function isTextFile(filePath) {
  const ext = path.posix.extname(filePath).toLowerCase();
  return ![".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".webp", ".zip"].includes(ext);
}

export function classifyFile(relativePath) {
  const baseName = path.posix.basename(relativePath);
  if (relativePath.startsWith("audit/")) return "historical";
  if (relativePath.startsWith("artifacts/")) return "artifact";
  if (
    relativePath.includes("/test/") ||
    relativePath.includes("/tests/") ||
    relativePath.includes("/__tests__/") ||
    /\.(test|spec)\.[tj]sx?$/.test(baseName)
  ) {
    return "test";
  }
  if (
    relativePath.startsWith("infra/") ||
    relativePath.startsWith("ops/") ||
    relativePath.startsWith(".github/workflows/") ||
    baseName.startsWith("Dockerfile") ||
    baseName === "docker-compose.yml" ||
    baseName === "docker-compose.prod.yml"
  ) {
    return "infra";
  }
  if (
    relativePath.startsWith("docs/") ||
    baseName.endsWith(".md") ||
    baseName.endsWith(".html")
  ) {
    return "doc";
  }
  if (
    baseName === "package.json" ||
    baseName === "pnpm-lock.yaml" ||
    baseName === "pnpm-workspace.yaml" ||
    baseName.endsWith(".config.ts") ||
    baseName.endsWith(".config.mjs") ||
    baseName.endsWith(".config.cjs") ||
    baseName.endsWith(".config.js")
  ) {
    return "config";
  }
  return "runtime";
}

export function topLevel(relativePath) {
  return relativePath.split("/")[0] ?? "_root";
}

export function moduleBucket(relativePath) {
  const parts = relativePath.split("/");
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0] ?? "_root";
}

export function unique(values) {
  return [...new Set(values)];
}

export function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export function toSortedArray(mapOrSet) {
  return [...mapOrSet].sort((left, right) => String(left).localeCompare(String(right)));
}

export function normalizeLineLocation(pathValue, line, column = 1) {
  return {
    path: posixPath(pathValue),
    line: Math.max(1, Number(line) || 1),
    column: Math.max(1, Number(column) || 1)
  };
}

export function makeEvidenceRef(pathValue, line, summary) {
  return {
    path: posixPath(pathValue),
    line: Math.max(1, Number(line) || 1),
    summary
  };
}

export async function firstMatchingLine(relativePath, matcher) {
  const lines = await readLines(relativePath);
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    if (typeof matcher === "string" ? current.includes(matcher) : matcher.test(current)) {
      return {
        line: index + 1,
        text: current
      };
    }
  }
  return {
    line: 1,
    text: lines[0] ?? ""
  };
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}
