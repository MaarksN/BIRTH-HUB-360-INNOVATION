import { Role, type Membership } from "@prisma/client";
export declare function hasRequiredRole(currentRole: Role, requiredRole: Role): boolean;
export declare function findMembershipForTenant(organizationId: string, userId: string): Promise<Membership | null>;
export declare function requireMembershipForTenant(organizationId: string, userId: string): Promise<Membership>;
export declare function buildTenantMembershipFilter(organizationId: string, userId: string): {
    memberships: {
        some: {
            organizationId: string;
            userId: string;
        };
    };
};
