DO $$
BEGIN
  IF to_regclass('public.workflow_revisions') IS NOT NULL THEN
    ALTER TABLE "workflow_revisions" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "workflow_revisions" FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_policy_workflow_revisions ON "workflow_revisions";
    CREATE POLICY tenant_isolation_policy_workflow_revisions ON "workflow_revisions"
      FOR ALL
      USING (tenant_access_allowed("tenantId"))
      WITH CHECK (tenant_access_allowed("tenantId"));
  END IF;
END
$$;
