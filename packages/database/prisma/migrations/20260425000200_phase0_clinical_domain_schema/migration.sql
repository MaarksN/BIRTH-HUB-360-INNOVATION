-- Phase 0: publish the clinical domain tables already expected by the API runtime.
-- All clinical tables are tenant-scoped and receive RLS immediately so the
-- maternal-domain isolation suite can run as a real gate instead of a skip.

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PregnancyRiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "PregnancyStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PregnancyOutcome" AS ENUM ('LIVE_BIRTH', 'STILLBIRTH');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('PRENATAL', 'ULTRASOUND');

-- CreateEnum
CREATE TYPE "ClinicalNoteKind" AS ENUM ('SOAP', 'EVOLUTION');

-- CreateEnum
CREATE TYPE "NeonatalOutcome" AS ENUM ('ALIVE', 'ICU', 'STILLBIRTH', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "NeonatalSex" AS ENUM ('FEMALE', 'MALE', 'UNDETERMINED');

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "preferredName" TEXT,
    "birthDate" TIMESTAMP(3),
    "documentId" TEXT,
    "medicalRecordNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chronicConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregnancy_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "abortions" INTEGER NOT NULL DEFAULT 0,
    "complications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimatedDeliveryDate" TIMESTAMP(3),
    "fetalCount" INTEGER NOT NULL DEFAULT 1,
    "gravidity" INTEGER NOT NULL DEFAULT 0,
    "lastMenstrualPeriod" TIMESTAMP(3),
    "notes" TEXT,
    "outcome" "PregnancyOutcome",
    "outcomeDate" TIMESTAMP(3),
    "parity" INTEGER NOT NULL DEFAULT 0,
    "previousCesareans" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "PregnancyRiskLevel" NOT NULL DEFAULT 'MODERATE',
    "status" "PregnancyStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pregnancy_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pregnancyRecordId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "type" "AppointmentType" NOT NULL DEFAULT 'PRENATAL',
    "providerName" TEXT,
    "location" TEXT,
    "chiefComplaint" TEXT,
    "summary" TEXT,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "fetalHeartRateBpm" INTEGER,
    "fetalWeightGrams" INTEGER,
    "fundalHeightCm" DOUBLE PRECISION,
    "temperatureC" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "pregnancyRecordId" TEXT,
    "authoredByUserId" TEXT,
    "noteGroupId" TEXT NOT NULL,
    "previousVersionId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "kind" "ClinicalNoteKind" NOT NULL DEFAULT 'SOAP',
    "title" TEXT,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "content" JSONB,
    "supersededAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neonatal_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pregnancyRecordId" TEXT,
    "bornAt" TIMESTAMP(3) NOT NULL,
    "newbornName" TEXT,
    "outcome" "NeonatalOutcome" NOT NULL DEFAULT 'ALIVE',
    "sex" "NeonatalSex",
    "birthWeightGrams" INTEGER,
    "birthLengthCm" DOUBLE PRECISION,
    "headCircumferenceCm" DOUBLE PRECISION,
    "apgar1" INTEGER,
    "apgar5" INTEGER,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "neonatal_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patients_tenantId_idx" ON "patients"("tenantId");

-- CreateIndex
CREATE INDEX "patients_tenantId_id_idx" ON "patients"("tenantId", "id");

-- CreateIndex
CREATE INDEX "patients_organizationId_idx" ON "patients"("organizationId");

-- CreateIndex
CREATE INDEX "patients_tenantId_organizationId_idx" ON "patients"("tenantId", "organizationId");

-- CreateIndex
CREATE INDEX "patients_tenantId_status_idx" ON "patients"("tenantId", "status");

-- CreateIndex
CREATE INDEX "patients_tenantId_fullName_idx" ON "patients"("tenantId", "fullName");

-- CreateIndex
CREATE INDEX "patients_deletedAt_idx" ON "patients"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "patients_tenantId_medicalRecordNumber_key" ON "patients"("tenantId", "medicalRecordNumber");

-- CreateIndex
CREATE INDEX "pregnancy_records_tenantId_idx" ON "pregnancy_records"("tenantId");

-- CreateIndex
CREATE INDEX "pregnancy_records_tenantId_id_idx" ON "pregnancy_records"("tenantId", "id");

-- CreateIndex
CREATE INDEX "pregnancy_records_organizationId_idx" ON "pregnancy_records"("organizationId");

-- CreateIndex
CREATE INDEX "pregnancy_records_patientId_idx" ON "pregnancy_records"("patientId");

-- CreateIndex
CREATE INDEX "pregnancy_records_tenantId_patientId_status_idx" ON "pregnancy_records"("tenantId", "patientId", "status");

-- CreateIndex
CREATE INDEX "pregnancy_records_tenantId_organizationId_status_idx" ON "pregnancy_records"("tenantId", "organizationId", "status");

-- CreateIndex
CREATE INDEX "pregnancy_records_estimatedDeliveryDate_idx" ON "pregnancy_records"("estimatedDeliveryDate");

-- CreateIndex
CREATE INDEX "pregnancy_records_deletedAt_idx" ON "pregnancy_records"("deletedAt");

-- CreateIndex
CREATE INDEX "appointments_tenantId_idx" ON "appointments"("tenantId");

-- CreateIndex
CREATE INDEX "appointments_tenantId_id_idx" ON "appointments"("tenantId", "id");

-- CreateIndex
CREATE INDEX "appointments_organizationId_idx" ON "appointments"("organizationId");

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");

-- CreateIndex
CREATE INDEX "appointments_pregnancyRecordId_idx" ON "appointments"("pregnancyRecordId");

-- CreateIndex
CREATE INDEX "appointments_tenantId_organizationId_scheduledAt_idx" ON "appointments"("tenantId", "organizationId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_tenantId_patientId_scheduledAt_idx" ON "appointments"("tenantId", "patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_tenantId_status_idx" ON "appointments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_deletedAt_idx" ON "appointments"("deletedAt");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_idx" ON "clinical_notes"("tenantId");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_id_idx" ON "clinical_notes"("tenantId", "id");

-- CreateIndex
CREATE INDEX "clinical_notes_organizationId_idx" ON "clinical_notes"("organizationId");

-- CreateIndex
CREATE INDEX "clinical_notes_patientId_idx" ON "clinical_notes"("patientId");

-- CreateIndex
CREATE INDEX "clinical_notes_appointmentId_idx" ON "clinical_notes"("appointmentId");

-- CreateIndex
CREATE INDEX "clinical_notes_pregnancyRecordId_idx" ON "clinical_notes"("pregnancyRecordId");

-- CreateIndex
CREATE INDEX "clinical_notes_authoredByUserId_idx" ON "clinical_notes"("authoredByUserId");

-- CreateIndex
CREATE INDEX "clinical_notes_previousVersionId_idx" ON "clinical_notes"("previousVersionId");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_noteGroupId_version_idx" ON "clinical_notes"("tenantId", "noteGroupId", "version");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_patientId_isLatest_idx" ON "clinical_notes"("tenantId", "patientId", "isLatest");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_organizationId_updatedAt_idx" ON "clinical_notes"("tenantId", "organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "clinical_notes_deletedAt_idx" ON "clinical_notes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_notes_tenantId_noteGroupId_version_key" ON "clinical_notes"("tenantId", "noteGroupId", "version");

-- CreateIndex
CREATE INDEX "neonatal_records_tenantId_idx" ON "neonatal_records"("tenantId");

-- CreateIndex
CREATE INDEX "neonatal_records_tenantId_id_idx" ON "neonatal_records"("tenantId", "id");

-- CreateIndex
CREATE INDEX "neonatal_records_organizationId_idx" ON "neonatal_records"("organizationId");

-- CreateIndex
CREATE INDEX "neonatal_records_patientId_idx" ON "neonatal_records"("patientId");

-- CreateIndex
CREATE INDEX "neonatal_records_pregnancyRecordId_idx" ON "neonatal_records"("pregnancyRecordId");

-- CreateIndex
CREATE INDEX "neonatal_records_tenantId_patientId_bornAt_idx" ON "neonatal_records"("tenantId", "patientId", "bornAt");

-- CreateIndex
CREATE INDEX "neonatal_records_tenantId_organizationId_bornAt_idx" ON "neonatal_records"("tenantId", "organizationId", "bornAt");

-- CreateIndex
CREATE INDEX "neonatal_records_bornAt_idx" ON "neonatal_records"("bornAt");

-- CreateIndex
CREATE INDEX "neonatal_records_deletedAt_idx" ON "neonatal_records"("deletedAt");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy_records" ADD CONSTRAINT "pregnancy_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy_records" ADD CONSTRAINT "pregnancy_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pregnancyRecordId_fkey" FOREIGN KEY ("pregnancyRecordId") REFERENCES "pregnancy_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_pregnancyRecordId_fkey" FOREIGN KEY ("pregnancyRecordId") REFERENCES "pregnancy_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_authoredByUserId_fkey" FOREIGN KEY ("authoredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "clinical_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neonatal_records" ADD CONSTRAINT "neonatal_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neonatal_records" ADD CONSTRAINT "neonatal_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neonatal_records" ADD CONSTRAINT "neonatal_records_pregnancyRecordId_fkey" FOREIGN KEY ("pregnancyRecordId") REFERENCES "pregnancy_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "patients" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_patients ON "patients"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "pregnancy_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pregnancy_records" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_pregnancy_records ON "pregnancy_records"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_appointments ON "appointments"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "clinical_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical_notes" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_clinical_notes ON "clinical_notes"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "neonatal_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "neonatal_records" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_neonatal_records ON "neonatal_records"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));
