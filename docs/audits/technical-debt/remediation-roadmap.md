# Roadmap de Remediacao

Plano recomendado em fases. Nao marca nenhum item como resolvido; define ordem, dependencias, riscos, criterios de aceite e comandos de validacao.

## FASE 0 - Seguranca critica e vazamento de dados

Escopo: `TD-001`, `TD-002`, `TD-003`, `TD-015`, parte de `TD-022`/`TD-023`.

Ordem recomendada:

1. Rodar gitleaks/trufflehog em historico completo.
2. Rotacionar credenciais potencialmente expostas.
3. Remover tokens de query string.
4. Revisar bypass `trustedContext` de webhooks.
5. Pinning emergencial de scanners/actions mais sensiveis.

Dependencias: acesso a secret manager, owners de integracoes e CI.

Riscos: rotacao pode quebrar ambientes se nao houver inventario.  
Critérios de aceite: zero secrets verificados no historico, tokens fora de URLs, webhook interno com autenticacao forte, CI scanner pinado.

Comandos:

```bash
gitleaks detect --source . --redact --no-banner
trufflehog git file://. --only-verified
pnpm audit --audit-level low
```

## FASE 1 - Multi-tenancy, RBAC e matriz de permissoes

Escopo: `TD-013`, `TD-014`, `TD-012`, `TD-020`, `TD-036`.

Ordem:

1. Criar matriz role/permission/tenant/ownership.
2. Ampliar regra `no-unscoped-prisma-query`.
3. Corrigir/justificar modelos nullable.
4. Criar testes negativos cross-tenant.
5. Corrigir `pnpm test:isolation`.

Critérios de aceite: queries sensiveis com tenant/ownership, suite negativa rodando no CI, admin global separado de admin tenant.

Comandos:

```bash
pnpm exec eslint apps/api apps/worker
pnpm test:isolation
node --import tsx --test apps/api/tests/*tenant*.test.ts apps/api/tests/*rbac*.test.ts
```

## FASE 2 - Banco, transacoes, idempotencia e concorrencia

Escopo: `TD-010`, `TD-011`, `TD-012`, `TD-040`.

Ordem:

1. Corrigir registry de migrations.
2. Planejar migracao de `Float` monetario.
3. Revisar constraints/indices/nullable.
4. Validar idempotencia de webhooks/jobs.
5. Fazer restore drill em ambiente descartavel.

Critérios de aceite: governanca passa, valores monetarios sem float, restore testado, constraints documentadas.

Comandos:

```bash
pnpm --filter @birthub/database db:check:governance
pnpm --filter @birthub/database exec prisma validate --schema prisma/schema.prisma
pnpm --filter @birthub/database test
```

## FASE 3 - Typecheck, lint, dead code e qualidade base

Escopo: `TD-004`, `TD-005`, `TD-017`, `TD-018`, `TD-019`.

Ordem:

1. Separar erros por prod/test/scripts.
2. Fechar typecheck global.
3. Reduzir `any` e supressoes.
4. Adicionar detector de ciclos.
5. Definir politica para `imports/`.

Critérios de aceite: typecheck verde, novas supressoes bloqueadas, ciclos com allowlist.

Comandos:

```bash
pnpm exec tsc -p tsconfig.json --noEmit --incremental false
pnpm exec eslint .
madge --circular apps packages
jscpd apps packages
```

## FASE 4 - Testes criticos e coverage

Escopo: `TD-006`, `TD-007`, `TD-008`, `TD-009`, `TD-021`.

Ordem:

1. Trocar scripts `sh -c` por runner Node cross-platform.
2. Corrigir database test.
3. Reativar suites puladas.
4. Criar `test:coverage`.
5. Publicar coverage por pacote.

Critérios de aceite: API/Web/Worker/Database testam no Windows e Linux; coverage real gerado; skips criticos justificados.

Comandos:

```bash
pnpm --filter @birthub/api test
pnpm --filter @birthub/web test
pnpm --filter @birthub/worker test
pnpm --filter @birthub/database test
pnpm test:coverage
```

## FASE 5 - Arquitetura e boundaries

Escopo: modulos grandes e ciclos.

Ordem:

1. Criar dependency rules.
2. Extrair contratos dos modulos grandes.
3. Separar controller/service/domain/infra onde houver maior risco.

Critérios de aceite: boundaries automatizados, ciclos removidos ou documentados, refactors cobertos por testes.

