# Cycle 5 - Agents Runtime Governance

- Data da revisao: 2026-04-11
- Escopo: runtime e governanca de 15 agentes executivos
- Snapshot base: `artifacts/agent-governance/executive-agents-governance.json`

## Estado atual

- Agentes avaliados: 15
- Retry budget presente: 15/15
- Fallback handling presente: 15/15
- `requestId` declarado e propagado na trilha local de eventos: 15/15
- `runtime_enforcement` declarado no contrato: 14/15
- `runtime_enforcement` realmente aplicado: 0/14
- Logging via `console.*`: 15/15
- Maturidade real segundo o snapshot: 14/15 `estrutural`, 1/15 `parcial`, 0 `operacional`, 0 `fragil`

## Leitura de execucao

Os agentes executivos executam um fluxo local coerente:

1. validam entrada;
2. carregam contrato default ou custom;
3. acionam tools com retry local;
4. aplicam fallback quando necessario;
5. retornam output estruturado com eventos e metricas.

Esse fluxo existe e foi observado nos testes executados neste ciclo. O problema nao e ausencia de comportamento, e ausencia de governanca executavel de plataforma sobre esse comportamento.

## Failure behavior e fallback

Pontos positivos:

- Todos os agentes revisados tem modos de falha declarados.
- Todos os agentes revisados implementam retry local.
- Todos os agentes revisados conseguem emitir resposta `success`, `fallback` ou `error`.

Pontos que impedem classificacao operacional:

- O teto de governanca de runtime continua local ao agente e nao ao runtime compartilhado.
- `runtime_enforcement` e `runtime_cycle` sao declarados e ignorados no caminho de execucao.
- O fallback nao vira trilha operacional centralizada com correlacao, fila ou politica comum de escalacao.
- O `requestId` agora correlaciona os eventos emitidos, mas essa correlacao ainda nao alimenta um runtime compartilhado nem um sink central.

## Classificacao de maturidade

| Classe | Quantidade | Agentes | Justificativa |
| --- | --- | --- | --- |
| parcial | 1 | `boardprep-ai` | O agente passou a propagar `requestId`, fechou o teste de schema e reduziu o numero de gaps graves, mas ainda depende de `console.*` e de superficies sob `@ts-nocheck`. |
| estrutural | 14 | `brand-guardian`, `budget-fluid`, `capital-allocator`, `churn-deflector`, `competitor-xray`, `crisis-navigator`, `culture-pulse`, `expansion-mapper`, `market-sentinel`, `narrative-weaver`, `pipeline-oracle`, `pricing-optimizer`, `quota-architect`, `trend-catcher` | Todos possuem contrato, schema, retry, fallback e testes; todos ainda acumulam governanca de runtime nao aplicada e dependencia forte de `@ts-nocheck` e `console.*`. |

Nenhum agente foi classificado como `operacional` porque nao ha evidencia de execucao governada com:

- correlacao por `requestId` roteada para uma infraestrutura de plataforma;
- enforcement de runtime declarado;
- observabilidade roteada para um sink operacional;
- gate de validacao global verde.

## Riscos de execucao nao controlada

- Politicas declaradas em YAML nao governam o comportamento executavel.
- Falhas e fallback ficam encapsulados dentro do agente e nao sob orquestracao soberana.
- Nao ha evidencia de kill switch, circuit breaker comum ou dead-letter para a familia executiva.
- A resposta final informa fallback, mas a plataforma nao demonstra rastrear taxa de fallback por agente.

## Validacao executada

Comandos executados neste ciclo:

- `pnpm typecheck`
  - Falhou no workspace atual porque o script depende de `corepack`, que nao esta disponivel no ambiente; o comando tambem acusou `Unsupported engine` para Node `v25.9.0` quando o repo pede `>=24 <25`.
- `pnpm lint`
  - Falhou pelo mesmo motivo: `corepack` ausente e engine fora da faixa desejada.
- Testes dos agentes executivos
  - `node --import tsx --test ...`
  - Resultado: `61 pass`, `0 fail`.

Familia coberta nos testes desta rodada:

- todos os 15 agentes executivos sob `packages/agents/executivos/*/tests/*.ts`

## Conclusao honesta

O sistema executivo nao esta quebrado no sentido funcional local. Ele melhorou de forma real neste ciclo e ja tem 1 agente em estado `parcial`, mas o portfolio ainda nao ultrapassa a fronteira da governanca local por agente. Sem enforcement compartilhado e sem sink operacional, a familia continua controlavel mais pelo codigo do agente do que pela plataforma.

