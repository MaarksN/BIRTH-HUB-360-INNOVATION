"use client";

import { useI18n } from "../../providers/I18nProvider";

export function ClinicalWorkspaceNotice() {
  const { locale } = useI18n();
  const copy =
    locale === "pt-BR"
      ? {
          badge: "Area legada",
          description:
            "Esta area nao pertence ao foco ativo do produto. O caminho principal e comercial: Sales OS, agentes, workflows e integracoes.",
          title: "Fora do fluxo comercial principal"
        }
      : {
          badge: "Legacy area",
          description:
            "This area is outside the active product focus. The main path is commercial: Sales OS, agents, workflows, and integrations.",
          title: "Outside the main commercial flow"
        };

  return (
    <article className="panel" style={{ display: "grid", gap: "0.55rem" }}>
      <span className="badge">{copy.badge}</span>
      <strong>{copy.title}</strong>
      <p style={{ color: "var(--muted)", margin: 0 }}>{copy.description}</p>
    </article>
  );
}
