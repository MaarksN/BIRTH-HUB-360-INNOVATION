import { access, readFile } from "node:fs/promises";
import { createLogger } from "@birthub/logger";

const logger = createLogger("agent");
import path from "node:path";


import {
  BoardPrepAIContractSchema,
  type BoardPrepAIContract,
  type BoardPrepAIInput,
  BoardPrepAIInputSchema,
  type BoardPrepAIOutput,
  BoardPrepAIOutputSchema,
  type BoardPrepEvent,
  type BoardPrepFailureMode,
  type BoardPrepKpiInput,
  type BoardPrepMetrics,
  DEFAULT_BOARDPREPAI_CONTRACT
} from "./schemas.js";
import {
  BOARDPREPAI_TOOL_IDS,
  BoardPrepToolInputSchema,
  CRMBoardSnapshotSchema,
  createDefaultBoardPrepAIToolAdapters,
  ERPBoardSnapshotSchema,
  HRBoardSnapshotSchema,
  normalizeBoardPrepToolId,
  type BoardPrepAIToolAdapters,
  type BoardPrepToolId,
  type BoardPrepToolInput
} from "./tools.js";

const DEFAULT_AUDIT_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "audit",
  "pending_review",
  "ciclo1_boardprepai",
  "contract.yaml"
);
const DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "..",
  "..",
  "audit",
  "pending_review",
  "ciclo1_boardprepai",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "packages",
  "agent-packs",
  "executive-premium-v1",
  "source",
  "boardprep-ai",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "source",
  "boardprep-ai",
  "contract.yaml"
);
const DEFAULT_CONTRACT_PATHS = [
  DEFAULT_AUDIT_CONTRACT_PATH,
  DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE,
  DEFAULT_PACKAGE_CONTRACT_PATH,
  DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE
] as const;

interface BoardPrepAIAgentOptions {
  contractPath?: string;
  now?: () => Date;
  sleep?: (delayMs: number) => Promise<void>;
  toolAdapters?: BoardPrepAIToolAdapters;
}

interface LoadedContract {
  contract: BoardPrepAIContract;
  source: "audit_file" | "custom_file" | "default" | "file" | "package_file";
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
  );
  return items.length > 0 ? items : undefined;
}

function extractYamlArray(text: string, acceptedKeys: string[]): string[] | undefined {
  const lines = text.split(/\r?\n/);
  const normalizedKeys = new Set(acceptedKeys.map((entry) => entry.toLowerCase()));
  const items: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const keyMatch = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*$/);
    if (keyMatch?.[1]) {
      collecting = normalizedKeys.has(keyMatch[1].toLowerCase());
      continue;
    }
    if (!collecting) {
      continue;
    }
    const itemMatch = line.match(/^\s*-\s*(.+)\s*$/);
    if (!itemMatch?.[1]) {
      if (line.trim().length > 0 && !line.startsWith(" ")) {
        collecting = false;
      }
      continue;
    }
    items.push(
      itemMatch[1].trim().replace(/^['"]/, "").replace(/['"]$/, "")
    );
  }

  return items.length > 0 ? items : undefined;
}

function extractFirstNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) {
      continue;
    }
    const parsed = Number.parseInt(match[1], 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function clampMaxAttempts(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BOARDPREPAI_CONTRACT.retry.maxAttempts;
  }
  return Math.min(3, Math.max(1, Math.trunc(value)));
}

function toFailureMode(rawValue: string | undefined): BoardPrepFailureMode | undefined {
  if (!rawValue) {
    return undefined;
  }
  const normalized = rawValue.trim().toLowerCase();
  if (normalized.includes("degrad")) {
    return "degraded_report";
  }
  if (normalized.includes("human") || normalized.includes("manual")) {
    return "human_handoff";
  }
  if (normalized.includes("hard") || normalized.includes("fail")) {
    return "hard_fail";
  }
  return undefined;
}

function classifyContractSource(contractPath: string): LoadedContract["source"] {
  const normalized = path.normalize(contractPath).toLowerCase();
  if (
    normalized.endsWith(
      path
        .join("audit", "pending_review", "ciclo1_boardprepai", "contract.yaml")
        .toLowerCase()
    )
  ) {
    return "audit_file";
  }
  if (
    normalized.endsWith(path.join("source", "boardprep-ai", "contract.yaml").toLowerCase())
  ) {
    return "package_file";
  }
  return "custom_file";
}

