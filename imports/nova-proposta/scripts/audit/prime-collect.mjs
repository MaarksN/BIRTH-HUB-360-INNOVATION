#!/usr/bin/env node
// @ts-nocheck
// 
import path from "node:path";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";

import {
  auditRoot,
  average,
  classifyFile,
  countLines,
  extensionLanguage,
  firstMatchingLine,
  formatNumber,
  fromRepo,
  listTrackedFiles,
  listUntrackedFiles,
  makeEvidenceRef,
  median,
  moduleBucket,
  normalizeLineLocation,
  posixPath,
  readLines,
  readText,
  relativePath,
  reportDateParts,
  repoRoot,
  safeRun,
  sha256,
  supportRoot,
  topLevel,
  unique,
  writeJson
} from "./shared-prime.mjs";

const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const corePrefixes = ["apps/web/", "apps/api/", "apps/worker/", "packages/database/"];
const runtimeScanPrefixes = ["apps/", "packages/", "infra/", "ops/", ".github/workflows/"];
const supplementalEvidencePaths = [
  "docs/operations/environment-parity.md",
  "docs/operations/sla.md",
  "artifacts/security/semgrep-head.json",
  "artifacts/testing/module-coverage.json",
  "artifacts/performance/web-bundle-head.json",
  "artifacts/accessibility/axe-report.json",
  "artifacts/dr/latest-drill.json",
  "artifacts/tenancy/rls-proof-head.json"
];

function isScannableCode(filePath) {
  const extension = path.posix.extname(filePath).toLowerCase();
  return codeExtensions.has(extension) && !filePath.startsWith("audit/") && !filePath.startsWith("artifacts/");
}

function isRuntimeCode(filePath) {
  return isScannableCode(filePath) && classifyFile(filePath) === "runtime";
}

function isWithinPrefixes(filePath, prefixes) {
  return prefixes.some((prefix) => filePath.startsWith(prefix));
}

function quantile(values, percentile) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * percentile));
  return sorted[index];
}

async function readOptional(relativePathValue) {
  try {
    return await readText(relativePathValue);
  } catch {
    return null;
  }
}

