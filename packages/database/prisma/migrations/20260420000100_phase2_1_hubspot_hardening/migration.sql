ALTER TABLE "crm_sync_events"
  ADD COLUMN IF NOT EXISTS "external_event_id" TEXT;

CREATE INDEX IF NOT EXISTS "crm_sync_events_tenantId_provider_direction_external_event_id_idx"
  ON "crm_sync_events"("tenantId", "provider", "direction", "external_event_id");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_sync_events_inbound_external_event_id_key"
  ON "crm_sync_events"("tenantId", "provider", "external_event_id")
  WHERE "direction" = 'inbound' AND "external_event_id" IS NOT NULL;
