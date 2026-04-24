# Ciclo 6 - Billing Architecture Review

## Escopo e base efetiva
Este ciclo revisa a camada real de monetização do produto com foco em planos, assinaturas, billing, reconciliação Stripe, quotas e prontidão comercial.

Limitação importante de evidência:
- Os arquivos mandatórios citados no prompt não existem com esses nomes em `audit/`.
- Não foi possível usar `audit/source_of_truth.md`, `audit/master_backlog_revalidated.md`, `audit/readiness_matrix.md`, `audit/reconciliation_report.md`, `audit/phase1_execution_summary.md`, `audit/cycle2_execution_summary.md`, `audit/cycle3_execution_summary.md`, `audit/cycle4_execution_summary.md` e `audit/cycle5_execution_summary.md`.
- A revisão foi sustentada pelo código-fonte, schema Prisma, testes presentes e documentação adjacente existente.

Principais fontes reais:
- `packages/database/prisma/schema.prisma`
- `apps/api/src/modules/billing/*`
- `apps/api/src/modules/webhooks/*`
- `apps/api/src/modules/organizations/service.ts`
- `apps/worker/src/worker.billing.ts`
- `apps/worker/src/jobs/billingExport.ts`
- `packages/billing/README.md`
- `apps/api/tests/billing.*.test.ts`

## Arquitetura real encontrada

### Domínio canônico
- O domínio canônico de billing está em `apps/api/src/modules/billing`.
- `packages/billing/README.md` marca `packages/billing` como `DEAD PACKAGE` e afirma que não tem ownership de produção.

### Modelo de dados
O schema Prisma possui base estrutural suficiente para billing recorrente:
- `Plan`
- `Subscription`
- `Invoice`
- `BillingEvent`
- `BillingCredit`
- `UsageRecord`
- `QuotaUsage`
- `AgentBudget`
- `AgentBudgetEvent`

Isso mostra que existe modelagem para assinatura, fatura, reconciliação de webhook, créditos e consumo. O problema não é ausência total de estrutura; é a diferença entre estrutura existente e operação comercial confiável.

### APIs expostas
O router de billing expõe:
- `GET /plans`
- `POST /checkout`
- `GET /portal`
- `GET /invoices`
- `GET /usage`

Não existe endpoint público equivalente para cancelamento, apesar de `cancelBillingForOrganization()` existir no service.

### Dependência operacional de Stripe
Há integração real com Stripe para:
- criação de checkout de assinatura
- portal self-service
- verificação de webhook com assinatura
- reconciliação de eventos
- persistência idempotente de eventos em `BillingEvent`

O webhook Stripe só é montado quando `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` estão presentes em runtime. Sem isso, a reconciliação real simplesmente não existe.

## Fluxo real suportado hoje

### 1. Criação de organização e trial
Na criação da organização:
- o sistema garante o plano `starter`
- cria `stripeCustomerId`
- cria assinatura local com status `trial`
- define trial de 14 dias
- cria quotas bootstrap iniciais

Conclusão:
- trial existe em código
- não há mecanismo dedicado de conversão de trial além do fluxo normal de checkout e webhook

### 2. Checkout e upgrade
`createCheckoutSessionForOrganization()`:
- cria sessão Stripe em modo `subscription`
- usa `stripePriceId` do plano
- aplica `proration_behavior = create_prorations`
- propaga país e locale

Conclusão:
- upgrade e primeira contratação têm fluxo real
- o mecanismo depende da consistência entre plano local e preço Stripe

