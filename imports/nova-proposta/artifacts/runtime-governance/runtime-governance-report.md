# Runtime Governance Report

Generated at: 2026-04-19T20:25:26.988Z

| Check | Status | Details |
| --- | --- | --- |
| source-of-truth-exists:apps/api/src/app.ts | PASS | {"path":"apps/api/src/app.ts"} |
| source-of-truth-exists:apps/api/src/app/core.ts | PASS | {"path":"apps/api/src/app/core.ts"} |
| source-of-truth-exists:apps/api/src/app/module-routes.ts | PASS | {"path":"apps/api/src/app/module-routes.ts"} |
| compat-surface-exists:apps/api/src/app/auth-routes.ts | PASS | {"classification":"compat-only","path":"apps/api/src/app/auth-routes.ts"} |
| compat-surface-exists:apps/api/src/app/auth-and-core-routes.ts | PASS | {"classification":"compat-only","path":"apps/api/src/app/auth-and-core-routes.ts"} |
| parked-surface-exists:apps/api/src/modules/clinical/router.ts | PASS | {"classification":"not-mounted/parked","path":"apps/api/src/modules/clinical/router.ts"} |
| parked-surface-exists:apps/api/src/modules/fhir/router.ts | PASS | {"classification":"not-mounted/parked","path":"apps/api/src/modules/fhir/router.ts"} |
| compat-not-in-source-of-truth:apps/api/src/app/auth-routes.ts | PASS | {"leakingFiles":[],"marker":"app/auth-routes","path":"apps/api/src/app/auth-routes.ts"} |
| compat-not-in-source-of-truth:apps/api/src/app/auth-and-core-routes.ts | PASS | {"leakingFiles":[],"marker":"app/auth-and-core-routes","path":"apps/api/src/app/auth-and-core-routes.ts"} |
| parked-not-mounted:apps/api/src/modules/clinical/router.ts | PASS | {"leakingFiles":[],"marker":"modules/clinical/router","path":"apps/api/src/modules/clinical/router.ts"} |
| parked-not-mounted:apps/api/src/modules/fhir/router.ts | PASS | {"leakingFiles":[],"marker":"modules/fhir/router","path":"apps/api/src/modules/fhir/router.ts"} |
| app-composition-uses-module-routes | PASS | {"path":"apps/api/src/app.ts"} |
| app-composition-uses-operational-routes | PASS | {"path":"apps/api/src/app.ts"} |
| app-composition-uses-error-pipeline | PASS | {"path":"apps/api/src/app.ts"} |
| module-routes-does-not-mount-clinical-or-fhir | PASS | {"path":"apps/api/src/app/module-routes.ts"} |
