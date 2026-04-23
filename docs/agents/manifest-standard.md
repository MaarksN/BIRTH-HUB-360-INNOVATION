# Padrao oficial de manifesto de agente

Este documento define o contrato ideal para todo agente novo ou revisado do catalogo `packages/agent-packs`.

O padrao tem duas camadas:

- Contrato de manifest: campos JSON exigidos pelo runtime e pelo catalogo.
- Contrato operacional: secoes obrigatorias dentro de `agent.prompt`, escritas de forma consistente para governanca, fallback e handoff.

Template oficial: `packages/agent-packs/templates/agent-manifest.template.json`.

## Criterio de pronto

Um agente novo ou revisado so esta pronto quando:

- Tem objetivo, quando usar, quando nao usar, entradas obrigatorias, saida esperada, ferramentas reais, policies, fallback, handoff e criterios de qualidade.
- O `agent.id`, ids de skills, ids de tools e ids de policies usam o mesmo prefixo.
- Toda ferramenta citada no prompt existe em `tools`.
- Toda acao sensivel citada no prompt esta coberta por `policies`.
- O fallback explica como degradar sem inventar dados.
- O handoff explica quando transferir, para quem e com qual contexto.
- A saida esperada tem schema objetivo e inclui confianca, dono, prazo e checkpoint quando houver recomendacao.
- `pnpm --filter @birthub/agent-packs validate` passa.

## Campos obrigatorios padronizados

| Campo do contrato | Onde fica | Padrao |
| --- | --- | --- |
| objetivo | `agent.prompt` em `OBJETIVO` e resumo em `agent.description` | Define resultado de negocio, dono funcional e impacto esperado. |
| quando usar | `agent.prompt` em `QUANDO USAR` | Lista gatilhos objetivos, eventos ou pedidos que acionam o agente. |
| quando nao usar | `agent.prompt` em `QUANDO NAO USAR` | Define limites, exclusoes e casos que exigem outro agente ou humano. |
| entradas obrigatorias | `agent.prompt` em `ENTRADAS OBRIGATORIAS` | Lista dados minimos, fonte, recencia, tenant, escopo e restricoes. |
| saida esperada | `agent.prompt` em `SAIDA ESPERADA` e `FORMATO DE SAIDA` | Define entregaveis e schema, com status, evidencias, lacunas, recomendacoes e checkpoint. |
| ferramentas reais | `tools` e `agent.prompt` em `FERRAMENTAS REAIS` | Declara apenas ferramentas com adapter real ou binding planejado e dono tecnico claro. |
| policies | `policies` e `agent.prompt` em `POLICIES E LIMITES` | Declara actions permitidas, limites de execucao, aprovacao e auditoria. |
| fallback | `agent.prompt` em `FALLBACK` | Define falha de ferramenta, dado ausente, baixa confianca e resposta degradada. |
| handoff | `agent.prompt` em `HANDOFF` | Define destino, condicao de transferencia e payload minimo. |
| criterios de qualidade | `agent.prompt` em `CRITERIOS DE QUALIDADE` | Define checagens de evidencia, schema, rastreabilidade, dono e risco. |

## Estrutura JSON do manifesto

Todo manifest instalavel deve seguir o schema de `packages/agents-core/src/manifest/schema.ts`.

Campos de raiz:

- `manifestVersion`: sempre `1.0.0`.
- `agent`: identidade, descricao, prompt, versao e tipo.
- `keywords`: no minimo 5 termos buscaveis, sem duplicatas.
- `tags`: `domain`, `level`, `persona`, `use-case`, `industry`.
- `skills`: capacidades declaradas do agente.
- `tools`: ferramentas chamaveis pelo runtime.
- `policies`: acoes permitidas ou negadas.

Campos de `agent`:

- `id`: kebab-case, unico no catalogo, normalmente com sufixo `-pack`.
- `kind`: `agent` para agentes instalaveis; `catalog` apenas para descritores de colecao.
- `name`: nome humano curto.
- `description`: uma frase com resultado, dominio e usuario principal.
- `prompt`: contrato operacional completo.
- `tenantId`: use `catalog` para manifests publicados no catalogo.
- `version`: versao semantica do agente.
- `changelog`: uma linha por mudanca relevante.

