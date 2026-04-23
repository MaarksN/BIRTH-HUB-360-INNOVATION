from __future__ import annotations

import html
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = Path.home() / "Desktop" / "20 DIVIDAS TECNICAS"
LOG_FILE = OUTPUT_DIR / "execution-log.txt"
TIMESTAMP = datetime.now()

SKIP_PARTS = {
    ".git",
    "node_modules",
    ".next",
    ".turbo",
    "dist",
    "build",
    "coverage",
    "artifacts",
    ".ops",
    ".gha-diagnostico",
    "audit",
}
CODE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".prisma", ".css", ".scss", ".json", ".md", ".yaml", ".yml"}
TENANT_KEYS = ("tenantId", "organizationId", "companyId", "workspaceId", "clinicId")
CRITICAL_MODELS = ("Lead", "Contact", "Company", "Deal", "Pipeline", "Stage", "Activity", "Subscription", "Invoice", "AuditLog")
PII_TERMS = ("cpf", "rg", "email", "phone", "telefone", "address", "endereco", "birthday", "birth", "nascimento", "health", "saude", "medical", "patient")
PROMPT_KINDS = ("gemini", "codex", "antigravity", "powershell")


@dataclass
class Item:
    file: str
    line: int | None
    description: str
    risk: str
    context: str


@dataclass
class Category:
    code: str
    slug: str
    title: str
    severity: str


@dataclass
class PrismaModel:
    name: str
    start: int
    end: int
    body: str


def run(cmd: list[str], timeout: int = 30) -> tuple[int, str]:
    try:
        result = subprocess.run(
            cmd,
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=timeout,
            check=False,
        )
        return result.returncode, (result.stdout or result.stderr).strip()
    except FileNotFoundError:
        if sys.platform.startswith("win"):
            try:
                result = subprocess.run(
                    ["cmd", "/c", *cmd],
                    cwd=ROOT,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    timeout=timeout,
                    check=False,
                )
                return result.returncode, (result.stdout or result.stderr).strip()
            except Exception as exc:  # noqa: BLE001
                return 127, f"Falha ao executar fallback Windows para {' '.join(cmd)}: {exc}"
        return 127, f"Comando indisponível no ambiente: {' '.join(cmd)}"
    except subprocess.TimeoutExpired as exc:
        output = (exc.stdout or exc.stderr or "").strip()
        return 124, output or f"Timeout executando: {' '.join(cmd)}"


def tracked_files() -> list[Path]:
    code, output = run(["git", "ls-files"], timeout=15)
    if code != 0:
        raise RuntimeError(output or "Falha ao listar arquivos com git ls-files")

    other_code, other_output = run(["git", "ls-files", "--others", "--exclude-standard"], timeout=15)
    working_tree_output = output
    if other_code == 0 and other_output:
        working_tree_output = f"{output}\n{other_output}"

    raw_paths = list(
        dict.fromkeys(Path(line.strip()) for line in working_tree_output.splitlines() if line.strip())
    )
    raw_set = {str(p).replace("\\", "/") for p in raw_paths}
    files: list[Path] = []

    for path in raw_paths:
        text_path = str(path).replace("\\", "/")
        if path.suffix not in CODE_EXTS:
            continue
        if any(part in SKIP_PARTS for part in path.parts):
            continue
        if text_path.endswith(".bak") or text_path.endswith(".d.ts") or text_path.endswith(".map"):
            continue
        if path.suffix == ".js":
            if f"{text_path[:-3]}.ts" in raw_set or f"{text_path[:-3]}.tsx" in raw_set:
                continue
        files.append(path)
    return files


FILES = tracked_files()
FILE_SET = {str(path).replace("\\", "/") for path in FILES}
TEXT_CACHE: dict[str, str] = {}


def rel(path: Path) -> str:
    return str(path).replace("\\", "/")


def is_test_file(path: Path) -> bool:
    text = rel(path).lower()
    return any(part in text for part in ("/test/", "/tests/", "__tests__", ".spec.", ".test.", "/fixtures/", "/mocks/"))


def read_text(path: Path) -> str:
    key = rel(path)
    if key in TEXT_CACHE:
        return TEXT_CACHE[key]

    full = ROOT / path
    try:
        content = full.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        content = full.read_text(encoding="utf-8", errors="replace")
    TEXT_CACHE[key] = content
    return content


def lines(path: Path) -> list[str]:
    return read_text(path).splitlines()


def snippet(path: Path, line: int | None = None, radius: int = 2, max_lines: int = 14) -> str:
    content_lines = lines(path)
    if not content_lines:
        return ""
    if line is None:
        start = 1
        end = min(len(content_lines), max_lines)
    else:
        start = max(1, line - radius)
        end = min(len(content_lines), line + radius)
    return "\n".join(f"{idx}: {content_lines[idx - 1]}" for idx in range(start, end + 1))


def add(items: list[Item], path: Path, line: int | None, description: str, risk: str, context: str | None = None) -> None:
    fallback_context = context
    if fallback_context is None:
        full = ROOT / path
        fallback_context = snippet(path, line) if full.exists() and full.is_file() else f"Referência: {rel(path)}"
    items.append(
        Item(
            file=rel(path),
            line=line,
            description=description,
            risk=risk,
            context=fallback_context,
        )
    )


def find_matches(pattern: str, *, files: list[Path] | None = None, flags: int = 0, include_tests: bool = False) -> list[tuple[Path, int, str]]:
    regex = re.compile(pattern, flags)
    hits: list[tuple[Path, int, str]] = []
    candidates = files or FILES
    for path in candidates:
        if not include_tests and is_test_file(path):
            continue
        for index, line_text in enumerate(lines(path), start=1):
            if regex.search(line_text):
                hits.append((path, index, line_text))
    return hits


def parse_prisma_models() -> list[PrismaModel]:
    models: list[PrismaModel] = []
    for path in [file for file in FILES if file.name == "schema.prisma"]:
        content = read_text(path)
        blocks = re.finditer(r"^model\s+(\w+)\s+\{", content, re.MULTILINE)
        for match in blocks:
            name = match.group(1)
            start_line = content[: match.start()].count("\n") + 1
            cursor = match.end()
            depth = 1
            while cursor < len(content) and depth:
                if content[cursor] == "{":
                    depth += 1
                elif content[cursor] == "}":
                    depth -= 1
                cursor += 1
            body = content[match.start() : cursor]
            end_line = content[:cursor].count("\n") + 1
            models.append(PrismaModel(name=name, start=start_line, end=end_line, body=body))
    return models


PRISMA_MODELS = parse_prisma_models()
SCHEMA_PATH = next((file for file in FILES if file.name == "schema.prisma"), None)
PACKAGE_JSONS = [file for file in FILES if file.name == "package.json"]
ROUTE_FILES = [file for file in FILES if re.search(r"(router|routes|controller)\.(ts|tsx|mjs|js)$", file.name) and not is_test_file(file)]
SERVICE_FILES = [file for file in FILES if "service" in file.stem.lower() and not is_test_file(file)]
SOURCE_FILES = [file for file in FILES if file.suffix in {".ts", ".tsx", ".py", ".mjs", ".cjs", ".js", ".jsx"} and not is_test_file(file)]
STYLE_FILES = [file for file in FILES if file.suffix in {".css", ".scss", ".tsx", ".jsx"} and not is_test_file(file)]


