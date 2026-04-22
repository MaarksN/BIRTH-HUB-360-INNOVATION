# Relatório de Dívida Técnica + Roadmap de Finalização (do zero)

Data: 2026-04-04

## Escopo e método
- Análise feita do zero, apenas do código fonte da plataforma (apps/ e packages/), sem reaproveitar auditorias, roadmaps ou checklists prévios.
- Objetivo: acelerar lançamento com foco em estabilidade, conversão, billing e operação segura.
- Estratégia: priorização por impacto de negócio x esforço x risco de produção.

## Arquitetura observada no código (resumo executivo)
- Monorepo Node/TypeScript com apps principais: Web (Next), API, Worker, Voice Engine e Webhook Receiver.
- Núcleo de domínio distribuído em pacotes (database, auth, security, queue, integrations, workflows-core, agents-*).
- Forte presença de rotinas operacionais, segurança, testes e scripts de release, indicando maturidade estrutural, porém com oportunidade de simplificação para ganho de velocidade.

## 100 itens de melhoria (dívida técnica)
### API e BFF (apps/api, apps/web/lib)
1. Reduzir acoplamento de rotas no bootstrap da API, separando composição por domínio.
2. Padronizar contratos de erro Problem Details em 100% dos endpoints.
3. Unificar middlewares duplicados de contexto de tenant em uma única implementação.
4. Criar camada de versionamento explícito de API para evitar breaking changes silenciosas.
5. Adicionar limites de payload por rota com fallback observável.
6. Eliminar lógica de regra de negócio dentro de controllers, movendo para services.
7. Padronizar serialização/deserialização de datas para UTC em toda API.
8. Adicionar validação de schema de resposta para endpoints críticos.
9. Reduzir número de dependências implícitas entre auth-routes e core-routes.
10. Criar contrato de idempotência para endpoints de escrita críticos.

### Worker e execução assíncrona (apps/worker)
11. Isolar orchestration engine em módulo puro para facilitar testes de regressão.
12. Criar política unificada de retry/backoff por tipo de job.
13. Implementar dead-letter queue com motivo padronizado por falha.
14. Adicionar controle de concorrência por tenant para evitar noisy neighbor.
15. Instrumentar tempo de fila versus tempo de execução em todas as filas.
16. Eliminar duplicidade de validações entre worker.job-validation e process-job.
17. Criar timeout hard e soft por executor com cancelamento cooperativo.
18. Centralizar mapeamento de erros transitórios versus permanentes.
19. Adicionar guardrail para jobs órfãos e reprocessamento seguro.
20. Definir contrato de prioridade de jobs (alta/média/baixa) com fairness.

### Banco e persistência (packages/database)
21. Revisar índices compostos para consultas multi-tenant de alto volume.
22. Padronizar paginação cursor-based em repositórios sensíveis a escala.
23. Criar política de query budget por caso de uso e não só global.
24. Migrar operações críticas para transações com timeout explícito.
25. Adicionar trilha de auditoria de mudanças de status em entidades-chave.
26. Criar estratégia de arquivamento para tabelas com crescimento contínuo.
27. Padronizar naming de migrations para rastreabilidade por domínio.
28. Adicionar validação automática de isolamento tenant em novos repositórios.
29. Reduzir uso de consultas ad-hoc em favor de repositórios tipados.
30. Criar benchmark periódico de consultas top-N por latência.

### Observabilidade e operação (apps/api/src/observability, apps/worker/src/observability)
31. Padronizar convenção de nomes de métricas entre API, Web e Worker.
32. Adicionar SLO formal para disponibilidade, latência e erro por serviço.
33. Criar dashboards por jornada crítica (login, execução, billing, convite).
34. Garantir correlação de trace-id fim a fim entre web, api e worker.
35. Instrumentar eventos de negócio com cardinalidade controlada.
36. Adicionar alertas por budget de erro semanal e não só threshold absoluto.
37. Criar runbook mínimo por alerta P1/P2 integrado ao monitoramento.
38. Padronizar nível de severidade de logs estruturados.
39. Adicionar healthchecks dependentes por componente externo.
40. Implementar relatório diário automático de incidentes e quase-incidentes.

