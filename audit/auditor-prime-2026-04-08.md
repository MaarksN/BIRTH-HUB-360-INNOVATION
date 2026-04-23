# Auditoria Soberana BirthHub360

## 1. EXECUTIVE SUMMARY

- Score geral de saúde técnica: 56/100
- Estimativa de custo de não-ação: 8 semanas de engenharia perdidas/mês
- Viabilidade de lançamento: CONDICIONAL — O lançamento depende de fechamento disciplinado dos itens VDI 4.0+ nas fases 0 e 1.

### Top 5 riscos críticos

- TD-054 | Consulta findMany sem paginação explícita | Dimensão 5 — Performance e Escalabilidade | VDI 3.3 | apps/api/src/modules/clinical/service.ts:906
- TD-055 | Consulta findMany sem paginação explícita | Dimensão 5 — Performance e Escalabilidade | VDI 3.3 | apps/api/src/modules/clinical/service.ts:995
- TD-001 | Complexidade acima do limiar em ConversationsPage | Dimensão 1 — Saúde Arquitetural | VDI 3.25 | apps/web/app/(dashboard)/conversations/page.tsx:51
- TD-002 | Complexidade acima do limiar em deriveClinicalAlerts | Dimensão 1 — Saúde Arquitetural | VDI 3.25 | apps/api/src/modules/clinical/service.ts:443
- TD-003 | Complexidade acima do limiar em Navbar | Dimensão 1 — Saúde Arquitetural | VDI 3.25 | apps/web/components/layout/Navbar.tsx:81

### Análise Pendente

