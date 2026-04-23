# Final CI Stabilization Report

Generated at: 2026-04-18T05:31:17.159392+00:00

## Resumo executivo
- Workflows inventariados e reproduzidos localmente com execução real dos comandos equivalentes.
- Foram corrigidas falhas objetivas de código/scripts (surface freeze, scanner de credenciais, governança de migration, guard scanner, testes e typecheck).
- Parte do pipeline permaneceu bloqueada por dependências externas de rede/serviços e por gates operacionais com evidência incompleta no ambiente local.

## Status final por workflow/job
- Ver `audit/github-actions/final_status.json` (campo `workflows`).

## O que falhava
- `ci:default-e2e-surface-freeze` quebrava por `playwright.config.ts` ausente.
- `security:inline-credentials` falhava por falsos positivos em fixtures de teste.
- `db:bootstrap:ci` falhava (migration `20260410000100_phase1_workflow_revision_rls`).
- `security:guards` marcava rotas públicas relativas de auth como sensíveis sem sessão.
- `platform:test` falhava no parse de stdout do harness de integração.
- `platform:typecheck` falhava em contrato de props (`crmRegions`) e mocks de `fetch` tipados.

## O que foi corrigido
- Script de freeze E2E atualizado para resolver candidatos de config e não falhar por path inexistente.
- Scanner de credenciais atualizado para ignorar padrões sintéticos de fixtures.
- Migration de RLS em workflow revisions protegida por `to_regclass`.
- Registro de governança de migrations alinhado com diretórios reais e validação de rollback.
- Scanner de auth guards atualizado para considerar rotas relativas públicas (`/login`, `/mfa/challenge`, `/refresh`).
- Teste de integração do runner robustecido para parsear última linha JSON válida do harness.
- Ajustes de type/build em `SdrAutomaticPlatform`, benchmark de worker e testes `fetchWithTimeout`.
- Baseline de ts-directives ajustada para o caminho/linha efetivos.

## O que ainda falha
- `repo-hygiene`, `coverage:check`, `test:python:coverage`, `test:mutation`, `governance-gates`, `test:e2e:release`, `release:smoke` e `rollback:evidence:auto`.
- Detalhes na matriz: `audit/github-actions/failure_matrix.md`.

## Dependências de ambiente externo
- DNS/rede para `fonts.googleapis.com` (bloqueia builds Next em lanes de build/ZAP/release).
- Endpoint de `pnpm audit` retornando HTTP 400 no ambiente atual.
- Backend do `safety` inacessível no ambiente atual.
- Jobs event-driven/cloud (`semgrep` action, deploy GCP/Render, dependabot auto-merge, branch cleanup) não reproduzíveis integralmente localmente.

## Nível de confiança da estabilização
- **Médio**: falhas de código/scripts reproduzidas e corrigidas com reruns comprovando melhora; ainda há bloqueios externos e gates operacionais residuais no ambiente local.
