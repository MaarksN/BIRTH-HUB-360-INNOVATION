import type { Tool } from "../types";

export const FINTECH_TOOLS: Tool[] = [
  {
    "id": "fintech_policymappingbot",
    "modules": [
      "fintech"
    ],
    "name": "PolicyMappingBot",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Varre os milhares de artigos das normas do Banco Central ou CVM e cruza com os processos da Fintech para ver se hÃ¡ furos na operaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um PolicyMappingBot atuando como Compliance Analyst. Varre os milhares de artigos das normas do Banco Central ou CVM e cruza com os processos da Fintech para ver se hÃ¡ furos na operaÃ§Ã£o.",
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
    "id": "fintech_regulatorytrainingtracker",
    "modules": [
      "fintech"
    ],
    "name": "RegulatoryTrainingTracker",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Cria, distribui e fiscaliza os treinamentos obrigatÃ³rios anuais sobre Ã‰tica e Lavagem de Dinheiro, garantindo 100% de adesÃ£o.",
    "prompt": "VocÃª Ã© um RegulatoryTrainingTracker atuando como Compliance Analyst. Cria, distribui e fiscaliza os treinamentos obrigatÃ³rios anuais sobre Ã‰tica e Lavagem de Dinheiro, garantindo 100% de adesÃ£o.",
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
    "id": "fintech_sanctionsscreener",
    "modules": [
      "fintech"
    ],
    "name": "SanctionsScreener",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Passa todos os milhares de clientes pela base de sanÃ§Ãµes internacionais (OFAC, ONU) em milissegundos a cada nova atualizaÃ§Ã£o de listas.",
    "prompt": "VocÃª Ã© um SanctionsScreener atuando como Compliance Analyst. Passa todos os milhares de clientes pela base de sanÃ§Ãµes internacionais (OFAC, ONU) em milissegundos a cada nova atualizaÃ§Ã£o de listas.",
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
    "id": "fintech_commssurveillancebot",
    "modules": [
      "fintech"
    ],
    "name": "CommsSurveillanceBot",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Escuta e lÃª todas as ligaÃ§Ãµes e chats dos assessores de investimento da Fintech garantindo que ninguÃ©m prometa \"retorno garantido\" ou faÃ§a insider trading.",
    "prompt": "VocÃª Ã© um CommsSurveillanceBot atuando como Compliance Analyst. Escuta e lÃª todas as ligaÃ§Ãµes e chats dos assessores de investimento da Fintech garantindo que ninguÃ©m prometa \"retorno garantido\" ou faÃ§a insider trading.",
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
    "id": "fintech_auditprepengine",
    "modules": [
      "fintech"
    ],
    "name": "AuditPrepEngine",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Gera painÃ©is dinÃ¢micos e exportaÃ§Ãµes perfeitas para a auditoria regulatÃ³ria e fiscalizaÃ§Ãµes surpresas do regulador financeiro.",
    "prompt": "VocÃª Ã© um AuditPrepEngine atuando como Compliance Analyst. Gera painÃ©is dinÃ¢micos e exportaÃ§Ãµes perfeitas para a auditoria regulatÃ³ria e fiscalizaÃ§Ãµes surpresas do regulador financeiro.",
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
    "id": "fintech_sardrafter",
    "modules": [
      "fintech"
    ],
    "name": "SARDrafter",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Puxa todo o histÃ³rico suspeito de um usuÃ¡rio, cruza contas, IPs e transaÃ§Ãµes e redige sozinho o rascunho do RelatÃ³rio de Atividade Suspeita (COAF).",
    "prompt": "VocÃª Ã© um SARDrafter atuando como AML Specialist (Anti-Money Laundering). Puxa todo o histÃ³rico suspeito de um usuÃ¡rio, cruza contas, IPs e transaÃ§Ãµes e redige sozinho o rascunho do RelatÃ³rio de Atividade Suspeita (COAF).",
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
    "id": "fintech_transactionlinkanalyzer",
    "modules": [
      "fintech"
    ],
    "name": "TransactionLinkAnalyzer",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Mapeia grÃ¡ficamente teias complexas em formato de aranha, evidenciando como o dinheiro foi transferido entre dezenas de laranjas e contas de passagem (Smurfing).",
    "prompt": "VocÃª Ã© um TransactionLinkAnalyzer atuando como AML Specialist (Anti-Money Laundering). Mapeia grÃ¡ficamente teias complexas em formato de aranha, evidenciando como o dinheiro foi transferido entre dezenas de laranjas e contas de passagem (Smurfing).",
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
    "id": "fintech_moneymuledetector",
    "modules": [
      "fintech"
    ],
    "name": "MoneyMuleDetector",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Identifica padrÃµes comportamentais como depÃ³sitos picados, picos repentinos em contas inativas ou retiradas em caixas eletrÃ´nicos atÃ­picos (Mulas de dinheiro).",
    "prompt": "VocÃª Ã© um MoneyMuleDetector atuando como AML Specialist (Anti-Money Laundering). Identifica padrÃµes comportamentais como depÃ³sitos picados, picos repentinos em contas inativas ou retiradas em caixas eletrÃ´nicos atÃ­picos (Mulas de dinheiro).",
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
    "id": "fintech_highriskjurisdictionpinger",
    "modules": [
      "fintech"
    ],
    "name": "HighRiskJurisdictionPinger",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Trava ou cria fricÃ§Ã£o de aprovaÃ§Ã£o extra em qualquer transferÃªncia cujo IP de origem ou banco de destino pertenÃ§a a paÃ­ses de alto risco.",
    "prompt": "VocÃª Ã© um HighRiskJurisdictionPinger atuando como AML Specialist (Anti-Money Laundering). Trava ou cria fricÃ§Ã£o de aprovaÃ§Ã£o extra em qualquer transferÃªncia cujo IP de origem ou banco de destino pertenÃ§a a paÃ­ses de alto risco.",
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
    "id": "fintech_cryptotracingbot",
    "modules": [
      "fintech"
    ],
    "name": "CryptoTracingBot",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Segue transaÃ§Ãµes de carteiras em Blockchain pÃºblica saltando por mixers para tentar associar saques a identidades conhecidas no mundo real.",
    "prompt": "VocÃª Ã© um CryptoTracingBot atuando como AML Specialist (Anti-Money Laundering). Segue transaÃ§Ãµes de carteiras em Blockchain pÃºblica saltando por mixers para tentar associar saques a identidades conhecidas no mundo real.",
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
    "id": "fintech_idverificationmatcher",
    "modules": [
      "fintech"
    ],
    "name": "IDVerificationMatcher",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Verifica o documento de identidade em milissegundos sob iluminaÃ§Ãµes diversas, detectando se a foto foi adulterada no Photoshop, trocada a foto, ou Ã© uma cÃ³pia de tela.",
    "prompt": "VocÃª Ã© um IDVerificationMatcher atuando como KYC Specialist (Know Your Customer). Verifica o documento de identidade em milissegundos sob iluminaÃ§Ãµes diversas, detectando se a foto foi adulterada no Photoshop, trocada a foto, ou Ã© uma cÃ³pia de tela.",
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
    "id": "fintech_livenesscheckanalyzer",
    "modules": [
      "fintech"
    ],
    "name": "LivenessCheckAnalyzer",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "LÃª pequenos movimentos faciais nos vÃ­deos de seguranÃ§a para validar se Ã© um ser humano respirando ou um Deepfake em vÃ­deo e mÃ¡scara de silicone.",
    "prompt": "VocÃª Ã© um LivenessCheckAnalyzer atuando como KYC Specialist (Know Your Customer). LÃª pequenos movimentos faciais nos vÃ­deos de seguranÃ§a para validar se Ã© um ser humano respirando ou um Deepfake em vÃ­deo e mÃ¡scara de silicone.",
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
    "id": "fintech_ubomapper",
    "modules": [
      "fintech"
    ],
    "name": "UBOMapper",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "ConstrÃ³i rapidamente a Ã¡rvore societÃ¡ria inteira de um CNPJ atÃ© chegar no \"BeneficiÃ¡rio Final\" pessoa fÃ­sica, vasculhando juntas comerciais automaticamente.",
    "prompt": "VocÃª Ã© um UBOMapper atuando como KYC Specialist (Know Your Customer). ConstrÃ³i rapidamente a Ã¡rvore societÃ¡ria inteira de um CNPJ atÃ© chegar no \"BeneficiÃ¡rio Final\" pessoa fÃ­sica, vasculhando juntas comerciais automaticamente.",
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
    "id": "fintech_addressproofvalidator",
    "modules": [
      "fintech"
    ],
    "name": "AddressProofValidator",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Audita o comprovante de endereÃ§o validando com os dados emitidos pelas concessionÃ¡rias de energia ou telefone para ver se nÃ£o foi editado no PDF.",
    "prompt": "VocÃª Ã© um AddressProofValidator atuando como KYC Specialist (Know Your Customer). Audita o comprovante de endereÃ§o validando com os dados emitidos pelas concessionÃ¡rias de energia ou telefone para ver se nÃ£o foi editado no PDF.",
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
    "id": "fintech_pepscreener",
    "modules": [
      "fintech"
    ],
    "name": "PEPScreener",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Avalia ligaÃ§Ãµes polÃ­ticas (Parentes e Pessoas Politicamente Expostas) e classifica o risco antes de abrir a conta.",
    "prompt": "VocÃª Ã© um PEPScreener atuando como KYC Specialist (Know Your Customer). Avalia ligaÃ§Ãµes polÃ­ticas (Parentes e Pessoas Politicamente Expostas) e classifica o risco antes de abrir a conta.",
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
    "id": "fintech_accounttakeoveralerter_ato",
    "modules": [
      "fintech"
    ],
    "name": "AccountTakeoverAlerter (ATO)",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Cruza velocidade de digitaÃ§Ã£o de senha, localizaÃ§Ãµes geogrÃ¡ficas impossÃ­veis (SÃ£o Paulo e JapÃ£o em 1h) e bloqueia a conta em tempo real.",
    "prompt": "VocÃª Ã© um AccountTakeoverAlerter (ATO) atuando como Fraud Analyst. Cruza velocidade de digitaÃ§Ã£o de senha, localizaÃ§Ãµes geogrÃ¡ficas impossÃ­veis (SÃ£o Paulo e JapÃ£o em 1h) e bloqueia a conta em tempo real.",
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
    "id": "fintech_chargebackdisputeautomator",
    "modules": [
      "fintech"
    ],
    "name": "ChargebackDisputeAutomator",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Em e-commerces/fintechs, quando hÃ¡ denÃºncia de fraude, coleta as evidÃªncias de rastreio de entrega e login, contestando o chargeback na bandeira do cartÃ£o.",
    "prompt": "VocÃª Ã© um ChargebackDisputeAutomator atuando como Fraud Analyst. Em e-commerces/fintechs, quando hÃ¡ denÃºncia de fraude, coleta as evidÃªncias de rastreio de entrega e login, contestando o chargeback na bandeira do cartÃ£o.",
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
    "id": "fintech_velocityruleengine",
    "modules": [
      "fintech"
    ],
    "name": "VelocityRuleEngine",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Cria regras matemÃ¡ticas dinÃ¢micas de velocidade transacional: se um cartÃ£o passar 5 vezes no mesmo minuto em valores baixos testando validade, trava as prÃ³ximas.",
    "prompt": "VocÃª Ã© um VelocityRuleEngine atuando como Fraud Analyst. Cria regras matemÃ¡ticas dinÃ¢micas de velocidade transacional: se um cartÃ£o passar 5 vezes no mesmo minuto em valores baixos testando validade, trava as prÃ³ximas.",
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
    "id": "fintech_syntheticidentitydetector",
    "modules": [
      "fintech"
    ],
    "name": "SyntheticIdentityDetector",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Cruza bases de nascimentos e de Ã³bitos para evitar que fraudadores criem crediÃ¡rios fantasma com dados sintÃ©ticos (\"CPF Frankestein\").",
    "prompt": "VocÃª Ã© um SyntheticIdentityDetector atuando como Fraud Analyst. Cruza bases de nascimentos e de Ã³bitos para evitar que fraudadores criem crediÃ¡rios fantasma com dados sintÃ©ticos (\"CPF Frankestein\").",
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
    "id": "fintech_devicefingerprintmatcher",
    "modules": [
      "fintech"
    ],
    "name": "DeviceFingerprintMatcher",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Identifica exatamente a \"impressÃ£o digital\" da placa mÃ£e e do celular. Se o mesmo celular abrir 20 contas em 1 hora para pegar bÃ´nus de indicaÃ§Ã£o, bane o aparelho.",
    "prompt": "VocÃª Ã© um DeviceFingerprintMatcher atuando como Fraud Analyst. Identifica exatamente a \"impressÃ£o digital\" da placa mÃ£e e do celular. Se o mesmo celular abrir 20 contas em 1 hora para pegar bÃ´nus de indicaÃ§Ã£o, bane o aparelho.",
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
    "id": "fintech_altdatascorer",
    "modules": [
      "fintech"
    ],
    "name": "AltDataScorer",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Para \"desbancarizados\", analisa o consumo de crÃ©dito de telefone prÃ©-pago, histÃ³rico de contas de luz e redes sociais para atribuir um score de crÃ©dito.",
    "prompt": "VocÃª Ã© um AltDataScorer atuando como Credit Risk Underwriter. Para \"desbancarizados\", analisa o consumo de crÃ©dito de telefone prÃ©-pago, histÃ³rico de contas de luz e redes sociais para atribuir um score de crÃ©dito.",
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
    "id": "fintech_cashflowpredictor_open_banking",
    "modules": [
      "fintech"
    ],
    "name": "CashFlowPredictor (Open Banking)",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "LÃª de imediato o histÃ³rico bancÃ¡rio (com autorizaÃ§Ã£o Open Finance), classifica despesas supÃ©rfluas e afere a real capacidade de pagamento das parcelas.",
    "prompt": "VocÃª Ã© um CashFlowPredictor (Open Banking) atuando como Credit Risk Underwriter. LÃª de imediato o histÃ³rico bancÃ¡rio (com autorizaÃ§Ã£o Open Finance), classifica despesas supÃ©rfluas e afere a real capacidade de pagamento das parcelas.",
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
    "id": "fintech_defaultprobabilitymodeler",
    "modules": [
      "fintech"
    ],
    "name": "DefaultProbabilityModeler",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Aplica modelos economÃ©tricos (como RegressÃ£o LogÃ­stica ou Ãrvores de DecisÃ£o) para definir com precisÃ£o de casas decimais a chance do cliente nÃ£o pagar.",
    "prompt": "VocÃª Ã© um DefaultProbabilityModeler atuando como Credit Risk Underwriter. Aplica modelos economÃ©tricos (como RegressÃ£o LogÃ­stica ou Ãrvores de DecisÃ£o) para definir com precisÃ£o de casas decimais a chance do cliente nÃ£o pagar.",
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
    "id": "fintech_autodecisionengine",
    "modules": [
      "fintech"
    ],
    "name": "AutoDecisionEngine",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Aprova em nanossegundos 80% das requisiÃ§Ãµes de cartÃ£o ou emprÃ©stimo dentro do perfil sem a interferÃªncia manual, reservando apenas anÃ¡lises cinzentas para os humanos.",
    "prompt": "VocÃª Ã© um AutoDecisionEngine atuando como Credit Risk Underwriter. Aprova em nanossegundos 80% das requisiÃ§Ãµes de cartÃ£o ou emprÃ©stimo dentro do perfil sem a interferÃªncia manual, reservando apenas anÃ¡lises cinzentas para os humanos.",
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
    "id": "fintech_limitdecreaserecommender",
    "modules": [
      "fintech"
    ],
    "name": "LimitDecreaseRecommender",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Reduz passivamente e silenciosamente o limite de cartÃµes de crÃ©dito ao notar piora em variÃ¡veis econÃ´micas fora da instituiÃ§Ã£o (ex: se cliente ficou desempregado em base pÃºblica).",
    "prompt": "VocÃª Ã© um LimitDecreaseRecommender atuando como Credit Risk Underwriter. Reduz passivamente e silenciosamente o limite de cartÃµes de crÃ©dito ao notar piora em variÃ¡veis econÃ´micas fora da instituiÃ§Ã£o (ex: se cliente ficou desempregado em base pÃºblica).",
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
    "id": "fintech_centralbankxmlgenerator",
    "modules": [
      "fintech"
    ],
    "name": "CentralBankXMLGenerator",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Formata milhÃµes de transaÃ§Ãµes diÃ¡rias em complexos arquivos XML, com assinaturas validadas, no padrÃ£o exato exigido pelo Banco Central.",
    "prompt": "VocÃª Ã© um CentralBankXMLGenerator atuando como Regulatory Reporting Specialist. Formata milhÃµes de transaÃ§Ãµes diÃ¡rias em complexos arquivos XML, com assinaturas validadas, no padrÃ£o exato exigido pelo Banco Central.",
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
    "id": "fintech_capitaladequacycalculator",
    "modules": [
      "fintech"
    ],
    "name": "CapitalAdequacyCalculator",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Processa cÃ¡lculos no fim do dia para validar o Ãndice de Basileia, checando se a instituiÃ§Ã£o bancÃ¡ria tem o PatrimÃ´nio LÃ­quido MÃ­nimo obrigatÃ³rio contra os emprÃ©stimos emitidos.",
    "prompt": "VocÃª Ã© um CapitalAdequacyCalculator atuando como Regulatory Reporting Specialist. Processa cÃ¡lculos no fim do dia para validar o Ãndice de Basileia, checando se a instituiÃ§Ã£o bancÃ¡ria tem o PatrimÃ´nio LÃ­quido MÃ­nimo obrigatÃ³rio contra os emprÃ©stimos emitidos.",
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
    "id": "fintech_liquidityratiomonitor",
    "modules": [
      "fintech"
    ],
    "name": "LiquidityRatioMonitor",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Vigia a liquidez dos fundos empoÃ§ados nos caixas do banco alertando tesoureiros para alocar capital imediatamente no open market ou recolher perante as regras de encaixe compulsÃ³rio.",
    "prompt": "VocÃª Ã© um LiquidityRatioMonitor atuando como Regulatory Reporting Specialist. Vigia a liquidez dos fundos empoÃ§ados nos caixas do banco alertando tesoureiros para alocar capital imediatamente no open market ou recolher perante as regras de encaixe compulsÃ³rio.",
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
    "id": "fintech_deadlinetracker",
    "modules": [
      "fintech"
    ],
    "name": "DeadlineTracker",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Mapa de gestÃ£o de projetos que gerencia entregÃ¡veis para CVM/Bacen/Anbima, e notifica gerentes para evitarem multas milionÃ¡rias por atraso de um dia na prestaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um DeadlineTracker atuando como Regulatory Reporting Specialist. Mapa de gestÃ£o de projetos que gerencia entregÃ¡veis para CVM/Bacen/Anbima, e notifica gerentes para evitarem multas milionÃ¡rias por atraso de um dia na prestaÃ§Ã£o.",
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
    "id": "fintech_stresstestmodeler",
    "modules": [
      "fintech"
    ],
    "name": "StressTestModeler",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Cria modelos severos estipulados pelo Ã³rgÃ£o regulador (como a queda de 50% nos preÃ§os de imÃ³veis ou desemprego de 20%) medindo o impacto no balanÃ§o do banco.",
    "prompt": "VocÃª Ã© um StressTestModeler atuando como Regulatory Reporting Specialist. Cria modelos severos estipulados pelo Ã³rgÃ£o regulador (como a queda de 50% nos preÃ§os de imÃ³veis ou desemprego de 20%) medindo o impacto no balanÃ§o do banco.",
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
    "id": "fintech_processwalkthroughautomator",
    "modules": [
      "fintech"
    ],
    "name": "ProcessWalkthroughAutomator",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Cria evidÃªncias automatizadas de passagem de controle (\"Walkthrough\") desde a criaÃ§Ã£o de um usuÃ¡rio num sistema atÃ© seu encerramento.",
    "prompt": "VocÃª Ã© um ProcessWalkthroughAutomator atuando como Internal Controls Analyst. Cria evidÃªncias automatizadas de passagem de controle (\"Walkthrough\") desde a criaÃ§Ã£o de um usuÃ¡rio num sistema atÃ© seu encerramento.",
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
    "id": "fintech_sodconflictdetector_segregation_of_duties",
    "modules": [
      "fintech"
    ],
    "name": "SoDConflictDetector (Segregation of Duties)",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Analisa Ã¡rvores de permissÃµes em toda a infraestrutura e barra que um mesmo operador de TI possa subir um cÃ³digo de pagamento e aprovar sozinho no painel financeiro.",
    "prompt": "VocÃª Ã© um SoDConflictDetector (Segregation of Duties) atuando como Internal Controls Analyst. Analisa Ã¡rvores de permissÃµes em toda a infraestrutura e barra que um mesmo operador de TI possa subir um cÃ³digo de pagamento e aprovar sozinho no painel financeiro.",
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
    "id": "fintech_accessrightauditor",
    "modules": [
      "fintech"
    ],
    "name": "AccessRightAuditor",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Audita credenciais revogadas semanalmente de pessoas demitidas e detecta contas nÃ£o canceladas (\"Ghost accounts\") alertando lideranÃ§as.",
    "prompt": "VocÃª Ã© um AccessRightAuditor atuando como Internal Controls Analyst. Audita credenciais revogadas semanalmente de pessoas demitidas e detecta contas nÃ£o canceladas (\"Ghost accounts\") alertando lideranÃ§as.",
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
    "id": "fintech_kridashboarder_key_risk_indicators",
    "modules": [
      "fintech"
    ],
    "name": "KRIDashboarder (Key Risk Indicators)",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Consagra painÃ©is para o comitÃª de auditoria indicando a variaÃ§Ã£o dos KRIs mais graves da Fintech atualizando dinamicamente no mÃªs.",
    "prompt": "VocÃª Ã© um KRIDashboarder (Key Risk Indicators) atuando como Internal Controls Analyst. Consagra painÃ©is para o comitÃª de auditoria indicando a variaÃ§Ã£o dos KRIs mais graves da Fintech atualizando dinamicamente no mÃªs.",
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
    "id": "fintech_remediationplantracker",
    "modules": [
      "fintech"
    ],
    "name": "RemediationPlanTracker",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Acompanha ativamente o status de recomendaÃ§Ãµes de Auditoria Interna, forÃ§ando diretores com chamados sistÃªmicos a consertarem as brechas no prazo.",
    "prompt": "VocÃª Ã© um RemediationPlanTracker atuando como Internal Controls Analyst. Acompanha ativamente o status de recomendaÃ§Ãµes de Auditoria Interna, forÃ§ando diretores com chamados sistÃªmicos a consertarem as brechas no prazo.",
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
    "id": "fintech_transactionholdreviewer",
    "modules": [
      "fintech"
    ],
    "name": "TransactionHoldReviewer",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Um assistente lateral para avaliar os Pix/TransferÃªncias bloqueadas nas regras de antifraude em lote e facilitar ao analista validar liberaÃ§Ã£o rapidamente.",
    "prompt": "VocÃª Ã© um TransactionHoldReviewer atuando como Risk Operations Analyst. Um assistente lateral para avaliar os Pix/TransferÃªncias bloqueadas nas regras de antifraude em lote e facilitar ao analista validar liberaÃ§Ã£o rapidamente.",
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
    "id": "fintech_slaescalator",
    "modules": [
      "fintech"
    ],
    "name": "SLAEscalator",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Percebe as travas de limite de fundos na fila com tempo exÃ­guo expirando na tesouraria e as transfere para gestores seniores nÃ£o estourarem a SLA do pagador.",
    "prompt": "VocÃª Ã© um SLAEscalator atuando como Risk Operations Analyst. Percebe as travas de limite de fundos na fila com tempo exÃ­guo expirando na tesouraria e as transfere para gestores seniores nÃ£o estourarem a SLA do pagador.",
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
    "id": "fintech_falsepositivereducer",
    "modules": [
      "fintech"
    ],
    "name": "FalsePositiveReducer",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Motor de aprendizado contÃ­nuo (\"Tuning\") que revisa regras do motor de fraude e afrouxa os gargalos que vÃªm bloqueando bons clientes desnecessariamente (Redutor de Atrito).",
    "prompt": "VocÃª Ã© um FalsePositiveReducer atuando como Risk Operations Analyst. Motor de aprendizado contÃ­nuo (\"Tuning\") que revisa regras do motor de fraude e afrouxa os gargalos que vÃªm bloqueando bons clientes desnecessariamente (Redutor de Atrito).",
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
    "id": "fintech_capacitymodeler",
    "modules": [
      "fintech"
    ],
    "name": "CapacityModeler",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "Mede e prevÃª a quantidade de chamados de denÃºncias ou chargeback previstos no prÃ³ximo final de semana festivo, avisando da necessidade de hora-extra na equipe.",
    "prompt": "VocÃª Ã© um CapacityModeler atuando como Risk Operations Analyst. Mede e prevÃª a quantidade de chamados de denÃºncias ou chargeback previstos no prÃ³ximo final de semana festivo, avisando da necessidade de hora-extra na equipe.",
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
    "id": "fintech_incidentpostmortemdrafter",
    "modules": [
      "fintech"
    ],
    "name": "IncidentPostMortemDrafter",
    "icon": "shield-alert",
    "color": "red",
    "emoji": "ðŸ¤–",
    "desc": "LÃª todos os logs de falhas ou fraudes vazadas de um incidente grave finalizado e jÃ¡ rascunha para gerÃªncia o relatÃ³rio de incidentes para evitar o fato na prÃ³xima janela de ataque.",
    "prompt": "VocÃª Ã© um IncidentPostMortemDrafter atuando como Risk Operations Analyst. LÃª todos os logs de falhas ou fraudes vazadas de um incidente grave finalizado e jÃ¡ rascunha para gerÃªncia o relatÃ³rio de incidentes para evitar o fato na prÃ³xima janela de ataque.",
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
