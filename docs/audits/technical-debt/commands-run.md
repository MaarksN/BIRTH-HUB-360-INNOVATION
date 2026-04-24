# Comandos Executados

Diretorio principal: `C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION`

## Reconhecimento

| Comando | Status | Saida resumida | Motivo |
| --- | --- | --- | --- |
| `git status --short` | OK | Worktree inicial sem alteracoes aparentes. | Confirmar baseline antes da auditoria. |
| `rg --files` | OK | 6.130 arquivos. | Inventario geral. |
| `rg --files -g '!node_modules' -g '!.next' -g '!.turbo' -g '!imports'` | OK | 2.845 arquivos relevantes. | Contagem sem gerados/sombra. |
| `Get-ChildItem` em raiz/apps/packages | OK | Apps: api, web, worker, webhook-receiver, voice-engine, legacy; diversos packages. | Mapear estrutura. |
| `Get-Content package.json`, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs` | OK | Identificou pnpm/Turbo, Node, scripts, TS permissivo e regra tenant limitada. | Reconhecimento de stack/config. |
| `node -v` | OK | `v24.15.0`. | Stack runtime. |
| `pnpm -v` | OK | `9.15.9`. | Gerenciador de pacotes. |

## Verificacoes de qualidade e tipagem

| Comando | Status | Saida resumida | Motivo |
| --- | --- | --- | --- |
| `pnpm exec tsc -p tsconfig.json --noEmit --incremental false` | Falhou | Exit 1; erros em testes, worker agents, webhook receiver, queue, llm-client e scripts. | Typecheck global seguro sem emitir arquivos. |
| `pnpm exec eslint .` | OK com warning | 1 warning: eslint-disable sem uso em snapshot de audit. | Lint global. |
| `rg` por `TODO`, `FIXME`, `HACK`, `XXX`, `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `console.log`, `JSON.parse`, `catch {}` | OK | Encontrou 187 TODO, 12 FIXME, 198 `any`, 171 `@ts-expect-error`, 211 `JSON.parse`, etc. | Detectar dividas textuais e tipagem fraca. |
| Detector estatico custom de ciclos com Node inline | OK | 1.028 arquivos importados, 2.469 imports internos, ciclos em queue, agents-core, clinical, sales-os e worker. | Substituir madge ausente sem instalar ferramenta. |
| Primeira tentativa de Node inline com heredoc estilo bash | Falhou | PowerShell nao aceitou sintaxe de heredoc. | Tentativa inicial de detector de ciclos. |

## Testes

| Comando | Status | Saida resumida | Motivo |
| --- | --- | --- | --- |
| `pnpm --filter @birthub/api test` | Falhou | Script usa `sh -c`/`find`; Windows retornou "O sistema nao pode encontrar o caminho especificado." | Verificar suite API padrao. |
| `pnpm --filter @birthub/web test` | Falhou | Mesmo problema de `sh -c`/`find`. | Verificar suite web padrao. |
| `pnpm --filter @birthub/worker test` | Falhou | Mesmo problema de `sh -c`/`find`. | Verificar suite worker padrao. |
| `pnpm --filter @birthub/database test` | OK, mas zero testes | Node test executou 0 suites. | Verificar suite database. |
| `node --import tsx --test --test-concurrency=1 apps/api/tests/auth.test.ts apps/api/tests/security.test.ts apps/api/tests/billing.webhook.test.ts` | OK | 25 testes passaram, 0 falharam. | Smoke manual de auth/security/billing. |
| `node --import tsx --test --test-concurrency=1 apps/worker/src/agents/runtime.tools.test.ts apps/worker/src/agents/runtime.tools.db-write.test.ts apps/worker/src/agents/runtime.orchestration.test.ts` | OK | 6 testes passaram, 0 falharam. | Smoke manual de agentes/tool policy. |
| `node --import tsx --test apps/web/tests/*.test.ts` | Falhou | 84 testes: 78 passaram, 2 falharam, 4 pulados; falhas em i18n. | Verificar suite web sem script quebrado. |
| `rg -n "test.skip|describe.skip|it.skip|\\.only"` | OK | Skips em retencao, consentimento, FHIR, clinico, web clinico e Playwright support. | Detectar testes desativados. |

## Banco de dados

