# Padrao oficial de manifesto de agente

Este documento define o contrato ideal para todo agente novo ou revisado do catalogo `packages/agent-packs`.

O padrao tem duas camadas:

- Contrato de manifest: campos JSON exigidos pelo runtime e pelo catalogo.
- Contrato especifico do agente: secoes curtas dentro de `agent.prompt` com identidade, gatilhos, entradas, objetivos, ferramentas, saidas e schema.
- Protocolo comum de runtime: `premiumProtocol` em `packages/agents-core/src/runtime/premiumProtocol.ts`, injetado pelo catalogo antes da execucao.

Template oficial: `packages/agent-packs/templates/agent-manifest.template.json`.

## Criterio de pronto

Um agente novo ou revisado so esta pronto quando:

- Tem objetivo, quando usar, entradas obrigatorias, saida esperada, ferramentas reais, policies e formato de saida especificos.
- Mantem no prompt fonte apenas comportamento especifico do agente; governanca, memoria, evidencia, aprovacao, handoff e aprendizado comum ficam no `premiumProtocol`.
- O `agent.id`, ids de skills, ids de tools e ids de policies usam o mesmo prefixo.
- Toda ferramenta citada no prompt existe em `tools`.
- Toda acao sensivel citada no prompt esta coberta por `policies`.
- O protocolo comum de runtime explica como degradar, pedir aprovacao, preservar evidencia e transferir contexto sem inventar dados.
- A saida esperada tem schema objetivo e inclui confianca, dono, prazo e checkpoint quando houver recomendacao.
- `pnpm --filter @birthub/agent-packs validate` passa.

## Campos obrigatorios padronizados

| Campo do contrato | Onde fica | Padrao |
| --- | --- | --- |
| objetivo | `agent.prompt` em `OBJETIVO` e resumo em `agent.description` | Define resultado de negocio, dono funcional e impacto esperado. |
| quando usar | `agent.prompt` em `QUANDO USAR` | Lista gatilhos objetivos, eventos ou pedidos que acionam o agente. |
| entradas obrigatorias | `agent.prompt` em `ENTRADAS OBRIGATORIAS` | Lista dados minimos, fonte, recencia, tenant, escopo e restricoes. |
| saida esperada | `agent.prompt` em `SAIDA ESPERADA` e `FORMATO DE SAIDA` | Define entregaveis e schema, com status, evidencias, lacunas, recomendacoes e checkpoint. |
| ferramentas reais | `tools` e `agent.prompt` em `FERRAMENTAS REAIS` | Declara apenas ferramentas com adapter ou binding existente no runtime. |
| policies | `policies`; protocolo comum em runtime | Declara actions permitidas, limites de execucao, aprovacao e auditoria. |
| fallback | protocolo comum em runtime | Define falha de ferramenta, dado ausente, baixa confianca e resposta degradada. |
| handoff | protocolo comum em runtime; opcionalmente `GUARDRAILS ESPECIFICOS` | Define destino, condicao de transferencia e payload minimo. |
| criterios de qualidade | protocolo comum em runtime; opcionalmente `CRITERIOS DE QUALIDADE ESPECIFICOS` | Define checagens de evidencia, schema, rastreabilidade, dono e risco. |

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
- `prompt`: contrato especifico do agente; o protocolo comum e aplicado em runtime.
- `tenantId`: use `catalog` para manifests publicados no catalogo.
- `version`: versao semantica do agente.
- `changelog`: uma linha por mudanca relevante.

## Secoes do prompt fonte

Use estes titulos no manifesto-fonte. Eles devem carregar apenas comportamento especifico do agente:

1. `IDENTIDADE E MISSAO`
2. `OBJETIVO` ou `OBJETIVOS PRIORITARIOS`
3. `QUANDO USAR` ou `QUANDO ACIONAR`
4. `ENTRADAS OBRIGATORIAS`
5. `FERRAMENTAS REAIS` ou `FERRAMENTAS ESPERADAS`
6. `SAIDA ESPERADA` ou `SAIDAS OBRIGATORIAS`
7. `GUARDRAILS ESPECIFICOS` quando houver limite exclusivo daquele agente
8. `CRITERIOS DE QUALIDADE ESPECIFICOS` quando houver checagem exclusiva daquele agente
9. `FORMATO DE SAIDA`

