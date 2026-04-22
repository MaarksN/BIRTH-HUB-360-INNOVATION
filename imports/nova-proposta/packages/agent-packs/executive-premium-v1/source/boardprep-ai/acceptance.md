<!-- [SOURCE] BirthHub360 Checklist Universal + Protocolo de Governanca Cruzada -->
# BoardPrepAI - Acceptance Criteria

| Criterio | Input minimo | Output esperado | Como verificar | Evidencia |
|---|---|---|---|---|
| Sucesso Nominal | contexto da reuniao + KPIs + riscos + decisoes pendentes | Status `success` e schema valido com `boardBrief.resumo_executivo`, `kpis_chave`, `riscos`, `decisoes_requeridas`, `recomendacoes` e `lacunas_de_informacao` | Validar contra `BoardPrepAIOutputSchema` | `tests/test_unit.ts` |
| Dados Faltantes | request com `requiredMetrics` nao totalmente coberto por `kpis` | Status `fallback`, `mode=human_handoff` e lacunas listadas sem numero inventado | Executar teste com metrica ausente | `tests/test_unit.ts` |
| Falha Parcial de Tool | uma ou mais tools falham | Fallback aplicado = `true`, status = `fallback` e output degradado com razoes registradas | Garantir retry schedule e fallback emitido | `agent.ts`, `tests/test_unit.ts` |
| Hard Fail | contrato com `failureMode=hard_fail` e tools indisponiveis | Output `status=error` explicito | Simular falha total de adapters | `tests/test_unit.ts` |
| Observabilidade | execucao limpa | Todos eventos emitidos (`request.received`, `tool.call.started`, `fallback.applied`, `response.generated`) | Acompanhar `observability.events` | `agent.ts`, `tests/test_unit.ts` |
| Schema Estrito | payload com campo extra nao declarado | Rejeicao do input com erro explicito de validacao | Validar com Zod em testes de schema ou unit | `schemas.ts`, `tests/test_unit.ts` |
