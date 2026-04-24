# Cycle 5 - Agents Risk Matrix

- Data da revisao: 2026-04-11
- Escopo: 15 agentes executivos
- Metodo: evidencia de codigo + `artifacts/agent-governance/executive-agents-governance.json` + validacoes executadas no ciclo

## Top 10 riscos

Riscos efetivamente derrubados nesta rodada:

- `requestId` deixou de ser gap de runtime na familia executiva: o snapshot atual marca `requestIdGap: 0`.
- `boardprep-ai` deixou de ser excecao sem teste dedicado de schema.

| Rank | Risco | Severidade | Escopo | Evidencia principal | Impacto |
| --- | --- | --- | --- | --- | --- |
| 1 | Superficie critica ainda protegida por `@ts-nocheck` | Alta | 15/15 agentes em `schemas.ts`; 15/15 em `tools.ts`; 14/15 em `agent.ts` | snapshot de governanca; busca por `// @ts-nocheck` | Reduz a confianca estatica sobre contratos, runtime e tools. |
| 2 | Governanca declarada em YAML nao e executada | Alta | 14/15 agentes | `runtime_enforcement` e `runtime_cycle` em `contract.yaml`; ausencia de uso correspondente no `agent.ts`; snapshot | Cria "governanca de papel": existe no contrato, nao na execucao. |
| 3 | Observabilidade depende de `console.*` local | Media | 15/15 agentes | `packages/agents/executivos/*/agent.ts`; snapshot | Eventos existem, mas nao chegam a um sistema central auditavel. |
| 4 | Suite de testes executivos tambem esta sob `@ts-nocheck` | Media | 30/30 arquivos de teste dos agentes executivos | busca por `// @ts-nocheck` em `packages/agents/executivos/*/tests/*.ts` | Os testes defendem comportamento, mas nao defendem tipagem real do contrato. |
| 5 | Correlacao por `requestId` ainda e local ao agente | Media | 15/15 agentes | payload estruturado local; ausencia de sink compartilhado | A rastreabilidade melhorou, mas ainda nao vira controle operacional de plataforma. |
| 6 | Residuos semanticos de copy-paste permanecem em tipos internos | Media | Pelo menos `churn-deflector`, `culture-pulse`, `crisis-navigator`, `pricing-optimizer` | `BrandMetrics` em `churn-deflector` e `culture-pulse`; `CompetitorEvent` em `crisis-navigator` e `pricing-optimizer` | Aumenta risco de manutencao incorreta e reduz auditabilidade semantica. |
| 7 | Gate global de validacao nao e reproduzivel no workspace atual | Media | Workspace de agentes | `pnpm typecheck` e `pnpm lint` falham por `corepack` ausente e Node fora da faixa `>=24 <25` | A plataforma nao consegue provar endurecimento completo via gate padrao do repositorio. |
| 8 | Base documental pedida para o ciclo nao existe no workspace | Media | Governanca documental do ciclo | `Test-Path` falso para os 8 arquivos obrigatorios do prompt; `audit/README.md` lista outro conjunto canonico | A trilha de auditoria cross-cycle fica dependente de reconciliacao manual. |
| 9 | Modelo de governanca nao e uniforme na familia executiva | Media | `boardprep-ai` vs outros 14 agentes | `boardprep-ai/contract.yaml` sem `runtime_enforcement` e `runtime_cycle`; 14 pares com esses campos declarados | A comparabilidade e a governanca de portfolio dos agentes ficam inconsistentes. |
| 10 | Nao ha evidencia de agregacao central de fallback e falha por agente | Media | Familia executiva | ausencia de sink/metricas centrais no snapshot e na implementacao | A operacao continua sem leitura consolidada de degradacao por agente. |

## Leitura consolidada dos riscos

- Riscos 1 e 2 sao os bloqueadores reais de maturidade operacional.
- Riscos 3, 5 e 10 mostram que a observabilidade melhorou, mas continua sem virada para operacao centralizada.
- Riscos 4, 6, 8 e 9 nao derrubam execucao local imediatamente, mas enfraquecem auditabilidade, manutencao e governanca.
- Risco 7 impede concluir "pronto" com base em gates padrao do proprio repositorio.

## Matriz por dimensao

| Dimensao | Estado | Leitura |
| --- | --- | --- |
| Contratos | Parcialmente endurecidos | Shapes estao definidos e a correlacao local melhorou, mas enforcement continua frouxo. |
| Execucao | Funcional, nao governada | Retry/fallback existem, porem sem politica runtime comum. |
| Observabilidade | Parcial | Eventos agora carregam `requestId`, mas ainda sem sink e sem correlacao operacional de plataforma. |
| Tipagem | Fragil para auditoria | `@ts-nocheck` ainda cobre o grosso da familia executiva. |
| Validacao | Parcial | Testes direcionados passam; gate global padrao nao fecha no ambiente atual. |

## Conclusao honesta

O risco dominante nao e "agente nao roda". O risco dominante continua sendo "agente roda sem governanca suficiente para ser operado com confianca". A diferenca agora e que a familia deixou de ser monoliticamente estrutural: o `boardprep-ai` subiu para `parcial`, mas o portfolio como um todo ainda nao e operacional.

