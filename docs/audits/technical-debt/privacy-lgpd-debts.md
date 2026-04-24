# Dívidas de Privacidade e LGPD


### [TD-115] DÍVIDAS DE PRIVACIDADE E LGPD: PII nos logs
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Verificação manual necessária
- **Impacto:** Vaza CPF/Email no Datadog
- **Risco de não corrigir:** Multa LGPD
- **Recomendação:** Mascarar no logger
- **Esforço:** M
- **Arquivo/Linha:** `apps/api`
- **Evidência/Como detectado:** console.log soltos
- **Correção sugerida:** Redact no Pino/Logger
- **Testes recomendados:** N/A
