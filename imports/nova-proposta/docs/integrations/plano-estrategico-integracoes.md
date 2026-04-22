# Plano Estratégico de Integrações - Birthub 360

## Visão Geral da Estratégia

O Birthub 360 atuará como o **orquestrador central** (hub) da operação, sincronizando dados e eventos através do ecossistema de ferramentas B2B/B2C. Para evitar a reconstrução de sistemas inteiros e manter o foco na escalabilidade e robustez, a arquitetura de integração seguirá uma abordagem orientada a eventos (Event-Driven Architecture) mesclada com o padrão de Adapters já existente (`packages/integrations/src/adapters/`).

A integração não substituirá as ferramentas originais, mas sim consumirá dados vitais, executará processos automatizados baseados em regras e atualizará os sistemas periféricos.

## Estratégia de Conexão e Tecnologia Recomendada

### A. Integração nativa via API
**Onde usar:** Ferramentas "Core" (CRM, ERP, Pagamentos principais), onde o Birthub 360 precisa enviar comandos ou fazer consultas pesadas (ex: criar faturas, emitir notas, buscar histórico).
**Por quê:** Permite controle total sobre transações, garante consistência em operações de dupla via e permite lidar com atualizações em lote ou sincronicidade estrita necessária no fechamento financeiro e de contratos.

### B. Webhooks
**Onde usar:** Eventos em tempo real (ex: cliente pagou, lead novo entrou, assinatura confirmada, mensagens recebidas).
**Por quê:** Reduz o overhead de *polling*, economizando recursos. O Birthub 360 recebe o dado no momento exato em que a ação ocorre na ponta (assincronicamente) e processa na fila interna.

### C. Middleware / iPaaS (Make, Zapier, n8n)
**Onde usar:** Ferramentas de Prioridade 3 ou validação de MVP de fluxos customizados antes do desenvolvimento nativo.
**Por quê:** Permite a rápida conectividade com long-tail apps. O Birthub 360 disponibiliza Webhooks de entrada e uma API REST documentada, delegando para ferramentas como o n8n ou Zapier a orquestração de conexões menores ou de nicho, reduzindo esforço de engenharia.

---

## Tabela de Integrações: Prioridade e Abordagem

| Categoria | Ferramentas | Abordagem (API / Webhook / iPaaS) | Prioridade | O que o Birthub 360 lê | O que o Birthub 360 escreve / faz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Atração e Captação** | Meta Ads, Google Ads | iPaaS / Middleware | 2 | Custo de campanhas, métricas de conversão | Pausar campanhas (via iPaaS), escalar orçamentos. |
| | RD Station Mkt, ActiveCampaign | API + Webhook | 1 | Leads gerados, eventos de conversão, pontuação | Atualizar leads, mudar estágio, adicionar em automações. |
| | Google Workspace (Agenda/Meet) | API (OAuth) | 2 | Agendamentos de reuniões | Criar/atualizar eventos e reuniões de vendas. |
| | LinkedIn Ads | iPaaS | 3 | Leads de formulários | N/A |
| **Comunicação e Omnichannel** | WhatsApp API, Take Blip, Zenvia | API + Webhook | 1 | Mensagens recebidas, status de leitura | Enviar mensagens transacionais, alertas, bots de triagem. |
| | Slack, Discord, MS Teams | API / Webhook | 2 | Mensagens/comandos no canal | Enviar alertas internos (novo lead, churn risk). |
| | Zendesk | API + Webhook | 2 | Tickets abertos, status | Abrir ticket de suporte, consultar SLA. |
| **CRM e Vendas** | HubSpot, Pipedrive, RD CRM, Salesforce | API + Webhook | 1 | Status do funil, oportunidades ganhas/perdidas | Criar/atualizar lead, mover etapa, criar tarefas, atualizar score. |
| | Agendor, Exact Sales | API + Webhook | 2 | Status do funil | Criar/atualizar negócio. |
| **Fechamento e Contratos** | Clicksign, ZapSign, DocuSign, Autentique | API + Webhook | 1 | Status do contrato (visualizado, assinado) | Gerar contrato via template, enviar para assinatura. |
| **Pagamentos e Cobranças** | Asaas, Vindi, Iugu, Stripe, Mercado Pago | API + Webhook | 1 | Pagamentos (aprovados, rejeitados, inadimplência) | Criar cliente, gerar cobrança (Pix/Boleto/Cartão), estorno. |
| **ERP e Gestão Financeira** | Conta Azul, Omie, Bling | API | 1 | Status de nota fiscal, conciliação | Emitir NF, cadastrar cliente, sincronizar faturamento. |
| | Totvs, Sankhya, Tiny | API | 2 | Situação do cliente | Atualizar limites de crédito. |
| **Inteligência de Dados** | Econodata, Neoway, Apollo.io | API | 2 | Dados enriquecidos (CNPJ, decisores) | Solicitar enriquecimento de lead recém-chegado. |
| **Customer Success** | SenseData, Intercom | API + Webhook | 2 | Uso do cliente, NPS, health score, risco churn | Atualizar health score base, enviar ações de ativação. |
| **Analytics e Dados** | Power BI, Metabase | Conexão BD / API | 1 | N/A (Consumo interno) | Enviar base agregada para dashboards (ETL). |
| | Google Analytics 4 | API | 3 | Sessões, eventos web | Enviar conversões offline (server-side tracking). |

---

