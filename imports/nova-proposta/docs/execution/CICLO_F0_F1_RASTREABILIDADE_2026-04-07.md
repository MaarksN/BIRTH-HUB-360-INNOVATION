# Ciclo F0-F1 - Rastreabilidade e Bloqueadores Canonicos

## Objetivo do ciclo
Fechar os bloqueadores confirmados com evidencia real no repositório, materializar a rastreabilidade pedida pelo backlog indice e reclassificar o estado apos a virada de dominio clinico e i18n no `apps/web`.

## Itens do relatório atacados
- [x] TD-001 revalidado no estado atual do monorepo
- [x] TD-002
- [x] TD-003
- [x] TD-004
- [x] TD-008
- [x] TD-005 validado com evidência
- [x] TD-007 revalidado com evidência de quarentena e freeze
- [x] TD-001 a TD-008 classificados com status e risco residual

## Rastreabilidade
| Item | Fase | Evidência no código | Status | Risco residual |
| --- | --- | --- | --- | --- |
| TD-001 domínio inexistente | Fase 1 | `packages/database/prisma/schema.prisma`, `apps/api/src/modules/clinical/router.ts`, `apps/web/app/(dashboard)/patients/page.tsx` | resolvido | Typecheck e seeds de `packages/database` ainda precisam convergir apos o drift paralelo do Prisma |
| TD-002 home do dashboard ausente | Fase 1 / Fase 4 | `apps/web/app/(dashboard)/dashboard/page.tsx`, `apps/web/lib/dashboard.ts`, `apps/web/components/layout/Navbar.tsx` | resolvido | Métricas administrativas ainda dependem de perfil com acesso ao backend de dashboard |
| TD-003 workflow list ausente | Fase 1 / Fase 4 | `apps/web/app/(dashboard)/workflows/page.tsx`, `apps/web/lib/workflows.ts`, `apps/api/src/modules/workflows/router.ts` | resolvido | Criação de workflow ainda depende do editor ou API; não existe wizard de criação |
| TD-004 i18n / PT-BR inexistente | Fase 1 | `apps/web/lib/i18n.ts`, `apps/web/lib/i18n.server.ts`, `apps/web/providers/I18nProvider.tsx`, `apps/web/app/layout.tsx`, `apps/web/app/(dashboard)/dashboard/page.tsx`, `apps/web/app/(dashboard)/workflows/page.tsx` | resolvido | A preferencia de locale ainda nao e persistida por usuario/tenant; o fallback atual usa `Accept-Language` com baseline `pt-BR` |
| TD-005 integração falsa em CI | Fase 1 / Fase 5 | `.github/workflows/ci.yml` com `postgres`, `redis`, `pnpm db:bootstrap:ci` e lane `platform` | resolvido | A qualidade ainda depende de manutenção das seeds e das suítes integradas |
| TD-006 CSP em report-only | Fase 1 / Fase 3 | `apps/web/next.config.mjs`, `packages/config/src/web.config.ts`, `scripts/ci/check-web-inline-style-freeze.mjs`, `.github/workflows/ci.yml`, `apps/web/app/(dashboard)/dashboard/page.tsx`, `apps/web/app/(dashboard)/workflows/page.tsx` | mitigado | Produção ainda exige enforcement global, mas as superfícies canônicas do dashboard agora estão sem `style={{...}}` e congeladas em CI |
| TD-007 legado no repositório | Fase 1 | `apps/legacy/dashboard/*`, `scripts/ci/check-legacy-runtime-surface-freeze.mjs`, `scripts/legacy/block-legacy-entrypoint.mjs`, `package.json` | mitigado | O legado segue versionado, mas esta bloqueado como entrypoint default e congelado por guardrail de runtime |
| TD-008 consentimento LGPD sem auditoria | Fase 1 / Fase 3 | `packages/database/src/repositories/engagement.ts`, `apps/web/components/cookie-consent-banner.tsx`, `apps/web/app/(dashboard)/profile/notifications/page.tsx` | resolvido | O consentimento cobre analytics; revogação e taxonomia regulatória mais ampla seguem dependentes da Fase 3 |