function parseContractOverrides(rawText: string): Partial<BoardPrepAIContract> {
  const trimmed = rawText.trim();
  const overrides: Partial<BoardPrepAIContract> = {};

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        failureMode?: string;
        observability?: { events?: string[]; metrics?: string[] };
        retry?: { baseDelayMs?: number; maxAttempts?: number };
        toolIds?: string[];
      };
      if (typeof parsed.failureMode === "string") {
        const mapped = toFailureMode(parsed.failureMode);
        if (mapped) {
          overrides.failureMode = mapped;
        }
      }
      if (parsed.retry) {
        overrides.retry = {
          baseDelayMs:
            typeof parsed.retry.baseDelayMs === "number"
              ? parsed.retry.baseDelayMs
              : DEFAULT_BOARDPREPAI_CONTRACT.retry.baseDelayMs,
          maxAttempts:
            typeof parsed.retry.maxAttempts === "number"
              ? clampMaxAttempts(parsed.retry.maxAttempts)
              : DEFAULT_BOARDPREPAI_CONTRACT.retry.maxAttempts
        };
      }
      const toolIds = toStringArray(parsed.toolIds);
      if (toolIds) {
        overrides.toolIds = toolIds;
      }
      const events = toStringArray(parsed.observability?.events);
      const metrics = toStringArray(parsed.observability?.metrics);
      if (events || metrics) {
        overrides.observability = {
          events:
            events && events.length > 0
              ? (events as BoardPrepAIContract["observability"]["events"])
              : DEFAULT_BOARDPREPAI_CONTRACT.observability.events,
          metrics:
            metrics && metrics.length > 0
              ? (metrics as BoardPrepAIContract["observability"]["metrics"])
              : DEFAULT_BOARDPREPAI_CONTRACT.observability.metrics
        };
      }
      return overrides;
    } catch {
      // keep yaml-style parsing below
    }
  }

  const maxAttempts = extractFirstNumber(rawText, [
    /retry_attempts\s*:\s*(\d+)/i,
    /maxAttempts\s*:\s*(\d+)/i,
    /max_attempts\s*:\s*(\d+)/i
  ]);
  const baseDelayMs = extractFirstNumber(rawText, [
    /base_delay_ms\s*:\s*(\d+)/i,
    /baseDelayMs\s*:\s*(\d+)/i,
    /backoff_ms\s*:\s*(\d+)/i
  ]);
  if (maxAttempts !== undefined || baseDelayMs !== undefined) {
    overrides.retry = {
      ...DEFAULT_BOARDPREPAI_CONTRACT.retry,
      ...(maxAttempts !== undefined
        ? { maxAttempts: clampMaxAttempts(maxAttempts) }
        : {}),
      ...(baseDelayMs !== undefined ? { baseDelayMs } : {})
    };
  }

  const modeMatch = rawText.match(
    /(?:failureMode|failure_mode|failure_behavior|fallback|mode)\s*:\s*["']?([a-zA-Z_-]+)["']?/i
  );
  if (modeMatch?.[1]) {
    const mapped = toFailureMode(modeMatch[1]);
    if (mapped) {
      overrides.failureMode = mapped;
    }
  }

  const toolIds =
    extractYamlArray(rawText, ["toolIds", "tools", "required_tools"]) ??
    (() => {
      const inline = rawText.match(/(?:toolIds|tools)\s*:\s*\[([^\]]+)\]/i);
      if (!inline?.[1]) {
        return undefined;
      }
      return inline[1]
        .split(",")
        .map((entry) => entry.trim().replace(/^['"]/, "").replace(/['"]$/, ""))
        .filter((entry) => entry.length > 0);
    })();
  if (toolIds && toolIds.length > 0) {
    overrides.toolIds = toolIds;
  }

  return overrides;
}

function mergeContract(
  overrides: Partial<BoardPrepAIContract>,
  fallback: BoardPrepAIContract
): BoardPrepAIContract {
  return BoardPrepAIContractSchema.parse({
    ...fallback,
    ...overrides,
    observability: {
      ...fallback.observability,
      ...overrides.observability
    },
    retry: {
      ...fallback.retry,
      ...overrides.retry
    },
    toolIds: overrides.toolIds ?? fallback.toolIds
  });
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeMetricName(value: string): string {
  return value.trim().toLowerCase();
}

function severityRank(severity: "critical" | "high" | "low" | "medium"): number {
  if (severity === "critical") {
    return 0;
  }
  if (severity === "high") {
    return 1;
  }
  if (severity === "medium") {
    return 2;
  }
  return 3;
}

function toPriority(score: number): "critical" | "high" | "low" | "medium" {
  if (score >= 80) {
    return "critical";
  }
  if (score >= 60) {
    return "high";
  }
  if (score >= 35) {
    return "medium";
  }
  return "low";
}

function toConfidence(score: number): "high" | "low" | "medium" {
  if (score >= 75) {
    return "high";
  }
  if (score >= 45) {
    return "medium";
  }
  return "low";
}

function formatKpiValue(kpi: BoardPrepKpiInput, currency: string): string {
  if (kpi.value === null) {
    return "Dado ausente";
  }
  if (!kpi.unit) {
    return kpi.value.toFixed(2);
  }
  const unit = kpi.unit.trim().toLowerCase();
  if (unit === "%" || unit === "pct") {
    return `${kpi.value.toFixed(2)}%`;
  }
  if (unit === currency.trim().toLowerCase()) {
    return `${currency.toUpperCase()} ${kpi.value.toFixed(2)}`;
  }
  return `${kpi.value.toFixed(2)} ${kpi.unit}`;
}

function toMarkdownTable(columns: string[], rows: string[][]): string {
  const header = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [header, separator, body].filter((entry) => entry.length > 0).join("\n");
}

export class BoardPrepAIAgent {
  private readonly contractPaths: string[];

  private readonly now: () => Date;

  private readonly sleepFn: (delayMs: number) => Promise<void>;

  private readonly toolAdapters: BoardPrepAIToolAdapters;

  private lastMetrics: BoardPrepMetrics = {
    durationMs: 0,
    retries: 0,
    toolCalls: 0,
    toolFailures: 0
  };

  constructor(options: BoardPrepAIAgentOptions = {}) {
    this.contractPaths = options.contractPath
      ? [options.contractPath]
      : [...DEFAULT_CONTRACT_PATHS];
    this.now = options.now ?? (() => new Date());
    this.sleepFn = options.sleep ?? sleep;
    this.toolAdapters = options.toolAdapters ?? createDefaultBoardPrepAIToolAdapters();
  }

  getMetricsSnapshot(): BoardPrepMetrics {
    return {
      ...this.lastMetrics
    };
  }

  async run(input: BoardPrepAIInput): Promise<BoardPrepAIOutput> {
    const parsedInput = BoardPrepAIInputSchema.parse(input);
    const startedAt = this.now();
    const events: BoardPrepEvent[] = [];
    const metrics: BoardPrepMetrics = {
      durationMs: 0,
      retries: 0,
      toolCalls: 0,
      toolFailures: 0
    };
    const fallbackReasons: string[] = [];

    const emitEvent = (
      event: Omit<BoardPrepEvent, "timestamp"> & { timestamp?: string }
    ): void => {
      const normalized: BoardPrepEvent = {
        ...event,
        details: {
          ...event.details,
          requestId: event.details.requestId ?? parsedInput.requestId
        },
        timestamp: event.timestamp ?? this.now().toISOString()
      };
      events.push(normalized);
      const payload = {
        details: normalized.details,
        level: normalized.level,
        message: normalized.message,
        name: normalized.name,
        requestId: normalized.details.requestId
      };
      if (normalized.level === "error") {
        logger.error(payload, normalized.message);
      } else if (normalized.level === "warning") {
        logger.warn(payload, normalized.message);
      } else {
        logger.info(payload, normalized.message);
      }
    };

    emitEvent({
      details: {
        source: "request",
        toolId: "boardprepai"
      },
      level: "info",
      message: "BoardPrepAI request accepted.",
      name: "boardprepai.request.received"
    });

    const loadedContract = await this.loadContract();
    emitEvent({
      details: {
        source: loadedContract.source
      },
      level: "info",
      message: `Contract loaded from ${loadedContract.source}.`,
      name: "boardprepai.contract.loaded"
    });

    const mappedTools = this.resolveToolIds(loadedContract.contract.toolIds);
    const effectiveTools =
      mappedTools.length > 0 ? mappedTools : [...BOARDPREPAI_TOOL_IDS];

    const runWithRetry = async <T>(
      toolId: BoardPrepToolId,
      operation: () => Promise<T>
    ): Promise<T> => {
      const maxAttempts = loadedContract.contract.retry.maxAttempts;
      const baseDelayMs = loadedContract.contract.retry.baseDelayMs;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        emitEvent({
          details: {
            attempt,
            maxAttempts,
            toolId
          },
          level: "info",
          message: `Running ${toolId} (attempt ${attempt}/${maxAttempts}).`,
          name: "boardprepai.tool.call.started"
        });

        try {
          metrics.toolCalls += 1;
          const result = await operation();
          emitEvent({
            details: {
              attempt,
              toolId
            },
            level: "info",
            message: `${toolId} completed.`,
            name: "boardprepai.tool.call.succeeded"
          });
          return result;
        } catch (error) {
          const asError =
            error instanceof Error ? error : new Error("Unknown tool failure.");
          lastError = asError;
          emitEvent({
            details: {
              attempt,
              errorCode: asError.message,
              maxAttempts,
              toolId
            },
            level: "warning",
            message: `${toolId} failed at attempt ${attempt}.`,
            name: "boardprepai.tool.call.failed"
          });
          if (attempt >= maxAttempts) {
            break;
          }
          metrics.retries += 1;
          const delay = baseDelayMs * 2 ** (attempt - 1);
          emitEvent({
            details: {
              attempt,
              maxAttempts,
              toolId
            },
            level: "info",
            message: `${toolId} retry scheduled after ${delay}ms.`,
            name: "boardprepai.retry.scheduled"
          });
          await this.sleepFn(delay);
        }
      }

      metrics.toolFailures += 1;
      throw lastError ?? new Error(`${toolId} failed with no details.`);
    };

    const toolInput: BoardPrepToolInput = BoardPrepToolInputSchema.parse({
      endDate: parsedInput.dateRange.endDate,
      focusAreas: parsedInput.focusAreas,
      requiredMetrics: parsedInput.requiredMetrics,
      startDate: parsedInput.dateRange.startDate,
      tenantId: parsedInput.tenantId
    });

    let crmSnapshot = null;
    let erpSnapshot = null;
    let hrSnapshot = null;

    if (effectiveTools.includes("crm-board-feed")) {
      try {
        crmSnapshot = CRMBoardSnapshotSchema.parse(
          await runWithRetry("crm-board-feed", () =>
            this.toolAdapters.fetchCRMBoardSnapshot(toolInput)
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "crm-board-feed failed.";
        fallbackReasons.push(`crm-board-feed: ${message}`);
      }
    }

    if (effectiveTools.includes("erp-board-feed")) {
      try {
        erpSnapshot = ERPBoardSnapshotSchema.parse(
          await runWithRetry("erp-board-feed", () =>
            this.toolAdapters.fetchERPBoardSnapshot(toolInput)
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "erp-board-feed failed.";
        fallbackReasons.push(`erp-board-feed: ${message}`);
      }
    }

    if (effectiveTools.includes("hr-board-feed")) {
      try {
        hrSnapshot = HRBoardSnapshotSchema.parse(
          await runWithRetry("hr-board-feed", () =>
            this.toolAdapters.fetchHRBoardSnapshot(toolInput)
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "hr-board-feed failed.";
        fallbackReasons.push(`hr-board-feed: ${message}`);
      }
    }

    const safeCRM = crmSnapshot ?? {
      customerRiskTheme: "customer risk signal unavailable",
      decisionPressurePct: 0,
      pipelineHealthPct: 0
    };
    const safeERP = erpSnapshot ?? {
      cashVariancePct: 0,
      financeCompletenessPct: 0,
      toplineMomentumPct: 0
    };
    const safeHR = hrSnapshot ?? {
      cultureRiskTheme: "people risk signal unavailable",
      execAlignmentPct: 0,
      peopleStabilityPct: 0
    };

    const providedMetricNames = new Set(
      parsedInput.kpis
        .filter((kpi) => kpi.value !== null)
        .map((kpi) => normalizeMetricName(kpi.name))
    );
    const missingMetrics = parsedInput.requiredMetrics.filter(
      (metric) => !providedMetricNames.has(normalizeMetricName(metric))
    );
    const unconfirmedKpis = parsedInput.kpis.filter((kpi) => !kpi.confirmed);
    const unconfirmedRisks = parsedInput.risks.filter((risk) => !risk.confirmed);
    const unconfirmedDecisions = parsedInput.decisionsPending.filter(
      (decision) => !decision.confirmed
    );

    const informationGaps = [
      ...missingMetrics.map(
        (metric) => `Metric "${metric}" is required but missing from the consolidated payload.`
      ),
      ...unconfirmedKpis.map(
        (kpi) => `Metric "${kpi.name}" is present but still marked as unconfirmed.`
      ),
      ...unconfirmedRisks.map(
        (risk) => `Risk "${risk.title}" still requires confirmation before final board escalation.`
      ),
      ...unconfirmedDecisions.map(
        (decision) => `Decision "${decision.topic}" still requires confirmation before board distribution.`
      )
    ];

    const metricCoveragePct =
      parsedInput.requiredMetrics.length > 0
        ? ((parsedInput.requiredMetrics.length - missingMetrics.length) /
            parsedInput.requiredMetrics.length) *
          100
        : 100;
    const riskPenalty = Math.min(
      30,
      parsedInput.risks.reduce((total, risk) => {
        if (risk.severity === "critical") {
          return total + 8;
        }
        if (risk.severity === "high") {
          return total + 5;
        }
        if (risk.severity === "medium") {
          return total + 3;
        }
        return total + 1;
      }, 0)
    );
    const informationGapPenalty = Math.min(25, informationGaps.length * 5);
    const readinessScorePct = Math.max(
      0,
      Math.min(
        100,
        Number(
          (
            metricCoveragePct * 0.45 +
            safeERP.financeCompletenessPct * 0.2 +
            safeCRM.pipelineHealthPct * 0.1 +
            safeHR.execAlignmentPct * 0.1 +
            safeHR.peopleStabilityPct * 0.1 +
            (100 - Math.abs(safeERP.cashVariancePct)) * 0.05 -
            riskPenalty -
            informationGapPenalty
          ).toFixed(2)
        )
      )
    );

    const sortedRisks = [...parsedInput.risks].sort((left, right) => {
      const severityDelta = severityRank(left.severity) - severityRank(right.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }
      return left.title.localeCompare(right.title);
    });
    const topRisk = sortedRisks[0];

    if (informationGaps.length > 0) {
      fallbackReasons.push(...informationGaps);
    }

    const fallbackApplied = fallbackReasons.length > 0;
    const fallbackMode: BoardPrepFailureMode | null = fallbackApplied
      ? informationGaps.length > 0
        ? "human_handoff"
        : loadedContract.contract.failureMode
      : null;

    if (fallbackApplied) {
      emitEvent({
        details: {
          fallbackMode: fallbackMode ?? undefined,
          source: "failure_behavior"
        },
        level: "warning",
        message: "Fallback behavior applied for BoardPrepAI output.",
        name: "boardprepai.fallback.applied"
      });
    }

    const kpisChave = parsedInput.kpis.map((kpi) => ({
      confidence:
        kpi.value === null ? "low" : kpi.confirmed ? "high" : "medium",
      interpretation:
        kpi.value === null
          ? "Required board metric is missing and must be completed manually."
          : !kpi.confirmed
            ? "Metric is available but still awaiting source confirmation."
            : parsedInput.requiredMetrics
                  .map((metric) => normalizeMetricName(metric))
                  .includes(normalizeMetricName(kpi.name))
              ? "Required metric confirmed for board discussion."
              : "Supporting metric consolidated for executive context.",
      metric: kpi.name,
      status:
        kpi.value === null ? "missing" : kpi.confirmed ? "confirmed" : "estimated",
      valueLabel: formatKpiValue(kpi, parsedInput.constraints.currency)
    }));

    const riscos = sortedRisks.map((risk) => ({
      mitigation:
        risk.mitigation ??
        "Assign an executive owner and confirm the mitigation path before board distribution.",
      rationale: risk.confirmed
        ? risk.impact
        : `${risk.impact} Confirmation is still required before final escalation.`,
      severity: risk.severity,
      title: risk.title
    }));

    const decisoesRequeridas = parsedInput.decisionsPending
      .slice()
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
      .map((decision) => ({
        action: decision.decision,
        owner: decision.owner ?? "CEO",
        priority: toPriority(
          70 +
            Math.max(
              0,
              30 -
                Math.abs(new Date(decision.dueDate).getTime() - startedAt.getTime()) /
                  86_400_000
            )
        ),
        status: decision.confirmed ? "confirmed" : "needs_confirmation",
        targetDate: decision.dueDate,
        topic: decision.topic
      }));

    const recommendationCandidates = [];
    if (missingMetrics.length > 0) {
      recommendationCandidates.push({
        owner: "Chief of Staff",
        priority: "critical",
        recommendation:
          "Complete the missing required metrics and reconcile source discrepancies before final board circulation.",
        targetDate: addDays(parsedInput.dateRange.endDate, 1)
      });
    }
    if (topRisk) {
      recommendationCandidates.push({
        owner: topRisk.owner ?? "Executive Sponsor",
        priority: topRisk.severity,
        recommendation: `Prepare a concise mitigation update for the board on "${topRisk.title}".`,
        targetDate: addDays(parsedInput.dateRange.endDate, 2)
      });
    }
    if (parsedInput.decisionsPending.length > 0) {
      recommendationCandidates.push({
        owner: parsedInput.decisionsPending[0]?.owner ?? "CEO",
        priority: "high",
        recommendation:
          "Separate decisions that need board approval from informational updates in the final board packet.",
        targetDate: addDays(parsedInput.dateRange.endDate, 2)
      });
    }
    recommendationCandidates.push({
      owner: "CFO",
      priority: toPriority(
        safeERP.financeCompletenessPct + (100 - Math.abs(safeERP.cashVariancePct))
      ),
      recommendation:
        "Add a one-slide financial confidence statement that explains completeness, variance, and any reconciliation still underway.",
      targetDate: addDays(parsedInput.dateRange.endDate, 3)
    });

    const recomendacoes = recommendationCandidates.slice(
      0,
      parsedInput.constraints.maxActions
    );
    const resumoExecutivo = [
      `Board preparation for ${parsedInput.dateRange.label} has estimated readiness of ${readinessScorePct.toFixed(
        2
      )}%.`,
      missingMetrics.length > 0
        ? `There are ${missingMetrics.length} required metrics still missing from the packet.`
        : "All required metrics were supplied in the request payload.",
      topRisk
        ? `The leading risk for the current board agenda is "${topRisk.title}" with ${topRisk.severity} severity.`
        : "No critical confirmed risk was provided in the current board context.",
      `Commercial signal: ${safeCRM.customerRiskTheme}.`,
      `People signal: ${safeHR.cultureRiskTheme}.`
    ].join(" ");

    const kpiRows = kpisChave.map((kpi) => [
      kpi.metric,
      kpi.valueLabel,
      kpi.status,
      kpi.confidence
    ]);
    const riskRows = riscos.map((risk) => [
      risk.title,
      risk.severity,
      risk.mitigation
    ]);
    const decisionRows = decisoesRequeridas.map((decision) => [
      decision.topic,
      decision.owner,
      decision.targetDate,
      decision.status
    ]);
    const dataTables = [
      {
        columns: ["Metric", "Value", "Status", "Confidence"],
        rows: kpiRows,
        title: "Key KPIs"
      },
      {
        columns: ["Risk", "Severity", "Mitigation"],
        rows: riskRows,
        title: "Risk Register"
      },
      {
        columns: ["Decision", "Owner", "Target Date", "Status"],
        rows: decisionRows,
        title: "Required Decisions"
      }
    ];
    const primaryKpiTable = dataTables[0] ?? {
      columns: ["Metric", "Value", "Status", "Confidence"],
      rows: [["No KPI data", "n/a", "n/a", "low"]],
      title: "Key KPIs"
    };

    const summaryReport = [
      `# Board Prep - ${parsedInput.dateRange.label}`,
      "",
      "## 1. Resumo Executivo",
      resumoExecutivo,
      "",
      "## 2. KPIs Chave",
      toMarkdownTable(primaryKpiTable.columns, primaryKpiTable.rows),
      "",
      "## 3. Riscos",
      riscos.length > 0
        ? riscos
            .map(
              (risk) =>
                `- [${risk.severity}] ${risk.title}: ${risk.rationale} Mitigation: ${risk.mitigation}`
            )
            .join("\n")
        : "- No material risks were provided.",
      "",
      "## 4. Decisoes Requeridas",
      decisoesRequeridas.length > 0
        ? decisoesRequeridas
            .map(
              (decision) =>
                `- ${decision.topic}: ${decision.action} (owner: ${decision.owner}, due: ${decision.targetDate})`
            )
            .join("\n")
        : "- No pending board decisions were provided.",
      "",
      "## 5. Recomendacoes",
      recomendacoes
        .map(
          (recommendation) =>
            `- [${recommendation.priority}] ${recommendation.recommendation} (owner: ${recommendation.owner})`
        )
        .join("\n"),
      "",
      "## 6. Lacunas de Informacao",
      informationGaps.length > 0
        ? informationGaps.map((gap) => `- ${gap}`).join("\n")
        : "- No critical information gaps identified."
    ].join("\n");

    const headline =
      informationGaps.length > 0
        ? `Board material prepared with ${informationGaps.length} information gaps still requiring manual follow-up.`
        : topRisk
          ? `Board material ready with primary emphasis on ${topRisk.title}.`
          : "Board material ready with consolidated executive context and no critical gaps.";
    const presentationOutline = [
      `Slide 1: Executive summary and scope for ${parsedInput.dateRange.label}`,
      `Slide 2: Required KPIs and gaps (${missingMetrics.length})`,
      `Slide 3: Risk review${topRisk ? ` - ${topRisk.title}` : ""}`,
      "Slide 4: Decisions required from the board",
      "Slide 5: Recommendations and next steps"
    ];

    const status: BoardPrepAIOutput["status"] =
      fallbackApplied && fallbackMode === "hard_fail"
        ? "error"
        : fallbackApplied
          ? "fallback"
          : "success";

    metrics.durationMs = Math.max(0, this.now().getTime() - startedAt.getTime());
    emitEvent({
      details: {
        source: "response"
      },
      level: status === "error" ? "error" : "info",
      message: "BoardPrepAI response generated.",
      name: "boardprepai.response.generated"
    });

    const output = BoardPrepAIOutputSchema.parse({
      agent: "BoardPrepAI",
      boardBrief: {
        data_tables: dataTables,
        decisoes_requeridas: decisoesRequeridas,
        headline,
        kpis_chave: kpisChave,
        lacunas_de_informacao: informationGaps,
        presentation_outline: presentationOutline,
        readinessScorePct,
        recomendacoes,
        resumo_executivo: resumoExecutivo,
        riscos,
        summary_report: summaryReport
      },
      domain: "executivos",
      fallback: {
        applied: fallbackApplied,
        mode: fallbackMode,
        reasons: fallbackReasons
      },
      generatedAt: this.now().toISOString(),
      observability: {
        events,
        metrics
      },
      status,
      summary: fallbackApplied
        ? "BoardPrepAI generated under fallback mode due to missing information or tool failures."
        : "BoardPrepAI generated with consolidated board briefing coverage."
    });

    this.lastMetrics = {
      ...output.observability.metrics
    };
    return output;
  }

  private resolveToolIds(toolIds: string[]): BoardPrepToolId[] {
    const mapped = toolIds
      .map((toolId) => normalizeBoardPrepToolId(toolId))
      .filter((toolId): toolId is BoardPrepToolId => toolId !== null);
    return Array.from(new Set(mapped));
  }

  private async loadContract(): Promise<LoadedContract> {
    for (const contractPath of this.contractPaths) {
      try {
        await access(contractPath);
      } catch {
        continue;
      }

      try {
        const content = await readFile(contractPath, "utf8");
        const merged = mergeContract(
          parseContractOverrides(content),
          DEFAULT_BOARDPREPAI_CONTRACT
        );
        return {
          contract: merged,
          source: classifyContractSource(contractPath)
        };
      } catch {
        continue;
      }
    }

    return {
      contract: DEFAULT_BOARDPREPAI_CONTRACT,
      source: "default"
    };
  }
}
