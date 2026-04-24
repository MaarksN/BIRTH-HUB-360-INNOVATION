// @ts-nocheck
// 
import { execFileSync } from "node:child_process";

const guardedFiles = [
  "apps/web/app/(dashboard)/dashboard/page.tsx",
  "apps/web/app/(dashboard)/workflows/page.tsx",
  "apps/web/components/agents/PolicyManager.tsx",
  "apps/web/components/agents/agent-detail-tabs.tsx",
  "apps/web/components/cookie-consent-banner.tsx",
  "apps/web/components/layout/Navbar.tsx"
];

function runGit(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function safeRunGit(args) {
  try {
    return runGit(args);
  } catch {
    return "";
  }
}

function getDiffRange() {
  const baseRef = process.env.GITHUB_BASE_REF;

  if (baseRef) {
    safeRunGit(["fetch", "--no-tags", "--depth=1", "origin", baseRef]);
    return `origin/${baseRef}...HEAD`;
  }

  const hasParent = safeRunGit(["rev-parse", "--verify", "HEAD^1"]);
  if (hasParent) {
    return "HEAD^1..HEAD";
  }

  return "HEAD";
}

function readDiff(range, filePath) {
  return safeRunGit(["diff", "--unified=0", range, "--", filePath]);
}

function collectViolations(diff, filePath) {
  return diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1))
    .filter((line) => /style=\{/.test(line))
    .map((line) => ({ filePath, line: line.trim() }));
}

const diffRange = getDiffRange();
const violations = guardedFiles.flatMap((filePath) =>
  collectViolations(readDiff(diffRange, filePath), filePath)
);

if (violations.length > 0) {
  console.error("Web inline style freeze violation detected.");
  console.error(
    "New inline style attributes are blocked in the canonical dashboard surfaces covered by the CSP hardening cycle."
  );
  console.error("Move presentation into CSS classes in apps/web/app/(dashboard)/dashboard.css or apps/web/app/globals.css.");
  for (const violation of violations) {
    console.error(` - ${violation.filePath}: ${violation.line}`);
  }
  process.exit(1);
}

console.log("Web inline style freeze check passed.");
