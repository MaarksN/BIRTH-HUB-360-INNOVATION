import { notFound } from "next/navigation";

import { getWebConfig } from "../../../../../lib/web-config";

import { ExecutivePremiumAgentCallout } from "../../../../../components/agents/ExecutivePremiumAgentCallout";
import { AgentRunPanel } from "../../../../../components/agents/agent-run-panel";
import { getInstalledAgentById } from "../../../../../lib/agents";
import { isExecutivePremiumPack } from "../../../../../lib/executive-premium";

export default async function AgentRunPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const agent = await getInstalledAgentById(id);

  if (!agent) {
    notFound();
  }

  const config = getWebConfig();

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h2 style={{ margin: 0 }}>Run Agent</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Execucao live governada com logs persistidos, replay SSE, memoria compartilhada e output
          automatico.
        </p>
      </header>
      {isExecutivePremiumPack(agent.catalogAgentId) ? (
        <ExecutivePremiumAgentCallout
          agentId={agent.catalogAgentId}
          description="Este run carrega um agente premium executivo. Priorize inputs com objetivo, contexto, risco, dependencia e resultado esperado para aproveitar melhor as camadas premium."
          title="Run premium executivo"
        />
      ) : null}
      <AgentRunPanel agentId={agent.id} apiUrl={config.NEXT_PUBLIC_API_URL} />
    </section>
  );
}
