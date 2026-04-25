# Dívidas de Frontend, UX, Acessibilidade e i18n


### [TD-107] DÍVIDAS DE FRONTEND: Uso excessivo de useEffect
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Verificação manual necessária
- **Impacto:** Ciclos de renderização infinitos
- **Risco de não corrigir:** Baixa performance
- **Recomendação:** Revisar useEffect
- **Esforço:** M
- **Arquivo/Linha:** `apps/web`
- **Evidência/Como detectado:** Não medido por script simples
- **Correção sugerida:** Usar hooks do React Query/SWR
- **Testes recomendados:** E2E

### [TD-108] DÍVIDAS DE ACESSIBILIDADE: Falta de alt em imagens
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Verificação manual necessária
- **Impacto:** Dificulta leitores de tela
- **Risco de não corrigir:** Violação de a11y
- **Recomendação:** Rodar axe-core/eslint-plugin-jsx-a11y
- **Esforço:** P
- **Arquivo/Linha:** `apps/web`
- **Evidência/Como detectado:** Axe não rodado
- **Correção sugerida:** Adicionar alt tag
- **Testes recomendados:** Testes a11y

### [TD-109] DÍVIDAS DE INTERNACIONALIZAÇÃO: Textos hardcoded
- **Severidade:** BAIXO
- **Prioridade:** P3 baixa
- **Status:** Verificação manual necessária
- **Impacto:** Difícil traduzir no futuro
- **Risco de não corrigir:** Retrabalho
- **Recomendação:** Usar react-i18next
- **Esforço:** M
- **Arquivo/Linha:** `apps/web`
- **Evidência/Como detectado:** Strings pt-BR pelo código
- **Correção sugerida:** Mover strings para locai
- **Testes recomendados:** N/A

### [TD-113] DÍVIDAS DE PRODUTO/UX VERIFICÁVEIS NO CÓDIGO: Falta de toast feedback
- **Severidade:** BAIXO
- **Prioridade:** P3 baixa
- **Status:** Verificação manual necessária
- **Impacto:** Usuário não sabe se salvou
- **Risco de não corrigir:** Frustração
- **Recomendação:** Adicionar react-hot-toast
- **Esforço:** P
- **Arquivo/Linha:** `apps/web`
- **Evidência/Como detectado:** N/A
- **Correção sugerida:** Toast onSuccess
- **Testes recomendados:** E2E
