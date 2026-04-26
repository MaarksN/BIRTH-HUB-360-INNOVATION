# Developer Experience

## Windows / PowerShell

1. Instalar Node conforme `.nvmrc` e habilitar Corepack.
2. Rodar `pnpm install --frozen-lockfile`.
3. Validar com `pnpm audit:checklist`.
4. Para ciclo rapido: `pnpm typecheck`, `pnpm lint`, `pnpm security:guards`.

## Linux / CI

1. Usar Node 24 e pnpm 9.15.9.
2. Rodar `pnpm install --frozen-lockfile`.
3. Rodar `pnpm typecheck`, `pnpm lint`, `pnpm test:critical:coverage`, `pnpm audit:checklist`.

## Docker alternativo

O workspace possui `.devcontainer/devcontainer.json` para ambiente isolado. Quando Docker Desktop estiver disponivel, abra o repositorio em container e use os mesmos comandos de CI local.

## Artefatos locais

Relatorios de remediacao sao gerados em `artifacts/local-remediation/` por:

```bash
pnpm audit:checklist
pnpm audit:boundaries
```
