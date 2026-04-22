import type { Tool } from "../types";

export const PRESALES_TOOLS: Tool[] = [
  {
    "id": "presales_inboundscorer",
    "modules": [
      "presales"
    ],
    "name": "InboundScorer",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Avalia leads que chegam pelo site em segundos e roteia os mais quentes direto para o telefone, ignorando curiosos.",
    "prompt": "VocÃª Ã© um InboundScorer atuando como SDR (Sales Development Representative). Avalia leads que chegam pelo site em segundos e roteia os mais quentes direto para o telefone, ignorando curiosos.",
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
    "id": "predictive_lead_scoring",
    "modules": [
      "presales"
    ],
    "name": "PredictiveLeadScoring",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Gera uma leitura curta do potencial de conversÃ£o, urgÃªncia comercial e prÃ³ximo passo ideal para cada lead.",
    "prompt": "VocÃª Ã© um PredictiveLeadScoring atuando como SDR estratÃ©gico. Analise rapidamente o contexto do lead, estime o potencial de conversÃ£o, destaque o principal risco de SLA e recomende o prÃ³ximo passo comercial mais objetivo.",
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
    "id": "presales_objectioncrusher",
    "modules": [
      "presales"
    ],
    "name": "ObjectionCrusher",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Sugere respostas perfeitas (em texto ou voz) em tempo real enquanto o SDR tenta agendar a reuniÃ£o com um lead difÃ­cil.",
    "prompt": "VocÃª Ã© um ObjectionCrusher atuando como SDR (Sales Development Representative). Sugere respostas perfeitas (em texto ou voz) em tempo real enquanto o SDR tenta agendar a reuniÃ£o com um lead difÃ­cil.",
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
    "id": "presales_personalizationengine",
    "modules": [
      "presales"
    ],
    "name": "PersonalizationEngine",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Varre as redes sociais do lead e gera e-mails de prospecÃ§Ã£o altamente personalizados focados nos interesses e dores recentes dele.",
    "prompt": "VocÃª Ã© um PersonalizationEngine atuando como SDR (Sales Development Representative). Varre as redes sociais do lead e gera e-mails de prospecÃ§Ã£o altamente personalizados focados nos interesses e dores recentes dele.",
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
    "id": "presales_followupghost",
    "modules": [
      "presales"
    ],
    "name": "FollowUpGhost",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "MantÃ©m cadÃªncias de acompanhamento infinitas e humanizadas atÃ© que o lead responda, parando automaticamente em respostas positivas/negativas.",
    "prompt": "VocÃª Ã© um FollowUpGhost atuando como SDR (Sales Development Representative). MantÃ©m cadÃªncias de acompanhamento infinitas e humanizadas atÃ© que o lead responda, parando automaticamente em respostas positivas/negativas.",
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
    "id": "presales_calendarsniper",
    "modules": [
      "presales"
    ],
    "name": "CalendarSniper",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Negocia horÃ¡rios de reuniÃ£o com o lead via e-mail e envia o convite de calendÃ¡rio sem a intervenÃ§Ã£o do SDR.",
    "prompt": "VocÃª Ã© um CalendarSniper atuando como SDR (Sales Development Representative). Negocia horÃ¡rios de reuniÃ£o com o lead via e-mail e envia o convite de calendÃ¡rio sem a intervenÃ§Ã£o do SDR.",
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
    "id": "presales_targetscraper",
    "modules": [
      "presales"
    ],
    "name": "TargetScraper",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Varre diretÃ³rios corporativos e LinkedIn para encontrar os tomadores de decisÃ£o exatos dentro de contas-alvo especÃ­ficas (Outbound puro).",
    "prompt": "VocÃª Ã© um TargetScraper atuando como BDR (Business Development Representative). Varre diretÃ³rios corporativos e LinkedIn para encontrar os tomadores de decisÃ£o exatos dentro de contas-alvo especÃ­ficas (Outbound puro).",
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
    "id": "presales_coldcallscripter",
    "modules": [
      "presales"
    ],
    "name": "ColdCallScripter",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Gera roteiros de ligaÃ§Ã£o fria dinÃ¢micos que mudam na tela do BDR dependendo das respostas do prospect.",
    "prompt": "VocÃª Ã© um ColdCallScripter atuando como BDR (Business Development Representative). Gera roteiros de ligaÃ§Ã£o fria dinÃ¢micos que mudam na tela do BDR dependendo das respostas do prospect.",
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
    "id": "presales_triggereventwatcher",
    "modules": [
      "presales"
    ],
    "name": "TriggerEventWatcher",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Alerta o BDR imediatamente se uma conta-alvo recebe investimento, contrata um novo executivo ou lanÃ§a um produto.",
    "prompt": "VocÃª Ã© um TriggerEventWatcher atuando como BDR (Business Development Representative). Alerta o BDR imediatamente se uma conta-alvo recebe investimento, contrata um novo executivo ou lanÃ§a um produto.",
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
    "id": "presales_accountmapper",
    "modules": [
      "presales"
    ],
    "name": "AccountMapper",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Cria o organograma de empresas-alvo grandes, identificando quem sÃ£o os influenciadores, bloqueadores e compradores.",
    "prompt": "VocÃª Ã© um AccountMapper atuando como BDR (Business Development Representative). Cria o organograma de empresas-alvo grandes, identificando quem sÃ£o os influenciadores, bloqueadores e compradores.",
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
    "id": "presales_voicemaildropper",
    "modules": [
      "presales"
    ],
    "name": "VoicemailDropper",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Deixa mensagens de voz perfeitamente sintetizadas com o tom de voz do BDR caso a ligaÃ§Ã£o caia na caixa postal.",
    "prompt": "VocÃª Ã© um VoicemailDropper atuando como BDR (Business Development Representative). Deixa mensagens de voz perfeitamente sintetizadas com o tom de voz do BDR caso a ligaÃ§Ã£o caia na caixa postal.",
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
    "id": "presales_datacleaner",
    "modules": [
      "presales"
    ],
    "name": "DataCleaner",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Corrige automaticamente nomes com erros de digitaÃ§Ã£o, atualiza cargos desatualizados e formata nÃºmeros de telefone no CRM.",
    "prompt": "VocÃª Ã© um DataCleaner atuando como LDR (Lead Development Representative). Corrige automaticamente nomes com erros de digitaÃ§Ã£o, atualiza cargos desatualizados e formata nÃºmeros de telefone no CRM.",
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
    "id": "presales_intentdecoder",
    "modules": [
      "presales"
    ],
    "name": "IntentDecoder",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "LÃª sinais de intenÃ§Ã£o de compra de provedores de dados terceirizados (ex: Bombora) e alerta quais empresas estÃ£o pesquisando sobre seu setor.",
    "prompt": "VocÃª Ã© um IntentDecoder atuando como LDR (Lead Development Representative). LÃª sinais de intenÃ§Ã£o de compra de provedores de dados terceirizados (ex: Bombora) e alerta quais empresas estÃ£o pesquisando sobre seu setor.",
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
    "id": "presales_webinarnurturer",
    "modules": [
      "presales"
    ],
    "name": "WebinarNurturer",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Entra em contato automaticamente com quem participou de um evento, enviando materiais extras e qualificando-os.",
    "prompt": "VocÃª Ã© um WebinarNurturer atuando como LDR (Lead Development Representative). Entra em contato automaticamente com quem participou de um evento, enviando materiais extras e qualificando-os.",
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
    "id": "presales_enrichmentbot",
    "modules": [
      "presales"
    ],
    "name": "EnrichmentBot",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Pega um simples endereÃ§o de e-mail e enriquece o CRM com o tamanho da empresa, faturamento estimado, stack de tecnologia e localizaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um EnrichmentBot atuando como LDR (Lead Development Representative). Pega um simples endereÃ§o de e-mail e enriquece o CRM com o tamanho da empresa, faturamento estimado, stack de tecnologia e localizaÃ§Ã£o.",
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
    "id": "presales_routingtrafficcop",
    "modules": [
      "presales"
    ],
    "name": "RoutingTrafficCop",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Garante que leads de campanhas de marketing nÃ£o sejam distribuÃ­dos para o SDR errado com base em territÃ³rio, fuso horÃ¡rio ou especializaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um RoutingTrafficCop atuando como LDR (Lead Development Representative). Garante que leads de campanhas de marketing nÃ£o sejam distribuÃ­dos para o SDR errado com base em territÃ³rio, fuso horÃ¡rio ou especializaÃ§Ã£o.",
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
    "id": "presales_multithreader",
    "modules": [
      "presales"
    ],
    "name": "MultiThreader",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Inicia conversas simultÃ¢neas e correlacionadas com vÃ¡rios executivos da mesma conta para cercar a empresa (Account-Based Marketing/Sales).",
    "prompt": "VocÃª Ã© um MultiThreader atuando como ADR (Account Development Representative). Inicia conversas simultÃ¢neas e correlacionadas com vÃ¡rios executivos da mesma conta para cercar a empresa (Account-Based Marketing/Sales).",
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
    "id": "presales_annualreportanalyzer",
    "modules": [
      "presales"
    ],
    "name": "AnnualReportAnalyzer",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "LÃª relatÃ³rios anuais (10-K) de grandes empresas abertas e extrai quais sÃ£o as iniciativas estratÃ©gicas para o ADR usar no pitch.",
    "prompt": "VocÃª Ã© um AnnualReportAnalyzer atuando como ADR (Account Development Representative). LÃª relatÃ³rios anuais (10-K) de grandes empresas abertas e extrai quais sÃ£o as iniciativas estratÃ©gicas para o ADR usar no pitch.",
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
    "id": "presales_competitordisplacement",
    "modules": [
      "presales"
    ],
    "name": "CompetitorDisplacement",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Identifica quando uma conta-alvo estÃ¡ usando o software concorrente e cujo contrato estÃ¡ prestes a expirar.",
    "prompt": "VocÃª Ã© um CompetitorDisplacement atuando como ADR (Account Development Representative). Identifica quando uma conta-alvo estÃ¡ usando o software concorrente e cujo contrato estÃ¡ prestes a expirar.",
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
    "id": "presales_gatekeeperbypass",
    "modules": [
      "presales"
    ],
    "name": "GatekeeperBypass",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Analisa os melhores horÃ¡rios e canais para desviar de assistentes e secretÃ¡rias, chegando direto ao tomador de decisÃ£o.",
    "prompt": "VocÃª Ã© um GatekeeperBypass atuando como ADR (Account Development Representative). Analisa os melhores horÃ¡rios e canais para desviar de assistentes e secretÃ¡rias, chegando direto ao tomador de decisÃ£o.",
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
    "id": "presales_stakeholderpersonagenerator",
    "modules": [
      "presales"
    ],
    "name": "StakeholderPersonaGenerator",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Cria perfis psicolÃ³gicos dos executivos-alvo para orientar o ADR sobre que tipo de argumento usar com cada um.",
    "prompt": "VocÃª Ã© um StakeholderPersonaGenerator atuando como ADR (Account Development Representative). Cria perfis psicolÃ³gicos dos executivos-alvo para orientar o ADR sobre que tipo de argumento usar com cada um.",
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
    "id": "presales_nicheexplorer",
    "modules": [
      "presales"
    ],
    "name": "NicheExplorer",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Encontra micro-segmentos de mercado inexplorados e gera listas de prospecÃ§Ã£o altamente nichadas.",
    "prompt": "VocÃª Ã© um NicheExplorer atuando como MDR (Market Development Representative). Encontra micro-segmentos de mercado inexplorados e gera listas de prospecÃ§Ã£o altamente nichadas.",
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
    "id": "presales_partnerecosystemscout",
    "modules": [
      "presales"
    ],
    "name": "PartnerEcosystemScout",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Identifica leads que usam ferramentas parceiras da sua empresa para focar em abordagens do tipo \"Melhor Juntos\" (Better Together).",
    "prompt": "VocÃª Ã© um PartnerEcosystemScout atuando como MDR (Market Development Representative). Identifica leads que usam ferramentas parceiras da sua empresa para focar em abordagens do tipo \"Melhor Juntos\" (Better Together).",
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
    "id": "presales_contenttolead",
    "modules": [
      "presales"
    ],
    "name": "ContentToLead",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Associa o Ãºltimo eBook ou Whitepaper que o lead baixou Ã  dor de mercado exata dele, gerando o roteiro de ligaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um ContentToLead atuando como MDR (Market Development Representative). Associa o Ãºltimo eBook ou Whitepaper que o lead baixou Ã  dor de mercado exata dele, gerando o roteiro de ligaÃ§Ã£o.",
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
    "id": "presales_eventqualifier",
    "modules": [
      "presales"
    ],
    "name": "EventQualifier",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Escaneia crachÃ¡s (digitalmente) ou listas de inscritos em eventos da indÃºstria e qualifica instantaneamente quem deve ser abordado.",
    "prompt": "VocÃª Ã© um EventQualifier atuando como MDR (Market Development Representative). Escaneia crachÃ¡s (digitalmente) ou listas de inscritos em eventos da indÃºstria e qualifica instantaneamente quem deve ser abordado.",
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
    "id": "presales_verticaltranslator",
    "modules": [
      "presales"
    ],
    "name": "VerticalTranslator",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Adapta a linguagem do MDR automaticamente. Se ele fala com uma clÃ­nica, usa termos mÃ©dicos; se fala com uma fÃ¡brica, usa jargÃµes industriais.",
    "prompt": "VocÃª Ã© um VerticalTranslator atuando como MDR (Market Development Representative). Adapta a linguagem do MDR automaticamente. Se ele fala com uma clÃ­nica, usa termos mÃ©dicos; se fala com uma fÃ¡brica, usa jargÃµes industriais.",
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
    "id": "presales_activityanalyzer",
    "modules": [
      "presales"
    ],
    "name": "ActivityAnalyzer",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Monitora o volume de ligaÃ§Ãµes e e-mails de toda a equipe, alertando se algum representante estÃ¡ abaixo da mÃ©trica.",
    "prompt": "VocÃª Ã© um ActivityAnalyzer atuando como Sales Development Team Lead. Monitora o volume de ligaÃ§Ãµes e e-mails de toda a equipe, alertando se algum representante estÃ¡ abaixo da mÃ©trica.",
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
    "id": "presales_transcriptcoach",
    "modules": [
      "presales"
    ],
    "name": "TranscriptCoach",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "LÃª as transcriÃ§Ãµes de 100% das chamadas e destaca as falhas de roteiro e oportunidades de treinamento para cada liderado.",
    "prompt": "VocÃª Ã© um TranscriptCoach atuando como Sales Development Team Lead. LÃª as transcriÃ§Ãµes de 100% das chamadas e destaca as falhas de roteiro e oportunidades de treinamento para cada liderado.",
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
    "id": "presales_gamificationmaster",
    "modules": [
      "presales"
    ],
    "name": "GamificationMaster",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Cria e gerencia competiÃ§Ãµes de vendas dinÃ¢micas (SPIFFs) baseadas nos KPIs que mais precisam melhorar na semana.",
    "prompt": "VocÃª Ã© um GamificationMaster atuando como Sales Development Team Lead. Cria e gerencia competiÃ§Ãµes de vendas dinÃ¢micas (SPIFFs) baseadas nos KPIs que mais precisam melhorar na semana.",
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
    "id": "presales_rampupassistant",
    "modules": [
      "presales"
    ],
    "name": "RampUpAssistant",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "Auxilia novos SDRs nos primeiros 30 dias, criando testes e simulaÃ§Ãµes com clientes virtuais baseados em IA.",
    "prompt": "VocÃª Ã© um RampUpAssistant atuando como Sales Development Team Lead. Auxilia novos SDRs nos primeiros 30 dias, criando testes e simulaÃ§Ãµes com clientes virtuais baseados em IA.",
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
    "id": "presales_conversionforecaster",
    "modules": [
      "presales"
    ],
    "name": "ConversionForecaster",
    "icon": "target",
    "color": "emerald",
    "emoji": "ðŸ¤–",
    "desc": "PrevÃª quantas reuniÃµes a equipe vai agendar na semana baseando-se na taxa de abertura de e-mails de hoje.",
    "prompt": "VocÃª Ã© um ConversionForecaster atuando como Sales Development Team Lead. PrevÃª quantas reuniÃµes a equipe vai agendar na semana baseando-se na taxa de abertura de e-mails de hoje.",
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
