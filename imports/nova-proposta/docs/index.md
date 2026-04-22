# Documentação Central BirthHub360

Bem-vindo à página índice do BirthHub360. Este documento atua como a **Fonte de Verdade Única (Single Source of Truth)** do repositório, resolvendo inconsistências de documentos passados.

## 1. Padrões de Código e Arquitetura
- [Naming Conventions & Monorepo](standards/naming-conventions.md)
- [Política de Artefatos](standards/artifacts-policy.md)
- [C4 Contexto Canônico](architecture/c4-context.md)
- [Modelo C4 de Arquitetura (Context/Containers/Components)](architecture/c4-model.md)
- [Bounded Contexts e Limites de Domínio (Auth, Billing, Agents)](architecture/bounded-contexts.md)
- [ADRs - Architectural Decision Records](adrs/index.md)

## 2. Processos, Onboarding e Conhecimento (Glossários)
- [Glossário do Negócio e Agentes Comerciais](knowledge/glossary.md)
- [Guia de Onboarding Técnico (Primeiro Dia, Ambientes)](runbooks/onboarding-guide.md)
- [Relatório Executivo de Saúde Técnica e Dívida](technical-debt/executive-report.md)
- [Catalogo Compilado de 334 GitHub Agents](agent-packs/github-agents-v1-catalog.mdx)

## 3. Playbooks e Runbooks (Engenharia de Dados e Backend)
- [Disaster Recovery e Backups](runbooks/db-backup-restore.md)
- [Rollout de Autenticação e Multitenant](runbooks/auth-tenant-rollout-canary.md)

## 4. Deploy e Releases
- [Processo de Release Scorecard](processes/RELEASE_SCORECARD.md)
- [Relatorio de Mutacao](evidence/mutation-report.md)
- [Relatorio de Dead Code](evidence/dead-code-report.md)
- [Relatorio de Disaster Recovery](evidence/disaster-recovery-report.md)

## 5. Operações e Resposta a Incidentes
- [Capacidades ativas do produto](operations/active-product-capabilities.md)
- [Inventário de Ambientes](operations/environment-inventory.md)
- [Post-Mortems e Resposta a Incidentes (Outage/Security)](runbooks/incident-response.md)
- [Incidentes Críticos](runbooks/critical-incidents.md)
- [Investigação de Queries Lentas](runbooks/slow-query-investigation.md)
- [Triagem de Taxa de Falhas Elevada](runbooks/high-fail-rate-triage.md)
- [Playbook Operacional para Agentes Comerciais](runbooks/playbook-operacional-agentes-comerciais.md)
- [Incidentes Específicos de Tenant](runbooks/tenant-specific-incident-runbook.md)

## 6. Legado e Histórico
Toda documentação histórica divergente destes guias principais deve ser arquivada no repositório (ex: pastas de `audit/` e `archives/`) mas não deve ser usada como material de referência diária de operações ou desenvolvimento.
