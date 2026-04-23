#!/usr/bin/env node
// @ts-nocheck
// 
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { projectRoot, runCapture } from "./shared.mjs";

const markdownLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;
const ignoredDirectoryNames = new Set([
  ".git",
  ".next",
  ".pytest_cache",
  ".stryker-tmp",
  ".tools",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "test-results"
]);
const skippedMarkdownPrefixes = [".tools/", "docs/product/", "artifacts/audit/files_analysis/", "artifacts/stryker/"];
const alwaysCheckedFiles = [
  "README.md",
  "CONTRIBUTING.md",
  "docs/README.md",
  "artifacts/README.md",
  ".github/PULL_REQUEST_TEMPLATE.md"
];

function gitCapture(args, allowFailure = false) {
  const result = runCapture("git", args, { cwd: projectRoot });

  if ((result.status ?? 1) === 0) {
    return (result.stdout ?? "").trim();
  }

  if (allowFailure) {
    return "";
  }

  const errorOutput = (result.stderr ?? result.stdout ?? "").trim();
  throw new Error(errorOutput || `git ${args.join(" ")} failed`);
}

function hasRef(ref) {
  return Boolean(gitCapture(["rev-parse", "--verify", ref], true));
}

function walkMarkdownFiles(rootRelativePath = ".") {
  const rootDirectory = path.join(projectRoot, rootRelativePath);
  if (!existsSync(rootDirectory)) {
    return [];
  }

  const collectedFiles = [];
  const queue = [rootDirectory];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (!ignoredDirectoryNames.has(entry.name)) {
          queue.push(fullPath);
        }
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith(".md")) {
        continue;
      }

      const relativePath = path.relative(projectRoot, fullPath).replaceAll("\\", "/");
      if (!skippedMarkdownPrefixes.some((prefix) => relativePath.startsWith(prefix))) {
        collectedFiles.push(relativePath);
      }
    }
  }

  return collectedFiles;
}

function resolveBaseRef() {
  const explicitBase = process.env.DOC_LINKS_BASE?.trim();
  if (explicitBase && hasRef(explicitBase)) {
    return explicitBase;
  }

  const githubBaseRef = process.env.GITHUB_BASE_REF?.trim();
  if (githubBaseRef) {
    const remoteRef = `origin/${githubBaseRef}`;
    if (hasRef(remoteRef)) {
      return remoteRef;
    }
  }

  return hasRef("HEAD~1") ? "HEAD~1" : null;
}

function listMarkdownFiles() {
  if (process.argv.includes("--all")) {
    const tracked = gitCapture(["ls-files"], true);
    const trackedMarkdownFiles = tracked
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.endsWith(".md"))
      .filter((line) => !skippedMarkdownPrefixes.some((prefix) => line.startsWith(prefix)))
      .filter((line) => existsSync(path.join(projectRoot, line)));

    return trackedMarkdownFiles.length > 0 ? trackedMarkdownFiles : walkMarkdownFiles();
  }

  const baseRef = resolveBaseRef();
  const diffArgs = baseRef
    ? ["diff", "--name-only", "--diff-filter=ACMR", `${baseRef}..HEAD`, "--"]
    : ["diff", "--name-only", "--diff-filter=ACMR", "HEAD", "--"];
  const changed = gitCapture(diffArgs, true)
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".md"));

  return [...new Set([...alwaysCheckedFiles, ...changed])].filter((file) =>
    existsSync(path.join(projectRoot, file))
  );
}

function normalizeLinkTarget(sourceFile, target) {
  const cleanTarget = target.trim().replace(/^<|>$/gu, "");
  const [withoutQuery] = cleanTarget.split("?");
  const [withoutAnchor] = withoutQuery.split("#");

  if (!withoutAnchor) {
    return null;
  }

  if (
    withoutAnchor.startsWith("http://") ||
    withoutAnchor.startsWith("https://") ||
    withoutAnchor.startsWith("mailto:") ||
    withoutAnchor.startsWith("data:")
  ) {
    return null;
  }

  if (withoutAnchor.startsWith("/")) {
    return path.join(projectRoot, withoutAnchor.slice(1));
  }

  return path.resolve(path.dirname(path.join(projectRoot, sourceFile)), withoutAnchor);
}

function linkExists(absoluteTargetPath) {
  if (!absoluteTargetPath) {
    return true;
  }

  if (existsSync(absoluteTargetPath)) {
    return true;
  }

  if (!path.extname(absoluteTargetPath) && existsSync(`${absoluteTargetPath}.md`)) {
    return true;
  }

  return false;
}

const files = listMarkdownFiles();
const issues = [];

for (const file of files) {
  const content = readFileSync(path.join(projectRoot, file), "utf8");

  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = match[1];
    if (!target) {
      continue;
    }

    const absoluteTargetPath = normalizeLinkTarget(file, target);
    if (!linkExists(absoluteTargetPath)) {
      issues.push(`${file} -> ${target}`);
    }
  }
}

if (issues.length > 0) {
  console.error("[doc-links] FAILED");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[doc-links] ok (${files.length} markdown file${files.length === 1 ? "" : "s"} checked)`);
}
