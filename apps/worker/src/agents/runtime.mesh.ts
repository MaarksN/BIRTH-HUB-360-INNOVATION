import { isInstallableManifest, searchManifestCatalog, type ManifestCatalogEntry } from "@birthub/agents-core";
import type { SegmentProfile } from "@birthub/agents-core";

export const AGENT_MESH_ORCHESTRATOR_ID = "agent-mesh-orchestrator-pack";

export interface AgentMeshLineupEntry {
  agentId: string;
  domain: string;
  name: string;
  reason: string;
  score: number;
  useCase: string;
}

export interface AgentMeshWorkflowStep {
  agentId: string;
  expectedOutcome: string;
  order: number;
  reason: string;
}

export interface AgentMeshExecutionBlueprint {
  approvalRecommendation: {
    reason: string;
    required: boolean;
  };
  focusDomains: string[];
  handoffPackages: Array<{
    payloadFocus: string;
    reason: string;
    target: string;
  }>;
  specialistLineup: AgentMeshLineupEntry[];
  workflowPlan: AgentMeshWorkflowStep[];
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(value);
  }

  return result;
}

function inferFocusDomains(input: {
  objective: string;
  segmentProfile: SegmentProfile;
  textSignals: string[];
}): string[] {
  const corpus = `${input.objective} ${input.textSignals.join(" ")} ${input.segmentProfile.industry} ${input.segmentProfile.clientSegment}`.toLowerCase();
  const domains: string[] = [];

  const pushIf = (condition: boolean, domain: string) => {
    if (condition) {
      domains.push(domain);
    }
  };

  pushIf(/revenue|deal|pipeline|quota|renewal|account|lead|close|prospect/.test(corpus), "sales");
  pushIf(/campaign|brand|channel|seo|content|cac|roas|paid/.test(corpus), "marketing");
  pushIf(/cash|margin|pricing|invoice|billing|budget|burn|finance/.test(corpus), "finance");
  pushIf(/support|success|churn|health|onboarding|ticket|nps|qbr/.test(corpus), "customer-success");
  pushIf(/compliance|aml|kyc|fraud|policy|audit|regulatory/.test(corpus), "compliance");
  pushIf(/risk|workflow|handoff|capacity|bottleneck|process|ops|incident/.test(corpus), "operations");
  pushIf(/incident|security|breach|outage|patch|sev[ -]?1|sev[ -]?2/.test(corpus), "security");
  pushIf(/board|executive|ceo|cfo|cro|cmo|strategy/.test(corpus), "management");
  pushIf(/product|feature|journey|activation|roadmap/.test(corpus), "product");
  pushIf(/data|analytics|sql|cohort|forecast|attribution/.test(corpus), "analytics");

  if (/new lead|lead created|inbound lead|outbound lead/.test(corpus)) {
    domains.push("sales", "marketing", "operations");
  }

  if (/critical ticket|urgent ticket|priority 1|sev[ -]?1|support escalation/.test(corpus)) {
    domains.push("customer-success", "operations", "management");
  }

  if (/renewal at risk|renewal risk|churn risk|renewal escalation/.test(corpus)) {
    domains.push("customer-success", "sales", "finance");
  }

  if (/operational incident|incident opened|major incident|service outage/.test(corpus)) {
    domains.push("operations", "security", "management");
  }

  if (domains.length === 0) {
    domains.push("operations");
  }

  return uniqueStrings(domains).slice(0, 4);
}

function buildReason(entry: ManifestCatalogEntry, domain: string, segmentProfile: SegmentProfile): string {
  const industryMatch = entry.manifest.tags.industry.includes(segmentProfile.industry);
  const domainMatch = entry.manifest.tags.domain.includes(domain);

  if (industryMatch && domainMatch) {
    return `Alta aderencia ao dominio ${domain} e ao segmento ${segmentProfile.industry}.`;
  }

  if (domainMatch) {
    return `Especialista relevante para o dominio ${domain} com boa cobertura operacional.`;
  }

  if (industryMatch) {
    return `Especialista com linguagem aderente ao setor ${segmentProfile.industry}.`;
  }

  return "Especialista util para complementar o fluxo multiagente com governanca.";
}

