# Architecture Boundaries

## Regra de camadas

| Camada | Pode depender de | Nao pode depender de |
| --- | --- | --- |
| `apps/api` | `packages/*`, banco, filas, providers | `apps/web`, detalhes de UI |
| `apps/web` | contratos, clientes HTTP, tipos compartilhados | Prisma direto, worker runtime |
| `apps/worker` | queue, logger, database, workflows | componentes web |
| `packages/*` | outros packages explicitos | `apps/*` |
| `scripts/*` | ferramentas e packages | ser dependencia de runtime |

## Gates

- `pnpm audit:boundaries` gera relatorio local em `artifacts/local-remediation/boundaries-report.md`.
- `pnpm lint` aplica regras de tenancy em arquivos criticos.
- `pnpm typecheck` garante contratos publicos.

## Excecoes conhecidas

Rotas admin e break-glass podem consultar Prisma diretamente quando isso for parte da borda operacional, desde que tenham auth/role guard, tenant scoping e audit log.
