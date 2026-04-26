# Release And Rollback

## Gates locais

```bash
pnpm typecheck
pnpm lint
pnpm security:guards
pnpm test:critical:coverage
pnpm audit:checklist
```

## Ordem de release

1. Gerar SBOM e manifestos.
2. Rodar smoke e suite critica.
3. Confirmar evidencia de rollback.
4. Confirmar checks de banco e readiness.
5. Executar deploy.
6. Registrar evidencia final em `artifacts/release/`.

## Rollback

- Registrar versao anterior, tag ou imagem.
- Confirmar compatibilidade de migration.
- Executar rollback em janela controlada.
- Registrar evidencia de sucesso ou falha no runbook de incidente.
