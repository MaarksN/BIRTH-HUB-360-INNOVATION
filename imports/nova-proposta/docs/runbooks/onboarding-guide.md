# Guia de Onboarding Técnico

## Preparação de Ambiente Local (Alvo: < 1 Hora)
1. **Requisitos Básicos**: Node.js v22.22, pnpm `9.x`, Python `3.12+`.
2. **Dependências (Monorepo)**: Execute `pnpm install` na raiz.
3. **Variáveis de Ambiente**: Copie `.env.example` para `.env` (`pnpm config:init` se disponível).
4. **Infraestrutura**: Inicie o Docker com dependências (Postgres, Redis, Elastic) via `docker compose up -d postgres redis`.
5. **Banco de Dados**: Popule usando `pnpm db:migrate:dev` e `pnpm db:seed`.

## Primeiro Deploy e Fluxo de PR
- Sempre crie um branch com prefixo correto (`feat/`, `fix/`, `chore/`).
- O CI fará `typecheck`, `lint` (Regras: max-lines < 500, dependências não cruzadas) e `test`.
- Resolva todas as falhas reportadas em `audit/ci_failures_map.md` (se estiver trabalhando ativamente num ciclo de auditoria) ou na aba de PR checks do GitHub.
- Seu primeiro PR deve conter apenas atualizações não-críticas, como pequenos ajustes de documentação ou correção de typos em testes, para você validar o pipeline.

## FAQ
- P: "Recebo erro de TenantRequiredError no Prisma". R: Assegure-se de que a query no backend está encapsulada dentro de um `AsyncLocalStorage` ou que você não está importando diretamente do pacote legado `@birthub/db`.
- P: "Os agentes falham ao rodar em E2E". R: Verifique se os tokens foram semeados usando os limits corretos de `data.ts` (Plan limits = unlimited -> 100_000_000).
