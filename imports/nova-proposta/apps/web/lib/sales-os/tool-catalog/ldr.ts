import type { Tool } from "../types";

export const LDR_TOOLS: Tool[] = [
  {
    "id": "ldr_qualify",
    "modules": [
      "ldr"
    ],
    "name": "Lead Qualifier",
    "icon": "check-square",
    "color": "emerald",
    "emoji": "✅",
    "desc": "Filtro de ICP",
    "prompt": "Você é um Lead Development Representative. Analise os dados do prospect e verifique se ele se encaixa no Ideal Customer Profile (ICP).",
    "fields": [
      {
        "id": "company_data",
        "label": "Dados da Empresa",
        "type": "textarea",
        "placeholder": "Setor, Tamanho, Faturamento..."
      },
      {
        "id": "icp_criteria",
        "label": "Critérios ICP",
        "type": "text",
        "placeholder": "Ex: Startups Series A+, BR/US"
      }
    ]
  },
  {
    "id": "ldr_list",
    "modules": [
      "ldr"
    ],
    "name": "List Builder",
    "icon": "list-plus",
    "color": "emerald",
    "emoji": "📋",
    "desc": "Mapeamento de Contas",
    "prompt": "Crie uma lista de contas alvo (Target Accounts) baseada em um setor e região específicos.",
    "fields": [
      {
        "id": "sector",
        "label": "Setor Alvo",
        "type": "text",
        "placeholder": "Ex: SaaS de Logística"
      },
      {
        "id": "region",
        "label": "Região",
        "type": "text",
        "placeholder": "Ex: América Latina"
      }
    ]
  }
];