### Segurança e conformidade (middleware/auth, csrf, origin, packages/security)
41. Completar matriz de autorização por papel e recurso em rotas protegidas.
42. Adicionar rotação automática de chaves para criptografia de dados sensíveis.
43. Padronizar política de rate limit por risco de endpoint.
44. Criar trilha de auditoria para ações administrativas críticas.
45. Adicionar detecção de anomalia para tentativas de login e convite.
46. Implementar validação de origem e CORS baseada em ambiente.
47. Reforçar sanitização server-side para entradas ricas em texto.
48. Criar varredura contínua de segredos em commits e variáveis de ambiente.
49. Adicionar evidência automatizada de consentimento e preferências de cookie.
50. Padronizar hardening headers de segurança em todas respostas web/api.

### Frontend Web e UX (apps/web/app, components, stores)
51. Reduzir acoplamento entre componentes de dashboard e APIs internas.
52. Criar biblioteca de estados de carregamento, vazio e erro reutilizável.
53. Padronizar tratamento de sessão expirada com recuperação graciosa.
54. Reduzir hidratação desnecessária em páginas de alto tráfego.
55. Implementar orçamento de performance para rota inicial e dashboard.
56. Adicionar acessibilidade AA em formulários e navegação por teclado.
57. Padronizar telemetria de cliques e conversão por feature flag.
58. Criar fallback offline básico para assets essenciais do PWA.
59. Uniformizar validação de formulários entre client e server.
60. Adicionar proteção anti-duplo clique em ações de escrita.

### Integrações e conectores (packages/integrations, worker/integrations)
61. Criar contrato único de erro para provedores externos.
62. Implementar circuit breaker por integração crítica.
63. Adicionar replay seguro para webhooks recebidos com deduplicação.
64. Padronizar assinatura e validação de payloads webhook.
65. Criar tabela de mapeamento de campos versionada por conector.
66. Adicionar monitor de SLA por provedor externo.
67. Implementar sandbox de testes para conectores sem impactar produção.
68. Padronizar estratégia de paginação e sincronização incremental.
69. Criar verificação automática de drift de contratos externos.
70. Adicionar fallback de degradação funcional quando provedor estiver indisponível.

### Qualidade e testes (tests em apps/* e packages/*)
71. Aumentar cobertura de testes de integração para fluxos cross-service.
72. Padronizar fixtures e factories para reduzir flaky tests.
73. Criar suíte de contract testing entre web-bff-api-worker.
74. Adicionar testes de carga mínimos em pipeline noturno.
75. Reduzir tempo de feedback da pipeline com paralelismo otimizado.
76. Criar smoke suite de release focada em caminhos de receita.
77. Adicionar validação de migração de banco em ambiente efêmero por PR.
78. Padronizar tags de testes (unit/integration/slow) com enforcement.
79. Criar métrica de confiabilidade de testes por pacote.
80. Automatizar triagem de falhas recorrentes com classificação de causa.

### DevEx, arquitetura e governança técnica (scripts/, turbo, workspaces)
81. Reduzir complexidade de scripts de CI centralizando utilitários comuns.
82. Padronizar convenção de boundaries entre pacotes do monorepo.
83. Criar score de acoplamento entre módulos para guiar refactor.
84. Adicionar validação automática de APIs internas não utilizadas.
85. Definir política de depreciação com janela e comunicação automática.
86. Padronizar templates de PR técnico com impacto operacional.
87. Criar check de compatibilidade Node/pnpm pré-execução local.
88. Adicionar blueprint de criação de novo serviço/pacote.
89. Automatizar geração de changelog por domínio.
90. Criar baseline de tempo de build/test por pacote para otimização contínua.

### Produto, billing e confiabilidade de negócio (billing, quota, convites, workflows)
91. Padronizar cálculo de quota entre API e Worker para evitar divergência.
92. Criar reconciliação diária de billing com trilha de inconsistências.
93. Adicionar idempotência nas rotinas de exportação financeira.
94. Criar fallback operacional para falha na emissão de cobrança.
95. Implementar travas de consistência em aceitação de convites.
96. Padronizar estados de workflow com transições auditáveis.
97. Criar monitor de abandono de onboarding com causa técnica.
98. Adicionar proteção contra execução duplicada de workflow.
99. Criar mecanismo de reprocessamento manual assistido para suporte.
100. Padronizar KPIs de saúde de plataforma com threshold operacional.

