# @birthub/auth

Pacote legado mantido apenas por compatibilidade historica e testes isolados.

## Status

- Nao faz parte do runtime canonico do produto.
- Nao deve ser importado por `apps/web`, `apps/api`, `apps/worker` ou `packages/database`.
- A implementacao oficial de sessao e refresh token do runtime vive em `apps/api/src/modules/auth/auth.service.sessions.ts`.

## Regra operacional

Se um fluxo novo precisar de auth de runtime, ele deve integrar com a estrategia DB-backed do `apps/api`, e nao com este pacote.

## Guardrail

- Scanner automatizado: `pnpm security:auth-boundary`
- Politica de referencia: `docs/F0/diagnostico-operacional-baseline-2026-04-07.md`
