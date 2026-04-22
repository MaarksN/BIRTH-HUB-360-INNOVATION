# Ciclo 6 - Pricing vs Implementation

## Regra de leitura
Este documento diferencia três camadas:
- verdade de execução: código e dados de runtime
- apresentação comercial: UI de pricing
- narrativa aspiracional: documentação comercial

Não há pricing válido fora do que o código realmente expõe ou persiste.

## Fonte canônica de planos em código
O catálogo default implementado em `apps/api/src/modules/billing/service.shared.ts` é:

| Plano | Código | Mensal | Anual | Limites principais em código |
| --- | --- | ---: | ---: | --- |
| Starter | `starter` | 4900 cents USD | 47040 cents USD | 5 agentes, 5000 AI prompts, 5000 API requests, 2500 emails, 250000 monthly tokens, 100 GB, 30 workflows |
| Pro | `pro` | 14900 cents USD | 143040 cents USD | 25 agentes, 25000 AI prompts, 25000 API requests, 10000 emails, 2500000 monthly tokens, 500 GB, 250 workflows |
| Enterprise | `enterprise` | 49900 cents USD | 479040 cents USD | ilimitado nos limites principais |

Flags de feature observadas no catálogo:
- `advancedAnalytics`
- `agents`
- `customerPortal`
- `prioritySupport` apenas em enterprise
- `workflows`

## Inconsistências entre pricing e implementação

### 1. Código do plano `pro` versus fallback `professional`
- O backend trata `professional` como alias de `pro`.
- A página `apps/web/app/pricing/page.tsx` usa fallback `professional`.
- O funcionamento depende de alias implícito, não de nomenclatura consistente ponta a ponta.

Impacto:
- aumenta risco de integração quebrar quando a origem do plano vier do frontend fallback, seed ou sincronização Stripe

### 2. Preço anual exibido é calculado no frontend
- O backend já possui `yearlyPriceCents`.
- A UI calcula anual como `monthly * 12 * 0.8`.
- Hoje os números coincidem com o catálogo default, mas a tela não usa a origem canônica de preço anual.

Impacto:
- qualquer mudança futura no anual pode gerar divergência imediata entre preço exibido e preço real

### 3. Starter em código não bate com quotas bootstrap
O plano `starter` promete em código:
- `aiPrompts: 5000`
- `apiRequests: 5000`
- `emails: 2500`

Mas a criação de organização bootstrapa:
- `AI_PROMPTS: 1000`
- `API_REQUESTS: 5000`
- `EMAILS_SENT: 2500`

Impacto:
- promessa comercial e enforcement inicial já nascem divergentes

### 4. Reset mensal também não deriva do plano
`apps/worker/src/jobs/quotaReset.ts` aplica defaults hardcoded:
- `AI_PROMPTS: 1000`
- `API_REQUESTS: 5000`
- `EMAILS_SENT: 2500`
- `STORAGE_GB: 100`
- `WORKFLOW_RUNS: 10000`

Impacto:
- mesmo após mudança de plano, as quotas não têm uma origem única confiável

### 5. Pricing page mostra só uma fração do plano real
A tela pública de pricing mostra:
- agentes
- workflows
- analytics avançado
- portal self-service

Ela não mostra:
- `aiPrompts`
- `apiRequests`
- `emails`
- `monthlyTokens`
- `storageGb`
- detalhes de trial

Impacto:
- a proposta comercial mostrada ao cliente não representa a estrutura real de limites implementados

## Documentação comercial versus código
`docs/CORPORATE_IDENTITY.md` promete, entre outros:
- modelo `Lead-to-Cash`
- Clicksign/Docusign
- emissão de NF-e
- limites por usuários, leads e contratos
- automação financeira com billing/NFe
- API completa e RBAC como diferenciais de plano enterprise

O catálogo de planos em código não modela nem faz enforcement de:
- usuários por plano
- leads por plano
- contratos por plano
- emissão de NF-e
- esteira lead-to-cash completa

Conclusão:
- essa documentação não pode ser tratada como prova de monetização implementada

## Quadro de aderência

| Item | Código real | UI | Documentação comercial | Situação |
| --- | --- | --- | --- | --- |
| Catálogo mensal | Sim | Sim, com fallback | Não detalha preços | Parcialmente consistente |
| Catálogo anual | Sim | Calculado localmente | Não detalha preços | Frágil |
| Código do plano `pro` | `pro` | `professional` no fallback | `PRO` | Inconsistente |
| Limites de AI prompts | 5000 starter no plano | Não exibido | Não coerente com docs de leads/usuários | Inconsistente |
| Quotas reais no onboarding | 1000 starter | Não exibido | Não documentado como exceção | Inconsistente |
| Usuários/leads/contratos por plano | Não modelado | Não exibido | Prometido | Não implementado |
| NF-e/financeiro automatizado por plano | Não evidenciado | Não exibido | Prometido | Não implementado |

## Julgamento deste bloco
Existe pricing implementado para três planos com cobrança recorrente mensal/anual em cents, mas a camada comercial não está alinhada com a implementação. O produto hoje consegue sustentar apenas a narrativa de planos fixos básicos. A narrativa de limites comerciais mais amplos, full lead-to-cash e automação financeira está acima do que o código efetivamente entrega.

## Ancoras de evidencia
- Catalogo canônico e alias: `apps/api/src/modules/billing/service.shared.ts:14`, `apps/api/src/modules/billing/service.shared.ts:47`, `apps/api/src/modules/billing/service.shared.ts:51`, `apps/api/src/modules/billing/service.shared.ts:70`, `apps/api/src/modules/billing/service.shared.ts:74`, `apps/api/src/modules/billing/service.shared.ts:93`, `apps/api/src/modules/billing/service.shared.ts:97`
- Limites starter e pro em código: `apps/api/src/modules/billing/service.shared.ts:57`, `apps/api/src/modules/billing/service.shared.ts:66`, `apps/api/src/modules/billing/service.shared.ts:80`, `apps/api/src/modules/billing/service.shared.ts:89`
- Quotas bootstrap divergentes: `apps/api/src/modules/organizations/service.ts:25`, `apps/api/src/modules/organizations/service.ts:26`, `apps/api/src/modules/organizations/service.ts:27`
- Reset mensal divergente: `apps/worker/src/jobs/quotaReset.ts:6`, `apps/worker/src/jobs/quotaReset.ts:7`, `apps/worker/src/jobs/quotaReset.ts:8`, `apps/worker/src/jobs/quotaReset.ts:9`, `apps/worker/src/jobs/quotaReset.ts:10`
- Fallback `professional` e checkout da UI: `apps/web/app/pricing/page.tsx:38`, `apps/web/app/pricing/page.tsx:40`, `apps/web/app/pricing/page.tsx:127`
- Preco anual calculado no frontend: `apps/web/app/pricing/page.tsx:179`
- Escopo reduzido da exibicao comercial: `apps/web/app/pricing/page.tsx:194`, `apps/web/app/pricing/page.tsx:195`, `apps/web/app/pricing/page.tsx:197`, `apps/web/app/pricing/page.tsx:199`
- Promessas comerciais acima do enforcement real: `docs/CORPORATE_IDENTITY.md:21`, `docs/CORPORATE_IDENTITY.md:80`, `docs/CORPORATE_IDENTITY.md:89`, `docs/CORPORATE_IDENTITY.md:90`, `docs/CORPORATE_IDENTITY.md:97`, `docs/CORPORATE_IDENTITY.md:98`, `docs/CORPORATE_IDENTITY.md:107`
