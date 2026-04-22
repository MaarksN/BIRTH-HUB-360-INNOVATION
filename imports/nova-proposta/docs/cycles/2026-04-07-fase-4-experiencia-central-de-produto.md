# Template de Execucao por Ciclo

## Objetivo do ciclo
Executar a Fase 4 do BirthHub 360, transformando o dashboard em uma experiencia pos-login coerente, navegavel e operacional para produto, analytics e atendimento.

## Itens do relatorio atacados
- [x] Home do dashboard
- [x] Workflow list
- [x] Sino de notificacoes e pagina de notificacoes
- [x] Dark mode persistido
- [x] Onboarding guiado
- [x] Busca global
- [x] Analytics
- [x] Conversations UI
- [x] Reports/export
- [x] Loading, error e empty states
- [x] Acessibilidade e performance basica
- [x] Prefetch, suspense, skeletons e debounce onde necessario

## Leitura do estado atual
- O frontend ja tinha layout base autenticado, paginas isoladas e integracoes pontuais com a API, mas ainda parecia um conjunto de rotas soltas.
- Faltavam a home de produto, a lista de workflows, onboarding, busca global, analytics de produto, conversations, reports e modo escuro persistido.
- O navbar existente nao sustentava uma jornada operacional completa e a entrada no sistema ainda dependia de conhecer URLs manualmente.
- A API ja expunha dados para dashboard, workflows, outputs, billing e notificacoes, mas search e conversations ainda nao tinham superficie funcional para o frontend.
- A fase precisava ainda de cobertura direta para `search`, `conversations`, cliente de produto e persistencia de tema, para sair do estado de UX pronta porem pouco provada.

## Decisoes arquiteturais
- Reaproveitar o app `apps/web` existente, expandindo a shell autenticada em vez de criar um frontend paralelo.
- Implementar a experiencia central como rotas reais no `App Router`, cada uma com `loading.tsx`, `error.tsx` e empty state explicito.
- Conectar a nova UX a APIs reais do backend e abrir apenas as superficies faltantes: `conversations`, `search` e onboarding do dashboard.
- Sustentar dark mode no cliente com `ThemeProvider` e persistencia em `localStorage`, sem acoplar o tema ao backend.
- Adotar busca global leve com `cmd/ctrl + k`, `useDeferredValue` e filtros agregados por dominio, evitando uma engine externa neste ciclo.
- Alternativas descartadas:
  - Montar um produto fake com dados mockados: descartado por nao atender o aceite de integracao com API real.
  - Criar microfrontends separados para cada area: descartado por aumentar custo operacional sem necessidade.
  - Introduzir websocket para notificacoes neste ciclo: descartado em favor de polling leve e persistencia backend, suficiente para a fase.

## Plano executavel
- Passo 1: abrir a shell principal do produto com novo navbar, dashboard home e redirecionamento pos-login coerente.
- Passo 2: implementar as rotas operacionais de workflows, notifications, onboarding, analytics, conversations e reports.
- Passo 3: conectar busca global, dark mode, polling leve de notificacoes e estados de loading/error/empty.
- Passo 4: validar os arquivos tocados com typecheck filtrado, lint pontual e ajuste dos testes de roteamento afetados.

