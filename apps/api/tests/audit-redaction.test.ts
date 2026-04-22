import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeAuditValue } from "../src/audit/auditable.js";

void test("audit sanitizer redacts nested secret material while keeping operational fields", () => {
  const sanitized = sanitizeAuditValue({
    connector: {
      credentials: {
        accessToken: "access_secret",
        refreshToken: "refresh_secret"
      },
      id: "conn_1",
      provider: "hubspot",
      status: "active"
    },
    headers: {
      authorization: "Bearer secret",
      requestId: "req_1"
    },
    metadata: {
      region: "br"
    },
    password: "p@ssw0rd",
    webhookSignature: "t=1,v1=sig"
  });

  assert.deepEqual(sanitized, {
    connector: {
      credentials: "[REDACTED]",
      id: "conn_1",
      provider: "hubspot",
      status: "active"
    },
    headers: {
      authorization: "[REDACTED]",
      requestId: "req_1"
    },
    metadata: {
      region: "br"
    },
    password: "[REDACTED]",
    webhookSignature: "[REDACTED]"
  });
});
