export const EXECUTIVE_PREMIUM_TAG = "executive-premium";
export const EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT = 14;
export const EXECUTIVE_PREMIUM_COLLECTION_HREF = "/marketplace?tags=executive-premium";
export const EXECUTIVE_PREMIUM_MARKETPLACE_PAGE_SIZE = 6;
export const EXECUTIVE_PREMIUM_SPOTLIGHT_PAGE_SIZE = 4;

export const EXECUTIVE_PREMIUM_PACK_IDS = [
  "boardprep-ai-premium-pack",
  "brand-guardian-premium-pack",
  "budget-fluid-premium-pack",
  "capital-allocator-premium-pack",
  "churn-deflector-premium-pack",
  "competitor-xray-premium-pack",
  "crisis-navigator-premium-pack",
  "culture-pulse-premium-pack",
  "expansion-mapper-premium-pack",
  "market-sentinel-premium-pack",
  "narrative-weaver-premium-pack",
  "pipeline-oracle-premium-pack",
  "pricing-optimizer-premium-pack",
  "quota-architect-premium-pack",
  "trend-catcher-premium-pack"
] as const;

const EXECUTIVE_PREMIUM_PACK_ID_SET = new Set<string>(EXECUTIVE_PREMIUM_PACK_IDS);

export type ExecutivePremiumResultLike = {
  agent: {
    description: string;
    id: string;
    name: string;
  };
  tags: {
    domain: string[];
    level: string[];
    persona?: string[];
    "use-case"?: string[];
  };
};

export type ExecutivePremiumInstallerOption = {
  description: string;
  id: string;
  name: string;
};

export function buildExecutivePremiumAgentHref(agentId: string): string {
  return `${EXECUTIVE_PREMIUM_COLLECTION_HREF}&agentId=${encodeURIComponent(agentId)}`;
}

export function isExecutivePremiumPack(packId: string): boolean {
  return EXECUTIVE_PREMIUM_PACK_ID_SET.has(packId);
}

export function mergeExecutivePremiumInstallerOptions(
  ...groups: ExecutivePremiumResultLike[][]
): ExecutivePremiumInstallerOption[] {
  const seen = new Set<string>();
  const merged: ExecutivePremiumInstallerOption[] = [];

  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.agent.id)) {
        continue;
      }

      seen.add(item.agent.id);
      merged.push({
        description: item.agent.description,
        id: item.agent.id,
        name: item.agent.name
      });
    }
  }

  return merged;
}
