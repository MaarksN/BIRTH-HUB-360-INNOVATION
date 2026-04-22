import { canonicalIntegrationDomains, type CanonicalIntegrationDomain } from "../contracts/canonical.js";

export const connectorAuthTypes = [
  "oauth",
  "api_key",
  "service_account",
  "basic_auth",
  "webhook_secret"
] as const;

export type ConnectorAuthType = (typeof connectorAuthTypes)[number];

export const connectorCapabilities = [
  "crm",
  "messaging",
  "calendar",
  "marketing",
  "ads",
  "contracts",
  "payments",
  "erp",
  "analytics",
  "prospecting",
  "customer_success",
  "automation",
  "sync",
  "webhook"
] as const;

export type ConnectorCapability = (typeof connectorCapabilities)[number];

export const connectorImplementationStages = [
  "implemented",
  "partial",
  "planned"
] as const;

export type ConnectorImplementationStage = (typeof connectorImplementationStages)[number];

export interface ConnectorProviderDefinition {
  anchor: boolean;
  authTypes: readonly ConnectorAuthType[];
  capabilities: readonly ConnectorCapability[];
  defaultAuthType: ConnectorAuthType;
  defaultScopes?: readonly string[];
  description: string;
  displayName: string;
  domains: readonly CanonicalIntegrationDomain[];
  implementationStage: ConnectorImplementationStage;
  slug: string;
}

function defineProvider(input: ConnectorProviderDefinition): ConnectorProviderDefinition {
  return input;
}

