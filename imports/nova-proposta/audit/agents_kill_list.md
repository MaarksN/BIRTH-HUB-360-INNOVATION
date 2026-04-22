# Kill List & Refactoring (Remoção / Reescrever)

A seguir, a lista de abordagens e agentes que devem ser refatorados integralmente para atingir maturidade:

## Reescrever Completamente (Refactor Urgente)
**Todos os 15 agentes executivos** em `packages/agents/executivos/*` precisam de um refactoring em seus adaptadores de ferramentas:
- `boardprep-ai`: Remover `deterministic(seed)`, substituir por consultas a ERP ou banco de dados.
- `brand-guardian`
- `budget-fluid`
- `capital-allocator`
- `churn-deflector`
- `competitor-xray`
- `crisis-navigator`
- `culture-pulse`
- `expansion-mapper`
- `market-sentinel`
- `narrative-weaver`
- `pipeline-oracle`
- `pricing-optimizer`
- `quota-architect`
- `trend-catcher`

**As Core Skills** (`analyzerSkill`, `generatorSkill`, `monitorSkill`, `orchestratorSkill`, `reporterSkill`) são classificadas como **🔴 FRÁGEIS** e devem ser imediatamente mortas ou reescritas, pois são puramente scripts de parsing baseados em array includes e `Math.random()` sem inteligência cognitiva.

## Eliminar
- Funções utilitárias como `deterministic` em `tools.ts` devem ser exterminadas, visto que incentivam a criação de agentes fantoches ao longo do ciclo de vida da plataforma.
