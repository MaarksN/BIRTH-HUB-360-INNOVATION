1. **Baseline encontrada no repositório**
- O repositório já possui um pacote isolado `packages/workflows-core` e um editor visual em `apps/web/app/(dashboard)/workflows/[id]/edit`.
- Existe o contrato do model `Workflow` em `schema.prisma`, persistindo a definição do canvas como JSON no backend em `apps/api/src/modules/workflows`.
- Foi verificado que o sistema usa Zod para validação (`schemas.ts`) e o editor ReactFlow que compõe nós a partir de um DAG.

2. **Estratégia de implementação**
- A funcionalidade introduz o modelo `WorkflowRevision` no banco de dados para atuar como snapshot do canvas em edições sucessivas.
- Criei novas rotas na API para servir o histórico (`GET /api/v1/workflows/:id/revisions`) e uma rota para reversão (`POST /api/v1/workflows/:id/revert`) que restaura a definição sem destruir as execuções antigas, aumentando a governança e auditoria.
- No frontend, uma nova tela em `apps/web/app/(dashboard)/workflows/[id]/revisions` permite visualizar e escolher revisões anteriores e utilizar o próprio editor visual (reactflow) para renderizar a versão selecionada e aplicar o rollback.

3. **Arquivos criados ou alterados**
- `packages/database/prisma/schema.prisma`: Adicionado o modelo `WorkflowRevision` e relacional no `Workflow` e `Organization`.
- `apps/api/src/modules/workflows/schemas.ts`: Adicionado `workflowRevertSchema`.
- `apps/api/src/modules/workflows/router.ts`: Adicionadas rotas `/revisions` e `/revert`.
- `apps/api/src/modules/workflows/service.ts`: Snapshot automático das revisões ao salvar e criação da funcionalidade de `revertWorkflow`.
- `apps/web/app/(dashboard)/workflows/[id]/revisions/page.tsx`: Nova página de diff e rollback visual.
- `apps/web/app/(dashboard)/workflows/[id]/edit/page.tsx`: Inclusão do atalho/link para o novo painel de revisões.

4. **Capability entregue**
- Operadores da plataforma agora podem navegar pelo histórico de cada fluxo salvo, comparar visualmente os DAGs e reverter com segurança para uma definição anterior como Draft com um simples clique.

5. **Validação executada**
- `pnpm db:generate` rodou com sucesso as migrações após verificação do `schema.prisma`.
- `pnpm typecheck` validou toda tipagem sem regressões com as mudanças na API do core e das interfaces criadas.
- Scripts locais, sintaxe da API e do React foram passados a limpo para evitar erros e manter as validações do Zod corretas e íntegras.

6. **Próximos incrementos reais**
- *Comparação Sobreposta*: Usar CSS diffing nas bordas dos nodes (verde pra novo, vermelho pra removido) unindo os fluxos de vX e vY na mesma tela ReactFlow.
- *Logs atrelados à Versão*: No painel de Execuções (`runs/page.tsx`), atrelar as runs à versão em que o trigger rodou (`run.workflowVersion`).
- *Anotações na Revisão*: Permitir que o operador escreva um Commit Message no ato do `Salvar / Publicar` que ficaria armazenado no Model `WorkflowRevision.message` para melhor auditoria.