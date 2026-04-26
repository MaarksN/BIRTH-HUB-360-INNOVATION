# Runbook: Incident Response

## Acionamento

Use este runbook para incidentes de auth, vazamento de dados, falha de webhook, DLQ crescente, indisponibilidade de API/worker ou erro de banco.

## Passos

1. Classificar severidade, tenants afetados e janela temporal.
2. Congelar deploys nao essenciais.
3. Preservar evidencias em `artifacts/local-remediation/<data>/`.
4. Verificar `pnpm security:guards`, logs redigidos e audit logs por `tenantId`.
5. Aplicar contencao: feature flag, rollback, pausa de fila, revogacao de token ou bloqueio de provider.
6. Registrar causa raiz, decisao e follow-up em issue de divida tecnica.

## Evidencias minimas

- Comandos executados.
- Hash/versao do deploy.
- Tenants afetados.
- Logs redigidos.
- Plano de rollback ou mitigacao aplicada.