### 3. Webhooks e reconciliação
Os eventos tratados pela reconciliação são:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`

Controles positivos observados:
- verificação de assinatura
- replay window
- lock distribuído
- cache de idempotência
- trilha em `BillingEvent`
- testes cobrindo idempotência, replay e auditoria

### 4. Snapshot de billing e hard lock
O snapshot de billing calcula:
- status atual
- grace period
- hard lock quando `past_due` ultrapassa a carência
- crédito de downgrade

Isso é usado para gating funcional em partes do produto.

## O que está realmente pronto
- Assinatura recorrente simples com Stripe Checkout.
- Portal de billing Stripe.
- Persistência local de assinatura e invoices.
- Tratamento de `payment_succeeded`, `payment_failed`, `subscription.updated`, `subscription.deleted`.
- Grace period e hard lock.
- Testes relevantes para checkout, snapshot, replay, idempotência e crédito de downgrade.

## Gaps arquiteturais de billing
- Não há base confiável para billing por uso.
- `checkout.session.completed` usa `session.expires_at` como `currentPeriodEnd`, o que não representa o período real da assinatura.
- Cancelamento existe no service, mas não aparece como fluxo completo de API/produto.
- Não foi encontrada orquestração de dunning real; `invoice.payment_failed` registra estado e logs, mas não há evidência de cobrança ativa ou cadência operacional.
- O catálogo padrão de planos é embutido em código e também pode ser sincronizado a partir do Stripe, criando dupla origem potencial.
- Grande parte do domínio está sob `@ts-nocheck`, o que reduz confiança de manutenção.

## Upgrade, downgrade, trial, cancelamento e renovação

### Upgrade
- Suportado via checkout Stripe.
- Requer mapeamento consistente de `stripePriceId`.

### Downgrade
- Parcialmente suportado.
- `customer.subscription.updated` cria crédito de proration em `BillingCredit`.
- O crédito local cobre apenas `DOWNGRADE_PRORATION`.

### Trial
- Existe trial de 14 dias na criação da organização.
- Não há fluxo dedicado mais sofisticado para trial expirar, renovar, converter ou notificar.

### Cancelamento
- Existe implementação em service.
- Não foi encontrada rota equivalente de produto nem evidência de fluxo end-to-end exposto.

### Renovação
- Renovação depende do ciclo Stripe + webhooks de invoice.
- Não foi encontrada lógica própria de renovação além da reconciliação dos eventos.

## Separação entre código, aspiração e operação

Código real:
- checkout
- portal
- invoices
- reconciliação Stripe
- grace period
- hard lock

Documentação aspiracional:
- billing por uso com Stripe Meter Events
- lead-to-cash completo
- automação financeira com NF-e

Operação real identificável:
- cobrança recorrente simples
- reconciliação básica de assinatura/fatura
- export diário de invoices

## Veredito deste bloco
A arquitetura de billing é suficiente para uma operação limitada de assinatura recorrente fixa, mas não sustenta a promessa de monetização híbrida ou usage-based. O domínio existe em código, porém ainda mistura boa estrutura de webhook e persistência com lacunas importantes de reconciliação, cancelamento exposto, dunning e governança técnica.

## Ancoras de evidencia
- Pacote morto e dominio canônico: `packages/billing/README.md:1`, `packages/billing/README.md:8`, `packages/billing/README.md:11`
- Catalogo default e alias de plano: `apps/api/src/modules/billing/service.shared.ts:14`, `apps/api/src/modules/billing/service.shared.ts:47`, `apps/api/src/modules/billing/service.shared.ts:70`, `apps/api/src/modules/billing/service.shared.ts:93`
- Trial e bootstrap inicial: `apps/api/src/modules/organizations/service.ts:24`, `apps/api/src/modules/organizations/service.ts:25`, `apps/api/src/modules/organizations/service.ts:26`, `apps/api/src/modules/organizations/service.ts:195`, `apps/api/src/modules/organizations/service.ts:198`, `apps/api/src/modules/organizations/service.ts:206`
- Endpoints reais de billing: `apps/api/src/modules/billing/router.ts:36`, `apps/api/src/modules/billing/router.ts:56`, `apps/api/src/modules/billing/router.ts:112`, `apps/api/src/modules/billing/router.ts:129`, `apps/api/src/modules/billing/router.ts:160`
- Checkout, portal, leitura de uso e cancelamento em service: `apps/api/src/modules/billing/service.checkout.ts:112`, `apps/api/src/modules/billing/service.checkout.ts:145`, `apps/api/src/modules/billing/service.checkout.ts:231`, `apps/api/src/modules/billing/service.checkout.ts:242`, `apps/api/src/modules/billing/service.checkout.ts:266`
- Gate operacional do webhook Stripe: `apps/api/src/app/core.ts:154`, `apps/api/src/app/core.ts:155`, `apps/api/src/app/core.ts:159`
- Risco de periodo incorreto via checkout: `apps/api/src/modules/billing/service.reconciliation.handlers.ts:79`
- Grace period e `past_due`: `apps/api/src/modules/billing/service.reconciliation.handlers.ts:228`, `apps/api/src/modules/billing/service.reconciliation.handlers.ts:244`, `apps/api/src/modules/billing/service.reconciliation.handlers.ts:245`