## Secoes obrigatorias do prompt

Use exatamente estes titulos, nesta ordem, em agentes novos ou revisados:

1. `IDENTIDADE E MISSAO`
2. `OBJETIVO`
3. `QUANDO USAR`
4. `QUANDO NAO USAR`
5. `ENTRADAS OBRIGATORIAS`
6. `RACIOCINIO OPERACIONAL ESPERADO`
7. `MODO DE OPERACAO AUTONOMA`
8. `ROTINA DE MONITORAMENTO E ANTECIPACAO`
9. `CRITERIOS DE PRIORIZACAO`
10. `CRITERIOS DE ESCALACAO`
11. `FERRAMENTAS REAIS`
12. `POLICIES E LIMITES`
13. `FALLBACK`
14. `HANDOFF`
15. `SAIDA ESPERADA`
16. `CRITERIOS DE QUALIDADE`
17. `APRENDIZADO COMPARTILHADO`
18. `FORMATO DE SAIDA`

### Objetivo

Escreva o objetivo como um resultado, nao como uma atividade. Bom: "proteger margem e previsibilidade de caixa". Fraco: "analisar dados financeiros".

Inclua:

- Resultado principal.
- Impacto de negocio.
- Dono funcional.
- Decisao que o agente ajuda a tomar.

### Quando usar

Liste situacoes observaveis:

- Evento recebido.
- Pedido do usuario.
- Mudanca em metricas.
- Deadline ou aprovacao pendente.
- Incidente, risco, oportunidade ou decisao recorrente.

Evite gatilhos vagos como "quando precisar de ajuda".

### Quando nao usar

Todo agente precisa declarar fronteiras. Inclua:

- Fora de dominio.
- Baixa confianca ou dados minimos ausentes.
- Acao sensivel sem aprovacao.
- Caso em que outro agente e dono primario.

### Entradas obrigatorias

Cada entrada deve dizer o tipo de informacao, fonte esperada e impacto se estiver ausente.

Padrao minimo:

- `tenant_id`
- objetivo ou evento gatilho
- escopo temporal
- artefatos ou dados minimos
- restricoes de policy
- dependencias e aprovacoes
- fonte, recencia e confianca das evidencias

### Saida esperada

A saida deve ser acionavel. Inclua:

- `summary`
- `status`
- evidencias usadas
- lacunas de informacao
- recomendacoes priorizadas
- dono
- prazo
- checkpoint
- confianca
- aprovacoes, dependencias e handoffs
- flag de fallback quando aplicado

Se o agente exige JSON, o prompt deve dizer para retornar apenas JSON valido.

### Ferramentas reais

Nao declare ferramenta decorativa. Uma ferramenta e real quando:

- Existe adapter ou binding no runtime, ou ha tarefa tecnica explicita para cria-lo.
- Tem `id`, `name`, `description`, `inputSchema`, `outputSchema` e `timeoutMs`.
- O nome citado no prompt e identico ao nome em `tools`.
- A policy permite a acao necessaria.

Se a capacidade ainda nao existe, registre como gap; nao finja que a ferramenta executa.

### Policies

Policies devem cobrir apenas o que o agente pode fazer. Padrao recomendado:

- `tool:execute` para chamar ferramentas.
- `memory:read` e `memory:write` para memoria operacional.
- `learning:read` e `learning:write` para aprendizado compartilhado.
- `audit:write` para rastreabilidade.
- `report:read` para leitura de relatorios.
- `approval:request` para acao sensivel.
- `decision:recommend` para recomendacao.
- `workflow:trigger` para disparar workflow governado.

Use `deny` quando uma restricao precisa ficar explicita.

### Fallback

Fallback e obrigatorio. Ele deve responder:

