# Auditoria de Dividas Tecnicas

Data da auditoria: 2026-04-24  
Modo: diagnostico, sem correcao de codigo de producao, sem instalacao de ferramentas e sem PR.

## Resumo executivo

Foram analisados 2.845 arquivos relevantes, excluindo `node_modules`, `.next`, `.turbo` e o diretorio `imports`. O repositorio completo possui 6.130 arquivos rastreaveis por `rg --files`, mas `imports/` concentra 3.285 arquivos e foi tratado como area de sombra/generated para evitar distorcer a leitura principal.

O stack detectado e TypeScript/Node.js com pnpm/Turbo, Next.js no frontend, API Node/Express-like, worker BullMQ/Redis, Prisma/PostgreSQL, pacotes de agentes/LLM/tool calling, webhook receiver, Docker, Kubernetes, Cloud Run e GitHub Actions.

Total de dividas catalogadas: 40.

## Quantidade por severidade

| Severidade | Quantidade |
| --- | ---: |
| Critico | 3 |
| Alto | 17 |
| Medio | 16 |
| Baixo | 4 |

## Quantidade por categoria

Contagem por incidencia de categoria. Um mesmo achado pode impactar mais de uma area.

| Categoria | Incidencias |
| --- | ---: |
| 1. Qualidade de codigo | 3 |
| 2. Arquitetura | 3 |
| 3. Seguranca | 5 |
| 4. Testes | 5 |
| 5. Tipagem | 2 |
| 6. Performance | 2 |
| 7. Banco de dados | 4 |
| 8. Observabilidade | 2 |
| 9. Dependencias | 2 |
| 10. Configuracao | 2 |
| 11. CI/CD | 3 |
| 12. Documentacao | 1 |
| 13. API | 2 |
| 14. Frontend | 2 |
| 15. Acessibilidade | 1 |
| 16. Internacionalizacao | 1 |
| 17. Dominio e regra de negocio | 1 |
| 18. Concorrencia e consistencia | 1 |
| 19. Integracao | 2 |
| 20. Produto/UX | 1 |
| 21. Supply chain | 4 |
| 22. Privacidade/LGPD | 2 |
| 23. Permissoes/RBAC | 2 |
| 24. Agentes/IA/LLM | 2 |
| 25. Resiliencia operacional | 2 |
| 26. Backup/rollback/recuperacao | 1 |
| 27. Infraestrutura | 3 |
| 28. Versionamento/release | 1 |
| 29. Experiencia de desenvolvedor | 3 |
| 30. Qualidade de dados | 2 |

## Top 10 riscos imediatos

1. `TD-001` - `.env` versionado e arquivos sealed/env com material sensivel exigindo verificacao.
2. `TD-003` - tokens e segredos enviados em query string para integracoes.
3. `TD-004` - typecheck global falhando.
4. `TD-010` - governanca de migrations falhando por entradas ausentes no registro.
5. `TD-020` - CI chama script inexistente `pnpm test:isolation`.
6. `TD-006` - scripts de teste de API/Web/Worker quebram no Windows.
7. `TD-013` - regra customizada anti-query Prisma sem tenant cobre poucos arquivos.
8. `TD-014` - webhook Zenvia busca connector account sem `tenantId` no `where`, exigindo prova de isolamento.
9. `TD-015` - bypass de assinatura por `trustedContext` depende de garantia externa ainda nao comprovada.
10. `TD-022` - GitHub Actions e scanners sem pin por SHA/digest, incluindo `trivy-action@master`.

## Proximo plano recomendado

Comecar pela Fase 0 do roadmap: segredos, tokens em URL, CI quebrado para checks de seguranca, migracoes fora do registro e suspeitas multi-tenant/webhook. Em seguida, estabilizar typecheck/testes para transformar a auditoria em gate continuo.

## Relatorios criados

- `technical-debt-full-report.md`
- `top-20-critical-debts.md`
- `security-debts.md`
- `architecture-debts.md`
- `testing-debts.md`
- `type-safety-debts.md`
- `database-debts.md`
- `frontend-ux-a11y-i18n-debts.md`
- `integrations-and-resilience-debts.md`
- `ai-agents-llm-debts.md`
- `supply-chain-debts.md`
- `privacy-lgpd-debts.md`
- `infra-devex-release-debts.md`
- `commands-run.md`
- `skipped-checks.md`
- `remediation-roadmap.md`

## Limitacoes principais

- Semgrep, gitleaks, trufflehog, madge, dependency-cruiser, jscpd, depcheck, ts-prune, syft e grype nao estavam instalados localmente.
- Nao foi usado banco real; checks Prisma foram estaticos ou scripts de governanca seguros.
- `prisma migrate status` nao foi executado para evitar dependencia de banco real.
- Axe, Lighthouse, bundle analyzer e testes E2E browser nao foram executados.
- Os scripts de banco executados geraram artefatos em `artifacts/database/f8`, fora do escopo de relatorios solicitado; isso foi registrado em `commands-run.md`.
