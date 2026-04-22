import {
  apiKeyCreateRequestSchema,
  apiKeyCreateResponseSchema,
  apiKeyListResponseSchema,
  acceptInviteRequestSchema,
  authIntrospectionResponseSchema,
  createOrganizationRequestSchema,
  createOrganizationResponseSchema,
  createInviteRequestSchema,
  loginRequestSchema,
  loginResponseSchema,
  logoutResponseSchema,
  mfaVerifyRequestSchema,
  privacyDeleteRequestSchema,
  privacyDeleteResponseSchema,
  refreshRequestSchema,
  refreshResponseSchema,
  roleSchema,
  sessionListResponseSchema,
  taskEnqueuedResponseSchema,
  taskRequestSchema
} from "@birthub/config";
import { z } from "zod";

type JsonSchema = Record<string, unknown>;
type OpenApiDocument = {
  components: {
    schemas: Record<string, JsonSchema>;
  };
  info: {
    description: string;
    title: string;
    version: string;
  };
  jsonSchemaDialect: string;
  openapi: string;
  paths: Record<string, JsonSchema>;
  servers: Array<{
    url: string;
  }>;
};

const problemDetailsSchema = z.object({
  detail: z.string(),
  errors: z.unknown().optional(),
  instance: z.string(),
  status: z.number().int(),
  title: z.string(),
  type: z.string()
});

const enableMfaRequestSchema = z.object({
  totpCode: z.string().regex(/^\d{6}$/)
});

const enableMfaResponseSchema = z.object({
  enabled: z.literal(true),
  requestId: z.string()
});

const mfaSetupResponseSchema = z.object({
  otpauthUrl: z.string(),
  qrCodeDataUrl: z.string(),
  recoveryCodes: z.array(z.string())
});

const profileResponseSchema = z.object({
  plan: z.object({
    code: z.string(),
    creditBalanceCents: z.number().int().nonnegative(),
    currentPeriodEnd: z.string().datetime(),
    hardLocked: z.boolean(),
    isPaid: z.boolean(),
    isWithinGracePeriod: z.boolean(),
    name: z.string(),
    secondsUntilHardLock: z.number().int().nullable(),
    status: z.string()
  }),
  plan_status: z.object({
    code: z.string(),
    hardLocked: z.boolean(),
    isWithinGracePeriod: z.boolean(),
    status: z.string()
  }),
  requestId: z.string(),
  user: z.object({
    id: z.string(),
    organizationId: z.string(),
    role: roleSchema,
    tenantId: z.string()
  })
});

const apiKeyRevocationResponseSchema = z.object({
  requestId: z.string(),
  revoked: z.literal(true)
});

const inviteStatusSchema = z.enum(["PENDING", "ACCEPTED", "REVOKED"]);

const inviteResponseSchema = z.object({
  acceptedAt: z.string().datetime().nullable().optional(),
  email: z.string().email(),
  expiresAt: z.string().datetime(),
  id: z.string(),
  invitedByUserId: z.string().nullable().optional(),
  organizationId: z.string(),
  revokedAt: z.string().datetime().nullable().optional(),
  role: roleSchema,
  status: inviteStatusSchema,
  tenantId: z.string(),
  token: z.string()
});

const inviteListResponseSchema = z.object({
  items: z.array(inviteResponseSchema),
  nextCursor: z.string().nullable()
});

const inviteAcceptanceResponseSchema = z.object({
  membershipId: z.string(),
  tenantId: z.string(),
  userId: z.string()
});

const notificationTypeSchema = z.enum([
  "INFO",
  "SUCCESS",
  "WARNING",
  "FAILED",
  "WORKFLOW_COMPLETED",
  "CRITICAL_ERROR",
  "AGENT_FAILED",
  "CHURN_RISK"
]);

const cookieConsentStatusSchema = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);

const notificationPreferencesSchema = z
  .object({
    cookieConsent: cookieConsentStatusSchema.optional(),
    emailNotifications: z.boolean().optional(),
    inAppNotifications: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    pushNotifications: z.boolean().optional()
  })
  .strict();

