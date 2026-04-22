CREATE TYPE "LgpdConsentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "LgpdLegalBasis" AS ENUM (
  'CONSENT',
  'HEALTH_PROTECTION',
  'LEGITIMATE_INTEREST',
  'LEGAL_OBLIGATION',
  'CONTRACT'
);

ALTER TABLE "user_preferences"
  ADD COLUMN "lgpd_consent_status" "LgpdConsentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "lgpd_legal_basis" "LgpdLegalBasis" NOT NULL DEFAULT 'CONSENT',
  ADD COLUMN "lgpd_consent_version" TEXT NOT NULL DEFAULT '2026-04',
  ADD COLUMN "lgpd_consented_at" TIMESTAMP(3);

CREATE INDEX "user_preferences_tenantId_lgpd_consent_status_idx"
  ON "user_preferences"("tenantId", "lgpd_consent_status");
