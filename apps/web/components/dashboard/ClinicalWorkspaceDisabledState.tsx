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
          badge: "Workspace clinico desativado",
          description:
            "Pacientes, agenda, prontuarios e integrações FHIR permanecem fora do produto ativo nesta implantacao e so voltam por decisao explicita de reavaliacao controlada.",
          emptyDescription:
            "O modulo foi preservado no codigo como superficie controlada, sem navegacao default e sem compromisso de suporte continuo no fluxo principal.",
          emptyTitle: "Superficie clinica preservada fora do produto ativo",
          title: "Modulo clinico indisponivel no caminho padrao"
        }
      : {
          actionPrimary: "Back to dashboard",
          actionSecondary: "Open workflows",
          badge: "Clinical workspace disabled",
          description:
            "Patients, scheduling, clinical records, and FHIR surfaces remain outside the active product for this deployment and only return through an explicit controlled-evaluation decision.",
          emptyDescription:
            "The module was kept in code as a controlled surface, without default navigation and without ongoing support commitment in the main path.",
          emptyTitle: "Clinical surface preserved outside the active product",
          title: "Clinical module unavailable in the default path"
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
