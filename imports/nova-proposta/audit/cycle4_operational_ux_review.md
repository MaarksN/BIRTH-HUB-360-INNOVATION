# Cycle 4 - Operational UX Review

Date: 2026-04-11

## Rating scale

- Critical: failure or ambiguity can cause security, support or data-isolation damage
- High: core operator flow works but still has trust or recovery gaps
- Medium: usable, but incomplete for production-grade supportability

## Reviewed flows

| Flow | Operational criticality | Current state | Main remaining gaps |
| --- | --- | --- | --- |
| Login and session bootstrap | Critical | Functional through same-origin auth proxy; request id propagated; MFA challenge can now be completed in the web UI | Still lacks end-to-end coverage and post-auth operator guidance beyond immediate success/error messaging. |
| Dashboard shell entry | Critical | SSR auth guard now blocks unauthenticated dashboard rendering | Forbidden-role UX is still redirect-based, with limited operator feedback. |
| Security sessions | Critical | Real session list, revoke and logout-all now hit live backend routes | No per-action loading state, no disable while pending, no confirmation for global logout, no rollback messaging on action failure. |
| Users admin | High | Filtering, suspend and delete are functionally wired through BFF | Missing explicit loading state, empty state, retry CTA and success feedback. |
| Team role management | High | Role updates are functionally wired through BFF | Affordances still depend on client-loaded role context; no row-level pending/error feedback. |
| Admin impersonation | Critical | Server-protected and functionally switches tenant context | No explicit audit receipt, no reversible "return to original tenant" UX, no confirmation step before privileged switch. |
| Profile security (MFA setup) | High | Setup and enable are now same-origin and operationally coherent | Still light on richer recovery and post-setup operator guidance. |
| API key administration | High | Create, rotate and revoke are now same-origin, with basic revoke confirmation | Confirmation/recovery UX is still browser-basic; no row-level audit evidence or richer mutation feedback. |
| Privacy settings | High | Consent, retention, export and delete-account flows are functionally backed by session-aware client calls | Destructive/regulated operations still need stronger progress, confirmation and evidence feedback. |
| Notifications/preferences | Medium | Stores now behave safely with anonymous and authenticated states | Surrounding UI remains partially legacy and typing debt remains high. |

## UX findings by severity

### Critical

1. Impersonation lacks an operator-grade confirmation and "return" path.
2. Session termination UX does not protect the operator from duplicate clicks or partial failures.
3. API key administration still has only a basic browser confirmation model for destructive revoke.

### High

1. Settings screens are now functional, but still thin on progress, success and retry states.
2. Users/team admin pages are operationally useful, but they still feel like control panels rather than robust admin workflows.
3. Some privileged pages still rely on local page logic for affordance control after server guard has admitted the user.

### Medium

1. Empty states are inconsistent across operational pages.
2. Action-level telemetry/feedback is still sparse in the UI.
3. Legacy typedness debt makes UX regressions harder to trust even when the screen renders.

## UX verdict

Cycle 4 improved operational truthfulness more than appearance, which was the correct priority. The hardened flows are now closer to "real SaaS operations" than "render-only demos". The next pass should not redesign the product; it should add stronger action-state discipline, an impersonation return flow and better operator feedback around destructive or privileged actions.
