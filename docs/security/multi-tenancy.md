# Multi-Tenancy Segura

Fase 2 endurece o isolamento por tenant sem abrir novos conectores. A regra operacional e simples: toda leitura ou escrita em modelo tenant-scoped deve carregar `tenantId` no `where`, `data` ou `create`, ou passar por `withTenantScope`.

## Fontes canonicas de tenant

- API: `request.context.tenantId`, preenchido depois de autenticar sessao, API key ou contexto interno confiavel.
- Worker: payload assinado do job e helpers de persistencia que recebem `tenantId` explicitamente.
- Banco: `packages/database/src/tenant-scope.ts` define os modelos tenant-scoped e injeta escopo quando `withTenantScope(prisma, tenantId)` e usado.

## Guardrails

- A regra `birthub-tenancy/no-unscoped-prisma-query` bloqueia queries Prisma diretas em arquivos sensiveis quando o modelo exige tenant.
- A regra cobre `find*`, `count`, `aggregate`, `groupBy`, `update*`, `delete*`, `create*` e `upsert`.
- `upsert` deve declarar tenant tanto no `where` quanto no `create`.
- Queries dinamicas nao-estaticas devem preferir `withTenantScope` ou um helper explicitamente tenant-aware.

## Areas auditadas

- Auth: credenciais globais de autenticacao continuam como excecao controlada antes do tenant ser conhecido; operacoes pos-autenticacao usam o tenant do contexto.
- Connectors: contas e credenciais de provider sao persistidas por `tenantId` em `upsert`.
- Dashboard: organizacao e membership sao resolvidas com tenant no `where`.
- Marketplace: estatisticas de aprovacao nao consultam feedback sem tenant e sempre filtram `agentFeedback` por tenant.
- Conversations e Search: servicos de workspace foram adicionados ao lint tenant-aware; leituras e mutacoes usam `tenantId` e, quando aplicavel, `organizationId`.
- Worker persistence: execucoes, conversas e webhooks outbound carregam tenant em leituras e mutacoes.

## Testes

- `apps/api/tests/marketplace-budget.smoke.test.ts` valida que feedback do marketplace nao e consultado sem tenant e que a query inclui `tenantId`.
- `apps/api/tests/conversations-router.test.ts` valida mutacao de status dentro do escopo autenticado e bloqueio de mass assignment top-level.
- `apps/worker/src/agents/conversations.test.ts` valida que a resolucao de threads existentes filtra por tenant.
- `apps/worker/src/worker.execution-state.test.ts` valida que a persistencia de execucoes escreve com `tenantId`.
- A suite existente de tenant scope em `packages/database` cobre injecao e bloqueio de acesso cross-tenant.

## Excecoes aceitas

Algumas buscas de autenticacao acontecem antes de existir tenant confiavel na request, como refresh token, session token e API key hash. Essas excecoes devem permanecer localizadas no modulo de auth e nunca ser copiadas para fluxos de negocio.
