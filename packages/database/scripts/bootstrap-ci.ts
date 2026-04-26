// 
import { schemaPath } from "./lib/paths.js";
import { createScriptRuntime } from "./lib/runtime.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-bootstrap-ci");
const runtime = createScriptRuntime({
  logger,
  name: "db-bootstrap-ci"
});

void runtime.run(async () => {
  runtime.requireEnv("DATABASE_URL");

  await runtime.runPrismaStep("prisma migrate deploy", [
    "migrate",
    "deploy",
    "--schema",
    schemaPath
  ], { type: "migrate" });
  await runtime.runNodeScriptStep(
    "provision rls runtime role",
    "provision-rls-runtime-role.ts",
    { type: "infra" }
  );
});