def grep_any(needle: str, files: list[Path] | None = None, flags: int = re.IGNORECASE) -> bool:
    pattern = re.compile(needle, flags)
    for path in files or FILES:
        if pattern.search(read_text(path)):
            return True
    return False


def audit_multitenancy() -> list[Item]:
    items: list[Item] = []
    tenant_middleware = [file for file in FILES if "tenant" in file.name.lower() and ("middleware" in file.name.lower() or "context" in file.name.lower() or "guard" in file.name.lower())]
    if not tenant_middleware:
        add(items, Path("packages/database/prisma/schema.prisma"), None, "Nenhum middleware/guard/contexto global de tenant foi localizado no repositório.", "CRÍTICO", "Ausência de arquivos tenant middleware/guard.")

    for model in PRISMA_MODELS:
        if any(key in model.body for key in TENANT_KEYS):
            continue
        if model.name in {"Plan"}:
            continue
        if "Organization" in model.body or model.name in {"Membership", "Session", "ApiKey", "AuditLog", "QuotaUsage", "Subscription", "Invoice", "UsageRecord", "BillingEvent", "CrmSyncEvent", "ConnectorAccount"}:
            add(items, SCHEMA_PATH or Path("packages/database/prisma/schema.prisma"), model.start, f"Model Prisma `{model.name}` sem chave explícita de tenant.", "CRÍTICO", model.body.strip())

    query_regex = re.compile(r"prisma\.\w+\.(findMany|findFirst|findUnique|findUniqueOrThrow|count|aggregate|updateMany|deleteMany)\s*\(")
    for path in SERVICE_FILES:
        block_lines = lines(path)
        for idx, line_text in enumerate(block_lines, start=1):
            if not query_regex.search(line_text):
                continue
            window = "\n".join(block_lines[idx - 1 : min(len(block_lines), idx + 8)])
            if not any(key in window for key in TENANT_KEYS):
                add(items, path, idx, "Query Prisma sem filtro explícito de tenant/organization/company no bloco analisado.", "CRÍTICO", window)
    return items


def audit_secrets() -> list[Item]:
    items: list[Item] = []
    secret_rx = r"(?i)(api[_-]?key|password|secret|token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{10,}['\"]"
    jwt_rx = r"eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+"
    for path, line_no, _ in find_matches(secret_rx, files=SOURCE_FILES):
        add(items, path, line_no, "Possível segredo hardcoded em código-fonte.", "CRÍTICO")
    for path, line_no, _ in find_matches(jwt_rx, files=SOURCE_FILES):
        add(items, path, line_no, "Possível token JWT literal fora de arquivo de ambiente.", "CRÍTICO")

    gitignore = ROOT / ".gitignore"
    if not gitignore.exists() or ".env" not in gitignore.read_text(encoding="utf-8", errors="replace"):
        add(items, Path(".gitignore"), None, "`.env` não está protegido de forma explícita no `.gitignore`.", "CRÍTICO", (gitignore.read_text(encoding="utf-8", errors="replace") if gitignore.exists() else ".gitignore ausente"))

    for needle in ("api_key", "password"):
        code, output = run(["git", "log", "--all", "-S", needle, "--oneline", "-n", "10"], timeout=20)
        if output:
            add(items, Path(".git"), None, f"Histórico git contém ocorrências pesquisáveis por `{needle}`.", "ALTO", output)
    return items


def audit_sync_blocking() -> list[Item]:
    items: list[Item] = []
    sync_rx = r"\b(readFileSync|writeFileSync|appendFileSync|execSync|spawnSync|execFileSync)\b"
    json_rx = r"(JSON\.parse\s*\(\s*.*readFileSync|require\s*\(\s*['\"].+\.json['\"]\s*\))"
    py_rx = r"\brequests\.(get|post|put|patch|delete)\s*\("
    for path, line_no, _ in find_matches(sync_rx, files=SOURCE_FILES):
        add(items, path, line_no, "Operação síncrona bloqueante em código de produção.", "ALTO")
    for path, line_no, _ in find_matches(json_rx, files=SOURCE_FILES):
        add(items, path, line_no, "Leitura/import síncrono de JSON em runtime.", "ALTO")
    for path, line_no, _ in find_matches(py_rx, files=[file for file in SOURCE_FILES if file.suffix == ".py"]):
        add(items, path, line_no, "Request HTTP síncrono via `requests` em código Python.", "ALTO")
    return items


def audit_billing() -> list[Item]:
    items: list[Item] = []
    billing_text = "\n".join(read_text(file) for file in PACKAGE_JSONS)
    if not re.search(r"stripe|asaas|pagarme|pagar\.me|iugu|mercadopago", billing_text, re.IGNORECASE):
        add(items, Path("package.json"), None, "Nenhum SDK de gateway de pagamento brasileiro/internacional foi encontrado nos package.json do monorepo.", "ALTO", billing_text[:600])
    schema_text = read_text(SCHEMA_PATH) if SCHEMA_PATH else ""
    if not re.search(r"Subscription|Invoice|PaymentMethod|BillingEvent|Plan", schema_text):
        add(items, SCHEMA_PATH or Path("packages/database/prisma/schema.prisma"), None, "Schema Prisma sem modelos centrais de billing.", "ALTO", schema_text[:800])
    if not any("webhook" in rel(file).lower() and ("stripe" in rel(file).lower() or "payment" in rel(file).lower()) for file in FILES):
        add(items, Path("apps/api/src/modules/webhooks"), None, "Nenhum handler de webhook de pagamento foi localizado.", "ALTO", "Busca por arquivos *webhook*/*payment* sem resultados.")
    if not grep_any(r"\b(PlanGuard|SubscriptionGuard|BillingGuard)\b", SOURCE_FILES):
        add(items, Path("apps/api/src/modules/billing"), None, "Nenhum guard dedicado a plano/subscription foi localizado nas rotas premium.", "ALTO", "Busca por PlanGuard/SubscriptionGuard/BillingGuard sem resultados.")
    if not grep_any(r"\bbilling portal\b|portalUrl|/portal\b", ROUTE_FILES):
        add(items, Path("apps/api/src/modules/billing"), None, "Nenhum endpoint explícito de portal de faturamento foi localizado.", "MÉDIO", "Busca por portal de billing sem resultados.")
    return items