const notificationItemSchema = z.object({
  content: z.string(),
  createdAt: z.string().datetime(),
  id: z.string(),
  isRead: z.boolean(),
  link: z.string().nullable(),
  metadata: z.unknown().nullable().optional(),
  organizationId: z.string(),
  readAt: z.string().datetime().nullable(),
  tenantId: z.string(),
  type: notificationTypeSchema,
  updatedAt: z.string().datetime(),
  userId: z.string()
});

const notificationFeedResponseSchema = z.object({
  items: z.array(notificationItemSchema),
  nextCursor: z.string().nullable(),
  requestId: z.string(),
  unreadCount: z.number().int().nonnegative()
});

const notificationReadResponseSchema = z.object({
  readCount: z.number().int().nonnegative(),
  requestId: z.string()
});

const userPreferenceSchema = z.object({
  cookieConsent: cookieConsentStatusSchema,
  createdAt: z.string().datetime(),
  emailNotifications: z.boolean(),
  id: z.string(),
  inAppNotifications: z.boolean(),
  locale: z.string(),
  marketingEmails: z.boolean(),
  organizationId: z.string(),
  pushNotifications: z.boolean(),
  tenantId: z.string(),
  updatedAt: z.string().datetime(),
  userId: z.string()
});

const notificationPreferencesResponseSchema = z.object({
  preferences: userPreferenceSchema,
  requestId: z.string()
});

function normalizeJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonSchema(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "$schema")
        .map(([key, nestedValue]) => [key, normalizeJsonSchema(nestedValue)])
    );
  }

  return value;
}

function toOpenApiSchema(schema: z.ZodTypeAny): JsonSchema {
  return normalizeJsonSchema(z.toJSONSchema(schema)) as JsonSchema;
}

function schemaRef(name: string): JsonSchema {
  return {
    $ref: `#/components/schemas/${name}`
  };
}

function jsonRequestBody(schemaName: string, description: string, required = true): JsonSchema {
  return {
    content: {
      "application/json": {
        schema: schemaRef(schemaName)
      }
    },
    description,
    required
  };
}

function jsonResponse(description: string, schemaName: string): JsonSchema {
  return {
    content: {
      "application/json": {
        schema: schemaRef(schemaName)
      }
    },
    description
  };
}

function problemResponse(description: string): JsonSchema {
  return {
    content: {
      "application/json": {
        schema: schemaRef("ProblemDetails")
      }
    },
    description
  };
}

const componentSchemas = {
  ApiKeyCreateRequest: toOpenApiSchema(apiKeyCreateRequestSchema),
  ApiKeyCreateResponse: toOpenApiSchema(apiKeyCreateResponseSchema),
  ApiKeyListResponse: toOpenApiSchema(apiKeyListResponseSchema),
  ApiKeyRevocationResponse: toOpenApiSchema(apiKeyRevocationResponseSchema),
  AcceptInviteRequest: toOpenApiSchema(acceptInviteRequestSchema),
  AuthIntrospectionResponse: toOpenApiSchema(authIntrospectionResponseSchema),
  CreateOrganizationRequest: toOpenApiSchema(createOrganizationRequestSchema),
  CreateOrganizationResponse: toOpenApiSchema(createOrganizationResponseSchema),
  CreateInviteRequest: toOpenApiSchema(createInviteRequestSchema),
  EnableMfaRequest: toOpenApiSchema(enableMfaRequestSchema),
  EnableMfaResponse: toOpenApiSchema(enableMfaResponseSchema),
  InviteAcceptanceResponse: toOpenApiSchema(inviteAcceptanceResponseSchema),
  InviteListResponse: toOpenApiSchema(inviteListResponseSchema),
  InviteResponse: toOpenApiSchema(inviteResponseSchema),
  LoginRequest: toOpenApiSchema(loginRequestSchema),
  LoginResponse: toOpenApiSchema(loginResponseSchema),
  LogoutResponse: toOpenApiSchema(logoutResponseSchema),
  MfaSetupResponse: toOpenApiSchema(mfaSetupResponseSchema),
  MfaVerifyRequest: toOpenApiSchema(mfaVerifyRequestSchema),
  NotificationFeedResponse: toOpenApiSchema(notificationFeedResponseSchema),
  NotificationItem: toOpenApiSchema(notificationItemSchema),
  NotificationPreferencesRequest: toOpenApiSchema(notificationPreferencesSchema),
  NotificationPreferencesResponse: toOpenApiSchema(notificationPreferencesResponseSchema),
  NotificationReadResponse: toOpenApiSchema(notificationReadResponseSchema),
  ProblemDetails: toOpenApiSchema(problemDetailsSchema),
  ProfileResponse: toOpenApiSchema(profileResponseSchema),
  PrivacyDeleteRequest: toOpenApiSchema(privacyDeleteRequestSchema),
  PrivacyDeleteResponse: toOpenApiSchema(privacyDeleteResponseSchema),
  RefreshRequest: toOpenApiSchema(refreshRequestSchema),
  RefreshResponse: toOpenApiSchema(refreshResponseSchema),
  SessionListResponse: toOpenApiSchema(sessionListResponseSchema),
  TaskEnqueuedResponse: toOpenApiSchema(taskEnqueuedResponseSchema),
  TaskRequest: toOpenApiSchema(taskRequestSchema)
} satisfies Record<string, JsonSchema>;

