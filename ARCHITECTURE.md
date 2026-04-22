# BirthHub 360 - Guia de Arquitetura e Extensão Modular

## Visão Geral da Arquitetura

BirthHub 360 é organizado como uma plataforma SaaS modular com três camadas principais:

```
┌─────────────────────────────────────────────────┐
│  Aplicações (apps/)                             │
│  ├─ web (Next.js 16 frontend)                  │
│  ├─ api (Express backend)                       │
│  ├─ worker (BullMQ job processor)              │
│  └─ webhook-receiver (webhook ingestion)        │
├─────────────────────────────────────────────────┤
│  Camada de Serviços Compartilhados (packages/)  │
│  ├─ Domínio (agents-core, workflows-core)      │
│  ├─ Infraestrutura (database, queue, auth)     │
│  ├─ Integrações (adapters para CRM, ERP, etc)  │
│  └─ Utilitários (logger, config, utils)        │
├─────────────────────────────────────────────────┤
│  Camada de Middleware e Roteamento (api/src/)   │
│  ├─ Pipeline declarativo de middlewares         │
│  ├─ Registry de módulos com priorização        │
│  ├─ Roteadores de módulos (24+ módulos)        │
│  └─ Observabilidade (OTel, Sentry, logs)       │
└─────────────────────────────────────────────────┘
```

## Melhorias Implementadas

### 1. Module Registry Pattern

**Arquivo**: `apps/api/src/app/module-registry.ts`

Substitui manual mounting de 24+ roteadores por um sistema declarativo.

**Benefícios:**
- Adicionar novo módulo = 1 entrada no registry
- Priorização automática evita conflitos de rotas
- Fácil ativar/desativar módulos por feature flag

**Uso:**

```typescript
// Em module-bootstrap.ts
const MODULE_DEFINITIONS: RegisteredModule[] = [
  {
    name: "meu-modulo",
    basePath: "/api/v1/meu-modulo",
    priority: 75, // Feature modules = 50-100
    createRouter: (config) => createMeuModuloRouter(config)
  }
];

// Automático: app.use("/api/v1/meu-modulo", router)
```

### 2. Middleware Pipeline

**Arquivo**: `apps/api/src/app/middleware-pipeline.ts`

Desacopla middlewares em camadas compostas e reutilizáveis.

**Fases:**
1. `pre-context` (body parsing, security headers)
2. `context` (CORS, request ID, tenant context)
3. `pre-validation` (rate limiting, origin check)
4. `validation` (auth, CSRF)
5. `pre-transform` (audit, sanitization)
6. `transform` (transformação de dados)
7. `post-transform` (proteções adicionais)
8. `error-handling` (tratamento de erros)
9. `terminal` (404 handler)

**Benefícios:**
- Middlewares independentes de ordem
- Prioridade explícita dentro de cada fase
- Middlewares condicionais por feature/env
- Reutilizável em webhook-receiver e outras apps

**Uso:**

```typescript
// Criar novo middleware
export const meuMiddleware = definePipelineMiddleware(
  "meu-middleware",
  "pre-validation",
  51, // Entre rate-limit (52) e origin-check (50)
  (config) => (req, res, next) => {
    // sua lógica
    next();
  },
  (config) => config.MEU_MIDDLEWARE_ENABLED // opcional
);

// Registrar
pipeline.register(meuMiddleware);
```

### 3. Job Handler Registry (Worker)

**Arquivo**: `apps/worker/src/handlers/job-handler-registry.ts`

Centraliza definição e registro de job handlers.

**Estrutura:**

```typescript
defineJobHandler({
  name: "execute-workflow",
  queueName: "workflows",
  handler: async (job) => { /* sua lógica */ },
  concurrency: 5,
  timeout: 120000,
  retries: 2,
  backoff: { type: "exponential", delay: 1000 }
})
```

**Benefícios:**
- Handlers agrupados por domínio (WORKFLOW_JOB_HANDLERS, AGENT_JOB_HANDLERS, etc)
- Retry/timeout/concurrency centralizados
- Fácil registrar novos handlers em massa
- Telemetria automática possível

### 4. Integration Adapter Contracts

**Arquivo**: `packages/integrations/src/adapter-contracts.ts`

Define contratos (interfaces) para todos os adaptadores externos.

**Adaptadores disponíveis:**
- `CrmAdapter` (HubSpot)
- `ErpAdapter` (Omie)
- `PaymentAdapter` (Stripe)
- `MessagingAdapter` (Slack, Zenvia)

**Implementar novo adaptador:**

```typescript
// packages/integrations/src/adapters/meu-adapter.ts
import { CrmAdapter } from "../adapter-contracts.js";

export class MeuCrmAdapter implements CrmAdapter {
  readonly name = "meu-crm";
  readonly version = "1.0.0";

  async initialize(config: MeuCrmConfig): Promise<void> {
    // Setup
  }

  async createContact(data: CrmContactData): Promise<CrmContact> {
    // Implementar
  }

  // ... outros métodos
}

// Registrar em module initialization
adapterRegistry.register(new MeuCrmAdapter(), "meu-crm");
```

## Como Adicionar um Novo Módulo

