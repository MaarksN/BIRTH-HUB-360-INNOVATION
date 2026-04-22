# Alertas Mínimos de Observabilidade (Foco no Core Canônico)

A operação deve priorizar detecção e resposta para o **core canônico**: `apps/web`, `apps/api`, `apps/worker` e `packages/database`. Alertas de satélite devem ser configurados sem competir com a resposta de incidentes P0 do core.

Fonte canônica de fronteiras: `docs/service-catalog.md`.

## Escopo e severidade

- **P0**: risco imediato ao fluxo principal do core.
- **P1**: degradação relevante sem interrupção total do core.
- **P2**: impacto moderado em satélites.
- **P3**: legado/quarentena, sem rota principal de produção.

Referências de política: `docs/operations/f0-sla-severity-policy.md` e `infra/monitoring/alert.rules.yml`.

## 1) `apps/api` (core)

**Indisponibilidade**
- **Threshold**: `up{job="api"} == 0` por 2 min.
- **Ação**: `P0`.

**Erro HTTP 5xx**
- **Threshold**: `> 5%` das requisições por 10 min.
- **Ação**: `P1`.

**Latência P95**
- **Threshold**: P95 `> 500ms` por 10 min.
- **Ação**: `P2`.

## 2) `apps/web` (core)

**Indisponibilidade**
- **Threshold**: `up{job="web"} == 0` por 2 min.
- **Ação**: `P0`.

**Disponibilidade degradada**
- **Threshold**: `> 5%` das verificações de health/readiness com status `degraded` por 10 min.
- **Ação**: `P1`.

**Latência P95 da readiness**
- **Threshold**: P95 `> 400ms` por 10 min.
- **Ação**: `P2`.

## 3) `apps/worker` (core)

**Indisponibilidade**
- **Threshold**: `up{job="worker"} == 0` por 2 min.
- **Ação**: `P0`.

**Backlog de fila**
- **Threshold**: `> 200` jobs pendentes por 10 min.
- **Ação**: `P2`.

**DLQ crescendo**
- **Threshold**: mais de `5` novos jobs em DLQ em 10 min, sustentado por 5 min.
- **Ação**: `P1`.

**Fail-rate de job**
- **Threshold**: `> 10%` de jobs falhos por 10 min.
- **Ação**: `P1`.

## 4) `packages/database` (core)

**Saturação de conexões**
- **Threshold**: `birthub_db_connection_pool_usage_ratio > 0.9` por 10 min.
- **Ação**: `P2`.

**Erro de consulta/transação**
- **Threshold**: taxa de erro de query `> 2/s` por 10 min.
- **Ação**: `P1`.

## Satélites e legado

- **Satélites** (`packages/agent-packs`, `apps/webhook-receiver`, `apps/voice-engine`): alertar no máximo em `P1/P2`, com roteamento que não interrompa triagem do core.
- **Legacy/quarentena** (`apps/legacy/dashboard`, `apps/api-gateway`, `apps/agent-orchestrator`, `packages/db`): sem política de alerta `P0`; tratar como `P3` e janela de manutenção.
- **Regra operacional:** nenhuma superfície fora do core pode abrir incidente `P0` por padrão.

## Pós-alerta

A emissão de alerta inicia o runbook de investigação (`docs/runbooks/critical-incidents.md`).
- `P0`: acionamento imediato de on-call.
- `P1`: triagem em até 15 min.
- `P2/P3`: fila operacional e correção programada.
