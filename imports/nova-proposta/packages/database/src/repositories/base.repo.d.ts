type TenantScopedWhere = {
    tenantId?: string;
} & Record<string, unknown>;
type TenantScopedData = {
    tenantId?: string;
} & Record<string, unknown>;
type FindArgs<TWhere extends TenantScopedWhere> = {
    where?: Omit<TWhere, "tenantId">;
} & Record<string, unknown>;
type MutationArgs<TWhere extends TenantScopedWhere, TData extends TenantScopedData> = {
    data: Omit<TData, "tenantId">;
    where?: Omit<TWhere, "tenantId">;
} & Record<string, unknown>;
type TenantScopedDelegate<TWhere extends TenantScopedWhere, TData extends TenantScopedData, TResult> = {
    create(args: {
        data: TData;
    } & Record<string, unknown>): Promise<TResult>;
    deleteMany(args: {
        where: TWhere;
    } & Record<string, unknown>): Promise<{
        count: number;
    }>;
    findFirst(args: {
        where?: TWhere;
    } & Record<string, unknown>): Promise<TResult | null>;
    findMany(args: {
        where?: TWhere;
    } & Record<string, unknown>): Promise<TResult[]>;
    updateMany(args: {
        data: Partial<TData>;
        where: TWhere;
    } & Record<string, unknown>): Promise<{
        count: number;
    }>;
};
export declare class BaseRepository<TWhere extends TenantScopedWhere, TData extends TenantScopedData, TResult> {
    private readonly delegate;
    constructor(delegate: TenantScopedDelegate<TWhere, TData, TResult>);
    create(args: MutationArgs<TWhere, TData>): Promise<TResult>;
    delete(args: FindArgs<TWhere>): Promise<TResult>;
    findFirst(args?: FindArgs<TWhere>): Promise<TResult | null>;
    findMany(args?: FindArgs<TWhere>): Promise<TResult[]>;
    update(args: MutationArgs<TWhere, TData>): Promise<TResult>;
}
export {};
