# Cycle 5 - Agents Contracts Review

- Data da revisao: 2026-04-11
- Escopo: 15 agentes executivos em `packages/agents/executivos/*`
- Snapshot base: `artifacts/agent-governance/executive-agents-governance.json`
- Fontes canonicas realmente presentes no workspace: `audit/README.md`, `audit/forensic_inventory.md`, `audit/traceability_matrix.md`, `audit/validation_log.md`, `audit/final_governance_report.md`, `audit/auditor-prime-latest.backlog.md`

## Nota de reconciliacao documental

Os arquivos exigidos no prompt original nao existem com esses nomes no workspace em 2026-04-11:

- `audit/source_of_truth.md`
- `audit/master_backlog_revalidated.md`
- `audit/readiness_matrix.md`
- `audit/reconciliation_report.md`
- `audit/phase1_execution_summary.md`
- `audit/cycle2_execution_summary.md`
- `audit/cycle3_execution_summary.md`
- `audit/cycle4_execution_summary.md`

Por isso, o Ciclo 5 foi reconciliado contra as fontes canonicas locais listadas acima e contra evidencia direta de codigo, testes e snapshot de governanca. Nao houve invencao de "source of truth" adicional.

## Resumo executivo

- Todos os 15 agentes possuem `input_schema` e `output_schema` materializados em Zod e associados a `contract.yaml`.
- O endurecimento de coerencia entre contrato e implementacao melhorou: o snapshot atual aponta `contractAliasMismatch: 0` e `toolConstMismatch: 0`.
- O endurecimento continua parcial: `requestId` agora e propagado em 15/15 trilhas locais de evento, mas 14/15 agentes ainda declaram `runtime_enforcement` e `runtime_cycle` sem aplicar esses campos no `agent.ts`.
- A superficie continua frouxa para auditoria: 14/15 `agent.ts`, 15/15 `schemas.ts` e 15/15 `tools.ts` ainda usam `// @ts-nocheck`.
- `any` literal nao foi reduzido de forma material e comprovavel dentro dos agentes executivos. A reducao concreta desta rodada foi de supressoes `@ts-nocheck` em `packages/agent-runtime`, em seu teste e em exports de `packages/agents-core`.
- O snapshot pos-hardening saiu de `15 estrutural` para `14 estrutural` e `1 parcial` (`boardprep-ai`).

## Hardening materializado nesta rodada

- `packages/agent-runtime/index.ts`
  - Tipagem explicita de `RuntimeEventType`, `RuntimeEventMetadata` e `RuntimeEvent`.
  - Rejeicao de `duplicate_step:<id>` e `self_dependency:<id>` em `RuntimeGraph.addStep`.
- `packages/agent-runtime/src/__tests__/runtime.test.ts`
  - Cobertura de duplicidade de step e auto-dependencia.
- `packages/agents-core/src/index.ts`
- `packages/agents-core/src/execution/index.ts`
- `packages/agents-core/src/manifest/index.ts`
- `packages/agents-core/src/runtime/index.ts`
- `packages/agents-core/src/skills/index.ts`
- `packages/agents-core/src/tools/index.ts`
- `packages/agents-core/src/types/index.ts`
  - Remocao de `@ts-nocheck` nas superficies de export e runtime.
- `scripts/audit/executive-agents-governance.mjs`
  - Nova auditoria automatizada de contratos, fallback, observabilidade e maturidade dos agentes executivos.
- `package.json`
  - Novo script `audit:agents:governance`.
- `packages/agents/executivos/*/schemas.ts`
  - Os 15 contratos de evento agora aceitam `requestId` como correlacao no bloco `details`.
- `packages/agents/executivos/*/agent.ts`
  - Os 15 agentes agora injetam `requestId` em todos os eventos emitidos e no payload estruturado enviado ao sink local.
- `packages/agents/executivos/boardprep-ai/tests/test_schema.ts`
  - O unico gap de teste dedicado de schema da familia executiva foi eliminado.
- Contrato/default/tool identity normalizados nos agentes:
  - `capital-allocator`
  - `churn-deflector`
  - `crisis-navigator`
  - `culture-pulse`
  - `expansion-mapper`
  - `market-sentinel`
  - `pipeline-oracle`
  - `pricing-optimizer`

## Revisao de contratos I/O

| Controle | Resultado | Evidencia | Leitura |
| --- | --- | --- | --- |
| Presenca de `input_schema` | 15/15 ok | `contract.yaml` + `*InputSchema` | A camada publica de entrada existe em todos os agentes. |
| Presenca de `output_schema` | 15/15 ok | `contract.yaml` + `*OutputSchema` | A resposta publica esta formalizada em todos os agentes. |
| Coerencia de default contract importado | 15/15 ok | snapshot de governanca | Os aliases frouxos de contrato foram eliminados no estado atual. |
| Coerencia de tool ids importados | 15/15 ok | snapshot de governanca | O risco de copy-paste entre `*_TOOL_IDS` caiu para zero no snapshot atual. |
| `requestId` declarado e usado | 15/15 ok | `requestId` em schema; eventos emitidos; snapshot | A correlacao local por request agora existe no output observavel dos agentes. |
| `runtime_enforcement` / `runtime_cycle` declarados e aplicados | 0/14 ok | `contract.yaml` vs `agent.ts`; snapshot | A governanca existe como metadado morto, nao como regra operacional. |
| Teste dedicado de schema | 15/15 ok | suites em `packages/agents/executivos/*/tests/test_schema.ts` | O contrato publico de todos os agentes agora tem defesa dedicada de schema. |
| Superficie tipada sem supressao | 0/15 ok | `// @ts-nocheck` em `agent.ts`/`schemas.ts`/`tools.ts` | A auditoria estatica do contrato ainda depende de supressao generalizada. |

## Coerencia F1-F5

Nao ha marcacao explicita de fases F1-F5 nos contratos dos agentes executivos. A validacao "F1-F5 quando aplicavel" ficou limitada ao fluxo inferivel no codigo:

- F1: validacao de input via Zod.
- F2: carga do contrato e classificacao da origem.
- F3: execucao de ferramentas com retry local.
- F4: normalizacao de fallback e resposta.
- F5: emissao de eventos de observabilidade no output.

Essa sequencia e observavel, mas nao e auditavel por fase de forma soberana porque:

- nao existe marcador F1-F5 nos YAMLs;
- nao existe marcador formal de fase nos eventos, mesmo com `requestId` agora propagado;
- nao existe policy runtime comum que valide a transicao entre fases.

Conclusao: a coerencia F1-F5 e apenas parcial e nao suporta declaracao de prontidao operacional.

## Contratos ainda frouxos ou incompletos

- `requestId` agora e parte da trilha local de evento, mas ainda nao alimenta um runtime compartilhado ou um sink soberano.
- `runtime_enforcement` e `runtime_cycle` aparecem em 14 contratos e nao dirigem comportamento executavel.
- `human_handoff` existe como modo de falha, mas nao sustenta governanca centralizada de execucao por si so.
- As superficies principais continuam sob `@ts-nocheck`, o que reduz a confianca na aderencia entre contrato e implementacao.

## Conclusao honesta

O sistema de contratos dos agentes executivos melhorou de forma verificavel neste ciclo: a correlacao por `requestId` saiu do contrato e entrou na execucao local, e a familia fechou 15/15 testes dedicados de schema. Ainda assim, o portfolio nao esta duro o suficiente para auditoria operacional porque a correlacao nao chega a uma governanca compartilhada e o enforcement declarado continua sem execucao.

