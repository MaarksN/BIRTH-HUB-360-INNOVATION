# Cycle 7 Reproducibility Review

## Resultado executivo

Status final de reprodutibilidade: **NÃO REPRODUZÍVEL PARA RELEASE LIMPO**

O workspace consegue reproduzir partes do empacotamento, mas não consegue reconstruir o lane de go-live de ponta a ponta em estado verde.

## Ambiente observado

| Item | Evidência | Resultado |
| --- | --- | --- |
| Node do host | `node -v` -> `v25.9.0` | Fora do engine declarado |
| Engine declarada | `package.json:6-8` -> `>=24 <25` | Exige Node 24 |
| Pin de runtime | `.nvmrc` -> `24.14.0` | Compatível |
| Toolchain portátil | `.tools/node-v24.14.0-win-x64/` | Disponível e usado nesta auditoria |

Leitura objetiva:

- O shell padrão do host já nasce fora da versão suportada.
- A reprodução exigiu troca explícita para o Node portátil `24.14.0`.
- Isso é um gap real entre "abre localmente" e "reproduz o release com o toolchain certo".

## Comandos executados

| Comando | Resultado | Evidência resumida |
| --- | --- | --- |
| `pnpm typecheck` | FAIL | bloqueado por `ts-directives-guard`; centenas de `@ts-nocheck` proibidos |
| `pnpm lint` | FAIL | `lint-policy.mjs` aborta com `EPERM` ao varrer `.pytest_cache` |
| `pnpm build` | FAIL | `packages/agents-core` falha em TypeScript (`TS2322`, `TS2571`) |
| `pnpm workspace:audit` | PASS | contrato de workspace e script-compliance ok |
| `pnpm monorepo:doctor` | PASS | sem achados críticos no core canônico |
| `pnpm release:scorecard` | FAIL | score `70/100`; dead-code regression + backup + DR |
| `scripts/release/preflight-env.ts --target=staging --env-file=ops/release/sealed/.env.staging.sealed` | PASS | config selada coerente |
| `scripts/release/preflight-env.ts --target=production --env-file=ops/release/sealed/.env.production.sealed` | PASS | config selada coerente |
| `pnpm release:bundle` | PASS | SBOM + materialização de release executaram |
| `scripts/release/verify-release-evidence.ts --target=production --stage=all` | PASS | validação apenas estrutural |

## Achados de reprodutibilidade

### 1. `typecheck` não é reproduzível em verde

Evidência:

- `pnpm typecheck` falhou em `scripts/ci/ts-directives-guard.mjs`.
- O guard proíbe qualquer `@ts-nocheck` em arquivos rastreados (`scripts/ci/ts-directives-guard.mjs:28-68`).
- A execução retornou uma lista massiva de violações em `apps/api`, `apps/web`, `apps/worker`, `packages/*`, `scripts/*` e `tests/*`.

Implicação:

- O gate de tipagem do release não está verde.
- Não existe base honesta para afirmar "release reproduzível" com essa política ativa.

### 2. `lint` falha por fragilidade do próprio script de governança

Evidência:

- `pnpm lint` falhou antes de chegar ao lint do core.
- `scripts/ci/lint-policy.mjs:11-43` ignora alguns diretórios, mas não ignora `.pytest_cache`.
- A execução falhou com `EPERM` em `C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\.pytest_cache`.

Implicação:

- O lane de lint não é resiliente ao estado real do workspace.
- O resultado depende de permissão do filesystem e não apenas do código rastreado.

### 3. `build` não fecha o lane do core

Evidência:

- `pnpm build` passou por `db:generate`, mas falhou em `build:core`.
- O pacote que derrubou a execução foi `packages/agents-core`.
- Erros observados:
  - `TS2322` em `src/__tests__/manifest-runtime-intelligence.test.ts`
  - `TS2571` em `src/__tests__/manifest-runtime-intelligence.test.ts`

Implicação:

- O repositório não consegue ser reconstruído em estado verde no lane de build exigido para release.

### 4. Há divergência entre "reprodução histórica" e "reprodução atual"

Evidência:

- `audit/reproduction_matrix.md:3-16` e `artifacts/release/cycle0-flow-summary.json` retratam um histórico antigo de reprodução bem-sucedida.
- O `cycle0-flow-summary.json` ainda marca `status: passed` em `2026-03-30`.
- Na auditoria atual, `pnpm build` falhou em `2026-04-11`.

Implicação:

- O repositório preserva evidência histórica de um lane que já não se reproduz no HEAD atual.
- Isso reduz confiabilidade de qualquer parecer baseado apenas em artefatos antigos.

### 5. O pacote de release é parcialmente reproduzível, mas o release inteiro não

Evidência:

- `pnpm release:bundle` passou e regenerou:
  - `artifacts/sbom/bom.xml`
  - `artifacts/sbom/sbom.spdx.json`
  - `artifacts/release/release-artifact-catalog.json`
  - `releases/manifests/release_artifact_catalog.md`
  - `releases/notes/v1.0.0.md`
- Mesmo após a rematerialização, o manifesto `artifacts/release/checksums-manifest.sha256` continuou inválido para si mesmo.

Implicação:

- É possível empacotar artefatos.
- Não é possível chamar isso de "release reproduzível" enquanto o manifesto de integridade permanece estruturalmente quebrado e o lane de build segue vermelho.

## Gaps entre "compila localmente" e "release reproduzível"

- O host padrão está em Node `25.9.0`, fora do contrato declarado.
- O build do core falha no HEAD auditado.
- O lint policy depende do estado/permissão do workspace.
- O typecheck policy reprova o repositório em massa.
- O scorecard operacional continua vermelho.
- O pacote local não recebe `source-manifest.json`, então o bundle local não fica preso a um commit imutável.

## Conclusão

O estado atual demonstra:

- **empacotamento parcial reproduzível**
- **release completo não reproduzível**

Parecer deste bloco: **o projeto ainda não atende ao padrão de release limpo e reprodutível**.

