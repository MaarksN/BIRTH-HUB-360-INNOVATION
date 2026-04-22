"use client";

import { useI18n } from "../../providers/I18nProvider";

export function ClinicalWorkspaceNotice() {
  const { locale } = useI18n();
  const copy =
    locale === "pt-BR"
      ? {
          badge: "Superficie preservada",
          description:
            "Este workspace clinico permanece fora do produto ativo e aparece aqui apenas para avaliacao controlada quando a flag de capacidade e habilitada.",
          title: "Uso restrito a validacao dirigida"
        }
      : {
          badge: "Preserved surface",
          description:
            "This clinical workspace remains outside the active product and appears here only for controlled evaluation when the capability flag is enabled.",
          title: "Restricted to directed validation"
        };

  return (
    <article className="panel" style={{ display: "grid", gap: "0.55rem" }}>
      <span className="badge">{copy.badge}</span>
      <strong>{copy.title}</strong>
      <p style={{ color: "var(--muted)", margin: 0 }}>{copy.description}</p>
    </article>
  );
}
