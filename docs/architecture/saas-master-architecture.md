# BirthHub 360 Innovation — Arquitetura Mestre SaaS Multi-tenant

> Documento de definição arquitetural para evolução da plataforma para um SaaS modular, multi-tenant, extensível, auditável e monetizável.

---

## FASE 1 — Produto Principal

# Produto Principal

## Nome do Produto
**BirthHub 360 Operating Cloud (BH360 OC)**

## Categoria
**Plataforma operacional SaaS multi-tenant** com núcleo de CRM + automações + agentes + integrações + billing.

## Proposta de Valor
Unificar aquisição, relacionamento, vendas, operação e pós-venda em uma única plataforma extensível com:
- CRM operacional;
- automações orientadas a eventos;
- agentes IA governados por políticas;
- conectores nativos com ecossistema martech/sales/financeiro;
- billing por plano e consumo.

## Público-Alvo
- Empresas B2B brasileiras de serviços, tecnologia e educação;
- RevOps, Marketing Ops, Sales Ops e CS Ops;
- Agências/consultorias que gerenciam múltiplos clientes.

## Cliente Pagante
- PMEs e médias empresas (Starter/Pro);
- Operações multi-time e multi-unidade (Business);
- Grupos com compliance, SSO, governança e integrações corporativas (Enterprise).

## Problema Resolvido
Fragmentação operacional entre CRM, marketing, comunicação, assinatura de contratos, billing, ERP e suporte; baixa governança de automações; dificuldade de escalar processos sem perda de controle e rastreabilidade.

## Solução Oferecida
- **Núcleo CRM multi-tenant** com trilha auditável;
- **Motor de workflows** versionado, idempotente e resiliente;
- **Camada de conectores** padronizada (credenciais, webhooks, sync);
- **Runtime de agentes IA** com RBAC/ABAC, approval e auditoria;
- **Camada SaaS** (planos, limites, cobrança, bloqueios graduais).

## Diferencial Competitivo
1. Governança forte por tenant (LGPD + auditoria + policy engine).
2. Agentes IA *policy-first* (sem bypass de permissões).
3. Conectores orientados a domínio brasileiro (Zenvia, Blip, Asaas, Omie etc.).
4. Arquitetura de eventos unificada para CRM, workflows, agentes e billing.

## MVP
- Core multi-tenant + RBAC
- CRM básico (Lead, Contact, Company, Deal, Pipeline)
- Workflows simples (event/manual/webhook triggers + ações essenciais)
- Conectores iniciais: Gmail, Google Calendar, WhatsApp Business API, Stripe, HubSpot, Slack, n8n
- Billing básico (assinatura + uso + bloqueio)
- Audit log e APIs v1

## Versão Pro
- Segmentação e campanhas
- Automações avançadas com branch/condition/wait
- Catálogo ampliado de conectores
- Agentes operacionais (CRM/Workflow/Connector)
- Retenção maior de logs e métricas avançadas

## Versão Business
- Multi-pipeline avançado, SLA e governança por squads
- Marketplace interno de integrações/templates
- Recursos avançados de observabilidade, QA de workflow e versionamento robusto
- Overage configurável por módulo

## Versão Enterprise
- SSO/SAML/SCIM
- Ambientes segregados (prod/sandbox)
- KMS/BYOK, trilhas de auditoria estendidas, retenção custom
- Limites dedicados, suporte premium e compliance pack

## Fora do Escopo Inicial
- CPQ completo e gestão fiscal avançada
- Data warehouse embutido full BI
- Marketplace público com revenue share completo
- Engine de ML custom por cliente

---

## FASE 2 — Módulos

