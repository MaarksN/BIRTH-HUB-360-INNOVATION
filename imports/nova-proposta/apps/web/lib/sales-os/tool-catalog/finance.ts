import type { Tool } from "../types";

export const FINANCE_TOOLS: Tool[] = [
  {
    "id": "finance_contractredliner",
    "modules": [
      "finance"
    ],
    "name": "ContractRedliner",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "LÃª minutas recebidas de clientes e realÃ§a (com comentÃ¡rios automÃ¡ticos) todas as clÃ¡usulas que ferem a polÃ­tica de riscos da empresa.",
    "prompt": "VocÃª Ã© um ContractRedliner atuando como General Counsel / Legal Manager. LÃª minutas recebidas de clientes e realÃ§a (com comentÃ¡rios automÃ¡ticos) todas as clÃ¡usulas que ferem a polÃ­tica de riscos da empresa.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_ipinfringementscraper",
    "modules": [
      "finance"
    ],
    "name": "IPInfringementScraper",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Monitora a web buscando cÃ³pias do software, roubo de logotipos e uso indevido da marca, emitindo notificaÃ§Ãµes extrajudiciais automÃ¡ticas.",
    "prompt": "VocÃª Ã© um IPInfringementScraper atuando como General Counsel / Legal Manager. Monitora a web buscando cÃ³pias do software, roubo de logotipos e uso indevido da marca, emitindo notificaÃ§Ãµes extrajudiciais automÃ¡ticas.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_regulatorychangealerter",
    "modules": [
      "finance"
    ],
    "name": "RegulatoryChangeAlerter",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Acompanha DiÃ¡rios Oficiais e jornais ao redor do mundo avisando se uma nova lei local afetarÃ¡ o modelo de negÃ³cios da empresa.",
    "prompt": "VocÃª Ã© um RegulatoryChangeAlerter atuando como General Counsel / Legal Manager. Acompanha DiÃ¡rios Oficiais e jornais ao redor do mundo avisando se uma nova lei local afetarÃ¡ o modelo de negÃ³cios da empresa.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_ndaautosigner",
    "modules": [
      "finance"
    ],
    "name": "NDAAutoSigner",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Gerencia a criaÃ§Ã£o, envio e arquivamento em massa de Acordos de Confidencialidade padronizados para parceiros e fornecedores.",
    "prompt": "VocÃª Ã© um NDAAutoSigner atuando como General Counsel / Legal Manager. Gerencia a criaÃ§Ã£o, envio e arquivamento em massa de Acordos de Confidencialidade padronizados para parceiros e fornecedores.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_riskexposurequantifier",
    "modules": [
      "finance"
    ],
    "name": "RiskExposureQuantifier",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Transforma linguagem jurÃ­dica em \"Custo de Risco\" (Ex: \"Essa clÃ¡usula de multa tem 5% de chance de ocorrer e custarÃ¡ 2 milhÃµes\").",
    "prompt": "VocÃª Ã© um RiskExposureQuantifier atuando como General Counsel / Legal Manager. Transforma linguagem jurÃ­dica em \"Custo de Risco\" (Ex: \"Essa clÃ¡usula de multa tem 5% de chance de ocorrer e custarÃ¡ 2 milhÃµes\").",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_invoicegenerator",
    "modules": [
      "finance"
    ],
    "name": "InvoiceGenerator",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Emite notas fiscais, faturas e boletos em massa com cÃ¡lculos perfeitos de alÃ­quotas de impostos baseadas no CEP do cliente.",
    "prompt": "VocÃª Ã© um InvoiceGenerator atuando como Billing Specialist / Billing Support Specialist. Emite notas fiscais, faturas e boletos em massa com cÃ¡lculos perfeitos de alÃ­quotas de impostos baseadas no CEP do cliente.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_prorationcalculator",
    "modules": [
      "finance"
    ],
    "name": "ProrationCalculator",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Calcula matematicamente devoluÃ§Ãµes e cobranÃ§as proporcionais caso o cliente cancele o plano no meio do mÃªs ou adicione usuÃ¡rios extras.",
    "prompt": "VocÃª Ã© um ProrationCalculator atuando como Billing Specialist / Billing Support Specialist. Calcula matematicamente devoluÃ§Ãµes e cobranÃ§as proporcionais caso o cliente cancele o plano no meio do mÃªs ou adicione usuÃ¡rios extras.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_failedpaymentretrier",
    "modules": [
      "finance"
    ],
    "name": "FailedPaymentRetrier",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Aciona algoritmos inteligentes para refazer cobranÃ§as de cartÃ£o de crÃ©dito falhas nos melhores dias/horÃ¡rios para aprovaÃ§Ã£o do banco.",
    "prompt": "VocÃª Ã© um FailedPaymentRetrier atuando como Billing Specialist / Billing Support Specialist. Aciona algoritmos inteligentes para refazer cobranÃ§as de cartÃ£o de crÃ©dito falhas nos melhores dias/horÃ¡rios para aprovaÃ§Ã£o do banco.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_taxexemptionverifier",
    "modules": [
      "finance"
    ],
    "name": "TaxExemptionVerifier",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Valida documentos de clientes isentos de impostos (como ONGs) mantendo a conformidade para nÃ£o gerar passivo fiscal.",
    "prompt": "VocÃª Ã© um TaxExemptionVerifier atuando como Billing Specialist / Billing Support Specialist. Valida documentos de clientes isentos de impostos (como ONGs) mantendo a conformidade para nÃ£o gerar passivo fiscal.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_disputedchargeaggregator",
    "modules": [
      "finance"
    ],
    "name": "DisputedChargeAggregator",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Junta todas as provas do sistema (logs de acesso, contratos) automaticamente quando um cliente faz chargeback (contesta no cartÃ£o).",
    "prompt": "VocÃª Ã© um DisputedChargeAggregator atuando como Billing Specialist / Billing Support Specialist. Junta todas as provas do sistema (logs de acesso, contratos) automaticamente quando um cliente faz chargeback (contesta no cartÃ£o).",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_dunningautomator",
    "modules": [
      "finance"
    ],
    "name": "DunningAutomator",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Cria rÃ©guas de cobranÃ§a dinÃ¢micas (SMS, WhatsApp, E-mail) adaptando o tom de voz do mais educado ao mais firme, dependendo do atraso.",
    "prompt": "VocÃª Ã© um DunningAutomator atuando como Collections Analyst / Specialist. Cria rÃ©guas de cobranÃ§a dinÃ¢micas (SMS, WhatsApp, E-mail) adaptando o tom de voz do mais educado ao mais firme, dependendo do atraso.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_paymentplannegotiator",
    "modules": [
      "finance"
    ],
    "name": "PaymentPlanNegotiator",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Um chatbot focado que negocia propostas de parcelamento com devedores dentro de margens prÃ©-aprovadas pelo departamento de finanÃ§as.",
    "prompt": "VocÃª Ã© um PaymentPlanNegotiator atuando como Collections Analyst / Specialist. Um chatbot focado que negocia propostas de parcelamento com devedores dentro de margens prÃ©-aprovadas pelo departamento de finanÃ§as.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_promisetopaytracker",
    "modules": [
      "finance"
    ],
    "name": "PromiseToPayTracker",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Monitora quem fez \"acordos de pagamento\" por telefone e emite alertas caso o boleto da renegociaÃ§Ã£o nÃ£o seja pago.",
    "prompt": "VocÃª Ã© um PromiseToPayTracker atuando como Collections Analyst / Specialist. Monitora quem fez \"acordos de pagamento\" por telefone e emite alertas caso o boleto da renegociaÃ§Ã£o nÃ£o seja pago.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_baddebtpredictor",
    "modules": [
      "finance"
    ],
    "name": "BadDebtPredictor",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Usa Machine Learning para avisar preventivamente que clientes com um perfil X tÃªm 90% de chance de virar inadimplÃªncia (ProvisÃ£o PDD).",
    "prompt": "VocÃª Ã© um BadDebtPredictor atuando como Collections Analyst / Specialist. Usa Machine Learning para avisar preventivamente que clientes com um perfil X tÃªm 90% de chance de virar inadimplÃªncia (ProvisÃ£o PDD).",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_collectionagencyrouter",
    "modules": [
      "finance"
    ],
    "name": "CollectionAgencyRouter",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Empacota os piores devedores (apÃ³s 90 dias) e transfere o dossiÃª completo automaticamente para empresas de cobranÃ§a terceirizadas e advogados.",
    "prompt": "VocÃª Ã© um CollectionAgencyRouter atuando como Collections Analyst / Specialist. Empacota os piores devedores (apÃ³s 90 dias) e transfere o dossiÃª completo automaticamente para empresas de cobranÃ§a terceirizadas e advogados.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_cloudspendoptimizer",
    "modules": [
      "finance"
    ],
    "name": "CloudSpendOptimizer",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Monitora AWS/Google Cloud minuto a minuto, desligando instÃ¢ncias de servidores nÃ£o utilizadas durante a madrugada para economizar dinheiro.",
    "prompt": "VocÃª Ã© um CloudSpendOptimizer atuando como FinOps Specialist. Monitora AWS/Google Cloud minuto a minuto, desligando instÃ¢ncias de servidores nÃ£o utilizadas durante a madrugada para economizar dinheiro.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_saaslicenseauditor",
    "modules": [
      "finance"
    ],
    "name": "SaaSLicenseAuditor",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Vasculha e-mails e despesas em cartÃ£o de crÃ©dito para encontrar softwares que os funcionÃ¡rios assinam e esquecem (Shadow IT).",
    "prompt": "VocÃª Ã© um SaaSLicenseAuditor atuando como FinOps Specialist. Vasculha e-mails e despesas em cartÃ£o de crÃ©dito para encontrar softwares que os funcionÃ¡rios assinam e esquecem (Shadow IT).",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_instancerightsizer",
    "modules": [
      "finance"
    ],
    "name": "InstanceRightSizer",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Avalia que um servidor muito potente estÃ¡ subutilizado e sugere ou executa o downgrade para um plano mais barato sem afetar a performance.",
    "prompt": "VocÃª Ã© um InstanceRightSizer atuando como FinOps Specialist. Avalia que um servidor muito potente estÃ¡ subutilizado e sugere ou executa o downgrade para um plano mais barato sem afetar a performance.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_budgetvariancepinger",
    "modules": [
      "finance"
    ],
    "name": "BudgetVariancePinger",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Alerta os chefes de departamento quando eles estÃ£o prestes a ultrapassar a cota de gastos mensais prevista do orÃ§amento deles.",
    "prompt": "VocÃª Ã© um BudgetVariancePinger atuando como FinOps Specialist. Alerta os chefes de departamento quando eles estÃ£o prestes a ultrapassar a cota de gastos mensais prevista do orÃ§amento deles.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_multicloudcostmodeler",
    "modules": [
      "finance"
    ],
    "name": "MultiCloudCostModeler",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Simula o impacto financeiro de migrar toda a infraestrutura da Amazon (AWS) para a Microsoft (Azure).",
    "prompt": "VocÃª Ã© um MultiCloudCostModeler atuando como FinOps Specialist. Simula o impacto financeiro de migrar toda a infraestrutura da Amazon (AWS) para a Microsoft (Azure).",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_cashappmatcher",
    "modules": [
      "finance"
    ],
    "name": "CashAppMatcher",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Concilia os extratos bancÃ¡rios com as faturas emitidas. Quando cai um PIX/TransferÃªncia, encontra magicamente a quem pertence e dÃ¡ baixa no CRM.",
    "prompt": "VocÃª Ã© um CashAppMatcher atuando como Accounts Receivable Specialist. Concilia os extratos bancÃ¡rios com as faturas emitidas. Quando cai um PIX/TransferÃªncia, encontra magicamente a quem pertence e dÃ¡ baixa no CRM.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_bankreconciliationbot",
    "modules": [
      "finance"
    ],
    "name": "BankReconciliationBot",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Varre milhÃµes de linhas dos bancos para bater com o ERP (SAP/Oracle) identificando diferenÃ§as de centavos ou taxas nÃ£o declaradas.",
    "prompt": "VocÃª Ã© um BankReconciliationBot atuando como Accounts Receivable Specialist. Varre milhÃµes de linhas dos bancos para bater com o ERP (SAP/Oracle) identificando diferenÃ§as de centavos ou taxas nÃ£o declaradas.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_agingreportsender",
    "modules": [
      "finance"
    ],
    "name": "AgingReportSender",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Gera e distribui relatÃ³rios detalhados diÃ¡rios sobre \"Idade dos RecebÃ­veis\" (30, 60, 90+ dias de atraso) para o time financeiro e de vendas.",
    "prompt": "VocÃª Ã© um AgingReportSender atuando como Accounts Receivable Specialist. Gera e distribui relatÃ³rios detalhados diÃ¡rios sobre \"Idade dos RecebÃ­veis\" (30, 60, 90+ dias de atraso) para o time financeiro e de vendas.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_creditholdreleaser",
    "modules": [
      "finance"
    ],
    "name": "CreditHoldReleaser",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Monitora o banco e, assim que o dinheiro do devedor compensa, desbloqueia o software ou envia a mercadoria em segundos.",
    "prompt": "VocÃª Ã© um CreditHoldReleaser atuando como Accounts Receivable Specialist. Monitora o banco e, assim que o dinheiro do devedor compensa, desbloqueia o software ou envia a mercadoria em segundos.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_remittanceextractor",
    "modules": [
      "finance"
    ],
    "name": "RemittanceExtractor",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Extrai comprovantes em PDF que os clientes enviam por e-mail e alimenta as informaÃ§Ãµes no sistema contÃ¡bil, livrando o operador de digitaÃ§Ã£o.",
    "prompt": "VocÃª Ã© um RemittanceExtractor atuando como Accounts Receivable Specialist. Extrai comprovantes em PDF que os clientes enviam por e-mail e alimenta as informaÃ§Ãµes no sistema contÃ¡bil, livrando o operador de digitaÃ§Ã£o.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_creditscorefetcher",
    "modules": [
      "finance"
    ],
    "name": "CreditScoreFetcher",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Consome dados de bureaux (Serasa, Experian, Dun & Bradstreet) para puxar o perfil de risco do cliente em tempo real no momento da venda.",
    "prompt": "VocÃª Ã© um CreditScoreFetcher atuando como Credit Manager. Consome dados de bureaux (Serasa, Experian, Dun & Bradstreet) para puxar o perfil de risco do cliente em tempo real no momento da venda.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_financialratiocalculator",
    "modules": [
      "finance"
    ],
    "name": "FinancialRatioCalculator",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Recebe o balanÃ§o do cliente e calcula todos os Ã­ndices de liquidez, endividamento e rentabilidade em segundos para avaliar crÃ©dito.",
    "prompt": "VocÃª Ã© um FinancialRatioCalculator atuando como Credit Manager. Recebe o balanÃ§o do cliente e calcula todos os Ã­ndices de liquidez, endividamento e rentabilidade em segundos para avaliar crÃ©dito.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_creditlimitrecommender",
    "modules": [
      "finance"
    ],
    "name": "CreditLimitRecommender",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Define matematicamente se a empresa pode vender R$ 10.000 ou R$ 1.000.000 a prazo para um novo cliente sem risco.",
    "prompt": "VocÃª Ã© um CreditLimitRecommender atuando como Credit Manager. Define matematicamente se a empresa pode vender R$ 10.000 ou R$ 1.000.000 a prazo para um novo cliente sem risco.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_bankruptcyriskmonitor",
    "modules": [
      "finance"
    ],
    "name": "BankruptcyRiskMonitor",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Monitora processos judiciais e protestos em cartÃ³rios para alertar se um cliente ativo estÃ¡ prestes a pedir falÃªncia (RecuperaÃ§Ã£o Judicial).",
    "prompt": "VocÃª Ã© um BankruptcyRiskMonitor atuando como Credit Manager. Monitora processos judiciais e protestos em cartÃ³rios para alertar se um cliente ativo estÃ¡ prestes a pedir falÃªncia (RecuperaÃ§Ã£o Judicial).",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_tradereferencechecker",
    "modules": [
      "finance"
    ],
    "name": "TradeReferenceChecker",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Automatiza o envio e o recebimento de e-mails para outras empresas perguntando \"O cliente X Ã© bom pagador com vocÃªs?\".",
    "prompt": "VocÃª Ã© um TradeReferenceChecker atuando como Credit Manager. Automatiza o envio e o recebimento de e-mails para outras empresas perguntando \"O cliente X Ã© bom pagador com vocÃªs?\".",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_monthendcloseautomator",
    "modules": [
      "finance"
    ],
    "name": "MonthEndCloseAutomator",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Automatiza as dezenas de conciliaÃ§Ãµes do \"Fechamento do MÃªs\", reduzindo o tempo de trabalho de 10 dias para 1 dia.",
    "prompt": "VocÃª Ã© um MonthEndCloseAutomator atuando como Controller. Automatiza as dezenas de conciliaÃ§Ãµes do \"Fechamento do MÃªs\", reduzindo o tempo de trabalho de 10 dias para 1 dia.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_accrualengine",
    "modules": [
      "finance"
    ],
    "name": "AccrualEngine",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Calcula provisÃµes de faturamento e despesas automaticamente com base nos contratos ativos garantindo o Regime de CompetÃªncia correto.",
    "prompt": "VocÃª Ã© um AccrualEngine atuando como Controller. Calcula provisÃµes de faturamento e despesas automaticamente com base nos contratos ativos garantindo o Regime de CompetÃªncia correto.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_audittrailbuilder",
    "modules": [
      "finance"
    ],
    "name": "AuditTrailBuilder",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Registra e fotografa todo o fluxo de aprovaÃ§Ãµes do sistema financeiro, deixando pacotes hermÃ©ticos prontos para auditores externos da Big 4.",
    "prompt": "VocÃª Ã© um AuditTrailBuilder atuando como Controller. Registra e fotografa todo o fluxo de aprovaÃ§Ãµes do sistema financeiro, deixando pacotes hermÃ©ticos prontos para auditores externos da Big 4.",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_glanomalydetector",
    "modules": [
      "finance"
    ],
    "name": "GLAnomalyDetector",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Vasculha o Livro RazÃ£o (General Ledger) e aponta se alguÃ©m lanÃ§ou uma despesa de marketing na conta contÃ¡bil de TI (erro de classificaÃ§Ã£o).",
    "prompt": "VocÃª Ã© um GLAnomalyDetector atuando como Controller. Vasculha o Livro RazÃ£o (General Ledger) e aponta se alguÃ©m lanÃ§ou uma despesa de marketing na conta contÃ¡bil de TI (erro de classificaÃ§Ã£o).",
    "fields": [
      {
        "id": "context",
        "label": "Contexto / Dados",
        "type": "textarea",
        "placeholder": "Insira os dados ou contexto para anÃ¡lise..."
      }
    ]
  },
  {
    "id": "finance_compliancechecklistenforcer",
    "modules": [
      "finance"
    ],
    "name": "ComplianceChecklistEnforcer",
    "icon": "dollar-sign",
    "color": "green",
    "emoji": "ðŸ¤–",
    "desc": "Trava o lanÃ§amento dos resultados financeiros oficiais se o checklist obrigatÃ³rio das normas Sarbanes-Oxley (SOX) ou equivalentes nÃ£o estiver 100% ticado.",
    "prompt": "VocÃª Ã© um ComplianceChecklistEnforcer atuando como Controller. Trava o lanÃ§amento dos resultados financeiros oficiais se o checklist obrigatÃ³rio das normas Sarbanes-Oxley (SOX) ou equivalentes nÃ£o estiver 100% ticado.",
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
