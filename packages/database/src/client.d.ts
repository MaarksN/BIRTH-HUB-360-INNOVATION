import { type RuntimeEnvironment } from "@birthub/config";
import { Prisma, PrismaClient } from "@prisma/client";
export { Prisma, PrismaClient } from "@prisma/client";
type DatabaseBootstrapLogger = {
    warn: (payload: Record<string, unknown>, message: string) => void;
};
export interface CreatePrismaClientOptions {
    databaseUrl?: string;
    env?: RuntimeEnvironment;
    logger?: DatabaseBootstrapLogger;
}
export declare function resolveQueryTimeoutMs(env?: RuntimeEnvironment): number;
export declare function raceWithTimeout<T>(promise: Promise<T>, operation: string, model?: string, env?: RuntimeEnvironment): Promise<T>;
export declare function resolveConnectionLimit(databaseUrl: string, env?: RuntimeEnvironment): number;
export declare function resolveRuntimeDatabaseUrl(rawUrl: string | undefined, env?: RuntimeEnvironment): string;
export declare function createPrismaClient(options?: CreatePrismaClientOptions): PrismaClient;
export declare function normalizeDatabaseUrl(rawUrl: string | undefined, env?: RuntimeEnvironment): string | undefined;
export declare function getPrismaClient(): PrismaClient;
export declare function resetPrismaClientForTests(): Promise<void>;
export declare const prisma: PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function withTenantDatabaseContext<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>, client?: PrismaClient): Promise<T>;
export declare function pingDatabase(client?: Pick<PrismaClient, "$queryRaw">): Promise<{
    status: "up" | "down";
    message?: string;
}>;
export declare function pingDatabaseDeep(client?: Pick<PrismaClient, "$queryRaw">): Promise<{
    status: "up" | "down";
    message?: string;
}>;
