# Dividas de Agentes, IA, LLM e Tool Calling

## Presenca confirmada

O repositorio possui agentes, runtime, manifests, policy engine, LLM client, tool adapters e worker runtime:

- `packages/agents-core`
- `packages/agent-runtime`
- `packages/agent-packs`
- `packages/llm-client`
- `apps/worker/src/agents`

## Achados confirmados

- `TD-031` - timeout base de tools usa `Promise.race` sem cancelamento real da execucao subjacente.
- `TD-032` - nao foi encontrada evidencia de suite adversarial ampla de prompt injection/exfiltracao.

## Evidencias

- `packages/agents-core/src/tools/baseTool.ts:70-80`.
- `packages/agents-core/src/tools/httpTool.ts:7-17` define schema estrito de input HTTP.
- `packages/agents-core/src/tools/httpTool.ts:126` usa `AbortSignal.timeout`, ponto positivo para HTTP.
- Testes manuais `apps/worker/src/agents/runtime.tools.test.ts`, `runtime.tools.db-write.test.ts` e `runtime.orchestration.test.ts` passaram 6/6.

## Controles positivos observados

- Policy engine avalia permissao antes de tool execution em `BaseTool`.
- HTTP tool tem schema Zod estrito, retries limitados e timeout.
- Testes selecionados cobrem allowlist/db-write/tenant audit.
- Manifests incluem linguagem de guardrails e approval.

## Lacunas a verificar

- Prompt injection com dados vindos de usuarios/integracoes.
- Exfiltracao de secrets via contexto.
- Human approval obrigatorio para todas as tools sensiveis, nao apenas as testadas.
- Limite de custo/tokens/chamadas por tenant/user em execucao real.
- Replay/debug seguro sem PII.
- Separacao planner/executor e validacao de saida estruturada por todos os agentes.

## Recomendacoes

1. Adicionar corpus adversarial por categoria: secrets, tenant escape, destructive action, prompt override e data exfiltration.
2. Propagar `AbortSignal` pelo contrato de tools.
3. Criar allowlist central por tenant/agent/tool e gerar relatorio de diff.
4. Exigir approval auditavel para `db-write`, email, HTTP mutating, shell/code e pagamentos.
5. Definir budgets de tokens/custo/tempo por execucao.

## Testes recomendados

- Tests de policy negativa por tool.
- Evals de prompt injection.
- Teste de timeout que comprova cancelamento fisico.
- Teste de tenant isolation em memoria/handoff.
- Teste de structured output invalidando JSON malformado.
