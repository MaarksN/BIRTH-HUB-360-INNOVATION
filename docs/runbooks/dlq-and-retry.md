# Runbook: DLQ And Retry

## Objetivo

Padronizar resposta para falhas persistentes em filas, webhooks e workers.

## Sinais

- Crescimento de DLQ.
- Reprocessamento repetido do mesmo `externalEventId` ou `idempotencyKey`.
- Falha permanente de provider externo.

## Procedimento

1. Identificar fila, tenant, provider e chave idempotente.
2. Confirmar se o erro e fatal, retryable ou duplicado.
3. Bloquear reprocessamento automatico quando houver risco de side effect duplicado.
4. Reprocessar em lote pequeno com evidencia de antes/depois.
5. Registrar decisao em audit log ou issue operacional.

## Evidencias

- `packages/queue/tests/workers.test.ts`
- `packages/queue/tests/runtime.test.ts`
- `packages/integrations/src/shared/idempotency.ts`