const openApiPaths: Record<string, JsonSchema> = {
    "/api/v1/agents/search": {
      get: {
        responses: {
          "200": {
            description: "Agent marketplace search results"
          }
        },
        summary: "Search agent manifests",
        tags: ["agents"]
      }
    },
    "/api/v1/apikeys": {
      get: {
        operationId: "listApiKeys",
        responses: {
          "200": jsonResponse(
            "Lists tenant API keys available to the authenticated administrator.",
            "ApiKeyListResponse"
          ),
          "401": problemResponse("A valid authenticated session is required."),
          "403": problemResponse("Administrator role is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "List tenant API keys",
        tags: ["apikeys"]
      },
      post: {
        operationId: "createApiKey",
        requestBody: jsonRequestBody(
          "ApiKeyCreateRequest",
          "Label and scopes for the tenant API key."
        ),
        responses: {
          "201": jsonResponse("Creates and returns a new tenant API key.", "ApiKeyCreateResponse"),
          "400": problemResponse("Request payload is invalid."),
          "401": problemResponse("A valid authenticated session is required."),
          "403": problemResponse("Administrator role is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Create a tenant API key",
        tags: ["apikeys"]
      }
    },
    "/api/v1/apikeys/{id}": {
      delete: {
        operationId: "revokeApiKey",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              minLength: 1,
              type: "string"
            }
          }
        ],
        responses: {
          "200": jsonResponse("Revokes the selected tenant API key.", "ApiKeyRevocationResponse"),
          "400": problemResponse("A valid API key id is required."),
          "401": problemResponse("A valid authenticated session is required."),
          "403": problemResponse("Administrator role is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Revoke a tenant API key",
        tags: ["apikeys"]
      }
    },
    "/api/v1/apikeys/{id}/rotate": {
      post: {
        operationId: "rotateApiKey",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              minLength: 1,
              type: "string"
            }
          }
        ],
        responses: {
          "200": jsonResponse("Rotates and returns a replacement tenant API key.", "ApiKeyCreateResponse"),
          "400": problemResponse("A valid API key id is required."),
          "401": problemResponse("A valid authenticated session is required."),
          "403": problemResponse("Administrator role is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Rotate a tenant API key",
        tags: ["apikeys"]
      }
    },
    "/api/v1/auth/introspect": {
      get: {
        operationId: "introspectApiKey",
        responses: {
          "200": jsonResponse(
            "Introspects the provided API key or bearer token. Returns inactive when no credential is present.",
            "AuthIntrospectionResponse"
          ),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Inspect API key activity",
        tags: ["auth"]
      }
    },
    "/api/v1/auth/login": {
      post: {
        operationId: "loginWithPassword",
        requestBody: jsonRequestBody("LoginRequest", "Credentials required to create a session."),
        responses: {
          "200": jsonResponse(
            "Authenticated session payload or MFA challenge envelope.",
            "LoginResponse"
          ),
          "400": problemResponse("Request payload is invalid."),
          "401": problemResponse("Credentials or tenant reference are invalid."),
          "429": problemResponse("Login rate limit exceeded."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Authenticate with email and password",
        tags: ["auth"]
      }
    },
    "/api/v1/auth/logout": {
      post: {
        operationId: "logoutCurrentSession",
        responses: {
          "200": jsonResponse("Revokes the current authenticated session.", "LogoutResponse"),
          "401": problemResponse("A valid authenticated session is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Logout the current session",
        tags: ["auth"]
      }
    },
    "/api/v1/auth/mfa/challenge": {
      post: {
        operationId: "verifyMfaChallenge",
        requestBody: jsonRequestBody(
          "MfaVerifyRequest",
          "Challenge token plus either a TOTP code or a recovery code."
        ),
        responses: {
          "200": jsonResponse("Authenticated session payload after MFA verification.", "LoginResponse"),
          "400": problemResponse("Request payload is invalid."),
          "401": problemResponse("MFA challenge is invalid or expired."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Complete MFA challenge",
        tags: ["auth"]
      }
    },
    "/api/v1/auth/mfa/enable": {
      post: {
        operationId: "enableMfa",
        requestBody: jsonRequestBody("EnableMfaRequest", "TOTP code used to enable MFA."),
        responses: {
          "200": jsonResponse("Confirms MFA was enabled for the authenticated user.", "EnableMfaResponse"),
          "400": problemResponse("The provided TOTP code is invalid."),
          "401": problemResponse("A valid authenticated session is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Enable MFA for the authenticated user",
        tags: ["auth"]
      }
    },
    "/api/v1/auth/mfa/setup": {
      post: {
        operationId: "setupMfa",
        responses: {
          "200": jsonResponse("Returns the MFA enrollment payload for the authenticated user.", "MfaSetupResponse"),
          "401": problemResponse("A valid authenticated session is required."),
          "404": problemResponse("User not found for MFA setup."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Create MFA enrollment data",
        tags: ["auth"]
      }
    },
    "/api/v1/auth/refresh": {
      post: {
        operationId: "refreshSession",
        requestBody: jsonRequestBody("RefreshRequest", "Refresh token used to renew the session."),
        responses: {
          "200": jsonResponse("Returns a renewed session payload.", "RefreshResponse"),
          "400": problemResponse("Request payload is invalid."),
          "401": problemResponse("Refresh token is invalid or expired."),
          "409": problemResponse("Refresh token reuse was detected."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Refresh an authenticated session",
        tags: ["auth"]
      }
    },
    "/api/v1/budgets/usage": {
      get: {
        responses: {
          "200": {
            description: "Budget usage snapshot"
          }
        },
        summary: "Get budget usage",
        tags: ["budgets"]
      }
    },
    "/api/v1/invites": {
      get: {
        operationId: "listInvites",
        responses: {
          "200": jsonResponse(
            "Lists invites visible to the authenticated administrator.",
            "InviteListResponse"
          ),
          "400": problemResponse("Active tenant context is required."),
          "401": problemResponse("A valid authenticated session is required."),
          "403": problemResponse("Administrator role is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "List organization invites",
        tags: ["invites"]
      },
      post: {
        operationId: "createInvite",
        requestBody: jsonRequestBody(
          "CreateInviteRequest",
          "Invite payload used to create a pending organization invite."
        ),
        responses: {
          "201": jsonResponse("Creates and returns a pending invite.", "InviteResponse"),
          "400": problemResponse("Request payload or tenant context is invalid."),
          "401": problemResponse("Authenticated organization context is required."),
          "403": problemResponse("Administrator role is required."),
          "404": problemResponse("Organization was not found for the active tenant."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Create an organization invite",
        tags: ["invites"]
      }
    },
    "/api/v1/invites/accept": {
      post: {
        operationId: "acceptInvite",
        requestBody: jsonRequestBody(
          "AcceptInviteRequest",
          "Invite token payload used to accept a pending invite."
        ),
        responses: {
          "200": jsonResponse(
            "Accepts the invite and returns the resulting membership reference.",
            "InviteAcceptanceResponse"
          ),
          "400": problemResponse("Request payload is invalid."),
          "404": problemResponse("Invite token is invalid or inactive."),
          "410": problemResponse("Invite token has expired."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Accept an organization invite",
        tags: ["invites"]
      }
    },
    "/api/v1/invites/{id}/revoke": {
      post: {
        operationId: "revokeInvite",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              minLength: 1,
              type: "string"
            }
          }
        ],
        responses: {
          "200": jsonResponse("Revokes the selected invite.", "InviteResponse"),
          "400": problemResponse("Active tenant context or invite id is invalid."),
          "401": problemResponse("A valid authenticated session is required."),
          "403": problemResponse("Administrator role is required."),
          "404": problemResponse("Invite was not found for the active tenant."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Revoke an organization invite",
        tags: ["invites"]
      }
    },
    "/api/v1/me": {
      get: {
        operationId: "getCurrentProfile",
        responses: {
          "200": jsonResponse(
            "Returns the authenticated profile and its billing snapshot.",
            "ProfileResponse"
          ),
          "401": problemResponse("A valid tenant-scoped authenticated session is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Get the authenticated profile",
        tags: ["profile"]
      }
    },
    "/api/v1/notifications": {
      get: {
        operationId: "listNotifications",
        parameters: [
          {
            in: "query",
            name: "cursor",
            required: false,
            schema: {
              minLength: 1,
              type: "string"
            }
          },
          {
            in: "query",
            name: "limit",
            required: false,
            schema: {
              default: 10,
              maximum: 50,
              minimum: 1,
              type: "integer"
            }
          }
        ],
        responses: {
          "200": jsonResponse(
            "Lists notifications for the authenticated user.",
            "NotificationFeedResponse"
          ),
          "400": problemResponse("Query parameters are invalid."),
          "401": problemResponse("Authenticated tenant and user context are required."),
          "404": problemResponse("Organization not found for the active tenant context."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "List user notifications",
        tags: ["notifications"]
      }
    },
    "/api/v1/notifications/{id}/read": {
      patch: {
        operationId: "markNotificationRead",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              minLength: 1,
              type: "string"
            }
          }
        ],
        responses: {
          "200": jsonResponse(
            "Marks a single notification as read and returns the affected count.",
            "NotificationReadResponse"
          ),
          "401": problemResponse("Authenticated tenant and user context are required."),
          "404": problemResponse("Organization not found for the active tenant context."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Mark one notification as read",
        tags: ["notifications"]
      }
    },
    "/api/v1/notifications/preferences": {
      get: {
        operationId: "getNotificationPreferences",
        responses: {
          "200": jsonResponse(
            "Returns notification preferences for the authenticated user.",
            "NotificationPreferencesResponse"
          ),
          "401": problemResponse("Authenticated tenant and user context are required."),
          "404": problemResponse("Organization not found for the active tenant context."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Get notification preferences",
        tags: ["notifications"]
      },
      put: {
        operationId: "updateNotificationPreferences",
        requestBody: jsonRequestBody(
          "NotificationPreferencesRequest",
          "Partial notification preference payload."
        ),
        responses: {
          "200": jsonResponse(
            "Persists notification preferences for the authenticated user.",
            "NotificationPreferencesResponse"
          ),
          "400": problemResponse("Request payload is invalid."),
          "401": problemResponse("Authenticated tenant and user context are required."),
          "404": problemResponse("Organization not found for the active tenant context."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Update notification preferences",
        tags: ["notifications"]
      }
    },
    "/api/v1/notifications/read-all": {
      patch: {
        operationId: "markAllNotificationsRead",
        responses: {
          "200": jsonResponse(
            "Marks all notifications as read and returns the affected count.",
            "NotificationReadResponse"
          ),
          "401": problemResponse("Authenticated tenant and user context are required."),
          "404": problemResponse("Organization not found for the active tenant context."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Mark all notifications as read",
        tags: ["notifications"]
      }
    },
    "/api/v1/organizations": {
      post: {
        operationId: "createOrganization",
        requestBody: jsonRequestBody(
          "CreateOrganizationRequest",
          "Provisioning payload for a new organization and its owner account."
        ),
        responses: {
          "201": jsonResponse(
            "Creates a new organization and returns its owner bootstrap payload.",
            "CreateOrganizationResponse"
          ),
          "400": problemResponse("Request payload is invalid."),
          "409": problemResponse("The requested organization slug is already in use."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Create an organization",
        tags: ["organizations"]
      }
    },
    "/api/v1/outputs": {
      get: {
        responses: {
          "200": {
            description: "List outputs"
          }
        },
        summary: "List outputs",
        tags: ["outputs"]
      }
    },
    "/api/v1/privacy/delete-account": {
      post: {
        operationId: "deleteAccountAndPersonalData",
        requestBody: jsonRequestBody(
          "PrivacyDeleteRequest",
          "Confirmation payload required to delete the authenticated account."
        ),
        responses: {
          "200": jsonResponse(
            "Deletes the authenticated account and returns the anonymization outcome.",
            "PrivacyDeleteResponse"
          ),
          "400": problemResponse("Request payload or confirmation text is invalid."),
          "401": problemResponse("A valid authenticated session is required."),
          "404": problemResponse("Organization or user was not found for privacy deletion."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Delete the authenticated account",
        tags: ["privacy"]
      }
    },
    "/api/v1/sessions": {
      get: {
        operationId: "listSessions",
        responses: {
          "200": jsonResponse("Lists active sessions for the authenticated user.", "SessionListResponse"),
          "401": problemResponse("A valid authenticated session is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "List active sessions",
        tags: ["sessions"]
      }
    },
    "/api/v1/sessions/{sessionId}": {
      delete: {
        operationId: "revokeSessionById",
        parameters: [
          {
            in: "path",
            name: "sessionId",
            required: true,
            schema: {
              minLength: 1,
              type: "string"
            }
          }
        ],
        responses: {
          "200": jsonResponse("Revokes a specific session for the authenticated user.", "LogoutResponse"),
          "400": problemResponse("A valid session id is required."),
          "401": problemResponse("A valid authenticated session is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Revoke a specific session",
        tags: ["sessions"]
      }
    },
    "/api/v1/sessions/logout-all": {
      post: {
        operationId: "logoutAllSessions",
        responses: {
          "200": jsonResponse("Revokes all sessions for the authenticated user.", "LogoutResponse"),
          "401": problemResponse("A valid authenticated session is required."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Logout every active session",
        tags: ["sessions"]
      }
    },
    "/api/v1/tasks": {
      post: {
        operationId: "enqueueTask",
        requestBody: jsonRequestBody("TaskRequest", "Task submission payload for asynchronous processing."),
        responses: {
          "202": jsonResponse("Task accepted and queued for worker processing.", "TaskEnqueuedResponse"),
          "400": problemResponse("Request payload is invalid."),
          "401": problemResponse("A valid authenticated session is required."),
          "402": problemResponse("The task was rejected because budget usage is exhausted."),
          "429": problemResponse("The tenant exceeded the queue rate limit."),
          "503": problemResponse("Queue backpressure prevents accepting new work."),
          "500": problemResponse("Unexpected internal server error.")
        },
        summary: "Submit an operational task",
        tags: ["tasks"]
      }
    }
  };

export const openApiDocument: OpenApiDocument = {
  components: {
    schemas: componentSchemas
  },
  info: {
    description:
      "Mounted business API baseline for the canonical BirthHub360 runtime. Operational, parked and compatibility-only surfaces are intentionally excluded.",
    title: "BirthHub360 API",
    version: "1.4.0"
  },
  jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
  openapi: "3.1.0",
  paths: openApiPaths,
  servers: [
    {
      url: "http://localhost:3000"
    }
  ]
};
