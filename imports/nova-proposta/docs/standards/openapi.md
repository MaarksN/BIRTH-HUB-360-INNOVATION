# Documentação OpenAPI/Swagger

A spec publicada em `apps/api/src/docs/openapi.ts` representa a baseline da business API montada no runtime canônico.

Regras de governança:
- Somente superfícies `mounted` da API de negócio entram automaticamente na spec publicada.
- Superfícies `compat-only`, `parked` e `operational-only` não devem ser promovidas ao OpenAPI canônico por padrão.
- Quando existir alias de compatibilidade, o path canônico deve ser a fonte principal de verdade; aliases só entram na spec se forem contratos públicos deliberados.
- A cobertura pode evoluir incrementalmente, mas o que estiver publicado em `/api/openapi.json` deve sempre refletir o runtime real montado.

Toda rota publicada na spec deve obrigatoriamente possuir:
- Sumário explicativo.
- Descrição clara das respostas de sucesso com schemas tipados e revisáveis.
- Descrição dos possíveis erros de cliente relevantes ao endpoint.
- Descrição para erros de servidor formatados segundo o contrato RFC 7807/Problem Details adotado pela API.
