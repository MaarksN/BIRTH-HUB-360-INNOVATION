# Materialização Técnica de Itens Apenas Documentados

Gerado em: 2026-04-19T02:52:48.153Z

## Status dos controles

| Controle | Status | Detalhes |
| --- | --- | --- |
| codeowners-present | PASS | {} |
| f11-evidence-bundle-complete | PASS | {"missingF11Evidence":[]} |
| frozen-lockfile-in-workflows | PASS | {} |
| workflow-timeouts | WARN | {"missingTimeout":["docker-image.yml"]} |
| branch-protection-baseline | PASS | {"hasDevelopBranchProtection":true,"hasMainBranchProtection":true,"missingStatusChecksByBranch":{"develop":[],"main":[]},"missingStatusChecks":[]} |
| setup-node-version-pinned | PASS | {"setupNodeLines":["v4","v4","v4","v4","v4","v4","v4","v4"]} |
| setup-python-version-pinned | PASS | {"setupPythonLines":["v5","v5","v5","v5"]} |
| node-version-aligned-with-nvmrc | PASS | {"nvmrc":"24.14.0"} |
| python-version-aligned-with-python-version | PASS | {"pythonVersion":"3.12"} |
| pnpm-version-pinned-in-packageManager | PASS | {"packageManager":"pnpm@9.15.9"} |
| f11-docs-consistent-with-latest-closure | PASS | {"staleMentions":[]} |
| pr-template-merge-markers | PASS | {} |
| legacy-db-imports-quarantined | PASS | {"forbiddenImportHits":[]} |

## Resumo

- Blockers: 0
- Warnings: 1

### Warnings

- workflow-timeouts