function buildWorkflowPlan(lineup: AgentMeshLineupEntry[], objective: string): AgentMeshWorkflowStep[] {
  return lineup.slice(0, 4).map((entry, index) => ({
    agentId: entry.agentId,
    expectedOutcome:
      index === 0
        ? `Diagnosticar ${objective} e produzir contexto inicial acionavel.`
        : `Avancar ${objective} no dominio ${entry.domain} com entrega especializada.`,
    order: index + 1,
    reason: entry.reason
  }));
}

function buildApprovalRecommendation(lineup: AgentMeshLineupEntry[], objective: string) {
  const corpus = objective.toLowerCase();
  const requiresApprovalByKeyword =
    /(approval|approve|contrato|contract|refund|refunds|payment|pagamento|policy exception|exception)/.test(
      corpus
    );
  const requiresApprovalByDomain = lineup.some((entry) =>
    ["finance", "compliance", "management", "legal"].includes(entry.domain)
  );

  return {
    reason:
      requiresApprovalByKeyword || requiresApprovalByDomain
        ? "O fluxo toca dominios sensiveis ou decisoes com potencial impacto financeiro, regulatorio ou executivo."
        : "O fluxo parece operacional e pode seguir sem aprovacao adicional imediata.",
    required: requiresApprovalByKeyword || requiresApprovalByDomain
  };
}

function findDomainMatches(input: {
  catalog: ManifestCatalogEntry[];
  domain: string;
  objective: string;
  segmentProfile: SegmentProfile;
  textSignals: string[];
}): Array<ManifestCatalogEntry & { score: number }> {
  const queries = uniqueStrings([
    `${input.domain} ${input.segmentProfile.industry}`,
    input.textSignals[0] ?? "",
    input.objective,
    input.domain,
    input.segmentProfile.industry
  ]);

  for (const query of queries) {
    const results = searchManifestCatalog(input.catalog, {
      filters: {
        domains: [input.domain],
        industries: [input.segmentProfile.industry, "cross-industry", "sales", "saas"]
      },
      page: 1,
      pageSize: 4,
      query
    }).results;

    if (results.length > 0) {
      return results;
    }
  }

  return input.catalog
    .filter(
      (entry) =>
        isInstallableManifest(entry.manifest) &&
        entry.manifest.tags.domain.includes(input.domain) &&
        [input.segmentProfile.industry, "cross-industry", "sales", "saas"].some((industry) =>
          entry.manifest.tags.industry.includes(industry)
        )
    )
    .map((entry, index) => ({
      ...entry,
      score: Math.max(1, 10 - index)
    }))
    .slice(0, 4);
}

export function buildAgentMeshExecutionBlueprint(input: {
  catalog: ManifestCatalogEntry[];
  objective: string;
  segmentProfile: SegmentProfile;
  textSignals: string[];
}): AgentMeshExecutionBlueprint {
  const focusDomains = inferFocusDomains({
    objective: input.objective,
    segmentProfile: input.segmentProfile,
    textSignals: input.textSignals
  });
  const shortlist = new Map<string, AgentMeshLineupEntry>();

  for (const domain of focusDomains) {
    const results = findDomainMatches({
      catalog: input.catalog,
      domain,
      objective: input.objective,
      segmentProfile: input.segmentProfile,
      textSignals: input.textSignals
    });

    for (const result of results) {
      if (!isInstallableManifest(result.manifest)) {
        continue;
      }

      if ([AGENT_MESH_ORCHESTRATOR_ID, "corporate-v1-catalog"].includes(result.manifest.agent.id)) {
        continue;
      }

      if (!shortlist.has(result.manifest.agent.id)) {
        shortlist.set(result.manifest.agent.id, {
          agentId: result.manifest.agent.id,
          domain: result.manifest.tags.domain[0] ?? domain,
          name: result.manifest.agent.name,
          reason: buildReason(result, domain, input.segmentProfile),
          score: result.score,
          useCase: result.manifest.tags["use-case"][0] ?? "general"
        });
      }
    }
  }

  const specialistLineup = Array.from(shortlist.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
  const workflowPlan = buildWorkflowPlan(specialistLineup, input.objective);
  const approvalRecommendation = buildApprovalRecommendation(specialistLineup, input.objective);
  const handoffPackages = workflowPlan.slice(0, 3).map((step) => ({
    payloadFocus: `${input.segmentProfile.industry} ${input.segmentProfile.clientSegment}`.trim(),
    reason: step.reason,
    target: step.agentId
  }));

  return {
    approvalRecommendation,
    focusDomains,
    handoffPackages,
    specialistLineup,
    workflowPlan
  };
}

