import type { Tool } from "../types";

export const SHARED_TOOLS: Tool[] = [
  {
    "id": "bdr_vision",
    "modules": [
      "bdr",
      "sdr"
    ],
    "name": "Vision Intel",
    "icon": "eye",
    "color": "cyan",
    "emoji": "👁️",
    "desc": "Análise de Prints",
    "prompt": "Você é um BDR Sênior. Analise esta imagem com visão computacional. Identifique oportunidades de venda. Identifique tecnologias, erros, oportunidades de melhoria e dados de contato se visíveis.",
    "acceptsImage": true,
    "fields": [
      {
        "id": "focus",
        "label": "Foco da Análise",
        "type": "select",
        "options": [
          "Tecnologias Utilizadas",
          "Estrutura do Time",
          "Dores/Gaps Visíveis",
          "Notícias/Expansão"
        ]
      },
      {
        "id": "ctx",
        "label": "Contexto Extra",
        "type": "text",
        "placeholder": "Ex: Vendemos software de RH"
      }
    ]
  },
  {
    "id": "bdr_summary",
    "modules": [
      "bdr",
      "sdr"
    ],
    "name": "Resumo Web",
    "icon": "globe",
    "color": "blue",
    "emoji": "🌐",
    "desc": "News & Dores Atuais",
    "prompt": "Realize uma pesquisa profunda na web sobre a empresa alvo. Resuma as últimas notícias, desafios financeiros e oportunidades de venda.",
    "useSearch": true,
    "fields": [
      {
        "id": "company",
        "label": "Empresa Alvo",
        "type": "text",
        "placeholder": "Ex: Coca-Cola Brasil"
      },
      {
        "id": "focus",
        "label": "O que buscar?",
        "type": "select",
        "options": [
          "Notícias Recentes",
          "Saúde Financeira/Layoffs",
          "Lançamentos de Produtos",
          "Fusões e Aquisições"
        ]
      }
    ]
  },
  {
    "id": "gen_persona",
    "modules": [
      "ldr",
      "bdr",
      "sdr",
      "closer"
    ],
    "name": "Visual Persona",
    "icon": "image",
    "color": "cyan",
    "emoji": "👤",
    "desc": "Retrato ICP",
    "prompt": "Gere um retrato fotorealista profissional de estúdio de uma persona de negócios.",
    "acceptsImage": false,
    "isImage": true,
    "fields": [
      {
        "id": "job",
        "label": "Cargo",
        "type": "text",
        "placeholder": "Ex: CEO de Startup"
      },
      {
        "id": "age",
        "label": "Idade Aprox.",
        "type": "text",
        "placeholder": "Ex: 45 anos"
      },
      {
        "id": "vibe",
        "label": "Ambiente/Vibe",
        "type": "text",
        "placeholder": "Ex: Escritório moderno, confiante"
      }
    ]
  }
];
