// @ts-nocheck
// 
export const dimensionConfig = [
  { key: "architecture", label: "Dimensão 1 — Saúde Arquitetural", target: 14 },
  { key: "code_quality", label: "Dimensão 2 — Qualidade de Código", target: 14 },
  { key: "security", label: "Dimensão 3 — Segurança", target: 13 },
  { key: "tests_observability", label: "Dimensão 4 — Cobertura de Testes e Observabilidade", target: 12 },
  { key: "performance", label: "Dimensão 5 — Performance e Escalabilidade", target: 12 },
  { key: "devops", label: "Dimensão 6 — Infraestrutura e DevOps", target: 12 },
  { key: "product_ux", label: "Dimensão 7 — Dívida de Produto e UX Técnica", target: 11 },
  { key: "operations_multitenancy", label: "Dimensão 8 — Maturidade Operacional e Multi-tenancy", target: 12 }
];

export const insufficiencyTemplates = {
  architecture: [
    {
      title: "[DADOS INSUFICIENTES — REQUER: docs/architecture/c4-context.md] Diagrama C4 versionado do core",
      problem: "O repositório lista a taxonomia canônica do core, mas não traz um diagrama C4 versionado do contexto atual para validar fronteiras, responsabilidades e integrações síncronas/assíncronas.",
      impact: "Sem essa evidência, revisões arquiteturais ficam dependentes de leitura de código e aumentam o custo de onboarding e de refactors transversais.",
      recommendation: "Versionar um diagrama C4 Context + Container do core canônico e referenciá-lo a partir do service catalog.",
      evidencePath: "docs/service-catalog.md"
    },
    {
      title: "[DADOS INSUFICIENTES — REQUER: docs/architecture/dependency-boundaries.md] Matriz explícita de dependências permitidas",
      problem: "Não há uma matriz versionada que formalize as dependências permitidas entre apps, packages e superfícies legadas/quarentenadas.",
      impact: "Sem regra publicada, acoplamentos regressivos podem voltar ao core sem gatilho documental claro.",
      recommendation: "Publicar uma matriz de dependências permitidas e bloqueadas entre o core, satélites e legado.",
      evidencePath: "docs/service-catalog.md"
    }
  ],
  code_quality: [
    {
      title: "[DADOS INSUFICIENTES — REQUER: eslint --format json] Linha de base objetiva de warnings por pacote",
      problem: "Há configuração de lint no workspace, mas a auditoria não tem um dump fresco de warnings/erros por pacote para medir deriva de qualidade com precisão de linha.",
      impact: "Sem baseline reproduzível, a prioridade entre hotspots de lint e type-safety fica parcialmente heurística.",
      recommendation: "Versionar ou anexar um dump recente do ESLint por pacote ao pipeline de auditoria soberana.",
      evidencePath: "eslint.config.mjs"
    },
    {
      title: "[DADOS INSUFICIENTES — REQUER: jscpd-report.json atualizado] Duplicação estrutural quantificada",
      problem: "O repositório já carrega um histórico de jscpd, mas a auditoria soberana precisa de uma execução fresca para quantificar duplicação real do HEAD atual.",
      impact: "Hotspots de cópia/cola podem estar sub ou superestimados quando dependem de artefato histórico.",
      recommendation: "Executar jscpd na etapa collect e armazenar o resultado em suporte do auditor-prime.",
      evidencePath: "package.json"
    }
  ],
  security: [
    {
      title: "[DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual",
      problem: "Existe trilha histórica de segurança, mas sem uma execução SAST fresca do HEAD atual a classificação OWASP/STRIDE fica parcialmente dependente de contexto anterior.",
      impact: "Falhas novas podem escapar da priorização se não houver uma fotografia recente do código.",
      recommendation: "Executar Semgrep como insumo do coletor soberano e registrar findings com path e line.",
      evidencePath: ".github/workflows/security-scan.yml"
    },
    {
      title: "[DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação",
      problem: "A superfície de segurança documenta guardrails estáticos, mas não há evidência dinâmica recente anexada ao pipeline soberano para validar ataques em runtime.",
      impact: "Controles podem existir no código e ainda assim falhar por composição, headers ou edge behavior.",
      recommendation: "Anexar relatório DAST mínimo por release candidate ao pacote de evidências da auditoria.",
      evidencePath: ".github/workflows/security-scan.yml"
    }
  ],
  tests_observability: [
    {
      title: "[DADOS INSUFICIENTES — REQUER: cobertura por módulo] Cobertura quantitativa por camada",
      problem: "Há muitas suites de teste no monorepo, mas a auditoria não encontra uma matriz de cobertura unit/integration/e2e por módulo do core no formato atual.",
      impact: "Sem a decomposição por módulo, o risco de falso conforto sobre cobertura global aumenta.",
      recommendation: "Gerar um relatório de cobertura por módulo e anexar ao pipeline soberano.",
      evidencePath: "scripts/testing/generate-traceability-report.mjs"
    },
    {
      title: "[DADOS INSUFICIENTES — REQUER: SLO dashboards vivos] SLO/SLA com erro budget operacional",
      problem: "Há artefatos e regras de monitoramento versionados, mas não há evidência viva de dashboards/SLOs com budget consumido por janela.",
      impact: "A operação fica com sinais técnicos, mas sem indicador explícito de confiabilidade do serviço para decisão executiva.",
      recommendation: "Versionar a definição de SLO por fluxo crítico e anexar screenshot/export JSON dos dashboards vivos.",
      evidencePath: "infra/monitoring/alert.rules.yml"
    }
  ],
  performance: [
    {
      title: "[DADOS INSUFICIENTES — REQUER: bundle baseline fresco] Tamanho real do bundle web no HEAD",
      problem: "O monorepo inclui script de baseline de bundle, mas sem uma execução fresca o risco de regressão de peso no frontend continua inconclusivo.",
      impact: "Sem esse número, LCP e TTI podem piorar sem gatilho visível no release lane.",
      recommendation: "Executar a baseline de bundle durante a coleta do auditor-prime e anexar o resultado ao suporte da auditoria.",
      evidencePath: "scripts/quality/generate-web-bundle-baseline.mjs"
    },
    {
      title: "[DADOS INSUFICIENTES — REQUER: load test recente] Prova de throughput sob stress no core",
      problem: "Há scripts de stress e overload, mas a auditoria soberana não possui uma execução recente associada ao HEAD auditado.",
      impact: "Capacidade e backpressure podem ser superestimados perto do lançamento.",
      recommendation: "Executar pelo menos um teste de carga rápido para API e worker no collect de release candidate.",
      evidencePath: "package.json"
    }
  ],
  devops: [
    {
      title: "[DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod",
      problem: "A documentação de release descreve preflights e segredos selados, mas não há um inventário consolidado das diferenças aceitáveis entre ambientes.",
      impact: "Diferenças silenciosas entre staging e produção seguem difíceis de auditar antes do go-live.",
      recommendation: "Versionar uma matriz de paridade de ambientes com owners e campos obrigatórios.",
      evidencePath: "docs/release/release-process.md"
    },
    {
      title: "[DADOS INSUFICIENTES — REQUER: lead time por PR] Métrica DORA completa de mudança",
      problem: "O histórico Git local permite proxy de frequência, mas não mede com precisão o lead time PR->produção sem dados externos ou metadados adicionais.",
      impact: "A priorização de gargalos de entrega pode superestimar ou subestimar o custo real do fluxo de mudança.",
      recommendation: "Conectar a auditoria soberana a metadados de PR/deploy ou exportar esses dados para suporte local.",
      evidencePath: ".github/workflows/cd.yml"
    }
  ],
  product_ux: [
    {
      title: "[DADOS INSUFICIENTES — REQUER: auditoria a11y automatizada] Conformidade WCAG do frontend",
      problem: "Sem uma execução automatizada de acessibilidade ou teste manual documentado, a avaliação WCAG permanece parcial.",
      impact: "Problemas de semântica, contraste e navegação por teclado podem sobreviver ao release.",
      recommendation: "Adicionar axe/playwright accessibility checks no lane do web.",
      evidencePath: "apps/web/package.json"
    },
    {
      title: "[DADOS INSUFICIENTES — REQUER: baseline de cross-browser] Compatibilidade real entre navegadores",
      problem: "Não há evidência recente de baseline cross-browser anexada à auditoria do frontend.",
      impact: "Falhas específicas de Safari/Firefox podem aparecer apenas em produção.",
      recommendation: "Adicionar smoke cross-browser mínimo ao pacote de evidência soberana.",
      evidencePath: "playwright.config.ts"
    }
  ],
  operations_multitenancy: [
    {
      title: "[DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant",
      problem: "O repositório não expõe um documento SLA explícito por tenant/serviço no conjunto de docs atual.",
      impact: "Sem SLA público-interno versionado, incidentes e prioridades de restauração perdem referência contratual e operacional.",
      recommendation: "Versionar um SLA operacional mínimo e referenciá-lo no hub operacional e no release process.",
      evidencePath: "docs/operational/README.md"
    },
    {
      title: "[DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery",
      problem: "Há documentação e scripts ligados a backup/recovery, mas a auditoria soberana não encontra evidência fresca de drill executado para o ciclo atual.",
      impact: "A recuperabilidade real do sistema continua mais assumida do que comprovada.",
      recommendation: "Anexar evidência de drill de recuperação ao pacote operacional por release ou quarter.",
      evidencePath: "packages/database/docs/BACKUP_RECOVERY.md"
    }
  ]
};

