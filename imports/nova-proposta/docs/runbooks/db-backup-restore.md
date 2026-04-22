# Runbook — Backup, Restore e Retenção de Logs

## Backup

```bash
DATABASE_URL=postgres://... BACKUP_DIR=./backups ./packages/db/scripts/backup.sh
```

Saude operacional do backup:

```bash
pnpm ops:backup:health
```

Artefatos esperados:
- `artifacts/backups/backup-health.json`
- `artifacts/backups/backup-health.txt`

Política sugerida:
- Backup full diário.
- Retenção de 30 dias local + replicação para storage externo.
- Teste de restore semanal em ambiente de staging.

## Restore

```bash
DATABASE_URL=postgres://... ./packages/db/scripts/restore.sh ./backups/birthub_YYYYMMDD_HHMMSS.dump
```

Ao finalizar um rehearsal de restore, registrar o drill de DR com:

```bash
pnpm ops:dr:record -- --environment=staging --scenario="backup restore rehearsal" --owner=platform-ops --backup-artifact=artifacts/backups/backup-health.json --validation-artifact=artifacts/release/smoke-summary.json --started-at=<ISO> --restored-at=<ISO> --target-point=<ISO> --recovered-point=<ISO>
```

## Retenção e arquivamento de AgentLog

A migration `20260223090000_sprint3_operational_data` cria a função `archive_agent_logs(retention_days)` e a tabela `AgentLogArchive`.

Execução manual:

```bash
psql "$DATABASE_URL" -v retention_days=45 -f packages/db/scripts/archive-agent-logs.sql
```

Execução agendada recomendada: diária, com retenção de 30 dias em `AgentLog` e histórico completo em `AgentLogArchive`.
