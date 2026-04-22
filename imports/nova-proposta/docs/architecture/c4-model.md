# C4 Model: BirthHub360 Architecture

## Nível 1: Contexto de Sistema (Context)
O BirthHub360 é uma plataforma SaaS B2B focada no nicho maternal-infantil, oferecendo agentes autônomos de IA para vendas, atendimento e retenção.
**Atores Externos**: Pacientes/Mães (Consumidores finais via WhatsApp/Web), Administradores de Clínicas/Hospitais (Dashboard Web).
**Sistemas Externos**: Stripe (Cobrança), SendGrid (E-mails), Vindi/Hubspot (CRMs sincronizados), Provedores LLM (OpenAI/Anthropic).

## Nível 2: Containers
- **Dashboard Web (Next.js)**: Aplicação frontend para gestores de clínicas (LDR, AE, Billing).
- **API Gateway (Node.js)**: BFF e roteador principal.
- **Worker/Orchestrator (TypeScript/Python)**: Execução assíncrona de agentes, filas e workflows complexos.
- **Banco de Dados Relacional (PostgreSQL)**: Armazenamento transacional primário (Prisma ORM), multitenant via Row Level Security (RLS).
- **Cache & Filas (Redis)**: Gestão de estados de workers e rate-limiting.
- **Search (Elasticsearch)**: Consultas log/audit rápidas.

## Nível 3: Components (API & Worker)
- **Componente de Autenticação**: Integrado ao Gateway, provê RBAC, RLS contexts, CSRF e tokens JWT.
- **Agent Orchestrator**: Avalia prompts, consome budgets de tokens, dispara LLMs e reporta handoffs.
- **Billing Sync**: Consome webhooks do Stripe, computa quotas locais e gera InvoiceRecords locais.
