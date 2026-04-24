import assert from "node:assert/strict";
import test from "node:test";

import { redactUrlForLog } from "./http.js";

void test("redactUrlForLog masks sensitive query parameters and URL credentials", () => {
  const redacted = redactUrlForLog(
    "https://user:pass@example.com/path?access_token=abc123&api_secret=secret123&page=1"
  );

  assert.equal(
    redacted,
    "https://redacted:redacted@example.com/path?access_token=%5Bredacted%5D&api_secret=%5Bredacted%5D&page=1"
  );
});

void test("redactUrlForLog handles malformed URLs with a conservative fallback", () => {
  const redacted = redactUrlForLog("/relative/path?token=abc123&safe=value");

  assert.equal(redacted, "/relative/path?token=[redacted]&safe=value");
});