async function readJsonIfExists(relativePathValue) {
  const content = await readOptional(relativePathValue);
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function loadTypescript() {
  try {
    return await import("typescript");
  } catch {
    return null;
  }
}

async function collectFileIndex(files) {
  const rows = [];
  for (const relativePathValue of files) {
    const absolutePath = fromRepo(relativePathValue);
    if (!existsSync(absolutePath)) {
      continue;
    }

    const stats = await fs.stat(absolutePath);
    const lineCount = classifyFile(relativePathValue) === "artifact" || classifyFile(relativePathValue) === "historical"
      ? 0
      : await countLines(relativePathValue).catch(() => 0);
    rows.push({
      path: relativePathValue,
      bytes: stats.size,
      lines: lineCount,
      language: extensionLanguage(relativePathValue),
      kind: classifyFile(relativePathValue),
      topLevel: topLevel(relativePathValue),
      moduleBucket: moduleBucket(relativePathValue),
      sha256: await sha256(relativePathValue)
    });
  }
  return rows;
}

async function analyzeComplexity(files) {
  const ts = await loadTypescript();
  if (!ts) {
    return {
      available: false,
      reason: "typescript package unavailable",
      filesScanned: 0,
      functionsScanned: 0,
      modules: [],
      hotspots: []
    };
  }

  const scanTargets = files.filter((entry) => isScannableCode(entry) && isWithinPrefixes(entry, ["apps/", "packages/", "agents/"]));

  function displayName(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name) {
      return node.name.getText();
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent) && parent.name) {
        return parent.name.getText();
      }
      if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.getText();
      }
    }
    return "<anonymous>";
  }

  function computeCyclomatic(node) {
    let complexity = 1;
    function visit(child) {
      if (
        ts.isIfStatement(child) ||
        ts.isForStatement(child) ||
        ts.isForInStatement(child) ||
        ts.isForOfStatement(child) ||
        ts.isWhileStatement(child) ||
        ts.isDoStatement(child) ||
        ts.isConditionalExpression(child) ||
        ts.isCatchClause(child)
      ) {
        complexity += 1;
      }
      if (ts.isCaseClause(child) && child.expression) {
        complexity += 1;
      }
      if (
        ts.isBinaryExpression(child) &&
        [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
          child.operatorToken.kind
        )
      ) {
        complexity += 1;
      }
      ts.forEachChild(child, visit);
    }
    if (node.body) {
      ts.forEachChild(node.body, visit);
    }
    return complexity;
  }

  const findings = [];
  for (const filePath of scanTargets) {
    const absolutePath = fromRepo(filePath);
    const sourceText = await fs.readFile(absolutePath, "utf8");
    const sourceFile = ts.createSourceFile(absolutePath, sourceText, ts.ScriptTarget.Latest, true);
    function walk(node) {
      if (
        (ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isMethodDeclaration(node)) &&
        node.body
      ) {
        const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const end = sourceFile.getLineAndCharacterOfPosition(node.end);
        findings.push({
          file: filePath,
          module: moduleBucket(filePath),
          functionName: displayName(node),
          line: start.line + 1,
          endLine: end.line + 1,
          length: end.line - start.line + 1,
          complexity: computeCyclomatic(node)
        });
      }
      ts.forEachChild(node, walk);
    }
    walk(sourceFile);
  }

  const grouped = new Map();
  for (const finding of findings) {
    if (!grouped.has(finding.module)) {
      grouped.set(finding.module, []);
    }
    grouped.get(finding.module).push(finding);
  }

  const modules = [...grouped.entries()]
    .map(([moduleName, rows]) => {
      const complexities = rows.map((row) => row.complexity);
      return {
        module: moduleName,
        functions: rows.length,
        avgComplexity: Number(formatNumber(average(complexities), 2)),
        p95Complexity: quantile(complexities, 0.95),
        maxComplexity: Math.max(...complexities),
        functionsAtOrAbove10: rows.filter((row) => row.complexity >= 10).length,
        functionsAtOrAbove20: rows.filter((row) => row.complexity >= 20).length,
        hotspots: rows
          .filter((row) => row.complexity >= 10)
          .sort((left, right) => right.complexity - left.complexity || left.file.localeCompare(right.file))
          .slice(0, 12)
      };
    })
    .sort((left, right) => right.maxComplexity - left.maxComplexity || left.module.localeCompare(right.module));

  return {
    available: true,
    filesScanned: scanTargets.length,
    functionsScanned: findings.length,
    modules,
    hotspots: findings
      .filter((row) => row.complexity >= 10)
      .sort((left, right) => right.complexity - left.complexity || left.file.localeCompare(right.file))
      .slice(0, 80)
  };
}

async function collectLineOccurrences(files, { id, regex, filter, summary }) {
  const results = [];
  for (const filePath of files) {
    if (filter && !filter(filePath)) continue;
    const lines = await readLines(filePath).catch(() => []);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      regex.lastIndex = 0;
      if (!regex.test(line)) continue;
      results.push({
        id,
        path: filePath,
        line: index + 1,
        text: line.trim(),
        summary: typeof summary === "function" ? summary(line.trim(), filePath) : summary
      });
    }
  }
  regex.lastIndex = 0;
  return results;
}

