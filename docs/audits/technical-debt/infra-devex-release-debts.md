# Dividas de Infraestrutura, DevEx, CI/CD e Release

## Infraestrutura

Achados:

- `TD-002` - K8s Secret com `DATABASE_URL` em `stringData` e imagens `:latest`.
- `TD-026` - Docker/K8s/Cloud Run sem digest.
- `TD-027` - versao Node inconsistente.

Evidencias: `k8s/deployment.yaml:25`, `:58`, `:161`; `infra/cloudrun/service.yaml:12`; `package.json:7-9`.

## CI/CD

Achados:

- `TD-020` - workflow chama script inexistente `pnpm test:isolation`.
- `TD-021` - coverage no CI nao tem script/artefato confiavel.
- `TD-022`/`TD-023` - pinning fraco de actions/scanners.
- `TD-028` - checks dependem de build no Turbo.

## Release e rollback

Achados:

- `TD-010` - migrations fora do registro de governanca.
- `TD-034` - SBOM nao comprovado como gate.
- `TD-040` - backup/restore existem, mas restore drill nao foi comprovado.

## Experiencia de desenvolvedor

Achados:

- `TD-006` - scripts de teste quebram no Windows.
- `TD-007` - database test roda zero testes.
- `TD-027` - versao Node divergente.
- `TD-039` - scanners locais nao instalados/provisionados.

## Proximos passos

1. Criar comando unico `pnpm check` sem side effects: lint, typecheck, tests, audit.
2. Corrigir scripts cross-platform.
3. Adicionar devcontainer ou toolchain documentada.
4. Pinning de actions/images e policy para `:latest`.
5. Criar release checklist com SBOM, migrations, rollback e restore drill.

## Comandos de validacao sugeridos

- `pnpm check`
- `pnpm test:coverage`
- `pnpm --filter @birthub/database db:check:governance`
- `actionlint`
- `zizmor .github/workflows`
- `kubeconform k8s/*.yaml`
- `syft . -o cyclonedx-json`
