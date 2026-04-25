# Plano de Correção em Fases

## FASE 0 — Segurança crítica e vazamento de dados
- Secrets hardcoded detectados via git grep (se houver).
- Tokens em logs (console.log).
- Ações destrutivas de agentes IA sem aprovação humana.

## FASE 1 — Multi-tenancy, RBAC e matriz de permissões
- Validar tenantId.

## FASE 2 — Banco, transações, idempotência e concorrência
- Race conditions em BullMQ.
- Adicionar auditoria no banco.

## FASE 3 — Typecheck, lint, dead code e qualidade base
- Remover 'any' (aprox 6608 encontrados).
- Corrigir '@ts-ignore' (aprox 128 encontrados).
- Quebrar arquivos maiores que 500 linhas.

## FASE 4 — Testes críticos e coverage
- Adicionar cobertura.

## FASE 5 — Arquitetura e boundaries
- Controllers finos.
- Isolar dependências.

## FASE 6 — Observabilidade e operação
- Trocar console.log por @birthub/logger.

## FASE 7 — Integrações, resiliência e filas
- Timeout e circuit breaker.
- Validar Webhooks.

## FASE 8 — Agentes, IA e tool calling seguro
- Require approval para ferramentas perigosas.

## FASE 9 — Frontend, UX, acessibilidade e i18n
- Mover de useEffect.
- Add toasts.

## FASE 10 — Supply chain, CI/CD, release e documentação
- pnpm audit fix.

## FASE 11 — Privacidade, LGPD e qualidade de dados
- Mascarar PII no logger.

## FASE 12 — Developer experience e manutenção contínua
- Changesets.
