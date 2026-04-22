import Link from "next/link";

import { ExecutivePremiumSpotlight } from "../../../../components/agents/ExecutivePremiumSpotlight";
import { ProductPageHeader } from "../../../../components/dashboard/page-fragments";
import {
  buildExecutivePremiumAgentHref,
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT,
  EXECUTIVE_PREMIUM_SPOTLIGHT_PAGE_SIZE,
  isExecutivePremiumPack
} from "../../../../lib/executive-premium";
import { getRequestLocale } from "../../../../lib/i18n.server";
import {
  fetchComparisonMatrix,
  fetchExecutivePremiumCollection
} from "../../../../lib/marketplace-api.server";

const pageCopy = {
  "en-US": {
    badge: "Capability matrix",
    description:
      "Compare domains, tools, and intent signals side by side before installing the next agent pack.",
    domainsLabel: "domains mapped",
    keywordsLabel: "intent signals",
    marketplace: "Marketplace",
    openDocs: "Open inline docs",
    packs: "Installed packs",
    premiumBadge: "Executive Premium",
    premiumDescription:
      "Rows highlighted as Executive Premium carry the shared governance, evidence, and handoff layers used in the executive collection.",
    premiumMatrixLabel: "premium agents in the matrix",
    premiumSpotlight: "Executive Premium Collection",
    premiumToolsLabel: "shared premium layers",
    premiumViewAll: "Open executive premium collection",
    tableAgent: "Agent",
    tableDomains: "Domains",
    tableKeywords: "Signals",
    tableLinks: "Actions",
    tableTools: "Tools",
    title: "Marketplace Compare"
  },
  "pt-BR": {
    badge: "Matriz de capabilities",
    description:
      "Compare dominios, ferramentas e sinais de intencao lado a lado antes de instalar o proximo agent pack.",
    domainsLabel: "dominios mapeados",
    keywordsLabel: "sinais de intencao",
    marketplace: "Marketplace",
    openDocs: "Abrir docs inline",
    packs: "Packs instalados",
    premiumBadge: "Executive Premium",
    premiumDescription:
      "Linhas destacadas como Executive Premium carregam as camadas compartilhadas de governanca, evidencia e handoff usadas na colecao executiva.",
    premiumMatrixLabel: "agentes premium na matriz",
    premiumSpotlight: "Colecao Premium Executiva",
    premiumToolsLabel: "camadas premium compartilhadas",
    premiumViewAll: "Abrir colecao premium executiva",
    tableAgent: "Agente",
    tableDomains: "Dominios",
    tableKeywords: "Sinais",
    tableLinks: "Acoes",
    tableTools: "Ferramentas",
    title: "Comparativo do Marketplace"
  }
} as const;

