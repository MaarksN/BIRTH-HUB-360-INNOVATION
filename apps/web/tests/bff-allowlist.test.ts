import assert from "node:assert/strict";
import test from "node:test";

import { isBffPathAllowed } from "../app/api/bff/policy";

void test("BFF allowlist keeps only supported privacy self-service paths active by default", () => {
  assert.equal(isBffPathAllowed("api/v1/admin/users"), true);
  assert.equal(isBffPathAllowed("api/v1/apikeys"), true);
  assert.equal(isBffPathAllowed("api/v1/settings/webhooks"), true);
  assert.equal(isBffPathAllowed("api/v1/sessions"), true);
  assert.equal(isBffPathAllowed("api/v1/workflows"), true);
  assert.equal(isBffPathAllowed("api/v1/privacy/export"), true);
  assert.equal(isBffPathAllowed("api/v1/privacy/delete-account"), true);
  assert.equal(isBffPathAllowed("api/v1/privacy/consents"), false);
  assert.equal(isBffPathAllowed("api/v1/privacy/retention"), false);
  assert.equal(isBffPathAllowed("api/v1/privacy/retention/run"), false);
  assert.equal(isBffPathAllowed("api/v1/blocked/users"), false);
});

void test("BFF allowlist can re-enable advanced privacy prefixes behind an explicit capability override", () => {
  assert.equal(
    isBffPathAllowed("api/v1/privacy/consents", {
      clinicalWorkspaceEnabled: false,
      fhirFacadeEnabled: false,
      privacyAdvancedEnabled: true,
      privacySelfServiceEnabled: true
    }),
    true
  );
});
