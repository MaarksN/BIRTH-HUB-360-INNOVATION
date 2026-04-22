import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const agentsRoot = path.join(repoRoot, "packages", "agents", "executivos");
const outputPath = path.join(
  repoRoot,
  "artifacts",
  "agent-governance",
  "executive-agents-governance.json"
);

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function slugToConstBase(slug) {
  return slug.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function findLineNumber(text, matcher) {
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (typeof matcher === "string" ? line.includes(matcher) : matcher.test(line)) {
      return index + 1;
    }
  }
  return null;
}

function evidence(relativeFile, line) {
  return {
    file: relativeFile,
    ...(line ? { line } : {})
  };
}

function pushRisk(risks, risk) {
  if (risks.some((item) => item.id === risk.id)) {
    return;
  }
  risks.push(risk);
}

function scoreAgent(checks, riskCount) {
  let score = 100;
  if (checks.hasTsNoCheckAgent) {
    score -= 18;
  }
  if (checks.hasTsNoCheckSchema) {
    score -= 10;
  }
  if (checks.hasTsNoCheckTools) {
    score -= 10;
  }
  if (checks.hasRequestIdInSchema && !checks.usesRequestIdInRuntime) {
    score -= 15;
  }
  if (checks.contractAliasMismatch) {
    score -= 10;
  }
  if (checks.toolConstMismatch) {
    score -= 10;
  }
  if (checks.runtimeEnforcementGap) {
    score -= 12;
  }
  if (checks.usesConsoleLogging) {
    score -= 8;
  }
  if (!checks.hasUnitTests) {
    score -= 10;
  }
  if (!checks.hasSchemaTests) {
    score -= 5;
  }
  if (!checks.hasRetryBudget || !checks.hasFallbackHandling) {
    score -= 15;
  }
  if (!checks.hasStructuredObservability) {
    score -= 10;
  }
  score -= Math.max(0, riskCount - 3) * 2;
  return Math.max(0, Math.min(100, score));
}

function classifyMaturity(checks, riskCount) {
  if (
    !checks.hasRetryBudget ||
    !checks.hasFallbackHandling ||
    !checks.hasStructuredObservability ||
    !checks.hasUnitTests ||
    riskCount >= 6
  ) {
    return "frágil";
  }

  const seriousGaps = [
    checks.hasTsNoCheckAgent || checks.hasTsNoCheckSchema || checks.hasTsNoCheckTools,
    checks.hasRequestIdInSchema && !checks.usesRequestIdInRuntime,
    checks.contractAliasMismatch,
    checks.toolConstMismatch,
    checks.runtimeEnforcementGap,
    checks.usesConsoleLogging
  ].filter(Boolean).length;

  if (seriousGaps >= 3) {
    return "estrutural";
  }
  if (seriousGaps >= 1) {
    return "parcial";
  }
  return "operacional";
}

async function loadText(filePath) {
  return readFile(filePath, "utf8");
}

