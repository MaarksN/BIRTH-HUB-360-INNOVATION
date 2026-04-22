import { ClinicalWorkspaceDisabledState } from "../../../../../components/dashboard/ClinicalWorkspaceDisabledState";
import { getProductCapabilities } from "../../../../../lib/product-capabilities";

export default async function PatientAppointmentsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const capabilities = getProductCapabilities();

  if (!capabilities.clinicalWorkspaceEnabled) {
    return <ClinicalWorkspaceDisabledState />;
  }

  const { default: PatientAppointmentsPageClient } = await import("./page.client");
  return <PatientAppointmentsPageClient {...props} />;
}

