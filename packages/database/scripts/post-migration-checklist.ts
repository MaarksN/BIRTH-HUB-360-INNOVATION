// 
import { createScriptRuntime } from "./lib/runtime.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-post-migration-checklist");
const runtime = createScriptRuntime({
  logger,
  name: "db-post-migration-checklist"
});

void runtime.run(async () => {
  for (const script of [
    "check-migration-governance.ts",
    "compare-migration-state.ts",
    "check-schema-drift.ts",
    "check-tenancy-controls.ts",
    "check-fk-indexes.ts",
    "check-raw-query-joins.ts",
    "check-referential-integrity.ts",
    "analyze-performance.ts"
  ]) {
    await runtime.runNodeScriptStep(`run ${script}`, script, { type: "check" });
  }
});
