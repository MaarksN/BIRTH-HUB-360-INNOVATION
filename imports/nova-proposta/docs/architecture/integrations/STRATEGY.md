# Plano de Integração e Arquitetura - Birthub 360

Este documento detalha o plano técnico de arquitetura e estratégia de integração para o **Birthub 360**, desenhado com foco no mercado brasileiro (Pix, Boletos, NF-e, ecossistema RD Station, Asaas, Clicksign, etc.) e nas melhores práticas de SaaS B2B/B2C, respeitando a estrutura do sistema atual.

## 1. Visão Geral da Estratégia

Para que o Birthub 360 atue como o "cérebro" das operações sem perder performance e sem precisar ser reescrito, a estratégia será baseada em uma **Arquitetura Orientada a Eventos (EDA - Event-Driven Architecture)** aliada ao **Padrão Adapter (Conectores)**.

O Birthub 360 operará de forma passiva-ativa:
*   **Passiva (Ingestão rápida):** Escutando eventos em tempo real via **Webhooks** (ex: "Pix recebido", "Contrato assinado", "Lead criado").
*   **Ativa (Comandos):** Usando **APIs REST/GraphQL** para disparar ações nos sistemas terceiros (ex: "Criar Lead no RD", "Emitir NF-e no Conta Azul").
*   **Delegação (Segurança):** Usando **OAuth 2.0** sempre que o usuário precisar dar permissão para o Birthub ler seus dados de ferramentas que exigem consentimento explícito (ex: Google Workspace).

---

## 2 e 3. Mapeamento de Integrações: O que Ler e O que Fazer

| Categoria | O que o Birthub 360 deve LER (Ingestão/Webhooks) | O que o Birthub 360 deve FAZER (Ação/API) |
| :--- | :--- | :--- |
| **Atração (Ads, MKT)** | Novos leads, conversões, custo por aquisição, abertura de e-mails, score de lead, preenchimento de forms. | Criar lead, atualizar score, mudar estágio de funil, pausar campanhas, enviar conversão offline. |
| **Comunicação** | Mensagens recebidas (WhatsApp/Zendesk), status de entrega, tickets abertos. | Enviar HSM (templates WhatsApp), enviar SMS, mandar notificação interna (Slack/Teams), responder ticket. |
| **CRM e Vendas** | Mudança de etapa de funil, novos negócios (deals), negócios ganhos/perdidos. | Criar negócio, atribuir vendedor, atualizar valor, adicionar nota, agendar tarefa comercial. |
| **Fechamento** | Status do documento (visualizado, assinado, rejeitado). | Gerar documento via template, enviar para assinatura, cancelar envio. |
| **Pagamentos** | Confirmação de Pix/Cartão, inadimplência (falha na cobrança), chargeback. | Criar cliente, gerar cobrança (Boleto/Pix/Link), criar assinatura (recorrência), estornar. |
| **ERP e Finanças** | Emissão de NF-e concluída, recusa de nota, atualização de estoque. | Sincronizar cliente, enviar pedido de venda, comandar emissão de NF-e/NFS-e. |
| **Inteligência** | Dados enriquecidos da empresa (CNAE, faturamento presumido, quadro societário). | Enviar CNPJ/Email para enriquecimento pré-venda. |
| **Customer Success** | Risco de churn (health score), queda no uso do sistema, tickets críticos. | Atualizar status do cliente, criar alerta de retenção, disparar playbooks de CS. |

---

## 4. Prioridade e Tecnologia Recomendada por Ferramenta

A priorização é baseada no que gera receita e no mercado brasileiro.

### Prioridade 1 (Core - Nativas e Críticas)
Essenciais para a proposta de valor do Birthub 360.
*   **RD Station Marketing & CRM:** API + Webhook + OAuth. (Padrão ouro de MKT/Vendas no BR).
*   **Pipedrive:** API + Webhook + OAuth.
*   **WhatsApp Business API:** API + Webhook. (Obrigatório para o Brasil).
*   **Asaas / Vindi:** API + Webhook (Foco em Pix, Boleto e Recorrência).
*   **Clicksign:** API + Webhook (Contratos com validade jurídica BR).
*   **Conta Azul:** API (Emissão de nota fiscal e conciliação).
*   **Slack / Google Workspace:** OAuth / API (Notificações internas e agenda).

### Prioridade 2 (Importantes - Fast Follow)
Trazem grande valor competitivo.
*   **HubSpot / Salesforce:** API + OAuth (Foco em clientes Enterprise).
*   **Zendesk / Zenvia:** API + Webhook (Atendimento Omnichannel).
*   **Mercado Pago / Stripe / Iugu:** API + Webhook.
*   **Omie / Bling:** API (ERPs essenciais).
*   **ZapSign:** API + Webhook.
*   **Econodata / SenseData:** API (Enriquecimento B2B e Retenção).
*   **Meta Ads / Google Ads:** API (Retorno de conversões offline).

### Prioridade 3 (Complementares)
Serão feitas via Middleware (Make/Zapier) no início.
*   ActiveCampaign, Discord, MS Teams, Exact Sales, Agendor, Autentique, DocuSign, Sankhya, Totvs, Apollo.io, Neoway.

---

## 5. Melhor Forma de Integração (Abordagens)

