import { Prisma, Role, type Notification, type NotificationType, type PrismaClient } from "@prisma/client";
type JsonObject = Prisma.InputJsonValue | undefined;
type CookieConsentStatus = "ACCEPTED" | "PENDING" | "REJECTED";
type SupportedLocalePreference = "en-US" | "pt-BR";
export type EngagementPrismaClient = {
    userPreference: Pick<PrismaClient['userPreference'], 'upsert' | 'findUnique'>;
    auditLog: Pick<PrismaClient['auditLog'], 'create'>;
    notification: Pick<PrismaClient['notification'], 'create' | 'createMany' | 'findMany' | 'count' | 'updateMany'>;
    membership: Pick<PrismaClient['membership'], 'findMany'>;
};
export type EngagementRepositoryOptions = {
    client?: EngagementPrismaClient;
};
type UserPreferenceInput = {
    cookieConsent?: CookieConsentStatus;
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
    lgpdConsentedAt?: Date | null;
    lgpdConsentStatus?: CookieConsentStatus;
    lgpdConsentVersion?: string;
    lgpdLegalBasis?: "CONSENT" | "CONTRACT" | "HEALTH_PROTECTION" | "LEGAL_OBLIGATION" | "LEGITIMATE_INTEREST";
    locale?: SupportedLocalePreference;
    marketingEmails?: boolean;
    organizationId: string;
    pushNotifications?: boolean;
    tenantId: string;
    userId: string;
};
export declare function ensureUserPreference(input: {
    organizationId: string;
    tenantId: string;
    userId: string;
}, options?: EngagementRepositoryOptions): Promise<{
    tenantId: string;
    id: string;
    userId: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    locale: string;
    inAppNotifications: boolean;
    emailNotifications: boolean;
    marketingEmails: boolean;
    pushNotifications: boolean;
    cookieConsent: import("@prisma/client").$Enums.CookieConsentStatus;
}>;
export declare function updateUserPreference(input: UserPreferenceInput, options?: EngagementRepositoryOptions): Promise<{
    tenantId: string;
    id: string;
    userId: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    locale: string;
    inAppNotifications: boolean;
    emailNotifications: boolean;
    marketingEmails: boolean;
    pushNotifications: boolean;
    cookieConsent: import("@prisma/client").$Enums.CookieConsentStatus;
}>;
export declare function createNotificationForUser(input: {
    content: string;
    link?: string | null;
    metadata?: JsonObject;
    organizationId: string;
    tenantId: string;
    type: NotificationType;
    userId: string;
}, options?: EngagementRepositoryOptions): Promise<Notification | null>;
export declare function createNotificationForOrganizationRoles(input: {
    content: string;
    link?: string | null;
    metadata?: JsonObject;
    organizationId: string;
    roles?: Role[];
    tenantId: string;
    type: NotificationType;
}, options?: EngagementRepositoryOptions): Promise<{
    count: number;
}>;
export declare function listNotifications(input: {
    cursor?: string;
    limit?: number;
    tenantId: string;
    userId: string;
}, options?: EngagementRepositoryOptions): Promise<{
    items: {
        type: import("@prisma/client").$Enums.NotificationType;
        metadata: Prisma.JsonValue | null;
        tenantId: string;
        link: string | null;
        id: string;
        userId: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        isRead: boolean;
        readAt: Date | null;
    }[];
    nextCursor: string;
    unreadCount: number;
}>;
export declare function markNotificationAsRead(input: {
    id: string;
    tenantId: string;
    userId: string;
}, options?: EngagementRepositoryOptions): Promise<{
    updated: number;
}>;
export declare function markAllNotificationsAsRead(input: {
    tenantId: string;
    userId: string;
}, options?: EngagementRepositoryOptions): Promise<Prisma.BatchPayload>;
export {};