## Fluxos Práticos Recomendados

### Fluxo 1: Venda End-to-End (Do Lead ao Onboarding)
**Gatilho:** Lead entra por campanha via RD Station Marketing (Webhook).
1. **Birthub 360** captura o lead e chama API da Econodata/Neoway para enriquecimento de CNPJ.
2. **Birthub 360** via API cria o negócio e contato no **Pipedrive / HubSpot**.
3. Vendedor move oportunidade para "Contrato". (Webhook do CRM avisa Birthub).
4. **Birthub 360** aciona a API da **Clicksign** gerando e enviando o contrato.
5. Cliente assina. Clicksign envia Webhook.
6. **Birthub 360** chama API do **Asaas/Vindi** e emite a cobrança via Pix.
7. Pagamento é aprovado (Webhook).
8. **Birthub 360** aciona **Conta Azul / Omie** para emissão da NF e notifica a equipe de Onboarding via **Slack/WhatsApp**.
9. Cliente é marcado como Ativo no sistema e no CRM.

### Fluxo 2: Gestão de Inadimplência e Risco
**Gatilho:** Fatura venceu sem pagamento no Asaas/Iugu (Webhook de Inadimplência).
1. **Birthub 360** detecta falha e inicia a "Esteira de Retenção".
2. **Birthub 360** envia aviso de atraso com link atualizado de pagamento via **WhatsApp** (Take Blip/Zenvia).
3. Após X dias, **Birthub 360** cria tarefa no **SenseData/HubSpot** marcando o *Health Score* como risco crítico.
4. **Birthub 360** envia alerta para a equipe financeira/CS no canal específico do **Slack**.
5. Se não resolvido, **Birthub 360** executa o *downgrade* ou bloqueio no próprio sistema core e atualiza o status nas plataformas.

### Fluxo 3: MQL (Marketing Qualified Lead) Automatizado
**Gatilho:** Lead atinge pontuação alta (score) no RD Station Marketing / ActiveCampaign.
1. **Birthub 360** recebe o webhook de atualização de score.
2. O motor interno de regras do **Birthub 360** atualiza o score agregado do lead.
3. Se alta intenção comercial, **Birthub 360** cria automaticamente uma tarefa prioritária no CRM (**Pipedrive/RD CRM**).
4. **Birthub 360** envia notificação no **WhatsApp** do vendedor daquela carteira: "Novo Lead Quente: [Nome/Empresa] - Ligue agora!".

---

## Estrutura Técnica Recomendada

Para suportar essas integrações sem reconstruir o Birthub 360, a arquitetura deve utilizar o padrão de **Adapters** e **Mensageria**:

- **Padrão de Conectores (Adapters):** Utilizar a pasta `packages/integrations/src/adapters/` para definir interfaces genéricas (ex: `IPaymentProvider`, `ICrmProvider`, `ISignatureProvider`). Os conectores específicos (`hubspot.ts`, `asaas.ts`, `clicksign.ts`) implementam essas interfaces.
- **Filas de Eventos (Worker/BullMQ):** Recebimento de Webhooks em endpoints rápidos (API) que imediatamente enfileiram os payloads no Redis (`apps/worker`). O Worker processa as ações de forma assíncrona.
- **Tratamento de Falhas e Retries:** Configurar retries exponenciais nas filas do BullMQ. Erros de Rate Limit (ex: `429 Too Many Requests`) devem voltar para a fila.
- **Webhooks Recebedores Seguros:** Endpoints `/webhooks/:provider` com validação de assinatura (HMAC) e chaves estáticas.
- **Segurança de Tokens e Multi-Tenant:** Credenciais sensíveis (`access_tokens`, `api_keys`) de terceiros devem ser criptografadas no banco (`packages/database`) usando Vault ou AES-256-GCM atrelados ao `tenant_id`. Cada integração opera no contexto do respectivo Tenant.
- **Logs e Auditoria:** Tabela central de auditoria (`integration_logs` ou `sync_events`) registrando o `tenant_id`, `provider`, `event_type`, payload, timestamp e `status` (Success/Failed) para facilitar o *troubleshooting*.

## Recomendação Final de Implementação por Fases

**Fase 1: Fundação & Core Money (Semanas 1-4)**
- **Foco:** Pagamentos, Contratos e CRM base.
- **Ferramentas:** Asaas/Vindi (Pix, Boleto, Cartão), Clicksign/ZapSign, HubSpot/Pipedrive/RD CRM.
- **Objetivo:** Automatizar a geração de caixa e segurança jurídica.

**Fase 2: Automação de Operações & Atendimento (Semanas 5-8)**
- **Foco:** Comunicação e Gestão Fiscal.
- **Ferramentas:** WhatsApp API (Zenvia/Take Blip), Slack/Teams (Alertas), Conta Azul/Omie (Emissão de NF-e/NFS-e).
- **Objetivo:** Reduzir trabalho manual financeiro e agilizar a resposta ao cliente.

**Fase 3: Inteligência, Retenção & Long-Tail (Semanas 9-12)**
- **Foco:** Enriquecimento, CS e Integrações flexíveis.
- **Ferramentas:** Econodata/Neoway, SenseData, RD Station Mkt, e liberação de Webhooks/API própria do Birthub para uso no Make/n8n/Zapier.
- **Objetivo:** Escalar operações de marketing, prospecção e permitir que os clientes conectem as ferramentas de nicho por conta própria via iPaaS.