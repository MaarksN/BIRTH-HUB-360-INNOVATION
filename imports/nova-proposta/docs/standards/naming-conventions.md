# Monorepo Naming Conventions

## 1. Naming de Diretórios (Agentes)
- **Obrigatório**: `kebab-case`.
- Não utilizar `snake_case`, `PascalCase` ou nomes traduzidos.
- Exemplo correto: `boardprep-ai`, `pos-venda`.
- Exemplo incorreto: `BoardPrepAI`, `pos_venda`.

## 2. Naming de Arquivos
- Arquivos TypeScript padrão: `kebab-case.ts`.
- Componentes React: `PascalCase.tsx`.
- Padronização de sufixos de arquitetura limpa:
  - `*.service.ts`
  - `*.controller.ts`
  - `*.repository.ts`
  - `*.types.ts` ou `types.ts` agrupado na raiz do módulo.

## 3. Branches
- `feat/nome-da-feature`
- `fix/nome-do-bug`
- `refactor/nome-do-modulo`
- `chore/nome-da-tarefa`

## 4. Linting
O ESLint está configurado para inspecionar regras de casing em arquivos e limites de linhas. Utilize `pnpm lint` antes de submeter PRs.
