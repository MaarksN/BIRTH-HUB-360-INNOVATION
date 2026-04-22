# Internal Packages Changelog

Use este arquivo quando qualquer `apps/*/package.json`, `packages/*/package.json` ou `agents/*/package.json` for alterado.

## 2026-04-19

### Worker manifest recovery

- restaurado o `package.json` canônico de `@birthub/worker` depois que um placeholder JSON inválido chegou ao `main`, realinhando scripts, dependências e governança de lockfile nos jobs de CI.

### TypeScript NodeNext bootstrap

- forçado `tsc -b --force` em `@birthub/config`, `@birthub/logger`, `@birthub/database`, `@birthub/agents-core` e `@birthub/workflows-core`, evitando que `tsconfig.tsbuildinfo` versionado impeça a emissão de `dist/*.d.ts` em checkouts limpos.
- movido o `tsBuildInfoFile` desses pacotes para `dist/`, evitando dirty-tree em jobs que executam build durante `pnpm install`.
- mantidos os `exports` em runtime apontando para `dist/*.js`, para que runners com `tsx` não resolvam arquivos `.d.ts` como módulos executáveis.

### Worker dependency hygiene

- removida a dependência workspace não usada de `@birthub/api` em `@birthub/worker`, mantendo o scorecard de dead-code sem regressões e o lockfile governado sincronizado.

### Database Prisma bootstrap in CI

- `@birthub/database` agora executa `db:generate` no `prebuild`, garantindo que o Prisma Client tipado exista antes do `tsc` em installs frios, Docker builds e workflows reutilizáveis de CI.
- simplificado o `postinstall` raiz para confiar na ordem correta do lifecycle do pacote `database`, evitando compilar o workspace antes da geração do client do schema canônico.

## 2026-04-15

### Workflows core dependencies

- `@birthub/workflows-core` agora declara dependência direta de `@birthub/logger` e expõe um `tsconfig.eslint.json` dedicado para lint/typecheck sem incluir testes no build, alinhando o bootstrap de CI das rotas de plataforma.

## 2026-03-31

### Database CI bootstrap lane

- adicionado `db:bootstrap:ci` em `@birthub/database` e no workspace root para materializar bancos efemeros de CI com `migrate deploy`; o drift historico de indexes/defaults/FKs passou a ficar versionado em migration dedicada em vez de depender de `db push`
- alinhados os jobs `platform`, `workflow-suite` e `security-guardrails` para usar bootstrap de schema compatível com testes, sem acoplar os runners ao checklist pós-migração de release

### Next.js package export alignment

- adicionados subpaths `./nextjs` em `@birthub/config`, `@birthub/logger` e `@birthub/workflows-core` para estabilizar a resolucao do web app no Turbopack/Next durante CI e E2E
- alinhado o bootstrap do pipeline para reinstalar o lockfile e manter os exports internos consistentes entre build local e GitHub Actions

## 2026-03-22

### Repository hygiene baseline (F9)

- adicionados guardrails de branch, commit, naming, links e artifacts no CI
- documentadas políticas de naming, source of truth de documentação e aprovação de dependências
- consolidado o relatório de saúde estrutural do monorepo em `artifacts/doctor/`

### Runtime overlay script compliance (F4)

- adicionados `lint`, `typecheck`, `test` e `build` visíveis com `N/A` formal para `ae-agent-worker`, `analista-agent-worker`, `financeiro-agent-worker`, `juridico-agent-worker`, `ldr-agent-worker`, `marketing-agent-worker`, `pos_venda-agent-worker` e `sdr-agent-worker`
- alinhada `scripts/ci/script-compliance-policy.json` com o estado real de `@birthub/shared` e `@birthub/shared-types`
- Adjusted  and fixed CI artifacts generation
test
