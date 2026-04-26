# Observability Alerts

## Alertas minimos

| Sinal | Severidade | Fonte | Acao |
| --- | --- | --- | --- |
| Aumento de 401/403 em rota sensivel | P1 | API logs / metrics | Validar auth abuse, tenant switch e IPs |
| DLQ crescente | P1 | queue metrics | Seguir `docs/runbooks/dlq-and-retry.md` |
| Webhook com falha permanente | P1 | worker/webhook logs | Pausar provider ou reprocessar lote pequeno |
| Erro de DB ou migration drift | P0 | `pnpm db:check:all` / readiness | Congelar deploy e acionar data owner |
| Falha de redaction/security guard | P0 | `pnpm security:guards` | Bloquear release |
| Latencia API p95 acima do alvo | P2 | API metrics | Abrir issue de performance |
| OTEL exporter indisponivel | P2 | worker/api config | Verificar endpoint e fallback de logs |

## Evidencias

- `packages/config/src/api.config.ts`
- `packages/config/src/worker.config.ts`
- `apps/worker/src/observability/otel.ts`
- `packages/queue/tests/runtime.test.ts`
