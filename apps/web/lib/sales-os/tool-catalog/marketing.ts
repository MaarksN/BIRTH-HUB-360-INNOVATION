import type { Tool } from "../types";

export const MARKETING_TOOLS: Tool[] = [
  {
    "id": "marketing_abtestautomator",
    "modules": [
      "marketing"
    ],
    "name": "ABTestAutomator",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Cria, lanÃ§a e monitora testes A/B de pÃ¡ginas, e-mails e botÃµes, implementando a versÃ£o vencedora automaticamente apÃ³s significÃ¢ncia estatÃ­stica.",
    "prompt": "VocÃª Ã© um ABTestAutomator atuando como Growth Marketer / Growth Lead. Cria, lanÃ§a e monitora testes A/B de pÃ¡ginas, e-mails e botÃµes, implementando a versÃ£o vencedora automaticamente apÃ³s significÃ¢ncia estatÃ­stica.",
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
    "id": "marketing_virallooptracker",
    "modules": [
      "marketing"
    ],
    "name": "ViralLoopTracker",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Mapeia o coeficiente de viralidade (K-factor) dos programas de indicaÃ§Ã£o e sugere recompensas para otimizar os compartilhamentos.",
    "prompt": "VocÃª Ã© um ViralLoopTracker atuando como Growth Marketer / Growth Lead. Mapeia o coeficiente de viralidade (K-factor) dos programas de indicaÃ§Ã£o e sugere recompensas para otimizar os compartilhamentos.",
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
    "id": "marketing_activationoptimizer",
    "modules": [
      "marketing"
    ],
    "name": "ActivationOptimizer",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Monitora o \"Aha! Moment\" de novos usuÃ¡rios e ajusta tutoriais in-app para levÃ¡-los a esse momento mais rÃ¡pido.",
    "prompt": "VocÃª Ã© um ActivationOptimizer atuando como Growth Marketer / Growth Lead. Monitora o \"Aha! Moment\" de novos usuÃ¡rios e ajusta tutoriais in-app para levÃ¡-los a esse momento mais rÃ¡pido.",
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
    "id": "marketing_cacltvmodeler",
    "modules": [
      "marketing"
    ],
    "name": "CACLTVModeler",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Calcula dinamicamente o Custo de AquisiÃ§Ã£o (CAC) e o Lifetime Value (LTV) por canal, alertando sobre segmentos nÃ£o rentÃ¡veis.",
    "prompt": "VocÃª Ã© um CACLTVModeler atuando como Growth Marketer / Growth Lead. Calcula dinamicamente o Custo de AquisiÃ§Ã£o (CAC) e o Lifetime Value (LTV) por canal, alertando sobre segmentos nÃ£o rentÃ¡veis.",
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
    "id": "marketing_churnpredictor_growth",
    "modules": [
      "marketing"
    ],
    "name": "ChurnPredictor (Growth)",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Identifica padrÃµes de uso associados Ã  evasÃ£o em produtos freemium e dispara pop-ups de engajamento antes do usuÃ¡rio sair.",
    "prompt": "VocÃª Ã© um ChurnPredictor (Growth) atuando como Growth Marketer / Growth Lead. Identifica padrÃµes de uso associados Ã  evasÃ£o em produtos freemium e dispara pop-ups de engajamento antes do usuÃ¡rio sair.",
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
    "id": "marketing_adcopymachine",
    "modules": [
      "marketing"
    ],
    "name": "AdCopyMachine",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Gera centenas de variaÃ§Ãµes de tÃ­tulos e descriÃ§Ãµes para anÃºncios no Google/Meta perfeitamente otimizados para cliques.",
    "prompt": "VocÃª Ã© um AdCopyMachine atuando como Demand Generation Manager. Gera centenas de variaÃ§Ãµes de tÃ­tulos e descriÃ§Ãµes para anÃºncios no Google/Meta perfeitamente otimizados para cliques.",
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
    "id": "marketing_landingpagemorpher",
    "modules": [
      "marketing"
    ],
    "name": "LandingPageMorpher",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Altera as imagens e o texto da Landing Page em tempo real baseando-se no anÃºncio especÃ­fico que o usuÃ¡rio clicou (PersonalizaÃ§Ã£o DinÃ¢mica).",
    "prompt": "VocÃª Ã© um LandingPageMorpher atuando como Demand Generation Manager. Altera as imagens e o texto da Landing Page em tempo real baseando-se no anÃºncio especÃ­fico que o usuÃ¡rio clicou (PersonalizaÃ§Ã£o DinÃ¢mica).",
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
    "id": "marketing_webinarpromoter",
    "modules": [
      "marketing"
    ],
    "name": "WebinarPromoter",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Cria a sequÃªncia inteira de divulgaÃ§Ã£o de um evento: convites, lembretes de calendÃ¡rio e follow-ups pÃ³s-evento.",
    "prompt": "VocÃª Ã© um WebinarPromoter atuando como Demand Generation Manager. Cria a sequÃªncia inteira de divulgaÃ§Ã£o de um evento: convites, lembretes de calendÃ¡rio e follow-ups pÃ³s-evento.",
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
    "id": "marketing_leadmagnetcreator",
    "modules": [
      "marketing"
    ],
    "name": "LeadMagnetCreator",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Analisa os termos mais buscados do blog e gera automaticamente eBooks e Checklists baseados nos conteÃºdos existentes.",
    "prompt": "VocÃª Ã© um LeadMagnetCreator atuando como Demand Generation Manager. Analisa os termos mais buscados do blog e gera automaticamente eBooks e Checklists baseados nos conteÃºdos existentes.",
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
    "id": "marketing_campaignorchestrator",
    "modules": [
      "marketing"
    ],
    "name": "CampaignOrchestrator",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Sincroniza anÃºncios, e-mails e mensagens de LinkedIn para garantir que o prospect veja a mesma mensagem em todos os canais.",
    "prompt": "VocÃª Ã© um CampaignOrchestrator atuando como Demand Generation Manager. Sincroniza anÃºncios, e-mails e mensagens de LinkedIn para garantir que o prospect veja a mesma mensagem em todos os canais.",
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
    "id": "marketing_battlecardupdater",
    "modules": [
      "marketing"
    ],
    "name": "BattlecardUpdater",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Varre o site e as notÃ­cias dos concorrentes diariamente e atualiza os manuais de \"como vender contra\" (Battlecards) para o time de vendas.",
    "prompt": "VocÃª Ã© um BattlecardUpdater atuando como Product Marketing Manager (PMM). Varre o site e as notÃ­cias dos concorrentes diariamente e atualiza os manuais de \"como vender contra\" (Battlecards) para o time de vendas.",
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
    "id": "marketing_releasenotewriter",
    "modules": [
      "marketing"
    ],
    "name": "ReleaseNoteWriter",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Transforma logs de cÃ³digo (GitHub/Jira) dos desenvolvedores em notas de lanÃ§amento (Release Notes) amigÃ¡veis e focadas no benefÃ­cio para o cliente.",
    "prompt": "VocÃª Ã© um ReleaseNoteWriter atuando como Product Marketing Manager (PMM). Transforma logs de cÃ³digo (GitHub/Jira) dos desenvolvedores em notas de lanÃ§amento (Release Notes) amigÃ¡veis e focadas no benefÃ­cio para o cliente.",
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
    "id": "marketing_positioningtester",
    "modules": [
      "marketing"
    ],
    "name": "PositioningTester",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Roda pesquisas em massa com o mercado-alvo para testar se a mensagem (\"messaging\") do produto Ã© clara e atrativa.",
    "prompt": "VocÃª Ã© um PositioningTester atuando como Product Marketing Manager (PMM). Roda pesquisas em massa com o mercado-alvo para testar se a mensagem (\"messaging\") do produto Ã© clara e atrativa.",
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
    "id": "marketing_personasync",
    "modules": [
      "marketing"
    ],
    "name": "PersonaSync",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Atualiza os perfis das Buyer Personas em tempo real com base nos dados de quem realmente estÃ¡ fechando contratos no CRM.",
    "prompt": "VocÃª Ã© um PersonaSync atuando como Product Marketing Manager (PMM). Atualiza os perfis das Buyer Personas em tempo real com base nos dados de quem realmente estÃ¡ fechando contratos no CRM.",
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
    "id": "marketing_launchplanner",
    "modules": [
      "marketing"
    ],
    "name": "LaunchPlanner",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Cria o cronograma reverso completo de um grande lanÃ§amento de produto, delegando tarefas para PR, Vendas e ConteÃºdo.",
    "prompt": "VocÃª Ã© um LaunchPlanner atuando como Product Marketing Manager (PMM). Cria o cronograma reverso completo de um grande lanÃ§amento de produto, delegando tarefas para PR, Vendas e ConteÃºdo.",
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
    "id": "marketing_bidautoadjuster",
    "modules": [
      "marketing"
    ],
    "name": "BidAutoAdjuster",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Controla os lances das palavras-chave a cada minuto nas plataformas de anÃºncios, garantindo a primeira posiÃ§Ã£o com o menor custo possÃ­vel.",
    "prompt": "VocÃª Ã© um BidAutoAdjuster atuando como Performance Marketing Manager. Controla os lances das palavras-chave a cada minuto nas plataformas de anÃºncios, garantindo a primeira posiÃ§Ã£o com o menor custo possÃ­vel.",
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
    "id": "marketing_keywordopportunityspotter",
    "modules": [
      "marketing"
    ],
    "name": "KeywordOpportunitySpotter",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Encontra palavras-chave de cauda longa altamente rentÃ¡veis e de baixa concorrÃªncia que os concorrentes estÃ£o ignorando.",
    "prompt": "VocÃª Ã© um KeywordOpportunitySpotter atuando como Performance Marketing Manager. Encontra palavras-chave de cauda longa altamente rentÃ¡veis e de baixa concorrÃªncia que os concorrentes estÃ£o ignorando.",
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
    "id": "marketing_adfatiguemonitor",
    "modules": [
      "marketing"
    ],
    "name": "AdFatigueMonitor",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Detecta quando a taxa de cliques (CTR) de uma imagem ou vÃ­deo comeÃ§a a cair e a pausa, trocando por um criativo novo.",
    "prompt": "VocÃª Ã© um AdFatigueMonitor atuando como Performance Marketing Manager. Detecta quando a taxa de cliques (CTR) de uma imagem ou vÃ­deo comeÃ§a a cair e a pausa, trocando por um criativo novo.",
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
    "id": "marketing_creativeassettester",
    "modules": [
      "marketing"
    ],
    "name": "CreativeAssetTester",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Analisa quais elementos dos vÃ­deos de anÃºncio (cores, rosto, mÃºsica) geram mais conversÃ£o, instruindo o time de design.",
    "prompt": "VocÃª Ã© um CreativeAssetTester atuando como Performance Marketing Manager. Analisa quais elementos dos vÃ­deos de anÃºncio (cores, rosto, mÃºsica) geram mais conversÃ£o, instruindo o time de design.",
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
    "id": "marketing_roasmaximizer",
    "modules": [
      "marketing"
    ],
    "name": "ROASMaximizer",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Move o orÃ§amento freneticamente entre campanhas durante a Black Friday ou dias de pico para maximizar o Retorno sobre Gasto com AnÃºncios.",
    "prompt": "VocÃª Ã© um ROASMaximizer atuando como Performance Marketing Manager. Move o orÃ§amento freneticamente entre campanhas durante a Black Friday ou dias de pico para maximizar o Retorno sobre Gasto com AnÃºncios.",
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
    "id": "marketing_topicclusterplanner",
    "modules": [
      "marketing"
    ],
    "name": "TopicClusterPlanner",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Analisa as lacunas de SEO e gera um calendÃ¡rio editorial de 6 meses completo, organizando temas centrais e artigos de suporte.",
    "prompt": "VocÃª Ã© um TopicClusterPlanner atuando como Content Strategist / Content Marketing Manager. Analisa as lacunas de SEO e gera um calendÃ¡rio editorial de 6 meses completo, organizando temas centrais e artigos de suporte.",
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
    "id": "marketing_seodraftwriter",
    "modules": [
      "marketing"
    ],
    "name": "SEODraftWriter",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Produz o esqueleto e o primeiro rascunho de artigos com formataÃ§Ã£o H1/H2 e densidade de palavras-chave perfeitas para rankear no Google.",
    "prompt": "VocÃª Ã© um SEODraftWriter atuando como Content Strategist / Content Marketing Manager. Produz o esqueleto e o primeiro rascunho de artigos com formataÃ§Ã£o H1/H2 e densidade de palavras-chave perfeitas para rankear no Google.",
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
    "id": "marketing_plagiarismtonechecker",
    "modules": [
      "marketing"
    ],
    "name": "PlagiarismToneChecker",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Garante que o conteÃºdo final gerado por freelancers nÃ£o seja plÃ¡gio e corrige o texto para a \"voz da marca\".",
    "prompt": "VocÃª Ã© um PlagiarismToneChecker atuando como Content Strategist / Content Marketing Manager. Garante que o conteÃºdo final gerado por freelancers nÃ£o seja plÃ¡gio e corrige o texto para a \"voz da marca\".",
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
    "id": "marketing_contentrepurposer",
    "modules": [
      "marketing"
    ],
    "name": "ContentRepurposer",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Pega 1 Webinar gravado e o transforma automaticamente em 1 artigo de blog, 10 posts de LinkedIn, 1 thread de Twitter e 1 email.",
    "prompt": "VocÃª Ã© um ContentRepurposer atuando como Content Strategist / Content Marketing Manager. Pega 1 Webinar gravado e o transforma automaticamente em 1 artigo de blog, 10 posts de LinkedIn, 1 thread de Twitter e 1 email.",
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
    "id": "marketing_distributionautomator",
    "modules": [
      "marketing"
    ],
    "name": "DistributionAutomator",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Publica os conteÃºdos nas redes sociais nos horÃ¡rios de pico especÃ­ficos de cada plataforma e marca influenciadores relevantes.",
    "prompt": "VocÃª Ã© um DistributionAutomator atuando como Content Strategist / Content Marketing Manager. Publica os conteÃºdos nas redes sociais nos horÃ¡rios de pico especÃ­ficos de cada plataforma e marca influenciadores relevantes.",
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
    "id": "marketing_subjectlinetester",
    "modules": [
      "marketing"
    ],
    "name": "SubjectLineTester",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "PrevÃª a taxa de abertura de um e-mail antes de enviÃ¡-lo, sugerindo emoÃ§Ãµes, emojis e palavras de urgÃªncia para o tÃ­tulo.",
    "prompt": "VocÃª Ã© um SubjectLineTester atuando como Lifecycle / Email Marketing Manager. PrevÃª a taxa de abertura de um e-mail antes de enviÃ¡-lo, sugerindo emoÃ§Ãµes, emojis e palavras de urgÃªncia para o tÃ­tulo.",
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
    "id": "marketing_churnwinbacksequencer",
    "modules": [
      "marketing"
    ],
    "name": "ChurnWinBackSequencer",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Desenha fluxos de e-mail agressivos e personalizados com ofertas exclusivas para reconquistar clientes que cancelaram hÃ¡ 6 meses.",
    "prompt": "VocÃª Ã© um ChurnWinBackSequencer atuando como Lifecycle / Email Marketing Manager. Desenha fluxos de e-mail agressivos e personalizados com ofertas exclusivas para reconquistar clientes que cancelaram hÃ¡ 6 meses.",
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
    "id": "marketing_dripcampaigntrigger",
    "modules": [
      "marketing"
    ],
    "name": "DripCampaignTrigger",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Configura a lÃ³gica de envio de e-mails baseada nas aÃ§Ãµes do usuÃ¡rio (ex: se clicou no e-mail 1, envie o 2A; se nÃ£o clicou, envie o 2B).",
    "prompt": "VocÃª Ã© um DripCampaignTrigger atuando como Lifecycle / Email Marketing Manager. Configura a lÃ³gica de envio de e-mails baseada nas aÃ§Ãµes do usuÃ¡rio (ex: se clicou no e-mail 1, envie o 2A; se nÃ£o clicou, envie o 2B).",
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
    "id": "marketing_newslettercurator",
    "modules": [
      "marketing"
    ],
    "name": "NewsletterCurator",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Vasculha as melhores notÃ­cias do setor durante a semana e monta uma newsletter curada pronta para envio na sexta-feira.",
    "prompt": "VocÃª Ã© um NewsletterCurator atuando como Lifecycle / Email Marketing Manager. Vasculha as melhores notÃ­cias do setor durante a semana e monta uma newsletter curada pronta para envio na sexta-feira.",
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
    "id": "marketing_unsubscribepredictor",
    "modules": [
      "marketing"
    ],
    "name": "UnsubscribePredictor",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Evita o envio de campanhas promocionais para usuÃ¡rios com alto risco de clicar em \"descadastrar\", protegendo a reputabilidade do domÃ­nio.",
    "prompt": "VocÃª Ã© um UnsubscribePredictor atuando como Lifecycle / Email Marketing Manager. Evita o envio de campanhas promocionais para usuÃ¡rios com alto risco de clicar em \"descadastrar\", protegendo a reputabilidade do domÃ­nio.",
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
    "id": "marketing_martechsync",
    "modules": [
      "marketing"
    ],
    "name": "MarTechSync",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Monitora as integraÃ§Ãµes via API entre o CRM (Salesforce/Hubspot) e a automaÃ§Ã£o de marketing (Marketo/Pardot) para evitar perda de dados.",
    "prompt": "VocÃª Ã© um MarTechSync atuando como Marketing Operations Manager. Monitora as integraÃ§Ãµes via API entre o CRM (Salesforce/Hubspot) e a automaÃ§Ã£o de marketing (Marketo/Pardot) para evitar perda de dados.",
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
    "id": "marketing_datahygienemonitor",
    "modules": [
      "marketing"
    ],
    "name": "DataHygieneMonitor",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Encontra e mescla leads duplicados, deleta e-mails inexistentes (hard bounces) e padroniza campos de formulÃ¡rio (ex: EUA para US).",
    "prompt": "VocÃª Ã© um DataHygieneMonitor atuando como Marketing Operations Manager. Encontra e mescla leads duplicados, deleta e-mails inexistentes (hard bounces) e padroniza campos de formulÃ¡rio (ex: EUA para US).",
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
    "id": "marketing_utmbuilderbot",
    "modules": [
      "marketing"
    ],
    "name": "UTMBuilderBot",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Gera links de rastreamento (UTMs) infalÃ­veis para todas as campanhas e garante que as agÃªncias os usem corretamente.",
    "prompt": "VocÃª Ã© um UTMBuilderBot atuando como Marketing Operations Manager. Gera links de rastreamento (UTMs) infalÃ­veis para todas as campanhas e garante que as agÃªncias os usem corretamente.",
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
    "id": "marketing_leadroutingtroubleshooter",
    "modules": [
      "marketing"
    ],
    "name": "LeadRoutingTroubleshooter",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Identifica por que um lead \"esquentou\" mas nÃ£o foi parar na caixa de entrada do SDR, consertando as regras de roteamento.",
    "prompt": "VocÃª Ã© um LeadRoutingTroubleshooter atuando como Marketing Operations Manager. Identifica por que um lead \"esquentou\" mas nÃ£o foi parar na caixa de entrada do SDR, consertando as regras de roteamento.",
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
    "id": "marketing_dashboardautomator",
    "modules": [
      "marketing"
    ],
    "name": "DashboardAutomator",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Puxa dados de 15 fontes diferentes e atualiza o dashboard de marketing no Tableau/PowerBI em tempo real, sem planilhas intermediÃ¡rias.",
    "prompt": "VocÃª Ã© um DashboardAutomator atuando como Marketing Operations Manager. Puxa dados de 15 fontes diferentes e atualiza o dashboard de marketing no Tableau/PowerBI em tempo real, sem planilhas intermediÃ¡rias.",
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
    "id": "marketing_backlinkscouter",
    "modules": [
      "marketing"
    ],
    "name": "BacklinkScouter",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Identifica sites com alta autoridade de domÃ­nio, encontra links quebrados neles e envia um e-mail sugerindo a troca pelo link da sua empresa.",
    "prompt": "VocÃª Ã© um BacklinkScouter atuando como SEO Manager / SEO Growth Manager. Identifica sites com alta autoridade de domÃ­nio, encontra links quebrados neles e envia um e-mail sugerindo a troca pelo link da sua empresa.",
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
    "id": "marketing_onpageoptimizer",
    "modules": [
      "marketing"
    ],
    "name": "OnPageOptimizer",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Analisa as pÃ¡ginas do site sugerindo melhorias em Meta Tags, Alt Text de imagens e velocidade de carregamento (Core Web Vitals).",
    "prompt": "VocÃª Ã© um OnPageOptimizer atuando como SEO Manager / SEO Growth Manager. Analisa as pÃ¡ginas do site sugerindo melhorias em Meta Tags, Alt Text de imagens e velocidade de carregamento (Core Web Vitals).",
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
    "id": "marketing_cannibalizationdetector",
    "modules": [
      "marketing"
    ],
    "name": "CannibalizationDetector",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Alerta quando dois artigos do blog da empresa estÃ£o competindo pela mesma palavra-chave no Google e sugere consolidaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um CannibalizationDetector atuando como SEO Manager / SEO Growth Manager. Alerta quando dois artigos do blog da empresa estÃ£o competindo pela mesma palavra-chave no Google e sugere consolidaÃ§Ã£o.",
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
    "id": "marketing_serpvolatilitytracker",
    "modules": [
      "marketing"
    ],
    "name": "SERPVolatilityTracker",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Monitora as atualizaÃ§Ãµes de algoritmo do Google e avisa imediatamente se o site perdeu posiÃ§Ãµes na primeira pÃ¡gina.",
    "prompt": "VocÃª Ã© um SERPVolatilityTracker atuando como SEO Manager / SEO Growth Manager. Monitora as atualizaÃ§Ãµes de algoritmo do Google e avisa imediatamente se o site perdeu posiÃ§Ãµes na primeira pÃ¡gina.",
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
    "id": "marketing_schemamarkupgenerator",
    "modules": [
      "marketing"
    ],
    "name": "SchemaMarkupGenerator",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Cria cÃ³digos estruturados (Schema) automaticamente para gerar \"Rich Snippets\" (estrelas, FAQs) nos resultados de busca do Google.",
    "prompt": "VocÃª Ã© um SchemaMarkupGenerator atuando como SEO Manager / SEO Growth Manager. Cria cÃ³digos estruturados (Schema) automaticamente para gerar \"Rich Snippets\" (estrelas, FAQs) nos resultados de busca do Google.",
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
    "id": "marketing_brandguidelineenforcer",
    "modules": [
      "marketing"
    ],
    "name": "BrandGuidelineEnforcer",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Vasculha a internet em busca do logo antigo ou distorcido da empresa sendo usado por parceiros, gerando avisos de correÃ§Ã£o.",
    "prompt": "VocÃª Ã© um BrandGuidelineEnforcer atuando como Brand & Integrated Marketing Lead. Vasculha a internet em busca do logo antigo ou distorcido da empresa sendo usado por parceiros, gerando avisos de correÃ§Ã£o.",
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
    "id": "marketing_prscraper",
    "modules": [
      "marketing"
    ],
    "name": "PRScraper",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "LÃª notÃ­cias mundiais para alertar quando a marca ou os executivos da empresa sÃ£o mencionados, avaliando o sentimento da notÃ­cia.",
    "prompt": "VocÃª Ã© um PRScraper atuando como Brand & Integrated Marketing Lead. LÃª notÃ­cias mundiais para alertar quando a marca ou os executivos da empresa sÃ£o mencionados, avaliando o sentimento da notÃ­cia.",
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
    "id": "marketing_sentimentshiftalerter",
    "modules": [
      "marketing"
    ],
    "name": "SentimentShiftAlerter",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Notifica a diretoria imediatamente se uma campanha de marketing estÃ¡ gerando reaÃ§Ãµes negativas ou \"cancelamento\" nas redes.",
    "prompt": "VocÃª Ã© um SentimentShiftAlerter atuando como Brand & Integrated Marketing Lead. Notifica a diretoria imediatamente se uma campanha de marketing estÃ¡ gerando reaÃ§Ãµes negativas ou \"cancelamento\" nas redes.",
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
    "id": "marketing_influencervettor",
    "modules": [
      "marketing"
    ],
    "name": "InfluencerVettor",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Analisa profundamente o histÃ³rico de criadores de conteÃºdo para garantir que nÃ£o tenham polÃªmicas passadas antes da empresa patrocinÃ¡-los.",
    "prompt": "VocÃª Ã© um InfluencerVettor atuando como Brand & Integrated Marketing Lead. Analisa profundamente o histÃ³rico de criadores de conteÃºdo para garantir que nÃ£o tenham polÃªmicas passadas antes da empresa patrocinÃ¡-los.",
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
    "id": "marketing_crisiscommsdrafter",
    "modules": [
      "marketing"
    ],
    "name": "CrisisCommsDrafter",
    "icon": "megaphone",
    "color": "pink",
    "emoji": "ðŸ¤–",
    "desc": "Em caso de crise de marca, prepara instantaneamente respostas para redes sociais e press releases defensivos.",
    "prompt": "VocÃª Ã© um CrisisCommsDrafter atuando como Brand & Integrated Marketing Lead. Em caso de crise de marca, prepara instantaneamente respostas para redes sociais e press releases defensivos.",
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