## 100 itens de novas implementações
### Lançamento comercial imediato (MVP de receita)
1. Implementar onboarding guiado em 5 passos com progresso salvo.
2. Adicionar trial automático com conversão para plano pago no app.
3. Criar paywall contextual por recurso premium.
4. Implementar fluxo self-service de upgrade/downgrade de plano.
5. Adicionar gestão de método de pagamento no painel.
6. Criar centro de faturamento com histórico e invoices.
7. Implementar recuperação de churn com ofertas in-app.
8. Adicionar cupom promocional com validade e limite de uso.
9. Criar tela de limites de uso e consumo em tempo real.
10. Implementar e-mails transacionais de cobrança e renovação.

### Produto de IA e agentes
11. Implementar marketplace interno de agentes com filtros por caso de uso.
12. Adicionar execução em lote de agentes por lista de tarefas.
13. Criar biblioteca de prompts versionados por equipe.
14. Implementar comparação A/B de resposta entre modelos.
15. Adicionar memória de contexto por conta e por usuário.
16. Criar painel de custo por execução de agente.
17. Implementar aprovação humana opcional antes de ação sensível.
18. Adicionar trilha de explicabilidade de decisões do agente.
19. Criar templates de workflow com agentes prontos por vertical.
20. Implementar fallback automático para modelo secundário.

### Colaboração e gestão de equipes
21. Implementar espaços de trabalho multi-time com permissões granulares.
22. Adicionar comentários em execuções e artefatos.
23. Criar menções e notificações por evento relevante.
24. Implementar compartilhamento seguro de relatórios por link expirável.
25. Adicionar trilha de atividade por usuário e por time.
26. Criar aprovação em duas etapas para ações críticas.
27. Implementar delegação temporária de acesso.
28. Adicionar calendário de tarefas e automações recorrentes.
29. Criar biblioteca de playbooks internos por equipe.
30. Implementar exportação colaborativa para PDF e planilha.

### Inteligência operacional e analytics
31. Implementar painel executivo com MRR, churn, ativação e retenção.
32. Adicionar funil de onboarding com quedas por etapa.
33. Criar coorte de uso por plano e segmento.
34. Implementar previsão de consumo de quota por tenant.
35. Adicionar alerta proativo de risco de churn.
36. Criar score de saúde do cliente com ações recomendadas.
37. Implementar analytics de performance por agente/workflow.
38. Adicionar benchmark interno entre equipes e unidades.
39. Criar relatórios agendados enviados por e-mail.
40. Implementar API de métricas para BI externo.

### Integrações de mercado
41. Implementar conector nativo com Salesforce.
42. Adicionar conector nativo com HubSpot avançado (sync bidirecional).
43. Criar integração com Slack para alertas e aprovações.
44. Implementar integração com Microsoft Teams.
45. Adicionar webhooks outbound configuráveis por evento.
46. Criar integração com Google Sheets para import/export.
47. Implementar integração com Stripe para billing avançado.
48. Adicionar integração com Zendesk para suporte contextual.
49. Criar catálogo de conectores com health status.
50. Implementar SDK público para integrações customizadas.

### Confiabilidade e escala de produto
51. Implementar autoscaling orientado por profundidade de fila.
52. Adicionar fila prioritária para clientes enterprise.
53. Criar limite dinâmico por tenant conforme plano contratado.
54. Implementar replicação de leitura para consultas analíticas.
55. Adicionar cache distribuído para endpoints de alto volume.
56. Criar modo degradado para manter operações essenciais.
57. Implementar failover automatizado entre regiões.
58. Adicionar chaos drills contínuos em serviços críticos.
59. Criar painel de capacidade e previsão de saturação.
60. Implementar proteção de picos com buffer de ingestão.

