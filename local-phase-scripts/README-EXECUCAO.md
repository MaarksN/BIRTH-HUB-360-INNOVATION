# Scripts locais por fase — Auditoria de Dívidas Técnicas

Este pacote contém scripts PowerShell locais, sem IA e sem acesso remoto obrigatório, para executar as validações por fase do roadmap de remediação.

## Repositório padrão

`C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION`

Você pode alterar com `-RepoRoot`.

## Como executar uma fase

Abra PowerShell e rode:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
cd "CAMINHO\ONDE\VOCE\EXTRAIU\local-phase-scripts\scripts"

.\Run-Phase.ps1 -Phase 0 -RepoRoot "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION"
```

Também pode executar direto:

```powershell
.\phases\phase-00-security-critical.ps1 -RepoRoot "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION"
```

## Executar todas as fases

```powershell
.\Run-All-Phases.ps1 -RepoRoot "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION"
```

Para parar na primeira falha:

```powershell
.\Run-All-Phases.ps1 -RepoRoot "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION" -StopOnFail
```

## Onde ficam os relatórios

Por padrão:

```text
<RepoRoot>\artifacts\local-remediation\
```

Cada fase gera:

- `summary.md`
- `commands.log`
- `status.csv`
- logs individuais por step

## O que os scripts fazem

Eles executam checks locais e geram evidências. Não tentam corrigir código automaticamente.

Ferramentas opcionais como `gitleaks`, `trufflehog`, `semgrep`, `syft`, `grype`, `actionlint`, `zizmor`, `madge`, `jscpd`, `depcruise` e `lighthouse` são executadas apenas se estiverem instaladas. Se não estiverem, o step fica como `SKIP`.

## Fases incluídas

- Fase 00 — Segurança crítica e vazamento de dados
- Fase 01 — Multi-tenancy, RBAC e matriz de permissões
- Fase 02 — Banco, transações, idempotência e concorrência
- Fase 03 — Typecheck, lint, dead code e qualidade base
- Fase 04 — Testes críticos e coverage
- Fase 05 — Arquitetura e boundaries
- Fase 06 — Observabilidade e operação
- Fase 07 — Integrações, resiliência e filas
- Fase 08 — Agentes, IA e tool calling seguro
- Fase 09 — Frontend, UX, acessibilidade e i18n
- Fase 10 — Supply chain, CI/CD, release e documentação
- Fase 11 — Privacidade, LGPD e qualidade de dados
- Fase 12 — Developer experience e manutenção contínua

## Ordem recomendada

Comece por:

```powershell
.\Run-Phase.ps1 -Phase 0
.\Run-Phase.ps1 -Phase 1
.\Run-Phase.ps1 -Phase 2
.\Run-Phase.ps1 -Phase 3
.\Run-Phase.ps1 -Phase 4
```

Depois siga de 5 a 12.