export const innovationCategoryConfig = [
  {
    key: "ai_ml_native",
    label: "AI/ML Nativa",
    target: 12,
    phase: "Fase 4",
    evidencePaths: [
      "packages/integrations/src/clients/llm.ts",
      "packages/workflows-core/src/nodes/aiTextExtract.ts",
      "apps/api/src/modules/workflows/service.ts"
    ]
  },
  {
    key: "clinical_automation",
    label: "Automação de Fluxos Clínicos",
    target: 12,
    phase: "Fase 4",
    evidencePaths: [
      "packages/workflows-core/src/nodes/notification.ts",
      "apps/api/src/modules/workflows/service.ts",
      "apps/api/src/modules/notifications/service.ts"
    ]
  },
  {
    key: "interoperability_data",
    label: "Interoperabilidade & Dados",
    target: 10,
    phase: "Fase 3",
    evidencePaths: [
      "apps/api/src/modules/connectors/service.oauth.ts",
      "packages/integrations/src/clients/http.ts",
      "apps/api/src/modules/webhooks/router.ts"
    ]
  },
  {
    key: "engagement_retention",
    label: "Engajamento & Retenção",
    target: 10,
    phase: "Fase 4",
    evidencePaths: [
      "apps/api/src/modules/engagement/queues.ts",
      "apps/api/src/modules/feedback/service.ts",
      "apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx"
    ]
  },
  {
    key: "analytics_bi",
    label: "Analytics & Business Intelligence",
    target: 10,
    phase: "Fase 4",
    evidencePaths: [
      "apps/api/src/modules/analytics/service.ts",
      "apps/api/src/modules/analytics/dashboard.service.ts",
      "apps/api/src/modules/analytics/usage.service.ts"
    ]
  },
  {
    key: "marketplace_ecosystem",
    label: "Marketplace & Ecossistema",
    target: 8,
    phase: "Fase 4",
    evidencePaths: [
      "apps/api/src/modules/marketplace/marketplace-service.ts",
      "packages/agent-packs/package.json",
      "apps/api/src/modules/connectors/router.ts"
    ]
  },
  {
    key: "infra_dx",
    label: "Infraestrutura & Developer Experience",
    target: 8,
    phase: "Fase 2",
    evidencePaths: [
      "apps/api/src/docs/openapi.ts",
      "apps/api/src/modules/webhooks/settings.service.ts",
      "packages/shared-types/src/index.ts"
    ]
  },
  {
    key: "compliance_regulatory",
    label: "Compliance & Regulatório",
    target: 10,
    phase: "Fase 3",
    evidencePaths: [
      "apps/api/src/modules/privacy/service.ts",
      "apps/api/src/audit/auditable.ts",
      "packages/database/test/rls.test.ts"
    ]
  },
  {
    key: "advanced_monetization",
    label: "Monetização Avançada",
    target: 10,
    phase: "Fase 3",
    evidencePaths: [
      "apps/api/src/modules/billing/service.ts",
      "apps/api/src/modules/billing/service.checkout.ts",
      "apps/api/src/modules/analytics/usage.service.ts"
    ]
  },
  {
    key: "ux_next_gen",
    label: "Experiência do Usuário Next-Gen",
    target: 10,
    phase: "Fase 4",
    evidencePaths: [
      "apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx",
      "apps/web/components/agents/FeedbackWidget.tsx",
      "apps/web/stores/notification-store.ts"
    ]
  }
];

