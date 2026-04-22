import { TOOLS } from "./constants";
import type { SalesOsModuleDefinition, SalesOsModuleId, SalesOsTool } from "./types";

export const SALES_OS_MODULES: SalesOsModuleDefinition[] = [
  {
    description: "Visao executiva, conselho, estrategia e alocacao de capital.",
    icon: "briefcase",
    id: "exec",
    subtitle: "C-Level e VPs",
    title: "Executives"
  },
  {
    description: "Prospeccao, qualificacao e descoberta antes da oportunidade entrar em venda.",
    icon: "target",
    id: "presales",
    subtitle: "SDR, BDR, LDR e afins",
    title: "Pre-Sales"
  },
  {
    description: "Fechamento, engenharia de vendas, AE, gerencia e diretoria comercial.",
    icon: "crown",
    id: "sales",
    subtitle: "AE, SE e gestao comercial",
    title: "Sales"
  },
  {
    description: "Growth, campanha, conteudo, performance e operacoes de marketing.",
    icon: "megaphone",
    id: "marketing",
    subtitle: "Growth e demand gen",
    title: "Marketing"
  },
  {
    description: "Retencao, renovacao, onboarding, suporte e experiencia do cliente.",
    icon: "life-buoy",
    id: "cs",
    subtitle: "Customer success e suporte",
    title: "CS & Support"
  },
  {
    description: "Receita, automacao, operacao comercial e inteligencia de processo.",
    icon: "activity",
    id: "revops",
    subtitle: "Ops e revenue intelligence",
    title: "RevOps"
  },
  {
    description: "Analise, modelagem, BI, ciencia de dados e observabilidade de negocio.",
    icon: "bar-chart",
    id: "data",
    subtitle: "Data e analytics",
    title: "Data & BI"
  },
  {
    description: "Financeiro, controladoria, cobranca, tesouraria e compliance interno.",
    icon: "dollar-sign",
    id: "finance",
    subtitle: "Finance, legal e admin",
    title: "Finance"
  },
  {
    description: "KYC, AML, antifraude, risco operacional e exigencias regulatorias.",
    icon: "shield-alert",
    id: "fintech",
    subtitle: "Risk e compliance",
    title: "Fintech"
  },
  {
    description: "Ferramentas taticas de qualificacao rapida e mapeamento de contas.",
    icon: "check-square",
    id: "ldr",
    subtitle: "Qualificacao",
    title: "LDR Elite"
  },
  {
    description: "Ferramentas de pesquisa, script, conteudo e enriquecimento de outbound.",
    icon: "scan-search",
    id: "bdr",
    subtitle: "Research e outreach",
    title: "BDR Intel"
  },
  {
    description: "Cadencias, simulacoes de objecao e aceleradores de prospeccao.",
    icon: "flame",
    id: "sdr",
    subtitle: "Outbound e conversao",
    title: "SDR Hunter"
  },
  {
    description: "Negociacao, boardroom selling, fechamento e emails decisivos.",
    icon: "users",
    id: "closer",
    subtitle: "Closing e negociacao",
    title: "Closer Elite"
  }
];

export const salesOsTools: SalesOsTool[] = TOOLS;

export const salesOsModuleMap = SALES_OS_MODULES.reduce<Record<SalesOsModuleId, SalesOsModuleDefinition>>(
  (accumulator, moduleDefinition) => {
    accumulator[moduleDefinition.id] = moduleDefinition;
    return accumulator;
  },
  {} as Record<SalesOsModuleId, SalesOsModuleDefinition>
);

export function getSalesOsToolsByModule(moduleId: SalesOsModuleId): SalesOsTool[] {
  return salesOsTools.filter((tool) => tool.modules.includes(moduleId));
}

export function findSalesOsTool(toolId: string): SalesOsTool | undefined {
  return salesOsTools.find((tool) => tool.id === toolId);
}

