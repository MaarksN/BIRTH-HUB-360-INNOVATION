# Security Coverage Report

- generatedAt: 2026-04-19T03:50:51.354Z
- overall_status: fail
- dast_target_strategy: local-web-login-route
- dast_target_url: n/a

## Checks

| Check | Status | Artifact | Description |
| --- | --- | --- | --- |
| semgrep | unknown | `artifacts/security/semgrep-head.json` | Semgrep baseline for TypeScript and Express surfaces. |
| dependency audit | unknown | - | High-severity npm audit gate. |
| python security | unknown | - | Bandit, pip-audit and Safety lane for Python surfaces. |
| RBAC suite | unknown | - | RBAC regression suite on critical API endpoints. |
| ZAP baseline | unknown | `artifacts/security/zap` | OWASP ZAP baseline against the canonical local web login route. |

## Modules

| Module | Checks |
| --- | --- |
| auth | login/logout/session rotation + MFA challenge tests |
| rbac | role matrix on critical endpoints |
| api-keys | introspection + scoped auth guards |
| web | CSP report-only, origin checks, CSRF double-submit |
| worker | signed payload verification + tenant context checks |