def audit_metering() -> list[Item]:
    items: list[Item] = []
    if SCHEMA_PATH and not re.search(r"Usage(Event|Quota)|UsageRecord|QuotaUsage|metering|quota", read_text(SCHEMA_PATH), re.IGNORECASE):
        add(items, SCHEMA_PATH, None, "Schema Prisma sem modelo claro de metering/quota por tenant.", "ALTO")
    ai_rx = re.compile(r"(messages\.create|anthropic\.|chat\.completions|responses\.create|openai\.)")
    for path in SOURCE_FILES:
        block_lines = lines(path)
        for idx, line_text in enumerate(block_lines, start=1):
            if not ai_rx.search(line_text):
                continue
            window = "\n".join(block_lines[max(0, idx - 3) : min(len(block_lines), idx + 5)])
            if not re.search(r"usage|token|metering|quota|recordUsage|track", window, re.IGNORECASE):
                add(items, path, idx, "Chamada a IA sem evidência próxima de tracking de consumo/tokens.", "ALTO", window)
    if not grep_any(r"/usage|/consumption|quota|metering", ROUTE_FILES):
        add(items, Path("apps/api/src/modules"), None, "Nenhum endpoint claro de dashboard de consumo/quota foi localizado.", "ALTO", "Busca por usage/consumption/quota nas rotas sem resultados.")
    if not grep_any(r"cron|schedule", SOURCE_FILES) or not grep_any(r"quota|usage|reset", SOURCE_FILES):
        add(items, Path("scripts"), None, "Job de reset periódico de quotas não foi identificado com clareza.", "MÉDIO", "Busca por cron/schedule + quota/reset sem correspondência suficiente.")
    if not grep_any(r"quota exceeded|LimitExceeded|QuotaExceeded|usage limit", SOURCE_FILES):
        add(items, Path("apps/api/src/modules"), None, "Não foi encontrada proteção explícita para bloqueio por quota excedida.", "ALTO", "Busca por exceções/guards de quota excedida sem resultados.")
    return items


def audit_crm_sync() -> list[Item]:
    items: list[Item] = []
    packages_text = "\n".join(read_text(file) for file in PACKAGE_JSONS)
    if not re.search(r"hubspot|rdstation|salesforce|pipedrive|agendor", packages_text, re.IGNORECASE):
        add(items, Path("package.json"), None, "Nenhum SDK de CRM conhecido foi encontrado nos package.json.", "ALTO", packages_text[:600])
    if not any("crm" in part.lower() for file in FILES for part in file.parts):
        add(items, Path("apps/api/src/modules"), None, "Nenhum módulo/pasta dedicada a CRM foi localizada.", "ALTO", "Busca por diretórios `crm` sem resultados.")
    schema_text = read_text(SCHEMA_PATH) if SCHEMA_PATH else ""
    if not re.search(r"ConnectorAccount|ConnectorCredential|CrmSyncEvent|Integration|OAuthToken", schema_text):
        add(items, SCHEMA_PATH or Path("packages/database/prisma/schema.prisma"), None, "Schema sem modelo suficiente para credenciais/sync de CRM por tenant.", "ALTO", schema_text[:800])
    if not grep_any(r"hubspot.*webhook|crm.*webhook|pipedrive", ROUTE_FILES):
        add(items, Path("apps/api/src/modules"), None, "Nenhum receiver de webhook de CRM foi identificado.", "ALTO", "Busca por webhook de CRM sem resultados.")
    if not grep_any(r"deal|contact|company", SOURCE_FILES) or not grep_any(r"sync", SOURCE_FILES):
        add(items, Path("packages/integrations/src"), None, "Sync bidirecional de contatos/deals com CRM não ficou evidenciado no codebase.", "MÉDIO", "Busca textual por sync de deal/contact/company insuficiente.")
    return items


def audit_coupling() -> list[Item]:
    items: list[Item] = []
    for path in SOURCE_FILES:
        count = len(lines(path))
        if count > 400:
            add(items, path, None, f"Arquivo com {count} linhas, acima do limite de 400 linhas.", "ALTO", snippet(path, 1, radius=0, max_lines=20))
    for path, line_no, _ in find_matches(r"\bprisma\.", files=ROUTE_FILES):
        add(items, path, line_no, "Arquivo de rota/controller com acesso direto a banco, sugerindo lógica de negócio acoplada à camada HTTP.", "ALTO")
    export_graph: dict[str, set[str]] = {}
    for path in [file for file in SOURCE_FILES if file.suffix in {".ts", ".tsx"}]:
        imports: set[str] = set()
        current = path.parent
        for _, _, line_text in find_matches(r"from\s+['\"](\./|\.\./)[^'\"]+['\"]", files=[path], include_tests=True):
            target = re.search(r"from\s+['\"]([^'\"]+)['\"]", line_text)
            if not target:
                continue
            base = (current / target.group(1)).resolve()
            candidates = [Path(str(base).replace(str(ROOT), "").lstrip("\\/") + ext) for ext in (".ts", ".tsx")]
            candidates += [Path(str(base).replace(str(ROOT), "").lstrip("\\/") + "/index.ts"), Path(str(base).replace(str(ROOT), "").lstrip("\\/") + "/index.tsx")]
            for candidate in candidates:
                if rel(candidate) in FILE_SET:
                    imports.add(rel(candidate))
                    break
        export_graph[rel(path)] = imports
    seen_cycles: set[tuple[str, ...]] = set()
    for source, targets in export_graph.items():
        for target in targets:
            if source in export_graph.get(target, set()):
                cycle = tuple(sorted((source, target)))
                if cycle not in seen_cycles:
                    seen_cycles.add(cycle)
                    add(items, Path(source), None, f"Dependência circular simples detectada entre `{source}` e `{target}`.", "ALTO", f"{source}\n<->\n{target}")
    for path in [file for file in SOURCE_FILES if file.suffix in {".ts", ".tsx"}]:
        exported_classes = sum(1 for line_text in lines(path) if line_text.strip().startswith("export class "))
        if exported_classes > 1:
            add(items, path, None, f"Arquivo exporta {exported_classes} classes, sugerindo múltiplas responsabilidades.", "MÉDIO")
    return items


def audit_lgpd() -> list[Item]:
    items: list[Item] = []
    if SCHEMA_PATH:
        for model in PRISMA_MODELS:
            lowered = model.body.lower()
            pii_fields = [term for term in PII_TERMS if term in lowered]
            if pii_fields and not re.search(r"encrypt|cipher|encrypted|tokenized", lowered):
                add(items, SCHEMA_PATH, model.start, f"Model `{model.name}` contém campos PII/sensíveis ({', '.join(sorted(set(pii_fields)))}) sem indicação de proteção em repouso no schema.", "ALTO", model.body.strip())
        schema_text = read_text(SCHEMA_PATH)
        if not re.search(r"Consent|privacy|lgpd", schema_text, re.IGNORECASE):
            add(items, SCHEMA_PATH, None, "Nenhum modelo de consentimento/privacidade foi localizado no schema.", "ALTO", schema_text[:800])
    if not grep_any(r"/privacy/export|export.*data", ROUTE_FILES):
        add(items, Path("apps/api/src/modules/privacy"), None, "Endpoint `GET /privacy/export` não foi identificado.", "ALTO")
    if not grep_any(r"DELETE.*privacy|delete.*account|/privacy/account", ROUTE_FILES):
        add(items, Path("apps/api/src/modules/privacy"), None, "Endpoint `DELETE /privacy/account` não foi identificado.", "ALTO")
    if not grep_any(r"anonymize|anonimiz", SOURCE_FILES):
        add(items, Path("scripts/privacy"), None, "Job/processo de anonimização não foi localizado.", "ALTO")
    if grep_any(r"clinical|patient|medical", SOURCE_FILES) and not grep_any(r"encrypt|decrypt|crypto", SOURCE_FILES):
        add(items, Path("apps/api/src/modules/clinical"), None, "Há domínio clínico/médico sem evidência suficiente de proteção adicional de dados.", "ALTO")
    return items


