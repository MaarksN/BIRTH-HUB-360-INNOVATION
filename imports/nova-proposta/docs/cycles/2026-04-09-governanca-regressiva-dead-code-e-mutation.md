# Template de Execucao por Ciclo

## Objetivo do ciclo
Fechar, em um unico lote, a governanca regressiva de qualidade da Fase 5 no que era mais adjacente e acionavel: baseline de dead code, lane focal de mutation, documentacao de rastreabilidade e evidencia local honesta.

## Itens do relatorio atacados
- [x] validar o gate regressivo de `quality:dead-code`
- [x] regenerar a evidencia de dead code em `docs/evidence/dead-code-report.md`
- [x] estabilizar o runner de mutation no Windows sem tropecar em `.pytest_cache`
- [x] trocar a lane ampla de mutation por um recorte focal e repetivel
- [x] manter a expansao de auth de API disponivel, mas opcional
- [x] revalidar a suite focal default de mutation
- [x] revalidar a expansao opcional com `apps/api/tests/auth.test.ts`
- [x] atualizar `docs/testing/F5_TRACEABILITY.md`
- [x] atualizar `docs/execution/CICLO_F3_F5_RASTREABILIDADE_2026-04-08.md`
- [x] registrar o novo baseline operacional do ciclo

## Leitura do estado atual
- O lane de dead code ja tinha sido separado entre core e satelites, mas ainda faltava um gate regressivo utilizavel no dia a dia.
- A evidencia atual mostrava que o baseline do core ja podia ser congelado, porem a documentacao seguia descrevendo um estado antigo em que `pnpm quality:dead-code` ainda era apenas um gate vermelho.
- A lane de mutation existia em esqueleto, mas o `Stryker` ainda era sensivel a detalhes de filesystem no Windows e o escopo amplo tornava a rodada local cara demais.
- O maior risco deste ciclo nao era ausencia de feature, e sim drift entre o que o repositorio ja executava e o que a rastreabilidade ainda dizia.

## Decisoes arquiteturais
- Tratar `quality:dead-code` como gate regressivo contra baseline versionado, e nao como bloqueio absoluto de zerar backlog historico em uma unica rodada.
- Iniciar a mutation lane por um recorte pequeno e critico: `packages/auth/index.ts` e o slice de parsing/catalogo/Slack de `packages/agents-core`.
- Manter a expansao de auth de API como opcional via `MUTATION_INCLUDE_API_AUTH=1`, para nao transformar o lane default em um job pesado demais no recorte inicial.
- Corrigir a configuracao do `Stryker` para Windows sem esconder o problema: o lane completo ainda precisa mais budget local, mas deixou de falhar pelo motivo errado.

## Plano executavel
- passo 1: validar `node scripts/quality/check-dead-code.mjs`
- passo 2: validar `node scripts/quality/run-mutation-suite.mjs`
- passo 3: validar a expansao opcional com `MUTATION_INCLUDE_API_AUTH=1`
- passo 4: corrigir `stryker.config.mjs` para sandbox previsivel no Windows
- passo 5: reduzir o escopo default de `mutate` para um slice focal e repetivel
- passo 6: atualizar a matriz F5 de testing
- passo 7: atualizar a rastreabilidade F3-F5
- passo 8: registrar contagens e limites do lane de dead code
- passo 9: registrar o limite atual do `pnpm test:mutation` completo
- passo 10: consolidar o status do ciclo

## Arquivos impactados
- criar:
  - `docs/cycles/2026-04-09-governanca-regressiva-dead-code-e-mutation.md`
- alterar:
  - `artifacts/quality/knip-baseline.json`
  - `docs/evidence/dead-code-report.md`
  - `docs/testing/F5_TRACEABILITY.md`
  - `docs/execution/CICLO_F3_F5_RASTREABILIDADE_2026-04-08.md`
  - `scripts/quality/run-mutation-suite.mjs`
  - `stryker.config.mjs`
- remover:
  - nenhum

## Checklist de implementacao
- [ ] migrations
- [ ] rotas
- [ ] servicos
- [ ] validacoes
- [ ] UI
- [ ] loading/error/empty
- [x] testes
- [x] docs

## Implementacao
- `quality:dead-code` passou a ter evidencia local atualizada por baseline comprometido, com lane core zerado nesta rodada (`baseline=0`, `current=0`, `regressions=0`, `improvements=0`).
- `stryker.config.mjs` foi consolidado para evitar discovery problematica de `node_modules` no Windows e para usar um escopo focal de mutacao.
- `scripts/quality/run-mutation-suite.mjs` passou a deixar o `apps/api/tests/auth.test.ts` como expansao opcional, mantendo o lane default mais leve.
- A matriz `docs/testing/F5_TRACEABILITY.md` deixou de afirmar que mutacao nao era automatizada.
- A rastreabilidade F3-F5 passou a refletir dead code como gate regressivo e mutacao como lane focal em maturacao.

## Validacao
### Local
- [x] validacao local concluida

Resultados locais:
- `node scripts/quality/check-dead-code.mjs`
  - passou com `baseline=0`, `current=0`, `regressions=0`, `improvements=0`
- `node scripts/quality/run-mutation-suite.mjs`
  - passou no lane default (`@birthub/auth` e `@birthub/agents-core`)
- `MUTATION_INCLUDE_API_AUTH=1 node scripts/quality/run-mutation-suite.mjs`
  - passou no lane expandido
- `pnpm test:mutation`
  - deixou de falhar por erro de filesystem no Windows, mas ainda nao concluiu dentro da janela local usada nesta rodada

### CI
- [ ] validacao em CI concluida

### Staging
- [ ] validacao em staging concluida

## Status
- [ ] RED
- [ ] BLUE
- [x] YELLOW
- [ ] GREEN

## Prompt
Voce esta executando um ciclo arquitetural do plano BirthHub 360.
Ataque apenas os itens listados neste ciclo.
Entregue:
A. Leitura do estado atual
B. Decisoes arquiteturais
C. Plano executavel do ciclo atual
D. Implementacao
E. Validacao
F. Status
