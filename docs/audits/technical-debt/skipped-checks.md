# Verificacoes Puladas

Nenhuma ferramenta foi instalada automaticamente. Quando uma ferramenta nao existia no ambiente, a verificacao foi registrada como sugestao.

| Verificacao | Motivo | Ferramenta necessaria | Comando sugerido | Valor esperado | Prioridade |
| --- | --- | --- | --- | --- | --- |
| Semgrep local completo | `semgrep` nao instalado no PATH. | Semgrep | `semgrep scan --config .semgrep/security.yml .` | Encontrar problemas SAST e falhar em severidade configurada. | P1 |
| Gitleaks historico completo | `gitleaks` nao instalado no PATH. | gitleaks | `gitleaks detect --source . --redact --no-banner` | Zero secrets reais; achados com valores redigidos. | P0 |
| TruffleHog historico completo | `trufflehog` nao instalado no PATH. | trufflehog | `trufflehog git file://. --only-verified` | Zero secrets verificados. | P0 |
| Dependency Cruiser | `dependency-cruiser/depcruise` nao instalado. | dependency-cruiser | `depcruise apps packages --config .dependency-cruiser.*` | Boundaries e ciclos bloqueados. | P2 |
| Madge | `madge` nao instalado. | madge | `madge --circular apps packages` | Zero ciclos ou allowlist documentada. | P2 |
| JSCPD | `jscpd` nao instalado. | jscpd | `jscpd apps packages --min-lines 20` | Duplicacao dentro de limite acordado. | P2 |
| Depcheck | `depcheck` nao instalado. | depcheck | `depcheck` | Dependencias nao usadas/erradas identificadas. | P2 |
| ts-prune/knip local completo | `ts-prune` nao instalado; knip existe como dependencia mas nao foi executado para evitar script desconhecido sem revisar config completa. | ts-prune/knip | `pnpm exec knip` | Exportacoes mortas identificadas. | P2 |
| Prisma migrate status | Depende de banco real; usuario proibiu modificar banco real. | Prisma | `pnpm --filter @birthub/database exec prisma migrate status --schema prisma/schema.prisma` | Estado de migrations sem pendencias. | P1 |
| Lighthouse | Requer app rodando/browser; nao foi iniciado servidor. | Lighthouse | `lighthouse http://localhost:3001 --view` | Scores e problemas UX/performance/a11y. | P2 |
| Axe | Requer app renderizado/browser. | axe/Playwright | `pnpm exec playwright test --grep a11y` ou suite axe dedicada | Zero violacoes criticas. | P2 |
| Bundle analyzer | Nao foi rodado build/analyzer para evitar side effects alem do diagnostico. | Next bundle analyzer | `ANALYZE=true pnpm --filter @birthub/web build` | Tamanho de bundle por rota. | P2 |
| Docker image scan | Syft/Grype nao instalados; build de imagem nao executado. | syft/grype/Docker Scout | `syft . -o cyclonedx-json`, `grype .` | SBOM e vulnerabilidades. | P2 |
| Kube policy validation | kubeconform/conftest nao instalados. | kubeconform/conftest | `kubeconform k8s/*.yaml` | Manifests validos e policy sem `latest`. | P2 |
| ZAP/DAST | Requer ambiente em execucao. | OWASP ZAP | `zap-baseline.py -t <url>` | Sem vulnerabilidades altas. | P2 |
| Restore drill | Exige banco descartavel e backup controlado. | PostgreSQL/infra local | `scripts/ops/restore-postgres.sh` contra banco temporario | Restore validado com RTO/RPO. | P2 |
| E2E Playwright completo | Nao foi iniciado app/API/DB reais. | Playwright | `pnpm exec playwright test` | Fluxos principais verdes. | P1 |
| Testes concorrentes/idempotencia reais | Requer Redis/DB e carga controlada. | node:test/load tools | suite especifica por fluxo | Sem duplicidade/race. | P1 |
| Licencas completas | Script existe, mas nao foi executado separadamente nesta rodada. | script do repo/license checker | `pnpm security:licenses` | Licencas permitidas. | P2 |
| Branch protection remoto | Exige acesso GitHub remoto/API. | GitHub/gh | `gh api repos/:owner/:repo/branches/main/protection` | Gates exigidos e protecao ativa. | P2 |

## Observacao

Ferramentas ausentes devem ser instaladas/provisionadas por decisao do time, idealmente via devcontainer ou CI, nao como acao ad hoc durante auditoria.
