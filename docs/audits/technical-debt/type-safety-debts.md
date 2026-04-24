# Dividas de Type Safety

## Achados confirmados

- `TD-004` - typecheck global falha.
- `TD-005` - `strict:false`, `noImplicitAny:false`, `exactOptionalPropertyTypes:false`, `useUnknownInCatchVariables:false`.
- Buscas encontraram 198 ocorrencias de `any`, 18 `as any`, 171 `@ts-expect-error`, 11 `@ts-ignore`, 7 `Record<string, any>` e 211 `JSON.parse(`.

## Evidencias principais

- `tsconfig.base.json:9-12`.
- Erros tsc em `apps/worker/src/agents/runtime.*`, `apps/webhook-receiver/src/index.test.ts`, `packages/llm-client/src/index.test.ts`, `packages/queue/*`, scripts de release/security.
- `apps/worker/src/agents/runtime.orchestration.ts` e `runtime.tool-registry.ts` falham por `unknown` em JSON Prisma.

## Suspeitas e verificacoes manuais

- DTOs parecem usar Zod em varias areas, mas nao foi validado se todo endpoint converte input externo com schema runtime.
- `JSON.parse` precisa revisao por contexto para confirmar se ha schema posterior.
- `ts-expect-error` deve ter justificativa e expiracao.

## Risco

Tipagem permissiva reduz valor do contrato entre banco, API, frontend e agentes. Em areas multi-tenant e LGPD, isso aumenta chance de dados invalidos chegarem ao runtime.

## Recomendacoes

1. Fechar typecheck atual sem alterar regra de negocio.
2. Separar tsconfigs de prod/test/scripts para reduzir ruido.
3. Habilitar `strict` por pacote menos critico primeiro.
4. Proibir novo `any` sem comentario justificando.
5. Validar `JSON.parse` com Zod ou parser tipado.

## Testes recomendados

- `pnpm exec tsc -p tsconfig.json --noEmit --incremental false`
- lint para `no-explicit-any`, `ban-ts-comment` e typed JSON parse.
