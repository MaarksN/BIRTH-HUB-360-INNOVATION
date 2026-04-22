"use client";

import { useMemo } from "react";

import { getStoredSession } from "../../../../lib/auth-client";

import { DELETE_CONFIRMATION } from "./privacy-settings-page.data";
import { usePrivacySettingsModel } from "./privacy-settings-page.model";
import {
  PrivacyConsentSection,
  PrivacyDeletionSection,
  PrivacyExportSection,
  PrivacyPageHeader,
  PrivacyRetentionSection
} from "./privacy-settings-page.sections";

export default function PrivacySettingsPageClient() {
  const session = useMemo(() => getStoredSession(), []);
  const model = usePrivacySettingsModel(session);

  return (
    <section style={{ display: "grid", gap: "1.25rem" }}>
      <PrivacyPageHeader />
      <PrivacyConsentSection
        consentHistory={model.consentHistory}
        consentPreferences={model.consentPreferences}
        consents={model.consents}
        isLoading={model.isLoading}
        isPending={model.isPending}
        onSave={model.saveConsentDecisions}
        onUpdateStatus={model.updateConsentStatus}
      />
      <PrivacyRetentionSection
        isLoading={model.isLoading}
        isPending={model.isPending}
        onRun={model.runRetention}
        onSave={model.saveRetentionSettings}
        onUpdatePolicy={model.updateRetentionPolicy}
        retentionAccessDenied={model.retentionAccessDenied}
        retentionExecutions={model.retentionExecutions}
        retentionPolicies={model.retentionPolicies}
        retentionRunItems={model.retentionRunItems}
      />
      <PrivacyExportSection isPending={model.isPending} onDownload={model.downloadExport} />
      <PrivacyDeletionSection
        confirmation={model.confirmation}
        deleteConfirmation={DELETE_CONFIRMATION}
        isPending={model.isPending}
        onChangeConfirmation={model.setConfirmation}
        onDelete={model.requestDeletion}
      />
      {session ? (
        <small style={{ color: "var(--muted)" }}>
          Usuario ativo: {session.userId} no tenant {session.tenantId}
        </small>
      ) : null}
      {model.error ? <p style={{ color: "#a11d2d", margin: 0 }}>{model.error}</p> : null}
      {model.notice ? <p style={{ color: "var(--accent-strong)", margin: 0 }}>{model.notice}</p> : null}
    </section>
  );
}
