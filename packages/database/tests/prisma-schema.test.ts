import assert from "node:assert/strict";
import test from "node:test";

import { parsePrismaSchema } from "../scripts/lib/prisma-schema.js";

void test("parsePrismaSchema captures model-level indexes and uniques without dynamic regex parsing", async () => {
  const models = await parsePrismaSchema();
  const userPreference = models.find((model) => model.name === "UserPreference");

  assert.ok(userPreference);
  assert.ok(userPreference.indexes.some((fields) => fields.join(",") === "tenantId"));
  assert.ok(userPreference.indexes.some((fields) => fields.join(",") === "tenantId,userId"));
  assert.ok(userPreference.uniques.some((fields) => fields.join(",") === "organizationId,userId"));
});
