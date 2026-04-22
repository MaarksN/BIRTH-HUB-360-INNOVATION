# Auditoria para IA — Execução de Checklists, Auditorias, Roadmaps e Prompts

Data de geração: 2026-04-04

## Objetivo
- Permitir que outra IA audite **todos os itens** encontrados em arquivos de checklist/auditoria/roadmap/prompt e classifique se foram executados ou não.
- Esta auditoria é de evidência documental automática; execução real deve ser validada com logs/CI/runtime.

## Critérios automáticos usados
- `- [x]` = evidência de execução documental marcada.
- `- [ ]` = item não concluído no documento.
- `🟢/🟡/🔴` = status textual/documental (não comprova execução técnica sozinho).
- Itens numerados (`1.`, `2.`) e bullets longos são contabilizados como itens auditáveis quando presentes em listas.

## Prompt mestre para IA auditora (copiar e usar)
```text
Você é um auditor técnico sênior. Analise TODOS os arquivos listados nesta auditoria e classifique cada item como EXECUTADO, PARCIAL, NÃO EXECUTADO ou NÃO COMPROVADO. Para cada item, exija evidência objetiva: commit, teste, log, artefato de CI, ou diferença de código. Não aceite apenas texto declaratório. Entregue saída em tabela com: arquivo, id/item, status, evidência, lacuna, ação corretiva e prioridade (P0-P3). Se houver conflito entre documentos, marque como CONTRADIÇÃO e detalhe os arquivos conflitantes.
```

## Inventário de fontes e status preliminar (automático)

| Fonte | Itens detectados | [x] | [ ] | Prompts | 🟢 | 🟡 | 🔴 | Status preliminar |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `audit/governance_audit_master_checklist_2026-03-29.md` | 3292 | 0 | 3292 | 44 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `docs/product/CHECKLIST_200_ITENS_LANCAMENTO_2026-04-04.md` | 1706 | 0 | 1706 | 210 | 1 | 3 | 206 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `docs/product/RELATORIO_DIVIDA_TECNICA_ROADMAP_LANCAMENTO_2026-04-04.md` | 205 | 0 | 0 | 0 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `audit/master_ci_checklist.md` | 196 | 115 | 43 | 0 | 0 | 0 | 0 | PARCIAL |
| `audit/governance_audit_master_checklist_2026-03-29.html` | 0 | 0 | 0 | 166 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/jules_full_audit_prompt_2026-03-29.md` | 37 | 0 | 0 | 2 | 1 | 0 | 0 | POSSÍVELMENTE CONCLUÍDO (revisão manual) |
| `scripts/forensics/generate_governance_audit_checklist.py` | 22 | 0 | 0 | 15 | 1 | 0 | 0 | POSSÍVELMENTE CONCLUÍDO (revisão manual) |
| `docs/programs/internal/prompt_soberano_v13.html` | 10 | 0 | 0 | 13 | 2 | 2 | 5 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `docs/policies/prompt-editing-policy.md` | 5 | 0 | 0 | 14 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `docs/ux/prompt_improvement_process.md` | 4 | 0 | 4 | 7 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `audit/AUDITORIA_CODEX_RESULTADO_2026-03-29.md` | 8 | 0 | 0 | 0 | 1 | 0 | 0 | POSSÍVELMENTE CONCLUÍDO (revisão manual) |
| `audit/jules_full_audit_prompt_2026-03-29.html` | 0 | 0 | 0 | 8 | 1 | 0 | 0 | POSSÍVELMENTE CONCLUÍDO (revisão manual) |
| `scripts/forensics/render_jules_audit_prompt_pdf.py` | 0 | 0 | 0 | 8 | 1 | 0 | 0 | POSSÍVELMENTE CONCLUÍDO (revisão manual) |
| `docs/adrs/ADR-028_Feedback_Prompt_Cycle.md` | 4 | 0 | 0 | 4 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `docs/product/prompt-improvement-process.md` | 5 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `audit/master_governance_checklist.md` | 0 | 0 | 0 | 0 | 0 | 4 | 2 | NÃO COMPROVADO |
| `packages/agents/executivos/boardprep-ai/system_prompt.md` | 5 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `audit/ROADMAP_FINALIZACAO_PLATAFORMA.md` | 5 | 0 | 0 | 0 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `.github/prompts/revisar-agente.prompt.md` | 4 | 0 | 0 | 0 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `audit/execution_checklist.md` | 4 | 0 | 4 | 0 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `audit/files_analysis/agents/ae/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/analista/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/bdr/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/closer/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/copywriter/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/enablement/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/field/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/financeiro/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/juridico/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/kam/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/ldr/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/marketing/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/partners/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/pos_venda/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/pre_sales/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/sales_ops/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/sdr/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/shared/tests/test_commercial_playbook_prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/agents/social/prompts.py.md` | 0 | 0 | 0 | 3 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/jules_full_audit_prompt_2026-03-29.pdf` | 2 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO EXECUTADO / SEM EVIDÊNCIA |
| `audit/AUDITORIA_CODEX_STATUS.md` | 0 | 0 | 0 | 2 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/_root/PROMPT_GERAL_PENDENCIAS.md.md` | 0 | 0 | 0 | 2 | 0 | 0 | 0 | NÃO COMPROVADO |
| `docs/evidence/prompt-v2-full-phases.md` | 0 | 0 | 0 | 2 | 0 | 0 | 0 | NÃO COMPROVADO |
| `.github/skills/create-agent/references/checklist-validacao.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/birthhub360-master-checklist-v3.html` | 0 | 0 | 0 | 0 | 1 | 0 | 0 | POSSÍVELMENTE CONCLUÍDO (revisão manual) |
| `audit/files_analysis/.github/agents/cycle-09/upsell-prompt.agent.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/.github/prompts/criar-agente.prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/.github/prompts/revisar-agente.prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/docs/adrs/ADR-028_Feedback_Prompt_Cycle.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/docs/evidence/prompt-v2-full-phases.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/docs/policies/prompt-editing-policy.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/docs/product/prompt-improvement-process.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/docs/programs/internal/prompt_soberano_v13.html.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/docs/ux/prompt_improvement_process.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/boardprep-ai/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/brandguardian/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/budgetfluid/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/capitalallocator/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/churndeflector/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/competitorxray/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/crisisnavigator/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/culturepulse/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/expansionmapper/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/marketsentinel/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/narrativeweaver/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/pipelineoracle/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/pricingoptimizer/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/quotaarchitect/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `audit/files_analysis/packages/agents/executivos/trendcatcher/system_prompt.md.md` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | NÃO COMPROVADO |
| `scripts/diagnostics/audit-legacy-db-imports.mjs` | 0 | 0 | 0 | 0 | 1 | 0 | 0 | POSSÍVELMENTE CONCLUÍDO (revisão manual) |

## Itens críticos para validação manual imediata
- `docs/product/CHECKLIST_200_ITENS_LANCAMENTO_2026-04-04.md`: volume muito alto de itens; validar execução real com evidência técnica e não apenas status textual.
- Arquivos em `audit/` com resultados/roadmaps antigos podem conter ações já superadas; exigir reconciliação com código atual.
- Prompts e checklists em `.github/skills` descrevem processo, mas não comprovam execução técnica de produção.

## Próximos passos recomendados para a IA
1. Priorizar itens P0/P1 relacionados a segurança, billing, migração e disponibilidade.
2. Cruzar cada item com commits, testes e logs de CI para comprovação.
3. Gerar relatório final com percentual executado por fonte e por domínio.
4. Emitir lista de bloqueadores de go-live com dono e prazo.
