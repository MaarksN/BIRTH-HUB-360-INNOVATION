# Relatorio Completo de Dividas Tecnicas

Data: 2026-04-24  
Repositorio: `C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION`  
Modo: auditoria apenas diagnostica.

## Reconhecimento inicial

Stack principal: TypeScript, Node.js 24.x, pnpm 9.15.9, Turbo, Next.js, API Node/Express-like, workers BullMQ, Redis, Prisma/PostgreSQL, Docker, Kubernetes, Cloud Run, GitHub Actions, OpenTelemetry/Sentry e modulos de agentes/LLM/tool calling.

Apps detectados: `apps/api`, `apps/web`, `apps/worker`, `apps/webhook-receiver`, `apps/voice-engine`, `apps/legacy`.  
Packages detectados: `packages/database`, `packages/config`, `packages/security`, `packages/queue`, `packages/integrations`, `packages/agents-core`, `packages/agent-runtime`, `packages/agent-packs`, `packages/llm-client`, `packages/contracts`, `packages/workflows-core`, `packages/utils`, entre outros.

Banco/ORM: Prisma + PostgreSQL.  
Filas: BullMQ/Redis.  
Autenticacao/autorizacao: middleware de autenticacao, sessoes, API keys, RBAC e testes dedicados existentes.  
Integracoes externas: Stripe, HubSpot, Zenvia, SendGrid, Slack, Google Analytics, CRM/Pipedrive/RD Station, pagamentos, fiscal, calendario e outras.  
Agentes/IA: presentes em `packages/agents-core`, `packages/agent-runtime`, `packages/agent-packs`, `apps/worker/src/agents` e `packages/llm-client`.  
Frontend: Next.js em `apps/web`.  
API/backend: `apps/api`, `apps/webhook-receiver`, `apps/voice-engine`.  
Infra/CI: Dockerfiles, docker-compose, Kubernetes, Cloud Run e workflows GitHub Actions.

Arquivos-chave analisados: `package.json`, `pnpm-lock.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs`, `apps/*/package.json`, `packages/*/package.json`, `packages/database/prisma/schema.prisma`, migrations, `.github/workflows`, Dockerfiles, docker-compose, `.env`, `.env.example`, `.env.vps.example`, README, docs, OpenAPI em `apps/api/src/docs/openapi.ts`, workers/jobs, integrations e runtime de agentes.

## Catalogo de achados

### TD-001

Categoria: Seguranca, Configuracao, Privacidade. Divida detectada: arquivo `.env` versionado e arquivos sealed/env rastreados contendo chaves com nomes sensiveis. Severidade: Critico. Status: Confirmado por evidencia. Evidencia: `git ls-files .env .env.local .env.example .env.vps.example ops/release/sealed/...` retornou `.env`, `.env.example`, `.env.vps.example`, `ops/release/sealed/.env.production.sealed` e `ops/release/sealed/.env.staging.sealed`; `.env:1` contem `DATABASE_URL` mascarado no relatorio. Arquivo e linha aproximada: `.env:1`, `ops/release/sealed/.env.production.sealed`, `ops/release/sealed/.env.staging.sealed`. Como foi detectado: `git ls-files` e leitura mascarada. Comando executado: `git ls-files ...` e leitura de `.env`. Impacto: risco de segredo real em historico Git e ambientes compartilhados. Risco de nao corrigir: vazamento de credenciais, acesso indevido ao banco e incidente LGPD. Recomendacao: retirar segredos reais do historico, rotacionar credenciais afetadas e manter somente exemplos sem valor real. Esforco estimado: M. Correcao sugerida: migrar para secret manager, revisar arquivos sealed e documentar processo de rotacao. Testes recomendados: gitleaks/trufflehog em historico completo e pipeline bloqueante. Prioridade: P0 urgente.

### TD-002

Categoria: Infraestrutura, Seguranca, Supply chain. Divida detectada: manifest Kubernetes contem `Secret.stringData` com `DATABASE_URL` placeholder e imagens `:latest`. Severidade: Critico. Status: Confirmado por evidencia. Evidencia: `k8s/deployment.yaml:25` define `postgresql://birthub:CHANGEME@...`; `k8s/deployment.yaml:58` e `:161` usam `ghcr.io/...:latest`. Como foi detectado: leitura de manifest. Comando: `Get-Content k8s/deployment.yaml`. Impacto: deploy nao reprodutivel, risco de segredo em IaC e drift de ambiente. Risco: release com imagem errada ou credencial acidental em Git. Recomendacao: usar Secret externo/SealedSecret validado e imagens por digest. Esforco: M. Correcao sugerida: parametrizar manifests e bloquear `:latest` no CI. Testes: kubeconform/policy-as-code e validacao de digest. Prioridade: P0 urgente.

### TD-003

