# Cycle 5 - Agents Observability

- Data da revisao: 2026-04-11
- Escopo: observabilidade dos 15 agentes executivos
- Snapshot base: `artifacts/agent-governance/executive-agents-governance.json`

## Baseline observado

- 15/15 agentes possuem eventos e metricas estruturados no schema de output.
- 15/15 agentes acumulam eventos normalizados durante a execucao.
- 15/15 agentes escrevem o sink final em `console.error`, `console.warn` e `console.log`.
- 15/15 agentes exigem `requestId` no contrato de entrada.
- 15/15 agentes agora propagam `requestId` para os eventos emitidos e para o payload estruturado enviado ao sink local.

## O que existe

| Camada | Estado atual | Leitura |
| --- | --- | --- |
| Modelo de evento | Presente em todos os `schemas.ts` | O shape existe e os eventos sao semanticamente nomeados por agente. |
| Metricas de output | Presente em todos os `schemas.ts` | `durationMs`, `retries`, `toolCalls` e `toolFailures` estao padronizados. |
| Emissao de eventos | Presente em todos os `agent.ts` | Os agentes usam `events.push(normalized)` e retornam a trilha no output. |
| Sink operacional | Ausente | O encaminhamento final permanece em `console.*`, sem roteamento compartilhado. |
| Correlacao ponta a ponta | Parcial | `requestId` entrou na telemetria local do agente, mas nao em uma infraestrutura de observabilidade da plataforma. |

## Pontos cegos

- A correlacao por `requestId` agora existe por agente, mas nao ha prova de consolidacao dessa trilha fora do processo local.
- Nao ha evidencia de agregacao central de taxa de fallback por agente.
- Nao ha evidencia de agregacao central de falha por tool.
- Nao ha evidencia de alerta quando um agente ultrapassa retry budget ou entra em fallback repetido.
- Nao ha evidencia de auditoria por tenant ou por request para a familia executiva.

## Evidencias representativas

- `packages/agents/executivos/boardprep-ai/agent.ts`
- `packages/agents/executivos/brand-guardian/agent.ts`
- `packages/agents/executivos/pricing-optimizer/agent.ts`

O mesmo padrao de sink `console.error` / `console.warn` / `console.log` se repete nos 15 agentes.

## Continuidade com backlog existente

O backlog local ja registrava parte desse problema:

- `audit/auditor-prime-latest.backlog.md`
  - `TD-042` Observabilidade inconsistente por uso de console em runtime (`boardprep-ai`)
  - `TD-043` Observabilidade inconsistente por uso de console em runtime (`brand-guardian`)

O Ciclo 5 confirma que o problema nao e pontual. Ele e sistemico na familia de agentes executivos.

## Leitura de maturidade

Os agentes executivos possuem "observabilidade de payload correlacionado", nao "observabilidade operacional".

Isso significa:

- o schema sabe descrever eventos;
- o runtime local sabe acumular eventos e agora carregar `requestId`;
- a plataforma ainda nao demonstra coletar, correlacionar e agir sobre esses eventos.

Sem sink compartilhado e metrica central por agente, a observabilidade atual serve para depuracao local e teste, mas nao para governanca de execucao.

## Minimo necessario antes de declarar prontidao operacional

Antes de promover qualquer agente executivo para `operacional`, a plataforma precisa demonstrar ao menos:

- promocao de `requestId` do payload local para contexto operacional compartilhado;
- sink estruturado e compartilhado para os 15 agentes;
- medicao central de `fallback_rate`, `tool_failure_rate`, `retry_count` e `duration_ms`;
- capacidade de rastrear uma execucao individual de ponta a ponta sem depender de console local.

## Conclusao honesta

Observabilidade melhorou neste ciclo porque a correlacao local por `requestId` deixou de ser apenas declarativa. Ainda assim, o gap principal continua sendo de plataforma: falta sink, agregacao e capacidade de operar sobre essa telemetria fora do processo local.