export const innovationSeeds = {
  ai_ml_native: [
    ["Copiloto Clínico Materno Contextual", "Adicionar um copiloto longitudinal que cruza dados de workflow, billing e jornada clínica para sugerir a próxima ação segura por paciente."],
    ["Sumarização Evolutiva do Pré-natal", "Gerar resumos estruturados por consulta, com highlights de risco, pendências e próximos marcos da gestação."],
    ["Predição de Abandono de Jornada", "Treinar score de risco para evasão ou ausência com base em engajamento, histórico financeiro e lacunas clínicas."],
    ["Extração Visual de Exames e Guias", "Usar visão computacional para transformar exames e formulários em dados normalizados para workflows e analytics."],
    ["Detecção de Anomalias Operacionais", "Aplicar detecção de anomalias em faturamento, filas e processos para antecipar desvios que afetem receita ou cuidado."],
    ["Recomendador de Próxima Melhor Ação", "Orquestrar recomendações assistidas por IA para atendimento, retenção e follow-up com explicabilidade básica."],
    ["Score Preditivo de No-show", "Pontuar o risco de não comparecimento e disparar automações adaptativas por canal e janela temporal."],
    ["Montador Inteligente de Protocolos", "Gerar rascunhos de protocolos clínicos digitais a partir de outcomes reais do produto e feedback de execução."],
    ["Plano de Cuidado Personalizado", "Montar planos individualizados com base no perfil clínico, adesão e objetivos da paciente/tenant."],
    ["Voz-para-Prontuário Estruturado", "Converter notas de voz em registros estruturados reutilizáveis por workflows, auditoria e analytics."],
    ["Detector de Conflito entre Fluxos", "Identificar conflitos entre automações clínicas, comunicação e billing antes da execução em produção."],
    ["Simulador de Resultado por Cohort", "Simular impacto operacional e clínico de mudanças de protocolo usando cohorts históricos multi-tenant anonimizados."]
  ],
  clinical_automation: [
    ["Composer de Protocolos Pré-natais", "Versionar protocolos digitais por linha de cuidado com etapas, SLA e regras adaptativas por tenant."],
    ["Checklist por Idade Gestacional", "Disparar checklists contextuais conforme avanço gestacional, perfil de risco e histórico de exames."],
    ["Closed Loop Pós-alerta", "Fechar o ciclo de alertas com confirmação de atendimento, reabertura e trilha auditável de resolução."],
    ["Recuperação Inteligente de Exames Perdidos", "Reabrir automaticamente fluxos de exames não realizados com escalonamento progressivo e reagendamento."],
    ["Automação Alta -> Pós-parto", "Conectar alta, onboarding do puerpério, educação e cobrança em uma única trilha automatizada."],
    ["Coleta Multi-canal de Consentimento", "Capturar e versionar consentimentos por evento clínico, canal e representante legal."],
    ["Escalonamento por Sinal de Risco", "Ativar árvores de decisão com timers, ownership e fallback humano para sinais maternos críticos."],
    ["Encaminhamento com SLA Operacional", "Gerir referrals com prazo, aceite, retorno e monitoramento por parceiro ou unidade."],
    ["Reabertura Automática de Care Gaps", "Reabrir gaps de cuidado quando eventos posteriores invalidarem uma conclusão anterior."],
    ["Pré-consulta Assistida", "Coletar documentação e contexto antes da consulta para reduzir tempo administrativo e erros de input."],
    ["Adesão Terapêutica Automatizada", "Disparar lembretes, confirmação e follow-up quando houver protocolos terapêuticos ativos."],
    ["Case Board Human-in-the-loop", "Encaminhar casos complexos para board multidisciplinar com evidência consolidada e decisão versionada."]
  ],
  interoperability_data: [
    ["Sync FHIR R4 para Pacientes", "Expor e consumir recursos FHIR R4 para pacientes, agendas e eventos clínicos com mapeamento versionado."],
    ["Listener HL7 ADT", "Aceitar eventos HL7 ADT para sincronizar admissões, altas e movimentações relevantes ao cuidado."],
    ["Normalizador de Resultado Laboratorial", "Padronizar ingestão de resultados laboratoriais multi-fornecedor para o modelo do produto."],
    ["Conector de Ordens de Imagem", "Integrar pedidos e status de exames de imagem ao fluxo operacional e clínico do tenant."],
    ["Export Lakehouse Governado", "Publicar dados harmonizados em camadas bronze/silver/gold com governança por tenant."],
    ["Master Patient Index Multi-origem", "Resolver identidade clínica unificada quando a paciente existir em múltiplos sistemas externos."],
    ["Troca de Dados com Consentimento", "Aplicar consentimento e finalidade no roteamento de dados entre sistemas internos e externos."],
    ["Mapeador Terminológico Clínico", "Criar uma camada de mapeamento entre terminologias externas e o domínio interno da plataforma."],
    ["Firewall de Qualidade de Dados", "Barrar payloads incompletos ou incoerentes antes que contaminem analytics e automações."],
    ["Clean Room de Benchmarking", "Construir benchmark setorial multi-tenant com anonimização forte e governança por cohort."]
  ],
  engagement_retention: [
    ["Milestones e Streaks de Jornada", "Criar metas e marcos progressivos que reforcem adesão à jornada de cuidado."],
    ["Círculos de Comunidade Curada", "Habilitar comunidades moderadas por interesse, fase da jornada e contexto do tenant."],
    ["Feed de Conteúdo Personalizado", "Entregar conteúdo adaptado à paciente com base em risco, fase e comportamento."],
    ["App do Acompanhante Familiar", "Expandir a jornada para acompanhantes com missões, lembretes e permissões controladas."],
    ["Nudges por Objetivo de Saúde", "Vincular engajamento a metas explícitas e resultados observáveis em vez de comunicações genéricas."],
    ["Onboarding Adaptativo", "Ajustar o onboarding conforme perfil, tenant, canal e contexto clínico inicial."],
    ["Carteira de Recompensas de Cuidado", "Premiar adesão a marcos relevantes com benefícios e experiências personalizadas."],
    ["Recuperação por Sentimento", "Usar sinais de feedback/sentimento para abrir playbooks de retenção contextualizados."],
    ["Loop de Advocacy e Indicação", "Transformar boa experiência em indicação rastreável com incentivo e atribuição de origem."],
    ["Motor de Reativação de Retorno", "Reengajar pacientes inativas com ofertas e fluxos específicos por causa raiz."]
  ],
  analytics_bi: [
    ["Explorer de Cohorts Assistido", "Permitir análise por cohort combinando engajamento, receita, risco e outcomes em um fluxo guiado."],
    ["Command Center de Risco Materno", "Concentrar sinais de risco, operação e backlog clínico em uma camada executiva única."],
    ["Benchmark por Clínica/Tenant", "Comparar tenants similares sem expor dados brutos e com filtros contextuais de operação."],
    ["Preditor de Revenue Leakage", "Antecipar vazamentos de receita por churn, falha operacional, inadimplência e não comparecimento."],
    ["Capacity Planning Twin", "Modelar demanda e capacidade de atendimento usando eventos, sazonalidade e filas."],
    ["Atribuição Outcome -> Receita", "Mostrar a relação entre protocolo, adesão, retenção e receita incremental."],
    ["Heatmap de Aderência a Protocolo", "Medir aderência por equipe, tenant, cohort e jornada em um único artefato navegável."],
    ["Minerador de Motivos de Retenção", "Consolidar texto, eventos e histórico para descobrir drivers reais de retenção/churn."],
    ["Radar Multi-tenant de Anomalias", "Detectar anomalias comparativas entre tenants em tempo quase real."],
    ["Narrativa Executiva Automática", "Gerar sumários executivos semanais com contexto, risco e próxima ação recomendada."]
  ],
  marketplace_ecosystem: [
    ["Marketplace de Parceiros Verificados", "Criar um marketplace de parceiros com onboarding, QA técnico e score de confiabilidade."],
    ["Pacotes White-label por Vertical", "Comercializar bundles de capacidade por vertical, região ou porte de operação."],
    ["App Store Privada por Tenant", "Permitir catálogo privado de extensões aprovadas por tenant com políticas próprias."],
    ["Ranking de Parceiros por Outcome", "Ordenar parceiros pelo efeito em adoção, retenção e eficiência operacional."],
    ["Programa de Monetização de Conectores", "Abrir um modelo de distribuição e revenue share para integrações certificadas."],
    ["Troca de Protocolos entre Tenants", "Publicar protocolos reutilizáveis com trilha de adoção e benchmarking de resultado."],
    ["Marketplace Embutido na Jornada", "Oferecer serviços complementares dentro do fluxo do usuário no momento de necessidade."],
    ["Console de Revenue Share", "Dar transparência operacional/financeira a parcerias com cálculo e repasse automatizados."]
  ],
  infra_dx: [
    ["Produto de API Pública", "Transformar a API atual em produto externo com versionamento, quotas e onboarding de desenvolvedores."],
    ["Studio de Contratos de Evento/Webhook", "Editor visual de contratos de evento com replay, validação e changelog de schema."],
    ["Sandbox de Tenant Sintético", "Provisionar tenants efêmeros com dados fictícios e scripts de smoke para integração segura."],
    ["Gerador de SDKs", "Emitir SDKs e exemplos oficiais a partir do OpenAPI e contratos de eventos suportados."],
    ["Replay Debugger de Integrações", "Reexecutar eventos e webhooks em sandbox com rastreamento determinístico."],
    ["Policy-as-code para Workflows", "Definir guardrails executáveis para nodes, limites e acesso por plano/tenant."],
    ["Laboratório de Testes Sintéticos", "Rodar cenários sintéticos contínuos por tenant/persona usando seeds controlados."],
    ["Docs Interativas com Payload Realista", "Publicar documentação interativa com payloads, erros e fluxos reais do domínio."]
  ],
  compliance_regulatory: [
    ["Mapa de Linhagem LGPD", "Rastrear origem, transformação e destino de dados pessoais/sensíveis por fluxo de produto."],
    ["Automação de Retenção e Descarte", "Aplicar políticas versionadas de retenção e descarte por categoria de dado."],
    ["Ledger de Consentimento", "Registrar consentimento, revogação e propósito em trilha imutável e consultável."],
    ["Rule Pack CFM/ANVISA", "Codificar requisitos regulatórios aplicáveis em pacotes verificáveis por release."],
    ["Registro de IA Explicável", "Versionar modelos, prompts, datasets e justificativas de uso de IA para auditoria."],
    ["Auditoria Automática por Prontuário", "Executar verificações automáticas de completude, acesso e trilha por prontuário/evento."],
    ["Controles de Residência de Dados", "Aplicar restrições de residência e transferência por tenant, integração e relatório."],
    ["Campanhas de Revisão de Acesso", "Orquestrar recertificação periódica de acessos críticos por tenant e papel."],
    ["Vault de Evidências Regulatórias", "Agrupar evidências técnicas e operacionais por auditoria, incidente ou release."],
    ["Composer de Relatórios Regulatórios", "Gerar relatórios regulatórios e de compliance diretamente a partir do runtime da plataforma."]
  ],
  advanced_monetization: [
    ["Pricing Usage-based", "Cobrar parte da plataforma por uso observável em workflow, integrações, outputs e mensagens."],
    ["Guardrails de Overage", "Aplicar limites inteligentes antes de ruptura operacional ou surpresa de fatura."],
    ["Contratos Baseados em Outcome", "Modelar monetização condicionada a indicadores de retenção, adesão ou eficiência."],
    ["Motor de Upsell Dinâmico", "Sugerir upgrades por padrão de uso, risco e potencial de ROI do tenant."],
    ["Billing Multi-entidade", "Consolidar cobrança entre matrizes, unidades e parceiros mantendo segregação de uso."],
    ["Simulador Self-service de Plano", "Permitir que o tenant simule custo/benefício de plano e add-ons em tempo real."],
    ["Liquidação de Revenue Share", "Automatizar cálculo, retenção e repasse financeiro de parceiros/marketplace."],
    ["Mercado de Créditos Internos", "Criar créditos reutilizáveis para IA, integrações premium e serviços de parceiros."],
    ["Dunning Orchestration Inteligente", "Otimizar recuperação financeira com mensagens, canais e janelas adaptativas."],
    ["Cockpit de Inteligência de Margem", "Expor margem por tenant, fluxo, integração e feature para orientar pricing e roadmap."]
  ],
  ux_next_gen: [
    ["Dashboards Adaptativos por Papel", "Montar dashboards distintos para clínico, operação, financeiro e executivo com foco real de decisão."],
    ["Care Hub Mobile-first", "Desenhar uma experiência mobile-first para acompanhamento diário da jornada de cuidado."],
    ["Accessibility Autopilot", "Aplicar ajustes automáticos de contraste, foco e densidade conforme necessidade do usuário."],
    ["Modo Offline para Campo", "Permitir captura e consulta essenciais sem conectividade, com reconciliação segura posterior."],
    ["Command Palette Contextual", "Oferecer ações rápidas orientadas ao contexto da tela, tenant e permissão."],
    ["Layouts Personalizáveis", "Dar autonomia para cada perfil/tenant reorganizar sua área de trabalho com governança."],
    ["Memória de Sessão Cross-touchpoint", "Relembrar contexto relevante entre jornadas web, notificações e atendimento humano."],
    ["Formulários de Divulgação Progressiva", "Reduzir atrito em formulários longos com progressão contextual e validação antecipada."],
    ["Engine Multi-idioma", "Habilitar localização real da interface, conteúdo e notificações por tenant e público."],
    ["UX Guiada de Recuperação de Erro", "Transformar falhas em fluxos assistidos de correção em vez de mensagens finais opacas."]
  ]
};

