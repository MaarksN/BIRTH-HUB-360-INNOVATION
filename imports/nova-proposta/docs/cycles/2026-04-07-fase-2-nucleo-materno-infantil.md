# Template de Execucao por Ciclo

## Objetivo do ciclo
Executar a Fase 2 do BirthHub 360, transformando a base SaaS generica em um nucleo minimo validavel de saude materno-infantil com dominio, API, UI e testes.

## Itens do relatorio atacados
- [x] Modelos `Patient`, `PregnancyRecord`, `Appointment`, `ClinicalNote` e `NeonatalRecord`
- [x] APIs `patients`, `appointments` e `clinical-notes`
- [x] Paginas `/patients`, `/patients/[id]`, `/patients/[id]/appointments` e `/appointments`

## Leitura do estado atual
- O repositório ja possuia monorepo com `packages/database`, `apps/api` e `apps/web`, tenant context via middleware e auditoria com `Auditable`.
- O banco tinha RLS alinhado para varios modulos, mas nao existia nenhum dominio clinico materno-infantil.
- A UI de dashboard existia, porem sem navegacao, API real ou telas para fluxo clinico de paciente, agenda e nota.
- O principal bloqueio era a ausencia simultanea de schema, contratos e telas, o que impedia validar o fluxo ponta a ponta.

## Decisoes arquiteturais
- Criar o dominio clinico como extensao tenant-aware do schema Prisma existente, mantendo `tenantId`, `organizationId`, indices e soft delete.
- Usar `ClinicalNote` versionada por `noteGroupId + version`, em vez de sobrescrever o registro atual.
- Concentrar o modulo em um router clinico unico na API, expondo sub-recursos sob `patients`, `appointments` e `clinical-notes`.
- Alternativas descartadas:
  - Criar um app separado para clinica: descartado para nao quebrar a espinha dorsal multi-tenant ja existente.
  - Versionar notas em JSON dentro de `Appointment`: descartado por dificultar auditoria, busca e evolucao futura.
  - Fazer agenda apenas por lista simples sem janela dia/semana/mes: descartado por nao atender o aceite do ciclo.

## Plano executavel
- Passo 1: modelar o dominio clinico no Prisma, adicionar migration e alinhar RLS/governanca.
- Passo 2: implementar servicos e rotas Express com validacao Zod, auditoria e filtros tenant-aware.
- Passo 3: construir as telas clinicas do dashboard com loading, error, empty states, DPP, alertas e curva fetal.
- Passo 4: adicionar testes de banco, API, web e E2E critico.

## Arquivos impactados
- Criar:
  - `apps/api/src/modules/clinical/router.ts`
  - `apps/api/src/modules/clinical/schemas.ts`
  - `apps/api/src/modules/clinical/service.ts`
  - `apps/api/tests/clinical-router.test.ts`
  - `apps/web/app/(dashboard)/appointments/page.tsx`
  - `apps/web/app/(dashboard)/patients/page.tsx`
  - `apps/web/app/(dashboard)/patients/[id]/page.tsx`
  - `apps/web/app/(dashboard)/patients/[id]/appointments/page.tsx`
  - `apps/web/app/(dashboard)/patients/appointments-board.tsx`
  - `apps/web/app/(dashboard)/patients/clinical-data.ts`
  - `apps/web/tests/clinical-data.test.ts`
  - `packages/database/prisma/migrations/20260407000100_cycle13_maternal_domain/migration.sql`
  - `packages/database/test/maternal-domain.rls.test.ts`
  - `tests/e2e/maternal-clinic.spec.ts`
- Alterar:
  - `apps/api/src/app/module-routes.ts`
  - `apps/web/components/layout/Navbar.tsx`
  - `packages/database/prisma/schema.prisma`
  - `packages/database/prisma/migration-registry.json`
- Remover:
  - nenhum

## Checklist de implementacao
- [x] migrations
- [x] rotas
- [x] servicos
- [x] validacoes
- [x] UI
- [x] loading/error/empty
- [x] testes
- [x] docs

## Implementacao
- O schema Prisma recebeu os agregados clinicos `Patient`, `PregnancyRecord`, `Appointment`, `ClinicalNote` e `NeonatalRecord`, com relacoes organizacionais, soft delete, versionamento de nota e politicas RLS por tenant.
- A API ganhou o modulo `clinical` com servicos e rotas para cadastro/consulta de pacientes, gestacoes, agenda clinica, prontuario versionado e registro neonatal.
- O dashboard recebeu navegacao dedicada, listagem de pacientes, prontuario detalhado, agenda por janela dia/semana/mes, alertas clinicos, calculo de DPP e curva de crescimento fetal.
- Os testes cobrem helper web, contrato do router clinico, wiring de rotas, smoke de connectors afetado pelo novo `RequestContext`, RLS tenant-aware e uma spec E2E mockada para o fluxo minimo.

## Validacao
### Local
- [x] validacao local concluida

Resultados locais executados:
- `npx tsc -p apps/web/tsconfig.json --noEmit` passou.
- `npx tsc -p apps/api/tsconfig.json --noEmit` passou.
- `npx tsx --test apps/web/tests/clinical-data.test.ts` passou.
- `npx tsx --test apps/api/tests/clinical-router.test.ts` passou.
- `npx tsx --test apps/api/tests/connectors-router.test.ts` passou.
- `npx tsx --test apps/api/tests/module-routes.test.ts` passou.
- `npx playwright test tests/e2e/maternal-clinic.spec.ts` passou.
- O banco local `birthub_cycle1` foi criado e bootstrapado com as migrations do projeto.
- `npx tsx --test packages/database/test/maternal-domain.rls.test.ts` passou usando a role runtime `api_worker`, validando o isolamento por tenant no dominio clinico.
- `node --import tsx --test packages/database/test/rls.test.ts` passou como prova basal de isolamento multi-tenant no mesmo banco local.

### CI
- [ ] validacao em CI concluida

### Staging
- [ ] validacao em staging concluida

## Status
- [ ] RED
- [ ] BLUE
- [ ] YELLOW
- [x] GREEN

Justificativa do status:
- O ciclo foi implementado e validado localmente no recorte clinico com typecheck completo de `web` e `api`, testes focados, smoke E2E do dashboard e validacao RLS contra banco real.
- `CI` e `staging` seguem pendentes apenas como etapas de pipeline/ambiente, sem bloqueio tecnico aberto no escopo deste ciclo.

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
