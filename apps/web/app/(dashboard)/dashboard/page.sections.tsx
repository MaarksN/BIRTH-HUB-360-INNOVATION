import Link from "next/link";

import { ExecutivePremiumSpotlight } from "../../../components/agents/ExecutivePremiumSpotlight";
import {
  formatNumber,
  translateLabel,
  type Dictionary,
  type SupportedLocale
} from "../../../lib/i18n";
import {
  buildExecutivePremiumAgentHref,
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT
} from "../../../lib/executive-premium";
import { loadDashboardHomePage } from "./page.data";

type DashboardHomeCopy = Dictionary["dashboardHome"];
type DashboardHomeData = Awaited<ReturnType<typeof loadDashboardHomePage>>;
type ExecutivePremiumResult = {
  agent: {
    description: string;
    id: string;
    name: string;
  };
  tags: {
    domain: string[];
    level: string[];
  };
};

type DashboardStaticCopy = ReturnType<typeof getDashboardStaticCopy>;

function formatOnboardingSummary(
  locale: SupportedLocale,
  completedSteps: number,
  totalSteps: number
): string {
  if (locale === "pt-BR") {
    return `${completedSteps} de ${totalSteps} passos fechados.`;
  }

  return `${completedSteps} of ${totalSteps} steps completed.`;
}

function formatConsentSummary(
  locale: SupportedLocale,
  input: {
    legalBasis: string;
    status: string;
    version: string;
  },
  labels: {
    consentLegalBasisLabels: Record<string, string>;
    consentStatusLabels: Record<string, string>;
  }
): string {
  const statusLabel = translateLabel(labels.consentStatusLabels, input.status);
  const legalBasisLabel = translateLabel(labels.consentLegalBasisLabels, input.legalBasis);

  if (locale === "pt-BR") {
    return `Status atual: ${statusLabel} · base legal ${legalBasisLabel} · versao ${input.version}.`;
  }

  return `Current status: ${statusLabel} · legal basis ${legalBasisLabel} · version ${input.version}.`;
}

function formatOnboardingProgress(locale: SupportedLocale, progress: number): string {
  return locale === "pt-BR" ? `${progress}% concluido` : `${progress}% complete`;
}

export function getDashboardStaticCopy(locale: SupportedLocale) {
  if (locale === "pt-BR") {
    return {
      entryPoints: [
        "Use BDR, SDR e LDR para mapear contas, enriquecer contexto e preparar outreach.",
        "Simule gatekeepers, CFOs e cenarios tensos antes de entrar na call real.",
        "Abra o mentor para transformar contexto disperso em proximo passo comercial."
      ],
      entryPointTitles: ["Pesquisa e prospeccao", "Roleplay e negociacao", "Mentoria contextual"],
      premiumDashboardBadge: "Colecao premium executiva",
      premiumDashboardCta: "Abrir colecao premium",
      premiumDashboardDescription:
        "Linha oficial para board, C-level e liderancas com score de evidencia, memoria decisoria, radar de risco e handoff governado entre especialistas.",
      premiumDashboardManage: "Ver packs premium",
      premiumDashboardMetricSubtitles: [
        "Agentes destacados por default no dashboard",
        "Camadas compartilhadas de governanca, memoria e prescricao",
        "Marketplace, Sales OS e Packs conectados"
      ],
      premiumDashboardMetrics: ["Agentes premium", "Camadas premium", "Entrada padrao"],
      premiumDashboardTitle: "Executive premium agora aparece na home",
      productAlignmentCopy: {
        badge: "Foco de produto",
        description:
          "O produto ativo concentra a operacao comercial: Sales OS, agentes autonomos, workflows, billing, analytics, notificacoes, privacidade self-service e integracoes governadas.",
        title: "BirthHub 360 opera como sistema operacional de receita"
      },
      salesOsCta: "Abrir Sales OS",
      salesOsDescription:
        "Acesse pre-sales, vendas, marketing, CS, revops, financeiro e risco em uma unica superficie.",
      salesOsMetricSubtitles: [
        "Estruturas operacionais disponiveis",
        "Protocolos importados do blueprint",
        "Simulacoes para objecoes e negociacao"
      ],
      salesOsMetrics: ["Modulos", "Ferramentas", "Roleplays"],
      salesOsSecondaryCta: "Abrir plataforma SDR",
      salesOsTitle: "Cockpit comercial unificado"
    };
  }

  return {
    entryPoints: [
      "Use BDR, SDR, and LDR to map accounts, enrich context, and prepare outreach.",
      "Simulate gatekeepers, CFOs, and tense scenarios before the live call.",
      "Open the mentor to turn scattered context into the next commercial move."
    ],
    entryPointTitles: ["Research and prospecting", "Roleplay and negotiation", "Contextual mentoring"],
    premiumDashboardBadge: "Executive premium collection",
    premiumDashboardCta: "Open premium collection",
    premiumDashboardDescription:
      "The official board and C-level lineup now lands on the home dashboard with evidence scorecards, decision memory, risk radar, and governed specialist handoffs.",
    premiumDashboardManage: "View premium packs",
    premiumDashboardMetricSubtitles: [
      "Agents highlighted by default on the dashboard",
      "Shared layers for governance, memory, and prescription",
      "Marketplace, Sales OS, and Packs are now connected"
    ],
    premiumDashboardMetrics: ["Premium agents", "Premium layers", "Default entry"],
    premiumDashboardTitle: "Executive premium now lands on home",
    productAlignmentCopy: {
      badge: "Product focus",
      description:
        "The active product focuses on revenue operations: Sales OS, autonomous agents, workflows, billing, analytics, notifications, self-service privacy, and governed integrations.",
      title: "BirthHub 360 operates as a revenue operating system"
    },
    salesOsCta: "Open Sales OS",
    salesOsDescription:
      "Access pre-sales, sales, marketing, CS, revops, finance, and risk in one operating surface.",
    salesOsMetricSubtitles: [
      "Available operating structures",
      "Protocols imported from the blueprint",
      "Simulations for objections and negotiation"
    ],
    salesOsMetrics: ["Modules", "Tools", "Roleplays"],
    salesOsSecondaryCta: "Open SDR platform",
    salesOsTitle: "Unified commercial cockpit"
  };
}

