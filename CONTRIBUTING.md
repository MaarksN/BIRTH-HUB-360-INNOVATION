# Contributing

## Fluxo básico

1. Crie uma branch a partir da principal.
2. Faça mudanças pequenas e coesas.
3. Rode validações locais obrigatórias.
4. Abra PR com contexto, impacto e riscos.

## Validações obrigatórias

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Convenções

- Use TypeScript com as configurações da raiz (`tsconfig.base.json`).
- Mantenha lint e formatação passando sem bypass.
- Não comitar artefatos gerados (`dist`, `*.tsbuildinfo`, caches).
- Preferir testes unitários com mocks quando não há necessidade real de infraestrutura externa.

## Commit e PR

- Commits objetivos e descritivos.
- Uma PR por objetivo técnico.
- Preencher o template/checklist de PR.
