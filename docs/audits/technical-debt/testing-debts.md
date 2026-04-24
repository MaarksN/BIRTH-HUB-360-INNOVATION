# Dividas de Testes

## Achados confirmados

- `TD-006` - scripts de teste API/Web/Worker quebram no Windows por `sh -c` e `find`.
- `TD-007` - `@birthub/database test` roda zero testes.
- `TD-008` - suite web manual falha em i18n.
- `TD-009` - suites criticas puladas em retencao, consentimento, FHIR, clinico e frontend clinico.
- `TD-021` - CI tenta coverage sem script/artefato confiavel.

## Evidencias

- `apps/api/package.json:15`, `apps/web/package.json:11`, `apps/worker/package.json:12`.
- `packages/database/package.json:28`.
- `apps/web/tests/i18n.test.ts:18` e `:56`.
- `apps/api/tests/retention.service.test.ts:61`, `:129`, `:176`.
- `apps/api/tests/fhir.service.test.ts:19`, `:51`.
- `apps/api/tests/consent.service.test.ts:49`, `:95`.
- `.github/workflows/ci-cd.yml:65-71`.

## Verificacoes que passaram

- Testes manuais auth/security/billing: 25 passaram, 0 falharam.
- Testes manuais worker agent runtime selecionados: 6 passaram, 0 falharam.
- `prisma validate` passou.

## Fluxos criticos sem garantia suficiente

- Retencao e consentimento LGPD.
- FHIR/clinico.
- Web i18n e UI clinica.
- Isolamento multi-tenant no CI, porque `test:isolation` nao existe no root.
- Coverage real por pacote.

## Ferramentas recomendadas

node:test com glob cross-platform, c8/nyc para coverage, Playwright para E2E, contract tests para API, testes concorrentes para idempotencia e negative tests RBAC/multi-tenant.

## Proximos passos

1. Criar runner Node cross-platform para descobrir testes.
2. Corrigir `@birthub/database test`.
3. Reativar suites puladas com fixtures isoladas.
4. Criar `pnpm test:coverage` real.
5. Fazer o CI falhar quando suites criticas forem puladas sem justificativa.
