# Root Cause — Final Fixes

## 1) comando
`pnpm typecheck`
- erro real: `New @ts-nocheck directives exceeded the classified baseline`.
- arquivo(s): `apps/web/app/(dashboard)/workflows/[id]/edit/page.tsx` (linha 1).
- causa raiz: diretiva `@ts-nocheck` nova em arquivo monitorado pelo `ts-directives-guard`.
- impacto: bloqueia `typecheck` e `ci:task typecheck` antes do restante do pipeline.
- correção proposta: remover a diretiva e corrigir os erros de tipagem reais expostos.

## 2) comando
`pnpm build` e `pnpm build:core`
- erro real: incompatibilidade de tipagem no benchmark (`TS2352`) e, após isso, erro de build web por dependência Node em bundle cliente.
- arquivo(s):
  - `apps/worker/test/benchmarkUserCleanup.ts`
  - `apps/web/app/(dashboard)/workflows/[id]/edit/workflow-editor-helpers.tsx`
- causa raiz:
  - cast direto de mock incompleto para `PrismaClient`.
  - import de `@birthub/workflows-core` (entrypoint com exports server/node) em código cliente do Next.
- impacto: quebra `build`/`build:core`.
- correção proposta:
  - cast via `unknown` no benchmark.
  - trocar import para `@birthub/workflows-core/nextjs` (surface browser-safe).

## 3) comando
`pnpm typecheck` (erro subsequente após remover o `@ts-nocheck`)
- erro real: propriedade obrigatória ausente (`crmRegions`) em `SdrLeadScoreView` e assinatura de `fetch` em testes retornando `Response` em vez de `Promise<Response>`.
- arquivo(s):
  - `apps/web/components/sales-os/SdrAutomaticPlatform.tsx`
  - `packages/utils/src/__tests__/fetchWithTimeout.test.ts`
- causa raiz: regressões de tipagem introduzidas em chamadas/fixtures.
- impacto: quebra `typecheck` e `ci:task typecheck`.
- correção proposta: passar `crmRegions` e ajustar mocks de `fetch` para retornar `Promise.resolve(Response)`.

## 4) comando
`pnpm build:core`
- erro real: falha de resolução de `fonts.googleapis.com` durante `next build`.
- arquivo(s):
  - `apps/web/app/layout.tsx`
  - `apps/web/app/globals.css`
- causa raiz: uso de `next/font/google` exigindo acesso de rede durante build.
- impacto: build não determinístico em ambiente sem acesso externo.
- correção proposta: remover dependência de Google Fonts no build e manter variáveis CSS locais.

## 5) comando
`pnpm ci:security-guardrails`
- erro real:
  - exigência indevida de `DATABASE_URL` em modo local por `CI=true`.
  - falso positivo em auth guard para rotas públicas de auth (`/login`, `/refresh`, `/mfa/challenge`).
  - falhas de governança de migrations (entries faltantes/sobrando e `rollbackTested=false`).
- arquivo(s):
  - `scripts/ci/security-guardrails-local.mjs`
  - `scripts/security/check-auth-guards.ts`
  - `packages/database/prisma/migration-registry.json`
- causa raiz:
  - regra de DB obrigatório acoplada ao env `CI` no script local.
  - lista de rotas públicas sem paths relativos usados no scanner AST.
  - divergência entre diretórios de migration e registry.
- impacto: bloqueio do guardrail local mesmo com código funcional.
- correção proposta:
  - exigir DB apenas com `--require-db`.
  - incluir rotas curtas públicas.
  - sincronizar e corrigir validações no `migration-registry.json`.

