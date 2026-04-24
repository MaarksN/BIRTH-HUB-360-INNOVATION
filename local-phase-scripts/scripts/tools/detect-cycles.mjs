import fs from "node:fs";
import path from "node:path";

const roots = process.argv.slice(2);
if (!roots.length) roots.push("apps", "packages");

const repo = process.cwd();
const ignore = new Set(["node_modules", ".next", ".turbo", "dist", "build", "coverage", "imports"]);
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(full);
  }
}

for (const r of roots) walk(path.resolve(repo, r));

const fileSet = new Set(files.map(f => path.normalize(f)));
const byNoExt = new Map();
for (const f of files) {
  const noExt = path.normalize(f.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, ""));
  byNoExt.set(noExt, path.normalize(f));
  byNoExt.set(path.join(noExt, "index"), path.normalize(f));
}

function resolveImport(from, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(from), spec);
  const norm = path.normalize(base);
  if (byNoExt.has(norm)) return byNoExt.get(norm);
  for (const ext of [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]) {
    const f = path.normalize(base + ext);
    if (fileSet.has(f)) return f;
  }
  for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
    const f = path.normalize(path.join(base, "index" + ext));
    if (fileSet.has(f)) return f;
  }
  return null;
}

const graph = new Map();
const importRe = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']|require\(["']([^"']+)["']\)/g;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const deps = new Set();
  for (const m of text.matchAll(importRe)) {
    const spec = m[1] || m[2];
    const target = resolveImport(file, spec);
    if (target) deps.add(target);
  }
  graph.set(path.normalize(file), deps);
}

const seen = new Set();
const stack = [];
const inStack = new Set();
const cycles = [];

function dfs(node) {
  seen.add(node);
  stack.push(node);
  inStack.add(node);
  for (const dep of graph.get(node) || []) {
    if (!seen.has(dep)) dfs(dep);
    else if (inStack.has(dep)) {
      const idx = stack.indexOf(dep);
      if (idx >= 0) cycles.push([...stack.slice(idx), dep]);
    }
  }
  stack.pop();
  inStack.delete(node);
}

for (const node of graph.keys()) if (!seen.has(node)) dfs(node);

const rel = p => path.relative(repo, p).replaceAll(path.sep, "/");
console.log(`Arquivos analisados: ${files.length}`);
console.log(`Ciclos encontrados: ${cycles.length}`);
for (const cycle of cycles.slice(0, 50)) {
  console.log("- " + cycle.map(rel).join(" -> "));
}
if (cycles.length > 50) console.log(`...mais ${cycles.length - 50} ciclos omitidos`);
process.exit(cycles.length ? 1 : 0);
