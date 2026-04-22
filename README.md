# BirthHub 360 Monorepo

Base técnica do BirthHub 360 com aplicações, serviços e pacotes compartilhados no mesmo workspace `pnpm` + `turbo`.

## Requisitos

- Node.js **24.x**
- pnpm **9.15.9**

## Estrutura

- `apps/api`: API principal.
- `apps/web`: aplicação web.
- `apps/worker`: workers assíncronos.
- `apps/webhook-receiver`: receptor dedicado de webhooks.
- `packages/*`: bibliotecas de domínio, infraestrutura, contratos e utilitários.

## Comandos raiz (Fase 1)

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

## Padrões da base

- TypeScript unificado em `5.9.3` (via root + overrides).
- Configuração central de lint em `eslint.config.mjs`.
- Configuração central de formatação em `prettier.config.cjs`.
- Resolução de aliases e regras TS no `tsconfig.base.json`.

## Scripts úteis

- `pnpm dev`: inicia web + api + worker em paralelo.
- `pnpm format`: aplica Prettier no workspace.
- `pnpm db:generate`: gera client Prisma do pacote de database.

## Qualidade mínima para PR

Antes de abrir PR, garanta:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `git status` limpo (sem artefatos versionados)

Consulte [`CONTRIBUTING.md`](./CONTRIBUTING.md) e o checklist de PR.
