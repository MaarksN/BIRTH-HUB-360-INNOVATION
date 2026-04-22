export type MigrationSeverity = "P0" | "P1" | "P2";
export type QueryBudgetCategory = "migration" | "oltp" | "report";
export declare const F8_CONFIG: {
    readonly advisoryLockId: 3608;
    readonly backupPolicy: {
        readonly drillCadenceMonths: 6;
        readonly maxBackupAgeMinutes: number;
        readonly requiredWalArchiveLagMinutes: 5;
        readonly rpoMinutes: 5;
    };
    readonly defaultApproverRoles: readonly ["DBA", "DB_LEAD"];
    readonly expectedMigrationEnvironments: readonly ["dev", "staging", "prod"];
    readonly highWriteTables: readonly ["agent_budget_events", "audit_logs", "billing_events", "crm_sync_events", "webhook_deliveries"];
    readonly migrationChecklist: {
        readonly post: readonly ["drift_check", "fk_index_audit", "integrity_health_check", "migration_state_report", "release_smoke", "rls_audit"];
        readonly pre: readonly ["backup_confirmed", "maintenance_window", "rollback_validated", "stakeholder_notice"];
    };
    readonly queryTimeoutsMs: {
        readonly migration: number;
        readonly oltp: 1000;
        readonly report: 30000;
    };
    readonly serviceConnectionLimits: {
        readonly api: 15;
        readonly web: 5;
        readonly worker: 8;
    };
};
export declare function isApproverRole(value: string): boolean;
export declare function resolveDefaultQueryTimeout(category: QueryBudgetCategory): number;
//# sourceMappingURL=f8.config.d.ts.map