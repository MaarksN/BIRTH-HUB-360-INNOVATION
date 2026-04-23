"use client";

import Link from "next/link";

import { useI18n } from "../../providers/I18nProvider";
import {
  ProductEmptyState,
  ProductPageHeader
} from "./page-fragments";

export function ClinicalWorkspaceDisabledState() {
  const { locale } = useI18n();
  const copy =
    locale === "pt-BR"
      ? {
          actionPrimary: "Voltar ao dashboard",
          actionSecondary: "Abrir workflows",
          badge: "Workspace legado desativado",
          description:
            "Esta area nao faz parte do produto ativo. O BirthHub 360 segue focado em operacao comercial, agentes autonomos, workflows e integracoes de receita.",
          emptyDescription:
            "Use o dashboard, Sales OS, workflows e agentes para operar o fluxo principal da plataforma.",
          emptyTitle: "Area fora do foco comercial ativo",
          title: "Workspace indisponivel no caminho padrao"
        }
      : {
          actionPrimary: "Back to dashboard",
          actionSecondary: "Open workflows",
          badge: "Legacy workspace disabled",
          description:
            "This area is not part of the active product. BirthHub 360 stays focused on commercial operations, autonomous agents, workflows, and revenue integrations.",
          emptyDescription:
            "Use the dashboard, Sales OS, workflows, and agents to operate the platform's main flow.",
          emptyTitle: "Area outside the active commercial focus",
          title: "Workspace unavailable in the default path"
        };

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        badge={copy.badge}
        description={copy.description}
        title={copy.title}
      />
      <ProductEmptyState
        action={
          <div className="hero-actions">
            <Link href="/dashboard">{copy.actionPrimary}</Link>
            <Link className="ghost-button" href="/workflows">
              {copy.actionSecondary}
            </Link>
          </div>
        }
        description={copy.emptyDescription}
        title={copy.emptyTitle}
      />
    </main>
  );
}
