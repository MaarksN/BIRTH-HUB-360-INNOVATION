# Matriz de Riscos

## 🔴 Crítico
- Web irbuildável por `Module not found: @birthub/workflows-core` e React mismatch (apps/web/*). Sem build não há release nem rollback.
- Isolamento de tenant quebrado no Worker (`apps/worker/src/worker.ts:151-166`) e ausência de RLS: risco de vazamento cross-tenant.
- Voice Engine sem autenticação/verificação Twilio e sem execução real de STT/TTS (`apps/voice-engine/src/server.ts:143-205`).
- Billing sem metering ou cobrança ativa; estado de bloqueio apenas em cache Redis, sem Stripe ou suspensão efetiva.

## 🟠 Alto
- `@ts-nocheck` em rotas/infra de API/Worker/Workflows impede validação de contratos e mascara regressões.
- Pacote `@birthub/workflows-core` publicado com artefatos no caminho errado e código de teste dentro de `dist`, quebrando consumidores e release.
- BFF bypass: chamadas diretas para domínio público em fluxos sensíveis (notificações, busca de produto), removendo guardas de sessão/tenant.
- Falta de validação de origem em webhooks externos (Twilio voice); suscetível a abuso e DoS.
- Ausência de métricas/tracing em Voice Engine e integrações; impossibilita SLO e detecção de incidentes.

## 🟡 Médio
- Lint/test suite instáveis: erros conhecidos não bloqueados no fluxo atual; risco de regressão silenciosa.
- Dependência de defaults (`tenantId = "default-tenant"`) e busca da “primeira organização” em execuções de agente.
- Exportação de billing lê invoices sem checar tenant context ou reconciliação com cobrança.
- Cache de billing lock sem invalidação transacional pode deixar tenant ativo mesmo inadimplente.

## 🔵 Baixo
- HTTP client de integrações sem circuit breaker robusto ou correlação por tenant.
- Catálogo e schemas extensos sem particionamento elevam custo de mudança e revisão.

