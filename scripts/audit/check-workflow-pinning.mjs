#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const workflowDir = path.join(process.cwd(), ".github", "workflows");
const actionRefPattern = /\buses:\s+([^@\s]+)@([^\s#]+)/;
const dockerImagePattern = /\bimage:\s+([^@\s]+:[^\s#]+)/;
const shaPattern = /^[a-f0-9]{40}$/i;

const findings = [];

for (const fileName of readdirSync(workflowDir)) {
  if (!/\.ya?ml$/i.test(fileName)) continue;
  const file = path.join(workflowDir, fileName);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    const actionRef = line.match(actionRefPattern);
    if (actionRef && !shaPattern.test(actionRef[2])) {
      findings.push({
        file: path.relative(process.cwd(), file),
        line: index + 1,
        rule: "unpinned-action",
        value: `${actionRef[1]}@${actionRef[2]}`
      });
    }

    const dockerImage = line.match(dockerImagePattern);
    if (dockerImage && !line.includes("@sha256:")) {
      findings.push({
        file: path.relative(process.cwd(), file),
        line: index + 1,
        rule: "image-needs-digest",
        value: dockerImage[1]
      });
    }
  });
}

for (const finding of findings) {
  console.log(`${finding.file}:${finding.line} ${finding.rule} ${finding.value}`);
}

const hasUnpinnedActions = findings.some((finding) => finding.rule === "unpinned-action");
if (hasUnpinnedActions) {
  process.exitCode = 1;
}