Comandos:

```bash
depcruise apps packages
pnpm exec eslint .
```

## FASE 6 - Observabilidade e operacao

Escopo: `TD-029`, `TD-030`.

Ordem:

1. Padronizar schema de logs.
2. Redigir tokens/PII.
3. Garantir requestId/correlationId.
4. Revisar health/readiness e dashboards.

Critérios de aceite: logs estruturados sem campos duplicados e com redacao testada.

Comandos:

```bash
node --import tsx --test apps/api/tests/audit-redaction.test.ts
rg -n "console\\.(log|error|warn|info)" apps packages
```

## FASE 7 - Integracoes, resiliencia e filas

Escopo: `TD-003`, `TD-016`, webhooks, retry/backoff/DLQ.

Ordem:

1. Cliente HTTP padrao com timeout.
2. Tests de replay/idempotencia.
3. Fault injection para API externa indisponivel.
4. DLQ/backoff/dedupe verificados.

Critérios de aceite: nenhum fetch externo sem timeout; webhooks idempotentes e assinados.

Comandos:

```bash
rg -n "fetch\\(" apps packages
node --import tsx --test apps/api/tests/*webhook*.test.ts apps/worker/test/*webhook*.test.ts
```

## FASE 8 - Agentes, IA e tool calling seguro

Escopo: `TD-031`, `TD-032`.

Ordem:

1. Propagar AbortSignal em tools.
2. Suite adversarial de prompt injection.
3. Approval obrigatorio para tools sensiveis.
4. Budgets de token/custo/tempo.
5. Logs de decisao auditaveis.

Critérios de aceite: adversarial tests verdes, tools cancelaveis, human approval para acoes destrutivas.

Comandos:

```bash
node --import tsx --test apps/worker/src/agents/*.test.ts packages/agents-core/src/**/*.test.ts
```

## FASE 9 - Frontend, UX, acessibilidade e i18n

Escopo: `TD-008`, `TD-035`, `TD-036`, `TD-037`.

Ordem:

1. Corrigir i18n quebrado.
2. Rodar axe/Lighthouse.
3. Component tests para fluxos criticos.
4. Confirmacoes para acoes destrutivas.
5. Loading/error/empty states auditados.

Critérios de aceite: testes web verdes, zero a11y critica, confirmacao para destructive actions.

Comandos:

```bash
pnpm --filter @birthub/web test
pnpm exec playwright test
lighthouse http://localhost:3001
```

## FASE 10 - Supply chain, CI/CD, release e documentacao

Escopo: `TD-022`, `TD-023`, `TD-024`, `TD-025`, `TD-026`, `TD-033`, `TD-034`.

Ordem:

1. Pinning por SHA/digest.
2. Renovate/Dependabot.
3. SBOM no CI.
4. Audit e license gates.
5. Changelog/release checklist.

Critérios de aceite: actions/images pinadas, SBOM artifact, update PRs automaticos.

Comandos:

```bash
pnpm audit --audit-level low
syft . -o cyclonedx-json
grype .
actionlint
```

## FASE 11 - Privacidade, LGPD e qualidade de dados

Escopo: `TD-012`, `TD-038`, dados pessoais e retencao.

Ordem:

1. Reativar consent/retention tests.
2. Classificar campos PII.
3. Testar export/delete.
4. DLP scan de fixtures/logs/seeds.
5. Politica de retencao e expurgo.

Critérios de aceite: testes LGPD verdes, PII mascarada, exclusao/exportacao auditadas.

Comandos:

```bash
node --import tsx --test apps/api/tests/consent.service.test.ts apps/api/tests/retention.service.test.ts
rg -n "email|phone|cpf|document|birthDate|ipAddress" apps packages tests
```

## FASE 12 - Developer experience e manutencao continua

Escopo: `TD-006`, `TD-007`, `TD-027`, `TD-028`, `TD-039`.

Ordem:

1. Criar devcontainer/toolchain.
2. Padronizar comandos cross-platform.
3. Criar `pnpm check`.
4. Pre-commit/lint-staged ou alternativa.
5. Auditoria recorrente.

Critérios de aceite: setup novo reproduzivel, checks locais iguais ao CI, ferramentas de auditoria versionadas.

Comandos:

```bash
pnpm check
node -v
pnpm -v
semgrep --version
gitleaks version
```
