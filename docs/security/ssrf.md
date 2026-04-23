# Server-Side Request Forgery (SSRF) Protections

This document outlines the protections applied to prevent SSRF across BirthHub 360's runtime.

## Protections Implemented

SSRF protections are enforced on dynamic outbound requests. Specifically, integrations and workflows that execute outbound webhooks and HTTP requests are verified via an `assertSafeUrl` function:

1. **Host/IP Denylist**: The following local and loopback addresses are blocked to prevent internal network scanning:
   - `localhost`
   - `0.0.0.0`
   - `127.0.0.1`
   - `::1`
   - `host.docker.internal`

2. **Internal Domain Blocking**: Any domain ending in `.internal` is blocked to prevent requests hitting internal cluster services or orchestration mechanisms (e.g. Kubernetes core DNS).

3. **Protocol Allowlist**: Only the `http:` and `https:` protocols are permitted. This mitigates risks involving file reading or executing unintended schemes such as `file:`, `ftp:`, `gopher:`, etc.

## Where Protections are Applied

- **Workflow `httpRequest` Node:** Validates the dynamic URL provided by users via the `assertSafeUrl` helper before instantiating the HTTP request (see `packages/workflows-core/src/nodes/httpRequest.ts`).
- **Outbound Webhooks:** Any user-configured webhook endpoint URL is validated via the same strict set of rules to prevent webhooks pointing to internal network assets (see `apps/worker/src/webhooks/outbound.ts`).