## Leitura do estado atual
- O monorepo ja tinha backend real para dashboard, workflows, notificacoes e privacidade, mas faltavam duas entradas canonicas de UI: `/dashboard` e `/workflows`.
- A trilha de consentimento existia com persistencia em `user_preferences`, porem sem auditoria formal.
- O CI ja executa banco e Redis reais em GitHub Actions.
- O dominio materno-infantil agora esta materializado no schema Prisma, exposto em `apps/api/src/modules/clinical` e consumido na UI canonica em `apps/web/app/(dashboard)/patients`.
- O `apps/web` agora resolve locale por request, injeta dicionario via provider e aplica copy/formatação dependentes de locale na navegacao e nas paginas canonicas atacadas neste ciclo.
- O repositório ainda carrega `apps/legacy/dashboard`, mas a superficie esta em quarentena com bloqueio explicito de `dev:legacy` / `stack:hybrid` e freeze de runtime.

## Decisões arquiteturais
- Eleger `/dashboard` como landing canonica para a area autenticada, sem competir com a home publica em `/`.
- Eleger `/workflows` como inventário canonico de fluxos, reaproveitando a API real ja publicada em `/api/v1/workflows`.
- Auditar mudancas de consentimento no repositório de preferencias para garantir cobertura em qualquer chamada futura, nao apenas na rota atual.
- Resolver locale no servidor com base em `Accept-Language`, propagar a decisao via `I18nProvider` e centralizar copy/formatacao no `apps/web/lib/i18n.ts`.
- Reclassificar o legado como risco `mitigado`, e nao mais como aberto sem controle, porque a entrada default ja esta bloqueada por script e guardrail.
- Rebaixar o status geral para `YELLOW`, porque os bloqueadores estruturais atacados neste ciclo foram fechados e restaram apenas itens mitigados.

## Plano executável
- passo 1: criar home do dashboard usando os endpoints administrativos ja existentes
- passo 2: criar workflow list usando a listagem real de workflows
- passo 3: ajustar navegacao e fluxo pos-login para as rotas canonicas
- passo 4: adicionar auditoria de consentimento LGPD
- passo 5: materializar uma camada real de i18n no `apps/web`
- passo 6: revalidar dominio clinico e quarentena do legado no estado atual da branch
- passo 7: registrar rastreabilidade do ciclo com status e risco residual

## Arquivos impactados
- criar:
  - `apps/web/lib/dashboard.ts`
  - `apps/web/app/(dashboard)/dashboard/page.tsx`
  - `apps/web/app/(dashboard)/dashboard/loading.tsx`
  - `apps/web/app/(dashboard)/workflows/page.tsx`
  - `apps/web/app/(dashboard)/workflows/loading.tsx`
  - `apps/web/lib/i18n.server.ts`
  - `apps/web/providers/I18nProvider.tsx`
  - `apps/web/tests/dashboard-data.test.ts`
  - `apps/web/tests/workflows-list.test.ts`
  - `docs/execution/CICLO_F0_F1_RASTREABILIDADE_2026-04-07.md`
- alterar:
  - `apps/web/lib/i18n.ts`
  - `apps/web/app/layout.tsx`
  - `apps/web/providers/AppProviders.tsx`
  - `apps/web/components/cookie-consent-banner.tsx`
  - `apps/web/components/dashboard/page-fragments.tsx`
  - `apps/web/lib/workflows.ts`
  - `apps/web/components/layout/Navbar.tsx`
  - `apps/web/components/login-form.tsx`
  - `apps/web/tests/i18n.test.ts`
  - `packages/database/src/repositories/engagement.ts`
  - `packages/database/test/engagement.test.ts`
- remover:
  - nenhum

## Checklist de implementação
- [ ] migrations
- [ ] rotas de API novas
- [ ] serviços novos
- [x] validações
- [x] UI
- [x] loading/error/empty
- [x] testes
- [x] docs

## Validação
### Local
- [x] validação local concluída

### CI
- [ ] validação em CI concluída

### Staging
- [ ] validação em staging concluída

## Status
- [ ] RED
- [ ] BLUE
- [x] YELLOW
- [ ] GREEN

## Prompt
Você está executando um ciclo arquitetural do plano BirthHub 360.
Ataque apenas os itens listados neste ciclo.
Entregue:
A. Leitura do estado atual
B. Decisões arquiteturais
C. Plano executável do ciclo atual
D. Implementação
E. Validação
F. Status
