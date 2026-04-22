# Mutation Report

- Generated at: 2026-04-11T16:43:32.338Z
- Source artifact: `artifacts\stryker\mutation.json`
- Source artifact updated at: 2026-04-09T18:29:02.571Z
- HTML report: `artifacts\stryker\mutation.html`
- Thresholds: break=60, low=70, high=80
- Overall score: 60.85% (PASS)
- Mutants: total=470, detected=286, survived=184, timeout=1

## Focused Scope

- `packages/auth/index.ts`
- `packages/agents-core/src/manifest/catalog.ts`
- `packages/agents-core/src/manifest/parser.ts`
- `packages/agents-core/src/parser/manifestParser.ts`
- `packages/agents-core/src/schemas/manifest.schema.ts`
- `packages/agents-core/src/tools/slack.tool.ts`

## File Scores

| file | score | total | detected | survived | timeout |
| --- | ---: | ---: | ---: | ---: | ---: |
| `packages/agents-core/src/parser/manifestParser.ts` | 27.71% | 83 | 23 | 60 | 1 |
| `packages/agents-core/src/schemas/manifest.schema.ts` | 46% | 50 | 23 | 27 | 0 |
| `packages/agents-core/src/manifest/parser.ts` | 60.53% | 38 | 23 | 15 | 0 |
| `packages/agents-core/src/manifest/catalog.ts` | 62.5% | 200 | 125 | 75 | 0 |
| `packages/agents-core/src/tools/slack.tool.ts` | 92.31% | 52 | 48 | 4 | 0 |
| `packages/auth/index.ts` | 93.62% | 47 | 44 | 3 | 0 |

## Hotspots

- `packages/agents-core/src/parser/manifestParser.ts`: 27.71% com 60 mutantes sobreviventes e 1 timeout.
- `packages/agents-core/src/schemas/manifest.schema.ts`: 46% com 27 mutantes sobreviventes.