| Comando | Status | Saida resumida | Motivo |
| --- | --- | --- | --- |
| `pnpm --filter @birthub/database exec prisma validate --schema prisma/schema.prisma` | OK | Prisma schema validado; warnings de config deprecated. | Validacao estatica do schema. |
| `pnpm --filter @birthub/database db:check:tenancy` | OK | PASS para modelos tenant-scoped. Gerou artefatos em `artifacts/database/f8`. | Auditar tenantId de schema. |
| `pnpm --filter @birthub/database db:check:fk` | OK | PASS para indices de FK. Gerou artefatos em `artifacts/database/f8`. | Auditar FK indexes. |
| `pnpm --filter @birthub/database db:check:joins` | OK | PASS para raw JOIN audit. Gerou artefatos em `artifacts/database/f8`. | Auditar JOINs crus. |
| `pnpm --filter @birthub/database db:check:governance` | Falhou | FAIL: migrations `20260420000100_phase2_1_hubspot_hardening` e `20260422000100_phase3_workflow_events` sem registry. | Verificar governanca de migrations. |

Observacao: estes comandos de banco criaram artefatos fora de `docs/audits/technical-debt/`. Eles nao alteraram banco real, migrations ou codigo de producao, mas o side effect de arquivo foi registrado aqui por transparencia.

## Dependencias e supply chain

| Comando | Status | Saida resumida | Motivo |
| --- | --- | --- | --- |
| `pnpm audit --audit-level low` | Falhou | 2 vulnerabilidades moderadas em `uuid` via `bullmq`. | Auditar vulnerabilidades. |
| `pnpm outdated -r --long` | Falhou esperado | Listou varias dependencias desatualizadas; exit 1 por haver updates. | Auditar atualizacoes. |
| `Get-Command semgrep/gitleaks/trufflehog/madge/dependency-cruiser/jscpd/depcheck/ts-prune/syft/grype/prisma` | Parcial | Ferramentas nao encontradas no PATH; Docker, pnpm e node encontrados. | Verificar ferramentas disponiveis sem instalar. |
| `rg --files -g '*dependabot*' -g '*renovate*'` | Sem resultados | Nenhuma config Dependabot/Renovate encontrada. | Detectar automacao de updates. |

## Seguranca, configuracao, integracoes e frontend

| Comando | Status | Saida resumida | Motivo |
| --- | --- | --- | --- |
| `git ls-files .env .env.local .env.example .env.vps.example ops/release/sealed/...` | OK | `.env`, exemplos e sealed envs rastreados; `.env.local` nao rastreado. | Detectar envs versionados. |
| Leitura mascarada de `.env` | OK | `DATABASE_URL` e `NODE_ENV` mascarados. | Evidencia sem vazar valor. |
| `rg -n "access_token=|api_token=|api_secret|token=\\$\\{|password=|Authorization|Bearer|console\\.(log|error|warn|info)"` | OK | Tokens em query string e consoles em webhook receiver. | Detectar vazamentos e logs. |
| `rg -n "process\\.env|dotenv|envsafe|zod.*env|createEnv|NEXT_PUBLIC_|DATABASE_URL|SESSION_SECRET|JWT_SECRET"` | OK | Uso amplo de env; tambem confirmou Zod/config package. | Auditar configuracao. |
| `rg -n '<button|<img|<input|<select|<textarea|aria-label|aria-live|aria-modal|role=\"button\"|onClick=' apps/web` | OK | Muitos componentes interativos; base para auditoria manual a11y. | Inspecionar frontend/a11y. |
| Primeira busca a11y com regex lookahead | Falhou | Regex quebrado no PowerShell/rg. | Tentativa inicial de detectar elementos sem label. |
| `rg -n "fetch\\(|axios|got\\(|undici|timeout|AbortController|retry|backoff|circuit|Queue|Worker\\("` | OK | Confirmou timeouts em partes do runtime e fetches sem timeout em webhook receiver. | Resiliencia. |
| `rg -n "openai|anthropic|gemini|llm|agent|tool call|toolCall|planner|executor|prompt injection|approval|allowlist|sandbox|max.*token|max.*cost"` | OK | Confirmou ampla presenca de agentes/LLM e guardrails em manifests; saida muito grande. | Auditar IA/agentes. |

## Comandos que nao foram executados

Ver `skipped-checks.md` para lista detalhada e motivo.