export default async function MarketplaceComparePage() {
  const locale = await getRequestLocale();
  const copy = pageCopy[locale] ?? pageCopy["pt-BR"];
  const [comparison, executivePremium] = await Promise.all([
    fetchComparisonMatrix(),
    fetchExecutivePremiumCollection(EXECUTIVE_PREMIUM_SPOTLIGHT_PAGE_SIZE).catch(() => null)
  ]);

  const premiumAgentIds = new Set(
    executivePremium?.results.map((item) => item.agent.id) ?? []
  );
  const rows = comparison.matrix.map((row) => ({
    ...row,
    isExecutivePremium: premiumAgentIds.has(row.agentId) || isExecutivePremiumPack(row.agentId)
  }));
  const premiumCount = rows.filter((row) => row.isExecutivePremium).length;
  const mappedDomains = new Set(rows.flatMap((row) => row.domain)).size;
  const mappedKeywords = new Set(rows.flatMap((row) => row.keywords)).size;

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            <span className="badge">{rows.length} agents</span>
            <span className="badge">{premiumCount} {copy.premiumMatrixLabel}</span>
            <span className="badge">{mappedDomains} {copy.domainsLabel}</span>
            <Link className="ghost-button" href="/marketplace">
              {copy.marketplace}
            </Link>
            <Link className="ghost-button" href={EXECUTIVE_PREMIUM_COLLECTION_HREF}>
              {copy.premiumViewAll}
            </Link>
            <Link className="ghost-button" href="/packs">
              {copy.packs}
            </Link>
          </div>
        }
        badge={copy.badge}
        description={copy.description}
        title={copy.title}
      />

      {executivePremium?.results?.length ? (
        <ExecutivePremiumSpotlight
          cardAction={{
            href: (item) => buildExecutivePremiumAgentHref(item.agent.id),
            label: copy.premiumViewAll
          }}
          cardMeta={(item) => `${item.tags.domain.join(", ")} / ${item.tags.level.join(", ")}`}
          cardSecondaryAction={{
            href: (item) => `/marketplace?agentId=${encodeURIComponent(item.agent.id)}`,
            label: copy.openDocs,
            tone: "accent"
          }}
          cardSubhead={(item) => item.agent.id}
          description={copy.premiumDescription}
          eyebrow={copy.premiumSpotlight}
          results={executivePremium.results}
          summaryItems={[
            `${premiumCount} ${copy.premiumMatrixLabel}`,
            `${EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} ${copy.premiumToolsLabel}`
          ]}
          title="Executive Premium Agents Collection"
        />
      ) : null}

      <section
        style={{
          display: "grid",
          gap: "0.9rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))"
        }}
      >
        {[
          { label: "Agents", value: String(rows.length) },
          { label: copy.premiumMatrixLabel, value: String(premiumCount) },
          { label: copy.domainsLabel, value: String(mappedDomains) },
          { label: copy.keywordsLabel, value: String(mappedKeywords) }
        ].map((item) => (
          <article
            key={item.label}
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              display: "grid",
              gap: "0.35rem",
              padding: "1rem"
            }}
          >
            <small style={{ color: "var(--muted)", textTransform: "uppercase" }}>{item.label}</small>
            <strong style={{ fontSize: "1.75rem" }}>{item.value}</strong>
          </article>
        ))}
      </section>

      <section
        style={{
          background: "rgba(255,255,255,0.86)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          display: "grid",
          gap: "1rem",
          overflow: "hidden",
          padding: "1rem"
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "grid", gap: "0.25rem" }}>
            <strong>{copy.title}</strong>
            <small style={{ color: "var(--muted)" }}>{copy.premiumDescription}</small>
          </div>
          <Link href={EXECUTIVE_PREMIUM_COLLECTION_HREF}>{copy.premiumViewAll}</Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: 1120,
              width: "100%"
            }}
          >
            <thead>
              <tr>
                {[
                  copy.tableAgent,
                  copy.tableDomains,
                  copy.tableTools,
                  copy.tableKeywords,
                  copy.tableLinks
                ].map((label) => (
                  <th
                    key={label}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--muted)",
                      fontSize: "0.78rem",
                      letterSpacing: "0.08em",
                      padding: "0.8rem 0.65rem",
                      textAlign: "left",
                      textTransform: "uppercase"
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.agentId}
                  style={{
                    background: row.isExecutivePremium
                      ? "linear-gradient(90deg, rgba(15,23,42,0.04), rgba(59,130,246,0.08))"
                      : "transparent"
                  }}
                >
                  <td style={{ borderBottom: "1px solid var(--border)", padding: "0.8rem 0.65rem" }}>
                    <div style={{ display: "grid", gap: "0.35rem" }}>
                      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        <strong>{row.agentName}</strong>
                        {row.isExecutivePremium ? (
                          <span
                            style={{
                              background: "rgba(30,58,138,0.12)",
                              borderRadius: 999,
                              color: "var(--accent-strong)",
                              display: "inline-flex",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.25rem 0.65rem"
                            }}
                          >
                            {copy.premiumBadge}
                          </span>
                        ) : null}
                      </div>
                      <small style={{ color: "var(--muted)" }}>{row.agentId}</small>
                    </div>
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: "0.8rem 0.65rem" }}>
                    {row.domain.join(", ") || "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: "0.8rem 0.65rem" }}>
                    {row.tools.join(", ") || "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: "0.8rem 0.65rem" }}>
                    {row.keywords.join(", ") || "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: "0.8rem 0.65rem" }}>
                    <div style={{ display: "grid", gap: "0.35rem" }}>
                      <Link href={`/marketplace?agentId=${encodeURIComponent(row.agentId)}`}>
                        {copy.openDocs}
                      </Link>
                      {row.isExecutivePremium ? (
                        <Link href={buildExecutivePremiumAgentHref(row.agentId)}>
                          {copy.premiumViewAll}
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