### Passo 1: Criar estrutura do módulo

```bash
mkdir -p apps/api/src/modules/meu-modulo
touch apps/api/src/modules/meu-modulo/router.ts
touch apps/api/src/modules/meu-modulo/controller.ts
touch apps/api/src/modules/meu-modulo/service.ts
touch apps/api/src/modules/meu-modulo/types.ts
```

### Passo 2: Implementar router

```typescript
// apps/api/src/modules/meu-modulo/router.ts
import type { ApiConfig } from "@birthub/config";
import { Router } from "express";
import { createMeuModuloController } from "./controller.js";

export function createMeuModuloRouter(config: ApiConfig): Router {
  const router = Router();
  const controller = createMeuModuloController();

  router.get("/", (req, res) => controller.list(req, res));
  router.post("/", (req, res) => controller.create(req, res));
  router.get("/:id", (req, res) => controller.getById(req, res));
  router.put("/:id", (req, res) => controller.update(req, res));
  router.delete("/:id", (req, res) => controller.delete(req, res));

  return router;
}
```

### Passo 3: Registrar no module bootstrap

```typescript
// Em apps/api/src/app/module-bootstrap.ts

// Importar
import { createMeuModuloRouter } from "../modules/meu-modulo/router.js";

// Adicionar à lista
const MODULE_DEFINITIONS: RegisteredModule[] = [
  // ... outros
  {
    name: "meu-modulo",
    basePath: "/api/v1/meu-modulo",
    priority: 75, // Feature modules = 50-100
    createRouter: (config) => createMeuModuloRouter(config)
  }
];
```

### Passo 4: Se precisar de workers, adicionar handlers

```typescript
// apps/worker/src/handlers/index.ts

export const MEU_MODULO_JOB_HANDLERS: JobHandlerDefinition[] = [
  defineJobHandler({
    name: "processar-dados",
    queueName: "meu-modulo",
    handler: async (job: Job<{ dataId: string }>) => {
      // sua lógica
      return { processed: true };
    },
    concurrency: 3,
    timeout: 60000
  })
];

// Adicionar ao ALL_JOB_HANDLERS
export const ALL_JOB_HANDLERS = [
  // ... outros
  ...MEU_MODULO_JOB_HANDLERS
];
```

### Passo 5: Se usar integrações externas, criar adapter

```typescript
// packages/integrations/src/adapters/meu-servico.ts
import { type ExternalServiceAdapter } from "../adapter-contracts.js";

export class MeuServicoAdapter implements ExternalServiceAdapter {
  readonly name = "meu-servico";
  readonly version = "1.0.0";

  async initialize(config: unknown): Promise<void> {}
  async shutdown(): Promise<void> {}
  async healthcheck(): Promise<boolean> { return true; }
}

// Registrar em init
import { adapterRegistry } from "@birthub/integrations";
adapterRegistry.register(new MeuServicoAdapter());
```

## Convenções de Código

### Estrutura de Módulo

```
modules/meu-modulo/
├── router.ts           # Roteamento
├── controller.ts       # Lógica de requisição
├── service.ts          # Lógica de negócio
├── repository.ts       # Acesso a dados (opcional)
├── types.ts            # Tipos Zod/TypeScript
├── constants.ts        # Constantes (opcional)
└── index.ts            # Exports públicos
```

### Prioridade de Módulos

- `0-10`: Infraestrutura (auth, sessions)
- `10-50`: Negócio core (users, orgs, profiles)
- `50-100`: Features (agents, workflows, tasks)
- `100-200`: Integrações (webhooks, marketplace)
- `200+`: Admin/debug

### Nomeação de Queues

- `workflows`: job de workflows
- `agents`: execução de agents
- `connectors`: sincronização de dados
- `notifications`: envio de notificações
- `integrations`: webhooks e sync
- `system.fail-rate-alerts`: métricas internas
- `system.queue-metrics`: métricas internas

## Testing

### Teste de módulo completo

```typescript
// modules/meu-modulo/__tests__/integration.test.ts
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../../app.js";

describe("Meu Módulo", () => {
  it("should list items", async () => {
    const app = createApp();
    const response = await request(app)
      .get("/api/v1/meu-modulo")
      .expect(200);

    // assertions
  });
});
```

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|--------|
| Rota não encontrada | Módulo não registrado ou priority errada | Verificar module-bootstrap.ts, garantir basePath correto |
| Middleware não rodando | Fase errada ou priority invertida | Verificar fase e priority em standard-middlewares.ts |
| Job não processado | Handler não registrado | Adicionar em handlers/index.ts e chamar initializeJobHandlers() |
| Conflito de rota | Dois módulos mesma basePath | Usar prefixos únicos, verificar priority |

## Próximas Melhorias

1. **Auto-discovery de módulos**: Usar glob para carregar automaticamente módulos de `apps/api/src/modules/**/module.ts`
2. **Feature flags**: Integrar sistema de flags para ativar/desativar módulos em runtime
3. **Module composition**: Permitir módulos dependerem de outros via registry
4. **Teste automático de roteamento**: Script CI para validar conflitos de rotas
5. **Documentação OpenAPI automática**: Gerar specs a partir dos routers registrados
