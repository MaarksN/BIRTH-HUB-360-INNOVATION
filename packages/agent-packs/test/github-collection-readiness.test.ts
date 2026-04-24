import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  REQUIRED_RUNTIME_PROMPT_SECTION_GROUPS,
  isInstallableManifest,
  loadManifestCatalog
} from "@birthub/agents-core";

void test("official installable packs keep the required readiness contract", async () => {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(currentFile), "..");
  const collectionRoot = path.join(packageRoot, "corporate-v1");
  const catalog = await loadManifestCatalog(collectionRoot);
  const installableEntries = catalog.filter((entry) => isInstallableManifest(entry.manifest));

  assert.ok(installableEntries.length > 0, "Expected installable manifests in the official collection.");

  for (const entry of installableEntries) {
    const { manifest } = entry;

    assert.ok(manifest.skills.length > 0, `${manifest.agent.id} must declare at least one skill.`);
    assert.ok(manifest.tools.length > 0, `${manifest.agent.id} must declare at least one tool.`);
    assert.ok(manifest.policies.length > 0, `${manifest.agent.id} must declare at least one policy.`);

    for (const sectionGroup of REQUIRED_RUNTIME_PROMPT_SECTION_GROUPS) {
      assert.ok(
        sectionGroup.anyOf.some((section) => manifest.agent.prompt.includes(section)),
        `${manifest.agent.id} is missing prompt section '${sectionGroup.label}'.`
      );
    }
  }
});
