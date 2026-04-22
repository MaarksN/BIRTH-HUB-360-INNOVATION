import type { Tool } from "../types";

export const SALES_TOOLS: Tool[] = [
  {
    "id": "sales_deckcustomizer",
    "modules": [
      "sales"
    ],
    "name": "DeckCustomizer",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Cria uma apresentaÃ§Ã£o de vendas (Pitch Deck) Ãºnica para cada reuniÃ£o, inserindo o logo do cliente, mÃ©tricas do setor e dores mapeadas.",
    "prompt": "VocÃª Ã© um DeckCustomizer atuando como Account Executive (AE). Cria uma apresentaÃ§Ã£o de vendas (Pitch Deck) Ãºnica para cada reuniÃ£o, inserindo o logo do cliente, mÃ©tricas do setor e dores mapeadas.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_mutualactiontracker",
    "modules": [
      "sales"
    ],
    "name": "MutualActionTracker",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Gerencia o Plano de AÃ§Ã£o MÃºtua (MAP) com o cliente, enviando lembretes automatizados de prÃ³ximos passos e prazos.",
    "prompt": "VocÃª Ã© um MutualActionTracker atuando como Account Executive (AE). Gerencia o Plano de AÃ§Ã£o MÃºtua (MAP) com o cliente, enviando lembretes automatizados de prÃ³ximos passos e prazos.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_contractdrafter",
    "modules": [
      "sales"
    ],
    "name": "ContractDrafter",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Gera o rascunho do contrato em segundos, ajustando clÃ¡usulas comerciais baseadas no que foi combinado verbalmente na gravaÃ§Ã£o da reuniÃ£o.",
    "prompt": "VocÃª Ã© um ContractDrafter atuando como Account Executive (AE). Gera o rascunho do contrato em segundos, ajustando clÃ¡usulas comerciais baseadas no que foi combinado verbalmente na gravaÃ§Ã£o da reuniÃ£o.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_roicalculatorbuilder",
    "modules": [
      "sales"
    ],
    "name": "ROICalculatorBuilder",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "ConstrÃ³i um Business Case financeiro personalizado provando o retorno sobre o investimento (ROI) especÃ­fico para o cenÃ¡rio do lead.",
    "prompt": "VocÃª Ã© um ROICalculatorBuilder atuando como Account Executive (AE). ConstrÃ³i um Business Case financeiro personalizado provando o retorno sobre o investimento (ROI) especÃ­fico para o cenÃ¡rio do lead.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_objectionflashcard",
    "modules": [
      "sales"
    ],
    "name": "ObjectionFlashcard",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Fornece argumentos rÃ¡pidos na tela do AE sobre como justificar preÃ§o quando o cliente diz \"estÃ¡ muito caro\".",
    "prompt": "VocÃª Ã© um ObjectionFlashcard atuando como Account Executive (AE). Fornece argumentos rÃ¡pidos na tela do AE sobre como justificar preÃ§o quando o cliente diz \"estÃ¡ muito caro\".",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_orgnav",
    "modules": [
      "sales"
    ],
    "name": "OrgNav",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Mapeia a complexa teia polÃ­tica de empresas Fortune 500, indicando quem tem o poder de veto e quem assina o cheque.",
    "prompt": "VocÃª Ã© um OrgNav atuando como Enterprise Account Executive. Mapeia a complexa teia polÃ­tica de empresas Fortune 500, indicando quem tem o poder de veto e quem assina o cheque.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_rfpautoresponder",
    "modules": [
      "sales"
    ],
    "name": "RFPAutoResponder",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Preenche planilhas de RFP (Request for Proposal) e RFI de 300 pÃ¡ginas automaticamente buscando na base de conhecimento da empresa.",
    "prompt": "VocÃª Ã© um RFPAutoResponder atuando como Enterprise Account Executive. Preenche planilhas de RFP (Request for Proposal) e RFI de 300 pÃ¡ginas automaticamente buscando na base de conhecimento da empresa.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_execsummarygenerator",
    "modules": [
      "sales"
    ],
    "name": "ExecSummaryGenerator",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Escreve o \"Resumo Executivo\" perfeito focado puramente em impacto financeiro para ser enviado aos CFOs dos clientes.",
    "prompt": "VocÃª Ã© um ExecSummaryGenerator atuando como Enterprise Account Executive. Escreve o \"Resumo Executivo\" perfeito focado puramente em impacto financeiro para ser enviado aos CFOs dos clientes.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_multiyeardealmodeller",
    "modules": [
      "sales"
    ],
    "name": "MultiYearDealModeller",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Modela estruturas complexas de contratos de 3 a 5 anos com gatilhos de expansÃ£o de preÃ§o progressivos.",
    "prompt": "VocÃª Ã© um MultiYearDealModeller atuando como Enterprise Account Executive. Modela estruturas complexas de contratos de 3 a 5 anos com gatilhos de expansÃ£o de preÃ§o progressivos.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_procurementhacker",
    "modules": [
      "sales"
    ],
    "name": "ProcurementHacker",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Guia o AE atravÃ©s do labirinto do setor de Compras (Procurement) do cliente, prevendo que tipo de concessÃµes eles vÃ£o exigir.",
    "prompt": "VocÃª Ã© um ProcurementHacker atuando como Enterprise Account Executive. Guia o AE atravÃ©s do labirinto do setor de Compras (Procurement) do cliente, prevendo que tipo de concessÃµes eles vÃ£o exigir.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_fastquoter",
    "modules": [
      "sales"
    ],
    "name": "FastQuoter",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Gera orÃ§amentos rÃ¡pidos e precisos para ciclos de vendas curtos, aplicando promoÃ§Ãµes do dia automaticamente.",
    "prompt": "VocÃª Ã© um FastQuoter atuando como Inside Sales Representative. Gera orÃ§amentos rÃ¡pidos e precisos para ciclos de vendas curtos, aplicando promoÃ§Ãµes do dia automaticamente.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_demoscripter",
    "modules": [
      "sales"
    ],
    "name": "DemoScripter",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Cria roteiros curtos e impactantes de demonstraÃ§Ã£o de produto de 15 minutos, focados apenas nos botÃµes que importam para o lead.",
    "prompt": "VocÃª Ã© um DemoScripter atuando como Inside Sales Representative. Cria roteiros curtos e impactantes de demonstraÃ§Ã£o de produto de 15 minutos, focados apenas nos botÃµes que importam para o lead.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_ghostingpreventer",
    "modules": [
      "sales"
    ],
    "name": "GhostingPreventer",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Identifica leads que pararam de responder (ghosting) e aciona campanhas de reengajamento baseadas em urgÃªncia.",
    "prompt": "VocÃª Ã© um GhostingPreventer atuando como Inside Sales Representative. Identifica leads que pararam de responder (ghosting) e aciona campanhas de reengajamento baseadas em urgÃªncia.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_discountapprover",
    "modules": [
      "sales"
    ],
    "name": "DiscountApprover",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Analisa o perfil do cliente e autoriza descontos de atÃ© X% em tempo real sem precisar pedir para o gerente.",
    "prompt": "VocÃª Ã© um DiscountApprover atuando como Inside Sales Representative. Analisa o perfil do cliente e autoriza descontos de atÃ© X% em tempo real sem precisar pedir para o gerente.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_paymentlinksender",
    "modules": [
      "sales"
    ],
    "name": "PaymentLinkSender",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Cria links de pagamento integrados ao contrato e envia por WhatsApp/Email no momento exato do \"Sim\" verbal.",
    "prompt": "VocÃª Ã© um PaymentLinkSender atuando como Inside Sales Representative. Cria links de pagamento integrados ao contrato e envia por WhatsApp/Email no momento exato do \"Sim\" verbal.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_productfeedbacklooper",
    "modules": [
      "sales"
    ],
    "name": "ProductFeedbackLooper",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Traduz as rejeiÃ§Ãµes de vendas em relatÃ³rios diretos para o time de Produto informando quais features faltam para vender mais.",
    "prompt": "VocÃª Ã© um ProductFeedbackLooper atuando como Founding Sales AE. Traduz as rejeiÃ§Ãµes de vendas em relatÃ³rios diretos para o time de Produto informando quais features faltam para vender mais.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_icprefiner",
    "modules": [
      "sales"
    ],
    "name": "ICPRefiner",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Ajusta continuamente o Perfil de Cliente Ideal (ICP), aprendendo com quem estÃ¡ comprando os primeiros produtos da startup.",
    "prompt": "VocÃª Ã© um ICPRefiner atuando como Founding Sales AE. Ajusta continuamente o Perfil de Cliente Ideal (ICP), aprendendo com quem estÃ¡ comprando os primeiros produtos da startup.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_playbookcreator",
    "modules": [
      "sales"
    ],
    "name": "PlaybookCreator",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Documenta cada vitÃ³ria e derrota em vendas para transformar o conhecimento empÃ­rico do fundador em um manual repetÃ­vel.",
    "prompt": "VocÃª Ã© um PlaybookCreator atuando como Founding Sales AE. Documenta cada vitÃ³ria e derrota em vendas para transformar o conhecimento empÃ­rico do fundador em um manual repetÃ­vel.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_earlyadopternurturer",
    "modules": [
      "sales"
    ],
    "name": "EarlyAdopterNurturer",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Cria programas especiais e benefÃ­cios personalizados para seduzir os primeiros clientes arriscados a fecharem negÃ³cio.",
    "prompt": "VocÃª Ã© um EarlyAdopterNurturer atuando como Founding Sales AE. Cria programas especiais e benefÃ­cios personalizados para seduzir os primeiros clientes arriscados a fecharem negÃ³cio.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_pricingtester",
    "modules": [
      "sales"
    ],
    "name": "PricingTester",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Realiza testes A/B invisÃ­veis em propostas de vendas para ajudar os fundadores a descobrir o teto de preÃ§o do mercado.",
    "prompt": "VocÃª Ã© um PricingTester atuando como Founding Sales AE. Realiza testes A/B invisÃ­veis em propostas de vendas para ajudar os fundadores a descobrir o teto de preÃ§o do mercado.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_demosandboxer",
    "modules": [
      "sales"
    ],
    "name": "DemoSandboxer",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Provisiona ambientes de teste (Sandboxes) com dados fictÃ­cios ultra-realistas que imitam a realidade do cliente em minutos.",
    "prompt": "VocÃª Ã© um DemoSandboxer atuando como Sales Engineer (SE). Provisiona ambientes de teste (Sandboxes) com dados fictÃ­cios ultra-realistas que imitam a realidade do cliente em minutos.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_securityquestionnairefiller",
    "modules": [
      "sales"
    ],
    "name": "SecurityQuestionnaireFiller",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Responde questionÃ¡rios de seguranÃ§a (InfoSec) complexos baseando-se em respostas histÃ³ricas e certificaÃ§Ãµes da empresa (SOC2, ISO).",
    "prompt": "VocÃª Ã© um SecurityQuestionnaireFiller atuando como Sales Engineer (SE). Responde questionÃ¡rios de seguranÃ§a (InfoSec) complexos baseando-se em respostas histÃ³ricas e certificaÃ§Ãµes da empresa (SOC2, ISO).",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_architecturediagrammer",
    "modules": [
      "sales"
    ],
    "name": "ArchitectureDiagrammer",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Ouve a conversa tÃ©cnica com o cliente e gera automaticamente o diagrama arquitetural da integraÃ§Ã£o via API.",
    "prompt": "VocÃª Ã© um ArchitectureDiagrammer atuando como Sales Engineer (SE). Ouve a conversa tÃ©cnica com o cliente e gera automaticamente o diagrama arquitetural da integraÃ§Ã£o via API.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_techobjectionresolver",
    "modules": [
      "sales"
    ],
    "name": "TechObjectionResolver",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Vasculha documentaÃ§Ã£o de API, fÃ³runs do GitHub e o Slack interno para responder perguntas tÃ©cnicas complexas em tempo real na call.",
    "prompt": "VocÃª Ã© um TechObjectionResolver atuando como Sales Engineer (SE). Vasculha documentaÃ§Ã£o de API, fÃ³runs do GitHub e o Slack interno para responder perguntas tÃ©cnicas complexas em tempo real na call.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_poctracker",
    "modules": [
      "sales"
    ],
    "name": "PoCTracker",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Monitora a Prova de Conceito (PoC) rodando no cliente, alertando o SE se o cliente nÃ£o estÃ¡ logando ou usando as features-chave testadas.",
    "prompt": "VocÃª Ã© um PoCTracker atuando como Sales Engineer (SE). Monitora a Prova de Conceito (PoC) rodando no cliente, alertando o SE se o cliente nÃ£o estÃ¡ logando ou usando as features-chave testadas.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_valuealigner",
    "modules": [
      "sales"
    ],
    "name": "ValueAligner",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Traduz as caracterÃ­sticas tÃ©cnicas do software diretamente para mÃ©tricas de negÃ³cios que o board do cliente entende.",
    "prompt": "VocÃª Ã© um ValueAligner atuando como Solutions Consultant. Traduz as caracterÃ­sticas tÃ©cnicas do software diretamente para mÃ©tricas de negÃ³cios que o board do cliente entende.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_usecasegenerator",
    "modules": [
      "sales"
    ],
    "name": "UseCaseGenerator",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Vasculha o banco de dados da empresa e constrÃ³i estudos de caso relevantes baseados no nicho exato do cliente atual.",
    "prompt": "VocÃª Ã© um UseCaseGenerator atuando como Solutions Consultant. Vasculha o banco de dados da empresa e constrÃ³i estudos de caso relevantes baseados no nicho exato do cliente atual.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_roiscenariomodeler",
    "modules": [
      "sales"
    ],
    "name": "ROIScenarioModeler",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Cria trÃªs cenÃ¡rios financeiros (Conservador, Realista, Otimista) para o cliente levar para aprovaÃ§Ã£o interna.",
    "prompt": "VocÃª Ã© um ROIScenarioModeler atuando como Solutions Consultant. Cria trÃªs cenÃ¡rios financeiros (Conservador, Realista, Otimista) para o cliente levar para aprovaÃ§Ã£o interna.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_techstackauditor",
    "modules": [
      "sales"
    ],
    "name": "TechStackAuditor",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Analisa a infraestrutura atual do cliente e identifica pontos de conflito ou redundÃ¢ncia com o software que estÃ¡ sendo vendido.",
    "prompt": "VocÃª Ã© um TechStackAuditor atuando como Solutions Consultant. Analisa a infraestrutura atual do cliente e identifica pontos de conflito ou redundÃ¢ncia com o software que estÃ¡ sendo vendido.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_executivedemocurator",
    "modules": [
      "sales"
    ],
    "name": "ExecutiveDemoCurator",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Adapta a demonstraÃ§Ã£o padrÃ£o para um nÃ­vel executivo, removendo jargÃµes tÃ©cnicos e focando em \"VisÃ£o e Futuro\".",
    "prompt": "VocÃª Ã© um ExecutiveDemoCurator atuando como Solutions Consultant. Adapta a demonstraÃ§Ã£o padrÃ£o para um nÃ­vel executivo, removendo jargÃµes tÃ©cnicos e focando em \"VisÃ£o e Futuro\".",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_pipelineinspector",
    "modules": [
      "sales"
    ],
    "name": "PipelineInspector",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Audita o funil de vendas dos representantes, destacando negÃ³cios \"estagnados\" ou com datas de fechamento irreais.",
    "prompt": "VocÃª Ã© um PipelineInspector atuando como Gerente Comercial. Audita o funil de vendas dos representantes, destacando negÃ³cios \"estagnados\" ou com datas de fechamento irreais.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_oneononeprep",
    "modules": [
      "sales"
    ],
    "name": "OneOnOnePrep",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Prepara a pauta da reuniÃ£o 1:1 com cada vendedor, destacando as mÃ©tricas de performance e os 3 principais negÃ³cios para revisar.",
    "prompt": "VocÃª Ã© um OneOnOnePrep atuando como Gerente Comercial. Prepara a pauta da reuniÃ£o 1:1 com cada vendedor, destacando as mÃ©tricas de performance e os 3 principais negÃ³cios para revisar.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_dealatriskalerter",
    "modules": [
      "sales"
    ],
    "name": "DealAtRiskAlerter",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Cruza dados de sentimento de e-mail e tempo sem contato para avisar o gerente quais negÃ³cios importantes correm risco de perda.",
    "prompt": "VocÃª Ã© um DealAtRiskAlerter atuando como Gerente Comercial. Cruza dados de sentimento de e-mail e tempo sem contato para avisar o gerente quais negÃ³cios importantes correm risco de perda.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_winlossanalyzer",
    "modules": [
      "sales"
    ],
    "name": "WinLossAnalyzer",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Entrevista clientes perdidos via chat automatizado e consolida os motivos reais pelos quais a empresa estÃ¡ perdendo ou ganhando vendas.",
    "prompt": "VocÃª Ã© um WinLossAnalyzer atuando como Gerente Comercial. Entrevista clientes perdidos via chat automatizado e consolida os motivos reais pelos quais a empresa estÃ¡ perdendo ou ganhando vendas.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_discountleakguard",
    "modules": [
      "sales"
    ],
    "name": "DiscountLeakGuard",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Monitora a concessÃ£o de descontos do time e alerta se um vendedor especÃ­fico estÃ¡ impactando as margens abusivamente.",
    "prompt": "VocÃª Ã© um DiscountLeakGuard atuando como Gerente Comercial. Monitora a concessÃ£o de descontos do time e alerta se um vendedor especÃ­fico estÃ¡ impactando as margens abusivamente.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_marketexpansionmodeler",
    "modules": [
      "sales"
    ],
    "name": "MarketExpansionModeler",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Analisa dados geogrÃ¡ficos e econÃ´micos para recomendar quais novas cidades ou paÃ­ses o time deve atacar no prÃ³ximo ano.",
    "prompt": "VocÃª Ã© um MarketExpansionModeler atuando como Diretor de Vendas. Analisa dados geogrÃ¡ficos e econÃ´micos para recomendar quais novas cidades ou paÃ­ses o time deve atacar no prÃ³ximo ano.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_quotasetter",
    "modules": [
      "sales"
    ],
    "name": "QuotaSetter",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Distribui as cotas anuais de vendas baseadas no potencial de cada regiÃ£o, garantindo que a meta global da empresa seja atingida.",
    "prompt": "VocÃª Ã© um QuotaSetter atuando como Diretor de Vendas. Distribui as cotas anuais de vendas baseadas no potencial de cada regiÃ£o, garantindo que a meta global da empresa seja atingida.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_compplancalculator",
    "modules": [
      "sales"
    ],
    "name": "CompPlanCalculator",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Simula milhares de variaÃ§Ãµes de planos de remuneraÃ§Ã£o para encontrar o modelo que maximize lucro e retenha vendedores top-performers.",
    "prompt": "VocÃª Ã© um CompPlanCalculator atuando como Diretor de Vendas. Simula milhares de variaÃ§Ãµes de planos de remuneraÃ§Ã£o para encontrar o modelo que maximize lucro e retenha vendedores top-performers.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_leaderboardbroadcaster",
    "modules": [
      "sales"
    ],
    "name": "LeaderboardBroadcaster",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Gera relatÃ³rios semanais narrados para a empresa inteira, celebrando as vitÃ³rias e destacando os melhores vendedores.",
    "prompt": "VocÃª Ã© um LeaderboardBroadcaster atuando como Diretor de Vendas. Gera relatÃ³rios semanais narrados para a empresa inteira, celebrando as vitÃ³rias e destacando os melhores vendedores.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "sales_strategicalliancescout",
    "modules": [
      "sales"
    ],
    "name": "StrategicAllianceScout",
    "icon": "crown",
    "color": "brand-gold",
    "emoji": "ðŸ¤–",
    "desc": "Identifica e gera planos de negÃ³cios para estabelecer parcerias com grandes integradores ou consultorias.",
    "prompt": "VocÃª Ã© um StrategicAllianceScout atuando como Diretor de Vendas. Identifica e gera planos de negÃ³cios para estabelecer parcerias com grandes integradores ou consultorias.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  }
];