export const connectorProviderCatalog = [
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "service_account"],
    capabilities: ["calendar", "messaging", "webhook", "sync"],
    defaultAuthType: "oauth",
    defaultScopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/gmail.send"
    ],
    description: "Gmail, Agenda e Meet para operacoes comerciais e notificacoes.",
    displayName: "Google Workspace",
    domains: ["calendar", "messaging"],
    implementationStage: "implemented",
    slug: "google-workspace"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "api_key"],
    capabilities: ["ads", "analytics", "sync"],
    defaultAuthType: "oauth",
    description: "Campanhas, grupos de anuncio, spend e conversoes do Google Ads.",
    displayName: "Google Ads",
    domains: ["marketing", "analytics"],
    implementationStage: "planned",
    slug: "google-ads"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth"],
    capabilities: ["ads", "analytics", "sync"],
    defaultAuthType: "oauth",
    description: "Campanhas, conjuntos, anuncios e metricas de Meta Ads.",
    displayName: "Meta Ads",
    domains: ["marketing", "analytics"],
    implementationStage: "planned",
    slug: "meta-ads"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["oauth"],
    capabilities: ["ads", "analytics", "sync"],
    defaultAuthType: "oauth",
    description: "Midia paga B2B com foco em campanhas de LinkedIn Ads.",
    displayName: "LinkedIn Ads",
    domains: ["marketing", "analytics"],
    implementationStage: "planned",
    slug: "linkedin-ads"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["api_key", "oauth"],
    capabilities: ["marketing", "sync", "webhook"],
    defaultAuthType: "api_key",
    description: "Automacao de marketing da RD com leads, listas e jornadas.",
    displayName: "RD Station Marketing",
    domains: ["marketing"],
    implementationStage: "planned",
    slug: "rd-station-marketing"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["api_key", "oauth"],
    capabilities: ["marketing", "messaging", "sync", "webhook"],
    defaultAuthType: "api_key",
    description: "Automacao, cadencias, listas e eventos do ActiveCampaign.",
    displayName: "ActiveCampaign",
    domains: ["marketing", "messaging"],
    implementationStage: "planned",
    slug: "activecampaign"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "webhook_secret"],
    capabilities: ["messaging", "webhook", "sync"],
    defaultAuthType: "oauth",
    description: "API oficial do WhatsApp Business Platform.",
    displayName: "WhatsApp Business API",
    domains: ["messaging"],
    implementationStage: "planned",
    slug: "whatsapp-business-api"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["messaging", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Mensageria transacional e atendimento via Zenvia.",
    displayName: "Zenvia",
    domains: ["messaging"],
    implementationStage: "planned",
    slug: "zenvia"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["messaging", "automation", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Construcao de jornadas e bots via Take Blip.",
    displayName: "Take Blip",
    domains: ["messaging", "automation"],
    implementationStage: "planned",
    slug: "take-blip"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "oauth", "webhook_secret"],
    capabilities: ["messaging", "customer_success", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Suporte e atendimento omnichannel via Zendesk.",
    displayName: "Zendesk",
    domains: ["messaging", "customer-success"],
    implementationStage: "planned",
    slug: "zendesk"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["webhook_secret", "oauth"],
    capabilities: ["messaging", "webhook"],
    defaultAuthType: "webhook_secret",
    description: "Alertas, comunidades e interacoes em servidores do Discord.",
    displayName: "Discord",
    domains: ["messaging"],
    implementationStage: "planned",
    slug: "discord"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "webhook_secret"],
    capabilities: ["messaging", "automation", "webhook", "sync"],
    defaultAuthType: "oauth",
    description: "Canais e notificacoes corporativas no Slack.",
    displayName: "Slack",
    domains: ["messaging", "automation"],
    implementationStage: "planned",
    slug: "slack"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["oauth", "webhook_secret"],
    capabilities: ["messaging", "calendar", "webhook", "sync"],
    defaultAuthType: "oauth",
    description: "Mensagens, reunioes e colaboracao no Microsoft Teams.",
    displayName: "Microsoft Teams",
    domains: ["messaging", "calendar"],
    implementationStage: "planned",
    slug: "microsoft-teams"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth"],
    capabilities: ["crm", "marketing", "webhook", "sync"],
    defaultAuthType: "oauth",
    defaultScopes: ["crm.objects.companies.read", "crm.objects.companies.write"],
    description: "CRM e marketing de receita com instalacao por OAuth.",
    displayName: "HubSpot",
    domains: ["crm", "marketing"],
    implementationStage: "implemented",
    slug: "hubspot"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "oauth"],
    capabilities: ["crm", "sync", "webhook"],
    defaultAuthType: "api_key",
    description: "CRM comercial da RD para pipeline e negocio.",
    displayName: "RD Station CRM",
    domains: ["crm"],
    implementationStage: "planned",
    slug: "rd-station-crm"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key"],
    capabilities: ["crm", "sync"],
    defaultAuthType: "api_key",
    description: "CRM Agendor para equipes comerciais.",
    displayName: "Agendor",
    domains: ["crm"],
    implementationStage: "planned",
    slug: "agendor"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "api_key"],
    capabilities: ["crm", "sync", "webhook"],
    defaultAuthType: "oauth",
    description: "CRM Pipedrive para pessoas, organizacoes e deals.",
    displayName: "Pipedrive",
    domains: ["crm"],
    implementationStage: "implemented",
    slug: "pipedrive"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth"],
    capabilities: ["crm", "sync", "webhook"],
    defaultAuthType: "oauth",
    description: "Salesforce para contas, leads, oportunidades e eventos.",
    displayName: "Salesforce",
    domains: ["crm"],
    implementationStage: "implemented",
    slug: "salesforce"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key"],
    capabilities: ["crm", "prospecting", "sync"],
    defaultAuthType: "api_key",
    description: "Prospeccao e qualificacao comercial via Exact Sales.",
    displayName: "Exact Sales",
    domains: ["crm", "prospecting"],
    implementationStage: "planned",
    slug: "exact-sales"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "webhook_secret"],
    capabilities: ["contracts", "webhook", "sync"],
    defaultAuthType: "oauth",
    description: "Assinatura eletronica e fluxo contratual via Clicksign.",
    displayName: "Clicksign",
    domains: ["contracts"],
    implementationStage: "partial",
    slug: "clicksign"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["contracts", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Assinatura eletronica via ZapSign.",
    displayName: "ZapSign",
    domains: ["contracts"],
    implementationStage: "planned",
    slug: "zapsign"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["contracts", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Assinatura eletronica e gestao documental via Autentique.",
    displayName: "Autentique",
    domains: ["contracts"],
    implementationStage: "planned",
    slug: "autentique"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "webhook_secret"],
    capabilities: ["contracts", "payments", "webhook", "sync"],
    defaultAuthType: "oauth",
    description: "Assinaturas e eventos de envelopes via DocuSign.",
    displayName: "DocuSign",
    domains: ["contracts", "payments"],
    implementationStage: "planned",
    slug: "docusign"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["payments", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Cobranca, assinatura e recebiveis via Asaas.",
    displayName: "Asaas",
    domains: ["payments"],
    implementationStage: "planned",
    slug: "asaas"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["payments", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Recorrencia e billing via Vindi.",
    displayName: "Vindi",
    domains: ["payments"],
    implementationStage: "planned",
    slug: "vindi"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["payments", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Pagamentos e assinaturas via Iugu.",
    displayName: "Iugu",
    domains: ["payments"],
    implementationStage: "planned",
    slug: "iugu"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["payments", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Checkout, cobranca e marketplace via Mercado Pago.",
    displayName: "Mercado Pago",
    domains: ["payments"],
    implementationStage: "planned",
    slug: "mercado-pago"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["payments", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Pagamentos e cobranca via PagSeguro.",
    displayName: "PagSeguro",
    domains: ["payments"],
    implementationStage: "planned",
    slug: "pagseguro"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["payments", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Cobranca, subscriptions e webhooks via Stripe.",
    displayName: "Stripe",
    domains: ["payments"],
    implementationStage: "partial",
    slug: "stripe"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "api_key"],
    capabilities: ["erp", "payments", "sync"],
    defaultAuthType: "oauth",
    description: "ERP financeiro com clientes, faturamento e conciliacao.",
    displayName: "Conta Azul",
    domains: ["erp", "payments"],
    implementationStage: "planned",
    slug: "conta-azul"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "api_key"],
    capabilities: ["erp", "payments", "sync", "webhook"],
    defaultAuthType: "oauth",
    description: "ERP Omie para clientes, notas e financeiro.",
    displayName: "Omie",
    domains: ["erp", "payments"],
    implementationStage: "planned",
    slug: "omie"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "basic_auth"],
    capabilities: ["erp", "sync"],
    defaultAuthType: "api_key",
    description: "ERP Sankhya para backoffice e operacao.",
    displayName: "Sankhya",
    domains: ["erp"],
    implementationStage: "planned",
    slug: "sankhya"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key"],
    capabilities: ["erp", "sync"],
    defaultAuthType: "api_key",
    description: "ERP Bling para pedidos, estoque e faturamento.",
    displayName: "Bling",
    domains: ["erp"],
    implementationStage: "planned",
    slug: "bling"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key"],
    capabilities: ["erp", "sync"],
    defaultAuthType: "api_key",
    description: "ERP Tiny para e-commerce e operacao.",
    displayName: "Tiny",
    domains: ["erp"],
    implementationStage: "planned",
    slug: "tiny"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["basic_auth", "api_key"],
    capabilities: ["erp", "sync"],
    defaultAuthType: "basic_auth",
    description: "ERP Totvs para operacoes empresariais e financeiro.",
    displayName: "Totvs",
    domains: ["erp"],
    implementationStage: "planned",
    slug: "totvs"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key"],
    capabilities: ["prospecting", "analytics", "sync"],
    defaultAuthType: "api_key",
    description: "Enriquecimento e dados de empresas via Econodata.",
    displayName: "Econodata",
    domains: ["prospecting", "analytics"],
    implementationStage: "planned",
    slug: "econodata"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key"],
    capabilities: ["prospecting", "analytics", "sync"],
    defaultAuthType: "api_key",
    description: "Dados, risco e inteligencia comercial via Neoway.",
    displayName: "Neoway",
    domains: ["prospecting", "analytics"],
    implementationStage: "planned",
    slug: "neoway"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "oauth"],
    capabilities: ["prospecting", "crm", "sync"],
    defaultAuthType: "api_key",
    description: "Enriquecimento de leads e automacao outbound via Apollo.io.",
    displayName: "Apollo.io",
    domains: ["prospecting", "crm"],
    implementationStage: "planned",
    slug: "apollo-io"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key"],
    capabilities: ["customer_success", "analytics", "sync"],
    defaultAuthType: "api_key",
    description: "Health score e operacao de customer success via SenseData.",
    displayName: "SenseData",
    domains: ["customer-success", "analytics"],
    implementationStage: "planned",
    slug: "sensedata"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["oauth", "api_key", "webhook_secret"],
    capabilities: ["customer_success", "messaging", "webhook", "sync"],
    defaultAuthType: "oauth",
    description: "Mensageria e sucesso do cliente via Intercom.",
    displayName: "Intercom",
    domains: ["customer-success", "messaging"],
    implementationStage: "planned",
    slug: "intercom"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["oauth", "service_account"],
    capabilities: ["analytics", "sync"],
    defaultAuthType: "oauth",
    description: "Eventos, atribuicao e metricas do Google Analytics 4.",
    displayName: "Google Analytics 4",
    domains: ["analytics"],
    implementationStage: "planned",
    slug: "google-analytics-4"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["oauth", "service_account"],
    capabilities: ["analytics", "sync"],
    defaultAuthType: "oauth",
    description: "Dashboards e datasets via Power BI.",
    displayName: "Power BI",
    domains: ["analytics"],
    implementationStage: "planned",
    slug: "power-bi"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["api_key", "basic_auth"],
    capabilities: ["analytics", "sync"],
    defaultAuthType: "api_key",
    description: "Consultas, colecoes e dashboards via Metabase.",
    displayName: "Metabase",
    domains: ["analytics"],
    implementationStage: "planned",
    slug: "metabase"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["automation", "webhook"],
    defaultAuthType: "api_key",
    description: "Orquestracao externa de automacoes via Make.",
    displayName: "Make",
    domains: ["automation"],
    implementationStage: "planned",
    slug: "make"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["automation", "webhook"],
    defaultAuthType: "api_key",
    description: "Automacoes conectivas de longo alcance via Zapier.",
    displayName: "Zapier",
    domains: ["automation"],
    implementationStage: "planned",
    slug: "zapier"
  }),
  defineProvider({
    anchor: true,
    authTypes: ["api_key", "webhook_secret"],
    capabilities: ["automation", "webhook", "sync"],
    defaultAuthType: "api_key",
    description: "Motor de automacao sidecar e extensibilidade self-hosted.",
    displayName: "n8n",
    domains: ["automation"],
    implementationStage: "planned",
    slug: "n8n"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["oauth", "webhook_secret"],
    capabilities: ["messaging", "webhook", "sync"],
    defaultAuthType: "oauth",
    description: "Provider legado de WhatsApp via Twilio para runtime atual.",
    displayName: "Twilio WhatsApp",
    domains: ["messaging"],
    implementationStage: "implemented",
    slug: "twilio-whatsapp"
  }),
  defineProvider({
    anchor: false,
    authTypes: ["oauth"],
    capabilities: ["calendar", "messaging", "webhook", "sync"],
    defaultAuthType: "oauth",
    defaultScopes: ["offline_access", "Calendars.ReadWrite", "Mail.Send", "User.Read"],
    description: "Camada Microsoft Graph para email, agenda e dados do M365.",
    displayName: "Microsoft Graph",
    domains: ["calendar", "messaging"],
    implementationStage: "implemented",
    slug: "microsoft-graph"
  })
] as const satisfies readonly ConnectorProviderDefinition[];

