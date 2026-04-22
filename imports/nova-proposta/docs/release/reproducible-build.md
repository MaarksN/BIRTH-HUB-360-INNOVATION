# Reproducible Build & Release (v1.0.0)

Ordem mínima para reproduzir release em ambiente limpo:

```bash
pnpm install --frozen-lockfile
pnpm --filter @birthub/database db:generate
pnpm build
pnpm release:bundle
```

## Observações

- O pacote `@birthub/database` usa `@prisma/client@6.19.2` com `prisma@7.6.0`, com compatibilidade de runtime aplicada por `scripts/prisma-runtime-compat.mjs` antes do `prisma generate`.
- `postinstall` já executa `db:generate`; o passo explícito acima garante rastreabilidade operacional durante auditoria.
- `release:bundle` executa `release:sbom` e `release:materialize`, gerando SBOM, checksums e catálogo auditável.
- O workflow de CD agora materializa `artifacts/release/source-manifest.json`, prendendo o bundle e os gates subsequentes ao mesmo commit SHA imutável.
- O workflow recorrente `.github/workflows/release-rehearsal.yml` executa `pnpm release:verify:cycle0` para detectar deriva do bundle antes do momento de release.