def audit_audit_trail() -> list[Item]:
    items: list[Item] = []
    logger_present = grep_any(r"pino|winston|bunyan|morgan", PACKAGE_JSONS) or any(file.parts[:2] == ("packages", "logger") for file in FILES)
    if not logger_present:
        add(items, Path("package.json"), None, "Nenhum logger estruturado claro foi encontrado.", "MÉDIO")
    if SCHEMA_PATH and not re.search(r"AuditLog|audit_log|EventLog", read_text(SCHEMA_PATH), re.IGNORECASE):
        add(items, SCHEMA_PATH, None, "Schema sem modelo `AuditLog`/`EventLog`.", "MÉDIO")
    if not any("audit" in rel(file).lower() and "interceptor" in rel(file).lower() for file in FILES):
        add(items, Path("apps/api/src"), None, "Interceptor global de auditoria/log não foi localizado.", "MÉDIO", "Busca por `*audit*interceptor*` sem resultados.")
    for path, line_no, _ in find_matches(r"\blogger\.", files=SOURCE_FILES):
        window = "\n".join(lines(path)[max(0, line_no - 2) : min(len(lines(path)), line_no + 2)])
        if not re.search(r"userId|tenantId|organizationId", window):
            add(items, path, line_no, "Chamada de logger sem contexto explícito de tenant/user nas proximidades.", "MÉDIO", window)
    return items


def audit_observability() -> list[Item]:
    items: list[Item] = []
    package_text = "\n".join(read_text(file) for file in PACKAGE_JSONS)
    if not re.search(r"sentry|@sentry", package_text, re.IGNORECASE):
        add(items, Path("package.json"), None, "Sentry não foi localizado nos package.json.", "MÉDIO", package_text[:600])
    if not grep_any(r"/health|healthcheck|health", SOURCE_FILES):
        add(items, Path("apps/api/src"), None, "Endpoint/check de health não foi localizado.", "MÉDIO")
    if not re.search(r"prom-client|prometheus|metrics", package_text, re.IGNORECASE) and not grep_any(r"prometheus|metrics|observe|histogram", SOURCE_FILES):
        add(items, Path("apps/api/src/metrics.ts"), None, "Métricas de latência/observabilidade não ficaram evidentes no codebase.", "MÉDIO")
    env_example = ROOT / ".env.example"
    if not env_example.exists() or not re.search(r"SENTRY_DSN|DATADOG", env_example.read_text(encoding="utf-8", errors="replace"), re.IGNORECASE):
        add(items, Path(".env.example"), None, "`SENTRY_DSN`/`DATADOG` não estão documentados no `.env.example`.", "BAIXO", env_example.read_text(encoding="utf-8", errors="replace") if env_example.exists() else ".env.example ausente")
    if not grep_any(r"Sentry\.init|sentry", [file for file in SOURCE_FILES if file.name in {"main.ts", "server.ts", "app.ts"} or "observability" in rel(file)]):
        add(items, Path("apps/api/src"), None, "Inicialização explícita de Sentry não foi localizada na camada de bootstrap.", "MÉDIO")
    return items


def audit_tests() -> tuple[list[Item], dict[str, str]]:
    items: list[Item] = []
    notes: dict[str, str] = {}
    test_files = [file for file in FILES if is_test_file(file)]
    notes["test_files"] = str(len(test_files))
    for critical in ("billing", "metering", "auth", "tenant", "ai", "crm"):
        if not any(critical in rel(file).lower() for file in test_files):
            add(items, Path("tests"), None, f"Módulo crítico `{critical}` sem arquivo de teste correspondente.", "MÉDIO", f"Busca por arquivos de teste contendo `{critical}` sem resultados.")
    if not grep_any(r"jest|vitest", PACKAGE_JSONS) and not any(file.name.startswith("jest.config") or "vitest.config" in file.name for file in FILES):
        add(items, Path("package.json"), None, "Jest/Vitest não está configurado de forma clara.", "MÉDIO")
    if not grep_any(r"test|jest|vitest|playwright", [file for file in FILES if ".github/workflows" in rel(file)]):
        add(items, Path(".github/workflows"), None, "CI não aparenta executar testes automaticamente.", "MÉDIO")
    if not any("onboarding" in rel(file).lower() or "signup" in rel(file).lower() or "invite" in rel(file).lower() for file in test_files):
        add(items, Path("tests/e2e"), None, "Fluxo e2e de onboarding/signup/invite não ficou evidenciado.", "MÉDIO")

    code, output = run(["corepack", "pnpm", "test", "--", "--coverage", "--passWithNoTests"], timeout=240)
    notes["coverage_command"] = output[-4000:] if output else "Sem saída."
    if code != 0:
        add(items, Path("package.json"), None, "Execução de cobertura falhou ou excedeu o tempo limite.", "MÉDIO", notes["coverage_command"])
    elif not re.search(r"All files|Statements|Branches|Functions|Lines", output):
        add(items, Path("package.json"), None, "Saída de cobertura não trouxe resumo padrão de statements/branches/functions/lines.", "BAIXO", notes["coverage_command"])
    else:
        percent_matches = [float(value) for value in re.findall(r"(\d+(?:\.\d+)?)\s*%", output)]
        notes["coverage_percentages"] = ", ".join(str(value) for value in percent_matches[:10])
        if percent_matches and min(percent_matches) < 70:
            add(items, Path("package.json"), None, "Cobertura identificada abaixo de 70% em pelo menos um resumo reportado.", "MÉDIO", notes["coverage_command"])
    return items, notes


def audit_design_system() -> list[Item]:
    items: list[Item] = []
    for path, line_no, _ in find_matches(r"#[0-9a-fA-F]{3,8}", files=STYLE_FILES):
        if not re.search(r"tokens|variables|theme", rel(path), re.IGNORECASE):
            add(items, path, line_no, "Cor hex hardcoded fora de arquivo de tokens/theme.", "MÉDIO")
    for path, line_no, _ in find_matches(r"font-family.*(Arial|Roboto|Helvetica|Times)", files=STYLE_FILES, flags=re.IGNORECASE):
        add(items, path, line_no, "Font-family hardcoded em componente/estilo.", "MÉDIO")
    if not any(file.name in {"tokens.css", "variables.css", "theme.css"} for file in FILES):
        add(items, Path("app"), None, "Nenhum arquivo global de design tokens (`tokens.css`/`variables.css`/`theme.css`) foi localizado.", "MÉDIO")
    tailwind_files = [file for file in FILES if file.name.startswith("tailwind.config")]
    if not tailwind_files or not grep_any(r"aurora|glass|surface|muted", tailwind_files):
        add(items, tailwind_files[0] if tailwind_files else Path("."), None, "Tailwind sem evidência de tokens customizados para o design system.", "BAIXO")
    for path, line_no, _ in find_matches(r"style=\{\{.*(color|background)", files=[file for file in FILES if file.suffix in {".tsx", ".jsx"} and not is_test_file(file)], flags=re.IGNORECASE):
        add(items, path, line_no, "Inline style com cor/background literal.", "BAIXO")
    return items


