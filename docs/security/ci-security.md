# CI Security

O hardening de CI da Fase 2 passa a rodar em dois workflows:

- `/.github/workflows/security-codeql.yml`: executa CodeQL em `javascript-typescript`, gera SARIF e falha o pipeline quando houver finding com `security-severity >= 9.0`.
- `/.github/workflows/security-guardrails.yml`: roda Semgrep, Gitleaks e a política de licenças de dependências.

## Gates aplicados

- `CodeQL`: findings críticos (`security-severity >= 9.0`) bloqueiam o job via `scripts/ci/assert-sarif-threshold.mjs`.
- `Semgrep`: findings `ERROR` no policy file `.semgrep/security.yml` quebram o job.
- `Gitleaks`: qualquer segredo detectado no workspace quebra o job.
- `Licenças`: qualquer identificador de licença fora de `scripts/ci/license-policy.json` quebra o job.

## Operação

- As saídas de CodeQL, Semgrep e Gitleaks são publicadas em SARIF para GitHub Code Scanning.
- A policy de licenças usa `pnpm licenses list --json`, então o job instala dependências com `pnpm install --frozen-lockfile` antes da validação.
- O arquivo `.gitleaks.toml` mantém allowlists explícitas para fixtures, documentação e placeholders controlados, reduzindo falso positivo sem abrir exceção genérica no código-fonte de produção.

## Revisão contínua

- Sempre que uma nova licença aparecer, ela deve ser revisada antes de ser adicionada ao allowlist.
- Novas regras de Semgrep devem entrar com severidade compatível com o nível de bloqueio desejado.
- O ideal é marcar os checks `CodeQL`, `Semgrep`, `Gitleaks` e `Dependency Licenses` como obrigatórios nas branch protections.
