# Artifacts

Esta pasta guarda somente saídas versionadas que fazem parte da evidência formal do repositório.

## O que fica aqui

- `artifacts/baseline/`: snapshots e manifestos de baseline auditável.
- `artifacts/release/`: preflight, smoke, rollback, catálogos e logs arquivados de release.
- `artifacts/quality/`, `artifacts/security/`, `artifacts/privacy/`: relatórios e baselines por domínio.
- `artifacts/audit/`: espelhos derivados e saídas analíticas pesadas que não pertencem à área canônica de `audit/`.
- `artifacts/f11-*`, `artifacts/ownership-governance/`, `artifacts/materialization/`: evidências históricas deliberadamente preservadas.

## O que não fica aqui

- logs transitórios de execução local;
- dumps temporários;
- arquivos `.env`, credenciais ou saídas locais não reprodutíveis.

## Regra prática

Se o arquivo precisa ser rastreado como prova, baseline ou evidência de release, ele entra em `artifacts/`.
Se ele serve só para execução local ou troubleshooting momentâneo, ele fica em `logs/` e não deve ser versionado.
