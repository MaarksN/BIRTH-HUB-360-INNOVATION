import { envBoolean } from "./shared.js";

export const apiProductCapabilityEnvSchema = {
  BIRTHUB_ENABLE_CLINICAL_WORKSPACE: envBoolean.default(false),
  BIRTHUB_ENABLE_FHIR_FACADE: envBoolean.default(false),
  BIRTHUB_ENABLE_PRIVACY_ADVANCED: envBoolean.default(false),
  BIRTHUB_ENABLE_PRIVACY_SELF_SERVICE: envBoolean.default(true)
} as const;

export const webProductCapabilityEnvSchema = {
  // Clinical remains preserved outside the active product unless explicitly re-enabled for controlled evaluation.
  NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: envBoolean.default(false),
  NEXT_PUBLIC_ENABLE_FHIR_FACADE: envBoolean.default(false),
  NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED: envBoolean.default(false),
  NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE: envBoolean.default(true)
} as const;

export type ProductCapabilities = {
  // This flag unlocks a preserved surface for controlled evaluation; it does not make clinical part of the default product path.
  clinicalWorkspaceEnabled: boolean;
  fhirFacadeEnabled: boolean;
  privacyAdvancedEnabled: boolean;
  privacySelfServiceEnabled: boolean;
};

export function mapApiProductCapabilities(input: {
  BIRTHUB_ENABLE_CLINICAL_WORKSPACE: boolean;
  BIRTHUB_ENABLE_FHIR_FACADE: boolean;
  BIRTHUB_ENABLE_PRIVACY_ADVANCED: boolean;
  BIRTHUB_ENABLE_PRIVACY_SELF_SERVICE: boolean;
}): ProductCapabilities {
  return {
    clinicalWorkspaceEnabled: input.BIRTHUB_ENABLE_CLINICAL_WORKSPACE,
    fhirFacadeEnabled: input.BIRTHUB_ENABLE_FHIR_FACADE,
    privacyAdvancedEnabled: input.BIRTHUB_ENABLE_PRIVACY_ADVANCED,
    privacySelfServiceEnabled: input.BIRTHUB_ENABLE_PRIVACY_SELF_SERVICE
  };
}

export function mapWebProductCapabilities(input: {
  NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: boolean;
  NEXT_PUBLIC_ENABLE_FHIR_FACADE: boolean;
  NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED: boolean;
  NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE: boolean;
}): ProductCapabilities {
  return {
    clinicalWorkspaceEnabled: input.NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE,
    fhirFacadeEnabled: input.NEXT_PUBLIC_ENABLE_FHIR_FACADE,
    privacyAdvancedEnabled: input.NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED,
    privacySelfServiceEnabled: input.NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE
  };
}
