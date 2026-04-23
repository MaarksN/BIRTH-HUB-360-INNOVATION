# Ciclo 6 - Execution Summary

## Entregáveis gerados
- `audit/cycle6_billing_architecture_review.md`
- `audit/cycle6_pricing_vs_implementation.md`
- `audit/cycle6_metering_and_usage.md`
- `audit/cycle6_commercial_readiness.md`
- `audit/cycle6_execution_summary.md`

## Resumo executivo
O produto possui uma base real de assinatura recorrente com Stripe, trial simples, portal, invoices, grace period e hard lock. Isso é suficiente para uma operação restrita de planos fixos.

O produto nao possui base confiável para:
- billing por uso
- quotas derivadas do plano de forma consistente
- aderência entre narrativa comercial e enforcement real

Conclusão do ciclo:
- prontidão comercial = `operacional limitada`

## Principais achados
- `packages/billing` é explicitamente um pacote morto; o billing real está em `apps/api/src/modules/billing`.
- Existe reconciliação Stripe com idempotência, replay window e persistência de eventos.
- O catálogo default de planos está em código e tem preços mensais/anual definidos.
- O usage billing prometido em ADR não foi encontrado no runtime auditado.
- `UsageRecord` aparece como fonte de leitura, mas não mostrou writers de produção fora de seeds.
- Quotas bootstrap e reset mensal divergem do catálogo de planos.
- A documentação comercial promete muito mais do que o plano implementado controla.

## Top 10 riscos comerciais e técnicos
1. `checkout.session.completed` grava `currentPeriodEnd` a partir de `session.expires_at`, o que pode distorcer o ciclo local da assinatura.
2. O produto não possui metering confiável para usage billing, apesar da promessa arquitetural e comercial.
3. `UsageRecord` é usado para leitura de consumo sem writer de runtime comprovado no escopo auditado.
4. Quotas de onboarding e reset mensal não derivam do plano contratado, criando risco de cobrança e suporte inconsistente.
5. A página pública de pricing depende de alias `professional -> pro`, sinal de desalinhamento entre frontend e backend.
6. O preço anual exibido na UI é calculado localmente, não lido da origem canônica do backend.
7. A documentação comercial promete limites por usuários, leads e contratos sem enforcement correspondente.
8. Não foi evidenciado dunning operacional real além de mudança de status e logs em `payment_failed`.
9. O dashboard de billing interno revisado ainda é placeholder com cards hardcoded.
10. O domínio de billing e metering está amplamente coberto por `@ts-nocheck`, reduzindo a confiança de manutenção e evolução.

## Validações executadas

### Typecheck e lint solicitados
Comandos globais pedidos no prompt:
- `pnpm typecheck`
- `pnpm lint`

Resultado:
- `pnpm typecheck` falhou porque o script raiz depende de `corepack`, ausente neste shell.
- `pnpm lint` falhou pelo mesmo motivo.

Contorno aplicado para produzir evidência útil:
- `pnpm typecheck:policy` falhou por política global contra `@ts-nocheck`
- `pnpm typecheck:core` falhou em `packages/agents-core`, fora do domínio de billing/metering
- `pnpm lint:policy` falhou ao varrer `.pytest_cache`
- `pnpm lint:core` falhou em pacote amplo por governança global de `@ts-nocheck`

### Validação específica dos módulos de billing/metering
Passaram:
- `pnpm --filter @birthub/api typecheck`
- `pnpm --filter @birthub/worker typecheck`
- `pnpm --filter @birthub/api build`
- `pnpm --filter @birthub/worker build`
- `pnpm --filter @birthub/api exec node --import tsx --test tests/billing.checkout.test.ts tests/billing.grace-period.test.ts tests/billing.idempotency.test.ts tests/billing.ip-ban.test.ts tests/billing.paywall.test.ts tests/billing.proration-credit.test.ts tests/billing.snapshot.test.ts tests/billing.webhook-audit.test.ts`
- `pnpm --filter @birthub/worker exec node --import tsx --test src/agents/runtime.budget.test.ts src/jobs/billingExport.test.ts`

Falharam:
- `pnpm --filter @birthub/api lint`
- `pnpm --filter @birthub/worker lint`

Motivo dominante das falhas de lint:
- uso massivo de `@ts-nocheck` no próprio domínio e no restante da aplicação

## Avaliação honesta de prontidão comercial
O produto não deve ser descrito como comercialmente pronto. A formulação mais fiel é:

- pronto apenas para operação limitada de assinatura fixa
- não pronto para billing por uso
- não aderente à narrativa comercial mais ambiciosa

## Próximos passos mínimos para elevar a prontidão
- unificar plano contratado, quotas e reset mensal em uma única origem canônica
- implementar writers confiáveis de consumo com trilha auditável por evento
- ligar uso medido a invoice line item ou Stripe metering real
- corrigir divergências entre UI de pricing, catálogo backend e documentação comercial
- retirar `@ts-nocheck` do domínio de billing/metering e estabilizar lint

## Evidência rápida para revisão executiva
- Billing recorrente real: `apps/api/src/modules/billing/router.ts:56`, `apps/api/src/modules/billing/service.checkout.ts:112`, `apps/api/src/modules/billing/service.reconciliation.handlers.ts:245`
- Trial e quotas reais no onboarding: `apps/api/src/modules/organizations/service.ts:195`, `apps/api/src/modules/organizations/service.ts:198`, `apps/api/src/modules/organizations/service.ts:206`
- Quotas divergentes do plano: `apps/api/src/modules/billing/service.shared.ts:80`, `apps/api/src/modules/organizations/service.ts:26`, `apps/worker/src/jobs/quotaReset.ts:6`
- Uso por runtime insuficiente para faturamento: `apps/api/src/modules/billing/service.checkout.ts:242`, `apps/worker/src/engine/runner.shared.ts:108`
- Promessa aspiracional de usage billing: `docs/adrs/ADR-025-billing-baseado-em-uso.md:10`, `docs/adrs/ADR-025-billing-baseado-em-uso.md:18`
- Promessa comercial acima do código: `docs/CORPORATE_IDENTITY.md:21`, `docs/CORPORATE_IDENTITY.md:80`, `docs/CORPORATE_IDENTITY.md:89`, `docs/CORPORATE_IDENTITY.md:98`, `docs/CORPORATE_IDENTITY.md:107`

