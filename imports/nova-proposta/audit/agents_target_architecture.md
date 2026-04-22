# Arquitetura Alvo de Agentes (Target State SaaS)

Para que a plataforma atinja o estado de SaaS B2B Enterprise, o runtime de agentes precisará seguir estritamente o padrão abaixo.

## 1. O Contrato de Agente OBRIGATÓRIO
Cada Agente no BirthHub 360 deve conter:
- `contract.schema.ts`: Defines input (TenantId, Context), output (Result JSON), e as Tools autorizadas.
- `agent.runtime.ts`: Implementa o fluxo usando APIs Reais, conectadas ao LLM Client real da plataforma, não lógica simulada.
- `system_prompt.md`: Separado, com few-shot examples claros, versionado na base.

## 2. A Camada de Ferramentas (Tools Layer)
Ferramentas (como as descritas em `tools.ts`) devem possuir conexões efetivas com:
- **Prisma/Database:** Consultar base do Tenant isolada.
- **Microserviços Externos:** Interações com Stripe, CRMs via OAuth real.
- **Zero Mock Policy:** Nenhum agente deve ser mesclado (merged) no repositório com `Math.random()` ou mocks se o propósito for ambiente de Produção. Testes podem usar mocks estritamente injetados através de frameworks de teste (e.g. Jest `jest.mock`).

## 3. Observabilidade Padrão SaaS
A camada atual de observabilidade (`emitEvent`) é aceitável, mas precisa ser conectada a um barramento de eventos real (RabbitMQ/Kafka ou Pino/Datadog) onde as `Metrics` do agente (Duração, Custos em Tokens, `toolFailures`) sejam contabilizadas na billing do Tenant.

## 4. Orquestração baseada em Grafos e Filas
Ao invés de dependências diretas, os handoffs (quando `agent-mesh-orchestrator` chama outro agente) precisam ocorrer através do worker via fila (`apps/worker/src`), de modo a garantir que se o Pod cair no meio de um Job, a execução do Agente B pode ser retomada com a memória salva no PostgreSQL.
