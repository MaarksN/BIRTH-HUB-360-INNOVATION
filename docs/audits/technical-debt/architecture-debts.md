# Dividas de Arquitetura

## Achados confirmados

- `TD-013` - boundary multi-tenant automatizado esta limitado a uma lista pequena de arquivos em `eslint.config.mjs:42-52`.
- `TD-017` - modulos muito grandes: connector service, webhook receiver, connector events, chatbook workspace e chatbook lib.
- `TD-018` - ciclos de importacao estaticos em queue, agents-core, clinical, sales-os e worker executor.
- `TD-019` - `imports/` contem 3.285 arquivos e cria sombra de codigo.

## Suspeitas fortes

- Regras de negocio de webhooks/connectors parecem concentradas em services grandes, com risco de controller/service/infra misturados.
- Packages de agentes possuem manifests, runtime, policy e adapters; boundaries precisam de contrato explicito para tool calling e approval.
- `apps/web/components/agents/chatbook-workspace.tsx` mistura UI, estado, voz, exportacao e follow-ups, sugerindo baixa coesao.

## Ferramentas recomendadas

Madge, dependency-cruiser, ESLint boundaries, Nx/Turbo graph, knip, jscpd e metricas de complexidade por arquivo.

## Risco de nao corrigir

Novas funcionalidades tendem a entrar em arquivos ja grandes, aumentando acoplamento. Ciclos de importacao podem gerar bugs de inicializacao e dificultar tree-shaking/testes.

## Prioridade

P1 para ampliar boundary multi-tenant. P2 para ciclos e decomposicao gradual de modulos grandes.

## Arquivos e modulos mais afetados

- `apps/api/src/modules/connectors/service.ts`
- `apps/worker/src/integrations/connector-events.ts`
- `apps/webhook-receiver/src/index.ts`
- `apps/web/components/agents/chatbook-workspace.tsx`
- `packages/queue/src/runtime.ts`
- `packages/agents-core/src/runtime/*`
- `apps/api/src/modules/clinical/*`

## Proximos passos

1. Congelar novos casos nos modulos gigantes ate existir cobertura.
2. Adicionar gate de ciclos.
3. Criar contratos por boundary: API/domain/infra, agents policy/runtime/adapters, frontend state/UI/data.
4. Documentar o papel de `imports/` ou remove-lo do fluxo ativo.
