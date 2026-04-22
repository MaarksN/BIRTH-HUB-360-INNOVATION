export const supportedLocales = ["pt-BR", "en-US"] as const;
export const LOCALE_COOKIE_NAME = "bh360_locale";

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "pt-BR";

type LabelMap = Record<string, string>;
type NavbarItem = { href: string; label: string };
type ConsentBannerDictionary = { accept: string; description: string; reject: string; settings: string; title: string };
type DashboardHomeDictionary = { alertSeverityLabels: LabelMap; attributionHeading: string; badge: string; cacColumn: string; clinicalDescription: string; clinicalHeading: string; clinicalRiskLabels: LabelMap; clinicalStatusLabels: LabelMap; consentAttentionTitle: string; consentBadge: string; consentLegalBasisLabels: LabelMap; consentStatusLabels: LabelMap; continueLabel: string; continueOnboarding: string; conversionColumn: string; customerColumn: string; customerHealthHeading: string; description: string; executionsLabel: string; gestationalAgeUnknown: string; goLiveAlertsHeading: string; highlightedWorkflowsDescription: string; highlightedWorkflowsHeading: string; leadsColumn: string; noAttributionDescription: string; noAttributionTitle: string; noClinicalAlertsDescription: string; noClinicalAlertsTitle: string; noClinicalNote: string; noClinicalSpotlightDescription: string; noClinicalSpotlightTitle: string; noCustomerHealthDescription: string; noCustomerHealthTitle: string; noRecentContractsDescription: string; noRecentContractsTitle: string; noReturnScheduled: string; noUsageDescription: string; noUsageTitle: string; noWorkflowsDescription: string; noWorkflowsTitle: string; npsColumn: string; onboardingBadge: string; openClinicalModule: string; openEditor: string; openPatient: string; openQueue: string; openWorkflows: string; planStatusLabel: string; recentContractsHeading: string; reviewConsents: string; returnPrefix: string; riskColumn: string; scoreColumn: string; sourceColumn: string; stepsLabel: string; title: string; usageHeading: string; viewExecutions: string; viewFullWorkflowList: string; viewReports: string; viewSchedule: string; workflowStatusLabels: LabelMap; workflowTriggerLabels: LabelMap };
type LoadingDictionary = { badge: string; dashboardDescription: string; dashboardTitle: string; workflowsDescription: string; workflowsTitle: string };
type NotificationPreferencesDictionary = { acceptCookies: string; activeThemeLabel: string; badge: string; cookieConsentDescription: string; cookieConsentHeading: string; cookieStatusLabel: string; darkThemeLabel: string; description: string; emailNotificationsDescription: string; emailNotificationsLabel: string; emptyFeed: string; feedDescription: string; feedHeading: string; inAppNotificationsDescription: string; inAppNotificationsLabel: string; interfaceLanguageDescription: string; interfaceLanguageHeading: string; interfaceLanguageLabel: string; lightThemeLabel: string; loadMore: string; loadingMore: string; localeLabels: Record<SupportedLocale, string>; markAllRead: string; markAsRead: string; marketingEmailsDescription: string; marketingEmailsLabel: string; openLink: string; pushNotificationsDescription: string; pushNotificationsLabel: string; rejectCookies: string; signInDescription: string; signInTitle: string; themeDescription: string; themeHeading: string; title: string };
type NavbarDictionary = { activateDarkTheme: string; activateLightTheme: string; darkModeLabel: string; emptyDescription: string; emptyTitle: string; feedLabel: string; identityDescription: string; identityTitle: string; items: NavbarItem[]; lightModeLabel: string; markAllRead: string; navigationAriaLabel: string; notificationsDescription: string; notificationsDisabledDescription: string; notificationsDisabledTitle: string; notificationsTitle: string; openDetail: string; openNotifications: string; preferences: string; premiumLinkLabel: string; premiumLinkTitle: string; today: string; viewCenter: string; yesterday: string };
type WorkflowsPageDictionary = { backHome: string; badge: string; continueEditing: string; description: string; emptyDescription: string; emptyTitle: string; executionsLabel: string; openEditor: string; revisions: string; statusLabels: LabelMap; stepsLabel: string; title: string; triggerLabels: LabelMap; updatedAtLabel: string; viewExecutions: string };
export type Dictionary = { consentBanner: ConsentBannerDictionary; dashboardHome: DashboardHomeDictionary; loading: LoadingDictionary; notificationPreferencesPage: NotificationPreferencesDictionary; navbar: NavbarDictionary; workflowsPage: WorkflowsPageDictionary };

