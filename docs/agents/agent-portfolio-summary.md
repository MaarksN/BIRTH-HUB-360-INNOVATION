# Estado dos 392 agentes

Gerado em: 2026-04-23T14:20:38.747Z

Fonte canonica analisada: `packages/agent-packs`.
Catalog descriptors foram excluidos da contagem: `corporate-v1-catalog`, `executive-premium-v1-catalog`, `github-agents-v1-catalog`.

## Resultado executivo

- Total de agentes instalaveis: 392
- Com dono funcional, dominio, caso de uso principal e prioridade: 392/392
- Duplicacoes exatas entre colecoes: 15 grupos
- Sobreposicoes tematicas mapeadas: 16 grupos
- Readiness/evidence: 334/392 readiness.json, 334/392 evidence.json

## Criterio de classificacao

- Dominio: inferido pelo dominio declarado no prompt quando existe; depois por overrides dos packs oficiais/premium e por termos do nome, tags, descricao e caso de uso.
- Dono funcional: papel responsavel pelo dominio, com overrides para C-level e operacao de plataforma.
- Prioridade: `core` para a linha oficial corporate e agentes de mesh essenciais; `especialista` para premium executivos, duplicatas de conceitos premium e casos recorrentes; `long_tail` para extensoes compiladas mais estreitas; `experimental` para conceitos especulativos, scouts, scrapers ou nomes de alto risco operacional.

## Inventario por colecao

| Colecao | Agentes | Com readiness | Com evidence |
| --- | --- | --- | --- |
| corporate-v1 | 43 | 0 | 0 |
| executive-premium-v1 | 15 | 0 | 0 |
| github-agents-v1 | 334 | 334 | 334 |

## Dominio

| Dominio | Agentes |
| --- | --- |
| vendas | 107 |
| CS | 48 |
| financeiro | 46 |
| compliance | 44 |
| marketing | 53 |
| ops | 76 |
| executivo | 18 |

## Dominio por colecao

| Colecao | vendas | CS | financeiro | compliance | marketing | ops | executivo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| corporate-v1 | 21 | 2 | 2 | 2 | 1 | 14 | 1 |
| executive-premium-v1 | 3 | 2 | 1 | 0 | 2 | 1 | 6 |
| github-agents-v1 | 83 | 44 | 43 | 42 | 50 | 61 | 11 |

## Nivel de prioridade

| Nivel | Agentes |
| --- | --- |
| especialista | 164 |
| long_tail | 162 |
| core | 46 |
| experimental | 20 |

## Duplicacoes exatas

| Grupo | Conceito | Agentes |
| --- | --- | --- |
| dup-001 | boardprepai | executive-premium-v1:boardprep-ai-premium-pack<br>github-agents-v1:board-prep-ai-github-pack |
| dup-002 | brandguardian | executive-premium-v1:brand-guardian-premium-pack<br>github-agents-v1:brand-guardian-github-pack |
| dup-003 | budgetfluid | executive-premium-v1:budget-fluid-premium-pack<br>github-agents-v1:budget-fluid-github-pack |
| dup-004 | capitalallocator | executive-premium-v1:capital-allocator-premium-pack<br>github-agents-v1:capital-allocator-github-pack |
| dup-005 | churndeflector | executive-premium-v1:churn-deflector-premium-pack<br>github-agents-v1:churn-deflector-github-pack |
| dup-006 | competitorxray | executive-premium-v1:competitor-xray-premium-pack<br>github-agents-v1:competitor-x-ray-github-pack |
| dup-007 | crisisnavigator | executive-premium-v1:crisis-navigator-premium-pack<br>github-agents-v1:crisis-navigator-github-pack |
| dup-008 | culturepulse | executive-premium-v1:culture-pulse-premium-pack<br>github-agents-v1:culture-pulse-github-pack |
| dup-009 | expansionmapper | executive-premium-v1:expansion-mapper-premium-pack<br>github-agents-v1:expansion-mapper-github-pack |
| dup-010 | marketsentinel | executive-premium-v1:market-sentinel-premium-pack<br>github-agents-v1:market-sentinel-github-pack |
| dup-011 | narrativeweaver | executive-premium-v1:narrative-weaver-premium-pack<br>github-agents-v1:narrative-weaver-github-pack |
| dup-012 | pipelineoracle | executive-premium-v1:pipeline-oracle-premium-pack<br>github-agents-v1:pipeline-oracle-github-pack |
| dup-013 | pricingoptimizer | executive-premium-v1:pricing-optimizer-premium-pack<br>github-agents-v1:pricing-optimizer-github-pack |
| dup-014 | quotaarchitect | executive-premium-v1:quota-architect-premium-pack<br>github-agents-v1:quota-architect-github-pack |
| dup-015 | trendcatcher | executive-premium-v1:trend-catcher-premium-pack<br>github-agents-v1:trend-catcher-github-pack |

## Sobreposicoes tematicas

| Grupo | Dominio | Agentes | Colecoes |
| --- | --- | --- | --- |
| Pipeline, forecast e risco de deal | vendas | 40 | corporate-v1, executive-premium-v1, github-agents-v1 |
| Pricing, desconto e cotacao | vendas | 11 | executive-premium-v1, github-agents-v1 |
| Lead, prospeccao e outbound | vendas | 37 | corporate-v1, github-agents-v1 |
| Saude de cliente, churn, renovacao e expansao | CS | 18 | corporate-v1, executive-premium-v1, github-agents-v1 |
| Suporte, tickets, SLA e incidentes | CS | 19 | corporate-v1, executive-premium-v1, github-agents-v1 |
| Caixa, billing, cobranca e reconciliacao | financeiro | 21 | corporate-v1, github-agents-v1 |
| FP&A, budget, margem e custos | financeiro | 30 | corporate-v1, executive-premium-v1, github-agents-v1 |
| Compliance, auditoria, policy e risco | compliance | 45 | corporate-v1, executive-premium-v1, github-agents-v1 |
| KYC, AML, fraude e verificacao de identidade | compliance | 12 | github-agents-v1 |
| Campanhas, conteudo, SEO e growth marketing | marketing | 17 | github-agents-v1 |
| Marca, mercado e inteligencia competitiva | marketing | 28 | corporate-v1, executive-premium-v1, github-agents-v1 |
| Dados, BI, dashboards e higiene de dados | ops | 17 | corporate-v1, github-agents-v1 |
| Processos, workflows, integracoes e automacao | ops | 29 | corporate-v1, github-agents-v1 |
| Enablement, coaching e playbooks | vendas | 13 | corporate-v1, github-agents-v1 |
| Board, estrategia executiva e decisoes C-level | executivo | 67 | corporate-v1, executive-premium-v1, github-agents-v1 |
| Produto, launch, feedback e requisitos | ops | 17 | corporate-v1, executive-premium-v1, github-agents-v1 |

## Artefatos

- `docs/agents/agent-inventory.csv`: linha a linha dos 392 agentes.
- `docs/agents/agent-inventory.json`: inventario estruturado para automacao.
- `docs/agents/agent-inventory-by-collection.md`: inventario humano por colecao.
- `docs/agents/agent-tier-lists.md`: listas core, especialistas, long tail e experimentais.
- `docs/agents/agent-overlap-map.csv`: duplicacoes e sobreposicoes.
