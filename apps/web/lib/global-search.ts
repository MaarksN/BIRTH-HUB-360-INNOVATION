import {
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT
} from "./executive-premium";
import type { SupportedLocale } from "./i18n";

export type GlobalSearchItem = {
  href: string;
  id: string;
  subtitle: string;
  title: string;
  type: string;
};

export type GlobalSearchGroup = {
  id: string;
  items: GlobalSearchItem[];
  label: string;
};

export function getGlobalSearchCopy(locale: SupportedLocale) {
  if (locale === "pt-BR") {
    return {
      buttonLabel: "Buscar",
      closeAriaLabel: "Fechar busca global",
      emptyLabel: "Nenhum resultado encontrado.",
      errorLabel: "Falha ao carregar busca global.",
      loadingLabel: "Buscando resultados...",
      openAriaLabel: "Abrir busca global",
      placeholder: "Buscar ChatBook, workflows, premium, reports, notificacoes, conversations e Sales OS",
      shortcutsLabel: "Atalhos"
    };
  }

  return {
    buttonLabel: "Search",
    closeAriaLabel: "Close global search",
    emptyLabel: "No results found.",
    errorLabel: "Failed to load global search.",
    loadingLabel: "Searching results...",
    openAriaLabel: "Open global search",
    placeholder: "Search ChatBook, workflows, premium, reports, notifications, conversations, and Sales OS",
    shortcutsLabel: "Shortcuts"
  };
}

export function getLocalSearchShortcuts(locale: SupportedLocale): GlobalSearchItem[] {
  if (locale === "pt-BR") {
    return [
      {
        href: "/marketplace",
        id: "shortcut-marketplace",
        subtitle: "Descubra agentes oficiais, compare capabilities e abra a colecao premium executiva.",
        title: "Marketplace",
        type: "shortcut"
      },
      {
        href: EXECUTIVE_PREMIUM_COLLECTION_HREF,
        id: "shortcut-executive-premium",
        subtitle: `${EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} camadas premium para board, C-level, risco e memoria decisoria.`,
        title: "Executive Premium",
        type: "shortcut"
      },
      {
        href: "/marketplace/compare",
        id: "shortcut-marketplace-compare",
        subtitle: "Compare dominios, ferramentas e cobertura premium lado a lado antes do rollout.",
        title: "Comparativo Premium",
        type: "shortcut"
      },
      {
        href: "/packs",
        id: "shortcut-premium-packs",
        subtitle: "Veja status, ativacao e rollout dos packs premium executivos instalados.",
        title: "Premium Packs",
        type: "shortcut"
      },
      {
        href: "/agents",
        id: "shortcut-installed-agents",
        subtitle: "Acompanhe agentes instalados, status, fail rate e execucoes premium em operacao.",
        title: "Agents",
        type: "shortcut"
      },
      {
        href: "/agents/chatbook-inteligentissimo",
        id: "shortcut-chatbook-inteligentissimo",
        subtitle: "Central de inteligencia com busca interna, web, voz, simuladores e proximas acoes.",
        title: "ChatBook Inteligentissimo",
        type: "shortcut"
      },
      {
        href: "/sales-os",
        id: "shortcut-sales-os",
        subtitle: "BirthHub Sales OS unificado com modulos, roleplays e mentor contextual.",
        title: "Sales OS",
        type: "shortcut"
      },
      {
        href: "/sales-os/sdr-automatico",
        id: "shortcut-sdr-automatic",
        subtitle: "Superficie SDR dedicada com lead score preditivo, agenda inteligente e handoff premium.",
        title: "SDR Automatic",
        type: "shortcut"
      }
    ];
  }

  return [
    {
      href: "/marketplace",
      id: "shortcut-marketplace",
      subtitle: "Discover official agents, compare capabilities, and open the executive premium collection.",
      title: "Marketplace",
      type: "shortcut"
    },
    {
      href: EXECUTIVE_PREMIUM_COLLECTION_HREF,
      id: "shortcut-executive-premium",
      subtitle: `${EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} premium layers for board, C-level, risk, and decision memory.`,
      title: "Executive Premium",
      type: "shortcut"
    },
    {
      href: "/marketplace/compare",
      id: "shortcut-marketplace-compare",
      subtitle: "Compare domains, tools, and premium coverage side by side before rollout.",
      title: "Premium Compare",
      type: "shortcut"
    },
    {
      href: "/packs",
      id: "shortcut-premium-packs",
      subtitle: "Review status, activation, and rollout of installed executive premium packs.",
      title: "Premium Packs",
      type: "shortcut"
    },
    {
      href: "/agents",
      id: "shortcut-installed-agents",
      subtitle: "Track installed agents, status, fail rate, and premium executions in operation.",
      title: "Agents",
      type: "shortcut"
    },
    {
      href: "/agents/chatbook-inteligentissimo",
      id: "shortcut-chatbook-inteligentissimo",
      subtitle: "Intelligence hub with internal search, web context, voice, simulators, and next actions.",
      title: "ChatBook Intelligence",
      type: "shortcut"
    },
    {
      href: "/sales-os",
      id: "shortcut-sales-os",
      subtitle: "Unified BirthHub Sales OS with modules, roleplays, and contextual mentor.",
      title: "Sales OS",
      type: "shortcut"
    },
    {
      href: "/sales-os/sdr-automatico",
      id: "shortcut-sdr-automatic",
      subtitle: "Dedicated SDR surface with predictive lead score, smart scheduling, and premium handoff.",
      title: "SDR Automatic",
      type: "shortcut"
    }
  ];
}

export function mergeGlobalSearchGroups(input: {
  groups: GlobalSearchGroup[];
  locale: SupportedLocale;
  query: string;
}): GlobalSearchGroup[] {
  const normalizedQuery = input.query.trim().toLowerCase();
  const matchedShortcuts = getLocalSearchShortcuts(input.locale).filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${item.title} ${item.subtitle} ${item.type}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  if (matchedShortcuts.length === 0) {
    return input.groups;
  }

  const existingShortcuts = input.groups.find((group) => group.id === "shortcuts");
  const mergedShortcutItems = [
    ...(existingShortcuts?.items ?? []),
    ...matchedShortcuts.filter(
      (shortcut) => !(existingShortcuts?.items ?? []).some((item) => item.href === shortcut.href)
    )
  ];
  const otherGroups = input.groups.filter((group) => group.id !== "shortcuts");

  return [
    {
      id: "shortcuts",
      items: mergedShortcutItems,
      label: existingShortcuts?.label ?? getGlobalSearchCopy(input.locale).shortcutsLabel
    },
    ...otherGroups
  ];
}