### Segurança produto e compliance avançada
61. Implementar SSO SAML/OIDC para clientes corporativos.
62. Adicionar MFA obrigatório por política de tenant.
63. Criar gestão de sessões ativas com revogação imediata.
64. Implementar data residency por região de cliente.
65. Adicionar trilha de auditoria exportável para compliance.
66. Criar painel de postura de segurança por conta.
67. Implementar DLP básico para dados sensíveis em prompts.
68. Adicionar retenção configurável de dados por tenant.
69. Criar mascaramento dinâmico para campos sensíveis na UI.
70. Implementar consentimento granular por finalidade de uso.

### Experiência do usuário e mobile readiness
71. Implementar dashboard mobile-first para gestores.
72. Adicionar command palette global com atalhos.
73. Criar onboarding contextual por tooltips progressivos.
74. Implementar central de notificações unificada.
75. Adicionar tema escuro e preferências de acessibilidade.
76. Criar assistente in-app para dúvidas frequentes.
77. Implementar busca global semântica por conteúdo.
78. Adicionar autosave com histórico de versões.
79. Criar modo foco para execução assistida de workflows.
80. Implementar personalização de widgets do dashboard.

### Plataforma para parceiros e ecossistema
81. Implementar portal de parceiros com gestão de contas vinculadas.
82. Adicionar modelo de revenda e comissionamento.
83. Criar API keys com escopo e expiração configurável.
84. Implementar sandbox para desenvolvedores terceiros.
85. Adicionar documentação interativa de API com try-it.
86. Criar programa de templates publicados por parceiros.
87. Implementar webhook signing com rotação de segredo.
88. Adicionar painel de uso da API por aplicação.
89. Criar fluxo de aprovação de apps de terceiros.
90. Implementar faturamento separado por conta parceira.

### Suporte, sucesso do cliente e operação de lançamento
91. Implementar central de status da plataforma pública.
92. Adicionar chat de suporte com contexto técnico automático.
93. Criar base de conhecimento contextual por tela.
94. Implementar coleta de NPS e CES dentro do produto.
95. Adicionar roteamento inteligente de tickets por criticidade.
96. Criar playbooks de suporte para incidentes de billing.
97. Implementar diagnóstico automático de conta para suporte L1.
98. Adicionar reexecução guiada de fluxos com falha.
99. Criar painel de SLA de atendimento por segmento.
100. Implementar relatórios semanais de adoção para customer success.

## Roadmap acelerado de finalização (lançamento mais rápido possível)
### Fase 0 (Dias 1-5) — Congelar risco e liberar trilho de execução
- Foco: confiabilidade mínima para produção (erros padronizados, retry/backoff, observabilidade ponta a ponta, proteção de billing).
- Entregas: 20 itens críticos da dívida técnica + playbook de incidente + smoke de release em produção simulada.

### Fase 1 (Dias 6-15) — Habilitar receita imediata
- Foco: onboarding, paywall, trial, upgrade/downgrade, centro de faturamento, comunicação transacional.
- Entregas: 15 implementações comerciais + 15 melhorias de estabilidade de API/worker/banco.

### Fase 2 (Dias 16-30) — Escalar sem quebrar
- Foco: limites por tenant, prioridade de fila, dashboards executivos, integrações-chave (CRM + Slack/Teams), suporte operacional.
- Entregas: 30 implementações + 25 melhorias de performance, testes e governança arquitetural.

### Fase 3 (Dias 31-45) — Diferenciação competitiva pós-lançamento
- Foco: SSO/MFA enterprise, marketplace de agentes, analytics avançado, ecossistema de parceiros e SDK público.
- Entregas: 55 implementações restantes + 40 melhorias estruturais para reduzir custo operacional contínuo.

## Ordem de priorização prática (para começar amanhã)
1. Estancar risco de produção: observabilidade, retries, idempotência, segurança de borda e billing seguro.
2. Ativar receita: onboarding + trial + planos + cobrança + notificações transacionais.
3. Reduzir custo de suporte: diagnósticos automáticos, status page, runbooks e trilha de auditoria.
4. Escalar aquisição: integrações nativas + analytics de conversão + colaboração de times.
5. Entrar em enterprise: SSO, MFA, compliance exportável e controles avançados de dados.

## Meta de lançamento recomendada
- **Go-live comercial em até 15 dias** com escopo de receita + confiabilidade mínima.
- **Hardening em 45 dias** para estabilizar crescimento e preparar expansão enterprise.