#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const artifactDir = path.join(repoRoot, "artifacts", "local-remediation");
const jsonPath = path.join(artifactDir, "boundaries-report.json");
const mdPath = path.join(artifactDir, "boundaries-report.md");

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignoredParts = new Set(["node_modules", "dist", "build", "coverage", ".next", ".turbo", "artifacts"]);

function gitFiles() {
  const raw = execSync("git ls-files", { cwd: repoRoot, encoding: "utf8" }).trim();
  return raw ? raw.split(/\r?\n/).filter(Boolean) : [];
}

function shouldScan(filePath) {
  const parts = filePath.split("/");
  return (
    (parts[0] === "apps" || parts[0] === "packages") &&
    !parts.some((part) => ignoredParts.has(part)) &&
    sourceExtensions.has(path.extname(filePath))
  );
}

function readJson(filePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, filePath), "utf8"));
}

function workspacePackages(files) {
  const packages = new Map();
  for (const file of files) {
    if (!/^packages\/[^/]+\/package\.json$/.test(file) && !/^apps\/[^/]+\/package\.json$/.test(file)) continue;
    const data = readJson(file);
    const dir = path.dirname(file);
    if (data.name) packages.set(data.name, dir);
  }
  return packages;
}

function importSpecifiers(text) {
  const specs = [];
  const patterns = [
    /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g,
    /export\s+[^'"]+\s+from\s+["']([^"']+)["']/g,
    /require\(["']([^"']+)["']\)/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) specs.push(match[1]);
  }
  return specs;
}

function ownerOf(filePath) {
  const parts = filePath.split("/");
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
}

function classifyImport(spec, packages) {
  if (spec.startsWith("apps/")) return spec.split("/").slice(0, 2).join("/");
  if (spec.startsWith("packages/")) return spec.split("/").slice(0, 2).join("/");
  if (spec.startsWith("@birthub/")) return packages.get(spec) ?? spec;
  return null;
}

function collectPackageGraph(files, packages) {
  const graph = new Map([...packages.values()].map((dir) => [dir, new Set()]));
  const violations = [];
  const routerPrisma = [];

  for (const file of files.filter(shouldScan)) {
    const text = readFileSync(path.join(repoRoot, file), "utf8");
    const from = ownerOf(file);

    if (/^apps\/api\/src\/modules\/.+\/router\.ts$/.test(file) && /\bprisma\./.test(text)) {
      routerPrisma.push(file);
    }

    for (const spec of importSpecifiers(text)) {
      const to = classifyImport(spec, packages);
      if (!to || to === from) continue;
      if (graph.has(from) && graph.has(to)) graph.get(from).add(to);
      if (from.startsWith("packages/") && to.startsWith("apps/")) {
        violations.push({ file, rule: "packages-must-not-import-apps", import: spec });
      }
      if (from === "apps/web" && (to === "packages/database" || spec.includes("prisma"))) {
        violations.push({ file, rule: "web-must-not-depend-on-database-runtime", import: spec });
      }
    }
  }

  return { graph, violations, routerPrisma };
}

function findCycles(graph) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(node) {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      cycles.push([...stack.slice(start), node]);
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) visit(next);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) visit(node);
  return cycles;
}

function renderMarkdown(report) {
  const lines = [
    "# Architecture Boundaries Report",
    "",
    `- Generated at: ${report.generatedAt}`,
    `- Source files scanned: ${report.sourceFilesScanned}`,
    `- Hard violations: ${report.hardViolations.length}`,
    `- Workspace cycles: ${report.cycles.length}`,
    `- Router Prisma hotspots: ${report.routerPrismaHotspots.length}`,
    "",
    "## Hard Violations",
    ""
  ];

  lines.push(
    ...(report.hardViolations.length
      ? report.hardViolations.map((item) => `- ${item.file}: ${item.rule} (${item.import})`)
      : ["- none"])
  );

  lines.push("", "## Workspace Cycles", "");
  lines.push(...(report.cycles.length ? report.cycles.map((cycle) => `- ${cycle.join(" -> ")}`) : ["- none"]));

  lines.push("", "## Router Prisma Hotspots", "");
  lines.push(
    ...(report.routerPrismaHotspots.length
      ? report.routerPrismaHotspots.map((file) => `- ${file}`)
      : ["- none"])
  );

  lines.push(
    "",
    "## Decision",
    "",
    "Hard violations and package cycles fail this gate. Router Prisma hotspots are allowed only for documented admin/break-glass edges and remain listed for refactor planning."
  );

  return `${lines.join("\n")}\n`;
}

const files = gitFiles();
const packages = workspacePackages(files);
const { graph, violations, routerPrisma } = collectPackageGraph(files, packages);
const cycles = findCycles(graph);
const report = {
  generatedAt: new Date().toISOString(),
  sourceFilesScanned: files.filter(shouldScan).length,
  hardViolations: violations,
  cycles,
  routerPrismaHotspots: routerPrisma,
  ok: violations.length === 0 && cycles.length === 0
};

mkdirSync(artifactDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdPath, renderMarkdown(report), "utf8");

if (!report.ok) {
  console.error(`[audit:boundaries] failed. See ${path.relative(repoRoot, mdPath)}`);
  process.exit(1);
}

console.log(`[audit:boundaries] ok. See ${path.relative(repoRoot, mdPath)}`);