## Protocolo comum de runtime

O catalogo carrega manifests com `loadManifestCatalog`, que chama `enhanceManifestWithPremiumProtocol`.
Esse passo injeta `PROTOCOLO PREMIUM GLOBAL 100` e `PROTOCOLO PREMIUM COMUM` no prompt efetivo.

O protocolo comum cobre:

- raciocinio operacional esperado
- modo de operacao autonoma
- rotina de monitoramento e antecipacao
- criterios de priorizacao
- criterios de escalacao
- governanca, evidencia e aprovacao
- handoff
- guardrails comuns
- criterios de qualidade comuns
- aprendizado compartilhado

Os validadores devem checar o prompt efetivo de runtime, nao apenas o JSON bruto. Assim o manifesto fica menor sem perder governanca na execucao.

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

- Existe adapter ou binding no runtime.
- Tem `id`, `name`, `description`, `inputSchema`, `outputSchema` e `timeoutMs`.
- O nome citado no prompt e identico ao nome em `tools`.
- A policy permite a acao necessaria.

Se a capacidade ainda nao existe, registre como gap fora de `tools`; nao finja que a ferramenta executa.

### Policies

Policies devem cobrir apenas o que o agente pode fazer. O protocolo comum assume que as acoes abaixo existem quando forem necessarias:

- `tool:execute` para chamar ferramentas.
- `memory:read` e `memory:write` para memoria operacional.
- `learning:read` e `learning:write` para aprendizado compartilhado.
- `audit:write` para rastreabilidade.
- `report:read` para leitura de relatorios.
- `approval:request` para acao sensivel.
- `decision:recommend` para recomendacao.
- `workflow:trigger` para disparar workflow governado.

Use `deny` quando uma restricao precisa ficar explicita.

### Guardrails especificos

Use `GUARDRAILS ESPECIFICOS` apenas para limites que nao pertencem ao protocolo comum. O comum ja cobre:

- proibicao de inventar dados, fatos, metricas, aprovacoes ou decisoes
- isolamento entre tenants
- exigencia de aprovacao para acao sensivel
- rastreabilidade e auditoria
- confianca explicita
- proximo passo seguro quando houver lacuna

### Criterios de qualidade especificos

Use `CRITERIOS DE QUALIDADE ESPECIFICOS` para regras de dominio, schema ou ferramenta. O protocolo comum ja checa:

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
- Nao repita blocos comuns de governanca, memoria, evidencia, aprovacao ou handoff.
- Quando precisar de regra propria, escreva como `GUARDRAILS ESPECIFICOS` ou `CRITERIOS DE QUALIDADE ESPECIFICOS`.

## Checklist de revisao

Antes de aprovar um agente novo ou revisado:

- [ ] `manifestVersion` e `agent.version` definidos.
- [ ] `agent.id` unico e em kebab-case.
- [ ] `agent.description` tem resultado de negocio e dominio.
- [ ] Prompt fonte contem apenas as secoes especificas necessarias.
- [ ] `FERRAMENTAS REAIS` bate com `tools`.
- [ ] `policies` cobrem ferramentas, memoria, learning, auditoria, aprovacao e workflow quando usados.
- [ ] Prompt efetivo de runtime inclui `PROTOCOLO PREMIUM COMUM`.
- [ ] `FORMATO DE SAIDA` e valido e acionavel.
- [ ] Skills, tools e policies usam prefixo do agente.
- [ ] Keywords e tags ajudam descoberta no catalogo.
- [ ] Validacao passa com `pnpm --filter @birthub/agent-packs validate`.

## Relacao com agentes existentes

Os agentes inventariados devem permanecer enxutos no manifesto-fonte. Ao revisar qualquer agente, nao reintroduza blocos comuns que ja pertencem ao `premiumProtocol`.

Para migracoes em lote, priorize:

1. `corporate-v1` core.
2. Pares duplicados entre `executive-premium-v1` e `github-agents-v1`.
3. Especialistas de alto uso.
4. Long tail e experimentais.
