// @ts-nocheck
// 
const command = process.argv[2] ?? "legacy-command";

console.error(
  [
    `The legacy dashboard stack is quarantined and cannot be started via '${command}'.`,
    "Use 'pnpm stack:canonical' for the supported web/api/worker topology.",
    "Legacy artifacts remain in the repository only for reference and controlled extraction."
  ].join("\n")
);

process.exit(1);
