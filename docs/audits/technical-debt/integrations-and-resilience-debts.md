# Dívidas de Integração e Resiliência


### [TD-111] DÍVIDAS DE CONCORRÊNCIA E CONSISTÊNCIA: Race conditions em filas
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Jobs processados duas vezes
- **Risco de não corrigir:** Corrupção de estado
- **Recomendação:** Garantir idempotency key
- **Esforço:** M
- **Arquivo/Linha:** `packages/queue`
- **Evidência/Como detectado:** Uso de BullMQ
- **Correção sugerida:** Check de idempotência no worker
- **Testes recomendados:** Teste concorrência

### [TD-112] DÍVIDAS DE INTEGRAÇÃO: Webhooks sem validação
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Verificação manual necessária
- **Impacto:** Aceita payloads falsos
- **Risco de não corrigir:** Ataque SSRF/Spoofing
- **Recomendação:** Validar assinatura e assertSafeUrl
- **Esforço:** M
- **Arquivo/Linha:** `apps/api/src/webhooks`
- **Evidência/Como detectado:** N/A
- **Correção sugerida:** Adicionar middleware
- **Testes recomendados:** Teste de integração falho

### [TD-118] DÍVIDAS DE RESILIÊNCIA OPERACIONAL: Falta de timeout em chamadas externas
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Verificação manual necessária
- **Impacto:** Gargalo de I/O
- **Risco de não corrigir:** Indisponibilidade API
- **Recomendação:** Adicionar AbortController
- **Esforço:** P
- **Arquivo/Linha:** `packages/connectors-core`
- **Evidência/Como detectado:** Uso de fetch solto
- **Correção sugerida:** Timeout
- **Testes recomendados:** Teste de timeout