## Arquivos impactados
- Criar:
  - `apps/api/src/modules/conversations/index.ts`
  - `apps/api/src/modules/conversations/router.ts`
  - `apps/api/src/modules/conversations/service.ts`
  - `apps/api/src/modules/search/index.ts`
  - `apps/api/src/modules/search/router.ts`
  - `apps/api/src/modules/search/service.ts`
  - `apps/web/app/(dashboard)/analytics/error.tsx`
  - `apps/web/app/(dashboard)/analytics/loading.tsx`
  - `apps/web/app/(dashboard)/conversations/error.tsx`
  - `apps/web/app/(dashboard)/conversations/loading.tsx`
  - `apps/web/app/(dashboard)/conversations/page.tsx`
  - `apps/web/app/(dashboard)/dashboard/error.tsx`
  - `apps/web/app/(dashboard)/dashboard/loading.tsx`
  - `apps/web/app/(dashboard)/dashboard/page.data.ts`
  - `apps/web/app/(dashboard)/dashboard/page.tsx`
  - `apps/web/app/(dashboard)/notifications/error.tsx`
  - `apps/web/app/(dashboard)/notifications/loading.tsx`
  - `apps/web/app/(dashboard)/notifications/page.tsx`
  - `apps/web/app/(dashboard)/onboarding/error.tsx`
  - `apps/web/app/(dashboard)/onboarding/loading.tsx`
  - `apps/web/app/(dashboard)/onboarding/page.tsx`
  - `apps/web/app/(dashboard)/reports/error.tsx`
  - `apps/web/app/(dashboard)/reports/loading.tsx`
  - `apps/web/app/(dashboard)/reports/page.tsx`
  - `apps/web/app/(dashboard)/workflows/error.tsx`
  - `apps/web/app/(dashboard)/workflows/loading.tsx`
  - `apps/web/app/(dashboard)/workflows/page.tsx`
  - `apps/web/components/dashboard/page-fragments.tsx`
  - `apps/web/components/dashboard/route-error-view.tsx`
  - `apps/web/components/layout/GlobalSearch.tsx`
  - `apps/web/components/workflows/CreateWorkflowButton.tsx`
  - `apps/web/components/workflows/RunWorkflowButton.tsx`
  - `apps/web/lib/product-api.server.ts`
  - `apps/web/lib/product-api.ts`
  - `apps/web/providers/ThemeProvider.tsx`
  - `apps/api/tests/conversations-router.test.ts`
  - `apps/api/tests/search-router.test.ts`
  - `apps/web/tests/product-api.test.ts`
  - `apps/web/tests/theme-provider.test.ts`
- Alterar:
  - `apps/api/src/app/module-routes.ts`
  - `apps/api/src/modules/dashboard/router.ts`
  - `apps/api/src/modules/dashboard/service.shared.ts`
  - `apps/api/src/modules/dashboard/service.ts`
  - `apps/api/tests/module-routes.test.ts`
  - `apps/web/app/globals.css`
  - `apps/web/app/layout.tsx`
  - `apps/web/app/page.tsx`
  - `apps/web/app/(dashboard)/dashboard.css`
  - `apps/web/components/layout/Navbar.tsx`
  - `apps/web/components/login-form.tsx`
  - `apps/web/lib/product-api.ts`
  - `apps/web/providers/AppProviders.tsx`
  - `apps/web/providers/ThemeProvider.tsx`
- Remover:
  - nenhum

## Checklist de implementacao
- [ ] migrations
- [x] rotas
- [x] servicos
- [x] validacoes
- [x] UI
- [x] loading/error/empty
- [x] testes
- [x] docs

## Implementacao
- A shell autenticada passou a operar como produto real com home, workflows, notifications, onboarding, analytics, conversations e reports ligados a APIs reais.
- A busca global com `cmd/ctrl + k` ficou integrada ao backend por `search`, com debounce leve, atalhos e navegacao direta entre dominios operacionais.
- O `ThemeProvider` sustenta dark mode persistido em `localStorage`, refletindo o estado escolhido no `documentElement` e no navbar.
- Notifications e conversations receberam cobertura direta de API, incluindo filtros tenant-aware, criacao de thread, historico e feed persistido.
- A camada cliente de produto ganhou testes para os helpers compartilhados e um ajuste em `product-api` para nao emitir query string vazia em listagem de conversas.

## Validacao
### Local
- [x] validacao local concluida
- Executado `node --import tsx --test apps/api/tests/conversations-router.test.ts apps/api/tests/search-router.test.ts apps/api/tests/module-routes.test.ts`, com 6 testes passando.
- Executado `node --import tsx --test apps/web/tests/product-api.test.ts apps/web/tests/theme-provider.test.ts apps/web/tests/notification-store.test.ts apps/web/tests/dashboard-data.test.ts apps/web/tests/workflows-list.test.ts`, com 7 testes passando.
- Executado `tsc -p apps/api/tsconfig.json --noEmit --pretty false`, com resultado limpo.
- Executado `tsc -p apps/web/tsconfig.json --noEmit --pretty false`, com resultado limpo.
- Executado `eslint` nos arquivos alterados de `clinical`, `privacy`, `security`, `Navbar`, `GlobalSearch`, `conversations` e `notifications`, sem findings.

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
- O escopo de experiencia central de produto esta implementado e validado localmente, incluindo busca, conversations e persistencia de tema.
- CI e staging seguem pendentes, mas a validacao local do ciclo fechou com compilacao limpa, lint limpo e suites focadas de API e web passando.

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
