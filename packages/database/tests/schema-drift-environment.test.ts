import assert from "node:assert/strict";
import test from "node:test";

import {
  getSchemaDriftEnvironment,
  shouldRequireSchemaDriftEvidence
} from "../scripts/lib/env.js";

void test("schema drift environment trims configured URLs", () => {
  const environment = getSchemaDriftEnvironment({
    DATABASE_URL: "  postgresql://db.example/birthub  ",
    SHADOW_DATABASE_URL: "  postgresql://shadow.example/birthub  "
  });

  assert.deepEqual(environment, {
    databaseUrl: "postgresql://db.example/birthub",
    shadowDatabaseUrl: "postgresql://shadow.example/birthub"
  });
});

void test("schema drift environment treats blank URLs as undefined", () => {
  const environment = getSchemaDriftEnvironment({
    DATABASE_URL: "   ",
    SHADOW_DATABASE_URL: ""
  });

  assert.deepEqual(environment, {
    databaseUrl: undefined,
    shadowDatabaseUrl: undefined
  });
});

void test("schema drift environment reads the official evidence gate flag", () => {
  assert.equal(
    shouldRequireSchemaDriftEvidence({
      BIRTHUB_REQUIRE_SCHEMA_DRIFT_EVIDENCE: "true"
    }),
    true
  );
  assert.equal(
    shouldRequireSchemaDriftEvidence({
      BIRTHUB_REQUIRE_SCHEMA_DRIFT_EVIDENCE: "off"
    }),
    false
  );
});
