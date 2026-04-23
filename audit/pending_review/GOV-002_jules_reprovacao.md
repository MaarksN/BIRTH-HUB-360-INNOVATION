# Reprovação Jules — GOV-002
Data: 2026-03-20

## O que foi verificado
- A ausência de marcadores de rascunho e preenchimentos genéricos ("token-rascunho", "token-rascunho", "[campo-rascunho]", "campo-rascunho") em 100% dos arquivos de `./audit/pending_review/`.

## O que está faltando ou errado
- Múltiplos arquivos (ex.: `D-001_codex.md`, `D-002_codex.md`, `GAP-001_codex.md`, `GAP-002_codex.md`, `GAP-003_codex.md`, `GAP-004_codex.md`, `GAP-SEC-001_codex.md`, etc) violam a regra Anti-Drift ao possuir marcadores de rascunho.
- Esses arquivos não refletem verdadeiramente evidências prontas e finalizadas.

## Critério para aprovação
- NENHUM arquivo no diretório de `pending_review` pode conter palavras marcador de rascunho. O loop de verificação `grep -i 'marcador de rascunho\|token-rascunho\|\[FILL\]\|campo-rascunho'` deve retornar vazio para todos.

## Evidência esperada
- A execução de varredura atestando 0 marcadores de rascunho em todos os `.md`.
