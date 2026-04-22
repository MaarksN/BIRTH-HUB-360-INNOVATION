import assert from "node:assert/strict";
import test from "node:test";

import {
  getGlobalSearchCopy,
  getLocalSearchShortcuts,
  mergeGlobalSearchGroups
} from "../lib/global-search";

void test("global search copy localizes shortcuts and placeholder text", () => {
  const pt = getGlobalSearchCopy("pt-BR");
  const en = getGlobalSearchCopy("en-US");

  assert.equal(pt.shortcutsLabel, "Atalhos");
  assert.match(pt.placeholder, /premium/i);
  assert.equal(en.shortcutsLabel, "Shortcuts");
  assert.match(en.placeholder, /notifications/i);
});

void test("global search shortcuts expose premium compare, packs, and SDR workflows in both locales", () => {
  const pt = getLocalSearchShortcuts("pt-BR");
  const en = getLocalSearchShortcuts("en-US");

  assert.deepEqual(
    pt.map((item) => item.href),
    [
      "/marketplace",
      "/marketplace?tags=executive-premium",
      "/marketplace/compare",
      "/packs",
      "/agents",
      "/agents/chatbook-inteligentissimo",
      "/sales-os",
      "/sales-os/sdr-automatico"
    ]
  );
  assert.deepEqual(
    en.map((item) => item.href),
    [
      "/marketplace",
      "/marketplace?tags=executive-premium",
      "/marketplace/compare",
      "/packs",
      "/agents",
      "/agents/chatbook-inteligentissimo",
      "/sales-os",
      "/sales-os/sdr-automatico"
    ]
  );
  assert.match(pt[1]?.subtitle ?? "", /14 camadas premium/i);
  assert.match(en[1]?.subtitle ?? "", /14 premium layers/i);
  assert.match(pt[5]?.subtitle ?? "", /voz/i);
  assert.match(en[5]?.subtitle ?? "", /voice/i);
  assert.match(pt[7]?.subtitle ?? "", /handoff premium/i);
  assert.match(en[7]?.subtitle ?? "", /premium handoff/i);
});

void test("global search merge preserves backend shortcuts and appends premium shortcuts without duplicates", () => {
  const merged = mergeGlobalSearchGroups({
    groups: [
      {
        id: "shortcuts",
        items: [
          {
            href: "/sales-os",
            id: "backend-sales-os",
            subtitle: "Server-side shortcut",
            title: "Sales OS",
            type: "shortcut"
          }
        ],
        label: "Atalhos"
      },
      {
        id: "reports",
        items: [],
        label: "Reports"
      }
    ],
    locale: "pt-BR",
    query: "premium"
  });

  assert.equal(merged[0]?.id, "shortcuts");
  assert.equal(merged[0]?.items.length, 7);
  assert.equal(merged[0]?.items[0]?.href, "/sales-os");
  assert.equal(merged[0]?.items[1]?.href, "/marketplace");
  assert.equal(merged[0]?.items[2]?.href, "/marketplace?tags=executive-premium");
  assert.equal(merged[0]?.items[3]?.href, "/marketplace/compare");
  assert.equal(merged[0]?.items[4]?.href, "/packs");
  assert.equal(merged[0]?.items[5]?.href, "/agents");
  assert.equal(merged[0]?.items[6]?.href, "/sales-os/sdr-automatico");
  assert.equal(merged[1]?.id, "reports");
});
