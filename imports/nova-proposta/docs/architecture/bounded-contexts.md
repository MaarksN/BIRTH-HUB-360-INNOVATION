# Bounded Contexts

Este documento define os principais domínios e suas fronteiras no BirthHub360:

## 1. Contexto de Faturamento (Billing)
**Fronteira:** Gerencia planos, faturas (invoices), assinaturas (subscriptions) e quotas mensais de limites.
**Dependências Corretas:** Comunica-se exclusivamente através do `BillingEvent` e Webhooks do Stripe.
**Exemplo Correto:** Um agente de conversação (Contexto Agent) emite um registro de uso (`UsageRecord`), e o Contexto Billing recalcula se o tenant excedeu o limite. O agente não acessa as tabelas do Stripe diretamente.

## 2. Contexto de Autenticação e Segurança (Auth)
**Fronteira:** Responsável pelo gerenciamento de Sessões, MFA, Convites e RLS (Row Level Security).
**Dependências Corretas:** Fornece um identificador seguro (`tenantId`, `userId`) a cada chamada de rede via `AsyncLocalStorage` ou Gateway middleware. Nenhum outro contexto lida com hashing de senhas.

## 3. Contexto de Agentes e Execução (Agents/Worker)
**Fronteira:** Executa fluxos conversacionais (Threads), avalia intenções, consome chamadas LLM e executa handoffs (Sales/Support/Retention).
**Exemplo Correto:** Um agente gera um `AgentBudgetEvent` assíncrono para reportar os tokens consumidos, em vez de bloquear a resposta ao usuário final atualizando quotas de banco de dados diretamente e de forma síncrona.

## Integrações Externas (Data Flows)
- **Stripe**: Fluxo de assinatura. Webhooks entram pelo `api-gateway`, roteiam para `billing` worker e atualizam o DB local (assíncrono).
- **SendGrid**: Serviços de notificação interna e onboarding.
- **LLM Providers (OpenAI/Anthropic)**: Acessados via gateway de IA interno (`llm-client` package) responsável pelo tracing e logging de segurança.