async function auditAgent(agentDir) {
  const agentId = agentDir.name;
  const baseConst = slugToConstBase(agentId);
  const expectedDefaultContract = `DEFAULT_${baseConst}_CONTRACT`;
  const expectedToolIds = `${baseConst}_TOOL_IDS`;
  const relativeBasePath = toPosixPath(path.relative(repoRoot, agentDir.fullPath));

  const files = {
    agent: path.join(agentDir.fullPath, "agent.ts"),
    contract: path.join(agentDir.fullPath, "contract.yaml"),
    schema: path.join(agentDir.fullPath, "schemas.ts"),
    tools: path.join(agentDir.fullPath, "tools.ts"),
    unitTest: path.join(agentDir.fullPath, "tests", "test_unit.ts"),
    schemaTest: path.join(agentDir.fullPath, "tests", "test_schema.ts")
  };

  const [agentContent, contractContent, schemaContent, toolsContent] = await Promise.all([
    loadText(files.agent),
    loadText(files.contract),
    loadText(files.schema),
    loadText(files.tools)
  ]);

  const hasUnitTests = await readFile(files.unitTest, "utf8")
    .then(() => true)
    .catch(() => false);
  const hasSchemaTests = await readFile(files.schemaTest, "utf8")
    .then(() => true)
    .catch(() => false);

  const schemaDefaultExportMatch = schemaContent.match(
    /export const (DEFAULT_[A-Z0-9_]+_CONTRACT)\s*=\s*\{/
  );
  const schemaDefaultAliasMatch = schemaContent.match(
    /export const (DEFAULT_[A-Z0-9_]+_CONTRACT)\s*=\s*(DEFAULT_[A-Z0-9_]+_CONTRACT);/
  );
  const toolConstMatch = toolsContent.match(/export const ([A-Z0-9_]+_TOOL_IDS)\s*=\s*\[/);
  const importedDefaultContractMatch = agentContent.match(
    /\b(DEFAULT_[A-Z0-9_]+_CONTRACT)\b/
  );
  const importedToolIdsMatch = agentContent.match(/\b([A-Z0-9_]+_TOOL_IDS)\b/);

  const checks = {
    contractAliasMismatch:
      schemaDefaultAliasMatch?.[1] !== undefined ||
      (schemaDefaultExportMatch?.[1] && schemaDefaultExportMatch[1] !== expectedDefaultContract),
    declaresRuntimeEnforcement: contractContent.includes("runtime_enforcement"),
    enforcesRuntimeGovernance:
      /\bruntime_enforcement\b|\bruntimeEnforcement\b|\bruntime_cycle\b|\bruntimeCycle\b/.test(
        agentContent
      ),
    hasContractLoader:
      agentContent.includes("loadContract(") && agentContent.includes("classifyContractSource("),
    hasFallbackHandling:
      agentContent.includes("fallbackReasons") && schemaContent.includes("hard_fail"),
    hasInputSchema:
      contractContent.includes("input_schema:") && schemaContent.includes("InputSchema"),
    hasOutputFallbackContract:
      contractContent.includes("fallback:") && schemaContent.includes("fallback:"),
    hasOutputSchema:
      contractContent.includes("output_schema:") && schemaContent.includes("OutputSchema"),
    hasRequestIdInSchema: schemaContent.includes("requestId:"),
    hasRetryBudget:
      contractContent.includes("retry:") &&
      agentContent.includes("runWithRetry") &&
      schemaContent.includes("maxAttempts"),
    hasSchemaTests,
    hasStructuredObservability:
      schemaContent.includes("observability") && agentContent.includes("events.push(normalized)"),
    hasTsNoCheckAgent: agentContent.startsWith("// @ts-nocheck"),
    hasTsNoCheckSchema: schemaContent.startsWith("// @ts-nocheck"),
    hasTsNoCheckTools: toolsContent.startsWith("// @ts-nocheck"),
    hasUnitTests,
    runtimeEnforcementGap:
      contractContent.includes("runtime_enforcement") &&
      !/\bruntime_enforcement\b|\bruntimeEnforcement\b|\bruntime_cycle\b|\bruntimeCycle\b/.test(
        agentContent
      ),
    toolConstMismatch:
      toolConstMatch?.[1] !== undefined && toolConstMatch[1] !== expectedToolIds,
    usesConsoleLogging: /console\.(error|log|warn)\(/.test(agentContent),
    usesRequestIdInRuntime: /\brequestId\b/.test(agentContent),
    validatesToolInputsAndOutputs:
      (agentContent.match(/Schema\.parse\(/g) ?? []).length >= 4 &&
      toolsContent.includes("Schema.parse("),
    importedDefaultContract:
      importedDefaultContractMatch?.[1] ?? schemaDefaultExportMatch?.[1] ?? null,
    importedToolIds: importedToolIdsMatch?.[1] ?? toolConstMatch?.[1] ?? null
  };

  const risks = [];

  if (checks.hasTsNoCheckAgent || checks.hasTsNoCheckSchema || checks.hasTsNoCheckTools) {
    pushRisk(risks, {
      evidence: [
        ...(checks.hasTsNoCheckAgent
          ? [
              evidence(
                `${relativeBasePath}/agent.ts`,
                findLineNumber(agentContent, "// @ts-nocheck")
              )
            ]
          : []),
        ...(checks.hasTsNoCheckSchema
          ? [
              evidence(
                `${relativeBasePath}/schemas.ts`,
                findLineNumber(schemaContent, "// @ts-nocheck")
              )
            ]
          : []),
        ...(checks.hasTsNoCheckTools
          ? [
              evidence(
                `${relativeBasePath}/tools.ts`,
                findLineNumber(toolsContent, "// @ts-nocheck")
              )
            ]
          : [])
      ],
      id: "typed-surface-suppressed",
      severity: "high",
      title: "Superfície crítica ainda protegida por @ts-nocheck."
    });
  }

  if (checks.hasRequestIdInSchema && !checks.usesRequestIdInRuntime) {
    pushRisk(risks, {
      evidence: [
        evidence(
          `${relativeBasePath}/schemas.ts`,
          findLineNumber(schemaContent, "requestId:")
        ),
        evidence(`${relativeBasePath}/agent.ts`, 1)
      ],
      id: "request-id-not-propagated",
      severity: "high",
      title:
        "Contrato exige requestId, mas o runtime nao o propaga para eventos nem lineage operacional."
    });
  }

  if (checks.contractAliasMismatch) {
    pushRisk(risks, {
      evidence: [
        evidence(
          `${relativeBasePath}/schemas.ts`,
          findLineNumber(schemaContent, /DEFAULT_[A-Z0-9_]+_CONTRACT/)
        ),
        evidence(
          `${relativeBasePath}/agent.ts`,
          findLineNumber(agentContent, /DEFAULT_[A-Z0-9_]+_CONTRACT/)
        )
      ],
      id: "foreign-contract-alias",
      severity: "critical",
      title:
        "Identidade de contrato do agente esta contaminada por alias/copypaste de outro agente."
    });
  }

  if (checks.toolConstMismatch) {
    pushRisk(risks, {
      evidence: [
        evidence(
          `${relativeBasePath}/tools.ts`,
          findLineNumber(toolsContent, /_TOOL_IDS/)
        ),
        evidence(
          `${relativeBasePath}/agent.ts`,
          findLineNumber(agentContent, /_TOOL_IDS/)
        )
      ],
      id: "foreign-tool-constant",
      severity: "high",
      title:
        "Conjunto de tools exportado/importado usa naming herdado de outro agente e enfraquece auditabilidade."
    });
  }

  if (checks.runtimeEnforcementGap) {
    pushRisk(risks, {
      evidence: [
        evidence(
          `${relativeBasePath}/contract.yaml`,
          findLineNumber(contractContent, "runtime_enforcement")
        ),
        evidence(`${relativeBasePath}/agent.ts`, 1)
      ],
      id: "declared-runtime-governance-not-enforced",
      severity: "high",
      title:
        "O contrato declara runtime_enforcement/runtime_cycle, mas o runtime nao aplica essa governanca."
    });
  }

  if (checks.usesConsoleLogging) {
    pushRisk(risks, {
      evidence: [
        evidence(
          `${relativeBasePath}/agent.ts`,
          findLineNumber(agentContent, /console\.(error|log|warn)\(/)
        )
      ],
      id: "console-based-observability",
      severity: "medium",
      title:
        "Observabilidade depende de console.* local, sem sink estruturado, correlacao ou roteamento operacional."
    });
  }

  if (!checks.hasSchemaTests) {
    pushRisk(risks, {
      evidence: [evidence(`${relativeBasePath}/tests/test_schema.ts`)],
      id: "schema-test-missing",
      severity: "medium",
      title: "Nao ha teste de schema dedicado para defender o contrato publico do agente."
    });
  }

  if (!checks.hasUnitTests) {
    pushRisk(risks, {
      evidence: [evidence(`${relativeBasePath}/tests/test_unit.ts`)],
      id: "unit-test-missing",
      severity: "high",
      title: "Nao ha teste unitario dedicado cobrindo fallback, output e comportamento de runtime."
    });
  }

  const score = scoreAgent(checks, risks.length);
  const maturity = classifyMaturity(checks, risks.length);

  return {
    agentId,
    checks,
    expectedDefaultContract,
    expectedToolIds,
    importedDefaultContract: checks.importedDefaultContract,
    importedToolIds: checks.importedToolIds,
    maturity,
    path: relativeBasePath,
    riskCount: risks.length,
    risks,
    score
  };
}

const agentDirs = (await readdir(agentsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    fullPath: path.join(agentsRoot, entry.name),
    name: entry.name
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const agents = [];
for (const agentDir of agentDirs) {
  agents.push(await auditAgent(agentDir));
}

const maturityCounts = agents.reduce(
  (accumulator, agent) => {
    accumulator[agent.maturity] = (accumulator[agent.maturity] ?? 0) + 1;
    return accumulator;
  },
  {
    estrutural: 0,
    frágil: 0,
    operacional: 0,
    parcial: 0
  }
);

const aggregatedRisks = new Map();
for (const agent of agents) {
  for (const risk of agent.risks) {
    const current = aggregatedRisks.get(risk.id) ?? {
      affectedAgents: [],
      id: risk.id,
      severity: risk.severity,
      title: risk.title
    };
    current.affectedAgents.push(agent.agentId);
    aggregatedRisks.set(risk.id, current);
  }
}

const severityRank = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const topRisks = Array.from(aggregatedRisks.values())
  .sort((left, right) => {
    const severityDelta =
      severityRank[left.severity] - severityRank[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return right.affectedAgents.length - left.affectedAgents.length;
  })
  .slice(0, 10);

const report = {
  generatedAt: new Date().toISOString(),
  source: "scripts/audit/executive-agents-governance.mjs",
  summary: {
    agentCount: agents.length,
    maturityCounts,
    topRisks
  },
  agents
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      agentCount: report.summary.agentCount,
      maturityCounts: report.summary.maturityCounts,
      outputPath: toPosixPath(path.relative(repoRoot, outputPath))
    },
    null,
    2
  )
);
