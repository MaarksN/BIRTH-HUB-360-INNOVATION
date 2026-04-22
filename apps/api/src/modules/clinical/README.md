# Clinical Module Status

This module is preserved as an orphaned clinical domain implementation.

Current status:

- It is not mounted by the main API application.
- Its standalone router is disabled by default unless `clinicalWorkspaceEnabled` is explicitly reintroduced.
- The current Prisma schema does not sustain the clinical runtime delegates required by this module.

Reintroduction requirements:

- Restore the clinical Prisma models and runtime delegates.
- Re-enable the product capability flags in API and web.
- Reconnect navigation, dashboard, BFF and end-to-end tests before remounting routes.
