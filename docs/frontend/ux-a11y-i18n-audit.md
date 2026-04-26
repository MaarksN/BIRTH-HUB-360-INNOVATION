# Frontend UX, Accessibility And i18n Audit

## Gates

- `pnpm lint` deve passar para todas as superficies frontend.
- Fluxos E2E principais ficam em `tests/e2e/*.spec.ts`.
- Novas telas criticas precisam declarar loading, error e empty states.
- Inputs precisam de label programatico ou `aria-label`.
- Acoes destrutivas precisam confirmar recurso, tenant/organizacao e impacto.

## Checklist de tela critica

| Criterio | Evidencia esperada |
| --- | --- |
| Loading/error/empty | componente ou teste E2E |
| Feedback assincrono | toast, banner ou estado inline |
| Validacao de formulario | schema compartilhado ou validação tipada |
| Acessibilidade | labels, alt, foco visivel, contraste |
| Locale | moeda, data e timezone centralizados |
| i18n | texto isolado ou issue de migracao |

## Pendencias

Rodar axe/Lighthouse em browser real antes de declarar verde total para acessibilidade visual.
