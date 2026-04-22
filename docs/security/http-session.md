# HTTP and session security

BirthHub hardens API and web responses through explicit headers, strict session
cookies and a documented rule for rich HTML/input rendering.

## API headers

The Express API applies `helmet` in `apps/api/src/app/core.ts` before route
handlers. The active policy includes:

- `Content-Security-Policy` with `default-src 'self'`, `base-uri 'self'`,
  `form-action 'self'`, `frame-ancestors 'none'` and `object-src 'none'`.
- `Strict-Transport-Security` with one year max age, subdomains and preload.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Resource-Policy: same-site`.
- `X-Powered-By` is disabled by Express.

The smoke test in `apps/api/tests/security.test.ts` asserts that these headers
are present on ordinary API responses.

## Web headers

The Next.js app configures global security headers in
`apps/web/next.config.mjs`:

- CSP is enforced outside development-like environments and runs in report-only
  mode by default during local/test/CI execution.
- HSTS, `nosniff`, `DENY` frame protection, strict referrer policy and a
  restrictive permissions policy are applied to every route.
- `poweredByHeader` is disabled to avoid framework fingerprinting.

The smoke test in `apps/web/tests/next-config.security.test.ts` verifies the
global header set and CSP invariants.

## Session cookies

Authentication cookies are issued only through
`apps/api/src/modules/auth/cookies.ts`.

- Session and refresh cookies are `HttpOnly`, `SameSite=Strict`, secure when
  production or `REQUIRE_SECURE_COOKIES=true`, and use `Priority=High`.
- The CSRF cookie remains readable by the browser for the double-submit flow,
  but keeps `SameSite=Strict`, secure transport and `Priority=Medium`.
- Cookie clearing uses the same domain/path/SameSite/secure attributes so logout
  and forced revocation remove the same browser scope that login creates.

## Rich input and HTML rendering

Runtime mutation payloads pass through API sanitization before task enqueueing.
For web rendering, any future use of rich HTML or `dangerouslySetInnerHTML` must
sanitize with `apps/web/lib/dompurify.ts` immediately before rendering and must
not render raw tenant/provider input directly. Current rich notes rendering in
the profile security page follows this rule.
