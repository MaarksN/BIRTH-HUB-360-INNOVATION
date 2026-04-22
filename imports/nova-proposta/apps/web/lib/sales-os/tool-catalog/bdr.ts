import type { Tool } from "../types";

export const BDR_TOOLS: Tool[] = [
  {
    "id": "bdr_content",
    "modules": [
      "bdr"
    ],
    "name": "Ghostwriter",
    "icon": "pen-tool",
    "color": "pink",
    "emoji": "👻",
    "desc": "LinkedIn Viral",
    "prompt": "Você é um Copywriter Top Voice do LinkedIn especializado em B2B. Crie um post viral e educativo.",
    "fields": [
      {
        "id": "topic",
        "label": "Tema do Post",
        "type": "text",
        "placeholder": "Ex: Erros na contratação de Tech"
      },
      {
        "id": "audience",
        "label": "Público Alvo",
        "type": "text",
        "placeholder": "Ex: CTOs de Startups"
      },
      {
        "id": "style",
        "label": "Estilo",
        "type": "select",
        "options": [
          "Polêmico/Contrarian",
          "Storytelling Emocional",
          "Lista Prática (How-to)",
          "Análise de Dados"
        ]
      }
    ]
  },
  {
    "id": "bdr_script",
    "modules": [
      "bdr"
    ],
    "name": "Script BDR",
    "icon": "zap",
    "color": "indigo",
    "emoji": "📝",
    "desc": "AIDA & Persuasão",
    "prompt": "Você é um especialista em Cold Calling e Scripts. Crie um roteiro de abordagem fria altamente persuasivo.",
    "fields": [
      {
        "id": "prospect",
        "label": "Cargo do Lead",
        "type": "text",
        "placeholder": "Ex: Diretor de Marketing"
      },
      {
        "id": "company",
        "label": "Nome da Empresa",
        "type": "text",
        "placeholder": "Ex: Fintech X"
      },
      {
        "id": "value_prop",
        "label": "Proposta de Valor",
        "type": "textarea",
        "placeholder": "Ex: Reduzimos o CAC em 30%..."
      },
      {
        "id": "framework",
        "label": "Framework",
        "type": "select",
        "options": [
          "AIDA (Atenção, Interesse...)",
          "PAS (Problema, Agitação...)",
          "Depoimento/Prova Social"
        ]
      }
    ]
  }
];