async function collectFilePredicates(files) {
  const networkWithoutTimeout = [];
  const findManyWithoutPagination = [];
  const awaitInLoop = [];
  const hardcodedWebStrings = [];
  const imageWithoutAlt = [];

  for (const filePath of files) {
    if (!isScannableCode(filePath)) continue;
    const lines = await readLines(filePath).catch(() => []);
    const content = lines.join("\n");
    const isCoreRuntime = isRuntimeCode(filePath) && isWithinPrefixes(filePath, runtimeScanPrefixes);
    const outboundIoPattern = /(fetch\s*\(|axios\.(get|post|put|delete|request)|new\s+Redis\s*\()/;

    if (
      isCoreRuntime &&
      outboundIoPattern.test(content) &&
      !/(timeout|AbortSignal|AbortController|requestTimeout|setTimeout\()/i.test(content)
    ) {
      const lineMatch = lines.findIndex((line) => outboundIoPattern.test(line));
      networkWithoutTimeout.push({
        path: filePath,
        line: Math.max(1, lineMatch + 1),
        summary: "Operação externa sem timeout explícito no arquivo."
      });
    }

    if (
      (filePath.startsWith("apps/api/") || filePath.startsWith("packages/database/")) &&
      !/\/test\/|\.test\./.test(filePath)
    ) {
      for (let index = 0; index < lines.length; index += 1) {
        if (!lines[index].includes("findMany(")) continue;
        if (/^\s*(?:async\s+)?findMany\s*\(/.test(lines[index])) continue;
        const windowStart = Math.max(0, index - 25);
        const windowEnd = Math.min(lines.length, index + 26);
        const window = lines.slice(windowStart, windowEnd).join("\n");
        if (!/(take\s*[:,]|skip\s*[:,]|cursor\s*:|pageSize|limit\s*:)/.test(window)) {
          findManyWithoutPagination.push({
            path: filePath,
            line: index + 1,
            summary: "Consulta findMany sem paginação evidente nas linhas adjacentes."
          });
        }
      }
    }

    if (isCoreRuntime) {
      for (let index = 0; index < lines.length; index += 1) {
        if (!/\bfor\s*\(|\bfor\s+await\s*\(|\bwhile\s*\(/.test(lines[index])) continue;
        const window = lines.slice(index, index + 12).join("\n");
        if (/\bawait\b/.test(window)) {
          awaitInLoop.push({
            path: filePath,
            line: index + 1,
            summary: "Await detectado em loop síncrono/iterativo."
          });
        }
      }
    }

    if (filePath.startsWith("apps/web/") && /\.(tsx|jsx)$/.test(filePath)) {
      let stringCount = 0;
      let firstLine = 1;
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (/^\s*import\s/.test(line) || /className=|href=|src=|variant=|size=|type=/.test(line)) continue;
        if (/(["'`])(?=.*[A-Za-zÀ-ÿ])(?:(?=(\\?))\2.)*?\1/.test(line)) {
          stringCount += 1;
          if (firstLine === 1 && stringCount === 1) {
            firstLine = index + 1;
          }
        }
        if (/<img(?![^>]*\balt=)[^>]*>/.test(line)) {
          imageWithoutAlt.push({
            path: filePath,
            line: index + 1,
            summary: "Tag <img> sem atributo alt na mesma linha."
          });
        }
      }
      if (stringCount >= 6) {
        hardcodedWebStrings.push({
          path: filePath,
          line: firstLine,
          count: stringCount,
          summary: `${stringCount} linhas com strings textuais embutidas na UI.`
        });
      }
    }
  }

  return {
    networkWithoutTimeout,
    findManyWithoutPagination,
    awaitInLoop,
    hardcodedWebStrings,
    imageWithoutAlt
  };
}

async function collectRouteFallbacks(files) {
  const pageFiles = files.filter((filePath) => filePath.startsWith("apps/web/app/") && filePath.endsWith("/page.tsx"));
  return pageFiles.map((filePath) => {
    const directory = path.posix.dirname(filePath);
    return {
      path: filePath,
      line: 1,
      missingLoading: !files.includes(`${directory}/loading.tsx`),
      missingError: !files.includes(`${directory}/error.tsx`)
    };
  }).filter((entry) => entry.missingLoading || entry.missingError);
}

function resolveRelativeImport(sourceFile, specifier, trackedFilesSet) {
  if (!specifier.startsWith(".")) return null;
  const sourceDir = path.posix.dirname(sourceFile);
  const resolvedBase = posixPath(path.posix.normalize(path.posix.join(sourceDir, specifier)));
  const candidates = [
    resolvedBase,
    `${resolvedBase}.ts`,
    `${resolvedBase}.tsx`,
    `${resolvedBase}.js`,
    `${resolvedBase}.mjs`,
    `${resolvedBase}.cjs`,
    `${resolvedBase}/index.ts`,
    `${resolvedBase}/index.tsx`,
    `${resolvedBase}/index.js`,
    `${resolvedBase}/index.mjs`
  ];
  return candidates.find((candidate) => trackedFilesSet.has(candidate)) ?? null;
}

async function collectImportCycles(files) {
  const targets = files.filter((filePath) => isRuntimeCode(filePath) && isWithinPrefixes(filePath, ["apps/api/", "apps/web/", "apps/worker/", "packages/"]));
  const trackedFilesSet = new Set(files);
  const graph = new Map();

  for (const filePath of targets) {
    const content = await readOptional(filePath);
    const imports = [];
    if (content) {
      for (const match of content.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g)) {
        const resolved = resolveRelativeImport(filePath, match[1], trackedFilesSet);
        if (resolved) imports.push(resolved);
      }
    }
    graph.set(filePath, unique(imports));
  }

  const seenCycles = new Set();
  const cycles = [];
  const stack = [];
  const visiting = new Set();
  const visited = new Set();

  function dfs(node) {
    visiting.add(node);
    stack.push(node);

    for (const next of graph.get(node) ?? []) {
      if (!graph.has(next)) continue;
      if (!visiting.has(next) && !visited.has(next)) {
        dfs(next);
        continue;
      }
      if (visiting.has(next)) {
        const startIndex = stack.indexOf(next);
        const cycleNodes = [...stack.slice(startIndex), next];
        const cycleKey = [...cycleNodes].sort().join("|");
        if (!seenCycles.has(cycleKey)) {
          seenCycles.add(cycleKey);
          cycles.push(cycleNodes);
        }
      }
    }

    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node);
  }

  return cycles.slice(0, 20).map((cycle) => ({
    nodes: cycle,
    anchor: cycle[0]
  }));
}

async function parseSchemaModels() {
  const schemaPath = "packages/database/prisma/schema.prisma";
  const lines = await readLines(schemaPath);
  const models = [];
  let current = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const modelMatch = line.match(/^\s*model\s+([A-Za-z0-9_]+)\s+\{/);
    if (modelMatch) {
      current = {
        name: modelMatch[1],
        line: index + 1,
        fields: [],
        hasTenantField: false,
        hasOrganizationField: false
      };
      continue;
    }
    if (current && /^\s*}/.test(line)) {
      models.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const fieldMatch = line.match(/^\s*([A-Za-z0-9_]+)\s+/);
    if (!fieldMatch) continue;
    const fieldName = fieldMatch[1];
    current.fields.push(fieldName);
    if (/tenantId/i.test(fieldName)) current.hasTenantField = true;
    if (/organizationId|orgId/i.test(fieldName)) current.hasOrganizationField = true;
  }

  return {
    path: schemaPath,
    models
  };
}

function parseGitLogRows(rawOutput) {
  if (!rawOutput.trim()) return [];
  return rawOutput
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const [sha, date, subject] = line.split("|");
      return {
        sha,
        date,
        subject
      };
    });
}

function collectCapabilities(files, schemaModels) {
  const apiModules = unique(
    files
      .filter((filePath) => /^apps\/api\/src\/modules\/[^/]+\/.+/.test(filePath))
      .map((filePath) => filePath.split("/")[4])
  );
  const webRoutes = files
    .filter((filePath) => filePath.startsWith("apps/web/app/") && filePath.endsWith("/page.tsx"))
    .map((filePath) =>
      filePath
        .replace(/^apps\/web\/app\//, "")
        .replace(/\/page\.tsx$/, "")
    )
    .sort();
  const packageSurfaces = unique(
    files
      .filter((filePath) => /^packages\/[^/]+\/package\.json$/.test(filePath))
      .map((filePath) => filePath.split("/")[1])
  );
  const docs = {
    serviceCatalog: files.includes("docs/service-catalog.md"),
    releaseRunbook: files.some((filePath) => /runbook/i.test(filePath)),
    adrFiles: files.filter((filePath) => /(^|\/)ADR|adr/i.test(filePath)),
    onCallFiles: files.filter((filePath) => /on-?call/i.test(filePath)),
    slaFiles: files.filter((filePath) => /(^|\/)sla/i.test(filePath)),
    i18nFiles: files.filter((filePath) => /i18n|locales|messages/i.test(filePath)),
    fhirFiles: files.filter((filePath) => /fhir|hl7/i.test(filePath))
  };
  const infra = {
    terraform: files.some((filePath) => filePath.startsWith("infra/terraform/") && filePath.endsWith(".tf")),
    cloudRun: files.includes("infra/cloudrun/service.yaml"),
    k8sFiles: files.filter((filePath) => filePath.startsWith("infra/k8s/") && !filePath.endsWith(".gitkeep")),
    monitoringFiles: files.filter((filePath) => filePath.startsWith("infra/monitoring/")),
    dockerfiles: files.filter((filePath) => path.posix.basename(filePath).startsWith("Dockerfile") || filePath.endsWith("docker-compose.yml") || filePath.endsWith("docker-compose.prod.yml"))
  };
  const runtimeFlags = {
    hasAuthModule: apiModules.includes("auth"),
    hasBillingModule: apiModules.includes("billing"),
    hasConnectorsModule: apiModules.includes("connectors"),
    hasAnalyticsModule: apiModules.includes("analytics"),
    hasPrivacyModule: apiModules.includes("privacy"),
    hasWorkflowsModule: apiModules.includes("workflows"),
    hasNotificationsModule: apiModules.includes("notifications"),
    hasMarketplaceModule: apiModules.includes("marketplace"),
    hasAgentsModule: apiModules.includes("agents"),
    hasRlsEvidence: files.includes("packages/database/test/rls.test.ts"),
    hasLlmClient: files.includes("packages/integrations/src/clients/llm.ts") || files.includes("packages/llm-client/src/index.ts"),
    hasWebhookSupport: files.some((filePath) => filePath.includes("/webhooks/")),
    hasAuditSupport: files.some((filePath) => filePath.startsWith("apps/api/src/audit/"))
  };

  return {
    apiModules,
    webRoutes,
    packageSurfaces,
    schemaModels,
    docs,
    infra,
    runtimeFlags
  };
}

async function collectDockerfileFacts(files) {
  const dockerfiles = files.filter((filePath) => path.posix.basename(filePath).startsWith("Dockerfile"));
  const rows = [];
  for (const dockerfile of dockerfiles) {
    const lines = await readLines(dockerfile);
    rows.push({
      path: dockerfile,
      fromStatements: lines.filter((line) => /^\s*FROM\s+/i.test(line)).length,
      line: (lines.findIndex((line) => /^\s*FROM\s+/i.test(line)) + 1) || 1
    });
  }
  return rows;
}

function collectRelatedTests(files, filePath) {
  const baseName = path.posix.basename(filePath).replace(/\.(d\.)?[a-z0-9]+$/i, "");
  const moduleName = filePath.split("/").slice(-2, -1)[0] ?? baseName;
  return files.filter((candidate) => {
    if (classifyFile(candidate) !== "test") return false;
    return candidate.includes(baseName) || candidate.includes(moduleName);
  });
}

function collectCoverageGaps(files, fileIndex, complexity) {
  const criticalRuntimeFiles = fileIndex
    .filter((entry) => entry.kind === "runtime" && isWithinPrefixes(entry.path, corePrefixes) && entry.lines >= 80)
    .sort((left, right) => right.lines - left.lines)
    .slice(0, 40);

  const fromComplexity = complexity.hotspots
    .filter((entry) => isWithinPrefixes(entry.file, corePrefixes))
    .map((entry) => entry.file);

  const uniqueTargets = unique([...criticalRuntimeFiles.map((entry) => entry.path), ...fromComplexity]).slice(0, 60);

  return uniqueTargets
    .map((filePath) => ({
      path: filePath,
      relatedTests: collectRelatedTests(files, filePath)
    }))
    .filter((entry) => entry.relatedTests.length === 0)
    .slice(0, 30);
}

async function collectEvidenceArtifacts() {
  return {
    environmentParity: {
      path: "docs/operations/environment-parity.md",
      content: await readOptional("docs/operations/environment-parity.md")
    },
    sla: {
      path: "docs/operations/sla.md",
      content: await readOptional("docs/operations/sla.md")
    },
    semgrep: {
      path: "artifacts/security/semgrep-head.json",
      data: await readJsonIfExists("artifacts/security/semgrep-head.json")
    },
    moduleCoverage: {
      path: "artifacts/testing/module-coverage.json",
      data: await readJsonIfExists("artifacts/testing/module-coverage.json")
    },
    bundleBaseline: {
      path: "artifacts/performance/web-bundle-head.json",
      data: await readJsonIfExists("artifacts/performance/web-bundle-head.json")
    },
    accessibility: {
      path: "artifacts/accessibility/axe-report.json",
      data: await readJsonIfExists("artifacts/accessibility/axe-report.json")
    },
    disasterRecovery: {
      path: "artifacts/dr/latest-drill.json",
      data: await readJsonIfExists("artifacts/dr/latest-drill.json")
    },
    rlsProof: {
      path: "artifacts/tenancy/rls-proof-head.json",
      data: await readJsonIfExists("artifacts/tenancy/rls-proof-head.json")
    }
  };
}

async function main() {
  const { dateOnly, slug } = reportDateParts();
  const supportDirectory = supportRoot(dateOnly);
  const rawPath = path.join(supportDirectory, "01-raw-evidence.json");

  await fs.mkdir(supportDirectory, { recursive: true });
  await fs.mkdir(auditRoot, { recursive: true });

  const trackedFiles = unique([
    ...listTrackedFiles(),
    ...listUntrackedFiles(),
    ...supplementalEvidencePaths.filter((relativePathValue) => existsSync(fromRepo(relativePathValue)))
  ]);
  const fileIndex = await collectFileIndex(trackedFiles);
  const complexity = await analyzeComplexity(trackedFiles);
  const schema = await parseSchemaModels();
  const importCycles = await collectImportCycles(trackedFiles);
  const routeFallbacks = await collectRouteFallbacks(trackedFiles);
  const dockerFacts = await collectDockerfileFacts(trackedFiles);

  const anyOccurrences = await collectLineOccurrences(trackedFiles, {
    id: "any-usage",
    regex: /\bany\b/g,
    filter: (filePath) => isRuntimeCode(filePath) && isWithinPrefixes(filePath, ["apps/", "packages/"]),
    summary: "Uso explícito de any em código de runtime."
  });

  const consoleOccurrences = await collectLineOccurrences(trackedFiles, {
    id: "console-runtime",
    regex: /console\.(log|info|warn|error|debug)\s*\(/g,
    filter: (filePath) => isRuntimeCode(filePath) && isWithinPrefixes(filePath, ["apps/", "packages/"]),
    summary: "Uso de console.* em superfície de runtime."
  });

  const envOccurrences = await collectLineOccurrences(trackedFiles, {
    id: "direct-env",
    regex: /process\.env\.[A-Z0-9_]+/g,
    filter: (filePath) =>
      isRuntimeCode(filePath) &&
      isWithinPrefixes(filePath, ["apps/", "packages/"]) &&
      !filePath.includes("/config") &&
      !filePath.includes("env."),
    summary: "Leitura direta de process.env fora de superfície dedicada de configuração."
  });

  const todoOccurrences = await collectLineOccurrences(trackedFiles, {
    id: "todo-fixme",
    regex: /\b(TODO|FIXME|XXX)\b/g,
    filter: (filePath) => isScannableCode(filePath) && isWithinPrefixes(filePath, ["apps/", "packages/", "infra/", "ops/"]),
    summary: "Marcador pendente em código versionado."
  });

  const emptyCatchOccurrences = await collectLineOccurrences(trackedFiles, {
    id: "empty-catch",
    regex: /catch\s*\([^)]*\)\s*{\s*}/g,
    filter: (filePath) => isRuntimeCode(filePath) && isWithinPrefixes(filePath, ["apps/", "packages/"]),
    summary: "Catch vazio ou silencioso em runtime."
  });

  const rawQueryUnsafeOccurrences = await collectLineOccurrences(trackedFiles, {
    id: "raw-query-unsafe",
    regex: /\$(queryRawUnsafe|executeRawUnsafe)\b/g,
    filter: (filePath) => isScannableCode(filePath) && isWithinPrefixes(filePath, ["apps/", "packages/"]),
    summary: "Uso de raw query insegura identificado."
  });

  const longFunctions = complexity.hotspots
    .filter((entry) => entry.length >= 40)
    .map((entry) => ({
      path: entry.file,
      line: entry.line,
      endLine: entry.endLine,
      functionName: entry.functionName,
      length: entry.length,
      complexity: entry.complexity
    }));

  const largeFiles = fileIndex
    .filter((entry) => entry.kind === "runtime" && isWithinPrefixes(entry.path, ["apps/", "packages/"]) && entry.lines >= 220)
    .sort((left, right) => right.lines - left.lines)
    .slice(0, 60)
    .map((entry) => ({
      path: entry.path,
      line: 1,
      lines: entry.lines
    }));

  const filePredicates = await collectFilePredicates(trackedFiles);
  const capabilities = collectCapabilities(trackedFiles, schema.models);
  const coverageGaps = collectCoverageGaps(trackedFiles, fileIndex, complexity);
  const evidenceArtifacts = await collectEvidenceArtifacts();

  const branch = safeRun("git", ["branch", "--show-current"]).stdout || "HEAD";
  const headSha = safeRun("git", ["rev-parse", "HEAD"]).stdout || "unknown";
  const gitSince30 = safeRun("git", ["log", "--first-parent", "--since=30 days ago", "--pretty=format:%H|%ad|%s", "--date=short"]);
  const last30Days = parseGitLogRows(gitSince30.stdout);
  const placeholderPattern = /^(1|q|c|add|delete|agentes|codigos|ciclos?)$/i;
  const placeholderMessages = last30Days
    .filter((entry) => placeholderPattern.test(entry.subject.trim()) || /your commit message here|sua mensagem/i.test(entry.subject))
    .slice(0, 25);

  const rawEvidence = {
    metadata: {
      generatedAt: new Date().toISOString(),
      reportDate: dateOnly,
      slug,
      auditMode: "soberano",
      repoRoot: posixPath(repoRoot),
      headSha,
      branch,
      assumptions: {
        stage: "Produção inicial",
        vertical: "healthtech",
        deadlineWindowDays: 30,
        technicalTeam: "2-4 pessoas",
        evidencePolicy: "Regenerar tudo possível; tratar audit/artifacts prévios como contexto não decisório."
      }
    },
    repo: {
      trackedFiles: trackedFiles.length,
      coreTrackedFiles: fileIndex.filter((entry) => isWithinPrefixes(entry.path, corePrefixes)).length,
      runtimeFiles: fileIndex.filter((entry) => entry.kind === "runtime").length,
      testFiles: fileIndex.filter((entry) => entry.kind === "test").length,
      modules: unique(fileIndex.map((entry) => entry.moduleBucket)).length
    },
    files: fileIndex,
    complexity,
    schema,
    capabilities,
    git: {
      totalCommits: Number(safeRun("git", ["rev-list", "--count", "HEAD"]).stdout || 0),
      last30Days,
      deploymentFrequencyProxy: {
        windowDays: 30,
        mergeCommits: last30Days.filter((entry) => entry.subject.startsWith("Merge ")).length,
        activeDays: unique(last30Days.map((entry) => entry.date)).length,
        placeholderMessages
      }
    },
    staticFindings: {
      anyOccurrences,
      consoleOccurrences,
      envOccurrences,
      todoOccurrences,
      emptyCatchOccurrences,
      rawQueryUnsafeOccurrences,
      networkWithoutTimeout: filePredicates.networkWithoutTimeout,
      findManyWithoutPagination: filePredicates.findManyWithoutPagination,
      awaitInLoop: filePredicates.awaitInLoop,
      hardcodedWebStrings: filePredicates.hardcodedWebStrings,
      imageWithoutAlt: filePredicates.imageWithoutAlt,
      routeFallbacks,
      longFunctions,
      largeFiles,
      importCycles,
      coverageGaps,
      dockerFacts
    },
    evidenceArtifacts,
    supportingReferences: {
      canonicalScope: makeEvidenceRef(
        "docs/service-catalog.md",
        (await firstMatchingLine("docs/service-catalog.md", "Core canônico oficial")).line,
        "Escopo core canônico oficial."
      ),
      packageManifest: makeEvidenceRef(
        "package.json",
        1,
        "Manifest root do monorepo."
      ),
      releaseRunbook: makeEvidenceRef(
        "docs/release/2026-03-20-go-live-runbook.md",
        1,
        "Runbook de go-live versionado."
      ),
      schema: makeEvidenceRef(schema.path, schema.models[0]?.line ?? 1, "Schema Prisma principal.")
    }
  };

  await writeJson(rawPath, rawEvidence);
  console.log(relativePath(rawPath));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
