import Link from "next/link";

import { ProductPageHeader } from "../../../../components/dashboard/page-fragments";
import { SdrAutomaticPlatform } from "../../../../components/sales-os/sdr-automatic-platform";
import {
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  EXECUTIVE_PREMIUM_SPOTLIGHT_PAGE_SIZE
} from "../../../../lib/executive-premium";
import { getRequestLocale } from "../../../../lib/i18n.server";
import { fetchExecutivePremiumCollection } from "../../../../lib/marketplace-api.server";

const pageCopy = {
  "en-US": {
    back: "Back to Sales OS",
    badge: "Embedded prototype",
    description:
      "Dedicated SDR operating surface with predictive ranking, qualification assist, smart scheduling, and guided handoff.",
    home: "Dashboard",
    premiumAgentsLabel: "premium executive agents",
    premiumCollection: "Premium collection",
    premiumInstalledAgents: "Installed agents",
    title: "BirthHub SDR Automatic"
  },
  "pt-BR": {
    back: "Voltar para Sales OS",
    badge: "Prototipo incorporado",
    description:
      "Superficie dedicada para SDR com ranking preditivo, apoio de qualificacao, agendamento inteligente e handoff guiado.",
    home: "Dashboard",
    premiumAgentsLabel: "agentes executivos premium",
    premiumCollection: "Colecao premium",
    premiumInstalledAgents: "Agentes instalados",
    title: "BirthHub SDR Automatic"
  }
} as const;

export default async function SdrAutomaticPage() {
  const locale = await getRequestLocale();
  const copy = pageCopy[locale] ?? pageCopy["pt-BR"];
  const executivePremium = await fetchExecutivePremiumCollection(EXECUTIVE_PREMIUM_SPOTLIGHT_PAGE_SIZE).catch(
    () => null
  );
  const executivePremiumCount = executivePremium?.total ?? 0;

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            {executivePremiumCount > 0 ? (
              <span className="badge">
                {executivePremiumCount} {copy.premiumAgentsLabel}
              </span>
            ) : null}
            <Link href="/sales-os">{copy.back}</Link>
            <Link className="ghost-button" href={EXECUTIVE_PREMIUM_COLLECTION_HREF}>
              {copy.premiumCollection}
            </Link>
            <Link className="ghost-button" href="/agents">
              {copy.premiumInstalledAgents}
            </Link>
            <Link className="ghost-button" href="/dashboard">
              {copy.home}
            </Link>
          </div>
        }
        badge={copy.badge}
        description={copy.description}
        title={copy.title}
      />

      <SdrAutomaticPlatform locale={locale} premiumAgentCount={executivePremiumCount} />
    </main>
  );
}
