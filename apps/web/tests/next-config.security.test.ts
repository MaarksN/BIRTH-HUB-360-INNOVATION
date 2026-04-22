import assert from "node:assert/strict";
import test from "node:test";

type Header = {
  key: string;
  value: string;
};

type HeaderRoute = {
  headers: Header[];
  source: string;
};

type NextConfigLike = {
  headers: () => Promise<HeaderRoute[]>;
  poweredByHeader?: boolean;
};

void test("Next config applies security headers and disables framework fingerprinting", async () => {
  const nextConfigModule = (await import(new URL("../next.config.mjs", import.meta.url).href)) as {
    default: NextConfigLike;
  };
  const nextConfig = nextConfigModule.default;
  const routes = await nextConfig.headers();
  const globalHeaders = routes.find((route) => route.source === "/(.*)");
  assert.ok(globalHeaders);

  const headers = new Map(globalHeaders.headers.map((header) => [header.key, header.value]));
  const csp =
    headers.get("Content-Security-Policy") ??
    headers.get("Content-Security-Policy-Report-Only");

  assert.equal(nextConfig.poweredByHeader, false);
  assert.equal(headers.get("Strict-Transport-Security"), "max-age=63072000; includeSubDomains; preload");
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(headers.get("X-Frame-Options"), "DENY");
  assert.equal(headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.match(headers.get("Permissions-Policy") ?? "", /camera=\(\)/);
  assert.match(csp ?? "", /default-src 'self'/);
  assert.match(csp ?? "", /frame-ancestors 'none'/);
  assert.match(csp ?? "", /object-src 'none'/);
  assert.match(csp ?? "", /form-action 'self'/);
});