Categoria: Seguranca, Integracoes, Observabilidade. Divida detectada: tokens e segredos sao enviados em query string para provedores externos. Severidade: Critico. Status: Confirmado por evidencia. Evidencia: `packages/integrations/src/clients/social-ads.ts:31`, `signatures.ts:77`, `signatures.ts:88`, `crm.ts:39`, `crm-extended.ts:75`, `analytics.ts:37`. Como: `rg "access_token=|api_token=|api_secret|token=\\$\\{"`. Comando: busca por tokens em URLs. Impacto: URLs podem vazar em logs, proxies, APM, historico de browser/server e erros. Risco: exposicao de tokens de integracao e dados de clientes. Recomendacao: preferir headers Authorization ou body conforme API; aplicar redacao de URL em logs. Esforco: M. Correcao: criar cliente HTTP central com mascaramento e proibicao de segredos em query. Testes: testes unitarios de URL sem segredo e snapshot de redacao de logs. Prioridade: P0 urgente.

### TD-004

Categoria: Tipagem, Qualidade, CI/CD. Divida detectada: typecheck global falha. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `pnpm exec tsc -p tsconfig.json --noEmit --incremental false` retornou exit 1 com erros em API, Worker, Webhook Receiver, Queue, LLM client e scripts. Arquivos: exemplos `apps/worker/src/agents/runtime.orchestration.ts:95`, `apps/webhook-receiver/src/index.test.ts:14`, `packages/llm-client/src/index.test.ts:4`, `scripts/generate-official-collection.ts`. Impacto: o repositorio nao possui garantia basica de compilacao estatica. Risco: regressao silenciosa e CI falso-negativo se nao rodar. Recomendacao: corrigir erros por pacote e transformar typecheck em gate. Esforco: G. Correcao: separar erros de testes/scripts/prod e reduzir supressoes. Testes: `pnpm exec tsc -p tsconfig.json --noEmit --incremental false`. Prioridade: P1 alta.

### TD-005

Categoria: Tipagem. Divida detectada: TypeScript permissivo e uso amplo de supressoes. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `tsconfig.base.json:9` `strict:false`, `:10` `noImplicitAny:false`, `:11` `exactOptionalPropertyTypes:false`, `:12` `useUnknownInCatchVariables:false`; buscas encontraram 198 ocorrencias de `any`, 18 `as any`, 171 `@ts-expect-error` e 11 `@ts-ignore`. Como: leitura de tsconfig e `rg`. Impacto: contratos de dominio e API menos confiaveis. Risco: erros em runtime mascarados. Recomendacao: habilitar flags por pacote em fases. Esforco: G. Testes: typecheck por pacote e lint de ban-types/suppressions. Prioridade: P2 media.

### TD-006

Categoria: Testes, DX. Divida detectada: scripts de teste de API, Web e Worker usam `sh -c`/`find` e falham no Windows. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `apps/api/package.json:15`, `apps/web/package.json:11`, `apps/worker/package.json:12`; comandos `pnpm --filter @birthub/api test`, `@birthub/web test`, `@birthub/worker test` falharam com "O sistema nao pode encontrar o caminho especificado." Impacto: desenvolvedor Windows nao consegue rodar suite padrao. Risco: testes locais deixam de ser executados. Recomendacao: trocar por runner Node cross-platform. Esforco: P/M. Testes: executar os tres scripts em Windows e Linux. Prioridade: P1 alta.

### TD-007

Categoria: Testes, Banco. Divida detectada: `@birthub/database test` executa zero testes. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `packages/database/package.json:28` usa `node --import tsx --test src*.test.ts test*.test.ts`, mas existem testes em `packages/database/test`; comando retornou `tests 0`. Impacto: falsa sensacao de cobertura para banco. Risco: regressao em RLS/migrations/repositories sem gate. Recomendacao: ajustar glob/runner. Esforco: P. Testes: `pnpm --filter @birthub/database test` deve descobrir testes reais. Prioridade: P2 media.

### TD-008

Categoria: I18n, Frontend, Testes. Divida detectada: suite manual de web falha em dicionarios i18n. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `node --import tsx --test apps/web/tests/*.test.ts` falhou; `apps/web/tests/i18n.test.ts:18` esperava `Central de Operacao`, recebeu `Revenue OS`; `:56` esperava `Operations Hub`, recebeu `Revenue OS`. Impacto: copy/localizacao divergente de contrato. Risco: UX inconsistente e testes quebrados ignorados pelo script principal. Recomendacao: alinhar dicionario ou teste e garantir execucao no CI. Esforco: P. Testes: suite web completa. Prioridade: P1 alta.

### TD-009

Categoria: Testes, Privacidade, Clinico. Divida detectada: suites criticas estao puladas. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `test.skip` em `apps/api/tests/retention.service.test.ts:61`, `:129`, `:176`; `fhir.service.test.ts:19`, `:51`; `consent.service.test.ts:49`, `:95`; `clinical.service.test.ts:183`, `:263`, `:325`; `apps/web/tests/clinical-data.test.ts:11`, `:19`. Como: `rg "test.skip|describe.skip|it.skip|\\.only"`. Impacto: fluxos de LGPD/clinico/FHIR fora do gate. Risco: regressao em dados sensiveis. Recomendacao: reativar com fixtures isoladas ou marcar com motivo e gate separado. Esforco: M. Testes: suites reativadas em CI. Prioridade: P1 alta.

### TD-010

