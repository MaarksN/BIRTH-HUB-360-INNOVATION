# Phase 2.4 Omie

## Objetivo

Entregar um conector Omie minimo, funcional e endurecido no mesmo padrao das fases anteriores:

- credenciais por tenant;
- health check real;
- execucao assincrona no worker;
- logs estruturados;
- persistencia de execucao;
- retry seguro para erros transitórios;
- idempotencia para evitar duplicacao de cliente e pedido.

## Escopo implementado

1. `packages/integrations`
   - adapter `OmieErpAdapter` com:
     - `ListarClientesResumido` para health check;
     - `UpsertCliente` e `UpsertClienteCpfCnpj` para sincronizacao de cliente;
     - `AdicionarPedido` para sincronizacao de pedido;
     - classificacao de erro Omie para rate limit, timeout, auth, request e server error.
2. `packages/connectors-core`
   - provider `omie` habilitado com auth `api_key`;
   - actions:
     - `erp.customer.upsert`
     - `erp.sales-order.create`
   - handlers de runtime para executar o adapter Omie;
   - mapeamento de erros Omie para retryable vs fatal.
3. `apps/api`
   - health check Omie via servico central de conectores;
   - trigger sync reaproveitando `POST /api/v1/connectors/:provider/sync`;
   - builder `buildOmieSyncJob` para transformar o cursor em job de worker deterministico.
4. `apps/worker`
   - normalizacao de payload Omie em `omie-events.ts`;
   - resolucao de `appKey` e `appSecret` por tenant;
   - execucao de um fluxo unico:
     - upsert de cliente
     - criacao opcional de pedido na mesma execucao
   - persistencia de:
     - inbound status em `crmSyncEvent`
     - outbound log em `crmSyncEvent`
     - `connectorSyncCursor`
     - `connectorAccount.metadata.lastExecution`
5. `docs`
   - esta documentacao formal da Fase 2.4.

## Fluxo minimo

`POST /api/v1/connectors/omie/sync` -> `buildOmieSyncJob` -> `crmSyncEvent` inbound em estado `queued` -> fila `engagement.connector-events` -> worker -> `connectors-core` -> Omie API -> `crmSyncEvent` outbound -> `connectorSyncCursor` -> `connectorAccount.metadata.lastExecution`

## Recorte funcional

Foi implementado apenas um fluxo ERP bem fechado:

- cliente Omie com upsert idempotente;
- pedido de venda Omie opcional, encadeado na mesma execucao.

Nao foi aberto:

- sincronizacao ampla de cadastro ERP;
- estoque;
- catalogo;
- faturas;
- webhooks Omie;
- multiplos fluxos ERP concorrentes.

## Payload minimo esperado

Rota:

`POST /api/v1/connectors/omie/sync`

Exemplo minimo de cliente:

```json
{
  "accountKey": "primary",
  "cursor": {
    "customer": {
      "externalCode": "customer-001",
      "legalName": "Acme LTDA",
      "taxId": "12345678000199"
    }
  }
}
```

Exemplo minimo de cliente com pedido encadeado:

```json
{
  "accountKey": "primary",
  "cursor": {
    "customer": {
      "externalCode": "customer-001",
      "legalName": "Acme LTDA",
      "taxId": "12345678000199"
    },
    "salesOrder": {
      "integrationCode": "order-001",
      "taxScenarioCode": 321,
      "items": [
        {
          "productCode": 456,
          "quantity": 1,
          "taxScenarioItemCode": 789,
          "unitPrice": 19.9
        }
      ]
    }
  }
}
```

Quando o payload tem `customer`, o worker executa `erp.customer.upsert` e cria o pedido na sequencia se `salesOrder` tambem estiver presente.

## Credenciais

Credenciais Omie sao por tenant e por `connectorAccount`:

- `appKey`
- `appSecret`

O provider Omie foi configurado como `api_key`.

Nao foi aberto OAuth para Omie nesta fase.

## Idempotencia e normalizacao

- cliente:
  - usa `externalCode` ou `taxId` como identificador deterministico no upsert;
  - payload frouxo do ERP/app e normalizado para o contrato Omie antes de chamar o runtime.
- pedido:
  - usa `integrationCode` como chave idempotente;
  - quando o item nao traz `integrationCode`, o worker gera uma chave estavel no formato `<integrationCode-do-pedido>:<indice>`;
  - se o payload nao informa `customerCode`, o worker reutiliza o cliente sincronizado na mesma execucao.
- evento:
  - `externalEventId` do job Omie e deterministico para evitar reprocessamento duplicado.

## Regras de erro

- retryable:
  - `OMIE_RATE_LIMIT`
  - `OMIE_TIMEOUT`
  - `OMIE_SERVER_ERROR`
  - falhas de rede classificadas pelo runtime
- fatais:
  - `OMIE_AUTH_FAILED`
  - payload invalido de cliente
  - payload invalido de pedido
  - credencial ausente por tenant

Erros retryable mantem o evento em `retrying` e o connector em `syncing`.

Erros fatais marcam o cursor como `failed` e o connector como `attention`.

## Logs estruturados

O worker registra logs estruturados com os campos principais:

- `provider`
- `action`
- `eventId`
- `tenantId`
- `status`
- `duration`
- `error` quando aplicavel

## Validacao executada

Validacoes rodadas nesta entrega:

- `pnpm --filter @birthub/worker typecheck`
- `node --import tsx --test apps/api/test/connectors.omie-sync.test.ts`
- `node --import tsx --test apps/worker/src/integrations/connector-events.omie.test.ts`
- `node --import tsx --test packages/connectors-core/src/runtime.test.ts`

Cobertura de validacao entregue:

- simulacao de criacao de cliente com pedido encadeado;
- simulacao de erro de API retryable com transicao para `retrying`;
- simulacao de erro fatal sem retry;
- validacao de persistencia do estado de execucao no worker;
- validacao de health/runtime/catalogo.

## Pendencias intencionais

- Nao ha cobertura ampla da API Omie.
- Nao ha sincronizacao de fatura nesta fase.
- Nao ha abertura de multiplos subfluxos ERP.
- Nao foi adicionada surface nova de dashboard alem do que o pipeline de conectores ja exibe.
