import { ClinicalWorkspaceDisabledState } from "../../../components/dashboard/ClinicalWorkspaceDisabledState";
import { getProductCapabilities } from "../../../lib/product-capabilities";

export default async function AppointmentsPage() {
  const capabilities = getProductCapabilities();

  if (!capabilities.clinicalWorkspaceEnabled) {
    return <ClinicalWorkspaceDisabledState />;
  }

  const { default: AppointmentsPageClient } = await import("./page.client");
  return <AppointmentsPageClient />;
}

