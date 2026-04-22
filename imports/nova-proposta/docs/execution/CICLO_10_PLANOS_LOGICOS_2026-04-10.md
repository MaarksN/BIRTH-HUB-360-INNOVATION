# Ciclo - 10 Planos Logicos (2026-04-10)

## Objetivo do ciclo

Executar em lote os proximos 10 planos logicos com foco em endurecer o modulo clinico (paginacao e alertas) e materializar evidencia real de disaster recovery.

## Itens do relatorio atacados

- [x] explicitar limite de pagina para listagem de pacientes
- [x] explicitar limite de pagina para listagem de notas clinicas
- [x] expor `limit` nos schemas e rotas do modulo clinico
- [x] reduzir complexidade de `deriveClinicalAlerts`
- [x] centralizar o calculo de proxima consulta
- [x] expor `pageSize` nas respostas de listagem
- [x] atualizar testes de router para o novo contrato
- [x] atualizar testes de paginacao para limites clinicos
- [x] materializar script de registro de DR drill
- [x] gerar evidencia local de DR drill e snapshot atualizado

## Leitura do estado atual

- `deriveClinicalAlerts` concentrava muitas regras em um bloco unico, dificultando leitura e manutencao.
- `listPatients` e `listClinicalNotes` aplicavam limites fixos sem permitir controle explicito via query.
- O schema do modulo clinico nao aceitava `limit`, logo o front nao conseguia pedir paginas menores.
- O DR drill continuava bloqueado por ausencia de `artifacts/backups/drill-rto-rpo.json` e por falta do script prometido no runbook.

## Decisoes arquiteturais

- Manter limites maximos de pagina (100 pacientes, 50 notas) com `limit` opcional para reduzir carga.
- Separar regras de alertas em helpers pequenos para reduzir complexidade e preservar o comportamento existente.
- Centralizar o calculo de proxima consulta para uso em detalhes e listagem.
- Criar `scripts/ops/record-disaster-recovery-drill.ts` como fonte canonica de evidencia DR.

## Plano executavel

- passo 1: introduzir limites configuraveis em `listPatients` e `listClinicalNotes`
- passo 2: expor `limit` nos schemas de query e refletir nas rotas
- passo 3: refatorar `deriveClinicalAlerts` com helpers pequenos
- passo 4: atualizar testes de router e paginacao
- passo 5: criar script e gerar evidencias de DR drill

## Arquivos impactados

- criar:
  - `scripts/ops/record-disaster-recovery-drill.ts`
  - `docs/execution/CICLO_10_PLANOS_LOGICOS_2026-04-10.md`
- alterar:
  - `apps/api/src/modules/clinical/service.ts`
  - `apps/api/src/modules/clinical/schemas.ts`
  - `apps/api/tests/clinical.service.pagination.test.ts`
  - `apps/api/tests/clinical-router.test.ts`
  - `artifacts/backups/drill-rto-rpo.json`
  - `artifacts/dr/latest-drill.json`
- remover:
  - nenhum

## Checklist de implementacao

- [ ] migrations
- [x] rotas
- [x] servicos
- [x] validacoes
- [ ] UI
- [ ] loading/error/empty
- [x] testes
- [x] docs

## Implementacao

- O modulo clinico passou a aceitar `limit` em pacientes e notas clinicas, com `pageSize` retornado para consumo da UI.
- `deriveClinicalAlerts` foi quebrado em helpers dedicados e o calculo de proxima consulta foi centralizado.
- O DR drill ganhou script dedicado e evidencias atualizadas em `artifacts/backups` e `artifacts/dr`.

## Validacao

### Local

- [x] validacao local concluida

Comandos executados:

```bash
node --import tsx scripts/ops/record-disaster-recovery-drill.ts --evidence=DRILL-2026-04-10 --target=production --rto-minutes=60 --rpo-minutes=15 --owner=platform --notes=local-drill
```

Resultados locais:

- `artifacts/backups/drill-rto-rpo.json` foi gerado com o registro do drill.
- `artifacts/dr/latest-drill.json` foi atualizado para status `recorded`.

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
