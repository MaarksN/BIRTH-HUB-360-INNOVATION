import { notFound } from "next/navigation";

import { getWebConfig } from "../../../../../lib/web-config";

import { ExecutivePremiumAgentCallout } from "../../../../../components/agents/ExecutivePremiumAgentCallout";
import { PolicyManager } from "../../../../../components/agents/PolicyManager";
import { getInstalledAgentById, getInstalledAgentPolicies } from "../../../../../lib/agents";
import { isExecutivePremiumPack } from "../../../../../lib/executive-premium";

type ManifestPolicy = {
  actions: string[];
  effect: string;
  id: string;
  name: string;
};

function readPolicies(manifest: Record<string, unknown>): ManifestPolicy[] {
  const policies = manifest.policies;

  if (!Array.isArray(policies)) {
    return [];
  }

  return policies.filter((policy): policy is ManifestPolicy => {
    if (!policy || typeof policy !== "object") {
      return false;
    }

    const candidate = policy as Record<string, unknown>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.effect === "string" &&
      Array.isArray(candidate.actions)
    );
  });
}

export default async function AgentPoliciesPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [agent, policies] = await Promise.all([
    getInstalledAgentById(id),
    getInstalledAgentPolicies(id),
  ]);

  if (!agent) {
    notFound();
  }
  const config = getWebConfig();
  const manifestPolicies = policies?.manifestPolicies ?? readPolicies(agent.manifest);
  const managedPolicies = policies?.managedPolicies ?? [];
  const runtimeProvider = policies?.runtimeProvider ?? agent.runtimeProvider;

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      {isExecutivePremiumPack(agent.catalogAgentId) ? (
        <ExecutivePremiumAgentCallout
          agentId={agent.catalogAgentId}
          description="As policies deste agente premium governam evidencia, memoria, recomendacao prescritiva e handoff executivo. Revise ajustes com cuidado para preservar a trilha premium."
          title="Policies premium executivas"
        />
      ) : null}
      <PolicyManager
        agentId={agent.id}
        apiUrl={config.NEXT_PUBLIC_API_URL}
        initialManagedPolicies={managedPolicies}
        initialManifestPolicies={manifestPolicies}
        runtimeProvider={runtimeProvider}
      />
    </section>
  );
}