| Módulo | Objetivo | MVP | Monetizável | Entidades | Eventos | APIs | Dependências |
|---|---|---|---|---|---|---|---|
| Core Platform | Base de execução SaaS | Sim | Indireto | Tenant, Plan, FeatureFlag | tenant.created | /v1/tenants/current | Auth, Multi-tenancy |
| Autenticação e Usuários | Login, sessão, identidade | Sim | Não | User, Membership | user.invited, user.joined | /v1/auth/*, /v1/users* | Core |
| Multi-tenancy | Isolamento por tenantId | Sim | Não | Tenant, Membership | tenant.created | middleware tenancy | Core |
| RBAC e Permissões | Autorização granular | Sim | Indireto | Role, Permission | role.updated | policy checks | Auth |
| CRM | Gestão comercial central | Sim | Sim | Contact, Company, Deal | crm.* | /v1/crm/* | Core, RBAC |
| Leads | Entrada e qualificação | Sim | Sim | Lead | crm.lead.created | /v1/crm/leads* | CRM |
| Contatos | Cadastro relacional | Sim | Sim | Contact | crm.contact.* | /v1/crm/contacts* | CRM |
| Empresas | Conta B2B | Sim | Sim | Company | crm.company.* | /v1/crm/companies* | CRM |
| Deals/Oportunidades | Pipeline comercial | Sim | Sim | Deal | crm.deal.* | /v1/crm/deals* | CRM, Pipelines |
| Pipelines | Etapas e forecast | Sim | Sim | Pipeline, PipelineStage | crm.deal.stage_changed | /v1/crm/pipelines* | CRM |
| Marketing | Captação e segmentação | Parcial | Sim | Campaign, Audience, Segment | marketing.* | /v1/marketing/* | CRM |
| Campanhas | Orquestração campanhas | Não | Sim | Campaign | marketing.campaign.created | /v1/campaigns* | Marketing |
| Comunicação | Canal unificado | Parcial | Sim | Activity, Message log | communication.* | /v1/messages* | Connectors |
| WhatsApp | Mensageria WABA | Sim | Sim | ConnectorAccount | connector.webhook.received | /v1/connectors/whatsapp* | Connectors |
| Email | Envios transacionais e comerciais | Sim | Sim | Activity | email.sent | /v1/email* | Connectors |
| Chat | Atendimento interno/externo | Não | Sim | Conversation | chat.* | /v1/chat* | Communication |
| Workflows | Automação event-driven | Sim | Sim | Workflow* | workflow.* | /v1/workflows* | Event Bus |
| Agentes IA | Execução assistida governada | Parcial | Sim | Agent* | agent.* | /v1/agents* | RBAC, Workflows |
| Conectores | Integrações externas | Sim | Sim | Connector* | connector.* | /v1/connectors* | Security |
| Webhooks | Entrada/saída de eventos | Sim | Sim | WebhookEndpoint, WebhookDelivery | connector.webhook.received | /v1/webhooks/* | Connectors |
| Billing/SaaS | Cobrança e governança de uso | Sim | Sim | Subscription, Invoice, UsageRecord | billing.* | /v1/billing/* | Plans |
| Planos e Assinaturas | Catálogo comercial | Sim | Sim | Plan, Subscription, UsageLimit | billing.subscription.created | /v1/plans* | Billing |
| Auditoria | Rastreabilidade crítica | Sim | Indireto | AuditLog | audit.* | /v1/audit-logs* | Core |
| Analytics | Métricas produto/operação | Parcial | Sim | TrackingEvent | analytics.* | /v1/analytics* | Events |
| Marketplace de Integrações | Catálogo de apps | Não | Sim | ConnectorProvider | marketplace.* | /v1/marketplace/* | Connectors |
| Admin Console | Governança operacional | Sim | Indireto | Tenant, Plan, AuditLog | admin.* | /v1/admin/* | RBAC |
| Developer/API Portal | Chaves, docs e escopos | Não | Sim | ApiKey, Scope | developer.key.created | /v1/developer/* | Auth, RBAC |

---

## FASE 3 — Entidades

### Catálogo de entidades (resumo)

| Entidade | Módulo | Tenant Scoped | Campos principais | Relacionamentos | Eventos |
|---|---|---|---|---|---|
| Tenant | Core | Não (global) | id, name, status, locale | memberships, subscriptions | tenant.created |
| User | Auth | Não (global) | id, email, name, status | memberships | user.invited, user.joined |
| Membership | Auth | Sim | tenantId, userId, roleId | tenant, user, role | membership.updated |
| Role | RBAC | Sim | name, isSystem, policyJson | permissions | role.updated |
| Permission | RBAC | Não (catálogo) | key, module, action | roles | permission.granted |
| Plan | Billing | Não | code, price, limits | subscriptions, featureFlags | plan.updated |
| Subscription | Billing | Sim | planId, status, renewalAt | invoices, usage | billing.subscription.created |
| FeatureFlag | Billing | Sim | key, enabled, scope | tenant/plan | feature.updated |
| UsageLimit | Billing | Sim | metric, hardLimit, softLimit | plan/subscription | billing.usage.exceeded |
| AuditLog | Security | Sim | actor, action, resource, payloadHash | user/agent | audit.logged |
| Contact | CRM | Sim | name, email, phone, ownerId | company, leads, deals | crm.contact.created |
| Company | CRM | Sim | name, domain, industry | contacts, deals | crm.company.created |
| Lead | CRM | Sim | source, score, status | contact/company | crm.lead.created |
| Deal | CRM | Sim | value, currency, stageId, closeDate | pipeline, company, contact | crm.deal.created |
| Pipeline | CRM | Sim | name, type, isDefault | stages, deals | crm.pipeline.updated |
| PipelineStage | CRM | Sim | pipelineId, name, order, winProbability | deals | crm.deal.stage_changed |
| Task | CRM | Sim | title, dueAt, assigneeId | contact/deal | crm.task.created |
| Note | CRM | Sim | body, entityType, entityId | contact/company/deal | crm.note.created |
| Activity | CRM/Comms | Sim | type, occurredAt, channel | contact/deal | crm.activity.created |
| Campaign | Marketing | Sim | name, channel, status, budget | audience, tracking | marketing.campaign.created |
| Audience | Marketing | Sim | name, ruleJson | segments | marketing.audience.updated |
| Segment | Marketing | Sim | name, criteriaJson | contacts | marketing.segment.updated |
| Form | Marketing | Sim | slug, schemaJson, status | landingPage | marketing.form.submitted |
| LandingPage | Marketing | Sim | slug, templateKey | forms | marketing.page.published |
| TrackingEvent | Analytics | Sim | type, sessionId, attrsJson | campaign/contact | marketing.lead.captured |
| Workflow | Workflows | Sim | name, status, publishedVersionId | versions, runs | workflow.created |
| WorkflowVersion | Workflows | Sim | workflowId, version, dslJson, checksum | workflow, runs | workflow.published |
| WorkflowTrigger | Workflows | Sim | type, configJson | version | workflow.triggered |
| WorkflowAction | Workflows | Sim | stepId, type, inputJson | version | workflow.step.executed |
| WorkflowRun | Workflows | Sim | workflowId, status, startedAt, endedAt | stepRuns | workflow.run.* |
| WorkflowStepRun | Workflows | Sim | runId, stepId, status, attempts | run | workflow.step.* |
| WorkflowEvent | Workflows | Sim | type, envelopeJson | run | workflow.event.recorded |
| IdempotencyKey | Workflows/Core | Sim | scope, key, expiresAt, fingerprint | run/action | idempotency.used |
| ConnectorProvider | Connectors | Não | key, category, authType | accounts | connector.provider.updated |
| ConnectorAccount | Connectors | Sim | providerKey, status, externalAccountId | credentials, events | connector.connected |
| ConnectorCredential | Connectors | Sim | accountId, secretRef, scopes | account | connector.credential.rotated |
| ConnectorEvent | Connectors | Sim | providerKey, externalEventId, payload | account | connector.webhook.received |
| WebhookEndpoint | Connectors | Sim | url, secretRef, status | deliveries | webhook.endpoint.updated |
| WebhookDelivery | Connectors | Sim | endpointId, eventId, status, attempts | endpoint | webhook.delivery.* |
| ExternalObjectMapping | Connectors | Sim | providerKey, externalId, internalType, internalId | connector account | connector.mapping.updated |
| Agent | Agents | Sim | name, type, policyId, status | tools, runs | agent.created |
| AgentTool | Agents | Sim | agentId, toolKey, mode, config | agent | agent.tool.registered |
| AgentRun | Agents | Sim | agentId, status, input, output | approvals, handoffs | agent.run.* |
| AgentMemory | Agents | Sim | agentId, scope, content, ttl | agent | agent.memory.updated |
| AgentHandoff | Agents | Sim | fromAgentId, toAgentId, reason | agentRun | agent.handoff.created |
| AgentPolicy | Agents/Security | Sim | maxRiskLevel, allowedActions, requiresApproval | agents | agent.policy.updated |
| AgentApproval | Agents | Sim | runId, requestedBy, status, decidedBy | agentRun | agent.approval.requested |
| Invoice | Billing | Sim | subscriptionId, amount, dueAt, status | payments | billing.invoice.generated |
| Payment | Billing | Sim | invoiceId, provider, amount, status | invoice | billing.payment.* |
| UsageRecord | Billing | Sim | metric, quantity, period | subscription | billing.usage.recorded |
| Overage | Billing | Sim | metric, amount, status | usage, invoice | billing.overage.generated |
| BillingEvent | Billing | Sim | type, payload, processedAt | subscription | billing.* |

### Padrões obrigatórios para todas as entidades multi-tenant
- Campo `tenantId` obrigatório (exceto catálogos globais definidos acima).
- Índices compostos por `tenantId` + chave de negócio (`email`, `externalId`, `slug`, etc.).
- FKs sempre incluem validação de pertença ao mesmo tenant na camada de aplicação.
- Soft delete com `deletedAt` para entidades operacionais e retenção orientada à LGPD.

---

## FASE 4 — Permissões

### Roles iniciais
`owner`, `admin`, `manager`, `operator`, `sales`, `marketing`, `support`, `finance`, `developer`, `viewer`, `agent-runtime`, `system`

### Matriz resumida de papéis
- **owner/admin**: administração total do tenant (exceto superpoderes globais).
- **manager/operator**: operação diária com limites de governança.
- **sales/marketing/support/finance**: verticais por domínio.
- **developer**: integrações, webhooks, API keys, leitura de logs técnicos.
- **viewer**: somente leitura.
- **agent-runtime**: papel técnico para execução automatizada com escopo mínimo.
- **system**: uso interno (jobs, migrações seguras, manutenção).

### Lista de permissões (catálogo base)

| Permissão | Descrição | Módulo | Plano mínimo | Roles permitidas |
|---|---|---|---|---|
| tenant:read | Ler dados do tenant | Core | Free | owner, admin, manager, viewer |
| tenant:update | Atualizar dados do tenant | Core | Starter | owner, admin |
| user:invite | Convidar usuário | Auth | Starter | owner, admin, manager |
| user:update | Editar usuário/membership | Auth | Starter | owner, admin |
| user:delete | Remover usuário | Auth | Pro | owner, admin |
| role:read | Listar papéis | RBAC | Free | owner, admin, manager, developer |
| role:update | Alterar papéis | RBAC | Business | owner, admin |
| permission:read | Listar catálogo de permissões | RBAC | Free | owner, admin, developer |
| crm.contact:read | Ler contatos | CRM | Free | owner, admin, manager, sales, support, viewer, agent-runtime |
| crm.contact:create | Criar contato | CRM | Starter | owner, admin, manager, sales, marketing, agent-runtime |
| crm.contact:update | Atualizar contato | CRM | Starter | owner, admin, manager, sales, support, agent-runtime |
| crm.contact:delete | Excluir contato | CRM | Pro | owner, admin, manager |
| crm.company:read | Ler empresas | CRM | Free | owner, admin, manager, sales, support, viewer |
| crm.company:create | Criar empresa | CRM | Starter | owner, admin, manager, sales |
| crm.company:update | Atualizar empresa | CRM | Starter | owner, admin, manager, sales |
| crm.company:delete | Excluir empresa | CRM | Pro | owner, admin |
| crm.lead:read | Ler leads | CRM | Free | owner, admin, manager, sales, marketing, viewer |
| crm.lead:create | Criar lead | CRM | Starter | owner, admin, manager, sales, marketing, agent-runtime |
| crm.lead:update | Atualizar lead | CRM | Starter | owner, admin, manager, sales, marketing |
| crm.deal:read | Ler deals | CRM | Free | owner, admin, manager, sales, viewer |
| crm.deal:create | Criar deal | CRM | Starter | owner, admin, manager, sales, agent-runtime |
| crm.deal:update | Atualizar deal | CRM | Starter | owner, admin, manager, sales |
| crm.deal:move | Mover estágio | CRM | Starter | owner, admin, manager, sales, agent-runtime |
| crm.deal:delete | Excluir deal | CRM | Pro | owner, admin, manager |
| crm.pipeline:manage | Gerenciar pipelines | CRM | Pro | owner, admin, manager |
| workflow:read | Ler workflows | Workflows | Starter | owner, admin, manager, operator, developer, viewer |
| workflow:create | Criar workflow draft | Workflows | Starter | owner, admin, manager, operator, developer |
| workflow:update | Editar draft | Workflows | Starter | owner, admin, manager, operator, developer |
| workflow:publish | Publicar versão | Workflows | Pro | owner, admin, manager |
| workflow:execute | Executar workflow | Workflows | Starter | owner, admin, manager, operator, agent-runtime, system |
| workflow:cancel_run | Cancelar execução | Workflows | Pro | owner, admin, manager, operator |
| connector:read | Ver conectores | Connectors | Starter | owner, admin, manager, operator, developer |
| connector:install | Instalar provider | Connectors | Pro | owner, admin, developer |
| connector:connect | Conectar conta externa | Connectors | Pro | owner, admin, developer |
| connector:disconnect | Desconectar conta | Connectors | Pro | owner, admin, developer |
| connector:manage_credentials | Gerir credenciais | Connectors | Business | owner, admin, developer |
| webhook:read | Ver endpoints/deliveries | Webhooks | Starter | owner, admin, developer, manager |
| webhook:manage | Criar/editar endpoint | Webhooks | Pro | owner, admin, developer |
| webhook:replay | Reprocessar entrega | Webhooks | Business | owner, admin, developer |
| agent:read | Ler agentes e runs | Agents | Pro | owner, admin, manager, operator, developer |
| agent:create | Criar agente | Agents | Pro | owner, admin, developer |
| agent:update_policy | Atualizar policy | Agents | Business | owner, admin, developer |
| agent:run | Executar agente | Agents | Pro | owner, admin, manager, operator, agent-runtime |
| agent:approve_action | Aprovar ação crítica | Agents | Business | owner, admin, manager |
| agent:handoff | Transferir atendimento | Agents | Pro | owner, admin, manager, support |
| billing:read | Ler assinatura/faturas | Billing | Starter | owner, admin, finance |
| billing:manage | Alterar plano e cobrança | Billing | Starter | owner, admin, finance |
| billing:checkout | Iniciar checkout | Billing | Starter | owner, admin, finance |
| billing:portal | Abrir portal cobrança | Billing | Starter | owner, admin, finance |
| billing:usage:read | Ler consumo | Billing | Starter | owner, admin, finance, manager |
| audit:read | Ler trilhas de auditoria | Security | Pro | owner, admin, developer, compliance |
| audit:export | Exportar auditoria | Security | Enterprise | owner, admin |
| analytics:read | Ler dashboards | Analytics | Starter | owner, admin, manager, marketing, sales, viewer |
| developer:key:create | Criar API key | Dev Portal | Business | owner, admin, developer |
| developer:key:revoke | Revogar API key | Dev Portal | Business | owner, admin, developer |
| admin:global | Administração global (somente staff) | Admin | Enterprise | system |

### Regras de autorização por módulo
- **Default deny**: se não houver permissão explícita, negar.
- **Tenant guard**: validar `tenantId` no token + recurso.
- **ABAC complementar**: checar ownership (`ownerId == actorId`) para editar recursos próprios quando configurado.

### Regras especiais para agentes
- Agente executa como `agent-runtime` + escopo efetivo herdado do solicitante.
- Ações externas (`send-whatsapp`, `connector-action`, `billing-check`) exigem `policy-check` e, em risco alto, `agent:approve_action`.

### Regras especiais para APIs públicas
- API key com escopos (`scope[]`) + quota por minuto/hora/dia.
- Rotação obrigatória de segredo e hash-only storage.
- Endpoints write exigem `Idempotency-Key` quando críticos.

### Regras especiais para webhooks
- HMAC SHA-256 por provider.
- Janela anti-replay (ex.: 5 min) + nonce/timestamp.
- `externalEventId` deduplicado por `tenantId+provider`.

### Regras especiais para billing
- Separação de permissões: `billing:read` != `billing:manage`.
- Bloqueios por inadimplência não removem acesso a export de dados essenciais (compliance).

---

## FASE 5 — Planos SaaS

| Plano | Preço | Usuários | Contatos | Workflows | Conectores | Agentes | Execuções/mês | Público |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Free | R$0 | 2 | 500 | 3 | 2 | 0 | 2.000 | Validação inicial |
| Starter | R$299/mês | 5 | 5.000 | 20 | 5 | 2 | 20.000 | PMEs iniciando operação |
| Pro | R$899/mês | 20 | 50.000 | 100 | 15 | 10 | 200.000 | Times em escala |
| Business | R$2.499/mês | 80 | 250.000 | 400 | 40 | 30 | 1.500.000 | Operações multi-time |
| Enterprise | Sob consulta | Ilimitado* | Ilimitado* | Ilimitado* | Ilimitado* | Ilimitado* | Sob contrato | Grandes contas |

`*` sujeito a fair use/SLA contratual.

## Feature Matrix SaaS

| Feature | Free | Starter | Pro | Business | Enterprise |
|---|---|---|---|---|---|
| CRM básico | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pipelines avançados | ❌ | ❌ | ✅ | ✅ | ✅ |
| Workflows com branch/condition | ❌ | ✅ | ✅ | ✅ | ✅ |
| Agentes IA | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approval humano | ❌ | ❌ | ✅ | ✅ | ✅ |
| Marketplace integrações | ❌ | ❌ | ❌ | ✅ | ✅ |
| API keys e escopos | ❌ | ❌ | ✅ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit export avançado | ❌ | ❌ | ❌ | ✅ | ✅ |
| Retenção de logs | 7d | 30d | 90d | 180d | 365d+ |

### Regras de governança de plano
- **Hard lock**: criação de novos recursos bloqueada ao atingir limite duro.
- **Soft lock**: aviso + degradação parcial antes do limite duro.
- **Grace period**: 7 dias após falha de pagamento.
- **Upgrade**: imediato (prorata).
- **Downgrade**: efetivo no próximo ciclo + checagem de excedentes.
- **Cancelamento**: acesso leitura por 30 dias + export.
- **Inadimplência**: bloqueio progressivo (write -> exec -> read sensível).
- **Feature flags**: por plano e por tenant para rollout seguro.

---

## FASE 6 — Eventos

### Envelope padrão
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "type": "crm.contact.created",
  "source": "crm",
  "occurredAt": "ISO_DATE",
  "idempotencyKey": "string",
  "actor": { "type": "user|agent|system|connector", "id": "string" },
  "data": {},
  "metadata": {}
}
```

| Evento | Fonte | Payload | Idempotente | Aciona Workflow | Aciona Agente | Retenção |
|---|---|---|---|---|---|---|
| tenant.created | core | tenantId, planCode | Sim | Sim | Não | 365d |
| user.invited | auth | userId, email, invitedBy | Sim | Não | Não | 180d |
| user.joined | auth | userId, tenantId | Sim | Sim | Não | 180d |
| role.updated | rbac | roleId, diff | Sim | Não | Não | 365d |
| crm.contact.created | crm | contactId, source | Sim | Sim | Sim | 365d |
| crm.contact.updated | crm | contactId, changes | Sim | Sim | Sim | 365d |
| crm.lead.created | crm | leadId, score | Sim | Sim | Sim | 365d |
| crm.deal.created | crm | dealId, value, stage | Sim | Sim | Sim | 365d |
| crm.deal.stage_changed | crm | dealId, from, to | Sim | Sim | Sim | 365d |
| crm.activity.created | crm | activityId, channel | Sim | Sim | Não | 180d |
| marketing.campaign.created | marketing | campaignId | Sim | Sim | Não | 180d |
| marketing.form.submitted | marketing | formId, submissionId | Sim | Sim | Sim | 180d |
| marketing.lead.captured | marketing | leadId, channel | Sim | Sim | Sim | 365d |
| workflow.created | workflows | workflowId | Sim | Não | Não | 180d |
| workflow.published | workflows | workflowId, version | Sim | Não | Não | 365d |
| workflow.triggered | workflows | workflowId, trigger | Sim | Não | Não | 90d |
| workflow.run.started | workflows | runId | Sim | Não | Não | 90d |
| workflow.run.completed | workflows | runId, durationMs | Sim | Não | Não | 90d |
| workflow.run.failed | workflows | runId, error | Sim | Não | Sim | 180d |
| connector.installed | connectors | providerKey | Sim | Sim | Não | 180d |
| connector.connected | connectors | accountId | Sim | Sim | Não | 180d |
| connector.disconnected | connectors | accountId | Sim | Sim | Não | 180d |
| connector.webhook.received | connectors | providerKey, externalEventId | Sim | Sim | Sim | 180d |
| connector.sync.completed | connectors | syncId, stats | Sim | Sim | Não | 90d |
| connector.sync.failed | connectors | syncId, error | Sim | Sim | Sim | 180d |
| agent.created | agents | agentId, type | Sim | Não | Não | 180d |
| agent.run.started | agents | runId, agentId | Sim | Não | Não | 90d |
| agent.tool.called | agents | runId, tool, outcome | Sim | Não | Não | 90d |
| agent.approval.requested | agents | runId, riskReason | Sim | Não | Não | 365d |
| agent.handoff.created | agents | handoffId, toAgent | Sim | Não | Não | 180d |
| agent.run.completed | agents | runId | Sim | Sim | Não | 90d |
| agent.run.failed | agents | runId, error | Sim | Sim | Não | 180d |
| billing.subscription.created | billing | subscriptionId, plan | Sim | Sim | Não | 365d |
| billing.payment.succeeded | billing | paymentId, amount | Sim | Sim | Não | 365d |
| billing.payment.failed | billing | paymentId, reason | Sim | Sim | Sim | 365d |
| billing.usage.exceeded | billing | metric, usage, limit | Sim | Sim | Sim | 365d |
| billing.account.locked | billing | lockReason, until | Sim | Sim | Não | 365d |

---

## FASE 7 — Contratos de API (v1)

### Padrão de resposta e erro
```json
{"success": true, "data": {}, "meta": {"requestId": "...", "pagination": {}}}
```
```json
{"success": false, "error": {"code": "...", "message": "...", "details": {}}, "meta": {"requestId": "..."}}
```

### Regras transversais
- Versionamento via `/v1`.
- `tenantId` derivado de token + validação por recurso.
- Paginação cursor (`limit`, `cursor`) para listas.
- Filtros por query params whitelisted.
- Write APIs com audit log obrigatório.
- Endpoints críticos exigem `Idempotency-Key`.

### Contratos por endpoint (resumo executivo)

#### Auth
- `POST /v1/auth/login`: autenticar; permissão pública; plano Free; body `{email,password}`; emite `auth.login.succeeded`; audit: não; idempotência: não.
- `POST /v1/auth/logout`: invalidar sessão; permissão autenticado; audit: sim.
- `GET /v1/auth/me`: perfil atual; permissão autenticado; audit: não.

#### Tenants
- `GET /v1/tenants/current`: requer `tenant:read`; plano Free; erros `TENANT_NOT_FOUND`.
- `PATCH /v1/tenants/current`: requer `tenant:update`; plano Starter; body parcial (`name`,`locale`); audit sim; evento `tenant.updated`; idempotência sim.

#### Users
- `GET /v1/users`: `user:invite` ou `role:read`; paginação.
- `POST /v1/users/invite`: `user:invite`; Starter; body `{email,roleId}`; evento `user.invited`; audit sim; idempotência sim.
- `PATCH /v1/users/{id}`: `user:update`; audit sim.
- `DELETE /v1/users/{id}`: `user:delete`; Pro; evento `user.removed`; audit sim; idempotência sim.

#### CRM
- `GET /v1/crm/contacts`: `crm.contact:read`; filtros (`q`,`ownerId`,`updatedAfter`).
- `POST /v1/crm/contacts`: `crm.contact:create`; Starter; evento `crm.contact.created`; audit sim; idempotência sim.
- `GET /v1/crm/contacts/{id}`: `crm.contact:read`.
- `PATCH /v1/crm/contacts/{id}`: `crm.contact:update`; evento `crm.contact.updated`; audit sim.
- `DELETE /v1/crm/contacts/{id}`: `crm.contact:delete`; Pro; evento `crm.contact.deleted`; audit sim.
- `GET /v1/crm/deals`: `crm.deal:read`.
- `POST /v1/crm/deals`: `crm.deal:create`; evento `crm.deal.created`; audit sim; idempotência sim.
- `PATCH /v1/crm/deals/{id}/stage`: `crm.deal:move`; evento `crm.deal.stage_changed`; audit sim; idempotência sim.

#### Workflows
- `GET /v1/workflows`: `workflow:read`.
- `POST /v1/workflows`: `workflow:create`; evento `workflow.created`; audit sim.
- `POST /v1/workflows/{id}/publish`: `workflow:publish`; Pro; evento `workflow.published`; audit sim; idempotência sim.
- `POST /v1/workflows/{id}/run`: `workflow:execute`; Starter; evento `workflow.run.started`; audit sim; idempotência sim.
- `GET /v1/workflow-runs`: `workflow:read`; filtros por status/período.

#### Connectors
- `GET /v1/connectors/providers`: `connector:read`.
- `POST /v1/connectors/{provider}/install`: `connector:install`; Pro; evento `connector.installed`; audit sim.
- `POST /v1/connectors/{provider}/connect`: `connector:connect`; Pro; evento `connector.connected`; audit sim; idempotência sim.
- `DELETE /v1/connectors/{provider}`: `connector:disconnect`; Pro; evento `connector.disconnected`; audit sim.
- `POST /v1/webhooks/{provider}`: autenticação assinatura; evento `connector.webhook.received`; audit técnico; idempotência sim (via `externalEventId`).

#### Agents
- `GET /v1/agents`: `agent:read`.
- `POST /v1/agents`: `agent:create`; Pro; evento `agent.created`; audit sim.
- `POST /v1/agents/{id}/run`: `agent:run`; Pro; `Idempotency-Key`; evento `agent.run.started`; audit sim.
- `POST /v1/agents/{id}/approve`: `agent:approve_action`; Business; evento `agent.approval.granted`; audit sim; idempotência sim.
- `GET /v1/agent-runs`: `agent:read`; filtros por status/risk.

#### Billing
- `GET /v1/billing/subscription`: `billing:read`.
- `POST /v1/billing/checkout`: `billing:checkout`; Starter; evento `billing.checkout.created`; audit sim; idempotência sim.
- `POST /v1/billing/portal`: `billing:portal`; Starter; audit sim.
- `GET /v1/billing/usage`: `billing:usage:read`; métricas por período.

---

## FASE 8 — Arquitetura de Agentes

| Agente | Objetivo | Tools | Precisa Aprovação | Plano mínimo | Eventos |
|---|---|---|---|---|---|
| AgentOrchestrator | Rotear tarefas entre agentes | policy-check, workflow-enqueue, handoff, audit-log | Em ações externas | Business | consome agent.run.* / emite agent.handoff.created |
| ProductArchitectureAgent | Projetar módulos/contratos | db-read, artifact-create, policy-check, audit-log | Não (somente leitura/artefato) | Pro | consome user.requested / emite artifact.created |
| CRMOperatorAgent | Atualizar CRM e tarefas | db-read, db-write, workflow-enqueue, audit-log | Sim para delete/move massivo | Pro | consome crm.*, workflow.* |
| MarketingAgent | Operar campanhas e segmentação | db-read, db-write, connector-action, send-email, audit-log | Sim para disparo em massa | Pro | consome marketing.* |
| WorkflowBuilderAgent | Criar/validar DSL workflow | artifact-create, workflow-enqueue, policy-check, audit-log | Sim para publish | Pro | consome workflow.* |
| ConnectorSetupAgent | Configurar integrações | connector-action, http, policy-check, audit-log | Sim para credenciais sensíveis | Pro | consome connector.* |
| BillingRiskAgent | Monitorar risco de inadimplência | billing-check, db-read, workflow-enqueue, audit-log | Sim para bloqueio de conta | Business | consome billing.* |
| SupportAgent | Atendimento e triagem | db-read, memory-read/write, handoff, send-email, audit-log | Sim para alteração de billing | Pro | consome support.ticket.* |
| DataAnalystAgent | Insights e relatórios | db-read, artifact-create, memory-read, audit-log | Não | Business | consome analytics.* |
| ComplianceAuditAgent | Verificar compliance e LGPD | db-read, policy-check, artifact-create, audit-log | Não | Business | consome audit.*, billing.*, agent.* |
| DeveloperAgent | Apoiar setup API/webhooks | http, connector-action, artifact-create, audit-log | Sim para rotação de credencial | Business | consome developer.* |
| HumanHandoffAgent | Transferência para humano | handoff, approval-request, audit-log | Sempre em handoff crítico | Pro | consome agent.handoff.* |

### Fluxo de execução
`User Request → Agent Gateway → Policy Engine → Tool Registry → Execution Planner → Approval Gate → Queue/Worker → Audit Log → Result`

### Regras mandatórias
- Sem bypass de RBAC/tenant.
- Separação de ferramentas por risco (read/write/external).
- Memória com TTL e escopo por tenant e agente.
- Retries com idempotência (`agentRunId + toolCallId`).

---

## FASE 9 — Arquitetura de Workflows

### 1) Modelo de Workflow
- `id, tenantId, name, status(draft|published|archived), publishedVersionId`

### 2) Modelo de WorkflowVersion
- `id, workflowId, version, dslJson, checksum, createdBy, createdAt`

### 3) Modelo de WorkflowRun
- `id, tenantId, workflowId, workflowVersionId, triggerType, status, startedAt, endedAt, correlationId`

### 4) Modelo de WorkflowStepRun
- `id, runId, stepId, stepType, status, attempts, startedAt, endedAt, errorCode`

### 5) Modelo de Trigger
- Tipos: `event|webhook|schedule|manual|form_submission|connector_event|agent_event|billing_event`
- Config por JSON schema versionado.

### 6) Modelo de Action
- Tipos: `create_contact, update_contact, create_deal, move_deal_stage, send_email, send_whatsapp, call_connector, run_agent, wait, condition, branch, http_request, create_task, notify_user, emit_event`.

### 7) Eventos de workflow
- `workflow.created`, `workflow.published`, `workflow.triggered`, `workflow.run.started`, `workflow.run.completed`, `workflow.run.failed`, `workflow.step.failed`.

### 8) Regras de retry
- Exponencial com jitter (até 5 tentativas default).
- Classificação erro transient/permanent.
- DLQ após esgotar tentativas.

### 9) Regras de idempotência
- Chave por passo crítico: `tenantId + workflowVersionId + stepId + businessKey`.
- Persistência em `IdempotencyKey` com TTL.

### 10) Limites por plano
- Free: 3 workflows ativos; Starter: 20; Pro: 100; Business: 400; Enterprise: custom.

DSL inicial suportada (referência):
```json
{
  "name": "Novo lead capturado",
  "trigger": { "type": "event", "eventType": "marketing.lead.captured" },
  "steps": [
    { "id": "create-contact", "type": "create_contact", "input": {} },
    { "id": "notify-sales", "type": "send_email", "input": {} }
  ]
}
```

---

## FASE 10 — Arquitetura de Conectores

| Provider | Categoria | Auth | Webhooks | Actions | Eventos | Plano mínimo |
|---|---|---|---|---|---|---|
| gmail | Comunicação | OAuth2 | push/mail watch | send_email, list_threads | connector.webhook.received, connector.sync.completed | Starter |
| google-calendar | Comunicação | OAuth2 | event changed | create_event, list_events | connector.sync.* | Starter |
| whatsapp-business | Comunicação | Token + App Secret | inbound message, status | send_whatsapp, template_send | connector.webhook.received | Pro |
| zenvia | Comunicação | API key | message status | send_whatsapp, send_sms | connector.sync.* | Pro |
| take-blip | Comunicação | OAuth/token | bot events | send_message | connector.webhook.received | Business |
| slack | Comunicação interna | OAuth2 | event subscriptions | send_message, create_channel | connector.webhook.received | Starter |
| teams | Comunicação interna | OAuth2 | graph subscriptions | send_message | connector.sync.* | Business |
| hubspot | CRM | OAuth2 | contact/deal events | upsert_contact, upsert_deal | connector.sync.* | Pro |
| pipedrive | CRM | OAuth2/API token | deal/person updates | upsert_person, upsert_deal | connector.sync.* | Pro |
| salesforce | CRM | OAuth2 | platform events | query, upsert | connector.sync.* | Enterprise |
| rd-station-mkt | Marketing | OAuth2 | lead conversion | push_lead, read_lead | connector.webhook.received | Pro |
| stripe | Pagamentos | API key + webhook secret | payment/subscription | create_checkout, read_invoice | billing.payment.* | Starter |
| asaas | Pagamentos | API key | payment events | create_charge | billing.payment.* | Business |
| omie | ERP | app_key/app_secret | polling + callbacks | create_customer, create_invoice | connector.sync.* | Business |
| conta-azul | ERP | OAuth2 | webhook invoices | sync_customer | connector.sync.* | Business |
| n8n | Automação | webhook/token | generic webhook | trigger_flow | connector.webhook.received | Starter |

### Regras de segurança de conectores
- Credencial por tenant, criptografada e referenciada por `secretRef`.
- Nunca expor segredo em logs/API.
- Health check periódico por conector.
- Rate limit e circuit breaker por provider.
- Deduplicação via `externalEventId` + `providerKey` + `tenantId`.

---

## FASE 11 — MVP Recomendado

### O que entra no MVP
- Core Platform, Auth, Multi-tenancy, RBAC, AuditLog.
- CRM básico: Contact, Company, Lead, Deal, Pipeline, PipelineStage.
- Workflows simples (event/manual/webhook) com 10 ações essenciais.
- Conectores: Gmail, Google Calendar, WhatsApp Business API, Stripe, HubSpot, Slack, n8n.
- Billing básico: Plan, Subscription, Invoice, Payment, UsageRecord.
- APIs v1 listadas na Fase 7.

### O que fica fora
- Marketplace público completo.
- SSO/SCIM enterprise.
- BI avançado embutido.
- Conectores ERP complexos (Totvs/Sankhya) na fase inicial.

### Agentes iniciais
1. ProductArchitectureAgent
2. WorkflowBuilderAgent
3. ConnectorSetupAgent
4. CRMOperatorAgent
5. ComplianceAuditAgent

### Workflows iniciais
- Captura de lead -> criação contato -> notificação vendas.
- Mudança de estágio para “ganho” -> tarefa de onboarding.
- Falha de pagamento -> alerta financeiro + follow-up.

### Entidades mínimas
`Tenant, User, Membership, Role, Permission, Plan, Subscription, FeatureFlag, UsageLimit, AuditLog, Contact, Company, Lead, Deal, Pipeline, PipelineStage, Workflow, WorkflowVersion, WorkflowRun, WorkflowStepRun, ConnectorProvider, ConnectorAccount, ConnectorCredential, WebhookEndpoint, WebhookDelivery, Agent, AgentRun, AgentPolicy, Invoice, Payment, UsageRecord`.

### Riscos do MVP
- Escopo de conectores pode atrasar go-live.
- Complexidade de idempotência em workflows externos.
- Custos variáveis de mensageria/LLM.

### Critérios de pronto
- Isolamento por tenant validado automatizadamente.
- 95%+ das ações críticas com audit log.
- 99% de deduplicação de webhook em testes de carga.
- Fluxo billing bloqueio/grace validado ponta a ponta.

---

## FASE 12 — Roadmap de Implementação

| Fase | Objetivo | Entregáveis | Dependências | Critério de pronto |
|---|---|---|---|---|
| Fase 0: Fundação | Padronizar base | monorepo apps/packages, observabilidade, segurança base | nenhum | CI verde + tenancy middleware ativo |
| Fase 1: Produto Core | Core SaaS | tenant/user/membership/rbac/audit | Fase 0 | autenticação + autorização fim a fim |
| Fase 2: CRM | Operação comercial | contatos/empresas/leads/deals/pipelines APIs | Fase 1 | fluxo CRM completo com eventos |
| Fase 3: Workflows | Automação | engine workflow v1 + runs + retries + idempotência | Fase 2 | workflows críticos com DLQ |
| Fase 4: Conectores | Integrações iniciais | Gmail/Calendar/Stripe/Slack/HubSpot/WABA/n8n | Fase 3 | webhooks assinados e deduplicados |
| Fase 5: Agentes | IA governada | gateway, policy engine, tool registry, approvals | Fase 3-4 | agentes sem violação RBAC |
| Fase 6: Billing | Monetização | planos, assinatura, uso, overage, bloqueio | Fase 1,4 | cobrança e bloqueio automáticos |
| Fase 7: Marketplace | Escala ecossistema | catálogo de integrações e templates | Fase 4-6 | instalação self-service segura |
| Fase 8: Enterprise | Compliance avançado | SSO/SAML, export auditoria, KMS/BYOK | Fase 1-7 | readiness enterprise validado |

---

## FASE 13 — Riscos

| Risco | Categoria | Impacto | Probabilidade | Severidade | Mitigação | Fase |
|---|---|---|---|---|---|---|
| Vazamento entre tenants por query sem escopo | Multi-tenancy | Muito alto | Média | Crítica | lint rule + testes isolamento + policy middleware | 0-2 |
| Webhooks sem deduplicação | Conectores | Alto | Alta | Alta | externalEventId + idempotency store | 3-4 |
| Agente executando ação crítica sem approval | Agentes | Alto | Média | Alta | policy-check obrigatório + approval gate | 5 |
| Escalada de privilégios RBAC | Segurança | Alto | Média | Alta | default deny + revisão de role bindings | 1 |
| Falha de billing causando lock indevido | Billing | Alto | Média | Alta | grace period + reconciliador + rollback | 6 |
| Custos de LLM/mensageria fora de controle | Infra/custos | Alto | Média | Alta | quotas por plano + orçamento + alertas | 5-6 |
| Lock-in com provider externo | Estratégico | Médio | Média | Média | interface adapter + contratos internos | 4-7 |
| Retenção excessiva de PII (LGPD) | LGPD | Alto | Média | Alta | políticas de retenção/anonimização | 0-2 |
| Falhas em retries duplicando efeitos financeiros | Workflows/Billing | Alto | Baixa | Alta | idempotência por operação financeira | 3-6 |
| Gargalo no banco em execuções massivas | Escalabilidade | Alto | Média | Alta | filas, particionamento e índices compostos | 3-6 |

---

## FASE 14 — Próximos Passos Técnicos

| Ordem | Ação técnica | Caminho | Dependência | Critério de pronto |
|---|---|---|---|---|
| 1 | Criar RFC de produto e módulos | `docs/product/saas-product-rfc.md` | nenhuma | RFC aprovada |
| 2 | Definir contratos de domínio | `packages/contracts/src/domain/*.ts` | 1 | tipos versionados publicados |
| 3 | Implementar schema Prisma core multi-tenant | `packages/database/prisma/schema.prisma` | 2 | migração aplicada e validada |
| 4 | Criar pacote de autorização | `packages/security/src/rbac/*` | 2-3 | testes RBAC passando |
| 5 | Implementar API v1 core/auth/users | `apps/api/src/v1/{auth,users,tenants}` | 3-4 | endpoints com audit log |
| 6 | Implementar CRM APIs e eventos | `apps/api/src/v1/crm/*` | 5 | CRUD + eventos + paginação |
| 7 | Motor de workflow v1 | `packages/workflows-core/*` + `apps/worker/*` | 6 | runs/stepRuns com retry/idempotência |
| 8 | Infra de conectores base | `packages/connectors-core/*` + `apps/webhook-receiver/*` | 7 | webhooks assinados + health check |
| 9 | Runtime de agentes | `packages/agents-core/*` | 7-8 | policy engine + approval gate |
| 10 | Billing e limites SaaS | `apps/api/src/v1/billing/*` + `packages/config/plans.ts` | 5,8 | upgrade/downgrade/lock funcionando |
| 11 | Testes E2E multi-tenant e segurança | `apps/api/test/e2e/*` | 5-10 | suíte crítica green |
| 12 | Preparar go-live MVP | `docs/runbooks/*` + CI/CD | 11 | checklist de produção aprovado |

### Comandos sugeridos
- `pnpm -w lint`
- `pnpm -w test`
- `pnpm -w build`
- `pnpm --filter @birthhub/database prisma migrate dev`
- `pnpm --filter @birthhub/api test:e2e`

### Gates de qualidade
- Cobertura mínima 80% em módulos críticos.
- Zero falhas de isolamento multi-tenant em testes de contrato.
- Zero endpoint write sem audit log.

---

## FASE 15 — Conclusão

### Síntese da arquitetura
A proposta posiciona o BirthHub 360 como **plataforma operacional SaaS** com núcleo CRM, automação orientada a eventos, conectores e agentes IA governados por políticas, sob modelo multi-tenant estrito.

### Decisões principais
1. Multi-tenancy + RBAC + Audit como fundação obrigatória.
2. Workflows e conectores como motor de extensibilidade.
3. Agentes IA somente com policy engine, approval e trilha completa.
4. Monetização híbrida por plano + uso.

### O que implementar primeiro
1. Fundação (tenant/auth/rbac/audit).
2. CRM básico.
3. Workflow engine v1 com idempotência.
4. Conectores MVP e billing.

### O que depende de validação
- Elasticidade de custos de agentes e canais de comunicação.
- Modelo comercial final de overage por métrica.
- Prioridade de conectores ERP por segmento.

### O que bloquear até fase futura
- Marketplace público completo.
- SSO/SCIM, BYOK e recursos enterprise avançados.
- Conectores de alta complexidade regulatória sem camada de compliance madura.

### Recomendação final
Executar o roadmap por fases com marcos trimestrais, mantendo arquitetura orientada a contratos e observabilidade forte desde o início para evitar dívida estrutural.

### Próxima fase sugerida
**Iniciar imediatamente a Fase 0 (Fundação)** com entrega conjunta de schema multi-tenant, pacote de autorização e padrões de audit/eventos.