export type ConnectorProviderSlug = (typeof connectorProviderCatalog)[number]["slug"];

const connectorAuthTypeSet = new Set<ConnectorAuthType>(connectorAuthTypes);
const connectorProviderMap = new Map<ConnectorProviderSlug, ConnectorProviderDefinition>(
  connectorProviderCatalog.map((provider) => [provider.slug, provider])
);
const canonicalDomainSet = new Set<CanonicalIntegrationDomain>(canonicalIntegrationDomains);

export function isConnectorAuthType(value: string): value is ConnectorAuthType {
  return connectorAuthTypeSet.has(value as ConnectorAuthType);
}

export function isConnectorProviderSlug(value: string): value is ConnectorProviderSlug {
  return connectorProviderMap.has(value as ConnectorProviderSlug);
}

export function isCanonicalIntegrationDomain(value: string): value is CanonicalIntegrationDomain {
  return canonicalDomainSet.has(value as CanonicalIntegrationDomain);
}

export function getConnectorProviderDefinition(
  provider: ConnectorProviderSlug
): ConnectorProviderDefinition {
  return connectorProviderMap.get(provider)!;
}

export function listConnectorProviderDefinitions(): ConnectorProviderDefinition[] {
  return connectorProviderCatalog.map((provider) => ({ ...provider }));
}

export function listImplementedConnectorProviders(): ConnectorProviderDefinition[] {
  return connectorProviderCatalog
    .filter((provider) => provider.implementationStage !== "planned")
    .map((provider) => ({ ...provider }));
}

