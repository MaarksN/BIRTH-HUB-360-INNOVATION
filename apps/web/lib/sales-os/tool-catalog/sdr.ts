import type { Tool } from "../types";

export const SDR_TOOLS: Tool[] = [
  {
    "id": "roleplay_gk",
    "modules": [
      "sdr"
    ],
    "name": "Roleplay: Secretária",
    "icon": "shield",
    "color": "orange",
    "emoji": "🛡️",
    "desc": "Simulador em Chat",
    "isChat": true,
    "prompt": "Simule uma conversa com uma secretária executiva.",
    "persona": "Uma secretária executiva protetora e experiente. Sua missão é bloquear vendedores. Use desculpas como \"está em reunião\", \"mande por email\". Seja difícil.",
    "firstMsg": "Bom dia, escritório da Diretoria. Quem deseja falar?"
  },
  {
    "id": "sdr_cadence",
    "modules": [
      "sdr"
    ],
    "name": "Cadência Total",
    "icon": "layers",
    "color": "rose",
    "emoji": "📅",
    "desc": "Fluxo de Prospecção",
    "prompt": "Crie uma cadência de prospecção outbound multicanal (Email, LinkedIn, Fone).",
    "fields": [
      {
        "id": "persona",
        "label": "Persona Alvo",
        "type": "text",
        "placeholder": "Ex: Gerente de Logística"
      },
      {
        "id": "sector",
        "label": "Setor",
        "type": "text",
        "placeholder": "Ex: Varejo"
      },
      {
        "id": "duration",
        "label": "Duração",
        "type": "select",
        "options": [
          "15 Dias (Agressiva)",
          "30 Dias (Consultiva)"
        ]
      }
    ]
  },
  {
    "id": "sdr_coldcall",
    "modules": [
      "sdr"
    ],
    "name": "Cold Call Sim",
    "icon": "phone-incoming",
    "color": "orange",
    "emoji": "📞",
    "desc": "Simulador de Objeções",
    "prompt": "Atue como um prospect que recebeu uma ligação fria. Critique o pitch e ofereça uma objeção difícil.",
    "fields": [
      {
        "id": "pitch",
        "label": "Seu Pitch Inicial",
        "type": "textarea",
        "placeholder": "Cole aqui como você começa a ligação..."
      },
      {
        "id": "difficulty",
        "label": "Nível de Dificuldade",
        "type": "select",
        "options": [
          "Fácil (Curioso)",
          "Médio (Cético)",
          "Difícil (Ocupado/Rude)"
        ]
      }
    ]
  }
];