Categoria: Banco, Release, Backup/rollback. Divida detectada: governanca de migrations falha por entradas ausentes no registro. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `pnpm --filter @birthub/database db:check:governance` retornou FAIL para `20260420000100_phase2_1_hubspot_hardening` e `20260422000100_phase3_workflow_events`. Impacto: migrations recentes nao passam pelo registro oficial. Risco: deploy de schema sem rastreabilidade/rollback. Recomendacao: atualizar registry e exigir gate no CI. Esforco: P. Testes: `db:check:governance`. Prioridade: P1 alta.

### TD-011

Categoria: Banco, Qualidade de dados, Billing/agentes. Divida detectada: valores monetarios BRL em `Float`. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `packages/database/prisma/schema.prisma:280`, `:281`, `:301` usam `Float` para `limitBrl`, `consumedBrl`, `costBrl`. Impacto: perda de precisao monetaria. Risco: cobranca/orcamento incorreto. Recomendacao: armazenar centavos em inteiro ou Decimal. Esforco: M/G. Testes: migracao compatibilidade, arredondamento e reconciliacao. Prioridade: P1 alta.

### TD-012

Categoria: Banco, Multi-tenancy, Privacidade. Divida detectada: modelos de eventos/exportacao permitem `tenantId`/`organizationId` nullable. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `BillingEvent` em `schema.prisma:740-741`; `DatasetExport` em `schema.prisma:957-958`. Impacto: dados sensiveis podem ficar sem escopo claro. Risco: quebra de isolamento, retencao e auditoria. Recomendacao: documentar casos globais e impor constraints quando o escopo for obrigatorio. Esforco: M. Testes: integridade de tenant e fixtures negativas. Prioridade: P1 alta.

### TD-013

Categoria: Arquitetura, Seguranca, Multi-tenancy. Divida detectada: regra customizada `no-unscoped-prisma-query` cobre poucos arquivos. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `eslint.config.mjs:42-52` lista somente 10 arquivos, enquanto buscas Prisma encontraram muitos modulos com `findMany`/`findFirst`. Impacto: checks multi-tenant nao cobrem todo o backend. Risco: query sem tenant em modulo novo. Recomendacao: ampliar regra para `apps/api/src/**/*.ts`, `apps/worker/src/**/*.ts` com allowlist explicita. Esforco: M. Testes: fixtures ESLint negativas. Prioridade: P1 alta.

### TD-014

Categoria: Seguranca, API, Multi-tenancy, Integracoes. Divida detectada: webhook Zenvia busca connector account por `id` e `provider`, sem `tenantId` no `where`; isolamento depende de segredo/fluxo externo. Severidade: Alto. Status: Suspeita forte. Evidencia: `apps/api/src/modules/connectors/service.ts:1338-1341`. Como: revisao manual de webhook. Impacto: se `connectorAccountId` for controlavel e segredo vazar, pode haver confusao cross-tenant. Risco: acesso/processamento em tenant errado. Recomendacao: exigir tenant/organization no lookup ou provar criptograficamente o escopo do segredo. Esforco: M. Testes: negativos cross-tenant para webhook Zenvia. Prioridade: P1 alta.

### TD-015

Categoria: Seguranca, API, Webhooks. Divida detectada: assinatura do webhook receiver e pulada quando `trustedContext` contem tenant/organization; protecao depende da rota chamadora. Severidade: Alto. Status: Verificacao manual necessaria. Evidencia: `apps/api/src/modules/connectors/service.ts:1530-1539`. Impacto: bypass interno mal protegido aceitaria payload sem assinatura externa. Risco: evento falso em tenant valido. Recomendacao: revisar todas as rotas chamadoras e exigir autenticacao de servico forte. Esforco: M. Testes: chamadas sem assinatura com/sem token interno e tenant divergente. Prioridade: P1 alta.

### TD-016

Categoria: Resiliencia, Integracoes. Divida detectada: webhook receiver encaminha chamadas para API sem timeout/AbortSignal. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `apps/webhook-receiver/src/index.ts:562-569` e `:584-588`. Impacto: conexoes presas podem degradar worker/processo. Risco: indisponibilidade sob falha de API. Recomendacao: usar `fetchWithTimeout`, retry limitado e circuit breaker. Esforco: P/M. Testes: API simulada lenta e indisponivel. Prioridade: P1 alta.

### TD-017

Categoria: Qualidade, Frontend, API. Divida detectada: arquivos muito grandes e com muitas responsabilidades. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `apps/api/src/modules/connectors/service.ts` 1.764 linhas; `apps/worker/src/integrations/connector-events.ts` 1.698; `apps/webhook-receiver/src/index.ts` 1.067; `apps/web/components/agents/chatbook-workspace.tsx` 1.380; `apps/web/lib/chatbook.ts` 1.275. Como: contagem de linhas e aproximacao de branches. Impacto: manutencao dificil. Risco: bug por alteracao local sem entender efeito colateral. Recomendacao: extrair responsabilidades por dominio em fases. Esforco: G. Testes: cobertura antes de refatorar. Prioridade: P2 media.

### TD-018

