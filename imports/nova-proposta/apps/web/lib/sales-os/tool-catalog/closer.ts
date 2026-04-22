import type { Tool } from "../types";

export const CLOSER_TOOLS: Tool[] = [
  {
    "id": "closer_warroom",
    "modules": [
      "closer"
    ],
    "name": "Deal War Room",
    "icon": "users",
    "color": "indigo",
    "emoji": "🏛️",
    "desc": "Simulação Multi-Agente",
    "prompt": "Simule um diálogo privado (formato script) entre os C-Levels da empresa sobre a compra. Revele as objeções ocultas que eles não dizem ao vendedor.",
    "fields": [
      {
        "id": "company",
        "label": "Empresa",
        "type": "text",
        "placeholder": "Ex: Enterprise Co."
      },
      {
        "id": "deal_value",
        "label": "Valor do Contrato",
        "type": "text",
        "placeholder": "Ex: R$ 500k/ano"
      },
      {
        "id": "stakeholders",
        "label": "Envolvidos",
        "type": "text",
        "placeholder": "Ex: CEO, CFO, CTO"
      }
    ]
  },
  {
    "id": "roleplay_cfo",
    "modules": [
      "closer"
    ],
    "name": "Roleplay: CFO Cético",
    "icon": "user-x",
    "color": "red",
    "emoji": "😤",
    "desc": "Negociação Tensa",
    "isChat": true,
    "prompt": "Simule uma negociação tensa com um CFO cético.",
    "persona": "Um CFO analítico, focado exclusivamente em EBITDA e redução de custos. Você odeia risco. Questione cada centavo.",
    "firstMsg": "Tenho exatos 5 minutos. Me dê um motivo financeiro para não vetar esse projeto agora."
  },
  {
    "id": "close_email",
    "modules": [
      "closer"
    ],
    "name": "Email Closer",
    "icon": "mail-check",
    "color": "sky",
    "emoji": "📧",
    "desc": "Respostas Finais",
    "prompt": "Escreva um e-mail de fechamento decisivo.",
    "fields": [
      {
        "id": "situation",
        "label": "Situação Atual",
        "type": "textarea",
        "placeholder": "Ex: Cliente pediu desconto e parou de responder..."
      },
      {
        "id": "strategy",
        "label": "Estratégia",
        "type": "select",
        "options": [
          "Desapego (Break-up)",
          "Urgência (Gatilho Temporal)",
          "Concessão Estratégica",
          "Recap de Valor"
        ]
      }
    ]
  }
];
