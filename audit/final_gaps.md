# Gaps que impedem produção/SaaS

1. **Build quebrado do web**: Next 16 não encontra `@birthub/workflows-core` porque o pacote exporta `dist/src`, mas o build gera `dist/workflows-core/src` (erro em `apps/web/app/(dashboard)/workflows/[id]/edit/workflow-editor-helpers.tsx:5`).
2. **Dependências React incompatíveis**: `react` 19.2.4 vs `react-dom` 19.2.5 (`apps/web/package.json:15-18`) derrubam testes e runtime.
3. **Tipagem desabilitada**: `@ts-nocheck` em entrypoints críticos (API `apps/api/src/app.ts`, Worker `apps/worker/src/worker.ts`, Workflows `packages/workflows-core/src/nodes/*.ts`), impedindo detecção de regressões.
4. **Isolamento de tenant frágil**: Worker força `tenantId = "default-tenant"` (linha 152) e executa agentes sem checar membership; Prisma queries no API/Worker não usam RLS ou repositórios com `requireTenantId`.
5. **Voice Engine mockado**: Twilio inbound não valida assinatura; Deepgram/ElevenLabs não são chamados; WebSocket só ecoa texto; sem métricas de latência ou persistência (`apps/voice-engine/src/server.ts:143-205`).
6. **BFF bypass**: clientes web chamam diretamente `https://api.birthub.test` em fluxos de notificação e busca, furando autenticação/tenant (`apps/web/tests/notification-store.test.ts`, `product-api.test.ts`).
7. **Pacote workflows-core incompleto**: artefatos gerados em caminho diferente do export e incluem código de teste; consumidores não conseguem importar `/nextjs`.
8. **Billing sem metering**: não há geração de `UsageRecord` nem reconciliação Stripe; `createBillingLockResolver` só cacheia estado e `billingExport` apenas serializa invoices já existentes.
9. **Release não reproduzível**: build/test falham, SBOM não é produzido (`pnpm build` aborta antes de `release:sbom`).
10. **Segurança operacional fraca**: ausência de validação de origem em webhooks críticos (Twilio voice), uso de cookies/bearer sem MFA/tenant em auth de API Keys, e logs sem correlação obrigatória de tenant.

