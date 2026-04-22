# Legacy Dashboard Quarantine

This directory is preserved only as historical reference for the migration away from the legacy dashboard stack.

All executable runtime files were removed from this directory on 2026-04-09. The repository keeps only this marker so the quarantine stays explicit in the canonical workspace and documentation.

Do not use it as an active runtime path:

- `pnpm dev:legacy` is blocked on purpose
- `pnpm stack:hybrid` is blocked on purpose
- the supported local topology is `pnpm stack:canonical`

If any asset from this folder is still needed, extract it deliberately into the canonical stack and document the migration in the owning cycle notes.