- O que acontece se a ferramenta falhar?
- O que acontece se faltar dado critico?
- O que acontece se os dados forem conflitantes?
- O que acontece se a confianca for baixa?
- Qual status o agente retorna?
- O que o agente nunca pode inventar?

Padrao de saida em fallback:

- `status: "fallback"`
- `fallback_applied: true`
- `missing_inputs`
- `safe_next_step`
- `human_decision_required` quando aplicavel

### Handoff

Handoff e obrigatorio mesmo quando raro. Ele deve definir:

- Condicao de transferencia.
- Agente ou dominio de destino.
- Motivo do handoff.
- Contexto minimo enviado.
- Quem permanece responsavel pelo resumo final.

Payload minimo:

- objetivo
- evidencias
- decisao pendente
- risco
- dono
- prazo
- confianca
- artefatos usados

### Criterios de qualidade

Todo agente deve checar:

- Fatos separados de inferencias.
- Ausencia de informacao explicitada.
- Recomendacao ligada a evidencia.
- Impacto, urgencia, reversibilidade e confianca.
- Dono e checkpoint.
- Handoff ou aprovacao quando necessario.
- Nenhum dado de outro tenant.
- Nenhuma ferramenta ou policy inexistente.

## Guia de escrita

### Nomes

- `agent.id`: kebab-case, especifico e estavel. Exemplo: `cash-flow-risk-pack`.
- `agent.name`: nome humano com dominio. Exemplo: `Cash Flow Risk Agent Pack`.
- `skill.id`: prefixado pelo agent id. Exemplo: `cash-flow-risk-pack.skill.scenario-review`.
- `tool.id`: prefixado pelo agent id. Exemplo: `cash-flow-risk-pack.tool.erp-reader`.
- `policy.id`: prefixado pelo agent id. Exemplo: `cash-flow-risk-pack.policy.standard`.

Evite nomes genericos como `assistant`, `analyzer`, `bot-1` ou `premium-agent` sem dominio.

### Descricoes

A descricao deve ter uma frase curta:

- quem usa
- qual decisao ou entrega
- qual limite de escopo

Formato recomendado:

`Agent for [domain owner] to [business outcome] using [main evidence/tools], with governed fallback and handoff.`

### Prompts

Escreva prompts como contrato operacional:

- Use frases diretas.
- Prefira bullets verificaveis.
- Evite repetir adjetivos como "premium" sem efeito operacional.
- Nunca esconda lacuna de dado.
- Nunca autorize acao sensivel fora de policy.
- Sempre diga quando pedir aprovacao.
- Sempre diga como degradar.
- Sempre diga como transferir contexto.

## Checklist de revisao

Antes de aprovar um agente novo ou revisado:

- [ ] `manifestVersion` e `agent.version` definidos.
- [ ] `agent.id` unico e em kebab-case.
- [ ] `agent.description` tem resultado de negocio e dominio.
- [ ] Prompt contem todas as secoes obrigatorias.
- [ ] `QUANDO NAO USAR` tem limites reais.
- [ ] `FERRAMENTAS REAIS` bate com `tools`.
- [ ] `POLICIES E LIMITES` bate com `policies`.
- [ ] `FALLBACK` cobre ferramenta, dado ausente, conflito e baixa confianca.
- [ ] `HANDOFF` define destino, condicao e payload.
- [ ] `FORMATO DE SAIDA` e valido e acionavel.
- [ ] Skills, tools e policies usam prefixo do agente.
- [ ] Keywords e tags ajudam descoberta no catalogo.
- [ ] Validacao passa com `pnpm --filter @birthub/agent-packs validate`.

## Relacao com agentes existentes

Os 392 agentes inventariados podem continuar no formato atual ate revisao. Ao revisar qualquer agente, aplique este padrao completo e registre a mudanca no `agent.changelog`.

Para migracoes em lote, priorize:

1. `corporate-v1` core.
2. Pares duplicados entre `executive-premium-v1` e `github-agents-v1`.
3. Especialistas de alto uso.
4. Long tail e experimentais.
