# Dividas de Banco de Dados

## Achados confirmados

- `TD-010` - `db:check:governance` falhou por migrations ausentes no registry.
- `TD-011` - `AgentBudget.limitBrl`, `AgentBudget.consumedBrl` e `AgentBudgetEvent.costBrl` usam `Float`.
- `TD-012` - `BillingEvent` e `DatasetExport` permitem `tenantId`/`organizationId` nullable.
- `TD-007` - script de teste do pacote database roda zero testes.

## Evidencias

- `packages/database/prisma/schema.prisma:280-281`, `:301`.
- `packages/database/prisma/schema.prisma:740-741`.
- `packages/database/prisma/schema.prisma:957-958`.
- `packages/database/package.json:28`.
- Comando `pnpm --filter @birthub/database db:check:governance` retornou FAIL para `20260420000100_phase2_1_hubspot_hardening` e `20260422000100_phase3_workflow_events`.

## Verificacoes positivas

- `pnpm --filter @birthub/database exec prisma validate --schema prisma/schema.prisma` passou.
- `db:check:tenancy`, `db:check:fk` e `db:check:joins` passaram.

## Limitacoes

- `prisma migrate status` nao foi executado porque poderia depender de banco real.
- RLS foi inspecionado estaticamente e por testes existentes, mas suites que exigem banco real podem pular quando `DATABASE_URL` nao esta configurado.
- Soft delete, constraints de negocio e outbox foram avaliados apenas estaticamente.

## Riscos

Valores monetarios em ponto flutuante podem gerar divergencia financeira. Eventos/exportacoes sem tenant obrigatorio dificultam LGPD, auditoria e isolamento. Migrations fora do registry reduzem confianca em rollback.

## Recomendacoes

1. Corrigir registry de migrations e tornar gate bloqueante.
2. Migrar BRL para centavos `Int` ou `Decimal` com plano de compatibilidade.
3. Revisar modelos nullable por escopo: global documentado ou tenant obrigatorio.
4. Corrigir script de testes do pacote database.
5. Executar restore/migration status em ambiente descartavel.

## Testes recomendados

- `pnpm --filter @birthub/database db:check:governance`
- `pnpm --filter @birthub/database test`
- testes de migracao forward/backward em banco temporario
- testes de arredondamento/reconciliacao de orcamento
- testes negativos de tenant null em dados sensiveis
