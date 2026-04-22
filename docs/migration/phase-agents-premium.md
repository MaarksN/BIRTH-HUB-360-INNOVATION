# Agent Packs Premium Migration

Esta onda migrou os agentes existentes para a fundacao atual da plataforma sem trazer runtime, registry ou geradores pesados.

## Migrado

- `packages/agent-packs`: pacote canonico de catalogo de agentes.
- 395 manifests:
  - 392 agentes instalaveis.
  - 3 catalogos de colecao.
- Colecoes:
  - `corporate-v1`: 43 agentes e 1 catalogo.
  - `executive-premium-v1`: 15 agentes e 1 catalogo.
  - `github-agents-v1`: 334 agentes e 1 catalogo.
- Testes de catalogo em `packages/agent-packs/test`.
- Scripts minimos:
  - `scripts/validate-packs.ts`
  - `scripts/generate-pack-docs.ts`
  - `scripts/pack-qa-report.ts`

## Premium aplicado

Todos os agentes instalaveis receberam uma camada premium padronizada e idempotente:

- protocolo `PROTOCOLO PREMIUM GLOBAL 100`;
- marcador `CAMADAS PREMIUM DE PLATAFORMA`;
- 10 pilares premium:
  - Signal Fusion
  - Evidence Confidence
  - Decision Intelligence
  - Risk Governance
  - Opportunity Orchestration
  - Segment Communication
  - Collaboration Handoff
  - Workflow Execution
  - Resilience Recovery
  - Memory Learning
- ferramentas declarativas premium quando ainda ausentes:
  - Data Processor
  - Evidence Scorecard
  - Memory Vault
  - Recommendation Engine
  - Segment Adapter
  - Premium Layer Engine
  - Approval Choreographer
  - Workflow Trigger Router
  - Handoff
  - Alert Dispatcher
- actions de policy para memoria, aprendizado, auditoria, aprovacao, recomendacao, workflow, alertas, handoff, evidencia e tenant.

## Nao migrado nesta onda

Ficaram fora de proposito:

- `packages/agent-packs/**/source/**`
- `packages/agent-packs/**/evidence.json`
- `packages/agent-packs/**/readiness.json`
- `packages/agent-packs/**/collection-report.json`
- `packages/agent-packs/**/market-grade-upgrade-report.json`
- `packages/agent-packs/**/readiness-gate-report.json`
- scripts de compilacao/regeneracao em `scripts/agent/**`

Motivo: estes itens sao fontes geradoras, relatorios ou artefatos de readiness. A plataforma agora deve consumir os manifests canonicos via `@birthub/agents-core`, sem depender de outputs gerados para carregar o catalogo.

## Como usar

- Validar manifests: `pnpm packs:validate`
- Rodar testes de catalogo: `pnpm packs:test`
- Gerar docs de catalogo: `pnpm packs:docs`
- Gerar QA local: `pnpm packs:qa`

## Pendencias e riscos

- Runtime completo, registry e agent-packs avancados ainda nao foram migrados.
- As ferramentas premium sao declarativas no manifest; adaptadores reais devem ser ligados em fase posterior.
- As actions novas precisam ser reconciliadas com guardrails finais de policy/RLS antes de producao.
- Memoria premium e aprendizado multi-tenant dependem dos controles ja apontados: RLS, drift de schema, auth guardrails e isolamento por tenant.
- Webhook receiver e refresh session seguem como riscos separados da fundacao de agentes.
