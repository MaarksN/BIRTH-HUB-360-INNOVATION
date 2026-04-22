## Resumo

Descreva objetivamente o que mudou, qual risco foi tratado e qual evidência de validação acompanha o PR.

## Issue vinculada

- Closes #

## Escopo da mudança

- [ ] Documentação
- [ ] Backend (API / services)
- [ ] Frontend (web / UI)
- [ ] Infra / CI
- [ ] Testes

## Justificativa formal

Preencha esta seção somente se o PR ultrapassar 500 linhas alteradas ou concentrar mudanças estruturalmente acopladas. Explique o motivo do lote, o plano de revisão e o rollback.

## Checklist de qualidade

- [ ] ADR ou documentação de arquitetura associada atualizada, quando aplicável.
- [ ] Testes unitários, integração ou E2E escritos e passando.
- [ ] Limites de complexidade e tamanho de arquivo respeitados.
- [ ] Dependências validadas e pacotes internos usando `workspace:*`.
- [ ] Sem exports ou imports mortos.
- [ ] Convenções de naming respeitadas.
- [ ] Sem credenciais inline ou dumps versionados.
- [ ] Se `pnpm-lock.yaml` mudou, houve aprovação dupla (`security` + `platform`) e label `security-approved`.
- [ ] Workspaces alterados mantêm `lint`, `typecheck`, `test` e `build`, ou possuem exceção documentada.

## Validação

```bash
pnpm artifacts:clean
pnpm branch:check
pnpm commits:check
pnpm hygiene:check
pnpm docs:check-links
pnpm monorepo:doctor
```

```bash
# adicione aqui os comandos executados neste PR
```

## Breaking changes

- [ ] No breaking changes
- [ ] Yes (describe below)

## Deployment notes

Inclua migrações, variáveis de ambiente, rollout e rollback quando necessário.

## Conflict checklist

- [ ] Pulled latest target branch into this branch
- [ ] Resolved all conflicted files locally
- [ ] Re-ran tests after conflict resolution
- [ ] Reviewed `.env.example` changes for compatibility
- [ ] Confirmed CI workflow files still reflect required jobs