export function DashboardNoticeSections(props: {
  copy: DashboardHomeCopy;
  data: DashboardHomeData;
  locale: SupportedLocale;
  staticCopy: DashboardStaticCopy;
}) {
  const consentPreferences = props.data.consents?.preferences;
  const consentNeedsAttention =
    props.data.capabilities.privacyAdvancedEnabled &&
    consentPreferences?.lgpdConsentStatus === "PENDING";
  const completedOnboardingSteps = props.data.onboarding.items.filter((item) => item.complete).length;
  const showProductAlignmentNotice = !props.data.capabilities.privacyAdvancedEnabled;

  return (
    <>
      {showProductAlignmentNotice ? (
        <section className="panel dashboard-callout">
          <div className="dashboard-callout__copy">
            <span className="badge">{props.staticCopy.productAlignmentCopy.badge}</span>
            <strong>{props.staticCopy.productAlignmentCopy.title}</strong>
            <span className="dashboard-muted">
              {props.staticCopy.productAlignmentCopy.description}
            </span>
          </div>
        </section>
      ) : null}

      {consentNeedsAttention && consentPreferences ? (
        <section className="panel dashboard-callout dashboard-callout--warning">
          <div className="dashboard-callout__row">
            <div className="dashboard-callout__copy">
              <span className="badge">{props.copy.consentBadge}</span>
              <strong>{props.copy.consentAttentionTitle}</strong>
              <span className="dashboard-muted">
                {formatConsentSummary(
                  props.locale,
                  {
                    legalBasis: consentPreferences.lgpdLegalBasis,
                    status: consentPreferences.lgpdConsentStatus,
                    version: consentPreferences.lgpdConsentVersion
                  },
                  props.copy
                )}
              </span>
            </div>
            <Link className="action-button" href="/settings/privacy">
              {props.copy.reviewConsents}
            </Link>
          </div>
        </section>
      ) : null}

      {props.data.onboarding.enabled && props.data.onboarding.progress < 100 ? (
        <section className="panel dashboard-callout">
          <div className="dashboard-callout__row">
            <div className="dashboard-callout__copy">
              <span className="badge">{props.copy.onboardingBadge}</span>
              <strong>
                {formatOnboardingProgress(props.locale, props.data.onboarding.progress)}
              </strong>
              <span className="dashboard-muted">
                {formatOnboardingSummary(
                  props.locale,
                  completedOnboardingSteps,
                  props.data.onboarding.items.length
                )}
              </span>
            </div>
            <Link className="action-button" href={props.data.onboarding.nextHref}>
              {props.copy.continueLabel}
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}

export function DashboardExecutivePremiumSection(props: {
  executivePremiumCount: number;
  executivePremiumResults: ExecutivePremiumResult[];
  locale: SupportedLocale;
  staticCopy: DashboardStaticCopy;
}) {
  if (props.executivePremiumResults.length === 0) {
    return null;
  }

  const [
    premiumMetricPrimaryLabel = "",
    premiumMetricLayersLabel = "",
    premiumMetricEntryLabel = ""
  ] = props.staticCopy.premiumDashboardMetrics;
  const [
    premiumMetricPrimaryDescription = "",
    premiumMetricLayersDescription = "",
    premiumMetricEntryDescription = ""
  ] = props.staticCopy.premiumDashboardMetricSubtitles;

  return (
    <ExecutivePremiumSpotlight
      badge={props.staticCopy.premiumDashboardBadge}
      cardAction={{
        href: (item) => buildExecutivePremiumAgentHref(item.agent.id),
        label: props.locale === "pt-BR" ? "Abrir agente" : "Open agent"
      }}
      cardBadge="Executive Premium"
      cardMeta={(item) => `${item.tags.domain.join(", ")} · ${item.tags.level.join(", ")}`}
      cardSecondaryAction={{
        href: () => "/sales-os",
        label: "Sales OS",
        tone: "accent"
      }}
      description={props.staticCopy.premiumDashboardDescription}
      metrics={[
        {
          description: premiumMetricPrimaryDescription,
          label: premiumMetricPrimaryLabel,
          value: formatNumber(props.locale, props.executivePremiumCount)
        },
        {
          description: premiumMetricLayersDescription,
          label: premiumMetricLayersLabel,
          value: String(EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT)
        },
        {
          description: premiumMetricEntryDescription,
          label: premiumMetricEntryLabel,
          value: "3"
        }
      ]}
      primaryAction={{
        href: EXECUTIVE_PREMIUM_COLLECTION_HREF,
        label: props.staticCopy.premiumDashboardCta
      }}
      results={props.executivePremiumResults}
      secondaryAction={{
        href: "/packs",
        label: props.staticCopy.premiumDashboardManage,
        tone: "ghost"
      }}
      title={props.staticCopy.premiumDashboardTitle}
    />
  );
}
