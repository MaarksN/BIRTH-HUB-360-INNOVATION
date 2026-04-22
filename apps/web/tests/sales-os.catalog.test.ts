import assert from "node:assert/strict";
import test from "node:test";

import {
  findSalesOsTool,
  getSalesOsToolsByModule,
  SALES_OS_MODULES,
  salesOsTools
} from "../lib/sales-os/catalog";

void test("sales os catalog exposes every imported module and tool family", () => {
  assert.equal(SALES_OS_MODULES.length, 13);
  assert.ok(salesOsTools.length > 300);
  assert.ok(getSalesOsToolsByModule("sales").length > 20);
  assert.ok(getSalesOsToolsByModule("fintech").length > 20);
});

void test("sales os catalog preserves the imported canonical tools", () => {
  assert.equal(findSalesOsTool("bdr_summary")?.name, "Resumo Web");
  assert.equal(findSalesOsTool("roleplay_cfo")?.isChat, true);
  assert.equal(findSalesOsTool("gen_persona")?.isImage, true);
  assert.equal(findSalesOsTool("exec_boardprep_ai")?.modules[0], "exec");
  assert.equal(findSalesOsTool("fintech_sardrafter")?.name, "SARDrafter");
  assert.equal(findSalesOsTool("predictive_lead_scoring")?.modules[0], "presales");
});

