import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExecutivePremiumAgentHref,
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  isExecutivePremiumPack,
  mergeExecutivePremiumInstallerOptions
} from "../lib/executive-premium";

void test("executive premium helpers build stable collection links", () => {
  assert.equal(EXECUTIVE_PREMIUM_COLLECTION_HREF, "/marketplace?tags=executive-premium");
  assert.equal(
    buildExecutivePremiumAgentHref("boardprep-ai-premium-pack"),
    "/marketplace?tags=executive-premium&agentId=boardprep-ai-premium-pack"
  );
});

void test("executive premium helpers dedupe installer options while preserving premium-first order", () => {
  const merged = mergeExecutivePremiumInstallerOptions(
    [
      {
        agent: {
          description: "Board prep",
          id: "boardprep-ai-premium-pack",
          name: "Board Prep"
        },
        tags: {
          domain: ["management"],
          level: ["suite"]
        }
      }
    ],
    [
      {
        agent: {
          description: "Board prep duplicate",
          id: "boardprep-ai-premium-pack",
          name: "Board Prep Duplicate"
        },
        tags: {
          domain: ["management"],
          level: ["suite"]
        }
      },
      {
        agent: {
          description: "Pricing optimizer",
          id: "pricing-optimizer-premium-pack",
          name: "Pricing Optimizer"
        },
        tags: {
          domain: ["finance"],
          level: ["suite"]
        }
      }
    ]
  );

  assert.deepEqual(merged, [
    {
      description: "Board prep",
      id: "boardprep-ai-premium-pack",
      name: "Board Prep"
    },
    {
      description: "Pricing optimizer",
      id: "pricing-optimizer-premium-pack",
      name: "Pricing Optimizer"
    }
  ]);
});

void test("executive premium helpers identify only canonical executive premium pack ids", () => {
  assert.equal(isExecutivePremiumPack("boardprep-ai-premium-pack"), true);
  assert.equal(isExecutivePremiumPack("pricing-optimizer-premium-pack"), true);
  assert.equal(isExecutivePremiumPack("generic-premium-pack"), false);
  assert.equal(isExecutivePremiumPack("boardprep-ai"), false);
});
