# Final Technical Audit — Antigravity

## Método e evidências coletadas
- Execução de baseline antes de alterações: `pnpm lint` (falhou por `@ts-nocheck` em `packages/workflows-core/src/nodes/agentExecute.ts:1` e `executeStep.ts:1`), `pnpm build` (falhou com `Module not found: @birthub/workflows-core` em `apps/web/app/(dashboard)/workflows/[id]/edit/workflow-editor-helpers.tsx:5`), `pnpm test` (falhou por mismatch `react`/`react-dom` e ausência de `@birthub/workflows-core/dist/src/index.js` em vários testes de web).  
- Inspeção direta do código (sem confiar em relatórios) nos módulos de API, Worker, Web, Voice Engine, Billing e pacotes compartilhados.
- Verificação de artefatos de build: `packages/workflows-core` compila para `dist/workflows-core/**`, divergindo do `package.json` que exporta `dist/src`.

## Julgamento por ciclo
- **Fase 0 (fundação)** — ❌ Reprovado. Base não passa lint/build/test; uso extenso de `@ts-nocheck` em entrypoints de API (`apps/api/src/app.ts`, `app/core.ts`) e banco (`packages/database/src/client.ts`), quebrando critério de qualidade mínima.
- **Fase 1** — ❌ Reprovado. Nenhuma evidência de hardening adicional; mesma superfície de riscos da fase 0 permanece ativa.
- **Ciclo 2 (voz + integrações + workflows)** — ❌ Reprovado. Voice Engine é mockado (Twilio inbound sem verificação de assinatura, Deepgram/ElevenLabs não são chamados, resposta TTS é string fixa em `apps/voice-engine/src/server.ts:143-205`). Workflows-core está empacotado incorretamente (exports apontam para `dist/src`, mas build gera `dist/workflows-core/src`), quebrando consumo web.
- **Ciclo 3** — ❌ Reprovado. Nenhum endurecimento observado em auth ou multi-tenant além do que já existia; API continua com `@ts-nocheck` e dependente de validação manual.
- **Ciclo 4 (web, auth, multi-tenant)** — ❌ Reprovado. App web não builda (module not found) e não testa (mismatch `react`/`react-dom` em `apps/web/package.json` linhas 17-18). Tests mostram cliente chamando `https://api.birthub.test` em vez de BFF (`apps/web/tests/notification-store.test.ts`, `product-api.test.ts`), anulando isolação tenant/Auth.
- **Ciclo 5 (agentes)** — ⚠️ Aprovado com ressalvas. Runtime de agentes existe, mas Worker força tenant `"default-tenant"` quando ausente (`apps/worker/src/worker.ts:151-166`), e `executeManifestAgentRuntime` busca primeira organização do tenant sem validar membro (`apps/worker/src/agents/runtime.orchestration.ts:26-49`), permitindo execução fora do escopo autorizado.
- **Ciclo 6 (billing)** — ❌ Reprovado. Não há trilha de metering → usage → fatura; `createBillingLockResolver` só lê último subscription e grava cache Redis, sem integração Stripe ativa ou reconciliação de uso (`apps/worker/src/worker.billing.ts`). Exportação diária lê todas invoices sem isolamento transacional/tenant (`apps/worker/src/jobs/billingExport.ts`).
- **Ciclo 7 (release/reprodutibilidade)** — ❌ Reprovado. Build quebra, testes quebram, `release:sbom` não chega a executar; pacote `@birthub/workflows-core` publicado sem artefatos no caminho exportado, inviabilizando pipeline determinístico.

## Auditoria por área

### Core Platform (API, Worker, DB, Auth, multi-tenant)
- API configurada, mas sem type-safety (`@ts-nocheck` em `apps/api/src/app.ts`, `app/core.ts`, `middleware/authentication.ts`), enfraquecendo contrato de auth/CSRF/headers.
- Tenant enforcement depende de AsyncLocalStorage, porém chamadas Prisma são diretas e não usam `BaseRepository`; várias operações constroem queries sem `runWithTenantContext`, permitindo fuga se caller não preencher tenant.
- Worker define fallback `tenantId = "default-tenant"` (linha 152) e não confirma membership antes de executar agentes ou workflows.
- DB não possui RLS; isolamento é lógico em código, sem garantias no banco (`packages/database/prisma/schema.prisma`).

### Voice Engine
- Webhook Twilio aceita requisições sem assinatura ou validação de origem (`apps/voice-engine/src/server.ts:143-153`).
- Nenhum uso real de Deepgram ou ElevenLabs; TTS responde string fixa e publish em Redis. Não há latência real de STT/TTS, nem captura de áudio ou armazenamento de sessões.
- Observabilidade mínima: apenas logs e Redis stream; sem métricas de erro/latência por chamada.

### Integrations
- HTTP client básico (`packages/integrations/src/clients/http.ts`) sem circuit breaker real, sem observabilidade estruturada por provider além de log de info/erro. Não há retries idempotentes para GET, nem correlação com tenant.
- Ausência de validação de payloads de adapters; tipagem frouxa via `unknown`/`Record<string, string>`.

### Web
- Build falha por ausência de artefatos do `@birthub/workflows-core` no caminho exportado; import em `apps/web/app/(dashboard)/workflows/[id]/edit/workflow-editor-helpers.tsx:5` quebra.
- Versões incompatíveis de `react` (19.2.4) e `react-dom` (19.2.5) em `apps/web/package.json:15-18` causam crash de runtime e testes.
- BFF bypass: helpers de notificação e product search chamam domínio público (`https://api.birthub.test/...`) em vez de `/api/bff/...`, invalidando controle de sessão/tenant (falhas em `apps/web/tests/notification-store.test.ts` e `product-api.test.ts`).

### Agentes
- Runtime e políticas existem, mas dependem de organização “qualquer” do tenant e não validam usuário. Handoff/execução são escritos em `@ts-nocheck`, reduzindo confiabilidade do contrato.
- Dist do `@birthub/workflows-core` contém código de teste e não provê build pronto para consumo (apenas `dist/workflows-core/**`), quebrando os clients web e inviabilizando publicação como pacote.

### Billing
- Sem trilha de metering → billing: não há geração de `UsageRecord` a partir de requests/execuções. Exportação diária apenas serializa invoices existentes.
- Falta reconciliação com Stripe: webhook Stripe é opcional e não há evidência de jobs de cobrança/captura.
- Grace/lock é calculado em Redis sem invalidação robusta; nenhuma notificação/ação automática de suspensão.

### Release / Reprodutibilidade
- Pipelines de build e test falham localmente; release não consegue gerar SBOM nem artefatos.
- Pacote crítico (`@birthub/workflows-core`) publicado com exports inconsistentes, impedindo qualquer consumidor de usar Next.js alias `/nextjs`.
- Ausência de validação automatizada de artefatos ou hashes; sem evidência de imagens container versionadas.

## Conclusão global
- **Status final:** 🔴 **NÃO APTO** para produção/SaaS. Falhas críticas em build, tipagem, isolamento de tenant, web runtime, voz e billing. Nenhum ciclo cumpre integralmente os entregáveis declarados; evidências concretas mostram regressões e código mockado.

