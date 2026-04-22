import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

function readArgument(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isDirectory(inputPath) {
  return existsSync(inputPath) && statSync(inputPath).isDirectory();
}

function collectSarifFiles(inputPath) {
  if (!inputPath) {
    throw new Error("Missing required --input argument.");
  }

  if (!existsSync(inputPath)) {
    throw new Error(`SARIF input path does not exist: ${inputPath}`);
  }

  if (!isDirectory(inputPath)) {
    return [inputPath];
  }

  return readdirSync(inputPath)
    .filter((entry) => entry.endsWith(".sarif"))
    .map((entry) => path.join(inputPath, entry))
    .sort((left, right) => left.localeCompare(right));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readRule(run, ruleId) {
  const driverRules = safeArray(run?.tool?.driver?.rules);
  return driverRules.find((rule) => rule?.id === ruleId) ?? null;
}

function toNumericSecuritySeverity(...candidates) {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function resolveLevel(result, rule) {
  return (
    result?.level ??
    rule?.defaultConfiguration?.level ??
    result?.properties?.severity ??
    rule?.properties?.severity ??
    "warning"
  );
}

function resolveMessage(result) {
  const text = result?.message?.text;
  if (typeof text === "string" && text.trim().length > 0) {
    return text.trim();
  }

  return "Security finding";
}

function resolveLocation(result) {
  const location = safeArray(result?.locations)[0];
  const physicalLocation = location?.physicalLocation;
  const artifact = physicalLocation?.artifactLocation?.uri;
  const line = physicalLocation?.region?.startLine;

  if (artifact && line) {
    return `${artifact}:${line}`;
  }

  return artifact ?? "unknown-location";
}

function readSarifResults(filePath) {
  const sarif = JSON.parse(readFileSync(filePath, "utf8"));
  const findings = [];

  for (const run of safeArray(sarif.runs)) {
    for (const result of safeArray(run.results)) {
      const rule = readRule(run, result.ruleId);
      findings.push({
        filePath,
        level: resolveLevel(result, rule),
        location: resolveLocation(result),
        message: resolveMessage(result),
        ruleId: result.ruleId ?? rule?.id ?? "unknown-rule",
        securitySeverity: toNumericSecuritySeverity(
          result?.properties?.["security-severity"],
          result?.properties?.securitySeverity,
          rule?.properties?.["security-severity"],
          rule?.properties?.securitySeverity
        )
      });
    }
  }

  return findings;
}

function shouldFailFinding(finding, options) {
  if (finding.level === options.minimumLevel) {
    return true;
  }

  if (finding.level === "error" && options.minimumLevel !== "note") {
    return true;
  }

  if (
    typeof options.minimumSecuritySeverity === "number" &&
    finding.securitySeverity !== null &&
    finding.securitySeverity >= options.minimumSecuritySeverity
  ) {
    return true;
  }

  return false;
}

function main() {
  const input = readArgument("--input");
  const minimumLevel = readArgument("--level") ?? "error";
  const minimumSecuritySeverityRaw = readArgument("--security-severity");
  const tool = readArgument("--tool") ?? "sarif";
  const minimumSecuritySeverity =
    minimumSecuritySeverityRaw === undefined ? null : Number(minimumSecuritySeverityRaw);

  if (
    minimumSecuritySeverityRaw !== undefined &&
    !Number.isFinite(minimumSecuritySeverity)
  ) {
    throw new Error(
      `Invalid --security-severity value: ${minimumSecuritySeverityRaw}`
    );
  }

  const sarifFiles = collectSarifFiles(input);
  if (sarifFiles.length === 0) {
    throw new Error(`No .sarif files found under ${input}`);
  }

  const findings = sarifFiles.flatMap(readSarifResults);
  const blockingFindings = findings.filter((finding) =>
    shouldFailFinding(finding, {
      minimumLevel,
      minimumSecuritySeverity
    })
  );

  if (blockingFindings.length === 0) {
    console.log(
      `[sarif-gate:${tool}] PASS (${findings.length} findings reviewed, no blocking result)`
    );
    return;
  }

  const preview = blockingFindings.slice(0, 20).map((finding) => {
    const securitySeverity =
      finding.securitySeverity === null ? "n/a" : finding.securitySeverity.toFixed(1);
    return `- [${finding.level}] ${finding.ruleId} @ ${finding.location} (security=${securitySeverity}) :: ${finding.message}`;
  });

  throw new Error(
    [
      `[sarif-gate:${tool}] Blocking findings detected (${blockingFindings.length}).`,
      ...preview
    ].join("\n")
  );
}

main();
