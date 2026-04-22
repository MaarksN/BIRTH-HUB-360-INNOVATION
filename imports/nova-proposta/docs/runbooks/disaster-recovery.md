# Disaster Recovery

## Escopo

Recuperação de desastre do core canônico com base em backup/restore e failover documentado.

## Referências

- `docs/runbooks/db-backup-restore.md`
- `docs/database/migration-rollback-plan.md`
- `scripts/ops/check-backup-health.ts`
- `scripts/ops/record-disaster-recovery-drill.ts`
- `scripts/ops/generate-disaster-recovery-report.ts`
- `artifacts/dr/readiness-report.json`
- `docs/evidence/disaster-recovery-report.md`

## Procedimento

1. Declarar incidente P0.
2. Congelar mudanças e tráfego mutável.
3. Validar backup íntegro mais recente.
4. Executar restore ou failover conforme o cenário aprovado.
5. Revalidar aplicação, banco, filas e observabilidade.
6. Materializar drill ou incidente com timestamp, owner e artefatos padronizados de evidência.

## Materialização recomendada

Antes de declarar o rehearsal como concluído:

```bash
pnpm ops:backup:health
pnpm release:rollback:evidence:auto -- --target=production
pnpm ops:dr:record:auto -- --environment=staging --owner=platform-ops --scenario="automated release readiness rehearsal"
pnpm ops:dr:report
```

Use `pnpm release:rollback:evidence -- --target=production --evidence=<ticket-ou-artifact>` apenas como fallback manual fora da pipeline padrão.
