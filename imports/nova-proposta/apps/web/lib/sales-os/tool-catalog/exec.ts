import type { Tool } from "../types";

export const EXEC_TOOLS: Tool[] = [
  {
    "id": "exec_boardprep_ai",
    "modules": [
      "exec"
    ],
    "name": "BoardPrep AI",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Analisa os resultados da empresa e cria automaticamente apresentaÃ§Ãµes, relatÃ³rios e narrativas para reuniÃµes de conselho (Board of Directors).",
    "prompt": "VocÃª Ã© um BoardPrep AI atuando como CEO (Chief Executive Officer). Analisa os resultados da empresa e cria automaticamente apresentaÃ§Ãµes, relatÃ³rios e narrativas para reuniÃµes de conselho (Board of Directors).",
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
    "id": "exec_marketsentinel",
    "modules": [
      "exec"
    ],
    "name": "MarketSentinel",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Monitora movimentos macroeconÃ´micos, fusÃµes e aquisiÃ§Ãµes (M&A) e notÃ­cias de concorrentes para sugerir pivotagens estratÃ©gicas em tempo real.",
    "prompt": "VocÃª Ã© um MarketSentinel atuando como CEO (Chief Executive Officer). Monitora movimentos macroeconÃ´micos, fusÃµes e aquisiÃ§Ãµes (M&A) e notÃ­cias de concorrentes para sugerir pivotagens estratÃ©gicas em tempo real.",
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
    "id": "exec_culturepulse",
    "modules": [
      "exec"
    ],
    "name": "CulturePulse",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Analisa comunicaÃ§Ãµes internas (Slack/Teams) de forma anÃ´nima para medir o moral da empresa e prever riscos de turnover de talentos-chave.",
    "prompt": "VocÃª Ã© um CulturePulse atuando como CEO (Chief Executive Officer). Analisa comunicaÃ§Ãµes internas (Slack/Teams) de forma anÃ´nima para medir o moral da empresa e prever riscos de turnover de talentos-chave.",
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
    "id": "exec_crisisnavigator",
    "modules": [
      "exec"
    ],
    "name": "CrisisNavigator",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Em caso de crises (PR, vazamento de dados), gera planos de contingÃªncia instantÃ¢neos, rascunhos de comunicados de imprensa e roteiros de respostas.",
    "prompt": "VocÃª Ã© um CrisisNavigator atuando como CEO (Chief Executive Officer). Em caso de crises (PR, vazamento de dados), gera planos de contingÃªncia instantÃ¢neos, rascunhos de comunicados de imprensa e roteiros de respostas.",
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
    "id": "exec_capitalallocator",
    "modules": [
      "exec"
    ],
    "name": "CapitalAllocator",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Simula cenÃ¡rios de alocaÃ§Ã£o de capital e ROI a longo prazo para ajudar na decisÃ£o de onde investir recursos financeiros.",
    "prompt": "VocÃª Ã© um CapitalAllocator atuando como CEO (Chief Executive Officer). Simula cenÃ¡rios de alocaÃ§Ã£o de capital e ROI a longo prazo para ajudar na decisÃ£o de onde investir recursos financeiros.",
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
    "id": "exec_pipelineoracle",
    "modules": [
      "exec"
    ],
    "name": "PipelineOracle",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "PrevisÃ£o preditiva avanÃ§ada que cruza dados histÃ³ricos para estimar o fechamento de receita com 99% de precisÃ£o.",
    "prompt": "VocÃª Ã© um PipelineOracle atuando como CRO (Chief Revenue Officer). PrevisÃ£o preditiva avanÃ§ada que cruza dados histÃ³ricos para estimar o fechamento de receita com 99% de precisÃ£o.",
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
    "id": "exec_churndeflector",
    "modules": [
      "exec"
    ],
    "name": "ChurnDeflector",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Identifica sinais precoces de cancelamento em toda a base de clientes e aciona gatilhos de retenÃ§Ã£o automÃ¡ticos.",
    "prompt": "VocÃª Ã© um ChurnDeflector atuando como CRO (Chief Revenue Officer). Identifica sinais precoces de cancelamento em toda a base de clientes e aciona gatilhos de retenÃ§Ã£o automÃ¡ticos.",
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
    "id": "exec_pricingoptimizer",
    "modules": [
      "exec"
    ],
    "name": "PricingOptimizer",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Analisa a elasticidade de preÃ§o, custos e concorrÃªncia para sugerir ajustes dinÃ¢micos nas tabelas de preÃ§os e maximizar a margem.",
    "prompt": "VocÃª Ã© um PricingOptimizer atuando como CRO (Chief Revenue Officer). Analisa a elasticidade de preÃ§o, custos e concorrÃªncia para sugerir ajustes dinÃ¢micos nas tabelas de preÃ§os e maximizar a margem.",
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
    "id": "exec_expansionmapper",
    "modules": [
      "exec"
    ],
    "name": "ExpansionMapper",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Varre a base de clientes atual para encontrar oportunidades ocultas de cross-sell e up-sell, criando o pitch perfeito para cada uma.",
    "prompt": "VocÃª Ã© um ExpansionMapper atuando como CRO (Chief Revenue Officer). Varre a base de clientes atual para encontrar oportunidades ocultas de cross-sell e up-sell, criando o pitch perfeito para cada uma.",
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
    "id": "exec_quotaarchitect",
    "modules": [
      "exec"
    ],
    "name": "QuotaArchitect",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Desenha e simula modelos complexos de comissionamento e metas de vendas para garantir a motivaÃ§Ã£o do time e a saÃºde financeira.",
    "prompt": "VocÃª Ã© um QuotaArchitect atuando como CRO (Chief Revenue Officer). Desenha e simula modelos complexos de comissionamento e metas de vendas para garantir a motivaÃ§Ã£o do time e a saÃºde financeira.",
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
    "id": "exec_brandguardian",
    "modules": [
      "exec"
    ],
    "name": "BrandGuardian",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Monitora todas as campanhas, textos e imagens gerados pela empresa para garantir 100% de aderÃªncia ao tom de voz e manual da marca.",
    "prompt": "VocÃª Ã© um BrandGuardian atuando como CMO (Chief Marketing Officer). Monitora todas as campanhas, textos e imagens gerados pela empresa para garantir 100% de aderÃªncia ao tom de voz e manual da marca.",
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
    "id": "exec_trendcatcher",
    "modules": [
      "exec"
    ],
    "name": "TrendCatcher",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Analisa bilhÃµes de pontos de dados sociais para identificar tendÃªncias emergentes antes que viralizem, sugerindo campanhas proativas.",
    "prompt": "VocÃª Ã© um TrendCatcher atuando como CMO (Chief Marketing Officer). Analisa bilhÃµes de pontos de dados sociais para identificar tendÃªncias emergentes antes que viralizem, sugerindo campanhas proativas.",
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
    "id": "exec_budgetfluid",
    "modules": [
      "exec"
    ],
    "name": "BudgetFluid",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Agente autÃ´nomo que realoca o orÃ§amento de marketing entre canais (Meta, Google, LinkedIn) em tempo real, focado no menor CAC.",
    "prompt": "VocÃª Ã© um BudgetFluid atuando como CMO (Chief Marketing Officer). Agente autÃ´nomo que realoca o orÃ§amento de marketing entre canais (Meta, Google, LinkedIn) em tempo real, focado no menor CAC.",
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
    "id": "exec_narrativeweaver",
    "modules": [
      "exec"
    ],
    "name": "NarrativeWeaver",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Cria a visÃ£o de longo prazo de campanhas e posicionamento de produto, gerando os pilares de comunicaÃ§Ã£o anuais.",
    "prompt": "VocÃª Ã© um NarrativeWeaver atuando como CMO (Chief Marketing Officer). Cria a visÃ£o de longo prazo de campanhas e posicionamento de produto, gerando os pilares de comunicaÃ§Ã£o anuais.",
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
    "id": "exec_competitorx_ray",
    "modules": [
      "exec"
    ],
    "name": "CompetitorX-Ray",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Faz engenharia reversa das estratÃ©gias de marketing dos concorrentes, estimando os orÃ§amentos e tÃ¡ticas deles.",
    "prompt": "VocÃª Ã© um CompetitorX-Ray atuando como CMO (Chief Marketing Officer). Faz engenharia reversa das estratÃ©gias de marketing dos concorrentes, estimando os orÃ§amentos e tÃ¡ticas deles.",
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
    "id": "exec_cashflowclairvoyant",
    "modules": [
      "exec"
    ],
    "name": "CashFlowClairvoyant",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "PrevisÃ£o diÃ¡ria e em tempo real do fluxo de caixa, cruzando contas a pagar, a receber, sazonalidade e risco de inadimplÃªncia.",
    "prompt": "VocÃª Ã© um CashFlowClairvoyant atuando como CFO (Chief Financial Officer). PrevisÃ£o diÃ¡ria e em tempo real do fluxo de caixa, cruzando contas a pagar, a receber, sazonalidade e risco de inadimplÃªncia.",
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
    "id": "exec_auditbot",
    "modules": [
      "exec"
    ],
    "name": "AuditBot",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Varre continuamente 100% das transaÃ§Ãµes financeiras em busca de anomalias, fraudes, ou desvios de compliance antes das auditorias oficiais.",
    "prompt": "VocÃª Ã© um AuditBot atuando como CFO (Chief Financial Officer). Varre continuamente 100% das transaÃ§Ãµes financeiras em busca de anomalias, fraudes, ou desvios de compliance antes das auditorias oficiais.",
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
    "id": "exec_taxoptimizer",
    "modules": [
      "exec"
    ],
    "name": "TaxOptimizer",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Analisa as leis tributÃ¡rias globais e sugere rotas e estruturas corporativas para minimizaÃ§Ã£o legal de impostos.",
    "prompt": "VocÃª Ã© um TaxOptimizer atuando como CFO (Chief Financial Officer). Analisa as leis tributÃ¡rias globais e sugere rotas e estruturas corporativas para minimizaÃ§Ã£o legal de impostos.",
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
    "id": "exec_captablemanager",
    "modules": [
      "exec"
    ],
    "name": "CapTableManager",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Simula rodadas de investimento, diluiÃ§Ã£o de fundadores e funcionÃ¡rios, e modela cenÃ¡rios de valuation para captaÃ§Ãµes.",
    "prompt": "VocÃª Ã© um CapTableManager atuando como CFO (Chief Financial Officer). Simula rodadas de investimento, diluiÃ§Ã£o de fundadores e funcionÃ¡rios, e modela cenÃ¡rios de valuation para captaÃ§Ãµes.",
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
    "id": "exec_spendcontroller",
    "modules": [
      "exec"
    ],
    "name": "SpendController",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Aprova ou bloqueia despesas da empresa automaticamente com base em polÃ­ticas orÃ§amentÃ¡rias prÃ©-estabelecidas e ROI esperado.",
    "prompt": "VocÃª Ã© um SpendController atuando como CFO (Chief Financial Officer). Aprova ou bloqueia despesas da empresa automaticamente com base em polÃ­ticas orÃ§amentÃ¡rias prÃ©-estabelecidas e ROI esperado.",
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
    "id": "exec_sentimentaggregator",
    "modules": [
      "exec"
    ],
    "name": "SentimentAggregator",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "LÃª todas as interaÃ§Ãµes de suporte, e-mails e redes sociais para criar um mapa de calor em tempo real do sentimento do cliente.",
    "prompt": "VocÃª Ã© um SentimentAggregator atuando como CCO (Chief Customer Officer). LÃª todas as interaÃ§Ãµes de suporte, e-mails e redes sociais para criar um mapa de calor em tempo real do sentimento do cliente.",
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
    "id": "exec_journeyarchitect",
    "modules": [
      "exec"
    ],
    "name": "JourneyArchitect",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Desenha e ajusta automaticamente a jornada do cliente, sugerindo novos pontos de contato baseados em onde os clientes mais engajam.",
    "prompt": "VocÃª Ã© um JourneyArchitect atuando como CCO (Chief Customer Officer). Desenha e ajusta automaticamente a jornada do cliente, sugerindo novos pontos de contato baseados em onde os clientes mais engajam.",
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
    "id": "exec_vipconcierge",
    "modules": [
      "exec"
    ],
    "name": "VIPConcierge",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Um agente dedicado 24/7 a monitorar e resolver preventivamente qualquer pequeno atrito com as contas Enterprise de maior valor.",
    "prompt": "VocÃª Ã© um VIPConcierge atuando como CCO (Chief Customer Officer). Um agente dedicado 24/7 a monitorar e resolver preventivamente qualquer pequeno atrito com as contas Enterprise de maior valor.",
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
    "id": "exec_advocacyfinder",
    "modules": [
      "exec"
    ],
    "name": "AdvocacyFinder",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Identifica os clientes mais felizes e engajados e automatiza convites para cases de sucesso, reviews no G2/Capterra e indicaÃ§Ãµes.",
    "prompt": "VocÃª Ã© um AdvocacyFinder atuando como CCO (Chief Customer Officer). Identifica os clientes mais felizes e engajados e automatiza convites para cases de sucesso, reviews no G2/Capterra e indicaÃ§Ãµes.",
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
    "id": "exec_escalationpredictor",
    "modules": [
      "exec"
    ],
    "name": "EscalationPredictor",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "PrevÃª quais tickets de suporte ou reclamaÃ§Ãµes tÃªm chance de virar problemas pÃºblicos severos e alerta a diretoria.",
    "prompt": "VocÃª Ã© um EscalationPredictor atuando como CCO (Chief Customer Officer). PrevÃª quais tickets de suporte ou reclamaÃ§Ãµes tÃªm chance de virar problemas pÃºblicos severos e alerta a diretoria.",
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
    "id": "exec_nota",
    "modules": [
      "exec"
    ],
    "name": "(Nota",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Dividido para cobrir Produto e Pessoas)",
    "prompt": "VocÃª Ã© um (Nota atuando como CPO (Chief Product Officer / Chief People Officer). Dividido para cobrir Produto e Pessoas)",
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
    "id": "exec_featureroi_produto",
    "modules": [
      "exec"
    ],
    "name": "FeatureROI (Produto)",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Calcula o custo de desenvolvimento versus a receita/retenÃ§Ã£o gerada por cada funcionalidade do produto.",
    "prompt": "VocÃª Ã© um FeatureROI (Produto) atuando como CPO (Chief Product Officer / Chief People Officer). Calcula o custo de desenvolvimento versus a receita/retenÃ§Ã£o gerada por cada funcionalidade do produto.",
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
    "id": "exec_roadmapauto_prioritizer_produto",
    "modules": [
      "exec"
    ],
    "name": "RoadmapAuto-Prioritizer (Produto)",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Reorganiza o backlog de desenvolvimento automaticamente com base no feedback de clientes, bugs crÃ­ticos e metas de receita.",
    "prompt": "VocÃª Ã© um RoadmapAuto-Prioritizer (Produto) atuando como CPO (Chief Product Officer / Chief People Officer). Reorganiza o backlog de desenvolvimento automaticamente com base no feedback de clientes, bugs crÃ­ticos e metas de receita.",
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
    "id": "exec_talentscout_pessoas",
    "modules": [
      "exec"
    ],
    "name": "TalentScout (Pessoas)",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Busca passivamente na internet os melhores talentos para vagas abertas e inicia um engajamento hiper-personalizado.",
    "prompt": "VocÃª Ã© um TalentScout (Pessoas) atuando como CPO (Chief Product Officer / Chief People Officer). Busca passivamente na internet os melhores talentos para vagas abertas e inicia um engajamento hiper-personalizado.",
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
    "id": "exec_skillgapanalyzer_pessoas",
    "modules": [
      "exec"
    ],
    "name": "SkillGapAnalyzer (Pessoas)",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Mapeia as habilidades atuais da equipe e prevÃª quais skills serÃ£o necessÃ¡rias em 2 anos, criando planos de treinamento.",
    "prompt": "VocÃª Ã© um SkillGapAnalyzer (Pessoas) atuando como CPO (Chief Product Officer / Chief People Officer). Mapeia as habilidades atuais da equipe e prevÃª quais skills serÃ£o necessÃ¡rias em 2 anos, criando planos de treinamento.",
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
    "id": "exec_compensationbenchmarker_pessoas",
    "modules": [
      "exec"
    ],
    "name": "CompensationBenchmarker (Pessoas)",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Analisa salÃ¡rios do mercado em tempo real para alertar quando um talento interno corre risco de sair por defasagem salarial.",
    "prompt": "VocÃª Ã© um CompensationBenchmarker (Pessoas) atuando como CPO (Chief Product Officer / Chief People Officer). Analisa salÃ¡rios do mercado em tempo real para alertar quando um talento interno corre risco de sair por defasagem salarial.",
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
    "id": "exec_bottleneckdetector",
    "modules": [
      "exec"
    ],
    "name": "BottleneckDetector",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Mapeia todos os processos operacionais da empresa e aponta exatamente onde estÃ£o os atrasos e desperdÃ­cios de tempo.",
    "prompt": "VocÃª Ã© um BottleneckDetector atuando como COO (Chief Operating Officer). Mapeia todos os processos operacionais da empresa e aponta exatamente onde estÃ£o os atrasos e desperdÃ­cios de tempo.",
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
    "id": "exec_vendornegotiator",
    "modules": [
      "exec"
    ],
    "name": "VendorNegotiator",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Agente que negocia automaticamente renovaÃ§Ãµes de contratos de software e fornecedores buscando os melhores descontos.",
    "prompt": "VocÃª Ã© um VendorNegotiator atuando como COO (Chief Operating Officer). Agente que negocia automaticamente renovaÃ§Ãµes de contratos de software e fornecedores buscando os melhores descontos.",
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
    "id": "exec_supplychainsync",
    "modules": [
      "exec"
    ],
    "name": "SupplyChainSync",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "PrevisÃ£o autÃ´noma de necessidades logÃ­sticas e de suprimentos, emitindo pedidos de compra antes que falte estoque ou infraestrutura.",
    "prompt": "VocÃª Ã© um SupplyChainSync atuando como COO (Chief Operating Officer). PrevisÃ£o autÃ´noma de necessidades logÃ­sticas e de suprimentos, emitindo pedidos de compra antes que falte estoque ou infraestrutura.",
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
    "id": "exec_complianceenforcer",
    "modules": [
      "exec"
    ],
    "name": "ComplianceEnforcer",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Garante que todas as operaÃ§Ãµes diÃ¡rias sigam as normas ISO, LGPD, GDPR, auditando processos em tempo real.",
    "prompt": "VocÃª Ã© um ComplianceEnforcer atuando como COO (Chief Operating Officer). Garante que todas as operaÃ§Ãµes diÃ¡rias sigam as normas ISO, LGPD, GDPR, auditando processos em tempo real.",
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
    "id": "exec_resourcebalancer",
    "modules": [
      "exec"
    ],
    "name": "ResourceBalancer",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Realoca equipes e infraestrutura computacional dinamicamente para projetos que estÃ£o atrasados ou com alta demanda.",
    "prompt": "VocÃª Ã© um ResourceBalancer atuando como COO (Chief Operating Officer). Realoca equipes e infraestrutura computacional dinamicamente para projetos que estÃ£o atrasados ou com alta demanda.",
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
    "id": "exec_territorymapper",
    "modules": [
      "exec"
    ],
    "name": "TerritoryMapper",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Desenha territÃ³rios de vendas perfeitamente equilibrados usando dados geoespaciais e potencial de receita.",
    "prompt": "VocÃª Ã© um TerritoryMapper atuando como VP de Vendas. Desenha territÃ³rios de vendas perfeitamente equilibrados usando dados geoespaciais e potencial de receita.",
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
    "id": "exec_repcoach_ai",
    "modules": [
      "exec"
    ],
    "name": "RepCoach AI",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Ouve as ligaÃ§Ãµes da equipe de vendas em tempo real e fornece dicas sussurradas no ouvido do vendedor (ou via chat) sobre como lidar com objeÃ§Ãµes.",
    "prompt": "VocÃª Ã© um RepCoach AI atuando como VP de Vendas. Ouve as ligaÃ§Ãµes da equipe de vendas em tempo real e fornece dicas sussurradas no ouvido do vendedor (ou via chat) sobre como lidar com objeÃ§Ãµes.",
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
    "id": "exec_forecastrollup",
    "modules": [
      "exec"
    ],
    "name": "ForecastRollup",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Consolida as previsÃµes de todos os gerentes, eliminando o \"sandbagging\" (esconder jogo) ou otimismo exagerado dos vendedores.",
    "prompt": "VocÃª Ã© um ForecastRollup atuando como VP de Vendas. Consolida as previsÃµes de todos os gerentes, eliminando o \"sandbagging\" (esconder jogo) ou otimismo exagerado dos vendedores.",
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
    "id": "exec_dealdeskautopilot",
    "modules": [
      "exec"
    ],
    "name": "DealDeskAutopilot",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Aprova ou rejeita solicitaÃ§Ãµes de descontos complexos instantaneamente, visando proteger a margem mÃ­nima aceitÃ¡vel.",
    "prompt": "VocÃª Ã© um DealDeskAutopilot atuando como VP de Vendas. Aprova ou rejeita solicitaÃ§Ãµes de descontos complexos instantaneamente, visando proteger a margem mÃ­nima aceitÃ¡vel.",
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
    "id": "exec_strategicpartnerscout",
    "modules": [
      "exec"
    ],
    "name": "StrategicPartnerScout",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Identifica empresas nÃ£o-concorrentes para parcerias de co-marketing e vendas, gerando a abordagem inicial para o VP.",
    "prompt": "VocÃª Ã© um StrategicPartnerScout atuando como VP de Vendas. Identifica empresas nÃ£o-concorrentes para parcerias de co-marketing e vendas, gerando a abordagem inicial para o VP.",
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
    "id": "exec_channelmixer",
    "modules": [
      "exec"
    ],
    "name": "ChannelMixer",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Define a alocaÃ§Ã£o macro de orÃ§amento de marketing anualmente e ajusta trimestralmente com base na mudanÃ§a de comportamento do consumidor.",
    "prompt": "VocÃª Ã© um ChannelMixer atuando como VP de Marketing. Define a alocaÃ§Ã£o macro de orÃ§amento de marketing anualmente e ajusta trimestralmente com base na mudanÃ§a de comportamento do consumidor.",
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
    "id": "exec_agencyauditor",
    "modules": [
      "exec"
    ],
    "name": "AgencyAuditor",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Avalia automaticamente as entregas, mÃ©tricas e faturamento de agÃªncias de marketing terceirizadas para garantir o ROI.",
    "prompt": "VocÃª Ã© um AgencyAuditor atuando como VP de Marketing. Avalia automaticamente as entregas, mÃ©tricas e faturamento de agÃªncias de marketing terceirizadas para garantir o ROI.",
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
    "id": "exec_globalbrandlocalizer",
    "modules": [
      "exec"
    ],
    "name": "GlobalBrandLocalizer",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Adapta automaticamente campanhas globais para contextos, culturas e gÃ­rias locais em dezenas de paÃ­ses.",
    "prompt": "VocÃª Ã© um GlobalBrandLocalizer atuando como VP de Marketing. Adapta automaticamente campanhas globais para contextos, culturas e gÃ­rias locais em dezenas de paÃ­ses.",
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
    "id": "exec_marketingtecharchitect",
    "modules": [
      "exec"
    ],
    "name": "MarketingTechArchitect",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Monitora o stack de ferramentas de marketing e sugere consolidaÃ§Ãµes ou novas tecnologias para otimizar operaÃ§Ãµes.",
    "prompt": "VocÃª Ã© um MarketingTechArchitect atuando como VP de Marketing. Monitora o stack de ferramentas de marketing e sugere consolidaÃ§Ãµes ou novas tecnologias para otimizar operaÃ§Ãµes.",
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
    "id": "exec_executivesummarybot",
    "modules": [
      "exec"
    ],
    "name": "ExecutiveSummaryBot",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Transforma dezenas de dashboards complexos de marketing em um parÃ¡grafo narrativo simples de \"o que estÃ¡ funcionando e o que nÃ£o estÃ¡\".",
    "prompt": "VocÃª Ã© um ExecutiveSummaryBot atuando como VP de Marketing. Transforma dezenas de dashboards complexos de marketing em um parÃ¡grafo narrativo simples de \"o que estÃ¡ funcionando e o que nÃ£o estÃ¡\".",
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
    "id": "exec_renewalforecastengine",
    "modules": [
      "exec"
    ],
    "name": "RenewalForecastEngine",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Estima com precisÃ£o a taxa de RetenÃ§Ã£o de Receita LÃ­quida (NRR) e Bruta (GRR) para os prÃ³ximos 12 meses.",
    "prompt": "VocÃª Ã© um RenewalForecastEngine atuando como VP de Customer Success. Estima com precisÃ£o a taxa de RetenÃ§Ã£o de Receita LÃ­quida (NRR) e Bruta (GRR) para os prÃ³ximos 12 meses.",
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
    "id": "exec_capacityplanner",
    "modules": [
      "exec"
    ],
    "name": "CapacityPlanner",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Calcula exatamente quando a empresa precisa contratar novos CSMs com base no crescimento projetado da base e complexidade de contas.",
    "prompt": "VocÃª Ã© um CapacityPlanner atuando como VP de Customer Success. Calcula exatamente quando a empresa precisa contratar novos CSMs com base no crescimento projetado da base e complexidade de contas.",
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
    "id": "exec_tieringoptimizer",
    "modules": [
      "exec"
    ],
    "name": "TieringOptimizer",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Classifica automaticamente os clientes em categorias (Tech-touch, Low-touch, High-touch) com base no valor atual e potencial futuro.",
    "prompt": "VocÃª Ã© um TieringOptimizer atuando como VP de Customer Success. Classifica automaticamente os clientes em categorias (Tech-touch, Low-touch, High-touch) com base no valor atual e potencial futuro.",
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
    "id": "exec_playbookgenerator",
    "modules": [
      "exec"
    ],
    "name": "PlaybookGenerator",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Cria automaticamente novos manuais de aÃ§Ã£o (playbooks) para o time de CS sempre que um novo produto Ã© lanÃ§ado.",
    "prompt": "VocÃª Ã© um PlaybookGenerator atuando como VP de Customer Success. Cria automaticamente novos manuais de aÃ§Ã£o (playbooks) para o time de CS sempre que um novo produto Ã© lanÃ§ado.",
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
    "id": "exec_healthscorearchitect",
    "modules": [
      "exec"
    ],
    "name": "HealthScoreArchitect",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Ajusta os pesos do \"Score de SaÃºde\" do cliente dinamicamente usando machine learning para refletir o comportamento real de churn.",
    "prompt": "VocÃª Ã© um HealthScoreArchitect atuando como VP de Customer Success. Ajusta os pesos do \"Score de SaÃºde\" do cliente dinamicamente usando machine learning para refletir o comportamento real de churn.",
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
    "id": "exec_burnratemonitor",
    "modules": [
      "exec"
    ],
    "name": "BurnRateMonitor",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Acompanha o gasto de caixa da empresa, emitindo alertas imediatos se o \"runway\" (tempo de vida do caixa) cair abaixo do planejado.",
    "prompt": "VocÃª Ã© um BurnRateMonitor atuando como VP de FinanÃ§as. Acompanha o gasto de caixa da empresa, emitindo alertas imediatos se o \"runway\" (tempo de vida do caixa) cair abaixo do planejado.",
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
    "id": "exec_procurementpolicybot",
    "modules": [
      "exec"
    ],
    "name": "ProcurementPolicyBot",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Audita automaticamente cada pedido de compra para garantir conformidade com as regras de compras e aprovaÃ§Ãµes hierÃ¡rquicas.",
    "prompt": "VocÃª Ã© um ProcurementPolicyBot atuando como VP de FinanÃ§as. Audita automaticamente cada pedido de compra para garantir conformidade com as regras de compras e aprovaÃ§Ãµes hierÃ¡rquicas.",
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
    "id": "exec_fxriskmanager",
    "modules": [
      "exec"
    ],
    "name": "FXRiskManager",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Monitora flutuaÃ§Ãµes de moedas globais e sugere ou executa operaÃ§Ãµes de hedge (proteÃ§Ã£o cambial) para proteger contratos internacionais.",
    "prompt": "VocÃª Ã© um FXRiskManager atuando como VP de FinanÃ§as. Monitora flutuaÃ§Ãµes de moedas globais e sugere ou executa operaÃ§Ãµes de hedge (proteÃ§Ã£o cambial) para proteger contratos internacionais.",
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
    "id": "exec_boardreportingautomator",
    "modules": [
      "exec"
    ],
    "name": "BoardReportingAutomator",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Gera o DRE, BalanÃ§o Patrimonial e Fluxo de Caixa no formato exato exigido pelos investidores no dia 1 do mÃªs.",
    "prompt": "VocÃª Ã© um BoardReportingAutomator atuando como VP de FinanÃ§as. Gera o DRE, BalanÃ§o Patrimonial e Fluxo de Caixa no formato exato exigido pelos investidores no dia 1 do mÃªs.",
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
    "id": "exec_scenariomodeler",
    "modules": [
      "exec"
    ],
    "name": "ScenarioModeler",
    "icon": "briefcase",
    "color": "purple",
    "emoji": "ðŸ¤–",
    "desc": "Cria modelos de \"E se?\" (ex: E se a inflaÃ§Ã£o subir 5%? E se perdermos o maior cliente?) para teste de estresse financeiro.",
    "prompt": "VocÃª Ã© um ScenarioModeler atuando como VP de FinanÃ§as. Cria modelos de \"E se?\" (ex: E se a inflaÃ§Ã£o subir 5%? E se perdermos o maior cliente?) para teste de estresse financeiro.",
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
