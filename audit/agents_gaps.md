# Gaps para Nível SaaS (Nível Enterprise)

## Análise Forense da Situação Atual
A auditoria revelou que **nenhum** dos agentes atuais do repositório pode ser considerado "🟢 OPERACIONAL".
A maioria se encontra classificada como **⚫ FAKE** ou **🔴 FRÁGIL**, significando que dependem extensamente de simulações, geradores pseudo-aleatórios (`deterministic()`), e `Math.random()`.

### Principais Lacunas Encontradas

1. **Ausência de Integração Genuína de APIs/Bancos de Dados:**
   - Arquivos como `tools.ts` em `packages/agents/executivos/*` criam a ilusão de execução complexa utilizando funções de hash para forjar saídas numéricas baseadas em tenantId, ao invés de buscar dados reais de um banco de dados, DWH, ERP ou CRM.
   - Isso bloqueia qualquer implantação multi-tenant real, pois as respostas são meras fabricações.

2. **Skills e Packs de Agentes são apenas Placeholders/Metadados:**
   - Em `packages/agents-core/src/skills/`, funções como `runAnalyzerSkill` não utilizam LLMs reais, mas sim filter e contagem de substrings (`includes`) no texto para gerar scores.
   - Os Packs em `corporate-v1` são unicamente estruturas de dados (`mission`, `guardrails`), não havendo orquestração runtime acoplada.

3. **Inexistência de Trilha Completa Multi-Agente em Runtime:**
   - Apesar da forte estrutura de Schemas Zod (muito bem escrita, o que lhes conferiu alta pontuação em Contrato e Prompt/Prompt System), o chassi do motor está oco. Não há conexão de fato com `packages/llm-client`.

## Plano de Ação Estrutural
- Substituir todos os "tool adapters" estáticos por adapters que consultem o Prisma Client em `packages/database`.
- Substituir lógica "hardcoded" de LLM (`includes`, regex) pelas chamadas reais da API da OpenAI ou similares pelo módulo de integrações.
