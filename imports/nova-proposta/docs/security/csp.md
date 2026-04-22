# Content Security Policy (CSP) Base

A política de CSP para a aplicação Web (Next.js) deve restringir severamente o carregamento de recursos de origens desconhecidas.

A string de diretivas padrão deve ser:
`default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:;`

## Estado atual

- `apps/web/next.config.mjs` continua com `style-src 'unsafe-inline'` e `script-src 'unsafe-inline'` enquanto o hardening completo do front-end nao termina.
- As superfícies canônicas atacadas no ciclo atual (`/dashboard`, `/workflows`, `Navbar` e `cookie-consent-banner`) foram limpas de `style={{...}}`.
- Novas regressões nessas superfícies agora são bloqueadas por `scripts/ci/check-web-inline-style-freeze.mjs`, exposto em `pnpm ci:web-inline-style-freeze` e executado no workflow de CI.

## Estratégia de endurecimento

1. Remover inline styles das superfícies canônicas mais críticas.
2. Congelar essas superfícies em CI para impedir regressão.
3. Repetir a mesma abordagem por ondas nas demais rotas do `apps/web`.
4. Só então remover `'unsafe-inline'` de `style-src` no header global.
