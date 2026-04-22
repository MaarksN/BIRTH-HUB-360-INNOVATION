import type { Tool } from "../types";

export const CS_TOOLS: Tool[] = [
  {
    "id": "cs_qbrdeckbuilder",
    "modules": [
      "cs"
    ],
    "name": "QBRDeckBuilder",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Rascunha a apresentaÃ§Ã£o da \"RevisÃ£o Executiva de NegÃ³cios\" (QBR) com as mÃ©tricas de uso e valor entregue ao cliente no trimestre.",
    "prompt": "VocÃª Ã© um QBRDeckBuilder atuando como Customer Success Manager (CSM). Rascunha a apresentaÃ§Ã£o da \"RevisÃ£o Executiva de NegÃ³cios\" (QBR) com as mÃ©tricas de uso e valor entregue ao cliente no trimestre.",
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
    "id": "cs_healthscoretrigger",
    "modules": [
      "cs"
    ],
    "name": "HealthScoreTrigger",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Envia um alerta ao CSM quando a \"SaÃºde do Cliente\" fica amarela, instruindo exatamente qual a aÃ§Ã£o corretiva a tomar.",
    "prompt": "VocÃª Ã© um HealthScoreTrigger atuando como Customer Success Manager (CSM). Envia um alerta ao CSM quando a \"SaÃºde do Cliente\" fica amarela, instruindo exatamente qual a aÃ§Ã£o corretiva a tomar.",
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
    "id": "cs_upsellprompt",
    "modules": [
      "cs"
    ],
    "name": "UpsellPrompt",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Detecta quando o cliente atingiu o limite de licenÃ§as e sugere o e-mail exato para oferecer o upgrade para o plano superior.",
    "prompt": "VocÃª Ã© um UpsellPrompt atuando como Customer Success Manager (CSM). Detecta quando o cliente atingiu o limite de licenÃ§as e sugere o e-mail exato para oferecer o upgrade para o plano superior.",
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
    "id": "cs_bestpracticerecommender",
    "modules": [
      "cs"
    ],
    "name": "BestPracticeRecommender",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Cruza dados de empresas similares e envia relatÃ³rios automatizados ao cliente sugerindo como usar a plataforma melhor.",
    "prompt": "VocÃª Ã© um BestPracticeRecommender atuando como Customer Success Manager (CSM). Cruza dados de empresas similares e envia relatÃ³rios automatizados ao cliente sugerindo como usar a plataforma melhor.",
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
    "id": "cs_executivesponsortracker",
    "modules": [
      "cs"
    ],
    "name": "ExecutiveSponsorTracker",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Monitora o LinkedIn do decisor do cliente. Se ele trocar de emprego, aciona o CSM para construir relacionamento com o sucessor.",
    "prompt": "VocÃª Ã© um ExecutiveSponsorTracker atuando como Customer Success Manager (CSM). Monitora o LinkedIn do decisor do cliente. Se ele trocar de emprego, aciona o CSM para construir relacionamento com o sucessor.",
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
    "id": "cs_projectplantracker",
    "modules": [
      "cs"
    ],
    "name": "ProjectPlanTracker",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Atualiza o grÃ¡fico de Gantt da implementaÃ§Ã£o automaticamente com base nos e-mails e tarefas concluÃ­das pelo cliente.",
    "prompt": "VocÃª Ã© um ProjectPlanTracker atuando como Implementation Specialist. Atualiza o grÃ¡fico de Gantt da implementaÃ§Ã£o automaticamente com base nos e-mails e tarefas concluÃ­das pelo cliente.",
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
    "id": "cs_apikeyconfigurator",
    "modules": [
      "cs"
    ],
    "name": "APIKeyConfigurator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Guia o desenvolvedor do cliente atravÃ©s de um chatbot para configurar integraÃ§Ãµes, testar chaves API e validar payloads sem envolver humanos.",
    "prompt": "VocÃª Ã© um APIKeyConfigurator atuando como Implementation Specialist. Guia o desenvolvedor do cliente atravÃ©s de um chatbot para configurar integraÃ§Ãµes, testar chaves API e validar payloads sem envolver humanos.",
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
    "id": "cs_datamigrationvalidator",
    "modules": [
      "cs"
    ],
    "name": "DataMigrationValidator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Audita o banco de dados que o cliente importou (Planilhas/CSVs) apontando erros, cÃ©lulas vazias e corrigindo a formataÃ§Ã£o.",
    "prompt": "VocÃª Ã© um DataMigrationValidator atuando como Implementation Specialist. Audita o banco de dados que o cliente importou (Planilhas/CSVs) apontando erros, cÃ©lulas vazias e corrigindo a formataÃ§Ã£o.",
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
    "id": "cs_milestonechaser",
    "modules": [
      "cs"
    ],
    "name": "MilestoneChaser",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Envia lembretes educados e automatizados para o cliente quando ele estÃ¡ atrasando a entrega de materiais necessÃ¡rios para a implantaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um MilestoneChaser atuando como Implementation Specialist. Envia lembretes educados e automatizados para o cliente quando ele estÃ¡ atrasando a entrega de materiais necessÃ¡rios para a implantaÃ§Ã£o.",
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
    "id": "cs_delayescalator",
    "modules": [
      "cs"
    ],
    "name": "DelayEscalator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Percebe quando um projeto estÃ¡ travado hÃ¡ mais de 15 dias e aciona o gerente de implementaÃ§Ãµes para intervenÃ§Ã£o executiva.",
    "prompt": "VocÃª Ã© um DelayEscalator atuando como Implementation Specialist. Percebe quando um projeto estÃ¡ travado hÃ¡ mais de 15 dias e aciona o gerente de implementaÃ§Ãµes para intervenÃ§Ã£o executiva.",
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
    "id": "cs_welcomesequencer",
    "modules": [
      "cs"
    ],
    "name": "WelcomeSequencer",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Adapta a sequÃªncia de boas-vindas dependendo da senioridade do usuÃ¡rio (um CEO recebe conteÃºdo de ROI, um analista recebe tutoriais prÃ¡ticos).",
    "prompt": "VocÃª Ã© um WelcomeSequencer atuando como Onboarding Manager. Adapta a sequÃªncia de boas-vindas dependendo da senioridade do usuÃ¡rio (um CEO recebe conteÃºdo de ROI, um analista recebe tutoriais prÃ¡ticos).",
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
    "id": "cs_ahamomenttracker",
    "modules": [
      "cs"
    ],
    "name": "AhaMomentTracker",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Identifica o momento exato em que o cliente obtÃ©m o primeiro valor da ferramenta e dispara uma mensagem de celebraÃ§Ã£o/gamificaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um AhaMomentTracker atuando como Onboarding Manager. Identifica o momento exato em que o cliente obtÃ©m o primeiro valor da ferramenta e dispara uma mensagem de celebraÃ§Ã£o/gamificaÃ§Ã£o.",
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
    "id": "cs_trainingvideorecommender",
    "modules": [
      "cs"
    ],
    "name": "TrainingVideoRecommender",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Observa onde o usuÃ¡rio clica e empaca no software, abrindo pop-ups com vÃ­deos curtos exatamente sobre aquela funcionalidade.",
    "prompt": "VocÃª Ã© um TrainingVideoRecommender atuando como Onboarding Manager. Observa onde o usuÃ¡rio clica e empaca no software, abrindo pop-ups com vÃ­deos curtos exatamente sobre aquela funcionalidade.",
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
    "id": "cs_faqautoresponder",
    "modules": [
      "cs"
    ],
    "name": "FAQAutoResponder",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Responde dÃºvidas repetitivas enviadas por e-mail nos primeiros 30 dias usando o manual de implantaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um FAQAutoResponder atuando como Onboarding Manager. Responde dÃºvidas repetitivas enviadas por e-mail nos primeiros 30 dias usando o manual de implantaÃ§Ã£o.",
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
    "id": "cs_adoptionmetricanalyzer",
    "modules": [
      "cs"
    ],
    "name": "AdoptionMetricAnalyzer",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Compara a velocidade de adoÃ§Ã£o do cliente atual com a mÃ©dia histÃ³rica dos clientes bem-sucedidos para prever sucesso.",
    "prompt": "VocÃª Ã© um AdoptionMetricAnalyzer atuando como Onboarding Manager. Compara a velocidade de adoÃ§Ã£o do cliente atual com a mÃ©dia histÃ³rica dos clientes bem-sucedidos para prever sucesso.",
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
    "id": "cs_ticketclassifier",
    "modules": [
      "cs"
    ],
    "name": "TicketClassifier",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "LÃª o ticket de suporte, entende a urgÃªncia e o categoriza perfeitamente, enviando para o departamento ou nÃ­vel de suporte correto.",
    "prompt": "VocÃª Ã© um TicketClassifier atuando como Customer Support Specialist (L1, L2, L3). LÃª o ticket de suporte, entende a urgÃªncia e o categoriza perfeitamente, enviando para o departamento ou nÃ­vel de suporte correto.",
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
    "id": "cs_semanticsearchkb",
    "modules": [
      "cs"
    ],
    "name": "SemanticSearchKB",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Transforma a busca da base de conhecimento; ao invÃ©s de buscar palavras, entende o problema do cliente e traz a soluÃ§Ã£o em um parÃ¡grafo.",
    "prompt": "VocÃª Ã© um SemanticSearchKB atuando como Customer Support Specialist (L1, L2, L3). Transforma a busca da base de conhecimento; ao invÃ©s de buscar palavras, entende o problema do cliente e traz a soluÃ§Ã£o em um parÃ¡grafo.",
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
    "id": "cs_l1autoresolver",
    "modules": [
      "cs"
    ],
    "name": "L1AutoResolver",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Resolve sozinho 80% das chamadas comuns (reset de senha, dÃºvidas de faturamento, onde clicar) comunicando-se de forma humanizada.",
    "prompt": "VocÃª Ã© um L1AutoResolver atuando como Customer Support Specialist (L1, L2, L3). Resolve sozinho 80% das chamadas comuns (reset de senha, dÃºvidas de faturamento, onde clicar) comunicando-se de forma humanizada.",
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
    "id": "cs_l3bugreplicator",
    "modules": [
      "cs"
    ],
    "name": "L3BugReplicator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Traduz o relato vago do cliente (\"deu erro\") em uma sÃ©rie de passos de reproduÃ§Ã£o, logs do sistema e linhas de cÃ³digo provÃ¡veis para o engenheiro.",
    "prompt": "VocÃª Ã© um L3BugReplicator atuando como Customer Support Specialist (L1, L2, L3). Traduz o relato vago do cliente (\"deu erro\") em uma sÃ©rie de passos de reproduÃ§Ã£o, logs do sistema e linhas de cÃ³digo provÃ¡veis para o engenheiro.",
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
    "id": "cs_angrycustomerescalator",
    "modules": [
      "cs"
    ],
    "name": "AngryCustomerEscalator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Percebe linguagem agressiva, CAIXA ALTA ou histÃ³rico de frustraÃ§Ã£o no chat e roteia instantaneamente para um humano sÃªnior.",
    "prompt": "VocÃª Ã© um AngryCustomerEscalator atuando como Customer Support Specialist (L1, L2, L3). Percebe linguagem agressiva, CAIXA ALTA ou histÃ³rico de frustraÃ§Ã£o no chat e roteia instantaneamente para um humano sÃªnior.",
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
    "id": "cs_slamonitor",
    "modules": [
      "cs"
    ],
    "name": "SLAMonitor",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Fiscaliza os Acordos de NÃ­vel de ServiÃ§o. Se um ticket tÃ©cnico estÃ¡ prestes a violar o tempo de resposta, cria alertas vermelhos.",
    "prompt": "VocÃª Ã© um SLAMonitor atuando como Technical Account Manager (TAM). Fiscaliza os Acordos de NÃ­vel de ServiÃ§o. Se um ticket tÃ©cnico estÃ¡ prestes a violar o tempo de resposta, cria alertas vermelhos.",
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
    "id": "cs_patchupdatealerter",
    "modules": [
      "cs"
    ],
    "name": "PatchUpdateAlerter",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Avisa o cliente proativamente sobre atualizaÃ§Ãµes e correÃ§Ãµes de seguranÃ§a (patches), analisando se a atualizaÃ§Ã£o vai quebrar o cÃ³digo deles.",
    "prompt": "VocÃª Ã© um PatchUpdateAlerter atuando como Technical Account Manager (TAM). Avisa o cliente proativamente sobre atualizaÃ§Ãµes e correÃ§Ãµes de seguranÃ§a (patches), analisando se a atualizaÃ§Ã£o vai quebrar o cÃ³digo deles.",
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
    "id": "cs_scalabilitypredictor",
    "modules": [
      "cs"
    ],
    "name": "ScalabilityPredictor",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Monitora a infraestrutura do cliente e prevÃª quando eles vÃ£o precisar comprar mais servidores ou banda antes que o sistema deles caia.",
    "prompt": "VocÃª Ã© um ScalabilityPredictor atuando como Technical Account Manager (TAM). Monitora a infraestrutura do cliente e prevÃª quando eles vÃ£o precisar comprar mais servidores ou banda antes que o sistema deles caia.",
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
    "id": "cs_customscriptgenerator",
    "modules": [
      "cs"
    ],
    "name": "CustomScriptGenerator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Escreve scripts curtos (Python/Bash) para ajudar o cliente a automatizar rotinas internas ligadas ao produto.",
    "prompt": "VocÃª Ã© um CustomScriptGenerator atuando como Technical Account Manager (TAM). Escreve scripts curtos (Python/Bash) para ajudar o cliente a automatizar rotinas internas ligadas ao produto.",
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
    "id": "cs_outagecommunicator",
    "modules": [
      "cs"
    ],
    "name": "OutageCommunicator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Durante quedas de servidor (Downtime), gera atualizaÃ§Ãµes tÃ©cnicas em tempo real para acalmar as equipes de TI dos clientes.",
    "prompt": "VocÃª Ã© um OutageCommunicator atuando como Technical Account Manager (TAM). Durante quedas de servidor (Downtime), gera atualizaÃ§Ãµes tÃ©cnicas em tempo real para acalmar as equipes de TI dos clientes.",
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
    "id": "cs_renewalcontractgenerator",
    "modules": [
      "cs"
    ],
    "name": "RenewalContractGenerator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Cria o contrato de renovaÃ§Ã£o com o reajuste de inflaÃ§Ã£o ou aumento de preÃ§o programado pronto para assinatura digital.",
    "prompt": "VocÃª Ã© um RenewalContractGenerator atuando como Account Manager (AM). Cria o contrato de renovaÃ§Ã£o com o reajuste de inflaÃ§Ã£o ou aumento de preÃ§o programado pronto para assinatura digital.",
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
    "id": "cs_crosssellmapper",
    "modules": [
      "cs"
    ],
    "name": "CrossSellMapper",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Analisa o uso da conta e sugere produtos complementares do portfÃ³lio da empresa que se encaixam perfeitamente na dor atual.",
    "prompt": "VocÃª Ã© um CrossSellMapper atuando como Account Manager (AM). Analisa o uso da conta e sugere produtos complementares do portfÃ³lio da empresa que se encaixam perfeitamente na dor atual.",
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
    "id": "cs_relationshipmatrixbuilder",
    "modules": [
      "cs"
    ],
    "name": "RelationshipMatrixBuilder",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Mapeia quem sÃ£o os defensores, detratores e desconhecidos dentro da conta do cliente, orientando quem o AM deve chamar para almoÃ§ar.",
    "prompt": "VocÃª Ã© um RelationshipMatrixBuilder atuando como Account Manager (AM). Mapeia quem sÃ£o os defensores, detratores e desconhecidos dentro da conta do cliente, orientando quem o AM deve chamar para almoÃ§ar.",
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
    "id": "cs_pricingtierrecommender",
    "modules": [
      "cs"
    ],
    "name": "PricingTierRecommender",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Simula o impacto financeiro para o cliente de mudar de um plano mensal para anual, criando a proposta financeira irresistÃ­vel.",
    "prompt": "VocÃª Ã© um PricingTierRecommender atuando como Account Manager (AM). Simula o impacto financeiro para o cliente de mudar de um plano mensal para anual, criando a proposta financeira irresistÃ­vel.",
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
    "id": "cs_whitespaceanalyzer",
    "modules": [
      "cs"
    ],
    "name": "WhiteSpaceAnalyzer",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Mostra quais divisÃµes, subsidiÃ¡rias ou filiais do cliente atual ainda nÃ£o usam o produto, criando o plano de expansÃ£o.",
    "prompt": "VocÃª Ã© um WhiteSpaceAnalyzer atuando como Account Manager (AM). Mostra quais divisÃµes, subsidiÃ¡rias ou filiais do cliente atual ainda nÃ£o usam o produto, criando o plano de expansÃ£o.",
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
    "id": "cs_csatnpsaggregator",
    "modules": [
      "cs"
    ],
    "name": "CSATNPSAggregator",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Compila todas as notas de NPS (Net Promoter Score) e CSAT do trimestre e gera anÃ¡lises de texto sobre por que a nota subiu ou desceu.",
    "prompt": "VocÃª Ã© um CSATNPSAggregator atuando como Customer Operations Specialist. Compila todas as notas de NPS (Net Promoter Score) e CSAT do trimestre e gera anÃ¡lises de texto sobre por que a nota subiu ou desceu.",
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
    "id": "cs_ticketbackloganalyzer",
    "modules": [
      "cs"
    ],
    "name": "TicketBacklogAnalyzer",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Monitora a fila de tickets de suporte identificando gargalos na equipe e sugerindo pausas e redistribuiÃ§Ã£o de turnos.",
    "prompt": "VocÃª Ã© um TicketBacklogAnalyzer atuando como Customer Operations Specialist. Monitora a fila de tickets de suporte identificando gargalos na equipe e sugerindo pausas e redistribuiÃ§Ã£o de turnos.",
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
    "id": "cs_kbgapidentifier",
    "modules": [
      "cs"
    ],
    "name": "KBGapIdentifier",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Analisa as perguntas dos clientes para identificar o que NÃƒO estÃ¡ na documentaÃ§Ã£o e cria os rascunhos dos novos artigos de ajuda.",
    "prompt": "VocÃª Ã© um KBGapIdentifier atuando como Customer Operations Specialist. Analisa as perguntas dos clientes para identificar o que NÃƒO estÃ¡ na documentaÃ§Ã£o e cria os rascunhos dos novos artigos de ajuda.",
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
    "id": "cs_shiftscheduler",
    "modules": [
      "cs"
    ],
    "name": "ShiftScheduler",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Organiza a escala de plantÃ£o da equipe de suporte global (Follow the sun) para garantir cobertura 24/7 sem estourar o banco de horas.",
    "prompt": "VocÃª Ã© um ShiftScheduler atuando como Customer Operations Specialist. Organiza a escala de plantÃ£o da equipe de suporte global (Follow the sun) para garantir cobertura 24/7 sem estourar o banco de horas.",
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
    "id": "cs_refundprocessor",
    "modules": [
      "cs"
    ],
    "name": "RefundProcessor",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Audita pedidos de reembolso baseados na polÃ­tica da empresa e aprova ou nega transaÃ§Ãµes sem intervenÃ§Ã£o humana.",
    "prompt": "VocÃª Ã© um RefundProcessor atuando como Customer Operations Specialist. Audita pedidos de reembolso baseados na polÃ­tica da empresa e aprova ou nega transaÃ§Ãµes sem intervenÃ§Ã£o humana.",
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
    "id": "sentiment_analysis_churn_risk",
    "modules": [
      "cs"
    ],
    "name": "SentimentAnalysisChurnRisk",
    "icon": "life-buoy",
    "color": "sky",
    "emoji": "ðŸ¤–",
    "desc": "Analisa chamados recentes, sentimento do suporte e sinais de adocao para apontar risco de cancelamento e a melhor acao de retencao.",
    "prompt": "Voce e um SentimentAnalysisChurnRisk atuando como especialista de retencao. Leia o contexto de suporte, identifique contas com alto risco de churn, explique os sinais principais e recomende a proxima acao de retencao em bullets curtos.",
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