const sharedNavbarItems = [{ href: "/dashboard", label: { "en-US": "Dashboard", "pt-BR": "Dashboard" } }, { href: "/patients", label: { "en-US": "Patients", "pt-BR": "Pacientes" } }, { href: "/appointments", label: { "en-US": "Appointments", "pt-BR": "Agenda" } }, { href: "/workflows", label: { "en-US": "Workflows", "pt-BR": "Workflows" } }, { href: "/marketplace", label: { "en-US": "Marketplace", "pt-BR": "Marketplace" } }, { href: "/notifications", label: { "en-US": "Notifications", "pt-BR": "Notificacoes" } }, { href: "/analytics", label: { "en-US": "Analytics", "pt-BR": "Analytics" } }, { href: "/conversations", label: { "en-US": "Conversations", "pt-BR": "Conversas" } }, { href: "/reports", label: { "en-US": "Reports", "pt-BR": "Relatorios" } }, { href: "/onboarding", label: { "en-US": "Onboarding", "pt-BR": "Onboarding" } }, { href: "/sales-os", label: { "en-US": "Sales OS", "pt-BR": "Sales OS" } }] as const;

const dictionaries: Record<SupportedLocale, Dictionary> = {
  "pt-BR": {
    consentBanner: { accept: "Aceitar analytics", description: "Usamos telemetria sem PII para medir pageviews, saude do produto e execucao de agentes. Se voce rejeitar, o tracker externo permanece desligado.", reject: "Rejeitar", settings: "Abrir central LGPD", title: "Consentimento de analytics" },
    dashboardHome: {
      alertSeverityLabels: {
        high: "Alta",
        low: "Baixa",
        medium: "Media"
      },
      attributionHeading: "Attribution",
      badge: "Home do produto",
      cacColumn: "CAC",
      clinicalDescription:
        "Baseline materno-infantil com gestacoes ativas, agenda e spotlight operacional.",
      clinicalHeading: "Resumo clinico",
      clinicalRiskLabels: {
        HIGH: "Alto",
        LOW: "Baixo",
        MODERATE: "Moderado"
      },
      clinicalStatusLabels: {
        ACTIVE: "Ativa",
        CLOSED: "Encerrada",
        DELIVERED: "Parto concluido"
      },
      consentAttentionTitle:
        "O centro de consentimento ainda precisa de atencao antes do go-live.",
      consentBadge: "LGPD pendente",
      consentLegalBasisLabels: {
        CONSENT: "consentimento",
        CONTRACT: "contrato",
        HEALTH_PROTECTION: "protecao da saude",
        LEGAL_OBLIGATION: "obrigacao legal",
        LEGITIMATE_INTEREST: "legitimo interesse"
      },
      consentStatusLabels: {
        ACCEPTED: "Aceito",
        PENDING: "Pendente",
        REJECTED: "Rejeitado"
      },
      continueLabel: "Continuar",
      continueOnboarding: "Continuar onboarding",
      conversionColumn: "Conversao",
      customerColumn: "Cliente",
      customerHealthHeading: "Saude de clientes",
      description:
        "Resumo operacional da conta com acesso direto para as jornadas principais, sem depender de URL manual.",
      executionsLabel: "execucoes",
      gestationalAgeUnknown: "Idade gestacional nao calculada",
      goLiveAlertsHeading: "Alertas de go-live",
      highlightedWorkflowsDescription:
        "Acesso rapido para editar ou executar os fluxos mais recentes.",
      highlightedWorkflowsHeading: "Workflows em destaque",
      leadsColumn: "Leads",
      noAttributionDescription:
        "A origem dos leads aparecera aqui assim que a organizacao tiver dados de atribuicao.",
      noAttributionTitle: "Sem atribuicao suficiente",
      noClinicalAlertsDescription: "Nenhum alerta clinico critico detectado no tenant ativo.",
      noClinicalAlertsTitle: "Sem alertas clinicos",
      noClinicalNote: "Sem nota clinica versionada",
      noClinicalSpotlightDescription:
        "Assim que o tenant tiver pacientes, consultas e notas clinicas, o spotlight aparece aqui.",
      noClinicalSpotlightTitle: "Sem spotlight clinico",
      noCustomerHealthDescription:
        "Assim que houver clientes vinculados, a saude operacional aparecera aqui.",
      noCustomerHealthTitle: "Sem saude calculada",
      noRecentContractsDescription:
        "Quando a organizacao tiver clientes ou contratos, eles aparecerao nesta lista.",
      noRecentContractsTitle: "Sem contratos recentes",
      noReturnScheduled: "sem retorno agendado",
      noUsageDescription: "Ainda nao ha metricas de uso para a organizacao ativa.",
      noUsageTitle: "Sem consumo registrado",
      noWorkflowsDescription:
        "Nenhum workflow criado ainda. Comece pela lista de workflows para montar o primeiro fluxo.",
      noWorkflowsTitle: "Sem workflows ativos",
      npsColumn: "NPS",
      onboardingBadge: "Onboarding guiado",
      openClinicalModule: "Abrir modulo clinico",
      openEditor: "Abrir editor",
      openPatient: "Abrir paciente",
      openQueue: "Abrir fila correspondente",
      openWorkflows: "Abrir workflows",
      planStatusLabel: "status",
      recentContractsHeading: "Contratos recentes",
      reviewConsents: "Revisar consentimentos",
      returnPrefix: "retorno",
      riskColumn: "Risco",
      scoreColumn: "Score",
      sourceColumn: "Origem",
      stepsLabel: "etapas",
      title: "Central diaria de operacao",
      usageHeading: "Uso e plano",
      viewExecutions: "Ver execucoes",
      viewFullWorkflowList: "Ver lista completa",
      viewReports: "Ver reports",
      viewSchedule: "Ver agenda",
      workflowStatusLabels: { ARCHIVED: "Arquivado", DRAFT: "Rascunho", PUBLISHED: "Publicado" },
      workflowTriggerLabels: { EVENT: "Evento", MANUAL: "Manual", SCHEDULE: "Agendado", WEBHOOK: "Webhook" }
    },
    loading: { badge: "Carregando", dashboardDescription: "Montando indicadores, workflows e billing da conta ativa.", dashboardTitle: "Carregando dashboard", workflowsDescription: "Carregando a lista de workflows, status e contagens do backend.", workflowsTitle: "Carregando workflows" },
    notificationPreferencesPage: {
      acceptCookies: "Aceitar",
      activeThemeLabel: "Tema ativo",
      badge: "Engajamento do usuario",
      cookieConsentDescription:
        "O provider de analytics so inicializa quando o consentimento estiver aceito.",
      cookieConsentHeading: "Consentimento de cookies",
      cookieStatusLabel: "Status atual",
      darkThemeLabel: "Escuro",
      description:
        "Controle email, feed in-app, idioma da interface e consentimento de analytics em um unico lugar.",
      emailNotificationsDescription:
        "Emails transacionais como workflow concluido e erro critico.",
      emailNotificationsLabel: "Emails transacionais",
      emptyFeed: "Nenhuma notificacao encontrada.",
      feedDescription: "Ultimas entradas agrupadas por recencia para leitura rapida.",
      feedHeading: "Feed de notificacoes",
      inAppNotificationsDescription: "Mantem badge e feed na navbar com polling leve.",
      inAppNotificationsLabel: "Notificacoes in-app",
      interfaceLanguageDescription:
        "Persiste o idioma por usuario e sincroniza o SSR do app em proximas navegacoes.",
      interfaceLanguageHeading: "Idioma da interface",
      interfaceLanguageLabel: "Idioma",
      lightThemeLabel: "Claro",
      loadMore: "Carregar mais",
      loadingMore: "Carregando...",
      localeLabels: { "en-US": "English (US)", "pt-BR": "Portugues (Brasil)" },
      markAllRead: "Marcar todas como lidas",
      markAsRead: "Marcar como lida",
      marketingEmailsDescription: "Exemplo de opt-out para emails promocionais.",
      marketingEmailsLabel: "Emails promocionais",
      openLink: "Abrir link",
      pushNotificationsDescription: "Fundacao pronta para web push V2 com service worker.",
      pushNotificationsLabel: "Push web",
      rejectCookies: "Rejeitar",
      signInDescription:
        "Realize login para configurar preferencias de email, in-app, idioma e telemetria.",
      signInTitle: "Notificacoes e consentimento",
      themeDescription:
        "Escolha o visual do dashboard com contraste, brilho e superficies ajustadas para light e dark mode.",
      themeHeading: "Tema do dashboard",
      title: "Notificacoes e consentimento"
    },
    navbar: {
      activateDarkTheme: "Ativar tema escuro",
      activateLightTheme: "Ativar tema claro",
      darkModeLabel: "Escuro",
      emptyDescription: "Nenhuma notificacao recente para este usuario.",
      emptyTitle: "Feed vazio",
      feedLabel: "Feed",
      identityDescription: "Experiencia conectada ao produto",
      identityTitle: "Central de Operacao",
      items: sharedNavbarItems.map((item) => ({
        href: item.href,
        label: item.label["pt-BR"]
      })),
      lightModeLabel: "Claro",
      markAllRead: "Ler tudo",
      navigationAriaLabel: "Navegacao principal",
      notificationsDescription: "Atualizacao leve em tempo real com persistencia no backend.",
      notificationsDisabledDescription:
        "Reative em preferencias para voltar a receber avisos no app.",
      notificationsDisabledTitle: "Notificacoes in-app desativadas",
      notificationsTitle: "Notificacoes",
      openDetail: "Abrir detalhe",
      openNotifications: "Abrir central de notificacoes",
      preferences: "Preferencias",
      premiumLinkLabel: "Premium",
      premiumLinkTitle: "Abrir colecao premium executiva",
      today: "Hoje",
      viewCenter: "Ver central",
      yesterday: "Ontem"
    },
    workflowsPage: {
      backHome: "Voltar para home",
      badge: "Lista canonica",
      continueEditing: "Continuar edicao",
      description:
        "Lista central de fluxos com status, trigger, CTA principal e acesso rapido ao editor real.",
      emptyDescription:
        "Crie o primeiro workflow para comecar a operar a automacao pelo produto.",
      emptyTitle: "Nenhum workflow criado",
      executionsLabel: "execucoes",
      openEditor: "Abrir editor",
      revisions: "Revisoes",
      statusLabels: { ARCHIVED: "Arquivado", DRAFT: "Rascunho", PUBLISHED: "Publicado" },
      stepsLabel: "etapas",
      title: "Operar workflows sem URL manual",
      triggerLabels: { EVENT: "Evento", MANUAL: "Manual", SCHEDULE: "Agendado", WEBHOOK: "Webhook" },
      updatedAtLabel: "Atualizado em",
      viewExecutions: "Ver execucoes"
    }
  },
  "en-US": {
    consentBanner: { accept: "Allow analytics", description: "We use telemetry without PII to measure pageviews, product health, and agent execution. If you reject it, the external tracker stays off.", reject: "Reject", settings: "Open LGPD center", title: "Analytics consent" },
    dashboardHome: {
      alertSeverityLabels: {
        high: "High",
        low: "Low",
        medium: "Medium"
      },
      attributionHeading: "Attribution",
      badge: "Product home",
      cacColumn: "CAC",
      clinicalDescription:
        "Maternal-infant baseline with active pregnancies, scheduling, and operational spotlight.",
      clinicalHeading: "Clinical summary",
      clinicalRiskLabels: {
        HIGH: "High",
        LOW: "Low",
        MODERATE: "Moderate"
      },
      clinicalStatusLabels: {
        ACTIVE: "Active",
        CLOSED: "Closed",
        DELIVERED: "Delivered"
      },
      consentAttentionTitle: "The consent center still needs attention before go-live.",
      consentBadge: "LGPD pending",
      consentLegalBasisLabels: {
        CONSENT: "consent",
        CONTRACT: "contract",
        HEALTH_PROTECTION: "health protection",
        LEGAL_OBLIGATION: "legal obligation",
        LEGITIMATE_INTEREST: "legitimate interest"
      },
      consentStatusLabels: {
        ACCEPTED: "Accepted",
        PENDING: "Pending",
        REJECTED: "Rejected"
      },
      continueLabel: "Continue",
      continueOnboarding: "Continue onboarding",
      conversionColumn: "Conversion",
      customerColumn: "Customer",
      customerHealthHeading: "Customer health",
      description:
        "Operational account summary with direct entry points into the main journeys, without relying on manual URLs.",
      executionsLabel: "executions",
      gestationalAgeUnknown: "Gestational age not calculated",
      goLiveAlertsHeading: "Go-live alerts",
      highlightedWorkflowsDescription: "Quick access to edit or run the latest flows.",
      highlightedWorkflowsHeading: "Featured workflows",
      leadsColumn: "Leads",
      noAttributionDescription:
        "Lead origin will appear here as soon as the organization has attribution data.",
      noAttributionTitle: "Not enough attribution data",
      noClinicalAlertsDescription: "No critical clinical alerts detected for the active tenant.",
      noClinicalAlertsTitle: "No clinical alerts",
      noClinicalNote: "No versioned clinical note",
      noClinicalSpotlightDescription:
        "As soon as the tenant has patients, appointments, and clinical notes, the spotlight will appear here.",
      noClinicalSpotlightTitle: "No clinical spotlight",
      noCustomerHealthDescription:
        "Once customers are linked, operational health will appear here.",
      noCustomerHealthTitle: "No health score available",
      noRecentContractsDescription:
        "When the organization has customers or contracts, they will appear in this list.",
      noRecentContractsTitle: "No recent contracts",
      noReturnScheduled: "no follow-up scheduled",
      noUsageDescription: "There are still no usage metrics for the active organization.",
      noUsageTitle: "No recorded usage",
      noWorkflowsDescription:
        "No workflow has been created yet. Start from the workflows list to build the first flow.",
      noWorkflowsTitle: "No active workflows",
      npsColumn: "NPS",
      onboardingBadge: "Guided onboarding",
      openClinicalModule: "Open clinical module",
      openEditor: "Open editor",
      openPatient: "Open patient",
      openQueue: "Open matching queue",
      openWorkflows: "Open workflows",
      planStatusLabel: "status",
      recentContractsHeading: "Recent contracts",
      reviewConsents: "Review consents",
      returnPrefix: "follow-up",
      riskColumn: "Risk",
      scoreColumn: "Score",
      sourceColumn: "Source",
      stepsLabel: "steps",
      title: "Daily operations hub",
      usageHeading: "Usage and plan",
      viewExecutions: "View executions",
      viewFullWorkflowList: "View full list",
      viewReports: "View reports",
      viewSchedule: "View schedule",
      workflowStatusLabels: { ARCHIVED: "Archived", DRAFT: "Draft", PUBLISHED: "Published" },
      workflowTriggerLabels: { EVENT: "Event", MANUAL: "Manual", SCHEDULE: "Scheduled", WEBHOOK: "Webhook" }
    },
    loading: { badge: "Loading", dashboardDescription: "Preparing account indicators, workflows, and billing data.", dashboardTitle: "Loading dashboard", workflowsDescription: "Loading workflows list, statuses, and backend counters.", workflowsTitle: "Loading workflows" },
    notificationPreferencesPage: {
      acceptCookies: "Accept",
      activeThemeLabel: "Active theme",
      badge: "User engagement",
      cookieConsentDescription:
        "The analytics provider only starts when consent is accepted.",
      cookieConsentHeading: "Cookie consent",
      cookieStatusLabel: "Current status",
      darkThemeLabel: "Dark",
      description:
        "Control email, in-app feed, interface language, and analytics consent in one place.",
      emailNotificationsDescription:
        "Transactional emails such as workflow completion and critical errors.",
      emailNotificationsLabel: "Transactional emails",
      emptyFeed: "No notifications found.",
      feedDescription: "Latest entries grouped by recency for quick review.",
      feedHeading: "Notification feed",
      inAppNotificationsDescription: "Keeps the navbar badge and feed active with light polling.",
      inAppNotificationsLabel: "In-app notifications",
      interfaceLanguageDescription:
        "Persists the language per user and syncs app SSR on subsequent navigations.",
      interfaceLanguageHeading: "Interface language",
      interfaceLanguageLabel: "Language",
      lightThemeLabel: "Light",
      loadMore: "Load more",
      loadingMore: "Loading...",
      localeLabels: { "en-US": "English (US)", "pt-BR": "Portuguese (Brazil)" },
      markAllRead: "Mark all as read",
      markAsRead: "Mark as read",
      marketingEmailsDescription: "Example opt-out for promotional emails.",
      marketingEmailsLabel: "Marketing emails",
      openLink: "Open link",
      pushNotificationsDescription: "Foundation ready for web push V2 with a service worker.",
      pushNotificationsLabel: "Web push",
      rejectCookies: "Reject",
      signInDescription:
        "Sign in to configure email, in-app, language, and telemetry preferences.",
      signInTitle: "Notifications and consent",
      themeDescription:
        "Choose the dashboard look with customized contrast, glow, and surfaces for light and dark modes.",
      themeHeading: "Dashboard theme",
      title: "Notifications and consent"
    },
    navbar: {
      activateDarkTheme: "Switch to dark theme",
      activateLightTheme: "Switch to light theme",
      darkModeLabel: "Dark",
      emptyDescription: "There are no recent notifications for this user.",
      emptyTitle: "Empty feed",
      feedLabel: "Feed",
      identityDescription: "Product-connected experience",
      identityTitle: "Operations Hub",
      items: sharedNavbarItems.map((item) => ({
        href: item.href,
        label: item.label["en-US"]
      })),
      lightModeLabel: "Light",
      markAllRead: "Mark all as read",
      navigationAriaLabel: "Primary navigation",
      notificationsDescription: "Lightweight near-real-time updates with backend persistence.",
      notificationsDisabledDescription:
        "Turn it back on in preferences to receive in-app updates again.",
      notificationsDisabledTitle: "In-app notifications are disabled",
      notificationsTitle: "Notifications",
      openDetail: "Open detail",
      openNotifications: "Open notifications center",
      preferences: "Preferences",
      premiumLinkLabel: "Premium",
      premiumLinkTitle: "Open executive premium collection",
      today: "Today",
      viewCenter: "View center",
      yesterday: "Yesterday"
    },
    workflowsPage: {
      backHome: "Back to home",
      badge: "Canonical list",
      continueEditing: "Continue editing",
      description:
        "Central workflow inventory with status, trigger, primary CTA, and quick access to the real editor.",
      emptyDescription: "Create the first workflow to start operating automation from the product.",
      emptyTitle: "No workflows created",
      executionsLabel: "executions",
      openEditor: "Open editor",
      revisions: "Revisions",
      statusLabels: { ARCHIVED: "Archived", DRAFT: "Draft", PUBLISHED: "Published" },
      stepsLabel: "steps",
      title: "Operate workflows without manual URLs",
      triggerLabels: { EVENT: "Event", MANUAL: "Manual", SCHEDULE: "Scheduled", WEBHOOK: "Webhook" },
      updatedAtLabel: "Updated on",
      viewExecutions: "View executions"
    }
  }
};

