# ADR-0001: Repository Boundaries

Status: Aceita

## Contexto

O monorepo separa superficies executaveis em `apps/*` e capacidades reutilizaveis em `packages/*`. Auditorias anteriores apontaram risco de acoplamento entre controllers, Prisma, workers, web e pacotes de dominio.

## Decisao

- `apps/*` podem depender de `packages/*`.
- `packages/*` nao podem depender de `apps/*`.
- `packages/*` devem expor contratos publicos pelo seu `package.json`.
- Controllers/routers devem permanecer finos e delegar regras de negocio para services ou packages.
- Acesso Prisma direto em router so e permitido quando documentado como borda operacional/admin e coberto por auth/tenant guard.
- Scripts podem orquestrar ferramentas, mas nao devem virar runtime compartilhado.

## Consequencias

- Novas quebras de boundary devem aparecer em `pnpm audit:boundaries`.
- Excecoes precisam de justificativa no relatorio gerado em `artifacts/local-remediation`.
- Refactors estruturais devem apontar para este ADR e para o CODEOWNERS responsavel.
