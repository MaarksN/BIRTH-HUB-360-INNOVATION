# TD ID Governance

## Objetivo
Eliminar ambiguidade entre catalogos de divida que reutilizam o mesmo bare ID `TD-xxx` para problemas diferentes.

## Fonte oficial a partir de 2026-04-08

- Programa tecnico interno: `PROGRAM-TD-xxx`
- Relatorio master de go-live: `MASTER-TD-xxx`
- Auditor-prime soberano: `APR-TD-xxx`

Bare IDs como `TD-001` ficam preservados apenas dentro dos artefatos historicos originais. Em qualquer documento novo, PR, issue, baseline ou runbook, o uso de `TD-001` sem namespace passa a ser invalido.

## Artefatos canônicos

- Politica humana: `docs/technical-debt/td-id-governance.md`
- Reconciliacao gerada: `audit/td-catalog-reconciliation.md`
- Reconciliacao estruturada: `audit/td-catalog-reconciliation.json`
- Espelho de artifact: `artifacts/technical-debt/td-catalog-reconciliation-latest.json`

## Regra de citacao

1. Na primeira mencao, usar o ID namespaced completo.
2. Se necessario, citar o alias historico uma unica vez.
3. Em tabelas com multiplos catalogos, incluir a coluna `fonte`.

Exemplos validos:

- `MASTER-TD-001 (alias historico TD-001 no relatorio master)`
- `PROGRAM-TD-004`
- `APR-TD-031`

Exemplos invalidos em novos textos:

- `TD-001`
- `TD-004`
- `TD-031`

## Operacao do ciclo

- Comando de refresh: `node scripts/audit/reconcile-td-catalog.mjs`
- Atalho de workspace: `pnpm audit:td-catalog`
- Quando um novo catalogo surgir, ele deve ganhar namespace proprio antes de publicar IDs `TD-*`.
