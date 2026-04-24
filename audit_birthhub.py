import os
import re
import json
import subprocess
from pathlib import Path

ROOT = Path.cwd()

if not (ROOT / "package.json").exists():
    print("ERRO: Execute dentro do repositorio")
    exit()

try:
    DESKTOP = Path(os.path.join(os.environ["USERPROFILE"], "Desktop"))
except KeyError:
    DESKTOP = Path(os.path.join("/tmp", "Desktop"))

OUTPUT = DESKTOP / "BirthHub_Audit"
OUTPUT.mkdir(parents=True, exist_ok=True)

build_blockers = []
arch_debt = []
ops_debt = []
improvements = []

def run(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout + result.stderr
    except Exception as e:
        return str(e)

def scan():
    for path in ROOT.rglob("*.ts"):
        str_path = str(path).replace("\\", "/")
        if "node_modules" in str_path or ".next" in str_path or "dist" in str_path or "coverage" in str_path or "artifacts" in str_path or ".turbo" in str_path or ".git" in str_path:
            continue
        try:
            content = path.read_text(errors="ignore")

            if "/src/" in content:
                if "test" in str(path) or "tests" in str(path) or "__tests__" in str(path) or "autofix" in str(path) or "scripts/" in str(path):
                    continue
                arch_debt.append(f"{path} -> import de src")

            if "console.log" in content or "console.warn" in content or "console.error" in content:
                if "scripts/" not in str_path and "test" not in str_path and "tests" not in str_path:
                     ops_debt.append(f"{path} -> console statement")

        except OSError as exc:
            ops_debt.append(f"{path} -> erro ao ler arquivo: {exc}")

def packages():
    for pkg in ROOT.glob("packages/*"):
        pj = pkg / "package.json"
        if pj.exists():
            data = json.loads(pj.read_text())
            if "exports" not in data:
                arch_debt.append(f"{pkg} -> sem exports")
            if data.get("type") != "module":
                arch_debt.append(f"{pkg} -> nao ESM")

def checks():
    build = run("pnpm build")
    if "error" in build.lower():
        build_blockers.append("build falhou")

    typecheck = run("pnpm ci:task typecheck")
    if "error" in typecheck.lower():
        build_blockers.append("typecheck falhou")

    tests = run("pnpm test")
    if "fail" in tests.lower():
        build_blockers.append("testes falharam")

    (OUTPUT / "errors.log").write_text(build + typecheck + tests, encoding="utf-8")

def score():
    s = 100
    s -= len(build_blockers) * 10
    s -= len(arch_debt)
    s -= len(ops_debt)
    return max(s, 0)

def html(score):
    content = f"""
    <html><body style='background:#0f172a;color:white;font-family:Arial;padding:20px'>
    <h1>BirthHub Audit</h1>
    <h2>Score: {score}/100</h2>
    <h3>Bloqueadores de Build</h3><pre>{chr(10).join(build_blockers)}</pre>
    <h3>Dívida de Arquitetura</h3><pre>{chr(10).join(arch_debt)}</pre>
    <h3>Dívida Operacional</h3><pre>{chr(10).join(ops_debt)}</pre>
    <h3>Melhorias</h3>
    <pre>
- Observabilidade (OpenTelemetry)
- Circuit breaker
- Testes E2E
- Metricas SaaS
    </pre>
    </body></html>
    """
    (OUTPUT / "report.html").write_text(content, encoding="utf-8")

print("Rodando auditoria...")

scan()
packages()
checks()

s = score()
html(s)

(OUTPUT / "report.json").write_text(json.dumps({
    "build_blockers": build_blockers,
    "arch_debt": arch_debt,
    "ops_debt": ops_debt,
    "score": s
}, indent=2), encoding="utf-8")

print("Finalizado")
print(f"Score: {s}")
print(f"Relatorio em: {OUTPUT}")
