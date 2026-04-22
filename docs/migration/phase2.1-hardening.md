# Fase 2.1: Hardening do fluxo HubSpot

## O que foi consolidado
Nesta fase, consolidamos o fluxo do conector HubSpot, aplicando as seguintes práticas de resiliência e estabilidade, que servirão como base para futuros conectores. **O fluxo ERP do Omie também foi alinhado a essa infraestrutura de hardening sem a necessidade de iniciar uma nova fase separada.**

- **Normalização de Eventos:** O formato dos eventos inbound e eventos processados foi normalizado em `ConnectorEventJobPayload` (agora suportando `"sync"` como source).
- **Idempotência com externalEventId:** Implementado o campo `externalEventId` para evitar o processamento duplicado de webhooks.
- **Taxonomia de Erro Estendida:** Tipos de erros controlados (`ConnectorExecutionError`) com classificação consistente de *retryable* (rate limit, timeout) e *fatal* (falhas de autenticação). Isso agora inclui adaptadores como o Omie nativamente no mapeamento.
- **Retry Controlado:** Implementada lógica com exponential backoff baseada em retryability dos erros.
- **Credenciais por Tenant:** O conector lida corretamente com chaves atreladas a cada conta, incluindo as tipagens para `{ appKey, appSecret }`.
- **Health Check e Validação:** Adaptadores agora possuem o método `validateCredentials` para realizar health checks robustos.
- **Persistência de Status/Log:** O histórico dos eventos e a resposta real dos conectores agora são persistidos e auditáveis usando a entidade `CrmSyncEvent`.
- **Ajustes de Concorrência e Isolamento:** Alterações feitas nos handlers de filas garantem o isolamento de instâncias `tenantContext` e gerenciam timeouts para eventos concorrentes.
- **Unicidade Restrita a Inbound:** Criado o índice `crm_sync_events_inbound_external_event_id_key`, prevenindo a duplicidade sem afetar fluxos outbound/sync.

## O que continua pendente
- Não há um painel visual (UI) para que o usuário reenvie manualmente um *Failed Sync Event*. Essa dependência manual será resolvida em fases futuras de observability.
- A exclusão em cascata (`onDelete: Cascade`) do `CrmSyncEvent` ao deletar um `Organization` remove todo o histórico, o que pode atrapalhar o billing de logs no futuro se decidirmos faturar por sync.
- A persistência do cursor do Omie no Prisma (`ConnectorSyncCursor`) requer um refactor em etapas futuras para consolidar melhor o tratamento de falhas contínuas de cursor.

## Riscos Ainda Existentes
- Volumes muito massivos de webhooks dos conectores podem inflar rapidamente a tabela `crm_sync_events`. Será necessário implementar cronjobs de *Data Retention* (ex: purge > 30 dias).
- O retry exponencial padrão (backoff) atual usa Redis e BullMQ, o que significa que o job pode ficar represado caso o limite global de processamento do redis atinja o gargalo de memória.

## Validações Executadas
- [x] Tipagem TypeScript (`connectors-core`, `api`, `worker`) - Passed.
- [x] Testes Focados (`runtime.test.ts`, `connector-events.shared.test.ts`, `normalized-events.test.ts`) - Passed.
- [x] Unicidade de EventId validada nas Migrations do Prisma e checagem de Drift vazia.
- [x] Ausência de Node Modules, pastas dist, build ou coverage e tsbuildinfo versionados indevidamente no diff limpo.
