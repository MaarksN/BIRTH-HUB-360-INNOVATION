# Ciclo 6 - Metering and Usage Review

## Conclusão executiva
O produto não possui metering confiável para sustentar billing por uso. Há estrutura de schema e alguns contadores operacionais, mas a trilha de consumo não fecha de forma auditável entre evento de uso, persistência, agregação, quota, reconciliação Stripe e fatura.

## O que existe no schema
O banco prevê artefatos de consumo:
- `UsageRecord`
- `QuotaUsage`
- `AgentBudget`
- `AgentBudgetEvent`

Isso prova intenção arquitetural. Não prova operação real de billing por uso.

## O que realmente grava consumo

### `UsageRecord`
Achado principal:
- no runtime revisado, `UsageRecord` é lido por billing e analytics
- não foi encontrada gravação de `UsageRecord` em código de produção revisado fora de seeds

Evidência:
- leituras em `apps/api/src/modules/billing/service.checkout.ts`
- leituras em `apps/api/src/modules/analytics/*`
- gravações localizadas em seeds de `packages/database/prisma`

Conclusão:
- o endpoint `/api/v1/billing/usage` depende de uma tabela que não mostrou escritores confiáveis no runtime auditado

### `QuotaUsage`
Escritas reais localizadas:
- bootstrap de organização em `apps/api/src/modules/organizations/service.ts`
- incremento de `AI_PROMPTS` em `apps/worker/src/engine/runner.shared.ts`
- reset mensal hardcoded em `apps/worker/src/jobs/quotaReset.ts`

Problemas:
- o worker incrementa `AI_PROMPTS` em `+1` por execução, não por tokens reais
- não há evidência equivalente de consumo real para `API_REQUESTS`, `EMAILS_SENT`, `STORAGE_GB` e `WORKFLOW_RUNS`
- o reset mensal não deriva do plano vigente

### `AgentBudget`
Existe e funciona como controle interno:
- limite em BRL por agente
- alertas em 80%
- bloqueio em 100%
- eventos de budget

Mas o custo é heurístico:
- base `0.15`
- `0.08` por tool
- `0.04` por skill

Conclusão:
- isso é governança de execução
- não é metering faturável
- não deve ser vendido como cobrança real por consumo

## O que não foi encontrado
- envio para `stripe.billing.MeterEvents`
- tabela `tenant_usage` citada na ADR
- pipeline Redis -> PostgreSQL -> Stripe Metering
- reconciliação de uso com invoice line items
- trilha auditável de overage
- percentuais de uso baseados em quota contratada no dashboard público revisado

## Divergência com a ADR de billing por uso
`docs/adrs/ADR-025-billing-baseado-em-uso.md` declara:
- metered billing assíncrono
- batching
- `stripe.billing.MeterEvents`
- métrica `ai_interactions_overage`
- consolidação em `tenant_usage`

No código auditado:
- não foi encontrada implementação operacional correspondente

Conclusão:
- a ADR é aspiracional ou incompleta perante o runtime atual

## Aderência de quotas

| Recurso | Existe no plano | Existe em quota | Escrita real observada | Confiável para cobrança |
| --- | --- | --- | --- | --- |
| AI prompts | Sim | Sim | Sim, mas `+1` por execução | Não |
| API requests | Sim | Sim | Bootstrap e reset, sem writer de consumo confiável | Não |
| Emails | Sim | Sim | Bootstrap e reset, sem writer de consumo confiável | Não |
| Storage | Sim | Sim | Reset, sem writer de consumo confiável | Não |
| Workflows | Sim | Parcial | Limite de criação, não metering de uso | Não para usage billing |
| Monthly tokens | Sim | Não como quota operacional confiável | Não encontrado | Não |

## UI e rastreabilidade
Achados relevantes:
- `apps/web/app/(dashboard)/billing/page.tsx` é placeholder com `quotaCards` hardcoded
- `apps/web/app/(dashboard)/dashboard/page.data.ts` tipa `usage` como `Record<string, number>`
- o backend retorna `usage` como lista por métrica

Conclusão:
- além da ausência de writer confiável, a apresentação de uso ainda está inconsistente

## Veredito deste bloco
O produto possui:
- controles parciais de quota
- um limitador operacional simples
- orçamento heurístico por agente

O produto não possui:
- metering confiável
- rastreabilidade de uso faturável
- reconciliação de overage
- base real para billing por consumo

Classificação específica de metering:
- maturidade `estrutural` para usage-based billing
- maturidade `parcial` apenas para algumas travas internas de consumo

## Ancoras de evidencia
- Leitura de `UsageRecord` no billing: `apps/api/src/modules/billing/service.checkout.ts:231`, `apps/api/src/modules/billing/service.checkout.ts:242`
- Escrita de `UsageRecord` encontrada apenas em seeds: `packages/database/prisma/seed/tenant.ts:421`, `packages/database/prisma/seeds/shared-ops.ts:137`
- Bootstrap de quotas: `apps/api/src/modules/organizations/service.ts:24`, `apps/api/src/modules/organizations/service.ts:25`, `apps/api/src/modules/organizations/service.ts:26`, `apps/api/src/modules/organizations/service.ts:27`, `apps/api/src/modules/organizations/service.ts:206`
- Reset mensal hardcoded: `apps/worker/src/jobs/quotaReset.ts:6`, `apps/worker/src/jobs/quotaReset.ts:7`, `apps/worker/src/jobs/quotaReset.ts:8`, `apps/worker/src/jobs/quotaReset.ts:9`, `apps/worker/src/jobs/quotaReset.ts:10`, `apps/worker/src/jobs/quotaReset.ts:35`
- Consumo real observado so para `AI_PROMPTS`: `apps/worker/src/engine/runner.shared.ts:92`, `apps/worker/src/engine/runner.shared.ts:101`, `apps/worker/src/engine/runner.shared.ts:102`, `apps/worker/src/engine/runner.shared.ts:108`
- Orcamento heuristico por agente: `apps/api/src/modules/budget/budget.service.ts:373`, `apps/api/src/modules/budget/budget.service.ts:383`, `apps/api/src/modules/budget/budget.service.ts:384`, `apps/api/src/modules/budget/budget.service.ts:385`
- Painel de quotas ainda aspiracional: `apps/web/app/(dashboard)/billing/page.tsx:3`, `apps/web/app/(dashboard)/billing/page.tsx:18`
- Mismatch de payload de `usage` no dashboard: `apps/web/app/(dashboard)/dashboard/page.data.ts:47`, `apps/web/app/(dashboard)/dashboard/page.data.ts:139`
- Promessa aspiracional de metered billing: `docs/adrs/ADR-025-billing-baseado-em-uso.md:10`, `docs/adrs/ADR-025-billing-baseado-em-uso.md:14`, `docs/adrs/ADR-025-billing-baseado-em-uso.md:18`
