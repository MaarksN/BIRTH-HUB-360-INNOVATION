import { ClinicalWorkspaceDisabledState } from "../../../components/dashboard/ClinicalWorkspaceDisabledState";
import { getProductCapabilities } from "../../../lib/product-capabilities";

export default async function PatientsPage() {
  const capabilities = getProductCapabilities();

  if (!capabilities.clinicalWorkspaceEnabled) {
    return <ClinicalWorkspaceDisabledState />;
  }

  const { default: PatientsPageClient } = await import("./page.client");
  return <PatientsPageClient />;
}
