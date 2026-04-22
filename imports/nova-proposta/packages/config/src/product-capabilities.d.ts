export declare const apiProductCapabilityEnvSchema: {
    readonly BIRTHUB_ENABLE_CLINICAL_WORKSPACE: import("zod").ZodDefault<import("zod").ZodPipe<import("zod").ZodTransform<unknown, unknown>, import("zod").ZodBoolean>>;
    readonly BIRTHUB_ENABLE_FHIR_FACADE: import("zod").ZodDefault<import("zod").ZodPipe<import("zod").ZodTransform<unknown, unknown>, import("zod").ZodBoolean>>;
    readonly BIRTHUB_ENABLE_PRIVACY_ADVANCED: import("zod").ZodDefault<import("zod").ZodPipe<import("zod").ZodTransform<unknown, unknown>, import("zod").ZodBoolean>>;
    readonly BIRTHUB_ENABLE_PRIVACY_SELF_SERVICE: import("zod").ZodDefault<import("zod").ZodPipe<import("zod").ZodTransform<unknown, unknown>, import("zod").ZodBoolean>>;
};
export declare const webProductCapabilityEnvSchema: {
    readonly NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: import("zod").ZodDefault<import("zod").ZodPipe<import("zod").ZodTransform<unknown, unknown>, import("zod").ZodBoolean>>;
    readonly NEXT_PUBLIC_ENABLE_FHIR_FACADE: import("zod").ZodDefault<import("zod").ZodPipe<import("zod").ZodTransform<unknown, unknown>, import("zod").ZodBoolean>>;
    readonly NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED: import("zod").ZodDefault<import("zod").ZodPipe<import("zod").ZodTransform<unknown, unknown>, import("zod").ZodBoolean>>;
    readonly NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE: import("zod").ZodDefault<import("zod").ZodPipe<import("zod").ZodTransform<unknown, unknown>, import("zod").ZodBoolean>>;
};
export type ProductCapabilities = {
    clinicalWorkspaceEnabled: boolean;
    fhirFacadeEnabled: boolean;
    privacyAdvancedEnabled: boolean;
    privacySelfServiceEnabled: boolean;
};
export declare function mapApiProductCapabilities(input: {
    BIRTHUB_ENABLE_CLINICAL_WORKSPACE: boolean;
    BIRTHUB_ENABLE_FHIR_FACADE: boolean;
    BIRTHUB_ENABLE_PRIVACY_ADVANCED: boolean;
    BIRTHUB_ENABLE_PRIVACY_SELF_SERVICE: boolean;
}): ProductCapabilities;
export declare function mapWebProductCapabilities(input: {
    NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: boolean;
    NEXT_PUBLIC_ENABLE_FHIR_FACADE: boolean;
    NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED: boolean;
    NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE: boolean;
}): ProductCapabilities;
