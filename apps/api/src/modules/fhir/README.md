# FHIR Module Status

This module is preserved as an orphaned interoperability facade.

Current status:

- It is not mounted by the main API application.
- Its standalone router is disabled by default unless `fhirFacadeEnabled` is explicitly reintroduced.
- The current Prisma schema does not sustain the patient and appointment delegates required by this facade.

Reintroduction requirements:

- Restore the clinical domain and FHIR-facing schema support.
- Re-enable the product capability flags in API and web.
- Validate audit behavior, authentication and bundle responses before remounting routes.
