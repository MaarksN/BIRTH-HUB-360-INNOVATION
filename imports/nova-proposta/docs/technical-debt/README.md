# Technical Debt Program

Programa central de rastreabilidade de divida tecnica do monorepo.

## Artefatos

- Tracker de origem: `docs/technical-debt/tracker.json`
- Dashboard atual: `docs/technical-debt/dashboard.md`
- Velocidade por sprint: `docs/technical-debt/velocity.md`
- Debt-to-feature ratio: `docs/technical-debt/debt-feature-ratio.md`
- Relatorio executivo: `docs/technical-debt/executive-report.md`
- Checklist HTML de execucao: `docs/technical-debt/checklist.html`
- Changelog tecnico: `docs/technical-debt/CHANGELOG.md`
- Governanca de IDs: `docs/technical-debt/td-id-governance.md`
- Reconciliacao entre catalogos: `audit/td-catalog-reconciliation.md`

## Matriz atual

| Dominio | Situacao | Risco residual | Evidencia |
| --- | --- | --- | --- |
| Documentation | Fechada | low | F10 hub, README, onboarding |
| Operations | Fechada | low | deploy, rollback, DR runbooks |
| Tooling | Fechada | low | link checker, dependency graph, CI |
| Governance | Fechada | low | tracker, dashboard, executive report |
| API | Remanescente | high | OpenAPI ainda parcial no `apps/api` |
| Architecture | Remanescente | medium | superficies legadas ainda ativas |
| Enablement | Em execucao | medium | KT recordings e sign-off dependem de sessoes humanas |

## Processo de registro de nova divida

1. Abrir issue usando `.github/ISSUE_TEMPLATE/tech-debt.yml`.
2. Definir owner, prioridade, prazo e risco residual.
3. Atualizar `docs/technical-debt/tracker.json` quando a divida mudar de estado.
4. Referenciar o item com namespace oficial (`PROGRAM-TD-*`, `MASTER-TD-*`, `APR-TD-*`) em qualquer documento novo.
5. Rodar `pnpm audit:td-catalog` para regenerar a reconciliacao entre catalogos.
6. Rodar `pnpm docs:health` para regenerar dashboard, velocidade e relatorio executivo.
7. Referenciar a evidencia em changelog tecnico e no PR correspondente.

## Prioridade e SLA interno

- `P1`: precisa owner ativo no sprint atual.
- `P2`: pode entrar no proximo sprint, mas com prazo e mitigacao visiveis.
- `P3`: backlog monitorado, sem bloquear release.

## Automacao

- `pnpm docs:health` atualiza o dashboard tecnico e os relatorios derivados.
- `pnpm audit:td-catalog` materializa a reconciliacao e colisao entre IDs de divida.
- O workflow de CI executa `pnpm docs:verify` e publica o dashboard como artefato.
