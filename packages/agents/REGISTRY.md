<!-- [SOURCE] BirthHub360_Agentes_Parallel_Plan — Executive Premium Migration -->
# BirthHub360 Agents Registry

Escopo deste índice: registrar a migração dos agentes executivos para o catálogo canônico em `packages/agent-packs`.

## Estado atual

- Local canônico de publicação: `packages/agent-packs/executive-premium-v1`
- Fontes migradas: `packages/agent-packs/executive-premium-v1/source`
- Pacotes instaláveis gerados: `packages/agent-packs/executive-premium-v1/*-premium-pack/manifest.json`
- Coleção canônica: `packages/agent-packs/executive-premium-v1/manifest.json`

## Mapa de migração

| name | cycle | source_path | manifest_path | status |
| --- | --- | --- | --- | --- |
| BoardPrep AI | 1 | `packages/agent-packs/executive-premium-v1/source/boardprep-ai` | `packages/agent-packs/executive-premium-v1/boardprep-ai-premium-pack/manifest.json` | migrated |
| BrandGuardian | 1 | `packages/agent-packs/executive-premium-v1/source/brand-guardian` | `packages/agent-packs/executive-premium-v1/brand-guardian-premium-pack/manifest.json` | migrated |
| BudgetFluid | 1 | `packages/agent-packs/executive-premium-v1/source/budget-fluid` | `packages/agent-packs/executive-premium-v1/budget-fluid-premium-pack/manifest.json` | migrated |
| CapitalAllocator | 1 | `packages/agent-packs/executive-premium-v1/source/capital-allocator` | `packages/agent-packs/executive-premium-v1/capital-allocator-premium-pack/manifest.json` | migrated |
| ChurnDeflector | 1 | `packages/agent-packs/executive-premium-v1/source/churn-deflector` | `packages/agent-packs/executive-premium-v1/churn-deflector-premium-pack/manifest.json` | migrated |
| CompetitorX-Ray | 1 | `packages/agent-packs/executive-premium-v1/source/competitor-xray` | `packages/agent-packs/executive-premium-v1/competitor-xray-premium-pack/manifest.json` | migrated |
| CrisisNavigator | 1 | `packages/agent-packs/executive-premium-v1/source/crisis-navigator` | `packages/agent-packs/executive-premium-v1/crisis-navigator-premium-pack/manifest.json` | migrated |
| CulturePulse | 1 | `packages/agent-packs/executive-premium-v1/source/culture-pulse` | `packages/agent-packs/executive-premium-v1/culture-pulse-premium-pack/manifest.json` | migrated |
| ExpansionMapper | 1 | `packages/agent-packs/executive-premium-v1/source/expansion-mapper` | `packages/agent-packs/executive-premium-v1/expansion-mapper-premium-pack/manifest.json` | migrated |
| MarketSentinel | 1 | `packages/agent-packs/executive-premium-v1/source/market-sentinel` | `packages/agent-packs/executive-premium-v1/market-sentinel-premium-pack/manifest.json` | migrated |
| NarrativeWeaver | 1 | `packages/agent-packs/executive-premium-v1/source/narrative-weaver` | `packages/agent-packs/executive-premium-v1/narrative-weaver-premium-pack/manifest.json` | migrated |
| PipelineOracle | 1 | `packages/agent-packs/executive-premium-v1/source/pipeline-oracle` | `packages/agent-packs/executive-premium-v1/pipeline-oracle-premium-pack/manifest.json` | migrated |
| PricingOptimizer | 1 | `packages/agent-packs/executive-premium-v1/source/pricing-optimizer` | `packages/agent-packs/executive-premium-v1/pricing-optimizer-premium-pack/manifest.json` | migrated |
| QuotaArchitect | 1 | `packages/agent-packs/executive-premium-v1/source/quota-architect` | `packages/agent-packs/executive-premium-v1/quota-architect-premium-pack/manifest.json` | migrated |
| TrendCatcher | 1 | `packages/agent-packs/executive-premium-v1/source/trend-catcher` | `packages/agent-packs/executive-premium-v1/trend-catcher-premium-pack/manifest.json` | migrated |

## Recompilação

```bash
pnpm agents:compile:executive-premium
pnpm packs:validate
```