Categoria: Arquitetura. Divida detectada: ciclos de importacao internos. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: detector estatico encontrou ciclos em `packages/queue/src/runtime.ts -> dlq.ts -> runtime.ts`, `packages/agents-core/src/runtime/intelligence.ts -> intelligenceRuntime.ts -> intelligence.ts`, `apps/api/src/modules/clinical/service-patients.ts -> service-patient-records.ts -> service-patients.ts`, entre outros. Impacto: inicializacao fragil e boundaries pouco claros. Risco: bugs por ordem de modulo. Recomendacao: quebrar ciclos com contratos/interfaces. Esforco: M/G. Testes: dependency-cruiser/madge no CI. Prioridade: P2 media.

### TD-019

Categoria: Arquitetura, DX. Divida detectada: diretorio `imports/` com 3.285 arquivos cria sombra de codigo e ruido de auditoria. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: contagem `rg --files` por top-level mostrou `imports` como maior area. Impacto: dificuldade de saber fonte de verdade. Risco: codigo obsoleto inspecionado ou copiado de volta. Recomendacao: classificar como fixture/vendor/generated e documentar exclusoes. Esforco: P/M. Testes: checks que excluam/validem imports. Prioridade: P2 media.

### TD-020

Categoria: CI/CD, Testes. Divida detectada: workflow chama `pnpm test:isolation`, mas root `package.json` nao possui esse script. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `.github/workflows/ci-cd.yml:132` vs `package.json:16-38`. Impacto: job de integracao falha ou nunca valida isolamento como esperado. Risco: multi-tenancy sem gate real. Recomendacao: alinhar script e workflow. Esforco: P. Testes: dry-run CI/local do comando. Prioridade: P1 alta.

### TD-021

Categoria: CI/CD, Testes. Divida detectada: CI roda `pnpm test --coverage`, mas o script raiz e `turbo run test --concurrency=1`, sem coverage configurado. Severidade: Alto. Status: Suspeita forte. Evidencia: `.github/workflows/ci-cd.yml:65-71`, `package.json:24`. Impacto: Codecov pode receber arquivo inexistente ou cobertura incompleta. Risco: decisao de qualidade baseada em metrica falsa. Recomendacao: criar `test:coverage` real e artifact de cobertura por pacote. Esforco: M. Testes: CI deve gerar `coverage/coverage-final.json`. Prioridade: P1 alta.

### TD-022

Categoria: Supply chain, CI/CD. Divida detectada: actions e scanners nao estao pinados por SHA; Trivy usa `@master`. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `.github/workflows/ci-cd.yml:69`, `:107`, `:113`, `:159`; `security-guardrails.yml:51`, `:66`, `:71`. Impacto: risco de supply-chain em CI. Risco: execucao de action alterada sem revisao. Recomendacao: pin por SHA e usar Renovate/Dependabot para atualizacao controlada. Esforco: M. Testes: policy check para actions. Prioridade: P1 alta.

### TD-023

Categoria: Supply chain, Seguranca. Divida detectada: Semgrep Docker sem tag/digest e gitleaks instalado via curl sem checksum. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `.github/workflows/security-guardrails.yml:37-41` e `:75-80`. Impacto: scanner de seguranca vira ponto de entrada. Risco: binario/imagem alterado comprometendo CI. Recomendacao: usar action/imagem pinada por digest e checksum. Esforco: P/M. Testes: validacao de hashes. Prioridade: P1 alta.

### TD-024

Categoria: Dependencias, Seguranca. Divida detectada: `pnpm audit` encontrou vulnerabilidade moderada em `uuid` via `bullmq`. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `pnpm audit --audit-level low` retornou advisory `GHSA-w5hq-g745-h8pq`, `uuid <14.0.0`, via `bullmq@5.74.1`. Impacto: risco dependente de uso de APIs vulneraveis. Risco: manter dependencia vulneravel transiente. Recomendacao: atualizar BullMQ/uuid quando disponivel e monitorar advisory. Esforco: P/M. Testes: queue unit/integration. Prioridade: P2 media.

### TD-025

Categoria: Dependencias. Divida detectada: muitas dependencias desatualizadas. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `pnpm outdated -r --long` listou Prisma 6.19.3 -> 7.8.0, TypeScript 5.9.3 -> 6.0.3, Twilio 5.13.1 -> 6.0.0, BullMQ 5.74.1 -> 5.76.1, Sentry 10.49.0 -> 10.50.0, React 19.2.4 -> 19.2.5. Impacto: patches e mudancas de seguranca atrasados. Risco: acumulacao de upgrade grande. Recomendacao: politica de atualizacao semanal com grupos. Esforco: M/G. Testes: CI completo e smoke. Prioridade: P2 media.

### TD-026