function matchSupportedLocale(input: string | null | undefined): SupportedLocale | null {
  if (!input) {
    return null;
  }

  const normalized = input.trim().toLowerCase();

  for (const locale of supportedLocales) {
    const current = locale.toLowerCase();
    const language = current.split("-")[0];

    if (normalized === current || normalized === language || normalized.startsWith(`${language}-`)) {
      return locale;
    }
  }

  return null;
}

export function parseSupportedLocale(input?: string | null): SupportedLocale | null {
  return matchSupportedLocale(input);
}

export function resolveLocale(input?: string | null): SupportedLocale {
  if (!input) {
    return defaultLocale;
  }

  const requestedLocales = input
    .split(",")
    .map((entry) => entry.split(";")[0]?.trim())
    .filter((entry): entry is string => Boolean(entry));

  for (const requestedLocale of requestedLocales) {
    const matched = parseSupportedLocale(requestedLocale);

    if (matched) {
      return matched;
    }
  }

  return defaultLocale;
}

export function getDictionary(locale: SupportedLocale = defaultLocale): Dictionary {
  return dictionaries[locale];
}

export function translateLabel(labels: Record<string, string>, key: string): string {
  return labels[key] ?? key.replaceAll("_", " ");
}

export function formatDateTime(
  locale: SupportedLocale,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(
  locale: SupportedLocale,
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPtBrDateTime(
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatDateTime("pt-BR", value, options);
}