def audit_todo_fixme() -> list[Item]:
    items: list[Item] = []
    todo_rx = re.compile(r"\b(TODO|FIXME|HACK|XXX|BUG|TEMP|KLUDGE)\b", re.IGNORECASE)
    for path in SOURCE_FILES:
        for idx, line_text in enumerate(lines(path), start=1):
            match = todo_rx.search(line_text)
            if not match:
                continue
            kind = match.group(1).upper()
            risk = "ALTO" if kind == "FIXME" or (kind == "HACK" and any(tag in rel(path).lower() for tag in ("auth", "billing", "ai"))) else "MÉDIO"
            desc = f"{kind} em código de produção"
            if "#" not in line_text and "http" not in line_text.lower():
                desc += " sem issue vinculada"
            add(items, path, idx, desc + ".", risk)
    if not grep_any(r"no-warning-comments", [file for file in FILES if ".eslintrc" in file.name or file.name.startswith("eslint")]):
        add(items, Path("eslint.config.mjs"), None, "Regra de lint para bloquear novos TODO/FIXME não foi localizada.", "MÉDIO")
    return items


def audit_console_log() -> list[Item]:
    items: list[Item] = []
    for path, line_no, line_text in find_matches(r"\bconsole\.(log|warn|error|debug|info|dir|table)\s*\(", files=SOURCE_FILES):
        risk = "CRÍTICO" if re.search(r"password|token|secret|key|email", line_text, re.IGNORECASE) else "BAIXO"
        desc = "console.* em código de produção"
        if risk == "CRÍTICO":
            desc += " com possível dado sensível"
        add(items, path, line_no, desc + ".", risk)
    if not grep_any(r"no-console", [file for file in FILES if ".eslintrc" in file.name or file.name.startswith("eslint")]):
        add(items, Path("eslint.config.mjs"), None, "Regra ESLint `no-console` não foi localizada.", "BAIXO")
    return items


def audit_env_vars() -> list[Item]:
    items: list[Item] = []
    env_refs: set[str] = set()
    for path in [file for file in SOURCE_FILES if file.suffix in {".ts", ".tsx", ".js", ".mjs", ".cjs"}]:
        for idx, line_text in enumerate(lines(path), start=1):
            for match in re.finditer(r"process\.env\.([A-Z0-9_]+)", line_text):
                env_refs.add(match.group(1))
                if "??" not in line_text and "||" not in line_text and "envSchema" not in line_text and "z.object" not in line_text:
                    add(items, path, idx, f"Acesso direto a `process.env.{match.group(1)}` sem fallback na mesma linha.", "BAIXO")
    validation_files = [file for file in FILES if re.search(r"env\.(validation|schema)|config", rel(file), re.IGNORECASE)]
    if not grep_any(r"Joi|zod|envSchema|safeParse", validation_files or FILES):
        add(items, Path("apps/api/src/config"), None, "Validação central de variáveis de ambiente via Joi/Zod não foi localizada.", "BAIXO")
    env_example = ROOT / ".env.example"
    documented = set(re.findall(r"^([A-Z0-9_]+)=", env_example.read_text(encoding="utf-8", errors="replace"), re.MULTILINE)) if env_example.exists() else set()
    missing = sorted(var for var in env_refs if var not in documented)
    for var in missing[:25]:
        add(items, Path(".env.example"), None, f"Variável usada no código mas ausente do `.env.example`: `{var}`.", "BAIXO")
    return items


