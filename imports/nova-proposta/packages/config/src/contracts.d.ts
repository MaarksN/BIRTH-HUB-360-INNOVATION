import { z } from "zod";
export declare const roleSchema: z.ZodEnum<{
    OWNER: "OWNER";
    ADMIN: "ADMIN";
    MEMBER: "MEMBER";
    READONLY: "READONLY";
}>;
export declare const userStatusSchema: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    SUSPENDED: "SUSPENDED";
}>;
export declare const apiKeyScopeSchema: z.ZodEnum<{
    "agents:read": "agents:read";
    "agents:write": "agents:write";
    "workflows:trigger": "workflows:trigger";
    "webhooks:receive": "webhooks:receive";
}>;
export declare const loginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    tenantId: z.ZodString;
}, z.core.$strip>;
export declare const mfaVerifyRequestSchema: z.ZodObject<{
    challengeToken: z.ZodString;
    recoveryCode: z.ZodOptional<z.ZodString>;
    totpCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const sessionSchema: z.ZodObject<{
    csrfToken: z.ZodString;
    expiresAt: z.ZodString;
    id: z.ZodString;
    refreshToken: z.ZodString;
    tenantId: z.ZodString;
    token: z.ZodString;
    userId: z.ZodString;
}, z.core.$strip>;
export declare const loginResponseSchema: z.ZodObject<{
    challengeExpiresAt: z.ZodOptional<z.ZodString>;
    challengeToken: z.ZodOptional<z.ZodString>;
    mfaRequired: z.ZodBoolean;
    requestId: z.ZodString;
    session: z.ZodOptional<z.ZodObject<{
        csrfToken: z.ZodString;
        expiresAt: z.ZodString;
        id: z.ZodString;
        refreshToken: z.ZodString;
        tenantId: z.ZodString;
        token: z.ZodString;
        userId: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const logoutResponseSchema: z.ZodObject<{
    requestId: z.ZodString;
    revokedSessions: z.ZodNumber;
}, z.core.$strip>;
export declare const refreshRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const refreshResponseSchema: z.ZodObject<{
    requestId: z.ZodString;
    session: z.ZodObject<{
        csrfToken: z.ZodString;
        expiresAt: z.ZodString;
        id: z.ZodString;
        refreshToken: z.ZodString;
        tenantId: z.ZodString;
        token: z.ZodString;
        userId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const cursorPaginationQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    take: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const createOrganizationRequestSchema: z.ZodObject<{
    adminEmail: z.ZodString;
    adminName: z.ZodString;
    adminPassword: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
}, z.core.$strip>;
export declare const createOrganizationResponseSchema: z.ZodObject<{
    organizationId: z.ZodString;
    ownerUserId: z.ZodString;
    requestId: z.ZodString;
    role: z.ZodLiteral<"OWNER">;
    slug: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createInviteRequestSchema: z.ZodObject<{
    email: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<{
        OWNER: "OWNER";
        ADMIN: "ADMIN";
        MEMBER: "MEMBER";
        READONLY: "READONLY";
    }>>;
}, z.core.$strip>;
export declare const acceptInviteRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    token: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const executionModeSchema: z.ZodEnum<{
    LIVE: "LIVE";
    DRY_RUN: "DRY_RUN";
}>;
export declare const taskTypeSchema: z.ZodEnum<{
    "sync-session": "sync-session";
    "send-welcome-email": "send-welcome-email";
    "refresh-health": "refresh-health";
}>;
export declare const taskRequestSchema: z.ZodObject<{
    agentId: z.ZodDefault<z.ZodString>;
    approvalRequired: z.ZodDefault<z.ZodBoolean>;
    estimatedCostBRL: z.ZodDefault<z.ZodNumber>;
    executionMode: z.ZodDefault<z.ZodEnum<{
        LIVE: "LIVE";
        DRY_RUN: "DRY_RUN";
    }>>;
    payload: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    type: z.ZodEnum<{
        "sync-session": "sync-session";
        "send-welcome-email": "send-welcome-email";
        "refresh-health": "refresh-health";
    }>;
}, z.core.$strip>;
export declare const jobContextSchema: z.ZodObject<{
    actorId: z.ZodString;
    jobId: z.ZodString;
    organizationId: z.ZodString;
    scopedAt: z.ZodString;
    tenantId: z.ZodString;
}, z.core.$strip>;
export declare const taskJobSchema: z.ZodObject<{
    agentId: z.ZodDefault<z.ZodString>;
    approvalRequired: z.ZodDefault<z.ZodBoolean>;
    context: z.ZodOptional<z.ZodObject<{
        actorId: z.ZodString;
        jobId: z.ZodString;
        organizationId: z.ZodString;
        scopedAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.core.$strip>>;
    estimatedCostBRL: z.ZodDefault<z.ZodNumber>;
    executionMode: z.ZodDefault<z.ZodEnum<{
        LIVE: "LIVE";
        DRY_RUN: "DRY_RUN";
    }>>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    requestId: z.ZodString;
    signature: z.ZodDefault<z.ZodString>;
    tenantId: z.ZodNullable<z.ZodString>;
    type: z.ZodEnum<{
        "sync-session": "sync-session";
        "send-welcome-email": "send-welcome-email";
        "refresh-health": "refresh-health";
    }>;
    userId: z.ZodNullable<z.ZodString>;
    version: z.ZodLiteral<"1">;
}, z.core.$strip>;
export declare const taskEnqueuedResponseSchema: z.ZodObject<{
    jobId: z.ZodString;
    requestId: z.ZodString;
}, z.core.$strip>;
export declare const healthResponseSchema: z.ZodObject<{
    checkedAt: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<{
        liveness: "liveness";
        readiness: "readiness";
        deep: "deep";
    }>>;
    services: z.ZodObject<{
        database: z.ZodObject<{
            latencyMs: z.ZodOptional<z.ZodNumber>;
            message: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<{
                up: "up";
                degraded: "degraded";
                down: "down";
            }>;
            strict: z.ZodOptional<z.ZodBoolean>;
            thresholdMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        externalDependencies: z.ZodArray<z.ZodObject<{
            latencyMs: z.ZodOptional<z.ZodNumber>;
            name: z.ZodString;
            message: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<{
                up: "up";
                degraded: "degraded";
                down: "down";
            }>;
            strict: z.ZodOptional<z.ZodBoolean>;
            thresholdMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        redis: z.ZodObject<{
            latencyMs: z.ZodOptional<z.ZodNumber>;
            message: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<{
                up: "up";
                degraded: "degraded";
                down: "down";
            }>;
            strict: z.ZodOptional<z.ZodBoolean>;
            thresholdMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    status: z.ZodEnum<{
        degraded: "degraded";
        ok: "ok";
    }>;
}, z.core.$strip>;
export declare const authIntrospectionResponseSchema: z.ZodObject<{
    active: z.ZodBoolean;
    requestId: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<{
        "agents:read": "agents:read";
        "agents:write": "agents:write";
        "workflows:trigger": "workflows:trigger";
        "webhooks:receive": "webhooks:receive";
    }>>;
    tenantId: z.ZodNullable<z.ZodString>;
    userId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const apiKeyCreateRequestSchema: z.ZodObject<{
    label: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<{
        "agents:read": "agents:read";
        "agents:write": "agents:write";
        "workflows:trigger": "workflows:trigger";
        "webhooks:receive": "webhooks:receive";
    }>>;
}, z.core.$strip>;
export declare const apiKeyCreateResponseSchema: z.ZodObject<{
    apiKey: z.ZodString;
    id: z.ZodString;
    requestId: z.ZodString;
}, z.core.$strip>;
export declare const apiKeyListItemSchema: z.ZodObject<{
    createdAt: z.ZodString;
    id: z.ZodString;
    label: z.ZodString;
    last4: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<{
        "agents:read": "agents:read";
        "agents:write": "agents:write";
        "workflows:trigger": "workflows:trigger";
        "webhooks:receive": "webhooks:receive";
    }>>;
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        REVOKED: "REVOKED";
    }>;
}, z.core.$strip>;
export declare const apiKeyListResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        createdAt: z.ZodString;
        id: z.ZodString;
        label: z.ZodString;
        last4: z.ZodString;
        scopes: z.ZodArray<z.ZodEnum<{
            "agents:read": "agents:read";
            "agents:write": "agents:write";
            "workflows:trigger": "workflows:trigger";
            "webhooks:receive": "webhooks:receive";
        }>>;
        status: z.ZodEnum<{
            ACTIVE: "ACTIVE";
            REVOKED: "REVOKED";
        }>;
    }, z.core.$strip>>;
    requestId: z.ZodString;
}, z.core.$strip>;
export declare const sessionListItemSchema: z.ZodObject<{
    id: z.ZodString;
    ipAddress: z.ZodNullable<z.ZodString>;
    lastActivityAt: z.ZodString;
    userAgent: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const sessionListResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ipAddress: z.ZodNullable<z.ZodString>;
        lastActivityAt: z.ZodString;
        userAgent: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    requestId: z.ZodString;
}, z.core.$strip>;
export declare const roleUpdateRequestSchema: z.ZodObject<{
    role: z.ZodEnum<{
        OWNER: "OWNER";
        ADMIN: "ADMIN";
        MEMBER: "MEMBER";
        READONLY: "READONLY";
    }>;
}, z.core.$strip>;
export declare const userListQuerySchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<{
        OWNER: "OWNER";
        ADMIN: "ADMIN";
        MEMBER: "MEMBER";
        READONLY: "READONLY";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
    }>>;
}, z.core.$strip>;
export declare const privacyDeleteRequestSchema: z.ZodObject<{
    confirmationText: z.ZodString;
}, z.core.$strip>;
export declare const privacyDeleteResponseSchema: z.ZodObject<{
    anonymizedEmail: z.ZodString;
    billingCancelled: z.ZodBoolean;
    requestId: z.ZodString;
}, z.core.$strip>;
