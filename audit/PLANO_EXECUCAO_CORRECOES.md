# PLANO EXECUÇÃO CORREÇÕES

## Escopo executado nesta rodada
1. Baseline forense com comandos reais (`install`, `lint`, `typecheck`, `test`, `build`).
2. Correção localizada para falso negativo de integração quando DB indisponível.
3. Revalidação com serviços locais para provar estado real dos bloqueadores.

## Correções implementadas
### C1 — Guard de conectividade para testes de integração de banco
- Arquivo novo: `packages/database/test/database-availability.ts`
- Arquivos alterados:
  - `packages/database/test/migration.test.ts`
  - `packages/database/test/rls.test.ts`
- Resultado:
  - Sem DB acessível: testes de integração são `skipped` com motivo explícito.
  - Com DB acessível: cenários executam e revelam falha real de RLS.

## Correções pendentes por prioridade
1. **P0** Corrigir validação e/ou política efetiva de RLS (`TD-002`, `TD-009`).
2. **P0** Remover drift de schema (`TD-003`).
3. **P0** Persistir refresh token store (`TD-001`).
4. **P1** Convergir DLQ thresholds em doc/regra (`TD-005`, `TD-010`).

## Validação executada
- `pnpm lint` ✅
- `pnpm typecheck` ✅
- `pnpm build` ✅
- `pnpm test` ❌ (falha crítica de RLS com DB real)
- `pnpm db:migrate:deploy` ❌ (schema drift no pós-check)

## Conclusão operacional da execução
A rodada removeu ruído de falso negativo sem esconder problema real. O estado atual continua bloqueado para produção por fundamentos não resolvidos (RLS + drift + sessão).
