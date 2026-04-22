import Link from "next/link";

import { ProductPageHeader } from "../../../../components/dashboard/page-fragments";
import { ChatbookWorkspace } from "../../../../components/agents/chatbook-workspace";

export default function ChatbookInteligentissimoPage() {
  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            <Link href="/agents">Voltar para agents</Link>
            <Link className="ghost-button" href="/outputs">
              Ver outputs
            </Link>
          </div>
        }
        badge="Agents"
        description="Workspace premium para o ChatBook Inteligentissimo, com orquestracao de busca interna, complemento web, voz, simulacao de cenarios e proximas acoes assistidas."
        title="ChatBook Inteligentissimo"
      />

      <section className="panel chatbook-launchpad">
        <div className="chatbook-launchpad__copy">
          <span className="badge">MVP conectado</span>
          <h2>Uma central de inteligencia operacional dentro do dashboard</h2>
          <p>
            Este workspace nasce com chat textual, roteador de ferramentas, busca interna com
            fallback demonstrativo, referencias web catalogadas, simulador de cenarios e voz no
            navegador.
          </p>
        </div>

        <div className="chatbook-launchpad__stats">
          <article>
            <strong>Busca interna</strong>
            <span>Indice vivo + catalogo MVP</span>
          </article>
          <article>
            <strong>Busca web</strong>
            <span>Fontes confiaveis separadas por origem</span>
          </article>
          <article>
            <strong>Simuladores</strong>
            <span>Base, recomendado, otimista e conservador</span>
          </article>
          <article>
            <strong>Acoes</strong>
            <span>Links diretos para packs, reports, outputs e workflows</span>
          </article>
        </div>
      </section>

      <ChatbookWorkspace />
    </main>
  );
}
