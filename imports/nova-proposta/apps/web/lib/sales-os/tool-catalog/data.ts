import type { Tool } from "../types";

export const DATA_TOOLS: Tool[] = [
  {
    "id": "data_requirementsgatherer",
    "modules": [
      "data"
    ],
    "name": "RequirementsGatherer",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Conduz entrevistas por chat com stakeholders de vÃ¡rias Ã¡reas para mapear necessidades de negÃ³cio e converte isso em Documentos de Requisitos.",
    "prompt": "VocÃª Ã© um RequirementsGatherer atuando como Business Analyst. Conduz entrevistas por chat com stakeholders de vÃ¡rias Ã¡reas para mapear necessidades de negÃ³cio e converte isso em Documentos de Requisitos.",
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
    "id": "data_processflowmapper",
    "modules": [
      "data"
    ],
    "name": "ProcessFlowMapper",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Transforma descriÃ§Ãµes em texto de um processo (ex: \"como a nota fiscal Ã© emitida\") em diagramas de fluxo BPMN perfeitos.",
    "prompt": "VocÃª Ã© um ProcessFlowMapper atuando como Business Analyst. Transforma descriÃ§Ãµes em texto de um processo (ex: \"como a nota fiscal Ã© emitida\") em diagramas de fluxo BPMN perfeitos.",
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
    "id": "data_userstorywriter",
    "modules": [
      "data"
    ],
    "name": "UserStoryWriter",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Converte os requisitos de negÃ³cio no formato Ãgil (\"Como um usuÃ¡rio, eu quero...\") para entregar mastigado para o time de software.",
    "prompt": "VocÃª Ã© um UserStoryWriter atuando como Business Analyst. Converte os requisitos de negÃ³cio no formato Ãgil (\"Como um usuÃ¡rio, eu quero...\") para entregar mastigado para o time de software.",
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
    "id": "data_stakeholderupdateautomator",
    "modules": [
      "data"
    ],
    "name": "StakeholderUpdateAutomator",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Pega dados tÃ©cnicos de desenvolvimento e traduz em atualizaÃ§Ãµes de status gerenciais semanais.",
    "prompt": "VocÃª Ã© um StakeholderUpdateAutomator atuando como Business Analyst. Pega dados tÃ©cnicos de desenvolvimento e traduz em atualizaÃ§Ãµes de status gerenciais semanais.",
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
    "id": "data_scopecreepdetector",
    "modules": [
      "data"
    ],
    "name": "ScopeCreepDetector",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Alerta o gerente de projeto se novas requisiÃ§Ãµes comeÃ§am a surgir, indicando que o projeto vai estourar prazo e custo.",
    "prompt": "VocÃª Ã© um ScopeCreepDetector atuando como Business Analyst. Alerta o gerente de projeto se novas requisiÃ§Ãµes comeÃ§am a surgir, indicando que o projeto vai estourar prazo e custo.",
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
    "id": "data_sqlquerygenerator",
    "modules": [
      "data"
    ],
    "name": "SQLQueryGenerator",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Escreve queries SQL complexas (com JOINs e Window Functions) apenas com comandos de linguagem natural (\"mostre os clientes mais rentÃ¡veis do sul\").",
    "prompt": "VocÃª Ã© um SQLQueryGenerator atuando como Data Analyst. Escreve queries SQL complexas (com JOINs e Window Functions) apenas com comandos de linguagem natural (\"mostre os clientes mais rentÃ¡veis do sul\").",
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
    "id": "data_anomalydetector",
    "modules": [
      "data"
    ],
    "name": "AnomalyDetector",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Roda silenciosamente 24/7 sobre os bancos de dados da empresa e apita se perceber algo estranho, como queda brusca de acessos no site.",
    "prompt": "VocÃª Ã© um AnomalyDetector atuando como Data Analyst. Roda silenciosamente 24/7 sobre os bancos de dados da empresa e apita se perceber algo estranho, como queda brusca de acessos no site.",
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
    "id": "data_dashboardautofreshener",
    "modules": [
      "data"
    ],
    "name": "DashboardAutoFreshener",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "MantÃ©m grÃ¡ficos no Tableau/Metabase em perfeito funcionamento, refazendo os links de dados se uma coluna for renomeada.",
    "prompt": "VocÃª Ã© um DashboardAutoFreshener atuando como Data Analyst. MantÃ©m grÃ¡ficos no Tableau/Metabase em perfeito funcionamento, refazendo os links de dados se uma coluna for renomeada.",
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
    "id": "data_datacleaningbot",
    "modules": [
      "data"
    ],
    "name": "DataCleaningBot",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Substitui \"NULLs\", arruma datas invertidas (MM/DD/YY para DD/MM/YY) e elimina discrepÃ¢ncias brutas sem intervenÃ§Ã£o humana.",
    "prompt": "VocÃª Ã© um DataCleaningBot atuando como Data Analyst. Substitui \"NULLs\", arruma datas invertidas (MM/DD/YY para DD/MM/YY) e elimina discrepÃ¢ncias brutas sem intervenÃ§Ã£o humana.",
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
    "id": "data_statsignificancetester",
    "modules": [
      "data"
    ],
    "name": "StatSignificanceTester",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Informa com selos de confiabilidade matemÃ¡tica se o crescimento de uma mÃ©trica foi uma vitÃ³ria real ou apenas sorte ao acaso.",
    "prompt": "VocÃª Ã© um StatSignificanceTester atuando como Data Analyst. Informa com selos de confiabilidade matemÃ¡tica se o crescimento de uma mÃ©trica foi uma vitÃ³ria real ou apenas sorte ao acaso.",
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
    "id": "data_arrbridgebuilder",
    "modules": [
      "data"
    ],
    "name": "ARRBridgeBuilder",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "ConstrÃ³i o grÃ¡fico em \"cascata\" (Waterfall) que mostra de onde veio cada centavo ganho ou perdido entre Janeiro e Dezembro.",
    "prompt": "VocÃª Ã© um ARRBridgeBuilder atuando como Revenue Analyst. ConstrÃ³i o grÃ¡fico em \"cascata\" (Waterfall) que mostra de onde veio cada centavo ganho ou perdido entre Janeiro e Dezembro.",
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
    "id": "data_netretentionmodeler",
    "modules": [
      "data"
    ],
    "name": "NetRetentionModeler",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Rastreia detalhadamente o NRR da empresa, isolando os cancelamentos brutos da expansÃ£o de contas (Upsell).",
    "prompt": "VocÃª Ã© um NetRetentionModeler atuando como Revenue Analyst. Rastreia detalhadamente o NRR da empresa, isolando os cancelamentos brutos da expansÃ£o de contas (Upsell).",
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
    "id": "data_churncohortisolator",
    "modules": [
      "data"
    ],
    "name": "ChurnCohortIsolator",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Separa grupos de cancelamento para encontrar o \"culpado\": foi um mÃªs especÃ­fico de vendas ruins? Foi um vendedor? Foi um update do software?",
    "prompt": "VocÃª Ã© um ChurnCohortIsolator atuando como Revenue Analyst. Separa grupos de cancelamento para encontrar o \"culpado\": foi um mÃªs especÃ­fico de vendas ruins? Foi um vendedor? Foi um update do software?",
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
    "id": "data_pricingelasticitytester",
    "modules": [
      "data"
    ],
    "name": "PricingElasticityTester",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Roda modelos economÃ©tricos prevendo quantos clientes a empresa perderia se aumentasse os preÃ§os em 5%, 10% e 15%.",
    "prompt": "VocÃª Ã© um PricingElasticityTester atuando como Revenue Analyst. Roda modelos economÃ©tricos prevendo quantos clientes a empresa perderia se aumentasse os preÃ§os em 5%, 10% e 15%.",
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
    "id": "data_pipelinevelocitytracker",
    "modules": [
      "data"
    ],
    "name": "PipelineVelocityTracker",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Monitora a velocidade com que o dinheiro se move no funil. \"Um lead demora 45 dias da primeira ligaÃ§Ã£o ao contrato assinado\".",
    "prompt": "VocÃª Ã© um PipelineVelocityTracker atuando como Revenue Analyst. Monitora a velocidade com que o dinheiro se move no funil. \"Um lead demora 45 dias da primeira ligaÃ§Ã£o ao contrato assinado\".",
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
    "id": "data_journeydropofflocator",
    "modules": [
      "data"
    ],
    "name": "JourneyDropOffLocator",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Mostra onde exatamente os usuÃ¡rios desistem de uma tela. (Ex: \"30% saem da pÃ¡gina no formulÃ¡rio de CEP\").",
    "prompt": "VocÃª Ã© um JourneyDropOffLocator atuando como Product Analyst. Mostra onde exatamente os usuÃ¡rios desistem de uma tela. (Ex: \"30% saem da pÃ¡gina no formulÃ¡rio de CEP\").",
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
    "id": "data_featureheatmapper",
    "modules": [
      "data"
    ],
    "name": "FeatureHeatmapper",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Grava onde os usuÃ¡rios estÃ£o clicando na tela e cruza com a utilidade das funcionalidades para sugerir melhorias de UX/UI.",
    "prompt": "VocÃª Ã© um FeatureHeatmapper atuando como Product Analyst. Grava onde os usuÃ¡rios estÃ£o clicando na tela e cruza com a utilidade das funcionalidades para sugerir melhorias de UX/UI.",
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
    "id": "data_abtestsynthesizer",
    "modules": [
      "data"
    ],
    "name": "ABTestSynthesizer",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Compila resultados complexos de testes de produto A/B/C/D em uma recomendaÃ§Ã£o final clara para o CPO decidir.",
    "prompt": "VocÃª Ã© um ABTestSynthesizer atuando como Product Analyst. Compila resultados complexos de testes de produto A/B/C/D em uma recomendaÃ§Ã£o final clara para o CPO decidir.",
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
    "id": "data_stickinesstracker",
    "modules": [
      "data"
    ],
    "name": "StickinessTracker",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Monitora o DAU/MAU (UsuÃ¡rios DiÃ¡rios vs. Mensais) identificando se o produto virou um hÃ¡bito ou estÃ¡ sendo esquecido.",
    "prompt": "VocÃª Ã© um StickinessTracker atuando como Product Analyst. Monitora o DAU/MAU (UsuÃ¡rios DiÃ¡rios vs. Mensais) identificando se o produto virou um hÃ¡bito ou estÃ¡ sendo esquecido.",
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
    "id": "data_sessionreplaysummarizer",
    "modules": [
      "data"
    ],
    "name": "SessionReplaySummarizer",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Ao invÃ©s do humano assistir 100 horas de gravaÃ§Ã£o de tela, resume os padrÃµes de comportamento frustrantes dos usuÃ¡rios em texto.",
    "prompt": "VocÃª Ã© um SessionReplaySummarizer atuando como Product Analyst. Ao invÃ©s do humano assistir 100 horas de gravaÃ§Ã£o de tela, resume os padrÃµes de comportamento frustrantes dos usuÃ¡rios em texto.",
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
    "id": "data_marketshareestimator",
    "modules": [
      "data"
    ],
    "name": "MarketShareEstimator",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Cruza dados pÃºblicos, trÃ¡fego da web e declaraÃ§Ãµes fiscais para estimar com boa precisÃ£o a fatia de mercado de todos os concorrentes.",
    "prompt": "VocÃª Ã© um MarketShareEstimator atuando como Business Data Analyst. Cruza dados pÃºblicos, trÃ¡fego da web e declaraÃ§Ãµes fiscais para estimar com boa precisÃ£o a fatia de mercado de todos os concorrentes.",
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
    "id": "data_macrofactortracker",
    "modules": [
      "data"
    ],
    "name": "MacroFactorTracker",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Importa e analisa juros, inflaÃ§Ã£o e desemprego, prevendo como essas variÃ¡veis vÃ£o afetar o faturamento da empresa no prÃ³ximo semestre.",
    "prompt": "VocÃª Ã© um MacroFactorTracker atuando como Business Data Analyst. Importa e analisa juros, inflaÃ§Ã£o e desemprego, prevendo como essas variÃ¡veis vÃ£o afetar o faturamento da empresa no prÃ³ximo semestre.",
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
    "id": "data_competitorfinancialscraper",
    "modules": [
      "data"
    ],
    "name": "CompetitorFinancialScraper",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "LÃª documentos financeiros de concorrentes de capital aberto e destrincha as margens de lucro deles comparadas com a sua empresa.",
    "prompt": "VocÃª Ã© um CompetitorFinancialScraper atuando como Business Data Analyst. LÃª documentos financeiros de concorrentes de capital aberto e destrincha as margens de lucro deles comparadas com a sua empresa.",
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
    "id": "data_strategickpiaggregator",
    "modules": [
      "data"
    ],
    "name": "StrategicKPIAggregator",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Une KPIs de RH, Vendas e ProduÃ§Ã£o em uma Ãºnica mÃ©trica (A \"Estrela do Norte\" ou North Star Metric) para a diretoria.",
    "prompt": "VocÃª Ã© um StrategicKPIAggregator atuando como Business Data Analyst. Une KPIs de RH, Vendas e ProduÃ§Ã£o em uma Ãºnica mÃ©trica (A \"Estrela do Norte\" ou North Star Metric) para a diretoria.",
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
    "id": "data_geospatialexpansionmapper",
    "modules": [
      "data"
    ],
    "name": "GeospatialExpansionMapper",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Cruza dados demogrÃ¡ficos e de logÃ­stica para indicar, em um mapa interativo, onde abrir a prÃ³xima fÃ¡brica ou filial.",
    "prompt": "VocÃª Ã© um GeospatialExpansionMapper atuando como Business Data Analyst. Cruza dados demogrÃ¡ficos e de logÃ­stica para indicar, em um mapa interativo, onde abrir a prÃ³xima fÃ¡brica ou filial.",
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
    "id": "data_attributionmodeler",
    "modules": [
      "data"
    ],
    "name": "AttributionModeler",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Divide o crÃ©dito de uma venda complexa com precisÃ£o matemÃ¡tica (ex: 20% pro e-mail, 40% pro webinar, 40% pro LinkedIn).",
    "prompt": "VocÃª Ã© um AttributionModeler atuando como Marketing Data Analyst. Divide o crÃ©dito de uma venda complexa com precisÃ£o matemÃ¡tica (ex: 20% pro e-mail, 40% pro webinar, 40% pro LinkedIn).",
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
    "id": "data_mediamixoptimizer",
    "modules": [
      "data"
    ],
    "name": "MediaMixOptimizer",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Modela cenÃ¡rios matemÃ¡ticos para dizer se a empresa ganha mais investindo 100 mil no GoogleAds ou 100 mil em patrocÃ­nio de eventos.",
    "prompt": "VocÃª Ã© um MediaMixOptimizer atuando como Marketing Data Analyst. Modela cenÃ¡rios matemÃ¡ticos para dizer se a empresa ganha mais investindo 100 mil no GoogleAds ou 100 mil em patrocÃ­nio de eventos.",
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
    "id": "data_campaigndecaypredictor",
    "modules": [
      "data"
    ],
    "name": "CampaignDecayPredictor",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "PrevÃª exatamente quando uma campanha publicitÃ¡ria de sucesso vai comeÃ§ar a \"cansar\" e parar de dar lucro.",
    "prompt": "VocÃª Ã© um CampaignDecayPredictor atuando como Marketing Data Analyst. PrevÃª exatamente quando uma campanha publicitÃ¡ria de sucesso vai comeÃ§ar a \"cansar\" e parar de dar lucro.",
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
    "id": "data_audiencesegmentdiscoverer",
    "modules": [
      "data"
    ],
    "name": "AudienceSegmentDiscoverer",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Usa clusterizaÃ§Ã£o nÃ£o-supervisionada para descobrir que clientes com o comportamento A, B e C compram mais rÃ¡pido, criando uma nova persona.",
    "prompt": "VocÃª Ã© um AudienceSegmentDiscoverer atuando como Marketing Data Analyst. Usa clusterizaÃ§Ã£o nÃ£o-supervisionada para descobrir que clientes com o comportamento A, B e C compram mais rÃ¡pido, criando uma nova persona.",
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
    "id": "data_ltvbychannelcalculator",
    "modules": [
      "data"
    ],
    "name": "LTVbyChannelCalculator",
    "icon": "bar-chart",
    "color": "cyan",
    "emoji": "ðŸ¤–",
    "desc": "Aponta que o CAC do Google pode ser mais alto, mas os clientes que vÃªm de lÃ¡ gastam 3x mais durante a vida (Lifetime Value).",
    "prompt": "VocÃª Ã© um LTVbyChannelCalculator atuando como Marketing Data Analyst. Aponta que o CAC do Google pode ser mais alto, mas os clientes que vÃªm de lÃ¡ gastam 3x mais durante a vida (Lifetime Value).",
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
