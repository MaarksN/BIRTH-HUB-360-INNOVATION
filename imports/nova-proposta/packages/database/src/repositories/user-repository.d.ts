import { Role, UserStatus } from "@prisma/client";
export interface TenantUserFilters {
    role?: Role;
    search?: string;
    status?: UserStatus;
}
export declare function listUsersByTenant(organizationId: string, filters?: TenantUserFilters): Promise<({
    memberships: {
        tenantId: string;
        id: string;
        userId: string;
        organizationId: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.MembershipStatus;
        createdAt: Date;
        updatedAt: Date;
    }[];
} & {
    email: string;
    id: string;
    name: string;
    status: import("@prisma/client").$Enums.UserStatus;
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
    suspendedAt: Date | null;
    mfaEnabled: boolean;
    mfaSecret: string | null;
})[]>;
export declare function updateMembershipRole(organizationId: string, userId: string, role: Role): Promise<{
    tenantId: string;
    id: string;
    userId: string;
    organizationId: string;
    role: import("@prisma/client").$Enums.Role;
    status: import("@prisma/client").$Enums.MembershipStatus;
    createdAt: Date;
    updatedAt: Date;
}>;
