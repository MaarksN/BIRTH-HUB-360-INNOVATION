#!/usr/bin/env node
// @ts-nocheck
// 
// [SOURCE] checklist Agent Pack — GAP-005

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "artifacts", "security");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "inline-credential-scan.json");

const INCLUDE_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".md", ".yaml", ".yml", ".json"]);
const EXCLUDED_DIRS = new Set([
  ".git",
  ".next",
  ".pytest_cache",
  ".tools",
  ".turbo",
  "__pycache__",
  "artifacts",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);
const EXCLUDED_FILES = new Set(["pnpm-lock.yaml"]);

const CREDENTIAL_PATTERNS = [
  { id: "openai_sk", regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { id: "bearer_token", regex: /\bBearer\s+[A-Za-z0-9._-]{20,}\b/g },
  {
    id: "generic_secret_assignment",
    regex: /\b(?:api[_-]?key|token|secret|password)\b\s*[:=]\s*["'][^"'\\]{8,}["']/gi,
  },
  { id: "vault_key_uri", regex: /\bdotenv:\/\/:[^\s@]+@/gi },
  { id: "jwt_like_token", regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
];

const PLACEHOLDER_HINTS = [
  "example",
  "placeholder",
  "your api key",
  "insert key",
  "dummy",
  "test",
  "changeme",
  "token_here",
  "secret_here",
  "api_key_here",
  "password123",
  "redacted",
  "tenant-secret",
  "supersecret",
];

const SYNTHETIC_TEST_CREDENTIAL_PATTERNS = [
  /\bsecret[:=]\s*["']secret[_-][a-z0-9_-]{1,64}["']/i,
  /\btoken[:=]\s*["']token[-_][a-z0-9_-]{1,64}["']/i,
  /\bpassword[:=]\s*["']password[_-][a-z0-9_-]{1,64}["']/i,
  /\bapi[_-]?key[:=]\s*["']api[_-]?key[_-][a-z0-9_-]{1,64}["']/i
];

const REAL_CREDENTIAL_VALUE_PATTERNS = [
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bsk_live_[A-Za-z0-9]{10,}\b/i,
  /\bpk_live_[A-Za-z0-9]{10,}\b/i,
  /\bwhsec_live_[A-Za-z0-9]{10,}\b/i,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/
];

function shouldSkipFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);
  if (parts.some((part) => EXCLUDED_DIRS.has(part))) {
    return true;
  }
  if (EXCLUDED_FILES.has(path.basename(filePath))) {
    return true;
  }
  return !INCLUDE_EXT.has(path.extname(filePath).toLowerCase());
}

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        files.push(...walk(fullPath));
      }
      continue;
    }
    if (entry.isFile() && !shouldSkipFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeLine(line) {
  return line.toLowerCase().replace(/\s+/g, " ").trim();
}

function isPlaceholder(line) {
  const normalized = normalizeLine(line);
  return PLACEHOLDER_HINTS.some((hint) => normalized.includes(hint));
}

function isSyntheticTestCredential(line) {
  return SYNTHETIC_TEST_CREDENTIAL_PATTERNS.some((pattern) => pattern.test(line));
}

function isTestFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  return /(?:^|[\\/])(?:tests?|__tests__)[\\/]/i.test(rel) || /\.test\.[cm]?[jt]sx?$/i.test(rel);
}

function isLikelyTestFixtureCredential(filePath, line) {
  if (!isTestFile(filePath)) {
    return false;
  }

  const match = line.match(/\b(?:api[_-]?key|token|secret|password)\b\s*[:=]\s*["']([^"']{1,160})["']/i);
  const value = match?.[1];
  if (!value) {
    return false;
  }

  return !REAL_CREDENTIAL_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return [];
  }
  const lines = content.split(/\r?\n/);
  const findings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || isPlaceholder(line) || isSyntheticTestCredential(line) || isLikelyTestFixtureCredential(filePath, line)) {
      continue;
    }
    for (const pattern of CREDENTIAL_PATTERNS) {
      pattern.regex.lastIndex = 0;
      const match = pattern.regex.exec(line);
      if (!match) {
        continue;
      }
      findings.push({
        file: path.relative(ROOT, filePath),
        line: index + 1,
        pattern: pattern.id,
        excerpt: line.trim().slice(0, 240),
      });
    }
  }
  return findings;
}

const filesToScan = walk(ROOT);
const findings = filesToScan.flatMap((filePath) => scanFile(filePath));

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(
  OUTPUT_FILE,
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      scanned_files: filesToScan.length,
      findings_count: findings.length,
      findings,
    },
    null,
    2
  )}\n`,
  "utf8"
);

if (findings.length > 0) {
  console.error(`INLINE_CREDENTIAL_FINDINGS=${findings.length}`);
  process.exit(1);
}

console.log(`INLINE_CREDENTIAL_FINDINGS=0`);
console.log(`REPORT_FILE=${path.relative(ROOT, OUTPUT_FILE)}`);