*   **A. Integração nativa via API (Action):** Usada para comandar sistemas vitais (Prioridade 1 e 2). Ex: Fazer o Asaas gerar um Pix.
*   **B. Webhooks (Reaction):** Usada para eventos em tempo real em que não podemos fazer *polling*. Ex: O cliente pagou o Pix, o Asaas avisa o Birthub para liberar o acesso instantaneamente.
*   **C. Middleware / iPaaS (Make/n8n/Zapier):** Usado para a "cauda longa" (Prioridade 3) ou ERPs engessados. O Birthub expõe eventos genéricos e a conexão final é feita no Make.

---

## 6. Estrutura Técnica Recomendada (Arquitetura)

Para suportar isso sem reconstruir o Birthub 360, propomos acoplar os seguintes módulos à arquitetura atual:

1.  **Camada de Ingressão (Webhook API Gateway):** Endpoints leves (`/api/webhooks/{provider}`) cujo único papel é receber o JSON, validar assinaturas (HMAC/Segurança) e jogar na fila. Responde `200 OK` rápido para não dar timeout nos parceiros.
2.  **Fila de Eventos (Message Broker/Queue):** Usar algo como Amazon SQS, RabbitMQ ou o próprio Redis (BullMQ/Kue). Garante que picos de vendas não derrubem o Birthub.
3.  **Padrão de Conectores (Adapter Pattern):** Criar interfaces como `IPaymentProvider`. O fluxo principal chama `paymentProvider.generateCharge()`. Os adapters traduzem para Asaas, Vindi, etc. Trocar de gateway não quebra o sistema.
4.  **Tratamento de Falhas e Retry (DLQ):** Se a API da Receita/Conta Azul cair, o evento vai para uma *Dead Letter Queue* e o sistema tenta novamente (Exponential Backoff: em 1m, 5m, 15m).
5.  **Multi-tenant e Segurança de Tokens:** Tabelas de credenciais devem ter `tenant_id`. Tokens OAuth e Chaves de API de clientes devem ser salvos com criptografia (AES-256) ou em um Secrets Manager, **nunca** em plain-text.
6.  **Auditoria (Logs):** Uma tabela de `integration_logs` (ou uso do ElasticSearch/Datadog) guardando request/response de toda comunicação externa. Essencial para debugar por que uma NFe não foi gerada.

---

## 7. Mapeamento de Fluxos Práticos

**Fluxo 1: Máquina de Vendas Completa**
1.  **RD Marketing (Webhook):** Lead converte em Landing Page.
2.  **Birthub 360:** Cria oportunidade no **Pipedrive/RD CRM (API)**.
3.  **Vendedor:** Arrasta o card para "Proposta Aceita" no CRM.
4.  **Birthub 360:** Detecta a mudança **(Webhook do CRM)** e comanda a **Clicksign (API)** para gerar o contrato.
5.  **Clicksign (Webhook):** Avisa o Birthub que o cliente assinou.
6.  **Birthub 360:** Comanda o **Asaas (API)** para gerar o link do Pix e envia para o cliente via **WhatsApp API**.
7.  **Asaas (Webhook):** Avisa que o Pix foi pago.
8.  **Birthub 360:** Comanda o **Conta Azul (API)** para emitir a NFe e ativa o serviço do cliente na plataforma.

**Fluxo 2: Gestão de Inadimplência e Risco**
1.  **Vindi / Asaas (Webhook):** Dispara evento de "Falha no Cartão / Boleto Vencido".
2.  **Birthub 360:** Recebe o evento e dispara um **WhatsApp (API)** automático com o Pix atualizado.
3.  **Birthub 360:** Cria uma tarefa de prioridade alta no **CRM** ou notifica o canal de Retenção no **Slack (API)**.
4.  **Birthub 360:** Se passar de X dias sem pagamento, reduz automaticamente os privilégios da conta no sistema core e atualiza o Health Score no **SenseData (API)**.

**Fluxo 3: MQL Dinâmico B2B**
1.  **RD Marketing (Webhook):** Lead começa a visitar a página de preços.
2.  **Birthub 360:** Puxa o CNPJ do Lead e bate no **Econodata (API)**.
3.  **Birthub 360:** Descobre que é uma empresa com faturamento milionário. Atualiza o Score no CRM para "High Touch" e avisa o gerente de contas via **WhatsApp (API)** ou **Teams**: *"🔥 Lead Quente: [Empresa] online agora."*

---

## 8. Recomendação Final de Implementação por Fases

**Fase 1 (MVP - "Fechamento e Caixa"):**
*   **Foco:** Automatizar o que traz dinheiro direto.
*   **Ferramentas:** RD Station, Pipedrive, Asaas, Clicksign, Slack.
*   **Por quê?** Reduz atrito comercial, assina contratos e cobra com zero toque manual.

**Fase 2 ("Operação e Tração"):**
*   **Foco:** Legalidade e Comunicação Omnichannel.
*   **Ferramentas:** Conta Azul (NF-e automáticas), WhatsApp Business API (WABA), ZapSign.
*   **Por quê?** Elimina o trabalho manual do time financeiro e garante uma comunicação nativa e direta com o cliente via WhatsApp.

**Fase 3 ("Ecossistema Total"):**
*   **Foco:** Retenção e Flexibilidade.
*   **Ferramentas:** SenseData, Econodata, Conector nativo Birthub no Make/n8n/Zapier.
*   **Por quê?** Tendo o app do Birthub no Zapier/Make, o cliente conecta qualquer ERP nichado (Totvs, Sankhya) sem precisarmos desenvolver isso dentro do nosso core, economizando meses de engenharia.