def audit_hardcoded_urls() -> list[Item]:
    items: list[Item] = []
    localhost_rx = r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)[^'\"\s]*"
    prod_rx = r"https://[A-Za-z0-9.-]+\.(com|com\.br|io|app)[^'\"\s]*"
    ip_rx = r"\b(192\.168\.|10\.\d+\.\d+\.|172\.(1[6-9]|2\d|3[0-1])\.)"
    for path, line_no, _ in find_matches(localhost_rx, files=SOURCE_FILES):
        add(items, path, line_no, "URL localhost hardcoded fora de teste.", "BAIXO")
    for path, line_no, _ in find_matches(prod_rx, files=SOURCE_FILES):
        if "github.com" not in lines(path)[line_no - 1]:
            add(items, path, line_no, "URL de produção hardcoded no código.", "BAIXO")
    for path, line_no, _ in find_matches(ip_rx, files=[file for file in FILES if file.suffix in {".ts", ".js", ".mjs", ".yaml", ".yml"} and not is_test_file(file)]):
        add(items, path, line_no, "IP de infraestrutura hardcoded.", "BAIXO")
    for path, line_no, _ in find_matches(r"enableCors|origin\s*:", files=SOURCE_FILES):
        if "process.env" not in lines(path)[line_no - 1]:
            add(items, path, line_no, "Configuração de CORS com origin literal na mesma linha/bloco.", "BAIXO")
    return items


def audit_documentation() -> list[Item]:
    items: list[Item] = []
    readme = ROOT / "README.md"
    content = readme.read_text(encoding="utf-8", errors="replace") if readme.exists() else ""
    if len(content) < 500:
        add(items, Path("README.md"), None, "README.md com menos de 500 caracteres úteis.", "BAIXO", content)
    for section in ("Setup", "Instala", "Stack", "Tecnologias", "Deploy", "Testes", "Tests", "Arquitetura"):
        if re.search(section, content, re.IGNORECASE):
            break
    else:
        add(items, Path("README.md"), None, "README sem seções mínimas de setup/stack/deploy/testes/arquitetura.", "BAIXO", content)
    env_example = ROOT / ".env.example"
    if env_example.exists():
        comments = sum(1 for line_text in env_example.read_text(encoding="utf-8", errors="replace").splitlines() if line_text.strip().startswith("#"))
        if comments < 5:
            add(items, Path(".env.example"), None, ".env.example com poucos comentários explicativos.", "BAIXO", env_example.read_text(encoding="utf-8", errors="replace"))
    else:
        add(items, Path(".env.example"), None, ".env.example ausente.", "BAIXO", ".env.example não encontrado.")
    adrs = [file for file in FILES if file.suffix == ".md" and any(part.lower() == "docs" for part in file.parts) and file.name.lower().startswith("adr")]
    if not adrs:
        add(items, Path("docs"), None, "Não foram encontrados ADRs concretos em `docs/`.", "BAIXO")
    if not (ROOT / "CONTRIBUTING.md").exists():
        add(items, Path("CONTRIBUTING.md"), None, "CONTRIBUTING.md ausente.", "BAIXO", "Arquivo não encontrado.")
    return items


def audit_ai_leak() -> list[Item]:
    items: list[Item] = []
    ai_rx = re.compile(r"(messages\.create|chat\.completions|anthropic\.|openai\.)")
    sanitize_present = grep_any(r"sanitize|sanitizeInput|cleanPrompt|escapeInput|prompt injection", SOURCE_FILES)
    for path in SOURCE_FILES:
        file_lines = lines(path)
        for idx, line_text in enumerate(file_lines, start=1):
            if not ai_rx.search(line_text):
                continue
            window = "\n".join(file_lines[max(0, idx - 4) : min(len(file_lines), idx + 6)])
            if not re.search(r"sanitize|escape|cleanPrompt|safePrompt|redact", window, re.IGNORECASE):
                add(items, path, idx, "Chamada à IA sem sanitização evidente nas proximidades.", "ALTO", window)
            if re.search(r"system.*(\$\{.*user|\+.*user|req\.)", window, re.IGNORECASE):
                add(items, path, idx, "Input de usuário concatenado no system prompt.", "ALTO", window)
            if not re.search(r"logger|token|usage|metering", window, re.IGNORECASE):
                add(items, path, idx, "Chamada de IA sem log/tracking de tokens nas proximidades.", "ALTO", window)
    if not sanitize_present:
        add(items, Path("packages/integrations/src/clients/llm.ts"), None, "Camada de sanitização de prompt/input não foi localizada.", "ALTO")
    if not grep_any(r"RateLimit|Throttle|AiRateLimit", SOURCE_FILES):
        add(items, Path("apps/api/src/modules"), None, "Rate limiting específico para endpoints/fluxos de IA não foi localizado.", "ALTO")
    return items


def audit_data_models() -> list[Item]:
    items: list[Item] = []
    if not SCHEMA_PATH:
        add(items, Path("packages/database/prisma/schema.prisma"), None, "Schema Prisma principal não foi localizado.", "MÉDIO", "schema.prisma não encontrado.")
        return items
    schema_text = read_text(SCHEMA_PATH)
    for model_name in CRITICAL_MODELS:
        if not re.search(rf"^model\s+{re.escape(model_name)}\b", schema_text, re.MULTILINE):
            add(items, SCHEMA_PATH, None, f"Modelo crítico `{model_name}` ausente no schema.", "MÉDIO")
    for model in PRISMA_MODELS:
        if model.name in {"User", "Plan"}:
            continue
        if not any(key in model.body for key in TENANT_KEYS) and "Organization" in model.body:
            add(items, SCHEMA_PATH, model.start, f"Model `{model.name}` referencia organização sem campo explícito de tenant.", "MÉDIO", model.body.strip())
        if model.name in CRITICAL_MODELS and "@@index" not in model.body:
            add(items, SCHEMA_PATH, model.start, f"Model crítico `{model.name}` sem índice composto/@@index declarado.", "MÉDIO", model.body.strip())
        if model.name in CRITICAL_MODELS and "deletedAt" not in model.body and "deleted_at" not in model.body:
            add(items, SCHEMA_PATH, model.start, f"Model crítico `{model.name}` sem soft delete (`deletedAt`).", "MÉDIO", model.body.strip())
    if not any("seed" in rel(file).lower() and file.suffix in {".ts", ".js", ".mjs"} for file in FILES):
        add(items, Path("packages/database/prisma/seed"), None, "Seeds de banco realistas não foram localizadas.", "BAIXO")
    return items


def audit_error_handling() -> list[Item]:
    items: list[Item] = []
    for path, line_no, _ in find_matches(r"catch\s*\([^)]*\)\s*\{\s*\}", files=SOURCE_FILES):
        add(items, path, line_no, "Catch vazio em código TypeScript/JavaScript.", "MÉDIO")
    for path, line_no, _ in find_matches(r"catch\s*\([^)]*\)\s*\{\s*//", files=SOURCE_FILES):
        add(items, path, line_no, "Catch com apenas comentário, sem tratamento real.", "MÉDIO")
    for path, line_no, _ in find_matches(r"except(?:\s+Exception)?\s*:?\s*$", files=[file for file in SOURCE_FILES if file.suffix == ".py"]):
        follow = lines(path)[line_no] if line_no < len(lines(path)) else ""
        if "pass" in follow:
            add(items, path, line_no, "Bloco Python com `except ...: pass`.", "MÉDIO", "\n".join(lines(path)[max(0, line_no - 1) : min(len(lines(path)), line_no + 2)]))
    if not any("filter" in file.name.lower() and ("exception" in file.name.lower() or "error" in file.name.lower()) for file in FILES):
        add(items, Path("apps/api/src"), None, "Global exception filter não foi localizado.", "MÉDIO")
    if not grep_any(r"unhandledRejection|uncaughtException", [file for file in SOURCE_FILES if file.name in {"main.ts", "server.ts", "app.ts"}]):
        add(items, Path("apps/api/src/server.ts"), None, "Tratamento de `unhandledRejection`/`uncaughtException` não foi localizado no bootstrap.", "MÉDIO")
    for path, line_no, _ in find_matches(r"stack|stackTrace|err\.message|error\.message", files=ROUTE_FILES):
        add(items, path, line_no, "Mensagem/stack de erro pode vazar para camada HTTP.", "MÉDIO")
    return items


CATEGORIES = [
    Category("01", "multitenancy", "Multi-tenancy — Isolamento de Tenant", "CRÍTICO"),
    Category("02", "secrets", "Segredos Hardcoded no Código-Fonte", "CRÍTICO"),
    Category("03", "sync-blocking", "Operações Bloqueantes — Sync I/O", "ALTO"),
    Category("04", "billing", "Billing & Gateway de Pagamento Ausente", "ALTO"),
    Category("05", "metering", "Metering — Uso e Consumo por Tenant Ausente", "ALTO"),
    Category("06", "crm-sync", "Integração CRM Ausente", "ALTO"),
    Category("07", "coupling", "Acoplamento — Arquivos Gigantes", "ALTO"),
    Category("08", "lgpd", "Conformidade LGPD", "ALTO"),
    Category("09", "audit-trail", "Trilhas de Auditoria e Logging Estruturado", "MÉDIO"),
    Category("10", "observability", "Observabilidade — APM e Monitoramento", "MÉDIO"),
    Category("11", "tests", "Cobertura de Testes Insuficiente", "MÉDIO"),
    Category("12", "design-system", "Design System — Tokens e Variáveis CSS", "MÉDIO"),
    Category("13", "todo-fixme", "TODOs e FIXMEs em Código de Produção", "MÉDIO"),
    Category("14", "console-log", "console.log em Produção", "BAIXO"),
    Category("15", "env-vars", "Variáveis de Ambiente sem Validação", "BAIXO"),
    Category("16", "hardcoded-urls", "URLs e Endpoints Hardcoded", "BAIXO"),
    Category("17", "documentation", "Documentação e Onboarding de Devs", "BAIXO"),
    Category("18", "ai-leak", "Vazamento de IA — Prompt Injection e Sanitização", "ALTO"),
    Category("19", "data-models", "Modelagem de Dados — Schemas e Relações", "MÉDIO"),
    Category("20", "error-handling", "Tratamento de Erros — Catch Vazio e Falhas Silenciosas", "MÉDIO"),
]


RUNNERS = {
    "01": lambda: (audit_multitenancy(), {}),
    "02": lambda: (audit_secrets(), {}),
    "03": lambda: (audit_sync_blocking(), {}),
    "04": lambda: (audit_billing(), {}),
    "05": lambda: (audit_metering(), {}),
    "06": lambda: (audit_crm_sync(), {}),
    "07": lambda: (audit_coupling(), {}),
    "08": lambda: (audit_lgpd(), {}),
    "09": lambda: (audit_audit_trail(), {}),
    "10": lambda: (audit_observability(), {}),
    "11": audit_tests,
    "12": lambda: (audit_design_system(), {}),
    "13": lambda: (audit_todo_fixme(), {}),
    "14": lambda: (audit_console_log(), {}),
    "15": lambda: (audit_env_vars(), {}),
    "16": lambda: (audit_hardcoded_urls(), {}),
    "17": lambda: (audit_documentation(), {}),
    "18": lambda: (audit_ai_leak(), {}),
    "19": lambda: (audit_data_models(), {}),
    "20": lambda: (audit_error_handling(), {}),
}


def prompt_text(kind: str, category: Category, item: Item) -> str:
    line = item.line if item.line is not None else "N/A"
    header = (
        f"Você é um engenheiro sênior especialista em SaaS multi-tenant com stack TypeScript/NestJS/Prisma/Next.js.\n\n"
        f"Contexto do projeto: BirthHub360 — Revenue Operations OS, plataforma B2B SaaS multi-tenant.\n"
        f"Categoria de dívida técnica: {category.title} (Severidade: {category.severity})\n\n"
        f"Problema encontrado:\n- Arquivo: {item.file}\n- Linha: {line}\n- Descrição: {item.description}\n- Trecho de código:\n```\n{item.context}\n```"
    )
    if kind == "gemini":
        return header + "\n\nSua tarefa:\n1. Explique por que este problema é uma dívida técnica e qual o risco real no contexto de um SaaS multi-tenant\n2. Proponha a solução mais elegante e production-ready em TypeScript/NestJS\n3. Forneça o código completo corrigido com comentários explicativos\n4. Liste os arquivos que precisam ser alterados e a ordem de execução\n5. Indique se há testes que precisam ser criados ou atualizados\n6. Estime o impacto da correção no score de saúde do projeto\n\nResponda de forma estruturada, direta e com código executável."
    if kind == "codex":
        return (
            f"MODO: EXECUÇÃO AUTÔNOMA — SEM PERGUNTAS, SEM CONFIRMAÇÕES\n\n"
            f"Você é CODEX, agente executor do projeto BirthHub360.\n"
            f"Repositório: {ROOT}\n"
            f"Categoria: {category.title} | Severidade: {category.severity}\n\n"
            f"PROBLEMA IDENTIFICADO:\n- Arquivo: {item.file}\n- Linha: {line}\n- Issue: {item.description}\n- Código atual:\n{item.context}\n\n"
            "EXECUTE AGORA:\n1. Abrir o arquivo indicado\n2. Implementar a correção completa seguindo as melhores práticas de NestJS/TypeScript\n3. Criar arquivos auxiliares apenas se necessário\n4. Atualizar imports e dependências afetadas\n5. Adicionar/atualizar o teste correspondente\n6. Executar `npm run lint`\n7. Executar `npm test`\n8. Registrar no log `C:\\Users\\Marks\\Desktop\\20 DIVIDAS TECNICAS\\execution-log.txt`\n\n"
            "RESTRIÇÕES:\n- Não perguntar confirmação\n- Não introduzir dependências fora do package.json existente\n- Não modificar arquivos fora do escopo"
        )
    if kind == "antigravity":
        return (
            "Sistema: BirthHub360 SaaS — Revenue Operations OS\n"
            "Stack: Next.js 14 + NestJS + FastAPI + Prisma + PostgreSQL + Redis + BullMQ + Anthropic Claude\n"
            "Modo: Revisão arquitetural profunda\n\n"
            f"DÍVIDA TÉCNICA IDENTIFICADA:\nCategoria: {category.title}\nSeveridade: {category.severity}\nOcorrência: {item.description}\nLocalização: {item.file} (linha {line})\n\n"
            f"Código atual:\n{item.context}\n\n"
            "ANÁLISE REQUERIDA:\n1. Esta ocorrência é sintoma de um problema arquitetural maior?\n2. Existe um padrão sistêmico no codebase que causa este tipo de dívida?\n3. Qual a solução que resolve não só este item mas previne recorrência?\n4. Como esta correção afeta a arquitetura de multi-tenancy do projeto?\n5. Há trade-offs de performance, manutenibilidade ou segurança a considerar?\n6. Sugira a sequência de refactoring segura para produção"
        )
    return (
        f"# ============================================================\n"
        f"# CORREÇÃO AUTOMATIZADA: {category.title}\n"
        f"# Arquivo: {item.file} | Issue: {item.description}\n"
        f"# ============================================================\n\n"
        "$RepoPath   = \"" + str(ROOT) + "\"\n"
        "$OutputDir  = \"C:\\Users\\Marks\\Desktop\\20 DIVIDAS TECNICAS\"\n"
        "$LogFile    = \"$OutputDir\\execution-log.txt\"\n"
        "$TargetFile = \"$RepoPath\\" + item.file.replace("/", "\\") + "\"\n"
        "$Timestamp  = Get-Date -Format \"yyyy-MM-dd HH:mm:ss\"\n\n"
        "# Validar arquivo, aplicar transformação específica e registrar o resultado.\n"
        "# Inserir a lógica AST/regex adequada para corrigir a ocorrência abaixo.\n"
        f"# Linha: {line}\n# Contexto:\n# {item.context.replace(chr(10), chr(10) + '# ')}"
    )


def report_html(category: Category, items: list[Item], notes: dict[str, str]) -> str:
    safe_notes = "".join(f"<li><code>{html.escape(key)}</code>: {html.escape(value)}</li>" for key, value in notes.items() if value)
    rows = []
    details = []
    for index, item in enumerate(items, start=1):
        item_id = f"{category.code}-{index}"
        rows.append(
            f"<tr data-item-id='{item_id}'><td><input type='checkbox' class='resolve' data-item-id='{item_id}'></td><td>{html.escape(item.file)}</td><td>{item.line or 'N/A'}</td><td>{html.escape(item.risk)}</td><td>{html.escape(item.description)}</td><td class='status'>⚠️ Pendente</td></tr>"
        )
        prompt_blocks = []
        for kind in PROMPT_KINDS:
            label = {"gemini": "Prompt Gemini", "codex": "Prompt Codex", "antigravity": "Prompt Antigravity", "powershell": "Prompt PowerShell + Python"}[kind]
            text = html.escape(prompt_text(kind, category, item))
            prompt_blocks.append(
                f"<details class='prompt'><summary>{label}</summary><button class='copy' data-target='{item_id}-{kind}'>Copiar prompt</button><pre id='{item_id}-{kind}'>{text}</pre></details>"
            )
        details.append(
            f"<section class='item-card'><h3>{index}. {html.escape(item.description)}</h3><p><strong>Arquivo:</strong> {html.escape(item.file)} | <strong>Linha:</strong> {item.line or 'N/A'} | <strong>Risco:</strong> {html.escape(item.risk)}</p><pre>{html.escape(item.context)}</pre>{''.join(prompt_blocks)}</section>"
        )
    if not rows:
        rows.append("<tr><td colspan='6'>Nenhum item encontrado nesta auditoria.</td></tr>")
        details.append("<section class='item-card'><h3>Sem achados</h3><p>Nenhuma ocorrência foi detectada pelas heurísticas executadas.</p></section>")

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>CODEX-AUDIT-{category.code} - {html.escape(category.title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{ --bg:#060812; --glass:rgba(255,255,255,0.06); --border:rgba(255,255,255,0.08); --text:#f7f8fb; --muted:#a8b1c7; --sev:{'#ff4d6d' if category.severity == 'CRÍTICO' else '#ff8c42' if category.severity == 'ALTO' else '#f5c518' if category.severity == 'MÉDIO' else '#7dd3fc'}; }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; font-family:'JetBrains Mono',monospace; color:var(--text); background:radial-gradient(circle at top left, rgba(125,211,252,.15), transparent 26%), radial-gradient(circle at top right, rgba(255,77,109,.12), transparent 22%), var(--bg); }}
    header, section {{ width:min(1240px, calc(100% - 32px)); margin:24px auto; background:var(--glass); border:1px solid var(--border); border-radius:24px; backdrop-filter:blur(16px); box-shadow:0 18px 60px rgba(0,0,0,.35); }}
    header {{ padding:28px; }}
    h1, h2, h3 {{ font-family:'Syne',sans-serif; margin:0 0 12px; }}
    p, li, td, th, summary {{ color:var(--muted); }}
    .meta {{ display:flex; gap:12px; flex-wrap:wrap; margin-top:16px; }}
    .pill {{ padding:10px 14px; border-radius:999px; border:1px solid var(--border); background:rgba(255,255,255,.03); color:var(--text); }}
    .pill strong {{ color:var(--sev); }}
    table {{ width:100%; border-collapse:collapse; }}
    th, td {{ text-align:left; padding:14px 12px; border-bottom:1px solid rgba(255,255,255,.06); vertical-align:top; }}
    th {{ color:var(--text); font-family:'Syne',sans-serif; }}
    .wrap {{ padding:24px; overflow:auto; }}
    pre {{ white-space:pre-wrap; word-break:break-word; background:rgba(0,0,0,.24); padding:16px; border-radius:18px; border:1px solid rgba(255,255,255,.06); color:#eef3ff; }}
    .item-card {{ padding:24px; border-top:1px solid rgba(255,255,255,.06); }}
    .prompt {{ margin-top:14px; padding:12px 14px; border-radius:18px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); }}
    summary {{ cursor:pointer; color:var(--text); }}
    button {{ margin:12px 0; background:linear-gradient(135deg, var(--sev), rgba(125,211,252,.8)); color:#08111e; border:0; border-radius:999px; padding:10px 14px; font-weight:700; font-family:'JetBrains Mono',monospace; cursor:pointer; }}
    .status-resolved {{ color:#00d084 !important; }}
    ul {{ margin:0; padding-left:18px; }}
  </style>
</head>
<body>
  <header>
    <h1>{html.escape(category.title)}</h1>
    <p>Relatório de diagnóstico executado em {TIMESTAMP.strftime('%d/%m/%Y %H:%M:%S')}. Nenhuma correção foi aplicada automaticamente por este executor; os itens abaixo começam como pendentes e podem ser marcados manualmente como resolvidos.</p>
    <div class="meta">
      <span class="pill"><strong>Severidade:</strong> {html.escape(category.severity)}</span>
      <span class="pill"><strong>Score de resolução:</strong> <span id="resolved-count">0</span> de {len(items)} itens corrigidos</span>
      <span class="pill"><strong>Itens encontrados:</strong> {len(items)}</span>
      <span class="pill"><strong>Arquivo:</strong> CODEX-AUDIT-{category.code}-{html.escape(category.slug)}.html</span>
    </div>
  </header>
  <section class="wrap">
    <h2>Tabela de Itens</h2>
    <table>
      <thead><tr><th>OK</th><th>Arquivo</th><th>Linha</th><th>Risco</th><th>Descrição</th><th>Status</th></tr></thead>
      <tbody>{''.join(rows)}</tbody>
    </table>
  </section>
  <section class="wrap">
    <h2>Prompts por Item</h2>
    {''.join(details)}
  </section>
  <section class="wrap">
    <h2>Log de Execução</h2>
    <ul>{safe_notes or '<li>Sem notas adicionais.</li>'}</ul>
  </section>
  <script>
    const reportCode = {json.dumps(category.code)};
    function refresh() {{
      const boxes = [...document.querySelectorAll('.resolve')];
      const resolved = boxes.filter(box => box.checked).length;
      document.getElementById('resolved-count').textContent = resolved;
      boxes.forEach(box => {{
        const row = document.querySelector(`tr[data-item-id="${{box.dataset.itemId}}"] .status`);
        row.textContent = box.checked ? '✅ Resolvido' : '⚠️ Pendente';
        row.classList.toggle('status-resolved', box.checked);
      }});
    }}
    document.querySelectorAll('.resolve').forEach(box => {{
      const key = `codex-audit:${{reportCode}}:${{box.dataset.itemId}}`;
      box.checked = localStorage.getItem(key) === 'true';
      box.addEventListener('change', () => {{
        localStorage.setItem(key, String(box.checked));
        refresh();
      }});
    }});
    document.querySelectorAll('.copy').forEach(button => {{
      button.addEventListener('click', async () => {{
        const text = document.getElementById(button.dataset.target).innerText;
        await navigator.clipboard.writeText(text);
        const previous = button.textContent;
        button.textContent = 'Copiado';
        setTimeout(() => button.textContent = previous, 1200);
      }});
    }});
    refresh();
  </script>
</body>
</html>"""


def index_html(summary: list[dict[str, object]]) -> str:
    rows = "".join(
        f"<tr><td>{item['code']}</td><td>{html.escape(str(item['title']))}</td><td>{html.escape(str(item['severity']))}</td><td>{item['count']}</td><td><a href='{html.escape(str(item['file']))}'>Abrir relatório</a></td></tr>"
        for item in summary
    )
    return f"""<!DOCTYPE html><html lang='pt-BR'><head><meta charset='utf-8'><title>CODEX Audit Index</title><style>body{{font-family:JetBrains Mono,monospace;background:#060812;color:#f7f8fb;padding:32px}}table{{width:100%;border-collapse:collapse}}td,th{{padding:12px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}}a{{color:#7dd3fc}}</style></head><body><h1>Índice das 20 auditorias</h1><p>Gerado em {TIMESTAMP.strftime('%d/%m/%Y %H:%M:%S')}.</p><table><thead><tr><th>Código</th><th>Categoria</th><th>Severidade</th><th>Itens</th><th>Arquivo</th></tr></thead><tbody>{rows}</tbody></table></body></html>"""


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    summary: list[dict[str, object]] = []
    for category in CATEGORIES:
        items, notes = RUNNERS[category.code]()
        file_name = f"CODEX-AUDIT-{category.code}-{category.slug.upper()}.html"
        (OUTPUT_DIR / file_name).write_text(report_html(category, items, notes), encoding="utf-8")
        summary.append({"code": category.code, "title": category.title, "severity": category.severity, "count": len(items), "file": file_name})
        with LOG_FILE.open("a", encoding="utf-8") as handle:
            handle.write(f"[{TIMESTAMP.strftime('%Y-%m-%d %H:%M:%S')}] | {category.title} | {file_name} | STATUS: GERADO | ITENS: {len(items)}\n")

    (OUTPUT_DIR / "CODEX-AUDIT-INDEX.html").write_text(index_html(summary), encoding="utf-8")
    (OUTPUT_DIR / "codex-audit-summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
