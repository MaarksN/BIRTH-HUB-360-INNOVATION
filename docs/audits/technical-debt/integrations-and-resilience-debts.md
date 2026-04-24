# Dividas de Integracoes e Resiliencia

## Integracoes

Achados confirmados:

- `TD-003` - segredos/tokens em query string para provedores externos.
- `TD-016` - webhook receiver encaminha chamadas para API sem timeout.

Suspeitas fortes:

- `TD-014` - isolamento tenant em webhook Zenvia depende de contexto/segredo e precisa de teste negativo.
- `TD-015` - bypass de assinatura por `trustedContext` precisa de revisao de rotas internas.

## Resiliencia operacional

Pontos positivos:

- Existem `fetchWithTimeout`, `AbortSignal.timeout` em parte dos clientes e `httpTool`.
- Workflows-core tem circuit breaker para HTTP.
- Queue runtime possui conceitos de backpressure, retry e DLQ.

Dividas:

- Nem todo `fetch` usa timeout. Exemplo confirmado: `apps/webhook-receiver/src/index.ts:562-569` e `:584-588`.
- `BaseTool` usa `Promise.race` sem cancelar a operacao subjacente (`packages/agents-core/src/tools/baseTool.ts:70-80`).
- Nao foi executado teste de chaos/falha externa para circuit breaker, DLQ ou retry storm.

## Webhooks

Arquivos revisados: `apps/webhook-receiver/src/index.ts`, `apps/api/src/modules/connectors/service.ts`, testes de billing/security.

Riscos:

- webhook falso se bypass interno for mal protegido
- fila/processo preso por chamada externa sem timeout
- processamento cross-tenant se identificador de conta externa for ambiguo

## Ferramentas recomendadas

Contract tests de payload externo, MSW/nock, fault injection, testes de idempotencia, Semgrep custom para `fetch(` sem timeout, testes de assinatura por provider.

## Proximos passos

1. Proibir `fetch` direto sem timeout em services/receivers.
2. Criar suite de webhooks maliciosos e replay.
3. Validar idempotency key e assinatura por provider.
4. Testar DLQ/backoff/ack-nack em workers.
5. Padronizar logs de integracao com requestId/tenantId mascarados.
