# Artifacts Policy

Este documento define quais arquivos são permitidos no diretório `artifacts/`. O repositório segue rigorosamente estas políticas:

## 1. O que NÃO PODE ser versionado no Git em `artifacts/`
- Cópias de bancos de dados (`.sqlite`, `.db`).
- Logs transitórios de CI/CD não estruturados que expiram rápido.
- Screenshots de testes end-to-end ou Playwright trace files gerados em tempo de pipeline (devem ir para o storage S3 do CI).
- Artefatos de compilação ou binários (`.exe`, `.bin`).

*(Estes itens já estão garantidos no `.gitignore` na raiz do projeto).*

## 2. O que DEVE ser versionado em `artifacts/`
- **Audit e Compliance**: Relatórios forenses aprovados (como o `forensic_report.html`) que garantem a rastreabilidade cross-agent e que **necessitam de retenção histórica**.
- **Snapshots de Agentes Executivos**: Exportações que registram o estado e metadados dos agentes em um ponto crítico no tempo.
- **Evidências Formais de CI**: Mapas de falhas (`ci_failures_map.md`) gerados no fechamento de releases, ou relatórios estatísticos (LCOV JSON, relatórios de payload reduzido, logs de validação de ambiente/preflights).

## 3. Limpeza Automática
O CI/CD tem um job configurado (ou deverá ter) para rotacionar artefatos não essenciais após 90 dias, mantendo apenas arquivos classificados como compliance `permanent`.
