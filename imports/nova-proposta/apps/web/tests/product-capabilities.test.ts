import assert from "node:assert/strict";
import test from "node:test";

import {
  getProductCapabilities,
  isDashboardNavigationItemEnabled,
  sanitizeCapabilityScopedLink
} from "../lib/product-capabilities";

void test("web product capabilities default to the supported product surface", () => {
  const capabilities = getProductCapabilities({
    NODE_ENV: "test",
    NEXT_PUBLIC_ENVIRONMENT: "development"
  });

  assert.equal(capabilities.clinicalWorkspaceEnabled, false);
  assert.equal(capabilities.fhirFacadeEnabled, false);
  assert.equal(capabilities.privacyAdvancedEnabled, false);
  assert.equal(capabilities.privacySelfServiceEnabled, true);
});

void test("dashboard navigation hides clinical entries while the workspace is disabled", () => {
  const capabilities = getProductCapabilities({
    NODE_ENV: "test",
    NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: "false",
    NEXT_PUBLIC_ENVIRONMENT: "development"
  });

  assert.equal(isDashboardNavigationItemEnabled("/dashboard", capabilities), true);
  assert.equal(isDashboardNavigationItemEnabled("/patients", capabilities), false);
  assert.equal(isDashboardNavigationItemEnabled("/appointments", capabilities), false);
  assert.equal(sanitizeCapabilityScopedLink("/patients/patient_1", capabilities), null);
  assert.equal(sanitizeCapabilityScopedLink("/appointments?view=week", capabilities), null);
  assert.equal(sanitizeCapabilityScopedLink("/notifications", capabilities), "/notifications");
});