Categoria: Infraestrutura, Supply chain. Divida detectada: Docker/K8s/Cloud Run usam tags sem digest. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/worker/Dockerfile` usam `node:24-alpine`; `infra/cloudrun/service.yaml:12` usa `:latest`; K8s usa `:latest`. Impacto: build/deploy nao reproduzivel. Risco: base image ou app image muda sem revisao. Recomendacao: pin digest e automatizar atualizacao. Esforco: M. Testes: build com digest e scanner de imagem. Prioridade: P2 media.

### TD-027

Categoria: Configuracao, DX. Divida detectada: versao Node inconsistente entre `package.json`, README e `.nvmrc`. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `package.json:7-9` permite `>=20.9.0`, README orienta Node 24.x e `.nvmrc` usa 24.14.0, ambiente atual 24.15.0. Impacto: comportamento diferente por dev/CI. Risco: testes ou build divergentes. Recomendacao: fixar politica unica. Esforco: P. Testes: setup em ambiente limpo. Prioridade: P2 media.

### TD-028

Categoria: DX, CI/CD. Divida detectada: tarefas `lint`, `typecheck` e `test` dependem de `build` no Turbo, gerando artefatos durante diagnostico. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `turbo.json:19-30`, `:36-45`. Impacto: checks deixam de ser puramente verificadores e podem modificar workspace. Risco: CI lento e diagnostico com side effects. Recomendacao: separar `check` de `build`. Esforco: M. Testes: rodar checks em arvore limpa. Prioridade: P2 media.

### TD-029

Categoria: Observabilidade. Divida detectada: webhook receiver usa `console.error/info` diretamente. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `apps/webhook-receiver/src/index.ts:192`, `:1052`, `:1064`. Impacto: logs sem schema/correlationId consistente. Risco: suporte dificil em incidentes. Recomendacao: usar logger estruturado central. Esforco: P. Testes: unitario de log redaction/contexto. Prioridade: P2 media.

### TD-030

Categoria: Observabilidade. Divida detectada: saida de testes mostra logs com campos duplicados camel/snake (`requestId`/`request_id`, `tenantId`/`tenant_id`). Severidade: Medio. Status: Suspeita forte. Evidencia: logs emitidos durante `node --import tsx --test ... apps/api/tests/auth.test.ts ...`. Impacto: queries em APM/SIEM ficam inconsistentes. Risco: investigacao de incidente mais lenta. Recomendacao: padronizar schema de log. Esforco: P/M. Testes: snapshot de logger. Prioridade: P2 media.

### TD-031

Categoria: Agentes/IA, Resiliencia. Divida detectada: `BaseTool` faz timeout com `Promise.race`, mas nao cancela a operacao subjacente. Severidade: Alto. Status: Confirmado por evidencia. Evidencia: `packages/agents-core/src/tools/baseTool.ts:70-80`; `httpTool` usa `AbortSignal.timeout` em `:126`, mas a base generica nao injeta cancelamento universal. Impacto: ferramenta pode continuar executando apos timeout logico. Risco: side effect duplicado/tardio em tool destrutiva. Recomendacao: propagar `AbortSignal` no contrato de tools e idempotencia obrigatoria. Esforco: M/G. Testes: tool fake lenta que confirma cancelamento. Prioridade: P1 alta.

### TD-032

Categoria: Agentes/IA, Seguranca. Divida detectada: controles de tool calling existem, mas nao foi encontrada suite adversarial ampla de prompt injection/exfiltracao. Severidade: Alto. Status: Verificacao manual necessaria. Evidencia: buscas por `prompt injection` retornaram mais manifests/guardrails que testes adversariais; testes manuais `runtime.tools*` passaram para allowlist/db-write, mas nao cobrem exfiltracao/prompt malicioso. Impacto: risco especifico de agentes com dados privados. Risco: tool call fora de plano ou vazamento contextual. Recomendacao: criar corpus adversarial e policy tests por tool sensivel. Esforco: M/G. Testes: prompt injection, exfiltracao, approval, tenant scope. Prioridade: P1 alta.

### TD-033

Categoria: Supply chain, Dependencias. Divida detectada: Dependabot/Renovate nao encontrados. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `rg --files -g '*dependabot*' -g '*renovate*'` retornou sem resultados. Impacto: atualizacoes ficam manuais. Risco: vulnerabilidades acumuladas. Recomendacao: adicionar Renovate/Dependabot com agrupamento e calendario. Esforco: P/M. Testes: PR dry-run. Prioridade: P2 media.

### TD-034

Categoria: Supply chain, CI/CD. Divida detectada: existe script de SBOM, mas nao ha evidencia de gate obrigatorio no CI principal. Severidade: Medio. Status: Suspeita forte. Evidencia: `scripts/release/generate-sbom.mjs` existe; workflows analisados nao mostraram etapa bloqueante de SBOM/assinatura. Impacto: baixa rastreabilidade de artefatos. Risco: resposta lenta a CVEs. Recomendacao: gerar SBOM no CI e publicar como artifact/release asset. Esforco: M. Testes: validar SPDX/CycloneDX. Prioridade: P2 media.

### TD-035

Categoria: Frontend, UX. Divida detectada: `chatbook-workspace.tsx` concentra UI, estado, voz, exportacao, follow-up e historico em 1.380 linhas. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `apps/web/components/agents/chatbook-workspace.tsx` e ocorrencias de botoes/inputs/handlers nas linhas 331, 522, 948, 994, 1056, 1089, 1226, 1341. Impacto: manutencao e testes de UX dificeis. Risco: regressao em loading/error/feedback. Recomendacao: decompor apos criar testes de comportamento. Esforco: G. Testes: component tests e fluxos assicronos. Prioridade: P2 media.

### TD-036

Categoria: Produto/UX, Permissoes. Divida detectada: pagina admin expoe botoes destrutivos/operacionais "Cancelar" e "Replay" sem confirmacao visivel no trecho. Severidade: Medio. Status: Suspeita forte. Evidencia: `apps/web/app/admin/operations/executions/[id]/page.tsx:71`. Impacto: erro operacional por clique indevido. Risco: cancelamento/replay acidental de execucao. Recomendacao: confirmacao, disabled state, audit reason e permissao visual alinhada ao backend. Esforco: P/M. Testes: UI de confirmacao e autorizacao negativa. Prioridade: P2 media.

### TD-037

Categoria: Acessibilidade, Frontend. Divida detectada: muitos inputs em formularios clinicos/admin aparecem sem `label` explicito no trecho inspecionado. Severidade: Baixo. Status: Verificacao manual necessaria. Evidencia: `apps/web/app/(dashboard)/patients/[id]/page.parts.tsx:101-141`, `:169-225`, `:291-335`; busca por `<input|<select|<textarea`. Impacto: leitores de tela podem ter experiencia ruim. Risco: nao conformidade WCAG. Recomendacao: rodar axe/eslint-jsx-a11y e adicionar labels associados. Esforco: M. Testes: axe e navegacao por teclado. Prioridade: P3 baixa.

### TD-038

Categoria: Privacidade/LGPD, Testes. Divida detectada: testes de consentimento e retencao estao pulados. Severidade: Baixo. Status: Confirmado por evidencia. Evidencia: `apps/api/tests/consent.service.test.ts:49`, `:95`; `apps/api/tests/retention.service.test.ts:61`, `:129`, `:176`. Impacto: fluxos LGPD sem validacao automatica plena. Risco: regressao em consentimento/retencao. Recomendacao: reativar suites ou mover para lane com banco controlado. Esforco: M. Testes: consent/retention com fixtures. Prioridade: P2 media.

### TD-039

Categoria: Ferramentas de qualidade, Seguranca. Divida detectada: scanners locais sugeridos nao estavam instalados. Severidade: Baixo. Status: Confirmado por evidencia. Evidencia: `Get-Command semgrep`, `gitleaks`, `trufflehog`, `madge`, `dependency-cruiser`, `jscpd`, `depcheck`, `ts-prune`, `syft`, `grype` falharam. Impacto: auditoria local limitada. Risco: falso negativo. Recomendacao: documentar e provisionar toolchain em CI/devcontainer. Esforco: M. Testes: `--version` de cada ferramenta. Prioridade: P3 baixa.

### TD-040

Categoria: Backup/rollback, Operacao. Divida detectada: scripts de backup/restore existem, mas teste de restauracao e runbook completo nao foram comprovados. Severidade: Baixo. Status: Verificacao manual necessaria. Evidencia: `scripts/ops/backup-postgres.sh`, `scripts/ops/restore-postgres.sh`, docs analisados sem evidencia de restore drill executado nesta auditoria. Impacto: recuperacao incerta em incidente. Risco: RTO/RPO nao comprovados. Recomendacao: executar restore drill em ambiente isolado e registrar runbook. Esforco: M. Testes: restauracao automatizada em banco descartavel. Prioridade: P3 baixa.

## 30 categorias obrigatorias

### 1. Dividas de qualidade de codigo

Achados confirmados: `TD-004`, `TD-005`, `TD-017`. Suspeitas/manual: coesao/acoplamento dos modulos grandes deve ser avaliada antes de refatorar. Ferramentas recomendadas: jscpd, SonarQube, ESLint complexity, knip. Risco de nao corrigir: manutencao lenta e regressao em modulos criticos. Prioridade: P1/P2. Arquivos afetados: `apps/api/src/modules/connectors/service.ts`, `apps/webhook-receiver/src/index.ts`, `apps/web/components/agents/chatbook-workspace.tsx`. Proximos passos: corrigir typecheck, adicionar metricas de complexidade e decompor com cobertura.

### 2. Dividas de arquitetura

Achados confirmados: `TD-013`, `TD-018`, `TD-019`. Suspeitas/manual: boundaries entre apps/packages e dominio/infra precisam de policy automatizada. Ferramentas: madge, dependency-cruiser, Nx/Turbo graph. Risco: ciclos e imports cruzados dificultam evolucao. Prioridade: P1/P2. Afetados: queue, agents-core, clinical, imports. Proximos passos: gate de ciclos e regras de boundary.

### 3. Dividas de seguranca

Achados confirmados: `TD-001`, `TD-002`, `TD-003`, `TD-013`, `TD-023`. Suspeitas/manual: `TD-014`, `TD-015`, scans semgrep/gitleaks historico. Ferramentas: gitleaks, trufflehog, Semgrep, pnpm audit. Risco: vazamento de segredo, bypass multi-tenant, webhook falso. Prioridade: P0/P1. Afetados: env, integrations, connectors, CI. Proximos passos: rotacao/scan, corrigir tokens em URL e revisar webhooks.

### 4. Dividas de testes

Achados confirmados: `TD-006`, `TD-007`, `TD-008`, `TD-009`, `TD-021`. Suspeitas/manual: cobertura real nao comprovada. Ferramentas: node:test coverage/c8, Playwright, Vitest/Jest se adotado. Risco: regressao critica sem gate. Prioridade: P1. Afetados: api/web/worker/database tests. Proximos passos: runner cross-platform, coverage real, reativar skips.

### 5. Dividas de tipagem

Achados confirmados: `TD-004`, `TD-005`. Suspeitas/manual: DTOs e JSON.parse sem validacao exigem revisao por fluxo. Ferramentas: tsc, ESLint no-explicit-any, ts-prune. Risco: contratos fracos entre API, banco e frontend. Prioridade: P1/P2. Afetados: repo inteiro. Proximos passos: baseline typecheck e flags strict por pacote.

### 6. Dividas de performance

Achados confirmados: arquivos grandes e consultas com muitos `findMany`; varios usam `take`, mas nem todos foram validados semanticamente. Suspeitas/manual: N+1, payloads grandes, bundle e polling. Ferramentas: Prisma logs, bundle analyzer, Lighthouse, query explain. Risco: degradacao sob carga. Prioridade: P2. Afetados: analytics, dashboard, connectors, chatbook. Proximos passos: perf tests por endpoint critico.

### 7. Dividas de banco de dados

Achados confirmados: `TD-010`, `TD-011`, `TD-012`. Confirmacoes positivas: `prisma validate` passou; checks de tenant, FK e raw JOIN passaram. Suspeitas/manual: restore/migrate status com banco real, soft delete, constraints de dominio. Ferramentas: prisma validate/migrate status, checks customizados. Risco: schema sem governanca e dados sem escopo. Prioridade: P1. Afetados: Prisma schema/migrations. Proximos passos: registry, monetary type, tenant nullability review.

### 8. Dividas de observabilidade

Achados confirmados: `TD-029`; suspeita forte `TD-030`. Ferramentas: log schema tests, OpenTelemetry checks, dashboards. Risco: incidentes dificeis de rastrear. Prioridade: P2. Afetados: webhook receiver e logger. Proximos passos: padronizar requestId/correlationId e redacao.

### 9. Dividas de dependencias

Achados confirmados: `TD-024`, `TD-025`. Ferramentas: pnpm audit/outdated, depcheck, license checker. Risco: vulnerabilidades e upgrades grandes. Prioridade: P2. Afetados: monorepo. Proximos passos: politica de upgrades.

### 10. Dividas de configuracao

Achados confirmados: `TD-001`, `TD-027`. Confirmacoes positivas: `packages/config` usa Zod e valida SSL em producao. Suspeitas/manual: drift `.env.example` vs runtime real. Ferramentas: env schema diff. Risco: ambiente divergente e segredo acidental. Prioridade: P0/P2. Proximos passos: schema unico de env e exemplos sem segredo.

### 11. Dividas de CI/CD

Achados confirmados: `TD-020`, `TD-021`, `TD-022`, `TD-023`, `TD-028`. Ferramentas: actionlint, zizmor, scorecard. Risco: pipeline quebrado ou supply-chain fraco. Prioridade: P1. Proximos passos: alinhar scripts, coverage, pinning.

### 12. Dividas de documentacao

Achados: `TD-027`, `TD-040`. O que foi verificado: README, docs e scripts. Limitacao: nao houve validacao completa de todos os runbooks. Status: sem achado critico adicional, mas com drift confirmado. Ferramentas: docs-as-tests. Proximos passos: atualizar setup, rollback e restore drill.

### 13. Dividas de API

Achados confirmados/suspeitas: `TD-014`, `TD-015`, `TD-021`. O que foi verificado: routers, OpenAPI parcial e testes de auth/security. Limitacao: contrato OpenAPI completo nao foi comparado com rotas. Ferramentas: contract tests/OpenAPI diff. Prioridade: P1. Proximos passos: contratos por endpoint sensivel.

### 14. Dividas de frontend

Achados: `TD-008`, `TD-035`, `TD-036`. O que foi verificado: componentes, testes web, busca por handlers. Limitacao: sem Lighthouse/Playwright visual. Ferramentas: Playwright, bundle analyzer, React Profiler. Prioridade: P2. Proximos passos: component tests e separar estado complexo.

### 15. Dividas de acessibilidade

Achado: `TD-037`. O que foi verificado: busca de JSX por `button`, `input`, `textarea`, `aria-*`. Limitacao: sem axe/Lighthouse. Ferramentas: eslint-plugin-jsx-a11y, axe, Lighthouse. Prioridade: P3/P2 se fluxo clinico. Proximos passos: auditar formularios clinicos/admin.

### 16. Dividas de internacionalizacao

Achado: `TD-008`. O que foi verificado: testes i18n, buscas por datas/locale e textos. Limitacao: hardcoded strings nao foram enumeradas integralmente. Ferramentas: i18n extraction, lint de strings. Prioridade: P1 para teste falhando. Proximos passos: alinhar dicionarios e coverage.

### 17. Dividas de dominio e regra de negocio

Achados: `TD-011`, `TD-036`. Suspeitas/manual: regras monetarias/orcamento e replay/cancelamento precisam de fonte de verdade. Ferramentas: testes de dominio, state machine tests. Risco: estados invalidos e dinheiro impreciso. Prioridade: P1/P2. Proximos passos: invariantes formais.

### 18. Dividas de concorrencia e consistencia

Achados/suspeitas: `TD-010`, `TD-031`. O que foi verificado: buscas por transaction/idempotency/retry e testes worker selecionados. Limitacao: sem carga concorrente real. Ferramentas: testes concorrentes, Jepsen-like local, lock/idempotency checks. Prioridade: P1/P2. Proximos passos: idempotencia por fluxo critico.

### 19. Dividas de integracao

Achados: `TD-003`, `TD-016`, `TD-014`, `TD-015`. Ferramentas: contract tests, mocks realistas, Semgrep para tokens em URL. Risco: tokens vazados e webhooks travando/falsos. Prioridade: P0/P1. Proximos passos: cliente HTTP central e testes de webhooks.

### 20. Dividas de produto/UX verificaveis

Achados: `TD-036`, `TD-035`, `TD-008`. Limitacao: sem teste visual ou sessao browser. Ferramentas: Playwright, Storybook/a11y, UX regression. Risco: operacao admin perigosa e copy inconsistente. Prioridade: P2. Proximos passos: confirmar fluxos destrutivos e estados assicronos.

### 21. Supply chain e integridade

Achados: `TD-022`, `TD-023`, `TD-024`, `TD-026`, `TD-033`, `TD-034`. Ferramentas: pnpm audit, scorecard, syft/grype, Docker Scout. Risco: CI e artefatos nao reprodutiveis. Prioridade: P1/P2. Proximos passos: pinning, SBOM, automacao de updates.

### 22. Privacidade e LGPD

Achados: `TD-001`, `TD-009`, `TD-012`, `TD-038`. O que foi verificado: campos pessoais no schema, testes consent/retention, env. Limitacao: sem analise runtime de logs reais. Ferramentas: DLP scanning, tests de export/delete. Risco: dados sem escopo e fluxos LGPD sem gate. Prioridade: P1/P2. Proximos passos: reativar testes e revisar logs/retencao.

### 23. Permissoes e matriz de autorizacao

Achados/suspeitas: `TD-013`, `TD-014`, `TD-015`, `TD-036`. Confirmacao positiva: testes manuais auth/security/billing passaram 25/25. Limitacao: matriz completa nao foi derivada. Ferramentas: RBAC matrix tests, negative tests. Prioridade: P1. Proximos passos: ampliar regra tenant e testes negativos.

### 24. Agentes, IA, LLM e tool calling

Achados: `TD-031`, `TD-032`. Confirmacao positiva: testes `runtime.tools*` passaram para allowlist/db-write/tenant audit selecionados. Limitacao: prompt injection e exfiltracao nao comprovados. Ferramentas: adversarial evals, policy tests, cost limits. Prioridade: P1. Proximos passos: suite de seguranca de agentes.

### 25. Resiliencia operacional

Achados: `TD-016`, `TD-031`. Confirmacoes positivas: ha timeouts em `httpTool`, `fetchWithTimeout`, workflows-core e rate limiting. Limitacao: nao houve teste de caos/circuit breaker real. Ferramentas: fault injection, load tests. Prioridade: P1/P2. Proximos passos: timeout padrao em todo fetch e cancelamento real.

### 26. Backup, rollback e recuperacao

Achados: `TD-010`, `TD-040`. O que foi verificado: scripts e docs. Limitacao: nenhum restore real foi executado. Ferramentas: restore drill automatizado. Prioridade: P2/P3. Proximos passos: runbook e teste em banco descartavel.

### 27. Infraestrutura e ambiente

Achados: `TD-002`, `TD-026`, `TD-027`. O que foi verificado: Dockerfile, compose, K8s, Cloud Run. Limitacao: nao houve deploy. Ferramentas: hadolint, kubeconform, trivy/grype. Prioridade: P1/P2. Proximos passos: digest, secrets externos e versao Node unica.

### 28. Versionamento, release e compatibilidade

Achados: `TD-010`, `TD-027`, `TD-034`. Limitacao: tags/releases nao foram auditadas via Git remoto. Ferramentas: release-drafter, changelog checks. Prioridade: P2. Proximos passos: compatibilidade migration/release.

### 29. Experiencia de desenvolvedor

Achados: `TD-006`, `TD-007`, `TD-027`, `TD-028`, `TD-039`. Risco: setup local e verificacoes inconsistentes. Ferramentas: devcontainer, scripts cross-platform. Prioridade: P1/P2. Proximos passos: comando unico `pnpm check`.

### 30. Qualidade de dados

Achados: `TD-011`, `TD-012`, `TD-010`. Suspeitas/manual: soft delete, historico e dedupe por importacao. Ferramentas: DB constraints, data quality checks. Risco: dinheiro impreciso, dados sem escopo, migrations sem governanca. Prioridade: P1. Proximos passos: invariantes no schema e testes de integridade.

## Limitacoes

Nao foram instaladas ferramentas. Nao foi usado banco real. Nao foram executados comandos destrutivos, deploy, migrate status contra banco, Lighthouse, axe, bundle analyzer, Semgrep local, gitleaks local, trufflehog ou scans de container. Quando a evidencia automatica nao foi suficiente, o status foi marcado como suspeita forte ou verificacao manual necessaria.
