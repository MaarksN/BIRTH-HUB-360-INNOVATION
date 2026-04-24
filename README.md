# BirthHub 360 Monorepo

BirthHub 360 e uma plataforma SaaS B2B de automacao comercial e RevOps com agentes autonomos.

Em uma frase: o BirthHub 360 e um sistema operacional de receita, onde times de vendas, marketing, CS, financeiro, juridico e lideranca usam agentes, workflows e integracoes para executar tarefas com governanca, rastreabilidade e escala.

## Foco do Produto

- Centralizar a operacao comercial em um dashboard unico.
- Oferecer um Sales OS para SDR, BDR, closers, CS, RevOps, financeiro, risco e executivos.
- Permitir instalar, governar e executar agentes de IA especializados.
- Automatizar tarefas repetitivas com workflows e integracoes.
- Integrar CRM, canais de comunicacao, webhooks, billing e sistemas operacionais.
- Manter trilha de execucao, custo, politicas, historico e auditoria.

O foco unico da ferramenta e atender a operacao comercial de qualquer empresa. Os agentes autonomos assumem o trabalho operacional que pode ser delegado, enquanto humanos ficam com relacionamento, julgamento, estrategia, criatividade e decisoes sensiveis.

## Quem Atende

- Times comerciais.
- SDR, BDR e LDR.
- Gestores de vendas e RevOps.
- Marketing e growth.
- CS, suporte e pos-venda.
- Financeiro, juridico e compliance.
- Lideranca C-level e conselho.

## Dor que Resolve

Empresas B2B costumam operar com contexto espalhado, tarefas manuais, handoffs ruins e pouca previsibilidade. O BirthHub 360 transforma essa operacao em um fluxo previsivel, automatizado e auditavel, reduzindo retrabalho e dando aos humanos mais tempo para desempenhar seu papel de maior valor.

## Base Tecnica

Base tecnica do BirthHub 360 com aplicacoes, servicos e pacotes compartilhados no mesmo workspace `pnpm` + `turbo`.

## Requisitos

- Node.js **24.x**
- pnpm **9.15.9**

## Estrutura

- `apps/api`: API principal.
- `apps/web`: aplicação web.
- `apps/worker`: workers assíncronos.
- `packages/*`: bibliotecas de domínio, infraestrutura, contratos e utilitários.

## Comandos raiz (Fase 1)

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm clean
```

## Padrões da base

- TypeScript unificado em `5.9.3` (via root + overrides).
- Configuração central de lint em `eslint.config.mjs`.
- Configuração central de formatação em `prettier.config.cjs`.
- Resolução de aliases e regras TS no `tsconfig.base.json`.

## Scripts úteis

- `pnpm dev`: inicia web + api + worker em paralelo.
- `pnpm format`: aplica Prettier no workspace.
- `pnpm clean`: remove saídas locais de build/cache (`dist`, `.next`, `.turbo`, `*.tsbuildinfo`).
- `pnpm db:generate`: gera client Prisma do pacote de database.
- `pnpm --filter @birthub/database test:isolation`: roda validações que podem exigir banco real/RLS.

## Qualidade mínima para PR

Antes de abrir PR, garanta:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `git status` limpo (sem artefatos versionados)

Consulte [`CONTRIBUTING.md`](./CONTRIBUTING.md) e o checklist de PR.