- TD-014 | [DADOS INSUFICIENTES — REQUER: docs/architecture/c4-context.md] Diagrama C4 versionado do core | requer: docs/architecture/c4-context.md
- TD-034 | [DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual | requer: semgrep --json
- TD-035 | [DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação (complementar 2) | requer: DAST/ZAP report
- TD-036 | [DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual (complementar 3) | requer: semgrep --json
- TD-037 | [DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação (complementar 4) | requer: DAST/ZAP report
- TD-038 | [DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual (complementar 5) | requer: semgrep --json
- TD-039 | [DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação (complementar 6) | requer: DAST/ZAP report
- TD-040 | [DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual (complementar 7) | requer: semgrep --json
- TD-041 | [DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação (complementar 8) | requer: DAST/ZAP report
- TD-048 | [DADOS INSUFICIENTES — REQUER: cobertura por módulo] Cobertura quantitativa por camada | requer: cobertura por módulo
- TD-049 | [DADOS INSUFICIENTES — REQUER: SLO dashboards vivos] SLO/SLA com erro budget operacional (complementar 2) | requer: SLO dashboards vivos
- TD-050 | [DADOS INSUFICIENTES — REQUER: cobertura por módulo] Cobertura quantitativa por camada (complementar 3) | requer: cobertura por módulo
- TD-051 | [DADOS INSUFICIENTES — REQUER: SLO dashboards vivos] SLO/SLA com erro budget operacional (complementar 4) | requer: SLO dashboards vivos
- TD-052 | [DADOS INSUFICIENTES — REQUER: cobertura por módulo] Cobertura quantitativa por camada (complementar 5) | requer: cobertura por módulo
- TD-053 | [DADOS INSUFICIENTES — REQUER: SLO dashboards vivos] SLO/SLA com erro budget operacional (complementar 6) | requer: SLO dashboards vivos
- TD-063 | [DADOS INSUFICIENTES — REQUER: bundle baseline fresco] Tamanho real do bundle web no HEAD | requer: bundle baseline fresco
- TD-064 | [DADOS INSUFICIENTES — REQUER: load test recente] Prova de throughput sob stress no core (complementar 2) | requer: load test recente
- TD-065 | [DADOS INSUFICIENTES — REQUER: bundle baseline fresco] Tamanho real do bundle web no HEAD (complementar 3) | requer: bundle baseline fresco
- TD-071 | [DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod | requer: inventário de ambientes
- TD-072 | [DADOS INSUFICIENTES — REQUER: lead time por PR] Métrica DORA completa de mudança (complementar 2) | requer: lead time por PR
- TD-073 | [DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod (complementar 3) | requer: inventário de ambientes
- TD-074 | [DADOS INSUFICIENTES — REQUER: lead time por PR] Métrica DORA completa de mudança (complementar 4) | requer: lead time por PR
- TD-075 | [DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod (complementar 5) | requer: inventário de ambientes
- TD-076 | [DADOS INSUFICIENTES — REQUER: lead time por PR] Métrica DORA completa de mudança (complementar 6) | requer: lead time por PR
- TD-077 | [DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod (complementar 7) | requer: inventário de ambientes
- TD-091 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant | requer: SLA versionado
- TD-092 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 2) | requer: evidência de DR drill
- TD-093 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant (complementar 3) | requer: SLA versionado
- TD-094 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 4) | requer: evidência de DR drill
- TD-095 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant (complementar 5) | requer: SLA versionado
- TD-096 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 6) | requer: evidência de DR drill
- TD-097 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant (complementar 7) | requer: SLA versionado
- TD-098 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 8) | requer: evidência de DR drill
- TD-099 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant (complementar 9) | requer: SLA versionado
- TD-100 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 10) | requer: evidência de DR drill

## 2. MAPA DE DÍVIDA TÉCNICA — 100 ITENS DE MELHORIA

### Dimensão 1 — Saúde Arquitetural

- TD-001 | Complexidade acima do limiar em ConversationsPage
  Localização: apps/web/app/(dashboard)/conversations/page.tsx:51
  Problema: Identificado em apps/web/app/(dashboard)/conversations/page.tsx:51 uma função com complexidade ciclomática 32, acima do limiar operacional recomendado (>10).
  Impacto: Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.
  Solução recomendada: Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.
  VDI: 3.25 (ALTO)
  Esforço: 2-5 dias

- TD-002 | Complexidade acima do limiar em deriveClinicalAlerts
  Localização: apps/api/src/modules/clinical/service.ts:443
  Problema: Identificado em apps/api/src/modules/clinical/service.ts:443 uma função com complexidade ciclomática 23, acima do limiar operacional recomendado (>10).
  Impacto: Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.
  Solução recomendada: Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.
  VDI: 3.25 (ALTO)
  Esforço: 2-5 dias

- TD-003 | Complexidade acima do limiar em Navbar
  Localização: apps/web/components/layout/Navbar.tsx:81
  Problema: Identificado em apps/web/components/layout/Navbar.tsx:81 uma função com complexidade ciclomática 22, acima do limiar operacional recomendado (>10).
  Impacto: Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.
  Solução recomendada: Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.
  VDI: 3.25 (ALTO)
  Esforço: 2-5 dias

- TD-004 | Complexidade acima do limiar em PatientDetailPage
  Localização: apps/web/app/(dashboard)/patients/[id]/page.tsx:99
  Problema: Identificado em apps/web/app/(dashboard)/patients/[id]/page.tsx:99 uma função com complexidade ciclomática 120, acima do limiar operacional recomendado (>10).
  Impacto: Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.
  Solução recomendada: Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.
  VDI: 3.25 (ALTO)
  Esforço: 2-5 dias

- TD-005 | Complexidade acima do limiar em PatientsPage
  Localização: apps/web/app/(dashboard)/patients/page.tsx:35
  Problema: Identificado em apps/web/app/(dashboard)/patients/page.tsx:35 uma função com complexidade ciclomática 26, acima do limiar operacional recomendado (>10).
  Impacto: Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.
  Solução recomendada: Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.
  VDI: 3.25 (ALTO)
  Esforço: 2-5 dias

- TD-006 | Complexidade acima do limiar em updateUserPreference
  Localização: packages/database/src/repositories/engagement.ts:38
  Problema: Identificado em packages/database/src/repositories/engagement.ts:38 uma função com complexidade ciclomática 24, acima do limiar operacional recomendado (>10).
  Impacto: Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.
  Solução recomendada: Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.
  VDI: 3.25 (ALTO)
  Esforço: 2-5 dias

- TD-007 | Complexidade acima do limiar em WorkflowRevisionsPage
  Localização: apps/web/app/(dashboard)/workflows/[id]/revisions/page.tsx:20
  Problema: Identificado em apps/web/app/(dashboard)/workflows/[id]/revisions/page.tsx:20 uma função com complexidade ciclomática 23, acima do limiar operacional recomendado (>10).
  Impacto: Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.
  Solução recomendada: Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.
  VDI: 3.25 (ALTO)
  Esforço: 2-5 dias

- TD-008 | Complexidade acima do limiar em WorkflowRunsPage
  Localização: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx:18
  Problema: Identificado em apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx:18 uma função com complexidade ciclomática 37, acima do limiar operacional recomendado (>10).
  Impacto: Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.
  Solução recomendada: Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.
  VDI: 3.25 (ALTO)
  Esforço: 2-5 dias

- TD-009 | Superfície legacy ainda versionada ao lado do core canônico
  Localização: docs/service-catalog.md:1
  Problema: O catálogo canônico marca o dashboard legado como quarentena, mas a superfície continua presente e próxima do fluxo principal do monorepo.
  Impacto: Manter legado ao lado do core amplia ruído de manutenção e aumenta o risco de dependências regressivas no lane principal.
  Solução recomendada: Fortalecer guardrails que bloqueiem imports/execução do legado no core e planejar isolamento físico adicional.
  VDI: 2.85 (MÉDIO)
  Esforço: 1-3 dias

- TD-010 | Arquivo grande demais para o boundary atual (1732 linhas)
  Localização: packages/database/prisma/schema.prisma:1
  Problema: Identificado em packages/database/prisma/schema.prisma um arquivo com 1732 linhas dentro do core, sinal típico de boundary inchado ou múltiplas responsabilidades.
  Impacto: Arquivos extensos concentram conhecimento, elevam custo de merge e pioram isolamento de testes.
  Solução recomendada: Separar orchestration, adapters e regras de negócio em módulos menores alinhados ao boundary funcional.
  VDI: 2.75 (MÉDIO)
  Esforço: 2-5 dias

- TD-011 | Arquivo grande demais para o boundary atual (2252 linhas)
  Localização: apps/api/src/modules/clinical/service.ts:1
  Problema: Identificado em apps/api/src/modules/clinical/service.ts um arquivo com 2252 linhas dentro do core, sinal típico de boundary inchado ou múltiplas responsabilidades.
  Impacto: Arquivos extensos concentram conhecimento, elevam custo de merge e pioram isolamento de testes.
  Solução recomendada: Separar orchestration, adapters e regras de negócio em módulos menores alinhados ao boundary funcional.
  VDI: 2.75 (MÉDIO)
  Esforço: 2-5 dias

- TD-012 | Arquivo grande demais para o boundary atual (928 linhas)
  Localização: apps/api/src/modules/workflows/service.ts:1
  Problema: Identificado em apps/api/src/modules/workflows/service.ts um arquivo com 928 linhas dentro do core, sinal típico de boundary inchado ou múltiplas responsabilidades.
  Impacto: Arquivos extensos concentram conhecimento, elevam custo de merge e pioram isolamento de testes.
  Solução recomendada: Separar orchestration, adapters e regras de negócio em módulos menores alinhados ao boundary funcional.
  VDI: 2.75 (MÉDIO)
  Esforço: 2-5 dias

- TD-013 | Arquivo grande demais para o boundary atual (977 linhas)
  Localização: packages/database/prisma/migration-registry.json:1
  Problema: Identificado em packages/database/prisma/migration-registry.json um arquivo com 977 linhas dentro do core, sinal típico de boundary inchado ou múltiplas responsabilidades.
  Impacto: Arquivos extensos concentram conhecimento, elevam custo de merge e pioram isolamento de testes.
  Solução recomendada: Separar orchestration, adapters e regras de negócio em módulos menores alinhados ao boundary funcional.
  VDI: 2.75 (MÉDIO)
  Esforço: 2-5 dias

- TD-014 | [DADOS INSUFICIENTES — REQUER: docs/architecture/c4-context.md] Diagrama C4 versionado do core
  Localização: docs/service-catalog.md:1
  Problema: O repositório lista a taxonomia canônica do core, mas não traz um diagrama C4 versionado do contexto atual para validar fronteiras, responsabilidades e integrações síncronas/assíncronas.
  Impacto: Sem essa evidência, revisões arquiteturais ficam dependentes de leitura de código e aumentam o custo de onboarding e de refactors transversais.
  Solução recomendada: Versionar um diagrama C4 Context + Container do core canônico e referenciá-lo a partir do service catalog.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

### Dimensão 2 — Qualidade de Código

- TD-015 | Uso recorrente de any em index.ts
  Localização: packages/shared-types/src/index.ts:2
  Problema: Identificado em packages/shared-types/src/index.ts:2 um cluster de 13 ocorrência(s) de any em código de runtime.
  Impacto: Esse padrão reduz garantias de tipo justamente nos pontos onde o core deveria ser mais explícito e previsível.
  Solução recomendada: Substituir any por unions, schemas zod ou tipos derivados das entidades reais trafegadas pelo módulo.
  VDI: 3.05 (ALTO)
  Esforço: 2-5 dias

- TD-016 | Acesso direto a process.env fora da camada de configuração
  Localização: packages/database/src/client.ts:50
  Problema: Identificado em packages/database/src/client.ts:50 acesso direto a process.env em runtime fora de um boundary dedicado de config.
  Impacto: Isso dispersa contrato de configuração, dificulta validação centralizada e fragiliza testes/observabilidade.
  Solução recomendada: Encapsular leituras em surface única de configuração com validação e defaults explícitos.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-017 | Acesso direto a process.env fora da camada de configuração
  Localização: packages/logger/src/index.ts:62
  Problema: Identificado em packages/logger/src/index.ts:62 acesso direto a process.env em runtime fora de um boundary dedicado de config.
  Impacto: Isso dispersa contrato de configuração, dificulta validação centralizada e fragiliza testes/observabilidade.
  Solução recomendada: Encapsular leituras em surface única de configuração com validação e defaults explícitos.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-018 | Acesso direto a process.env fora da camada de configuração
  Localização: packages/database/scripts/check-schema-drift.ts:10
  Problema: Identificado em packages/database/scripts/check-schema-drift.ts:10 acesso direto a process.env em runtime fora de um boundary dedicado de config.
  Impacto: Isso dispersa contrato de configuração, dificulta validação centralizada e fragiliza testes/observabilidade.
  Solução recomendada: Encapsular leituras em surface única de configuração com validação e defaults explícitos.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-019 | Acesso direto a process.env fora da camada de configuração
  Localização: apps/worker/src/agents/runtime.db-integration.harness.ts:52
  Problema: Identificado em apps/worker/src/agents/runtime.db-integration.harness.ts:52 acesso direto a process.env em runtime fora de um boundary dedicado de config.
  Impacto: Isso dispersa contrato de configuração, dificulta validação centralizada e fragiliza testes/observabilidade.
  Solução recomendada: Encapsular leituras em surface única de configuração com validação e defaults explícitos.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-020 | Acesso direto a process.env fora da camada de configuração
  Localização: apps/worker/src/engine/runner.db-integration.harness.ts:5
  Problema: Identificado em apps/worker/src/engine/runner.db-integration.harness.ts:5 acesso direto a process.env em runtime fora de um boundary dedicado de config.
  Impacto: Isso dispersa contrato de configuração, dificulta validação centralizada e fragiliza testes/observabilidade.
  Solução recomendada: Encapsular leituras em surface única de configuração com validação e defaults explícitos.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-021 | Uso recorrente de any em fiscal.ts
  Localização: packages/integrations/src/clients/fiscal.ts:64
  Problema: Identificado em packages/integrations/src/clients/fiscal.ts:64 um cluster de 2 ocorrência(s) de any em código de runtime.
  Impacto: Esse padrão reduz garantias de tipo justamente nos pontos onde o core deveria ser mais explícito e previsível.
  Solução recomendada: Substituir any por unions, schemas zod ou tipos derivados das entidades reais trafegadas pelo módulo.
  VDI: 2.85 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-022 | Uso recorrente de any em index.ts
  Localização: packages/llm-client/src/index.ts:59
  Problema: Identificado em packages/llm-client/src/index.ts:59 um cluster de 2 ocorrência(s) de any em código de runtime.
  Impacto: Esse padrão reduz garantias de tipo justamente nos pontos onde o core deveria ser mais explícito e previsível.
  Solução recomendada: Substituir any por unions, schemas zod ou tipos derivados das entidades reais trafegadas pelo módulo.
  VDI: 2.85 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-023 | Uso recorrente de any em index.ts
  Localização: packages/queue/src/index.ts:28
  Problema: Identificado em packages/queue/src/index.ts:28 um cluster de 2 ocorrência(s) de any em código de runtime.
  Impacto: Esse padrão reduz garantias de tipo justamente nos pontos onde o core deveria ser mais explícito e previsível.
  Solução recomendada: Substituir any por unions, schemas zod ou tipos derivados das entidades reais trafegadas pelo módulo.
  VDI: 2.85 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-024 | Uso recorrente de any em payments-br.ts
  Localização: packages/integrations/src/clients/payments-br.ts:88
  Problema: Identificado em packages/integrations/src/clients/payments-br.ts:88 um cluster de 2 ocorrência(s) de any em código de runtime.
  Impacto: Esse padrão reduz garantias de tipo justamente nos pontos onde o core deveria ser mais explícito e previsível.
  Solução recomendada: Substituir any por unions, schemas zod ou tipos derivados das entidades reais trafegadas pelo módulo.
  VDI: 2.85 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-025 | Uso recorrente de any em signatures.ts
  Localização: packages/integrations/src/clients/signatures.ts:75
  Problema: Identificado em packages/integrations/src/clients/signatures.ts:75 um cluster de 2 ocorrência(s) de any em código de runtime.
  Impacto: Esse padrão reduz garantias de tipo justamente nos pontos onde o core deveria ser mais explícito e previsível.
  Solução recomendada: Substituir any por unions, schemas zod ou tipos derivados das entidades reais trafegadas pelo módulo.
  VDI: 2.85 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-026 | Logging ad-hoc com console.* em runtime
  Localização: packages/llm-client/scripts/test-llm.ts:7
  Problema: Identificado em packages/llm-client/scripts/test-llm.ts:7 uso de console.* em uma superfície de runtime do core.
  Impacto: Esse padrão dificulta padronização de logs, correlação por trace id e aplicação consistente de redaction.
  Solução recomendada: Migrar o módulo para o logger estruturado do workspace e eliminar saídas diretas via console.
  VDI: 2.6 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-027 | Logging ad-hoc com console.* em runtime
  Localização: packages/agents/executivos/boardprep-ai/agent.ts:432
  Problema: Identificado em packages/agents/executivos/boardprep-ai/agent.ts:432 uso de console.* em uma superfície de runtime do core.
  Impacto: Esse padrão dificulta padronização de logs, correlação por trace id e aplicação consistente de redaction.
  Solução recomendada: Migrar o módulo para o logger estruturado do workspace e eliminar saídas diretas via console.
  VDI: 2.6 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-028 | Logging ad-hoc com console.* em runtime
  Localização: packages/agents/executivos/brand-guardian/agent.ts:516
  Problema: Identificado em packages/agents/executivos/brand-guardian/agent.ts:516 uso de console.* em uma superfície de runtime do core.
  Impacto: Esse padrão dificulta padronização de logs, correlação por trace id e aplicação consistente de redaction.
  Solução recomendada: Migrar o módulo para o logger estruturado do workspace e eliminar saídas diretas via console.
  VDI: 2.6 (MÉDIO)
  Esforço: 0.5-1 dia

### Dimensão 3 — Segurança

- TD-029 | Semgrep INFO em service.yaml
  Localização: infra/cloudrun/service.yaml:21
  Problema: Semgrep sinalizou em infra/cloudrun/service.yaml:21 o padrão "When running containers in Kubernetes, it's important to ensure that they  are properly secured to prevent privilege escalation attacks".
  Impacto: Esse tipo de finding amplia a superfície de exploração e indica controles de segurança ainda incompletos no HEAD atual.
  Solução recomendada: Aplicar a correção sugerida pelo Semgrep e validar o fluxo afetado. Fix sugerido: spec:
      securityContext:
        runAsNonRoot: true #
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-030 | Semgrep INFO em service.yaml
  Localização: infra/cloudrun/service.yaml:54
  Problema: Semgrep sinalizou em infra/cloudrun/service.yaml:54 o padrão "When running containers in Kubernetes, it's important to ensure that they  are properly secured to prevent privilege escalation attacks".
  Impacto: Esse tipo de finding amplia a superfície de exploração e indica controles de segurança ainda incompletos no HEAD atual.
  Solução recomendada: Aplicar a correção sugerida pelo Semgrep e validar o fluxo afetado. Fix sugerido: spec:
      securityContext:
        runAsNonRoot: true #
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-031 | Semgrep INFO em service.yaml
  Localização: infra/cloudrun/service.yaml:87
  Problema: Semgrep sinalizou em infra/cloudrun/service.yaml:87 o padrão "When running containers in Kubernetes, it's important to ensure that they  are properly secured to prevent privilege escalation attacks".
  Impacto: Esse tipo de finding amplia a superfície de exploração e indica controles de segurança ainda incompletos no HEAD atual.
  Solução recomendada: Aplicar a correção sugerida pelo Semgrep e validar o fluxo afetado. Fix sugerido: spec:
      securityContext:
        runAsNonRoot: true #
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-032 | Semgrep INFO em shared-prime.mjs
  Localização: scripts/audit/shared-prime.mjs:384
  Problema: Semgrep sinalizou em scripts/audit/shared-prime.mjs:384 o padrão "Detected a call to `replaceAll()` in an attempt to HTML escape the string `String(value)`".
  Impacto: Esse tipo de finding amplia a superfície de exploração e indica controles de segurança ainda incompletos no HEAD atual.
  Solução recomendada: Endereçar o padrão sinalizado pelo Semgrep e adicionar cobertura de regressão para o fluxo afetado.
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-033 | Semgrep INFO em shared-prime.mjs
  Localização: scripts/audit/shared-prime.mjs:384
  Problema: Semgrep sinalizou em scripts/audit/shared-prime.mjs:384 o padrão "Detected a call to `replaceAll()` in an attempt to HTML escape the string `String(value)
    .replaceAll("&", "&amp;")`".
  Impacto: Esse tipo de finding amplia a superfície de exploração e indica controles de segurança ainda incompletos no HEAD atual.
  Solução recomendada: Endereçar o padrão sinalizado pelo Semgrep e adicionar cobertura de regressão para o fluxo afetado.
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-034 | [DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual
  Localização: .github/workflows/security-scan.yml:1
  Problema: Existe trilha histórica de segurança, mas sem uma execução SAST fresca do HEAD atual a classificação OWASP/STRIDE fica parcialmente dependente de contexto anterior.
  Impacto: Falhas novas podem escapar da priorização se não houver uma fotografia recente do código.
  Solução recomendada: Executar Semgrep como insumo do coletor soberano e registrar findings com path e line.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-035 | [DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação (complementar 2)
  Localização: .github/workflows/security-scan.yml:1
  Problema: A superfície de segurança documenta guardrails estáticos, mas não há evidência dinâmica recente anexada ao pipeline soberano para validar ataques em runtime.
  Impacto: Controles podem existir no código e ainda assim falhar por composição, headers ou edge behavior.
  Solução recomendada: Anexar relatório DAST mínimo por release candidate ao pacote de evidências da auditoria.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-036 | [DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual (complementar 3)
  Localização: .github/workflows/security-scan.yml:1
  Problema: Existe trilha histórica de segurança, mas sem uma execução SAST fresca do HEAD atual a classificação OWASP/STRIDE fica parcialmente dependente de contexto anterior.
  Impacto: Falhas novas podem escapar da priorização se não houver uma fotografia recente do código.
  Solução recomendada: Executar Semgrep como insumo do coletor soberano e registrar findings com path e line.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-037 | [DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação (complementar 4)
  Localização: .github/workflows/security-scan.yml:1
  Problema: A superfície de segurança documenta guardrails estáticos, mas não há evidência dinâmica recente anexada ao pipeline soberano para validar ataques em runtime.
  Impacto: Controles podem existir no código e ainda assim falhar por composição, headers ou edge behavior.
  Solução recomendada: Anexar relatório DAST mínimo por release candidate ao pacote de evidências da auditoria.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-038 | [DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual (complementar 5)
  Localização: .github/workflows/security-scan.yml:1
  Problema: Existe trilha histórica de segurança, mas sem uma execução SAST fresca do HEAD atual a classificação OWASP/STRIDE fica parcialmente dependente de contexto anterior.
  Impacto: Falhas novas podem escapar da priorização se não houver uma fotografia recente do código.
  Solução recomendada: Executar Semgrep como insumo do coletor soberano e registrar findings com path e line.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-039 | [DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação (complementar 6)
  Localização: .github/workflows/security-scan.yml:1
  Problema: A superfície de segurança documenta guardrails estáticos, mas não há evidência dinâmica recente anexada ao pipeline soberano para validar ataques em runtime.
  Impacto: Controles podem existir no código e ainda assim falhar por composição, headers ou edge behavior.
  Solução recomendada: Anexar relatório DAST mínimo por release candidate ao pacote de evidências da auditoria.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-040 | [DADOS INSUFICIENTES — REQUER: semgrep --json] Linha de base SAST fresca para o HEAD atual (complementar 7)
  Localização: .github/workflows/security-scan.yml:1
  Problema: Existe trilha histórica de segurança, mas sem uma execução SAST fresca do HEAD atual a classificação OWASP/STRIDE fica parcialmente dependente de contexto anterior.
  Impacto: Falhas novas podem escapar da priorização se não houver uma fotografia recente do código.
  Solução recomendada: Executar Semgrep como insumo do coletor soberano e registrar findings com path e line.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-041 | [DADOS INSUFICIENTES — REQUER: DAST/ZAP report] Cobertura dinâmica de SSRF/XSS/autenticação (complementar 8)
  Localização: .github/workflows/security-scan.yml:1
  Problema: A superfície de segurança documenta guardrails estáticos, mas não há evidência dinâmica recente anexada ao pipeline soberano para validar ataques em runtime.
  Impacto: Controles podem existir no código e ainda assim falhar por composição, headers ou edge behavior.
  Solução recomendada: Anexar relatório DAST mínimo por release candidate ao pacote de evidências da auditoria.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

### Dimensão 4 — Cobertura de Testes e Observabilidade

- TD-042 | Observabilidade inconsistente por uso de console em runtime
  Localização: packages/llm-client/scripts/test-llm.ts:7
  Problema: Identificado em packages/llm-client/scripts/test-llm.ts:7 logging ad-hoc fora da cadeia estruturada de observabilidade.
  Impacto: Sinais operacionais ficam parciais e dificultam correlação entre logs, métricas e traces durante incidentes.
  Solução recomendada: Alinhar o módulo ao logger estruturado e adicionar contexto de tenant/trace nas saídas relevantes.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-043 | Observabilidade inconsistente por uso de console em runtime
  Localização: packages/agents/executivos/boardprep-ai/agent.ts:432
  Problema: Identificado em packages/agents/executivos/boardprep-ai/agent.ts:432 logging ad-hoc fora da cadeia estruturada de observabilidade.
  Impacto: Sinais operacionais ficam parciais e dificultam correlação entre logs, métricas e traces durante incidentes.
  Solução recomendada: Alinhar o módulo ao logger estruturado e adicionar contexto de tenant/trace nas saídas relevantes.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-044 | Cobertura estrutural baixa em apps/web
  Localização: apps/web/app/(dashboard)/analytics/error.tsx:1
  Problema: O proxy de cobertura identifica 126 arquivos de runtime para apps/web, mas apenas 22 arquivos de teste diretos e 4 gaps principais.
  Impacto: Com poucos testes diretos para módulos extensos, regressões operacionais e de observabilidade tendem a aparecer tarde no ciclo.
  Solução recomendada: Priorizar suites unit/integration nos primeiros arquivos do gap e anexar cobertura quantitativa real ao lane soberano.
  VDI: 2.85 (MÉDIO)
  Esforço: 1-3 dias

- TD-045 | Cobertura estrutural baixa em apps/worker
  Localização: apps/worker/src/agents/runtime.db-integration.harness.ts:1
  Problema: O proxy de cobertura identifica 77 arquivos de runtime para apps/worker, mas apenas 31 arquivos de teste diretos e 1 gaps principais.
  Impacto: Com poucos testes diretos para módulos extensos, regressões operacionais e de observabilidade tendem a aparecer tarde no ciclo.
  Solução recomendada: Priorizar suites unit/integration nos primeiros arquivos do gap e anexar cobertura quantitativa real ao lane soberano.
  VDI: 2.85 (MÉDIO)
  Esforço: 1-3 dias

- TD-046 | Módulo volumoso sem teste relacionado direto
  Localização: apps/api/src/middleware/rate-limit.ts:1
  Problema: Identificado em apps/api/src/middleware/rate-limit.ts um módulo relevante sem teste relacionado por heurística de nome/stem no workspace atual.
  Impacto: A chance de regressão silenciosa cresce quando módulos grandes ou críticos não têm suite vinculada de forma óbvia.
  Solução recomendada: Criar pelo menos um teste unitário ou integration diretamente associado ao boundary do arquivo.
  VDI: 2.65 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-047 | Módulo volumoso sem teste relacionado direto
  Localização: apps/web/components/layout/Navbar.tsx:1
  Problema: Identificado em apps/web/components/layout/Navbar.tsx um módulo relevante sem teste relacionado por heurística de nome/stem no workspace atual.
  Impacto: A chance de regressão silenciosa cresce quando módulos grandes ou críticos não têm suite vinculada de forma óbvia.
  Solução recomendada: Criar pelo menos um teste unitário ou integration diretamente associado ao boundary do arquivo.
  VDI: 2.65 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-048 | [DADOS INSUFICIENTES — REQUER: cobertura por módulo] Cobertura quantitativa por camada
  Localização: scripts/testing/generate-traceability-report.mjs:1
  Problema: Há muitas suites de teste no monorepo, mas a auditoria não encontra uma matriz de cobertura unit/integration/e2e por módulo do core no formato atual.
  Impacto: Sem a decomposição por módulo, o risco de falso conforto sobre cobertura global aumenta.
  Solução recomendada: Gerar um relatório de cobertura por módulo e anexar ao pipeline soberano.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-049 | [DADOS INSUFICIENTES — REQUER: SLO dashboards vivos] SLO/SLA com erro budget operacional (complementar 2)
  Localização: infra/monitoring/alert.rules.yml:1
  Problema: Há artefatos e regras de monitoramento versionados, mas não há evidência viva de dashboards/SLOs com budget consumido por janela.
  Impacto: A operação fica com sinais técnicos, mas sem indicador explícito de confiabilidade do serviço para decisão executiva.
  Solução recomendada: Versionar a definição de SLO por fluxo crítico e anexar screenshot/export JSON dos dashboards vivos.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-050 | [DADOS INSUFICIENTES — REQUER: cobertura por módulo] Cobertura quantitativa por camada (complementar 3)
  Localização: scripts/testing/generate-traceability-report.mjs:1
  Problema: Há muitas suites de teste no monorepo, mas a auditoria não encontra uma matriz de cobertura unit/integration/e2e por módulo do core no formato atual.
  Impacto: Sem a decomposição por módulo, o risco de falso conforto sobre cobertura global aumenta.
  Solução recomendada: Gerar um relatório de cobertura por módulo e anexar ao pipeline soberano.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-051 | [DADOS INSUFICIENTES — REQUER: SLO dashboards vivos] SLO/SLA com erro budget operacional (complementar 4)
  Localização: infra/monitoring/alert.rules.yml:1
  Problema: Há artefatos e regras de monitoramento versionados, mas não há evidência viva de dashboards/SLOs com budget consumido por janela.
  Impacto: A operação fica com sinais técnicos, mas sem indicador explícito de confiabilidade do serviço para decisão executiva.
  Solução recomendada: Versionar a definição de SLO por fluxo crítico e anexar screenshot/export JSON dos dashboards vivos.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-052 | [DADOS INSUFICIENTES — REQUER: cobertura por módulo] Cobertura quantitativa por camada (complementar 5)
  Localização: scripts/testing/generate-traceability-report.mjs:1
  Problema: Há muitas suites de teste no monorepo, mas a auditoria não encontra uma matriz de cobertura unit/integration/e2e por módulo do core no formato atual.
  Impacto: Sem a decomposição por módulo, o risco de falso conforto sobre cobertura global aumenta.
  Solução recomendada: Gerar um relatório de cobertura por módulo e anexar ao pipeline soberano.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-053 | [DADOS INSUFICIENTES — REQUER: SLO dashboards vivos] SLO/SLA com erro budget operacional (complementar 6)
  Localização: infra/monitoring/alert.rules.yml:1
  Problema: Há artefatos e regras de monitoramento versionados, mas não há evidência viva de dashboards/SLOs com budget consumido por janela.
  Impacto: A operação fica com sinais técnicos, mas sem indicador explícito de confiabilidade do serviço para decisão executiva.
  Solução recomendada: Versionar a definição de SLO por fluxo crítico e anexar screenshot/export JSON dos dashboards vivos.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

### Dimensão 5 — Performance e Escalabilidade

- TD-054 | Consulta findMany sem paginação explícita
  Localização: apps/api/src/modules/clinical/service.ts:906
  Problema: Indício em apps/api/src/modules/clinical/service.ts:906 de uso de findMany sem take/skip/cursor nas linhas adjacentes.
  Impacto: Consultas amplas degradam latência, aumentam custo de banco e pioram risco de DoS por leitura excessiva.
  Solução recomendada: Adicionar paginação explícita, limites defensivos e métricas por rota/serviço que consome a query.
  VDI: 3.3 (ALTO)
  Esforço: 0.5-2 dias

- TD-055 | Consulta findMany sem paginação explícita
  Localização: apps/api/src/modules/clinical/service.ts:995
  Problema: Indício em apps/api/src/modules/clinical/service.ts:995 de uso de findMany sem take/skip/cursor nas linhas adjacentes.
  Impacto: Consultas amplas degradam latência, aumentam custo de banco e pioram risco de DoS por leitura excessiva.
  Solução recomendada: Adicionar paginação explícita, limites defensivos e métricas por rota/serviço que consome a query.
  VDI: 3.3 (ALTO)
  Esforço: 0.5-2 dias

- TD-056 | Await serial em loop de runtime
  Localização: apps/api/src/modules/billing/sync-plans.ts:63
  Problema: Indício em apps/api/src/modules/billing/sync-plans.ts:63 de await dentro de loop sequencial.
  Impacto: Esse padrão alonga tempo de resposta e throughput do worker/API, principalmente sob carga ou fan-out externo.
  Solução recomendada: Avaliar paralelização controlada, batching ou filas dedicadas com limites explícitos.
  VDI: 3.05 (ALTO)
  Esforço: 1-3 dias

- TD-057 | Await serial em loop de runtime
  Localização: apps/api/src/modules/packs/pack-installer.service.ts:92
  Problema: Indício em apps/api/src/modules/packs/pack-installer.service.ts:92 de await dentro de loop sequencial.
  Impacto: Esse padrão alonga tempo de resposta e throughput do worker/API, principalmente sob carga ou fan-out externo.
  Solução recomendada: Avaliar paralelização controlada, batching ou filas dedicadas com limites explícitos.
  VDI: 3.05 (ALTO)
  Esforço: 1-3 dias

- TD-058 | Await serial em loop de runtime
  Localização: apps/api/src/modules/packs/pack-installer.service.ts:136
  Problema: Indício em apps/api/src/modules/packs/pack-installer.service.ts:136 de await dentro de loop sequencial.
  Impacto: Esse padrão alonga tempo de resposta e throughput do worker/API, principalmente sob carga ou fan-out externo.
  Solução recomendada: Avaliar paralelização controlada, batching ou filas dedicadas com limites explícitos.
  VDI: 3.05 (ALTO)
  Esforço: 1-3 dias

- TD-059 | Await serial em loop de runtime
  Localização: apps/api/src/modules/packs/pack-installer.service.ts:419
  Problema: Indício em apps/api/src/modules/packs/pack-installer.service.ts:419 de await dentro de loop sequencial.
  Impacto: Esse padrão alonga tempo de resposta e throughput do worker/API, principalmente sob carga ou fan-out externo.
  Solução recomendada: Avaliar paralelização controlada, batching ou filas dedicadas com limites explícitos.
  VDI: 3.05 (ALTO)
  Esforço: 1-3 dias

- TD-060 | Página/estado web com complexidade alta (120)
  Localização: apps/web/app/(dashboard)/patients/[id]/page.tsx:99
  Problema: Identificado em apps/web/app/(dashboard)/patients/[id]/page.tsx:99 um componente/página com complexidade 120.
  Impacto: Componentes muito complexos prejudicam rendering predictability, manutenção de loading/error states e otimização futura de bundle.
  Solução recomendada: Separar data-loading, rendering e actions do componente em camadas menores e mais previsíveis.
  VDI: 2.4 (MÉDIO)
  Esforço: 1-3 dias

- TD-061 | Página/estado web com complexidade alta (32)
  Localização: apps/web/app/(dashboard)/conversations/page.tsx:51
  Problema: Identificado em apps/web/app/(dashboard)/conversations/page.tsx:51 um componente/página com complexidade 32.
  Impacto: Componentes muito complexos prejudicam rendering predictability, manutenção de loading/error states e otimização futura de bundle.
  Solução recomendada: Separar data-loading, rendering e actions do componente em camadas menores e mais previsíveis.
  VDI: 2.4 (MÉDIO)
  Esforço: 1-3 dias

- TD-062 | Página/estado web com complexidade alta (37)
  Localização: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx:18
  Problema: Identificado em apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx:18 um componente/página com complexidade 37.
  Impacto: Componentes muito complexos prejudicam rendering predictability, manutenção de loading/error states e otimização futura de bundle.
  Solução recomendada: Separar data-loading, rendering e actions do componente em camadas menores e mais previsíveis.
  VDI: 2.4 (MÉDIO)
  Esforço: 1-3 dias

- TD-063 | [DADOS INSUFICIENTES — REQUER: bundle baseline fresco] Tamanho real do bundle web no HEAD
  Localização: scripts/quality/generate-web-bundle-baseline.mjs:1
  Problema: O monorepo inclui script de baseline de bundle, mas sem uma execução fresca o risco de regressão de peso no frontend continua inconclusivo.
  Impacto: Sem esse número, LCP e TTI podem piorar sem gatilho visível no release lane.
  Solução recomendada: Executar a baseline de bundle durante a coleta do auditor-prime e anexar o resultado ao suporte da auditoria.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-064 | [DADOS INSUFICIENTES — REQUER: load test recente] Prova de throughput sob stress no core (complementar 2)
  Localização: package.json:1
  Problema: Há scripts de stress e overload, mas a auditoria soberana não possui uma execução recente associada ao HEAD auditado.
  Impacto: Capacidade e backpressure podem ser superestimados perto do lançamento.
  Solução recomendada: Executar pelo menos um teste de carga rápido para API e worker no collect de release candidate.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-065 | [DADOS INSUFICIENTES — REQUER: bundle baseline fresco] Tamanho real do bundle web no HEAD (complementar 3)
  Localização: scripts/quality/generate-web-bundle-baseline.mjs:1
  Problema: O monorepo inclui script de baseline de bundle, mas sem uma execução fresca o risco de regressão de peso no frontend continua inconclusivo.
  Impacto: Sem esse número, LCP e TTI podem piorar sem gatilho visível no release lane.
  Solução recomendada: Executar a baseline de bundle durante a coleta do auditor-prime e anexar o resultado ao suporte da auditoria.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

### Dimensão 6 — Infraestrutura e DevOps

- TD-066 | Histórico recente contém mensagens de commit placeholder
  Localização: package.json:1
  Problema: O histórico local dos últimos 30 dias inclui mensagens placeholder como "1", degradando rastreabilidade de mudança e auditoria operacional.
  Impacto: Commit history fraco dificulta RCA, medição DORA e recuperação de contexto durante incidentes ou auditorias.
  Solução recomendada: Fazer hard fail para mensagens placeholder no lane principal e limpar exceções históricas com política explícita.
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-067 | Dockerfile sem evidência de multi-stage build
  Localização: audit/files_analysis/apps/api/Dockerfile.md:1
  Problema: Identificado em audit/files_analysis/apps/api/Dockerfile.md apenas 0 instrução(ões) FROM.
  Impacto: Imagens single-stage tendem a carregar toolchain desnecessária, elevar superfície de ataque e aumentar tempo de pull/deploy.
  Solução recomendada: Converter o Dockerfile para multi-stage com base enxuta e assets finais mínimos.
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-068 | Dockerfile sem evidência de multi-stage build
  Localização: audit/files_analysis/apps/web/Dockerfile.md:1
  Problema: Identificado em audit/files_analysis/apps/web/Dockerfile.md apenas 0 instrução(ões) FROM.
  Impacto: Imagens single-stage tendem a carregar toolchain desnecessária, elevar superfície de ataque e aumentar tempo de pull/deploy.
  Solução recomendada: Converter o Dockerfile para multi-stage com base enxuta e assets finais mínimos.
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-069 | Dockerfile sem evidência de multi-stage build
  Localização: audit/files_analysis/apps/worker/Dockerfile.md:1
  Problema: Identificado em audit/files_analysis/apps/worker/Dockerfile.md apenas 0 instrução(ões) FROM.
  Impacto: Imagens single-stage tendem a carregar toolchain desnecessária, elevar superfície de ataque e aumentar tempo de pull/deploy.
  Solução recomendada: Converter o Dockerfile para multi-stage com base enxuta e assets finais mínimos.
  VDI: 2.8 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-070 | Diretório Kubernetes existe sem manifests ativos
  Localização: infra/k8s/.gitkeep:1
  Problema: O repositório reserva uma superfície `infra/k8s`, mas sem manifests ativos além do placeholder.
  Impacto: Esse estado sugere infraestrutura parcialmente planejada, o que pode confundir estratégia real de runtime e disaster recovery.
  Solução recomendada: Ou materializar a estratégia Kubernetes com manifests mínimos, ou remover a superfície para reduzir falsa expectativa operacional.
  VDI: 2.5 (MÉDIO)
  Esforço: 0.5-2 dias

- TD-071 | [DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod
  Localização: docs/release/release-process.md:1
  Problema: A documentação de release descreve preflights e segredos selados, mas não há um inventário consolidado das diferenças aceitáveis entre ambientes.
  Impacto: Diferenças silenciosas entre staging e produção seguem difíceis de auditar antes do go-live.
  Solução recomendada: Versionar uma matriz de paridade de ambientes com owners e campos obrigatórios.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-072 | [DADOS INSUFICIENTES — REQUER: lead time por PR] Métrica DORA completa de mudança (complementar 2)
  Localização: .github/workflows/cd.yml:1
  Problema: O histórico Git local permite proxy de frequência, mas não mede com precisão o lead time PR->produção sem dados externos ou metadados adicionais.
  Impacto: A priorização de gargalos de entrega pode superestimar ou subestimar o custo real do fluxo de mudança.
  Solução recomendada: Conectar a auditoria soberana a metadados de PR/deploy ou exportar esses dados para suporte local.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-073 | [DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod (complementar 3)
  Localização: docs/release/release-process.md:1
  Problema: A documentação de release descreve preflights e segredos selados, mas não há um inventário consolidado das diferenças aceitáveis entre ambientes.
  Impacto: Diferenças silenciosas entre staging e produção seguem difíceis de auditar antes do go-live.
  Solução recomendada: Versionar uma matriz de paridade de ambientes com owners e campos obrigatórios.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-074 | [DADOS INSUFICIENTES — REQUER: lead time por PR] Métrica DORA completa de mudança (complementar 4)
  Localização: .github/workflows/cd.yml:1
  Problema: O histórico Git local permite proxy de frequência, mas não mede com precisão o lead time PR->produção sem dados externos ou metadados adicionais.
  Impacto: A priorização de gargalos de entrega pode superestimar ou subestimar o custo real do fluxo de mudança.
  Solução recomendada: Conectar a auditoria soberana a metadados de PR/deploy ou exportar esses dados para suporte local.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-075 | [DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod (complementar 5)
  Localização: docs/release/release-process.md:1
  Problema: A documentação de release descreve preflights e segredos selados, mas não há um inventário consolidado das diferenças aceitáveis entre ambientes.
  Impacto: Diferenças silenciosas entre staging e produção seguem difíceis de auditar antes do go-live.
  Solução recomendada: Versionar uma matriz de paridade de ambientes com owners e campos obrigatórios.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-076 | [DADOS INSUFICIENTES — REQUER: lead time por PR] Métrica DORA completa de mudança (complementar 6)
  Localização: .github/workflows/cd.yml:1
  Problema: O histórico Git local permite proxy de frequência, mas não mede com precisão o lead time PR->produção sem dados externos ou metadados adicionais.
  Impacto: A priorização de gargalos de entrega pode superestimar ou subestimar o custo real do fluxo de mudança.
  Solução recomendada: Conectar a auditoria soberana a metadados de PR/deploy ou exportar esses dados para suporte local.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-077 | [DADOS INSUFICIENTES — REQUER: inventário de ambientes] Paridade real dev/staging/prod (complementar 7)
  Localização: docs/release/release-process.md:1
  Problema: A documentação de release descreve preflights e segredos selados, mas não há um inventário consolidado das diferenças aceitáveis entre ambientes.
  Impacto: Diferenças silenciosas entre staging e produção seguem difíceis de auditar antes do go-live.
  Solução recomendada: Versionar uma matriz de paridade de ambientes com owners e campos obrigatórios.
  VDI: 2.35 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

### Dimensão 7 — Dívida de Produto e UX Técnica

- TD-078 | Rota sem estados auxiliares dedicados (loading.tsx + error.tsx)
  Localização: apps/web/app/(dashboard)/agents/[id]/page.tsx:1
  Problema: A rota apps/web/app/(dashboard)/agents/[id]/page.tsx não traz todos os estados dedicados de loading/error esperados no App Router.
  Impacto: Ausência desses estados degrada a UX percebida e deixa falhas/carregamentos longos sem tratamento consistente.
  Solução recomendada: Adicionar arquivos dedicados de loading/error com feedback claro e recuperação assistida.
  VDI: 2.55 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-079 | Rota sem estados auxiliares dedicados (loading.tsx + error.tsx)
  Localização: apps/web/app/(dashboard)/agents/[id]/policies/page.tsx:1
  Problema: A rota apps/web/app/(dashboard)/agents/[id]/policies/page.tsx não traz todos os estados dedicados de loading/error esperados no App Router.
  Impacto: Ausência desses estados degrada a UX percebida e deixa falhas/carregamentos longos sem tratamento consistente.
  Solução recomendada: Adicionar arquivos dedicados de loading/error com feedback claro e recuperação assistida.
  VDI: 2.55 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-080 | Rota sem estados auxiliares dedicados (loading.tsx + error.tsx)
  Localização: apps/web/app/(dashboard)/agents/[id]/run/page.tsx:1
  Problema: A rota apps/web/app/(dashboard)/agents/[id]/run/page.tsx não traz todos os estados dedicados de loading/error esperados no App Router.
  Impacto: Ausência desses estados degrada a UX percebida e deixa falhas/carregamentos longos sem tratamento consistente.
  Solução recomendada: Adicionar arquivos dedicados de loading/error com feedback claro e recuperação assistida.
  VDI: 2.55 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-081 | Strings de interface hardcoded em superfície web
  Localização: apps/web/app/(dashboard)/agents/page.tsx:7
  Problema: Identificado em apps/web/app/(dashboard)/agents/page.tsx:7 um cluster de 46 linhas com texto hardcoded na UI.
  Impacto: Esse padrão reduz prontidão para i18n, dificulta consistência editorial e aumenta custo de manutenção de UX.
  Solução recomendada: Extrair strings para camada de mensagens/localização com organização por rota e contexto de uso.
  VDI: 2.55 (MÉDIO)
  Esforço: 1-3 dias

- TD-082 | Strings de interface hardcoded em superfície web
  Localização: apps/web/app/(dashboard)/analytics/page.tsx:8
  Problema: Identificado em apps/web/app/(dashboard)/analytics/page.tsx:8 um cluster de 33 linhas com texto hardcoded na UI.
  Impacto: Esse padrão reduz prontidão para i18n, dificulta consistência editorial e aumenta custo de manutenção de UX.
  Solução recomendada: Extrair strings para camada de mensagens/localização com organização por rota e contexto de uso.
  VDI: 2.55 (MÉDIO)
  Esforço: 1-3 dias

- TD-083 | Strings de interface hardcoded em superfície web
  Localização: apps/web/app/(dashboard)/billing/budgets/page.tsx:10
  Problema: Identificado em apps/web/app/(dashboard)/billing/budgets/page.tsx:10 um cluster de 29 linhas com texto hardcoded na UI.
  Impacto: Esse padrão reduz prontidão para i18n, dificulta consistência editorial e aumenta custo de manutenção de UX.
  Solução recomendada: Extrair strings para camada de mensagens/localização com organização por rota e contexto de uso.
  VDI: 2.55 (MÉDIO)
  Esforço: 1-3 dias

- TD-084 | Strings de interface hardcoded em superfície web
  Localização: apps/web/app/(dashboard)/conversations/page.tsx:2
  Problema: Identificado em apps/web/app/(dashboard)/conversations/page.tsx:2 um cluster de 81 linhas com texto hardcoded na UI.
  Impacto: Esse padrão reduz prontidão para i18n, dificulta consistência editorial e aumenta custo de manutenção de UX.
  Solução recomendada: Extrair strings para camada de mensagens/localização com organização por rota e contexto de uso.
  VDI: 2.55 (MÉDIO)
  Esforço: 1-3 dias

- TD-085 | Strings de interface hardcoded em superfície web
  Localização: apps/web/app/(dashboard)/dashboard/page.tsx:7
  Problema: Identificado em apps/web/app/(dashboard)/dashboard/page.tsx:7 um cluster de 19 linhas com texto hardcoded na UI.
  Impacto: Esse padrão reduz prontidão para i18n, dificulta consistência editorial e aumenta custo de manutenção de UX.
  Solução recomendada: Extrair strings para camada de mensagens/localização com organização por rota e contexto de uso.
  VDI: 2.55 (MÉDIO)
  Esforço: 1-3 dias

- TD-086 | Strings de interface hardcoded em superfície web
  Localização: apps/web/app/(dashboard)/developers/apikeys/page.tsx:2
  Problema: Identificado em apps/web/app/(dashboard)/developers/apikeys/page.tsx:2 um cluster de 44 linhas com texto hardcoded na UI.
  Impacto: Esse padrão reduz prontidão para i18n, dificulta consistência editorial e aumenta custo de manutenção de UX.
  Solução recomendada: Extrair strings para camada de mensagens/localização com organização por rota e contexto de uso.
  VDI: 2.55 (MÉDIO)
  Esforço: 1-3 dias

- TD-087 | A11y automatizada sinaliza input-label
  Localização: apps/web/app/(dashboard)/conversations/page.tsx:186
  Problema: A evidência automatizada de acessibilidade encontrou input-label em apps/web/app/(dashboard)/conversations/page.tsx:186.
  Impacto: Esse tipo de falha compromete navegação assistiva, semântica e prontidão WCAG em fluxos já renderizados.
  Solução recomendada: Corrigir o elemento sinalizado e adicionar regressão automatizada para a rota/superfície afetada.
  VDI: 2 (MÉDIO)
  Esforço: <2h

- TD-088 | A11y automatizada sinaliza table-caption
  Localização: apps/web/app/(dashboard)/agents/page.tsx:93
  Problema: A evidência automatizada de acessibilidade encontrou table-caption em apps/web/app/(dashboard)/agents/page.tsx:93.
  Impacto: Esse tipo de falha compromete navegação assistiva, semântica e prontidão WCAG em fluxos já renderizados.
  Solução recomendada: Corrigir o elemento sinalizado e adicionar regressão automatizada para a rota/superfície afetada.
  VDI: 1.65 (BAIXO)
  Esforço: <2h

### Dimensão 8 — Maturidade Operacional e Multi-tenancy

- TD-089 | Drill de disaster recovery não registrado no ciclo atual
  Localização: artifacts/dr/latest-drill.json:1
  Problema: O artefato fresco de DR está em status "missing-drill-record", sem comprovação recente de exercício de recuperação.
  Impacto: A recuperabilidade operacional segue mais assumida do que comprovada, elevando risco de restauração lenta em incidente real.
  Solução recomendada: Executar o drill com o script operacional versionado e anexar o resultado ao pacote soberano do ciclo.
  VDI: 3.15 (ALTO)
  Esforço: 0.5-2 dias

- TD-090 | Playbook explícito de on-call não encontrado
  Localização: docs/release/release-process.md:1
  Problema: Há processo de release e runbook de go-live, mas sem playbook claro de on-call/escalation versionado no conjunto atual.
  Impacto: Sem definição formal de ownership e escalonamento, o tempo de restauração cresce em incidentes reais.
  Solução recomendada: Publicar playbook de on-call com owners, contatos, severidades e critérios de escalonamento.
  VDI: 2.85 (MÉDIO)
  Esforço: 0.5-1 dia

- TD-091 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant
  Localização: docs/operational/README.md:1
  Problema: O repositório não expõe um documento SLA explícito por tenant/serviço no conjunto de docs atual.
  Impacto: Sem SLA público-interno versionado, incidentes e prioridades de restauração perdem referência contratual e operacional.
  Solução recomendada: Versionar um SLA operacional mínimo e referenciá-lo no hub operacional e no release process.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-092 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 2)
  Localização: packages/database/docs/BACKUP_RECOVERY.md:1
  Problema: Há documentação e scripts ligados a backup/recovery, mas a auditoria soberana não encontra evidência fresca de drill executado para o ciclo atual.
  Impacto: A recuperabilidade real do sistema continua mais assumida do que comprovada.
  Solução recomendada: Anexar evidência de drill de recuperação ao pacote operacional por release ou quarter.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-093 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant (complementar 3)
  Localização: docs/operational/README.md:1
  Problema: O repositório não expõe um documento SLA explícito por tenant/serviço no conjunto de docs atual.
  Impacto: Sem SLA público-interno versionado, incidentes e prioridades de restauração perdem referência contratual e operacional.
  Solução recomendada: Versionar um SLA operacional mínimo e referenciá-lo no hub operacional e no release process.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-094 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 4)
  Localização: packages/database/docs/BACKUP_RECOVERY.md:1
  Problema: Há documentação e scripts ligados a backup/recovery, mas a auditoria soberana não encontra evidência fresca de drill executado para o ciclo atual.
  Impacto: A recuperabilidade real do sistema continua mais assumida do que comprovada.
  Solução recomendada: Anexar evidência de drill de recuperação ao pacote operacional por release ou quarter.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-095 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant (complementar 5)
  Localização: docs/operational/README.md:1
  Problema: O repositório não expõe um documento SLA explícito por tenant/serviço no conjunto de docs atual.
  Impacto: Sem SLA público-interno versionado, incidentes e prioridades de restauração perdem referência contratual e operacional.
  Solução recomendada: Versionar um SLA operacional mínimo e referenciá-lo no hub operacional e no release process.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-096 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 6)
  Localização: packages/database/docs/BACKUP_RECOVERY.md:1
  Problema: Há documentação e scripts ligados a backup/recovery, mas a auditoria soberana não encontra evidência fresca de drill executado para o ciclo atual.
  Impacto: A recuperabilidade real do sistema continua mais assumida do que comprovada.
  Solução recomendada: Anexar evidência de drill de recuperação ao pacote operacional por release ou quarter.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-097 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant (complementar 7)
  Localização: docs/operational/README.md:1
  Problema: O repositório não expõe um documento SLA explícito por tenant/serviço no conjunto de docs atual.
  Impacto: Sem SLA público-interno versionado, incidentes e prioridades de restauração perdem referência contratual e operacional.
  Solução recomendada: Versionar um SLA operacional mínimo e referenciá-lo no hub operacional e no release process.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-098 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 8)
  Localização: packages/database/docs/BACKUP_RECOVERY.md:1
  Problema: Há documentação e scripts ligados a backup/recovery, mas a auditoria soberana não encontra evidência fresca de drill executado para o ciclo atual.
  Impacto: A recuperabilidade real do sistema continua mais assumida do que comprovada.
  Solução recomendada: Anexar evidência de drill de recuperação ao pacote operacional por release ou quarter.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-099 | [DADOS INSUFICIENTES — REQUER: SLA versionado] Compromissos operacionais por tenant (complementar 9)
  Localização: docs/operational/README.md:1
  Problema: O repositório não expõe um documento SLA explícito por tenant/serviço no conjunto de docs atual.
  Impacto: Sem SLA público-interno versionado, incidentes e prioridades de restauração perdem referência contratual e operacional.
  Solução recomendada: Versionar um SLA operacional mínimo e referenciá-lo no hub operacional e no release process.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.

- TD-100 | [DADOS INSUFICIENTES — REQUER: evidência de DR drill] Exercício periódico de disaster recovery (complementar 10)
  Localização: packages/database/docs/BACKUP_RECOVERY.md:1
  Problema: Há documentação e scripts ligados a backup/recovery, mas a auditoria soberana não encontra evidência fresca de drill executado para o ciclo atual.
  Impacto: A recuperabilidade real do sistema continua mais assumida do que comprovada.
  Solução recomendada: Anexar evidência de drill de recuperação ao pacote operacional por release ou quarter.
  VDI: 2.95 (MÉDIO)
  Esforço: 0.5-1 dia para materializar a evidência; maior se a capacidade não existir.


## 3. ROADMAP DE INOVAÇÃO — 100 ITENS DE NOVA IMPLEMENTAÇÃO

### AI/ML Nativa

- IN-001 | Copiloto Clínico Materno Contextual
  Categoria: AI/ML Nativa
  Descrição técnica: Adicionar um copiloto longitudinal que cruza dados de workflow, billing e jornada clínica para sugerir a próxima ação segura por paciente. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-002 | Sumarização Evolutiva do Pré-natal
  Categoria: AI/ML Nativa
  Descrição técnica: Gerar resumos estruturados por consulta, com highlights de risco, pendências e próximos marcos da gestação. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-003 | Predição de Abandono de Jornada
  Categoria: AI/ML Nativa
  Descrição técnica: Treinar score de risco para evasão ou ausência com base em engajamento, histórico financeiro e lacunas clínicas. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-004 | Extração Visual de Exames e Guias
  Categoria: AI/ML Nativa
  Descrição técnica: Usar visão computacional para transformar exames e formulários em dados normalizados para workflows e analytics. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-005 | Detecção de Anomalias Operacionais
  Categoria: AI/ML Nativa
  Descrição técnica: Aplicar detecção de anomalias em faturamento, filas e processos para antecipar desvios que afetem receita ou cuidado. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-006 | Recomendador de Próxima Melhor Ação
  Categoria: AI/ML Nativa
  Descrição técnica: Orquestrar recomendações assistidas por IA para atendimento, retenção e follow-up com explicabilidade básica. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-007 | Score Preditivo de No-show
  Categoria: AI/ML Nativa
  Descrição técnica: Pontuar o risco de não comparecimento e disparar automações adaptativas por canal e janela temporal. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-008 | Montador Inteligente de Protocolos
  Categoria: AI/ML Nativa
  Descrição técnica: Gerar rascunhos de protocolos clínicos digitais a partir de outcomes reais do produto e feedback de execução. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-009 | Plano de Cuidado Personalizado
  Categoria: AI/ML Nativa
  Descrição técnica: Montar planos individualizados com base no perfil clínico, adesão e objetivos da paciente/tenant. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-010 | Voz-para-Prontuário Estruturado
  Categoria: AI/ML Nativa
  Descrição técnica: Converter notas de voz em registros estruturados reutilizáveis por workflows, auditoria e analytics. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-011 | Detector de Conflito entre Fluxos
  Categoria: AI/ML Nativa
  Descrição técnica: Identificar conflitos entre automações clínicas, comunicação e billing antes da execução em produção. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-012 | Simulador de Resultado por Cohort
  Categoria: AI/ML Nativa
  Descrição técnica: Simular impacto operacional e clínico de mudanças de protocolo usando cohorts históricos multi-tenant anonimizados. Base técnica observada no repositório: packages/integrations/src/clients/llm.ts, packages/workflows-core/src/nodes/aiTextExtract.ts, apps/api/src/modules/workflows/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

### Automação de Fluxos Clínicos

- IN-013 | Composer de Protocolos Pré-natais
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Versionar protocolos digitais por linha de cuidado com etapas, SLA e regras adaptativas por tenant. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-014 | Checklist por Idade Gestacional
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Disparar checklists contextuais conforme avanço gestacional, perfil de risco e histórico de exames. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-015 | Closed Loop Pós-alerta
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Fechar o ciclo de alertas com confirmação de atendimento, reabertura e trilha auditável de resolução. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-016 | Recuperação Inteligente de Exames Perdidos
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Reabrir automaticamente fluxos de exames não realizados com escalonamento progressivo e reagendamento. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-017 | Automação Alta -> Pós-parto
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Conectar alta, onboarding do puerpério, educação e cobrança em uma única trilha automatizada. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-018 | Coleta Multi-canal de Consentimento
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Capturar e versionar consentimentos por evento clínico, canal e representante legal. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-019 | Escalonamento por Sinal de Risco
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Ativar árvores de decisão com timers, ownership e fallback humano para sinais maternos críticos. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-020 | Encaminhamento com SLA Operacional
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Gerir referrals com prazo, aceite, retorno e monitoramento por parceiro ou unidade. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-021 | Reabertura Automática de Care Gaps
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Reabrir gaps de cuidado quando eventos posteriores invalidarem uma conclusão anterior. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-022 | Pré-consulta Assistida
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Coletar documentação e contexto antes da consulta para reduzir tempo administrativo e erros de input. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-023 | Adesão Terapêutica Automatizada
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Disparar lembretes, confirmação e follow-up quando houver protocolos terapêuticos ativos. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-024 | Case Board Human-in-the-loop
  Categoria: Automação de Fluxos Clínicos
  Descrição técnica: Encaminhar casos complexos para board multidisciplinar com evidência consolidada e decisão versionada. Base técnica observada no repositório: packages/workflows-core/src/nodes/notification.ts, apps/api/src/modules/workflows/service.ts, apps/api/src/modules/notifications/service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

### Interoperabilidade & Dados

- IN-025 | Sync FHIR R4 para Pacientes
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Expor e consumir recursos FHIR R4 para pacientes, agendas e eventos clínicos com mapeamento versionado. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-026 | Listener HL7 ADT
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Aceitar eventos HL7 ADT para sincronizar admissões, altas e movimentações relevantes ao cuidado. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-027 | Normalizador de Resultado Laboratorial
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Padronizar ingestão de resultados laboratoriais multi-fornecedor para o modelo do produto. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-028 | Conector de Ordens de Imagem
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Integrar pedidos e status de exames de imagem ao fluxo operacional e clínico do tenant. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-029 | Export Lakehouse Governado
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Publicar dados harmonizados em camadas bronze/silver/gold com governança por tenant. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-030 | Master Patient Index Multi-origem
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Resolver identidade clínica unificada quando a paciente existir em múltiplos sistemas externos. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-031 | Troca de Dados com Consentimento
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Aplicar consentimento e finalidade no roteamento de dados entre sistemas internos e externos. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-032 | Mapeador Terminológico Clínico
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Criar uma camada de mapeamento entre terminologias externas e o domínio interno da plataforma. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-033 | Firewall de Qualidade de Dados
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Barrar payloads incompletos ou incoerentes antes que contaminem analytics e automações. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-034 | Clean Room de Benchmarking
  Categoria: Interoperabilidade & Dados
  Descrição técnica: Construir benchmark setorial multi-tenant com anonimização forte e governança por cohort. Base técnica observada no repositório: apps/api/src/modules/connectors/service.oauth.ts, packages/integrations/src/clients/http.ts, apps/api/src/modules/webhooks/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

### Engajamento & Retenção

- IN-035 | Milestones e Streaks de Jornada
  Categoria: Engajamento & Retenção
  Descrição técnica: Criar metas e marcos progressivos que reforcem adesão à jornada de cuidado. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-036 | Círculos de Comunidade Curada
  Categoria: Engajamento & Retenção
  Descrição técnica: Habilitar comunidades moderadas por interesse, fase da jornada e contexto do tenant. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-037 | Feed de Conteúdo Personalizado
  Categoria: Engajamento & Retenção
  Descrição técnica: Entregar conteúdo adaptado à paciente com base em risco, fase e comportamento. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-038 | App do Acompanhante Familiar
  Categoria: Engajamento & Retenção
  Descrição técnica: Expandir a jornada para acompanhantes com missões, lembretes e permissões controladas. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-039 | Nudges por Objetivo de Saúde
  Categoria: Engajamento & Retenção
  Descrição técnica: Vincular engajamento a metas explícitas e resultados observáveis em vez de comunicações genéricas. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-040 | Onboarding Adaptativo
  Categoria: Engajamento & Retenção
  Descrição técnica: Ajustar o onboarding conforme perfil, tenant, canal e contexto clínico inicial. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-041 | Carteira de Recompensas de Cuidado
  Categoria: Engajamento & Retenção
  Descrição técnica: Premiar adesão a marcos relevantes com benefícios e experiências personalizadas. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-042 | Recuperação por Sentimento
  Categoria: Engajamento & Retenção
  Descrição técnica: Usar sinais de feedback/sentimento para abrir playbooks de retenção contextualizados. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-043 | Loop de Advocacy e Indicação
  Categoria: Engajamento & Retenção
  Descrição técnica: Transformar boa experiência em indicação rastreável com incentivo e atribuição de origem. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-044 | Motor de Reativação de Retorno
  Categoria: Engajamento & Retenção
  Descrição técnica: Reengajar pacientes inativas com ofertas e fluxos específicos por causa raiz. Base técnica observada no repositório: apps/api/src/modules/engagement/queues.ts, apps/api/src/modules/feedback/service.ts, apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

### Analytics & Business Intelligence

- IN-045 | Explorer de Cohorts Assistido
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Permitir análise por cohort combinando engajamento, receita, risco e outcomes em um fluxo guiado. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-046 | Command Center de Risco Materno
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Concentrar sinais de risco, operação e backlog clínico em uma camada executiva única. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-047 | Benchmark por Clínica/Tenant
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Comparar tenants similares sem expor dados brutos e com filtros contextuais de operação. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-048 | Preditor de Revenue Leakage
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Antecipar vazamentos de receita por churn, falha operacional, inadimplência e não comparecimento. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-049 | Capacity Planning Twin
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Modelar demanda e capacidade de atendimento usando eventos, sazonalidade e filas. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-050 | Atribuição Outcome -> Receita
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Mostrar a relação entre protocolo, adesão, retenção e receita incremental. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-051 | Heatmap de Aderência a Protocolo
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Medir aderência por equipe, tenant, cohort e jornada em um único artefato navegável. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-052 | Minerador de Motivos de Retenção
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Consolidar texto, eventos e histórico para descobrir drivers reais de retenção/churn. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-053 | Radar Multi-tenant de Anomalias
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Detectar anomalias comparativas entre tenants em tempo quase real. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-054 | Narrativa Executiva Automática
  Categoria: Analytics & Business Intelligence
  Descrição técnica: Gerar sumários executivos semanais com contexto, risco e próxima ação recomendada. Base técnica observada no repositório: apps/api/src/modules/analytics/service.ts, apps/api/src/modules/analytics/dashboard.service.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 4/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

### Marketplace & Ecossistema

- IN-055 | Marketplace de Parceiros Verificados
  Categoria: Marketplace & Ecossistema
  Descrição técnica: Criar um marketplace de parceiros com onboarding, QA técnico e score de confiabilidade. Base técnica observada no repositório: apps/api/src/modules/marketplace/marketplace-service.ts, packages/agent-packs/package.json, apps/api/src/modules/connectors/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-056 | Pacotes White-label por Vertical
  Categoria: Marketplace & Ecossistema
  Descrição técnica: Comercializar bundles de capacidade por vertical, região ou porte de operação. Base técnica observada no repositório: apps/api/src/modules/marketplace/marketplace-service.ts, packages/agent-packs/package.json, apps/api/src/modules/connectors/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-057 | App Store Privada por Tenant
  Categoria: Marketplace & Ecossistema
  Descrição técnica: Permitir catálogo privado de extensões aprovadas por tenant com políticas próprias. Base técnica observada no repositório: apps/api/src/modules/marketplace/marketplace-service.ts, packages/agent-packs/package.json, apps/api/src/modules/connectors/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-058 | Ranking de Parceiros por Outcome
  Categoria: Marketplace & Ecossistema
  Descrição técnica: Ordenar parceiros pelo efeito em adoção, retenção e eficiência operacional. Base técnica observada no repositório: apps/api/src/modules/marketplace/marketplace-service.ts, packages/agent-packs/package.json, apps/api/src/modules/connectors/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-059 | Programa de Monetização de Conectores
  Categoria: Marketplace & Ecossistema
  Descrição técnica: Abrir um modelo de distribuição e revenue share para integrações certificadas. Base técnica observada no repositório: apps/api/src/modules/marketplace/marketplace-service.ts, packages/agent-packs/package.json, apps/api/src/modules/connectors/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-060 | Troca de Protocolos entre Tenants
  Categoria: Marketplace & Ecossistema
  Descrição técnica: Publicar protocolos reutilizáveis com trilha de adoção e benchmarking de resultado. Base técnica observada no repositório: apps/api/src/modules/marketplace/marketplace-service.ts, packages/agent-packs/package.json, apps/api/src/modules/connectors/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-061 | Marketplace Embutido na Jornada
  Categoria: Marketplace & Ecossistema
  Descrição técnica: Oferecer serviços complementares dentro do fluxo do usuário no momento de necessidade. Base técnica observada no repositório: apps/api/src/modules/marketplace/marketplace-service.ts, packages/agent-packs/package.json, apps/api/src/modules/connectors/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

- IN-062 | Console de Revenue Share
  Categoria: Marketplace & Ecossistema
  Descrição técnica: Dar transparência operacional/financeira a parcerias com cálculo e repasse automatizados. Base técnica observada no repositório: apps/api/src/modules/marketplace/marketplace-service.ts, packages/agent-packs/package.json, apps/api/src/modules/connectors/router.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 5/5
  Fase: Fase 4

### Infraestrutura & Developer Experience

- IN-063 | Produto de API Pública
  Categoria: Infraestrutura & Developer Experience
  Descrição técnica: Transformar a API atual em produto externo com versionamento, quotas e onboarding de desenvolvedores. Base técnica observada no repositório: apps/api/src/docs/openapi.ts, apps/api/src/modules/webhooks/settings.service.ts, packages/shared-types/src/index.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 2

- IN-064 | Studio de Contratos de Evento/Webhook
  Categoria: Infraestrutura & Developer Experience
  Descrição técnica: Editor visual de contratos de evento com replay, validação e changelog de schema. Base técnica observada no repositório: apps/api/src/docs/openapi.ts, apps/api/src/modules/webhooks/settings.service.ts, packages/shared-types/src/index.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 2

- IN-065 | Sandbox de Tenant Sintético
  Categoria: Infraestrutura & Developer Experience
  Descrição técnica: Provisionar tenants efêmeros com dados fictícios e scripts de smoke para integração segura. Base técnica observada no repositório: apps/api/src/docs/openapi.ts, apps/api/src/modules/webhooks/settings.service.ts, packages/shared-types/src/index.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 2

- IN-066 | Gerador de SDKs
  Categoria: Infraestrutura & Developer Experience
  Descrição técnica: Emitir SDKs e exemplos oficiais a partir do OpenAPI e contratos de eventos suportados. Base técnica observada no repositório: apps/api/src/docs/openapi.ts, apps/api/src/modules/webhooks/settings.service.ts, packages/shared-types/src/index.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 2

- IN-067 | Replay Debugger de Integrações
  Categoria: Infraestrutura & Developer Experience
  Descrição técnica: Reexecutar eventos e webhooks em sandbox com rastreamento determinístico. Base técnica observada no repositório: apps/api/src/docs/openapi.ts, apps/api/src/modules/webhooks/settings.service.ts, packages/shared-types/src/index.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 2

- IN-068 | Policy-as-code para Workflows
  Categoria: Infraestrutura & Developer Experience
  Descrição técnica: Definir guardrails executáveis para nodes, limites e acesso por plano/tenant. Base técnica observada no repositório: apps/api/src/docs/openapi.ts, apps/api/src/modules/webhooks/settings.service.ts, packages/shared-types/src/index.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 2

- IN-069 | Laboratório de Testes Sintéticos
  Categoria: Infraestrutura & Developer Experience
  Descrição técnica: Rodar cenários sintéticos contínuos por tenant/persona usando seeds controlados. Base técnica observada no repositório: apps/api/src/docs/openapi.ts, apps/api/src/modules/webhooks/settings.service.ts, packages/shared-types/src/index.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 2

- IN-070 | Docs Interativas com Payload Realista
  Categoria: Infraestrutura & Developer Experience
  Descrição técnica: Publicar documentação interativa com payloads, erros e fluxos reais do domínio. Base técnica observada no repositório: apps/api/src/docs/openapi.ts, apps/api/src/modules/webhooks/settings.service.ts, packages/shared-types/src/index.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 2

### Compliance & Regulatório

- IN-071 | Mapa de Linhagem LGPD
  Categoria: Compliance & Regulatório
  Descrição técnica: Rastrear origem, transformação e destino de dados pessoais/sensíveis por fluxo de produto. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-072 | Automação de Retenção e Descarte
  Categoria: Compliance & Regulatório
  Descrição técnica: Aplicar políticas versionadas de retenção e descarte por categoria de dado. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-073 | Ledger de Consentimento
  Categoria: Compliance & Regulatório
  Descrição técnica: Registrar consentimento, revogação e propósito em trilha imutável e consultável. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-074 | Rule Pack CFM/ANVISA
  Categoria: Compliance & Regulatório
  Descrição técnica: Codificar requisitos regulatórios aplicáveis em pacotes verificáveis por release. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-075 | Registro de IA Explicável
  Categoria: Compliance & Regulatório
  Descrição técnica: Versionar modelos, prompts, datasets e justificativas de uso de IA para auditoria. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-076 | Auditoria Automática por Prontuário
  Categoria: Compliance & Regulatório
  Descrição técnica: Executar verificações automáticas de completude, acesso e trilha por prontuário/evento. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-077 | Controles de Residência de Dados
  Categoria: Compliance & Regulatório
  Descrição técnica: Aplicar restrições de residência e transferência por tenant, integração e relatório. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-078 | Campanhas de Revisão de Acesso
  Categoria: Compliance & Regulatório
  Descrição técnica: Orquestrar recertificação periódica de acessos críticos por tenant e papel. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-079 | Vault de Evidências Regulatórias
  Categoria: Compliance & Regulatório
  Descrição técnica: Agrupar evidências técnicas e operacionais por auditoria, incidente ou release. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-080 | Composer de Relatórios Regulatórios
  Categoria: Compliance & Regulatório
  Descrição técnica: Gerar relatórios regulatórios e de compliance diretamente a partir do runtime da plataforma. Base técnica observada no repositório: apps/api/src/modules/privacy/service.ts, apps/api/src/audit/auditable.ts, packages/database/test/rls.test.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

### Monetização Avançada

- IN-081 | Pricing Usage-based
  Categoria: Monetização Avançada
  Descrição técnica: Cobrar parte da plataforma por uso observável em workflow, integrações, outputs e mensagens. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-082 | Guardrails de Overage
  Categoria: Monetização Avançada
  Descrição técnica: Aplicar limites inteligentes antes de ruptura operacional ou surpresa de fatura. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-083 | Contratos Baseados em Outcome
  Categoria: Monetização Avançada
  Descrição técnica: Modelar monetização condicionada a indicadores de retenção, adesão ou eficiência. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-084 | Motor de Upsell Dinâmico
  Categoria: Monetização Avançada
  Descrição técnica: Sugerir upgrades por padrão de uso, risco e potencial de ROI do tenant. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-085 | Billing Multi-entidade
  Categoria: Monetização Avançada
  Descrição técnica: Consolidar cobrança entre matrizes, unidades e parceiros mantendo segregação de uso. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-086 | Simulador Self-service de Plano
  Categoria: Monetização Avançada
  Descrição técnica: Permitir que o tenant simule custo/benefício de plano e add-ons em tempo real. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-087 | Liquidação de Revenue Share
  Categoria: Monetização Avançada
  Descrição técnica: Automatizar cálculo, retenção e repasse financeiro de parceiros/marketplace. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-088 | Mercado de Créditos Internos
  Categoria: Monetização Avançada
  Descrição técnica: Criar créditos reutilizáveis para IA, integrações premium e serviços de parceiros. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-089 | Dunning Orchestration Inteligente
  Categoria: Monetização Avançada
  Descrição técnica: Otimizar recuperação financeira com mensagens, canais e janelas adaptativas. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

- IN-090 | Cockpit de Inteligência de Margem
  Categoria: Monetização Avançada
  Descrição técnica: Expor margem por tenant, fluxo, integração e feature para orientar pricing e roadmap. Base técnica observada no repositório: apps/api/src/modules/billing/service.ts, apps/api/src/modules/billing/service.checkout.ts, apps/api/src/modules/analytics/usage.service.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 3

### Experiência do Usuário Next-Gen

- IN-091 | Dashboards Adaptativos por Papel
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Montar dashboards distintos para clínico, operação, financeiro e executivo com foco real de decisão. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-092 | Care Hub Mobile-first
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Desenhar uma experiência mobile-first para acompanhamento diário da jornada de cuidado. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-093 | Accessibility Autopilot
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Aplicar ajustes automáticos de contraste, foco e densidade conforme necessidade do usuário. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-094 | Modo Offline para Campo
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Permitir captura e consulta essenciais sem conectividade, com reconciliação segura posterior. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-095 | Command Palette Contextual
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Oferecer ações rápidas orientadas ao contexto da tela, tenant e permissão. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-096 | Layouts Personalizáveis
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Dar autonomia para cada perfil/tenant reorganizar sua área de trabalho com governança. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-097 | Memória de Sessão Cross-touchpoint
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Relembrar contexto relevante entre jornadas web, notificações e atendimento humano. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-098 | Formulários de Divulgação Progressiva
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Reduzir atrito em formulários longos com progressão contextual e validação antecipada. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-099 | Engine Multi-idioma
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Habilitar localização real da interface, conteúdo e notificações por tenant e público. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4

- IN-100 | UX Guiada de Recuperação de Erro
  Categoria: Experiência do Usuário Next-Gen
  Descrição técnica: Transformar falhas em fluxos assistidos de correção em vez de mensagens finais opacas. Base técnica observada no repositório: apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx, apps/web/components/agents/FeedbackWidget.tsx, apps/web/stores/notification-store.ts.
  Valor de negócio: Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.
  Viabilidade técnica: 3/5
  Potencial de diferenciação: 4/5
  Fase: Fase 4


## 4. ROADMAP DE EXECUÇÃO — FASES ESTRUTURADAS

### Fase 0 — Estabilização (Semanas 1-2)

- Objetivo: Resolver todos os itens VDI 4.0+ que bloqueiam segurança, isolamento de tenant ou funcionamento básico.
- Itens de dívida: 0
- Itens de inovação: 0
- Headcount recomendado: 2

### Fase 1 — Fundação (Semanas 3-8)

- Objetivo: Infraestrutura, CI/CD, cobertura mínima, segurança operacional e governança de configuração.
- Itens de dívida: 37
- Itens de inovação: 0
- Headcount recomendado: 5 (excede o time disponível de 2-4 pessoas)

### Fase 2 — Qualidade (Semanas 9-16)

- Objetivo: Refactor de hotspots, performance, experiência do usuário e observabilidade end-to-end.
- Itens de dívida: 51
- Itens de inovação: 8
- Headcount recomendado: 7 (excede o time disponível de 2-4 pessoas)

### Fase 3 — Escala (Semanas 17-24)

- Objetivo: Fortalecer multi-tenancy, billing avançado, interoperabilidade clínica e recuperabilidade.
- Itens de dívida: 12
- Itens de inovação: 30
- Headcount recomendado: 2

### Fase 4 — Inovação (Semanas 25-52)

- Objetivo: Executar os 100 itens de inovação em ordem de ROI e dependência técnica.
- Itens de dívida: 0
- Itens de inovação: 62
- Headcount recomendado: 2


## 5. MATRIZ DE DEPENDÊNCIAS

- Caminho crítico: TD-029 -> TD-001 -> TD-089
- Nós mapeados: 22
- Arestas mapeadas: 18

- TD-054 -> TD-055 (Debt dependency)
- TD-001 -> TD-002 (Debt dependency)
- TD-001 -> TD-003 (Debt dependency)
- TD-001 -> TD-004 (Debt dependency)
- TD-001 -> TD-005 (Debt dependency)
- TD-001 -> TD-006 (Debt dependency)
- TD-001 -> TD-007 (Debt dependency)
- TD-001 -> TD-008 (Debt dependency)
- TD-089 -> IN-001 (Scale foundation before innovation)
- TD-089 -> IN-002 (Scale foundation before innovation)
- TD-089 -> IN-003 (Scale foundation before innovation)
- TD-089 -> IN-004 (Scale foundation before innovation)
- TD-089 -> IN-005 (Scale foundation before innovation)
- TD-089 -> IN-006 (Scale foundation before innovation)
- TD-089 -> IN-007 (Scale foundation before innovation)
- TD-089 -> IN-008 (Scale foundation before innovation)
- TD-089 -> IN-009 (Scale foundation before innovation)
- TD-089 -> IN-010 (Scale foundation before innovation)

## 6. GLOSSÁRIO TÉCNICO

- DORA Metrics: Conjunto de métricas operacionais usado para medir velocidade e confiabilidade de entrega de software.
- VDI: Velocity Drain Index, índice composto usado neste relatório para priorizar dívida técnica por impacto real.
- RLS: Row-Level Security, política do banco que restringe acesso a linhas conforme o contexto do tenant.
- OWASP Top 10: Lista de categorias de risco de segurança comuns em aplicações web.
- STRIDE: Modelo de ameaça que cobre spoofing, tampering, repudiation, information disclosure, denial of service e elevation of privilege.
- SLO: Service Level Objective, meta operacional como latência, disponibilidade ou taxa de erro.
- SLA: Service Level Agreement, compromisso formal de serviço e suporte com cliente ou operação.
- Lead Time for Changes: Tempo entre iniciar uma mudança e colocá-la em produção.
- Change Failure Rate: Percentual de mudanças que causam incidente, rollback ou degradação relevante.
- Time to Restore: Tempo necessário para restaurar o serviço após uma falha relevante.
- Critical Path: Sequência mínima de tarefas que determina a duração total do roadmap.
- C4: Modelo de documentação arquitetural que organiza a visão do sistema em contexto, contêineres, componentes e código.
- Feature Flag: Mecanismo para ligar ou desligar comportamento sem novo deploy.
- DAST: Teste dinâmico de segurança executado contra a aplicação em runtime.
- SBOM: Inventário de componentes de software usado para governança e segurança de dependências.
