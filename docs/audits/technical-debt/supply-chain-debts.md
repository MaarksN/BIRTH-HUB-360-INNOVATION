# Dividas de Supply Chain e Integridade de Dependencias

## Achados confirmados

- `TD-022` - GitHub Actions nao estao pinadas por SHA; Trivy usa `@master`.
- `TD-023` - Semgrep Docker sem tag/digest e gitleaks baixado por curl sem checksum.
- `TD-024` - `pnpm audit` encontrou vulnerabilidade moderada em `uuid` via `bullmq`.
- `TD-025` - dependencias desatualizadas em varios pacotes.
- `TD-026` - imagens Docker/K8s/Cloud Run sem digest.
- `TD-033` - Dependabot/Renovate nao encontrados.
- `TD-034` - script de SBOM existe, mas nao foi comprovado gate obrigatorio.

## Evidencias

- `.github/workflows/ci-cd.yml:159` usa `aquasecurity/trivy-action@master`.
- `.github/workflows/security-guardrails.yml:37-41` usa `semgrep/semgrep` sem tag/digest.
- `.github/workflows/security-guardrails.yml:78-80` baixa gitleaks via tarball sem checksum.
- `k8s/deployment.yaml:58`, `:161` usam `:latest`.
- `infra/cloudrun/service.yaml:12` usa `:latest`.
- `pnpm audit --audit-level low` retornou `GHSA-w5hq-g745-h8pq`.
- `rg --files -g '*dependabot*' -g '*renovate*'` nao encontrou configuracao.

## Riscos

CI e imagens podem mudar sem revisao. Vulnerabilidades transientes podem ficar abertas. Falta de SBOM dificulta resposta a CVE e auditoria de licencas.

## Recomendacoes

1. Pin por SHA todas as actions.
2. Pin por digest imagens Docker e scanners.
3. Validar checksum dos binarios baixados.
4. Adicionar Renovate/Dependabot.
5. Gerar SBOM no CI e publicar artifact.
6. Definir politica de bloqueio para vulnerabilidades criticas/altas.

## Ferramentas recomendadas

Syft, Grype, Docker Scout, Scorecard, actionlint, zizmor, OSV Scanner, license-checker e pnpm audit em CI.
