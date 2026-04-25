# Dívidas de Agentes IA e LLM


### [TD-117] DÍVIDAS DE AGENTES, IA, LLM E TOOL CALLING: Ação destrutiva sem aprovação humana
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Verificação manual necessária
- **Impacto:** Agente apaga dados
- **Risco de não corrigir:** Dano irreversível
- **Recomendação:** Require human approval tool
- **Esforço:** G
- **Arquivo/Linha:** `packages/agent-runtime`
- **Evidência/Como detectado:** Workflow de agente
- **Correção sugerida:** Adicionar human-in-the-loop
- **Testes recomendados:** Teste de permissão de tool