export const glossaryTerms = [
  ["DORA Metrics", "Conjunto de métricas operacionais usado para medir velocidade e confiabilidade de entrega de software."],
  ["VDI", "Velocity Drain Index, índice composto usado neste relatório para priorizar dívida técnica por impacto real."],
  ["RLS", "Row-Level Security, política do banco que restringe acesso a linhas conforme o contexto do tenant."],
  ["OWASP Top 10", "Lista de categorias de risco de segurança comuns em aplicações web."],
  ["STRIDE", "Modelo de ameaça que cobre spoofing, tampering, repudiation, information disclosure, denial of service e elevation of privilege."],
  ["SLO", "Service Level Objective, meta operacional como latência, disponibilidade ou taxa de erro."],
  ["SLA", "Service Level Agreement, compromisso formal de serviço e suporte com cliente ou operação."],
  ["Lead Time for Changes", "Tempo entre iniciar uma mudança e colocá-la em produção."],
  ["Change Failure Rate", "Percentual de mudanças que causam incidente, rollback ou degradação relevante."],
  ["Time to Restore", "Tempo necessário para restaurar o serviço após uma falha relevante."],
  ["Critical Path", "Sequência mínima de tarefas que determina a duração total do roadmap."],
  ["C4", "Modelo de documentação arquitetural que organiza a visão do sistema em contexto, contêineres, componentes e código."],
  ["Feature Flag", "Mecanismo para ligar ou desligar comportamento sem novo deploy."],
  ["DAST", "Teste dinâmico de segurança executado contra a aplicação em runtime."],
  ["SBOM", "Inventário de componentes de software usado para governança e segurança de dependências."]
];
