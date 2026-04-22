import { ClinicalWorkspaceDisabledState } from "../../../../components/dashboard/ClinicalWorkspaceDisabledState";
import { getProductCapabilities } from "../../../../lib/product-capabilities";

export default async function PatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const capabilities = getProductCapabilities();

  if (!capabilities.clinicalWorkspaceEnabled) {
    return <ClinicalWorkspaceDisabledState />;
  }

  const { default: PatientDetailPageClient } = await import("./page.client");
  return <PatientDetailPageClient {...props} />;
}
