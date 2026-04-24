# Dividas de Frontend, UX, Acessibilidade e I18n

## Frontend

Achados confirmados: `TD-008`, `TD-035`.  
Suspeitas: formularios e botoes em paginas clinicas/admin precisam de auditoria de acessibilidade e feedback async.

Evidencias:

- `apps/web/tests/i18n.test.ts:18` e `:56` falham contra dicionario atual.
- `apps/web/components/agents/chatbook-workspace.tsx` tem 1.380 linhas e concentra muitos handlers.
- Busca por JSX encontrou muitos `button`, `input`, `select`, `textarea`, `onClick` e alguns `aria-*`.

## UX verificavel no codigo

Achado principal: `TD-036`.  
`apps/web/app/admin/operations/executions/[id]/page.tsx:71` mostra botoes "Cancelar" e "Replay" lado a lado. Nao foi visto nesse trecho confirmacao modal, exigencia de motivo ou bloqueio contra duplo clique.

Risco: acao operacional destrutiva ou repetida por engano.

## Acessibilidade

Achado: `TD-037`.  
Trechos de formularios clinicos em `apps/web/app/(dashboard)/patients/[id]/page.parts.tsx` possuem muitos inputs/textarea/selects. A busca textual nao prova ausencia de label em todos os casos, por isso o status e verificacao manual necessaria.

Ferramentas recomendadas: `eslint-plugin-jsx-a11y`, axe, Lighthouse, Playwright accessibility snapshot e navegacao por teclado.

## Internacionalizacao

Achado: `TD-008`.  
O teste espera `Central de Operacao` e `Operations Hub`, mas o dicionario atual retorna `Revenue OS`. Isso pode ser mudanca intencional de marca, mas a suite esta quebrada e precisa ser alinhada.

Verificacoes adicionais recomendadas:

- extracao de strings hardcoded
- datas com `Intl` e timezone explicito
- moedas com locale
- mensagens de erro traduziveis

## Loading, error e empty states

Foram encontrados componentes com `aria-live`, toasts e erro de rota, o que e positivo. Ainda assim, nao houve execucao visual ou E2E para comprovar cobertura de todos os fluxos assicronos.

## Proximos passos

1. Corrigir/alinha teste i18n.
2. Rodar axe/Lighthouse no app local.
3. Criar testes de componente para ChatBook, admin operations e pacientes.
4. Confirmar modal/confirmacao para cancel/replay/delete.
5. Adicionar lint de strings hardcoded se i18n for requisito do produto.
